// Inline storage utilities (content scripts can't use ES modules in MV3)
const storage = {
  async get(key) {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key];
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);
      const result = await chrome.storage.local.get(key);
      return result[key];
    }
  },
  async set(data) {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);
      await chrome.storage.local.set(data);
    }
  },
  async getTemplates() {
    const templates = await this.get('templates');
    return templates || [];
  },
  async getSettings() {
    const settings = await this.get('settings');
    return settings || { profile: {} };
  },
  async saveSettings(settings) {
    await this.set({ settings });
  }
};

// Date formatting utilities
const formatDate = (format = 'long') => {
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const formatMonth = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };
  const formatWeekday = (day) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const weekday = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  switch (format) {
    case 'long':
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
    case 'short':
      return `${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    case 'weekday_long':
      return `${formatWeekday(weekday)} ${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
    case 'long_time':
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    default:
      return `${formatMonth(month)} ${day}${getOrdinalSuffix(day)}, ${year}`;
  }
};

// Template processing
const processTemplate = async (templateBody, profile = {}) => {
  let processed = templateBody;
  
  // Replace date variables
  processed = processed.replace(/\{\{date:(\w+)\}\}/g, (match, format) => formatDate(format));
  processed = processed.replace(/\{\{date\}\}/g, () => formatDate('long'));
  
  // Replace standard profile variables
  processed = processed.replace(/\{\{first_name\}\}/g, profile.first_name || '{{first_name}}');
  processed = processed.replace(/\{\{last_name\}\}/g, profile.last_name || '{{last_name}}');
  processed = processed.replace(/\{\{email\}\}/g, profile.email || '{{email}}');
  
  // Replace custom variables
  if (profile.custom) {
    Object.keys(profile.custom).forEach(varName => {
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      processed = processed.replace(regex, profile.custom[varName] || `{{${varName}}}`);
    });
  }
  
  // Replace any other variables that might exist in profile (fallback)
  Object.keys(profile).forEach(key => {
    if (key !== 'custom' && !['first_name', 'last_name', 'email'].includes(key)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, profile[key] || `{{${key}}}`);
    }
  });
  
  return processed;
};

let templates = [];
let profile = {};

const loadTemplates = async () => {
  templates = await storage.getTemplates();
  const settings = await storage.getSettings();
  profile = settings.profile || {};
};

const saveProfile = async (newProfile) => {
  // Merge profile, preserving existing custom variables
  profile = { ...profile };
  if (newProfile.custom) {
    profile.custom = { ...(profile.custom || {}), ...newProfile.custom };
  }
  // Merge other fields
  Object.keys(newProfile).forEach(key => {
    if (key !== 'custom') {
      profile[key] = newProfile[key];
    }
  });
  
  const settings = await storage.getSettings();
  settings.profile = profile;
  await storage.saveSettings(settings);
};

const isTriggerBoundary = (text, triggerIndex) => {
  if (triggerIndex === 0) return true;
  const charBefore = text[triggerIndex - 1];
  return /\s|[.,!?;:]/.test(charBefore);
};

const findTrigger = (text, cursorPos) => {
  for (const template of templates) {
    const trigger = template.trigger;
    // Try multiple positions around cursor
    const searchPositions = [cursorPos, cursorPos - 1, cursorPos - 2];
    
    for (const searchPos of searchPositions) {
      if (searchPos < 0) continue;
      
      const index = text.lastIndexOf(trigger, searchPos);
      if (index !== -1 && isTriggerBoundary(text, index)) {
        const endIndex = index + trigger.length;
        // Check if trigger ends at or near cursor
        if (endIndex === cursorPos || endIndex === cursorPos - 1 || endIndex === cursorPos - 2) {
          return { template, startIndex: index, endIndex };
        }
      }
    }
  }
  return null;
};

