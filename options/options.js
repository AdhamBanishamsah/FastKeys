import { storage } from '../lib/storage.js';
import { generateUUID } from '../lib/uuid.js';
import { htmlToText } from '../lib/templating.js';

let templates = [];
let tags = [];
let currentTemplateId = null;
let selectedTemplateIds = new Set();
let selectedTagFilter = 'all';
let profile = {};

// Render custom variables in dropdown (defined early so it's accessible)
const renderVariableDropdown = () => {
  const container = document.getElementById('custom-variables-dropdown');
  if (!container) return;
  
  const customVars = profile.custom || {};
  const varNames = Object.keys(customVars).sort(); // Sort alphabetically
  
  if (varNames.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = varNames.map(varName => {
    const displayName = varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<a href="#" data-variable="${varName}">${displayName}</a>`;
  }).join('');
};

const loadData = async () => {
  templates = await storage.getTemplates();
  tags = await storage.getTags();
  const settings = await storage.getSettings();
  profile = settings.profile || {};
  loadProfile();
  renderTemplates();
  renderTags();
  renderTagFilter();
};

const saveTemplates = async () => {
  await storage.saveTemplates(templates);
  renderTemplates();
};

const saveTags = async () => {
  await storage.saveTags(tags);
  renderTags();
};

const loadProfile = () => {
  document.getElementById('profile-first-name').value = profile.first_name || '';
  document.getElementById('profile-last-name').value = profile.last_name || '';
  document.getElementById('profile-email').value = profile.email || '';
  renderCustomVariables();
  renderVariableDropdown();
};

const renderCustomVariables = () => {
  const container = document.getElementById('custom-variables-container');
  const customVars = profile.custom || {};
  const varNames = Object.keys(customVars).filter(key => 
    !['first_name', 'last_name', 'email'].includes(key)
  );
  
  container.innerHTML = varNames.map(varName => `
    <div class="form-group custom-variable-group" data-var="${varName}">
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" class="variable-name-input" value="${varName}" placeholder="Variable name" readonly style="flex: 1;">
        <input type="text" class="variable-value-input" value="${customVars[varName]}" placeholder="Value" style="flex: 2;">
        <button class="btn btn-danger btn-small remove-variable-btn" data-var="${varName}">Remove</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.remove-variable-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const varName = btn.dataset.var;
      if (confirm(`Remove variable "${varName}"?`)) {
        delete profile.custom[varName];
        renderCustomVariables();
        renderVariableDropdown();
      }
    });
  });
  
  container.querySelectorAll('.variable-value-input').forEach(input => {
    input.addEventListener('input', () => {
      const varName = input.closest('.custom-variable-group').dataset.var;
      if (!profile.custom) profile.custom = {};
      profile.custom[varName] = input.value;
    });
  });
  
  // Update dropdown when values change (optional, for real-time updates)
  container.querySelectorAll('.variable-value-input').forEach(input => {
    input.addEventListener('blur', () => {
      renderVariableDropdown();
    });
  });
};

const addCustomVariable = () => {
  const varName = prompt('Enter variable name (e.g., phone, company, title):');
  if (!varName) return;
  
  // Validate variable name (alphanumeric and underscores only)
  const validName = /^[a-z_][a-z0-9_]*$/i;
  if (!validName.test(varName)) {
    alert('Variable name must start with a letter or underscore and contain only letters, numbers, and underscores.');
    return;
  }
  
  // Check if variable already exists
  if (profile.first_name === varName || profile.last_name === varName || profile.email === varName) {
    alert('This variable name is reserved. Please choose another name.');
    return;
  }
  
  if (!profile.custom) profile.custom = {};
  if (profile.custom[varName]) {
    alert('This variable already exists.');
    return;
  }
  
  profile.custom[varName] = '';
  renderCustomVariables();
  renderVariableDropdown();
  
  // Focus on the new variable's value input
  setTimeout(() => {
    const newInput = document.querySelector(`[data-var="${varName}"] .variable-value-input`);
    if (newInput) newInput.focus();
  }, 100);
};

const saveProfile = async () => {
  // Save standard fields
  profile.first_name = document.getElementById('profile-first-name').value.trim();
  profile.last_name = document.getElementById('profile-last-name').value.trim();
  profile.email = document.getElementById('profile-email').value.trim();
  
  // Save custom variables from inputs
  if (!profile.custom) profile.custom = {};
  document.querySelectorAll('.custom-variable-group').forEach(group => {
    const varName = group.dataset.var;
    const valueInput = group.querySelector('.variable-value-input');
    if (valueInput) {
      profile.custom[varName] = valueInput.value.trim();
    }
  });
  
  const settings = await storage.getSettings();
  settings.profile = profile;
  await storage.saveSettings(settings);
  renderVariableDropdown(); // Update dropdown after saving
  alert('Profile saved successfully!');
};

const renderTagFilter = () => {
  const dropdown = document.getElementById('filter-tags-dropdown');
  if (!dropdown) return;
  
  const divider = dropdown.querySelector('.dropdown-divider');
  if (!divider) return;
  
  // Clear existing tag filters (keep "All Templates" and divider)
  const existing = dropdown.querySelectorAll('[data-tag]:not([data-tag="all"])');
  existing.forEach(el => el.remove());
  
  // Add tag filters
  tags.forEach(tag => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.tag = tag.name;
    link.textContent = tag.name;
    if (selectedTagFilter === tag.name) {
      link.style.fontWeight = 'bold';
      link.style.color = '#3B82F6';
    }
    dropdown.insertBefore(link, divider.nextSibling);
  });
  
  // Update "All Templates" style
  const allLink = dropdown.querySelector('[data-tag="all"]');
  if (allLink) {
    if (selectedTagFilter === 'all') {
      allLink.style.fontWeight = 'bold';
      allLink.style.color = '#3B82F6';
    } else {
      allLink.style.fontWeight = 'normal';
      allLink.style.color = '#111827';
    }
  }
};

const renderTemplates = () => {
  const list = document.getElementById('templates-list');
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  
  let filtered = templates.filter(t => 
    t.trigger.toLowerCase().includes(searchQuery) ||
    (t.title && t.title.toLowerCase().includes(searchQuery)) ||
    t.bodyText.toLowerCase().includes(searchQuery)
  );
  
  // Apply tag filter
  if (selectedTagFilter && selectedTagFilter !== 'all') {
    filtered = filtered.filter(t => 
      t.tags && t.tags.includes(selectedTagFilter)
    );
  }

  list.innerHTML = filtered.map(template => {
    const isSelected = selectedTemplateIds.has(template.id);
    const preview = template.bodyText.substring(0, 100) + (template.bodyText.length > 100 ? '...' : '');
    const templateTags = template.tags || [];
    
    return `
      <div class="template-card ${isSelected ? 'selected' : ''}" data-id="${template.id}">
        <input type="checkbox" class="template-checkbox" ${isSelected ? 'checked' : ''} data-id="${template.id}">
        <div style="flex: 1;">
          <div class="template-trigger">${template.trigger}</div>
          <div class="template-preview">${preview}</div>
          ${templateTags && templateTags.length > 0 ? `
          <div class="template-tags">
            ${templateTags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Attach event listeners
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') return;
      const id = card.dataset.id;
      loadTemplate(id);
    });
  });

  document.querySelectorAll('.template-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedTemplateIds.add(id);
      } else {
        selectedTemplateIds.delete(id);
      }
      updateSelectAll();
      renderTemplates();
    });
  });
};