const insertText = (element, text, isHTML = false) => {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    element.value = value.slice(0, start) + text + value.slice(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      if (isHTML) {
        try {
          document.execCommand('insertHTML', false, text);
        } catch (e) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
        }
      } else {
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

const showAutofillPanel = async (element, template, variables) => {
  return new Promise((resolve) => {
    const getVariableValue = (varName) => {
      // Check standard fields
      if (varName === 'first_name') return profile.first_name || '';
      if (varName === 'last_name') return profile.last_name || '';
      if (varName === 'email') return profile.email || '';
      // Check custom variables
      if (profile.custom && profile.custom[varName]) return profile.custom[varName];
      // Check other profile fields
      return profile[varName] || '';
    };
    
    const formatVariableName = (varName) => {
      return varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const panel = document.createElement('div');
    panel.className = 'magical-autofill-panel';
    panel.innerHTML = `
      <h4>Fill in missing information</h4>
      ${variables.map(v => `
        <input type="text" 
               id="magical-${v}" 
               placeholder="${formatVariableName(v)}"
               value="${getVariableValue(v)}">
      `).join('')}
      <button id="magical-submit">Insert</button>
      <button class="secondary" id="magical-cancel">Cancel</button>
    `;

    const rect = element.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 5}px`;
    panel.style.left = `${rect.left}px`;
    document.body.appendChild(panel);

    const submitBtn = panel.querySelector('#magical-submit');
    const cancelBtn = panel.querySelector('#magical-cancel');

    const cleanup = () => {
      document.body.removeChild(panel);
    };

    submitBtn.addEventListener('click', async () => {
      const newProfile = { custom: profile.custom || {} };
      variables.forEach(v => {
        const input = panel.querySelector(`#magical-${v}`);
        const value = input.value.trim();
        
        // Save to appropriate location
        if (v === 'first_name' || v === 'last_name' || v === 'email') {
          newProfile[v] = value;
        } else {
          // Custom variable
          if (!newProfile.custom) newProfile.custom = {};
          newProfile.custom[v] = value;
        }
      });
      await saveProfile(newProfile);
      cleanup();
      resolve(newProfile);
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    // Close on outside click
    setTimeout(() => {
      const handleClick = (e) => {
        if (!panel.contains(e.target)) {
          cleanup();
          resolve(null);
          document.removeEventListener('click', handleClick);
        }
      };
      document.addEventListener('click', handleClick);
    }, 100);
  });
};

const expandTrigger = async (element, template, delimiter, skipTriggerCheck = false) => {
  // Helper to check if variable has a value
  const hasVariableValue = (varName) => {
    if (varName === 'date') return true; // Date is always available
    if (varName === 'first_name') return !!profile.first_name;
    if (varName === 'last_name') return !!profile.last_name;
    if (varName === 'email') return !!profile.email;
    if (profile.custom && profile.custom[varName]) return true;
    return !!profile[varName];
  };
  
  // If called from popup, skip trigger check and just insert
  if (skipTriggerCheck) {
    // Process template directly without looking for trigger
    const variables = template.bodyHtml.match(/\{\{(\w+)(?::\w+)?\}\}/g) || [];
    const uniqueVars = [...new Set(variables.map(v => {
      const match = v.match(/\{\{(\w+)/);
      return match ? match[1] : null;
    }).filter(Boolean))];
    const needsInput = uniqueVars.filter(v => v !== 'date' && !hasVariableValue(v));

    let finalProfile = profile;
    if (needsInput.length > 0) {
      const inputProfile = await showAutofillPanel(element, template, needsInput);
      if (!inputProfile) return false;
      finalProfile = { ...profile, ...inputProfile };
    }

    const isHTML = element.isContentEditable;
    const processedBody = await processTemplate(
      isHTML ? template.bodyHtml : template.bodyText,
      finalProfile
    );

    // Insert directly at cursor position (no delimiter when inserting from popup)
    return await insertProcessedContent(element, processedBody, '', isHTML);
  }

  // Get trigger match before processing (for keyboard expansion)
  const textBefore = element.isContentEditable 
    ? (element.innerText || element.textContent)
    : element.value;
  const cursorPos = element.isContentEditable
    ? (window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : 0)
    : element.selectionStart;

  const triggerMatch = findTrigger(textBefore, cursorPos);
  if (!triggerMatch) return false;

  // Check for variables that need input
  const variables = template.bodyHtml.match(/\{\{(\w+)(?::\w+)?\}\}/g) || [];
  const uniqueVars = [...new Set(variables.map(v => {
    const match = v.match(/\{\{(\w+)/);
    return match ? match[1] : null;
  }).filter(Boolean))];
  const needsInput = uniqueVars.filter(v => v !== 'date' && !hasVariableValue(v));

  let finalProfile = profile;
  if (needsInput.length > 0) {
    const inputProfile = await showAutofillPanel(element, template, needsInput);
    if (!inputProfile) return false;
    finalProfile = { ...profile, ...inputProfile };
  }

  // Process template
  const isHTML = element.isContentEditable;
  const processedBody = await processTemplate(
    isHTML ? template.bodyHtml : template.bodyText,
    finalProfile
  );

  const { startIndex, endIndex } = triggerMatch;

  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const value = element.value;
    
    // Check if delimiter was already inserted in the value
    let delimiterAlreadyInserted = false;
    if (delimiter === ' ' && value[endIndex] === ' ') {
      delimiterAlreadyInserted = true;
    } else if (delimiter === '\n' && value[endIndex] === '\n') {
      delimiterAlreadyInserted = true;
    }
    
    let newValue = value.slice(0, startIndex) + processedBody;
    
    // Add delimiter back (only if not already there)
    if (!delimiterAlreadyInserted) {
      if (delimiter === ' ') {
        newValue += ' ';
      } else if (delimiter === '\n') {
        newValue += '\n';
      }
    }
    
    // Remove the trigger and delimiter from original
    const delimiterLength = delimiter === 'Tab' ? 0 : (delimiterAlreadyInserted ? 1 : 0);
    newValue += value.slice(endIndex + delimiterLength);

    // Set value using multiple methods for compatibility
    element.value = newValue;
    
    // Force update for React/Vue and other frameworks
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, newValue);
      }
    } catch (e) {
      // Fallback if descriptor not available
    }
    
    const newCursorPos = startIndex + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
    
    // Set cursor position
    if (element.setSelectionRange) {
      element.setSelectionRange(newCursorPos, newCursorPos);
    }
    element.selectionStart = element.selectionEnd = newCursorPos;
    
    // Dispatch multiple events for better compatibility
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger React/Vue updates
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);
  } else if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    
    // Try to find and replace the trigger in the DOM
    // First, try to find the text node containing the trigger
    const textBefore = element.innerText || element.textContent || '';
    const triggerIndex = textBefore.lastIndexOf(template.trigger, cursorPos - 1);
    
    if (triggerIndex === -1) return false;
    
    // Find the actual DOM nodes that contain the trigger
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    let offset = 0;
    let triggerNode = null;
    let triggerNodeStart = 0;
    let triggerNodeEnd = 0;
    
    while ((node = walker.nextNode())) {
      const nodeText = node.textContent;
      const nodeStart = offset;
      const nodeEnd = offset + nodeText.length;
      
      if (triggerIndex >= nodeStart && triggerIndex < nodeEnd) {
        triggerNode = node;
        triggerNodeStart = nodeStart;
        triggerNodeEnd = nodeEnd;
        break;
      }
      offset = nodeEnd;
    }
    
    if (triggerNode) {
      const localTriggerStart = triggerIndex - triggerNodeStart;
      const localTriggerEnd = localTriggerStart + template.trigger.length;
      const text = triggerNode.textContent;
      const before = text.substring(0, localTriggerStart);
      const after = text.substring(localTriggerEnd);
      
      // Replace trigger with processed content
      if (isHTML) {
        triggerNode.textContent = before;
        
        // Insert HTML content
        try {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedBody;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          
          if (triggerNode.parentNode) {
            triggerNode.parentNode.insertBefore(fragment, triggerNode.nextSibling);
            
            // Add delimiter
            if (delimiter === ' ') {
              const spaceNode = document.createTextNode(' ');
              triggerNode.parentNode.insertBefore(spaceNode, triggerNode.nextSibling);
            } else if (delimiter === '\n') {
              const br = document.createElement('br');
              triggerNode.parentNode.insertBefore(br, triggerNode.nextSibling);
            }
            
            // Add remaining text
            if (after) {
              const afterNode = document.createTextNode(after);
              triggerNode.parentNode.insertBefore(afterNode, triggerNode.nextSibling);
            }
            
            // Set cursor position after inserted content
            const lastInserted = triggerNode.nextSibling;
            if (lastInserted) {
              const newRange = document.createRange();
              if (lastInserted.nodeType === Node.TEXT_NODE) {
                newRange.setStart(lastInserted, lastInserted.textContent.length);
              } else {
                newRange.setStartAfter(lastInserted);
              }
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (e) {
          // Fallback: use execCommand or plain text
          try {
            // Delete the trigger first
            const deleteRange = document.createRange();
            deleteRange.setStart(triggerNode, localTriggerStart);
            deleteRange.setEnd(triggerNode, localTriggerEnd);
            deleteRange.deleteContents();
            
            // Insert processed content
            if (isHTML) {
              document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
            } else {
              const textContent = processedBody.replace(/<[^>]*>/g, '');
              document.execCommand('insertText', false, textContent + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
            }
          } catch (e2) {
            // Last resort: plain text replacement
            triggerNode.textContent = before + processedBody.replace(/<[^>]*>/g, '') + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + after;
            const newPos = before.length + processedBody.replace(/<[^>]*>/g, '').length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
            const newRange = document.createRange();
            newRange.setStart(triggerNode, newPos);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } else {
        triggerNode.textContent = before + processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + after;
        const newPos = before.length + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
        const newRange = document.createRange();
        newRange.setStart(triggerNode, newPos);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fallback: use execCommand to replace
      try {
        // Select and delete the trigger, then insert
        const textBefore = element.innerText || element.textContent || '';
        const triggerIndex = textBefore.lastIndexOf(template.trigger);
        
        if (triggerIndex !== -1) {
          // Try to use execCommand
          if (isHTML) {
            document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
          } else {
            document.execCommand('insertText', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (e) {
        console.warn('Failed to insert template in contenteditable:', e);
        return false;
      }
    }
  }

  return true;
};

const insertProcessedContent = async (element, processedBody, delimiter, isHTML) => {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const start = element.selectionStart !== null && element.selectionStart !== undefined 
      ? element.selectionStart 
      : element.value.length;
    const end = element.selectionEnd !== null && element.selectionEnd !== undefined 
      ? element.selectionEnd 
      : element.value.length;
    const value = element.value || '';
    const newValue = value.slice(0, start) + processedBody + 
                     (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : '') + 
                     value.slice(end);
    
    // Set value using multiple methods for compatibility
    element.value = newValue;
    
    // Force update for React/Vue and other frameworks
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, newValue);
      }
    } catch (e) {
      // Fallback if descriptor not available
    }
    
    const newCursorPos = start + processedBody.length + (delimiter === ' ' || delimiter === '\n' ? 1 : 0);
    
    // Set cursor position with multiple methods
    if (element.setSelectionRange) {
      try {
        element.setSelectionRange(newCursorPos, newCursorPos);
      } catch (e) {
        // Some browsers may throw
      }
    }
    if (element.selectionStart !== undefined) {
      element.selectionStart = element.selectionEnd = newCursorPos;
    }
    
    // Dispatch multiple events for better compatibility
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger React/Vue updates with proper target
    try {
      const reactEvent = new Event('input', { bubbles: true });
      Object.defineProperty(reactEvent, 'target', { value: element, enumerable: true });
      element.dispatchEvent(reactEvent);
    } catch (e) {
      // Fallback
    }
    
    return true;
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    
    try {
      if (isHTML) {
        // Try execCommand first
        try {
          document.execCommand('insertHTML', false, processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '<br>' : ''));
        } catch (e) {
          // Fallback to manual insertion
          range.deleteContents();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedBody;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
          
          if (delimiter === ' ') {
            const spaceNode = document.createTextNode(' ');
            range.setStartAfter(fragment.lastChild || fragment);
            range.insertNode(spaceNode);
            range.setStartAfter(spaceNode);
          } else if (delimiter === '\n') {
            const br = document.createElement('br');
            range.setStartAfter(fragment.lastChild || fragment);
            range.insertNode(br);
            range.setStartAfter(br);
          }
        }
      } else {
        const textNode = document.createTextNode(processedBody + (delimiter === ' ' ? ' ' : delimiter === '\n' ? '\n' : ''));
        range.deleteContents();
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch (e) {
      console.error('Failed to insert content:', e);
      return false;
    }
  }
  return false;
};

const getContentEditableElement = (element) => {
  // Check if element itself is contenteditable
  if (element.isContentEditable) {
    return element;
  }
  
  // Check parent elements
  let current = element;
  while (current && current !== document.body) {
    if (current.isContentEditable || current.getAttribute('contenteditable') === 'true') {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
};

const getTextAndCursorFromContentEditable = (element) => {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    // No selection, get all text and position at end
    const text = element.innerText || element.textContent || '';
    return { text, cursorPos: text.length };
  }
  
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  
  // If we're in a text node, use it directly
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent;
    const cursorPos = range.startOffset;
    return { text, cursorPos };
  }
  
  // Otherwise, we need to find the text position in the entire element
  // Walk through all text nodes to find cursor position
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let text = '';
  let cursorPos = 0;
  let found = false;
  let node;
  
  while ((node = walker.nextNode())) {
    const nodeText = node.textContent;
    const nodeStart = text.length;
    const nodeEnd = text.length + nodeText.length;
    
    if (node === textNode || node.contains(textNode)) {
      // Found the node containing cursor
      if (node === textNode) {
        cursorPos = nodeStart + range.startOffset;
      } else {
        // Cursor is in a child of this text node's parent
        cursorPos = nodeStart;
      }
      found = true;
    }
    
    text += nodeText;
    
    if (found) break;
  }
  
  // If we didn't find it, cursor is at the end
  if (!found) {
    cursorPos = text.length;
  }
  
  return { text, cursorPos };
};

const handleKeyDown = async (e) => {
  // Skip if no templates loaded
  if (templates.length === 0) return;
  
  let element = e.target;
  
  // Check for password fields
  if (element.type === 'password') return;
  
  // Check if it's a standard input/textarea (including nested elements)
  let isStandardInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  
  // If not directly an input/textarea, check if we're inside one
  if (!isStandardInput) {
    let parent = element;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA') {
        element = parent;
        isStandardInput = true;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  // Check for contenteditable (including body elements)
  const contentEditableElement = getContentEditableElement(element);
  const isContentEditable = !!contentEditableElement;
  
  if (!isStandardInput && !isContentEditable) return;
  
  // Use the contenteditable element if found, otherwise use the original
  const targetElement = isContentEditable ? contentEditableElement : element;

  let delimiter = null;
  if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    delimiter = ' ';
  } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
    delimiter = '\n';
  } else if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
    delimiter = 'Tab';
  }

  if (!delimiter) return;
  
  // For textareas, also check if the key was already processed
  // Some sites might prevent default, so we need to work with the current value
  if (isStandardInput && e.defaultPrevented) {
    // If default was prevented, the space/enter might not have been inserted yet
    // We'll work with the value as it is
  }

  try {
    let text, cursorPos;
    
    if (isContentEditable) {
      const result = getTextAndCursorFromContentEditable(targetElement);
      text = result.text;
      cursorPos = result.cursorPos;
    } else {
      // For standard inputs, get value and cursor position
      text = targetElement.value || '';
      
      // For space/enter/tab, the character might already be in the value
      // or might be about to be inserted. We need to account for this.
      let actualCursorPos;
      
      // Try multiple methods to get cursor position
      if (targetElement.selectionStart !== undefined && targetElement.selectionStart !== null) {
        actualCursorPos = targetElement.selectionStart;
      } else if (targetElement.selectionEnd !== undefined && targetElement.selectionEnd !== null) {
        actualCursorPos = targetElement.selectionEnd;
      } else {
        // Fallback: try to get selection via document selection
        try {
          const selection = document.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (range.startContainer === targetElement || targetElement.contains(range.startContainer)) {
              // Calculate position in textarea
              const textBefore = text.substring(0, range.startOffset);
              actualCursorPos = textBefore.length;
            } else {
              actualCursorPos = text.length;
            }
          } else {
            actualCursorPos = text.length;
          }
        } catch (err) {
          actualCursorPos = text.length;
        }
      }
      
      // If the delimiter key was pressed, check if it's already in the text
      // Some browsers/sites insert it immediately, others don't
      if (delimiter === ' ' && text[actualCursorPos - 1] === ' ') {
        // Space already inserted, cursor is after it
        cursorPos = actualCursorPos - 1;
      } else if (delimiter === '\n' && text[actualCursorPos - 1] === '\n') {
        // Newline already inserted
        cursorPos = actualCursorPos - 1;
      } else {
        // Delimiter not yet inserted, use current position
        cursorPos = actualCursorPos;
      }
    }

    const triggerMatch = findTrigger(text, cursorPos);
    if (triggerMatch) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent other handlers
      await expandTrigger(targetElement, triggerMatch.template, delimiter);
      return false;
    }
  } catch (error) {
    console.error('Error in handleKeyDown:', error);
  }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'insertTemplate') {
    // Handle async response properly
    (async () => {
      try {
        // Find the active element - try multiple methods
        let activeElement = document.activeElement;
        
        // If activeElement is not an input, try to find contenteditable ancestor
        if (activeElement && !activeElement.isContentEditable && 
            activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          // Check if we're inside a contenteditable element
          let parent = activeElement.parentElement;
          while (parent && parent !== document.body) {
            if (parent.isContentEditable) {
              activeElement = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
        
        // Also try finding any focused contenteditable
        if (!activeElement || (!activeElement.isContentEditable && 
            activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          // Try to find contenteditable elements
          const contentEditables = document.querySelectorAll('[contenteditable="true"]');
          if (contentEditables.length > 0) {
            // Use the first one or one that contains selection
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              for (const elem of contentEditables) {
                if (elem.contains(range.commonAncestorContainer)) {
                  activeElement = elem;
                  break;
                }
              }
            }
            if (!activeElement || (!activeElement.isContentEditable && 
                activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
              activeElement = contentEditables[0];
            }
          }
        }
        
        if (activeElement && (activeElement.tagName === 'INPUT' || 
                             activeElement.tagName === 'TEXTAREA' || 
                             activeElement.isContentEditable)) {
          try {
            const result = await expandTrigger(activeElement, message.template, ' ', true);
            sendResponse({ success: result });
          } catch (error) {
            console.error('Error expanding trigger:', error);
            sendResponse({ success: false, error: error.message });
          }
        } else {
          sendResponse({ success: false, error: 'No active input field' });
        }
      } catch (error) {
        console.error('Error in message handler:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  return false; // No async response for other messages
});

// Track last value to detect changes
const elementValueTracker = new WeakMap();

// Handle input events as fallback (for sites that prevent keydown)
const handleInput = async (e) => {
  const element = e.target;
  if (!element || (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA')) return;
  if (element.type === 'password') return;
  if (templates.length === 0) return;
  
  const currentValue = element.value || '';
  const lastValue = elementValueTracker.get(element) || '';
  elementValueTracker.set(element, currentValue);
  
  // Only process if value actually changed
  if (currentValue === lastValue) return;
  
  // Check if a space or newline was just added
  if (currentValue.length > lastValue.length) {
    const addedChar = currentValue[currentValue.length - 1];
    if (addedChar === ' ' || addedChar === '\n') {
      const cursorPos = element.selectionStart !== null && element.selectionStart !== undefined 
        ? element.selectionStart 
        : currentValue.length;
      
      // Check for trigger ending just before the delimiter
      const textBefore = currentValue.substring(0, cursorPos - 1);
      const triggerMatch = findTrigger(textBefore, textBefore.length);
      
      if (triggerMatch && !element._magicalExpanding) {
        element._magicalExpanding = true;
        // Small delay to ensure the delimiter is in place
        setTimeout(async () => {
          try {
            const delimiter = addedChar;
            await expandTrigger(element, triggerMatch.template, delimiter);
          } finally {
            element._magicalExpanding = false;
          }
        }, 50);
      }
    }
  }
};

// Monitor textarea value changes directly (for React/Vue controlled inputs)
const monitorElementValue = (element) => {
  if (element._magicalValueMonitor) return; // Already monitoring
  
  let lastValue = element.value || '';
  let lastCursorPos = element.selectionStart || 0;
  elementValueTracker.set(element, lastValue);
  
  const checkValue = () => {
    if (!document.contains(element)) {
      if (element._magicalValueMonitor) {
        clearInterval(element._magicalValueMonitor);
        element._magicalValueMonitor = null;
      }
      return;
    }
    
    const currentValue = element.value || '';
    const currentCursorPos = element.selectionStart !== null && element.selectionStart !== undefined 
      ? element.selectionStart 
      : currentValue.length;
    
    if (currentValue !== lastValue && !element._magicalExpanding) {
      // Value changed - check if a trigger was just completed
      if (currentValue.length > lastValue.length) {
        // Check if space or newline was added
        const addedText = currentValue.substring(lastValue.length);
        if (addedText.endsWith(' ') || addedText.endsWith('\n')) {
          const delimiter = addedText[addedText.length - 1];
          const textBefore = currentValue.substring(0, currentCursorPos - 1);
          const triggerMatch = findTrigger(textBefore, textBefore.length);
          
          if (triggerMatch) {
            element._magicalExpanding = true;
            setTimeout(async () => {
              try {
                await expandTrigger(element, triggerMatch.template, delimiter);
              } catch (error) {
                console.error('Error expanding trigger:', error);
              } finally {
                element._magicalExpanding = false;
              }
            }, 100);
          }
        }
      }
      
      lastValue = currentValue;
      lastCursorPos = currentCursorPos;
      elementValueTracker.set(element, lastValue);
    }
  };
  
  // Check more frequently for better responsiveness
  const interval = setInterval(checkValue, 50);
  element._magicalValueMonitor = interval;
  
  // Also check on focus and input
  element.addEventListener('focus', checkValue);
  element.addEventListener('input', checkValue);
  
  // Clean up when element is removed
  const observer = new MutationObserver((mutations) => {
    if (!document.contains(element)) {
      clearInterval(interval);
      element._magicalValueMonitor = null;
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
};

// Attach listener directly to textarea/input elements
const attachDirectListeners = () => {
  // Find all textareas and inputs
  const inputs = document.querySelectorAll('textarea, input[type="text"], input:not([type])');
  inputs.forEach(input => {
    if (input.type === 'password') return;
    
    // Remove existing listeners if any
    if (input._magicalKeydownListener) {
      input.removeEventListener('keydown', input._magicalKeydownListener, true);
    }
    if (input._magicalInputListener) {
      input.removeEventListener('input', input._magicalInputListener, true);
    }
    
    // Add keydown listener
    const keydownListener = (e) => {
      handleKeyDown(e);
    };
    input._magicalKeydownListener = keydownListener;
    input.addEventListener('keydown', keydownListener, true);
    
    // Add input listener as fallback
    const inputListener = (e) => {
      handleInput(e);
    };
    input._magicalInputListener = inputListener;
    input.addEventListener('input', inputListener, true);
    
    // Also monitor value directly for React/Vue controlled inputs
    monitorElementValue(input);
  });
};

// Watch for new textareas/inputs being added to the page
const observer = new MutationObserver((mutations) => {
  let shouldReattach = false;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        if (node.tagName === 'TEXTAREA' || 
            (node.tagName === 'INPUT' && (node.type === 'text' || !node.type))) {
          shouldReattach = true;
        }
        // Also check children
        if (node.querySelectorAll) {
          const inputs = node.querySelectorAll('textarea, input[type="text"], input:not([type])');
          if (inputs.length > 0) {
            shouldReattach = true;
          }
        }
      }
    });
  });
  
  if (shouldReattach) {
    setTimeout(attachDirectListeners, 100);
  }
});

// Initialize
(async () => {
  await loadTemplates();
  
  // Use capture phase to catch events before page scripts
  document.addEventListener('keydown', handleKeyDown, true);
  
  // Also listen on window for better coverage
  window.addEventListener('keydown', handleKeyDown, true);
  
  // Attach listeners directly to existing inputs
  attachDirectListeners();
  
  // Watch for dynamically added inputs
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also try attaching when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachDirectListeners);
  }
  
  // Special handling for specific problematic textareas
  const attachToSpecificTextarea = () => {
    const specificTextarea = document.getElementById('trygWriteToClaimHandlerInputField');
    if (specificTextarea && !specificTextarea._magicalAttached) {
      specificTextarea._magicalAttached = true;
      
      // Add all listeners
      const keydownListener = (e) => handleKeyDown(e);
      const inputListener = (e) => handleInput(e);
      
      specificTextarea.addEventListener('keydown', keydownListener, true);
      specificTextarea.addEventListener('input', inputListener, true);
      
      // Monitor value directly
      monitorElementValue(specificTextarea);
      
      // Also watch for value property changes (for React/Vue)
      let lastValue = specificTextarea.value || '';
      const valueObserver = new MutationObserver(() => {
        const currentValue = specificTextarea.value || '';
        if (currentValue !== lastValue) {
          lastValue = currentValue;
          // Trigger input handler
          const fakeEvent = { target: specificTextarea };
          handleInput(fakeEvent);
        }
      });
      
      // Watch the textarea for attribute changes
      valueObserver.observe(specificTextarea, {
        attributes: true,
        attributeFilter: ['value']
      });
      
      // Also check on focus/blur
      specificTextarea.addEventListener('focus', () => {
        monitorElementValue(specificTextarea);
      });
    }
  };
  
  // Try to attach to specific textarea immediately and periodically
  attachToSpecificTextarea();
  setInterval(attachToSpecificTextarea, 1000);
  
  // Reload templates when storage changes - listen for templates specifically
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.templates || areaName === 'sync' || areaName === 'local') {
      // Templates changed - reload them
      loadTemplates().then(() => {
        console.log('Templates reloaded from storage');
      }).catch(err => {
        console.error('Error reloading templates:', err);
      });
    }
  });
})();