const renderTags = () => {
  const list = document.getElementById('tags-list');
  list.innerHTML = tags.map(tag => `
    <div class="tag-item">
      <span class="tag-item-name">${tag.name}</span>
      <div class="tag-item-actions">
        <button class="edit-tag-btn" data-name="${tag.name}">✏️</button>
        <button class="delete-tag-btn" data-name="${tag.name}">🗑️</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.edit-tag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      editTag(name);
    });
  });

  document.querySelectorAll('.delete-tag-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      if (confirm(`Delete tag "${name}"?`)) {
        tags = tags.filter(t => t.name !== name);
        // Remove tag from templates
        templates.forEach(t => {
          if (t.tags) {
            t.tags = t.tags.filter(tag => tag !== name);
          }
        });
        await saveTags();
        await saveTemplates();
        
        // Update tag filter after deleting
        if (document.getElementById('filter-tags-dropdown')) {
          renderTagFilter();
        }
      }
    });
  });
};

const loadTemplate = (id) => {
  const template = templates.find(t => t.id === id);
  if (!template) return;

  currentTemplateId = id;
  document.getElementById('trigger-input').value = template.trigger;
  document.getElementById('editor-content').innerHTML = template.bodyHtml;
  // Tags are optional - use empty array if not present
  renderEditorTags(template.tags || []);
  renderTagSelector(); // Update tag selector
  document.getElementById('editor-content').focus();
};

const createNewTemplate = () => {
  currentTemplateId = null;
  document.getElementById('trigger-input').value = '';
  document.getElementById('editor-content').innerHTML = '';
  renderEditorTags([]);
  renderTagSelector(); // Update tag selector
  document.getElementById('editor-content').focus();
};

const renderEditorTags = (templateTags) => {
  const container = document.getElementById('editor-tags-container');
  if (!container) return;
  
  // Handle empty or undefined tags
  const tags = templateTags && Array.isArray(templateTags) ? templateTags : [];
  container.innerHTML = tags.length > 0 ? tags.map(tag => `
    <span class="editor-tag-chip">
      ${tag}
      <span class="remove-tag" data-tag="${tag}">×</span>
    </span>
  `).join('') : '';
  
  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tagToRemove = btn.dataset.tag;
      const currentTags = Array.from(container.querySelectorAll('.editor-tag-chip'))
        .map(chip => chip.textContent.replace('×', '').trim())
        .filter(t => t !== tagToRemove);
      renderEditorTags(currentTags);
    });
  });
};

const getEditorTags = () => {
  const container = document.getElementById('editor-tags-container');
  if (!container) return [];
  const tags = Array.from(container.querySelectorAll('.editor-tag-chip'))
    .map(chip => chip.textContent.replace('×', '').trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : [];
};

const addTagToEditor = (tagName) => {
  const currentTags = getEditorTags();
  if (!currentTags.includes(tagName)) {
    renderEditorTags([...currentTags, tagName]);
  }
  // Update tag dropdown to reflect selection
  renderTagSelector();
};

const renderTagSelector = () => {
  const container = document.getElementById('tag-select-list');
  if (!container) return;
  
  const currentTags = getEditorTags();
  
  container.innerHTML = tags.map(tag => {
    const isSelected = currentTags.includes(tag.name);
    return `
      <label class="tag-select-item ${isSelected ? 'selected' : ''}">
        <input type="checkbox" ${isSelected ? 'checked' : ''} value="${tag.name}">
        <span>${tag.name}</span>
      </label>
    `;
  }).join('');
  
  // Add event listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const tagName = e.target.value;
      const currentTags = getEditorTags();
      
      if (e.target.checked) {
        if (!currentTags.includes(tagName)) {
          renderEditorTags([...currentTags, tagName]);
        }
      } else {
        renderEditorTags(currentTags.filter(t => t !== tagName));
      }
      
      // Update visual state
      renderTagSelector();
    });
  });
};

const saveTemplate = async () => {
  const trigger = document.getElementById('trigger-input').value.trim();
  if (!trigger) {
    alert('Please enter a trigger');
    return;
  }

  const bodyHtml = document.getElementById('editor-content').innerHTML;
  const bodyText = htmlToText(bodyHtml);
  const templateTags = getEditorTags();
  
  // Tags are optional - ensure it's an array even if empty
  const finalTags = templateTags && templateTags.length > 0 ? templateTags : [];

  if (currentTemplateId) {
    const template = templates.find(t => t.id === currentTemplateId);
    if (template) {
      template.trigger = trigger;
      template.bodyHtml = bodyHtml;
      template.bodyText = bodyText;
      template.tags = finalTags;
      template.updatedAt = Date.now();
    }
  } else {
    // Check if trigger already exists
    if (templates.some(t => t.trigger === trigger)) {
      alert('A template with this trigger already exists');
      return;
    }

    const newTemplate = {
      id: generateUUID(),
      trigger,
      title: trigger,
      bodyHtml,
      bodyText,
      tags: finalTags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    templates.push(newTemplate);
    currentTemplateId = newTemplate.id;
  }

  await saveTemplates();
  loadTemplate(currentTemplateId);
};

const discardChanges = () => {
  if (currentTemplateId) {
    loadTemplate(currentTemplateId);
  } else {
    createNewTemplate();
  }
};

const deleteSelectedTemplates = async () => {
  if (selectedTemplateIds.size === 0) {
    alert('No templates selected');
    return;
  }

  if (confirm(`Delete ${selectedTemplateIds.size} template(s)?`)) {
    templates = templates.filter(t => !selectedTemplateIds.has(t.id));
    selectedTemplateIds.clear();
    currentTemplateId = null;
    await saveTemplates();
    createNewTemplate();
  }
};

const exportTemplates = () => {
  if (selectedTemplateIds.size === 0) {
    alert('Please select templates to export');
    return;
  }

  const selected = templates.filter(t => selectedTemplateIds.has(t.id));
  const dataStr = JSON.stringify(selected, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fastkeys-templates.json';
  link.click();
  URL.revokeObjectURL(url);
};

const exportAll = async () => {
  const settings = await storage.getSettings();
  const exportData = {
    templates: templates,
    tags: tags,
    profile: settings.profile || {},
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fastkeys-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importTemplates = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      
      // Check if it's a full export (with templates, tags, profile) or just templates
      if (imported.templates) {
        // Full export
        const importedTemplates = imported.templates || [];
        const importedTags = imported.tags || [];
        const importedProfile = imported.profile || {};
        
        // Import templates
        importedTemplates.forEach(t => {
          t.id = generateUUID();
          t.createdAt = Date.now();
          t.updatedAt = Date.now();
        });
        templates = [...templates, ...importedTemplates];
        
        // Import tags (merge, avoid duplicates)
        const existingTagNames = new Set(tags.map(t => t.name));
        importedTags.forEach(tag => {
          if (!existingTagNames.has(tag.name)) {
            tags.push(tag);
            existingTagNames.add(tag.name);
          }
        });
        await saveTags();
        
        // Import profile (merge with existing)
        if (Object.keys(importedProfile).length > 0) {
          const settings = await storage.getSettings();
          settings.profile = { ...settings.profile, ...importedProfile };
          await storage.saveSettings(settings);
          profile = settings.profile;
          loadProfile();
        }
        
        await saveTemplates();
        alert(`Imported ${importedTemplates.length} template(s), ${importedTags.length} tag(s), and profile data`);
      } else if (Array.isArray(imported)) {
        // Just templates array
        imported.forEach(t => {
          t.id = generateUUID();
          t.createdAt = Date.now();
          t.updatedAt = Date.now();
        });

        templates = [...templates, ...imported];
        await saveTemplates();
        alert(`Imported ${imported.length} template(s)`);
      } else {
        throw new Error('Invalid format');
      }
      
      renderTemplates();
      renderTags();
      renderTagFilter();
      renderTagSelector();
    } catch (error) {
      alert('Failed to import: ' + error.message);
    }
  };
  input.click();
};

const updateSelectAll = () => {
  const selectAll = document.getElementById('select-all');
  const checkboxes = document.querySelectorAll('.template-checkbox');
  selectAll.checked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
};

const insertVariable = (variable) => {
  const editor = document.getElementById('editor-content');
  const selection = window.getSelection();
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const chip = document.createElement('span');
    chip.className = 'variable-chip';
    chip.contentEditable = 'false';
    chip.textContent = `{{${variable}}}`;
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  }
};

const insertDate = (format) => {
  const editor = document.getElementById('editor-content');
  const selection = window.getSelection();
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const chip = document.createElement('span');
    chip.className = 'variable-chip';
    chip.contentEditable = 'false';
    chip.textContent = format === 'long' ? '{{date}}' : `{{date:${format}}}`;
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  }
};

const showHTMLModal = () => {
  const editor = document.getElementById('editor-content');
  const htmlEditor = document.getElementById('html-editor');
  htmlEditor.value = editor.innerHTML;
  document.getElementById('html-modal').classList.add('show');
};

const saveHTML = () => {
  const htmlEditor = document.getElementById('html-editor');
  const editor = document.getElementById('editor-content');
  editor.innerHTML = htmlEditor.value;
  document.getElementById('html-modal').classList.remove('show');
};

const createTag = () => {
  document.getElementById('tag-modal-title').textContent = 'Create Tag';
  const input = document.getElementById('tag-name-input');
  input.value = '';
  delete input.dataset.oldName;
  document.getElementById('tag-modal').classList.add('show');
  input.focus();
};

const editTag = (name) => {
  document.getElementById('tag-modal-title').textContent = 'Edit Tag';
  const input = document.getElementById('tag-name-input');
  input.value = name;
  input.dataset.oldName = name;
  document.getElementById('tag-modal').classList.add('show');
  input.focus();
};

const saveTag = async () => {
  const name = document.getElementById('tag-name-input').value.trim();
  if (!name) {
    alert('Please enter a tag name');
    return;
  }

  const isEdit = document.getElementById('tag-modal-title').textContent === 'Edit Tag';
  const oldName = isEdit ? document.getElementById('tag-name-input').dataset.oldName : null;

  if (isEdit && oldName) {
    const tag = tags.find(t => t.name === oldName);
    if (tag) {
      tag.name = name;
      // Update templates
      templates.forEach(t => {
        if (t.tags) {
          const index = t.tags.indexOf(oldName);
          if (index !== -1) {
            t.tags[index] = name;
          }
        }
      });
    }
  } else {
    if (tags.some(t => t.name === name)) {
      alert('Tag already exists');
      return;
    }
    tags.push({ name, color: '#3B82F6' });
  }

  await saveTags();
  await saveTemplates();
  
  // Update tag filter after saving
  if (document.getElementById('filter-tags-dropdown')) {
    renderTagFilter();
  }
  
  document.getElementById('tag-modal').classList.remove('show');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
    });
  });

  // Select All
  document.getElementById('select-all').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.template-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
      const id = cb.dataset.id;
      if (e.target.checked) {
        selectedTemplateIds.add(id);
      } else {
        selectedTemplateIds.delete(id);
      }
    });
    renderTemplates();
  });

  // Create dropdown
  document.getElementById('create-new').addEventListener('click', (e) => {
    e.preventDefault();
    createNewTemplate();
  });

  document.getElementById('import-templates').addEventListener('click', (e) => {
    e.preventDefault();
    importTemplates();
  });

  // Share
  document.getElementById('share-btn').addEventListener('click', exportTemplates);
  
  // Export All
  document.getElementById('export-all-btn').addEventListener('click', exportAll);

  // Tags dropdown
  document.getElementById('tags-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('tags-dropdown');
    const btn = document.getElementById('tags-btn');
    const btnRect = btn.getBoundingClientRect();
    
    dropdown.classList.toggle('show');
    
    if (dropdown.classList.contains('show')) {
      // Position dropdown below the button
      dropdown.style.top = `${btnRect.bottom + 5}px`;
      dropdown.style.left = `${btnRect.left}px`;
    }
  });

  document.getElementById('create-tag-btn').addEventListener('click', createTag);

  // Add tag to editor - show dropdown with checkboxes
  document.getElementById('add-tag-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('editor-tag-dropdown');
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
      renderTagSelector();
    }
  });
  
  // Update tag selector when tags change - use a wrapper function instead of reassigning
  const originalRenderTags = renderTags;
  const renderTagsWithTagSelector = () => {
    originalRenderTags();
    if (document.getElementById('tag-select-list')) {
      renderTagSelector();
    }
  };
  
  // Override saveTags to also update tag selector
  const originalSaveTags = saveTags;
  const saveTagsWrapper = async () => {
    await originalSaveTags();
    renderTagsWithTagSelector();
  };
  
  // Update places where saveTags is called to use the wrapper
  // We'll handle this by patching the delete tag handler
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-tag-btn')) {
      setTimeout(() => {
        renderTagsWithTagSelector();
      }, 0);
    }
  }, true);

  // Delete
  document.getElementById('delete-btn').addEventListener('click', deleteSelectedTemplates);

  // Search
  document.getElementById('search-input').addEventListener('input', renderTemplates);

  // Tag filter
  document.getElementById('filter-tags-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('filter-tags-dropdown');
    dropdown.classList.toggle('show');
  });

  // Use event delegation for tag filter links (since they're dynamically generated)
  document.getElementById('filter-tags-dropdown').addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.dataset.tag) {
      e.preventDefault();
      selectedTagFilter = e.target.dataset.tag;
      renderTagFilter();
      renderTemplates();
      document.getElementById('filter-tags-dropdown').classList.remove('show');
    }
  });

  // Save profile
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  
  // Add custom variable
  document.getElementById('add-variable-btn').addEventListener('click', addCustomVariable);

  // Editor toolbar
  document.querySelectorAll('[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
      const command = btn.dataset.command;
      if (command === 'createLink') {
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand(command, false, url);
        }
      } else {
        document.execCommand(command, false, null);
      }
      document.getElementById('editor-content').focus();
    });
  });
  
  // Insert variable - improved hover handling to prevent gap issues
  const variableDropdown = document.getElementById('variable-dropdown');
  const insertVariableBtn = document.getElementById('insert-variable-btn');
  if (variableDropdown && insertVariableBtn) {
    let variableTimeout = null;
    
    const showVariableDropdown = () => {
      if (variableTimeout) clearTimeout(variableTimeout);
      variableDropdown.classList.add('show');
    };
    
    const hideVariableDropdown = () => {
      variableTimeout = setTimeout(() => {
        if (!variableDropdown.matches(':hover') && !insertVariableBtn.matches(':hover')) {
          variableDropdown.classList.remove('show');
        }
      }, 200);
    };
    
    insertVariableBtn.addEventListener('mouseenter', showVariableDropdown);
    insertVariableBtn.addEventListener('mouseleave', hideVariableDropdown);
    variableDropdown.addEventListener('mouseenter', showVariableDropdown);
    variableDropdown.addEventListener('mouseleave', hideVariableDropdown);
    
    variableDropdown.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.dataset.variable) {
        e.preventDefault();
        insertVariable(e.target.dataset.variable);
        variableDropdown.classList.remove('show');
      }
    });
  }
  
  // Initial render of variable dropdown
  renderVariableDropdown();

  // Insert date - improved hover handling
  const dateDropdown = document.getElementById('date-dropdown');
  const insertDateBtn = document.getElementById('insert-date-btn');
  if (dateDropdown && insertDateBtn) {
    let dateTimeout = null;
    
    const showDateDropdown = () => {
      if (dateTimeout) clearTimeout(dateTimeout);
      dateDropdown.classList.add('show');
    };
    
    const hideDateDropdown = () => {
      dateTimeout = setTimeout(() => {
        if (!dateDropdown.matches(':hover') && !insertDateBtn.matches(':hover')) {
          dateDropdown.classList.remove('show');
        }
      }, 200);
    };
    
    insertDateBtn.addEventListener('mouseenter', showDateDropdown);
    insertDateBtn.addEventListener('mouseleave', hideDateDropdown);
    dateDropdown.addEventListener('mouseenter', showDateDropdown);
    dateDropdown.addEventListener('mouseleave', hideDateDropdown);
    
    document.querySelectorAll('#date-dropdown a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        insertDate(link.dataset.format);
        dateDropdown.classList.remove('show');
      });
    });
  }

  // View HTML
  document.getElementById('view-html-btn').addEventListener('click', showHTMLModal);
  document.getElementById('save-html-btn').addEventListener('click', saveHTML);
  document.getElementById('cancel-html-btn').addEventListener('click', () => {
    document.getElementById('html-modal').classList.remove('show');
  });

  // Save/Discard
  document.getElementById('save-btn').addEventListener('click', saveTemplate);
  document.getElementById('discard-btn').addEventListener('click', discardChanges);

  // Tag modal
  document.getElementById('save-tag-btn').addEventListener('click', saveTag);
  document.getElementById('cancel-tag-btn').addEventListener('click', () => {
    document.getElementById('tag-modal').classList.remove('show');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-wrapper')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
    if (!e.target.closest('#tags-btn') && !e.target.closest('#tags-dropdown')) {
      document.getElementById('tags-dropdown').classList.remove('show');
    }
    if (!e.target.closest('#filter-tags-btn') && !e.target.closest('#filter-tags-dropdown')) {
      document.getElementById('filter-tags-dropdown').classList.remove('show');
    }
    if (!e.target.closest('#add-tag-btn') && !e.target.closest('#editor-tag-dropdown')) {
      document.getElementById('editor-tag-dropdown').classList.remove('show');
    }
  });
  
  // Update tag filter dropdown when tags change
  // We'll call renderTagFilter after renderTags in key places
  // This is handled in saveTag and in the delete tag handler

  // Initialize tag selector
  renderTagSelector();
  
  createNewTemplate();
});
