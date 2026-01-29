import { storage } from '../lib/storage.js';
import { generateUUID } from '../lib/uuid.js';
import { htmlToText } from '../lib/templating.js';
import { formatDate, formatDateWithTemplate } from '../lib/dateFormat.js';
import { t } from '../lib/translations.js';

let templates = [];
let tags = [];
let currentTemplateId = null;
let selectedTemplateIds = new Set();
let selectedTagFilter = 'all';
let profile = {};
let customDateFormats = {};

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

let language = 'en';
let theme = 'system';

const PRESET_DATE_FORMATS = ['long', 'short', 'iso', 'weekday_long', 'long_time', 'short_time', 'time_only', 'month_year', 'day_month', 'hijri_long', 'hijri_short', 'hijri_full', 'hijri_weekday'];

const loadData = async () => {
  templates = await storage.getTemplates();
  tags = await storage.getTags();
  const settings = await storage.getSettings();
  profile = settings.profile || {};
  customDateFormats = settings.customDateFormats || {};
  language = settings.language || 'en';
  theme = settings.theme || 'system';
  loadProfile();
  loadLanguage();
  loadTheme();
  renderTemplates();
  renderTags();
  renderTagFilter();
  renderCustomDateFormats();
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

const loadLanguage = () => {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = language;
  }
  updateDateDropdownExamples();
  renderCustomDateFormats();
  updateUITranslations();
};

const getEffectiveTheme = (themeChoice) => {
  if (themeChoice === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeChoice;
};

const applyTheme = (themeChoice) => {
  const effective = getEffectiveTheme(themeChoice);
  document.documentElement.setAttribute('data-theme', effective);
};

const loadTheme = () => {
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }
  applyTheme(theme);
};

const updateUITranslations = () => {
  // Update all UI text based on selected language
  const elements = {
    'templates-tab': t('templates', language),
    'automations-tab': t('automations', language),
    'select-all-label': t('selectAll', language),
    'create-btn-text': t('create', language),
    'create-new-text': t('newTemplate', language),
    'import-templates-text': t('importTemplates', language),
    'share-btn': t('share', language),
    'export-all-btn': t('exportAll', language),
    'tags-btn': t('tags', language),
    'delete-btn': t('delete', language),
    'filter-tags-btn': t('filterByTag', language),
    'search-input': t('searchTemplates', language),
    'trigger-label': t('trigger', language),
    'trigger-input': t('triggerPlaceholder', language),
    'save-btn': t('save', language),
    'discard-btn': t('discard', language),
    'tags-label': t('tagsLabel', language),
    'add-tag-btn': t('addTag', language),
    'insert-variable-btn': t('variables', language),
    'insert-date-btn': t('date', language),
    'view-html-btn': t('html', language),
    'editor-content': t('startTyping', language),
    'about-title': t('about', language),
    'theme-title': t('themeTitle', language),
    'theme-description': t('themeDescription', language),
    'theme-label': t('themeLabel', language),
    'theme-light': t('themeLight', language),
    'theme-dark': t('themeDark', language),
    'theme-system': t('themeSystem', language),
    'language-title': t('languageLocalization', language),
    'language-description': t('languageDescription', language),
    'language-label': t('language', language),
    'profile-title': t('profileVariables', language),
    'profile-description': t('profileDescription', language),
    'first-name-label': t('firstName', language),
    'last-name-label': t('lastName', language),
    'email-label': t('email', language),
    'first-name-placeholder': t('enterFirstName', language),
    'last-name-placeholder': t('enterLastName', language),
    'email-placeholder': t('enterEmail', language),
    'add-variable-btn': t('addCustomVariable', language),
    'save-profile-btn': t('saveProfile', language),
    'tag-modal-title': t('createTag', language),
    'tag-name-placeholder': t('tagName', language),
    'cancel-tag-btn': t('cancel', language),
    'save-tag-btn': t('save', language),
    'html-modal-title': t('editHTML', language),
    'cancel-html-btn': t('cancel', language),
    'save-html-btn': t('save', language),
    'all-templates-option': t('allTemplates', language),
    'gregorian-title': t('gregorian', language),
    'hijri-title': t('hijriIslamic', language),
    'profile-section-title': t('profile', language),
    'custom-section-title': t('custom', language),
    'custom-date-formats-title': t('customDateFormatsTitle', language),
    'custom-date-formats-description': t('customDateFormatsDescription', language),
    'add-custom-date-format-btn': t('addCustomDateFormatBtn', language),
    'date-format-modal-title': t('dateFormatModalTitle', language),
    'date-format-name-label': t('dateFormatNameLabel', language),
    'date-format-name-placeholder': t('dateFormatNamePlaceholder', language),
    'date-format-template-label': t('dateFormatTemplateLabel', language),
    'date-format-template-placeholder': t('dateFormatTemplatePlaceholder', language)
  };
  
  // Update text content
  Object.keys(elements).forEach(key => {
    const element = document.querySelector(`[data-i18n="${key}"]`);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // Only update placeholder, never set value for input fields
        if (key.includes('placeholder') || key === 'search-input' || key === 'trigger-input' || key === 'editor-content') {
          element.placeholder = elements[key];
        }
        // Don't set value - let user input remain
      } else if (element.tagName === 'BUTTON') {
        // Handle buttons with spans (like Create button)
        const span = element.querySelector('span[data-i18n]');
        if (span) {
          span.textContent = elements[key];
        } else {
          // Check if button has arrow span, preserve it
          const arrow = element.querySelector('.arrow');
          if (arrow) {
            element.innerHTML = elements[key] + ' ' + arrow.outerHTML;
          } else {
            element.textContent = elements[key];
          }
        }
      } else {
        element.textContent = elements[key];
      }
    }
  });
  
  // Update variable dropdown labels
  const profileSection = document.querySelector('#variable-dropdown .dropdown-section-title');
  if (profileSection) {
    profileSection.textContent = t('profile', language);
  }
  
  // Update custom variables section title
  const customSection = document.querySelector('#custom-variables-dropdown');
  if (customSection && customSection.children.length > 0) {
    const title = customSection.querySelector('.dropdown-section-title');
    if (title) {
      title.textContent = t('custom', language);
    }
  }
  
  // Update about text (multiline)
  const aboutText = document.querySelector('[data-i18n="about-text"]');
  if (aboutText) {
    aboutText.innerHTML = t('aboutText', language).replace(/\n/g, '<br>');
  }
  
  // Update RTL for Arabic
  if (language === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', language);
  }
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
      if (confirm(t('confirmRemove', language, { name: varName }))) {
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
  
  // Save language
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    language = langSelect.value;
  }
  
  const settings = await storage.getSettings();
  settings.profile = profile;
  settings.language = language;
  await storage.saveSettings(settings);
  renderVariableDropdown();
  updateDateDropdownExamples();
  renderCustomDateFormats();
  alert(t('profileSaved', language));
};

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const renderCustomDateFormats = () => {
  const container = document.getElementById('custom-date-formats-container');
  const dropdownContainer = document.getElementById('custom-date-formats-dropdown');
  const section = document.getElementById('custom-date-formats-section');
  if (!container || !dropdownContainer) return;

  const keys = Object.keys(customDateFormats).sort();
  container.innerHTML = keys.map((key) => {
    const template = customDateFormats[key];
    const preview = formatDate(key, language, customDateFormats);
    const safeTemplate = escapeHtml(template);
    const safePreview = escapeHtml(preview);
    return `<div class="form-group custom-date-format-group" data-format-key="${key}">
  <div class="custom-date-format-row">
    <span class="custom-date-format-name">${key}</span>
    <code class="custom-date-format-template">${safeTemplate}</code>
    <span class="custom-date-format-preview">${safePreview}</span>
    <button type="button" class="btn btn-small edit-date-format-btn" data-format-key="${key}">Edit</button>
    <button type="button" class="btn btn-danger btn-small remove-date-format-btn" data-format-key="${key}" aria-label="${escapeHtml(t('removeDateFormat', language))}">Remove</button>
  </div>
</div>`;
  }).join('');

  container.querySelectorAll('.remove-date-format-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleRemoveDateFormat(btn.dataset.formatKey));
  });
  container.querySelectorAll('.edit-date-format-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDateFormatModal(btn.dataset.formatKey));
  });

  dropdownContainer.innerHTML = keys.map((key) => {
    const preview = formatDate(key, language, customDateFormats);
    return `<a href="#" data-format="${key}">${escapeHtml(preview)}</a>`;
  }).join('');

  if (section) {
    const visible = keys.length > 0;
    section.style.display = visible ? 'block' : 'none';
    const prev = section.previousElementSibling;
    if (prev?.classList?.contains('dropdown-divider')) {
      prev.style.display = visible ? 'block' : 'none';
    }
  }
};

const handleRemoveDateFormat = async (key) => {
  if (!confirm(t('confirmRemoveDateFormat', language, { name: key }))) return;
  delete customDateFormats[key];
  const settings = await storage.getSettings();
  settings.customDateFormats = customDateFormats;
  await storage.saveSettings(settings);
  renderCustomDateFormats();
  updateDateDropdownExamples();
};

const openDateFormatModal = (editingKey = null) => {
  const modal = document.getElementById('date-format-modal');
  const titleEl = document.getElementById('date-format-modal-title');
  const nameInput = document.getElementById('date-format-name-input');
  const templateInput = document.getElementById('date-format-template-input');
  if (!modal || !titleEl || !nameInput || !templateInput) return;

  if (editingKey) {
    titleEl.setAttribute('data-i18n', 'date-format-modal-edit-title');
    titleEl.textContent = t('dateFormatModalEdit', language);
    nameInput.value = editingKey;
    nameInput.readOnly = true;
    templateInput.value = customDateFormats[editingKey] || '';
    nameInput.dataset.editingKey = editingKey;
  } else {
    titleEl.setAttribute('data-i18n', 'date-format-modal-title');
    titleEl.textContent = t('dateFormatModalTitle', language);
    nameInput.value = '';
    nameInput.readOnly = false;
    nameInput.removeAttribute('data-editing-key');
    templateInput.value = '';
  }
  modal.classList.add('show');
  (editingKey ? templateInput : nameInput).focus();
};

const closeDateFormatModal = () => {
  document.getElementById('date-format-modal')?.classList.remove('show');
};

const handleSaveDateFormat = async () => {
  const nameInput = document.getElementById('date-format-name-input');
  const templateInput = document.getElementById('date-format-template-input');
  if (!nameInput || !templateInput) return;

  const rawName = nameInput.value.trim();
  const template = templateInput.value.trim();
  const editingKey = nameInput.dataset.editingKey || null;

  if (!template) {
    alert(t('dateFormatTemplateRequired', language));
    return;
  }

  const key = editingKey || rawName;
  if (!key) {
    alert(t('dateFormatNameRequired', language));
    return;
  }

  if (!editingKey) {
    const validName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validName.test(key)) {
      alert(t('dateFormatNameInvalid', language));
      return;
    }
    if (PRESET_DATE_FORMATS.includes(key)) {
      alert(t('dateFormatNameReserved', language));
      return;
    }
    if (customDateFormats[key]) {
      alert(t('dateFormatNameExists', language));
      return;
    }
  }

  try {
    formatDateWithTemplate(template, language);
  } catch (e) {
    alert(t('dateFormatTemplateInvalid', language));
    return;
  }

  customDateFormats[key] = template;
  const settings = await storage.getSettings();
  settings.customDateFormats = customDateFormats;
  await storage.saveSettings(settings);
  closeDateFormatModal();
  renderCustomDateFormats();
  updateDateDropdownExamples();
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
  const searchQuery = (document.getElementById('search-input').value || '').toLowerCase();
  
  let filtered = templates.filter(t => {
    const trigger = (t.trigger || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    const bodyText = (t.bodyText || '').toLowerCase();
    return trigger.includes(searchQuery) || title.includes(searchQuery) || bodyText.includes(searchQuery);
  });
  
  // Apply tag filter
  if (selectedTagFilter && selectedTagFilter !== 'all') {
    filtered = filtered.filter(t => 
      t.tags && t.tags.includes(selectedTagFilter)
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">${t('noTemplatesFound', language)}</div>`;
    return;
  }
  
  list.innerHTML = filtered.map(template => {
    const isSelected = selectedTemplateIds.has(template.id);
    const safeBodyText = template.bodyText || '';
    const preview = safeBodyText.substring(0, 100) + (safeBodyText.length > 100 ? '...' : '');
    const templateTags = template.tags || [];
    
    return `
      <div class="template-card ${isSelected ? 'selected' : ''}" data-id="${template.id}">
        <input type="checkbox" class="template-checkbox" ${isSelected ? 'checked' : ''} data-id="${template.id}">
        <div style="flex: 1;">
          <div class="template-trigger">${template.trigger || ''}</div>
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
      if (confirm(t('confirmRemove', language, { name }))) {
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

const showEditor = () => {
  const editorPanel = document.querySelector('.editor-panel');
  if (editorPanel) {
    editorPanel.classList.add('active');
  }
};

const hideEditor = () => {
  const editorPanel = document.querySelector('.editor-panel');
  if (editorPanel) {
    editorPanel.classList.remove('active');
  }
  currentTemplateId = null;
  // Clear editor
  document.getElementById('trigger-input').value = '';
  document.getElementById('editor-content').innerHTML = '';
  renderEditorTags([]);
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
  showEditor();
  // Focus editor after a short delay to ensure it's visible
  setTimeout(() => {
    document.getElementById('editor-content').focus();
  }, 100);
};

const createNewTemplate = () => {
  currentTemplateId = null;
  document.getElementById('trigger-input').value = '';
  document.getElementById('editor-content').innerHTML = '';
  renderEditorTags([]);
  renderTagSelector(); // Update tag selector
  showEditor();
  // Focus editor after a short delay to ensure it's visible
  setTimeout(() => {
    document.getElementById('editor-content').focus();
  }, 100);
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
  // Hide editor and show templates list
  hideEditor();
  renderTemplates();
};

const discardChanges = () => {
  // Hide editor and show templates list
  hideEditor();
  renderTemplates();
};

const deleteSelectedTemplates = async () => {
  if (selectedTemplateIds.size === 0) {
    alert(t('noTemplatesSelected', language));
    return;
  }

  if (confirm(t('deleteTemplates', language, { count: selectedTemplateIds.size }))) {
    templates = templates.filter(t => !selectedTemplateIds.has(t.id));
    selectedTemplateIds.clear();
    await saveTemplates();
    hideEditor();
    renderTemplates();
  }
};

const exportTemplates = () => {
  if (selectedTemplateIds.size === 0) {
    alert(t('noTemplatesToShare', language));
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
  
  // Ensure editor is focused
  editor.focus();
  
  // Get selection within the editor
  const selection = window.getSelection();
  let range;
  
  // Check if selection is within the editor
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    // Verify the selection is actually in the editor
    if (!editor.contains(range.commonAncestorContainer)) {
      // Selection is not in editor, create new range at end of editor
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // Collapse to end
    }
  } else {
    // No selection, create range at end of editor
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // Collapse to end
  }
  
  // Insert the variable
  range.deleteContents();
  const chip = document.createElement('span');
  chip.className = 'variable-chip';
  chip.contentEditable = 'false';
  chip.textContent = `{{${variable}}}`;
  range.insertNode(chip);
  
  // Move cursor after the inserted chip
  range.setStartAfter(chip);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Ensure editor stays focused
  editor.focus();
};

const updateDateDropdownExamples = () => {
  const dateDropdown = document.getElementById('date-dropdown');
  if (!dateDropdown) return;
  
  const examples = {
    'long': formatDate('long', language),
    'short': formatDate('short', language),
    'iso': formatDate('iso', language),
    'weekday_long': formatDate('weekday_long', language),
    'long_time': formatDate('long_time', language),
    'short_time': formatDate('short_time', language),
    'time_only': formatDate('time_only', language),
    'month_year': formatDate('month_year', language),
    'day_month': formatDate('day_month', language),
    'hijri_long': formatDate('hijri_long', language),
    'hijri_short': formatDate('hijri_short', language),
    'hijri_full': formatDate('hijri_full', language),
    'hijri_weekday': formatDate('hijri_weekday', language)
  };
  
  dateDropdown.querySelectorAll('a[data-format]').forEach((link) => {
    const format = link.dataset.format;
    const text = examples[format] ?? (customDateFormats[format] ? formatDate(format, language, customDateFormats) : null);
    if (text) link.textContent = text;
  });
};

const insertDate = (format) => {
  const editor = document.getElementById('editor-content');
  
  // Ensure editor is focused
  editor.focus();
  
  // Get selection within the editor
  const selection = window.getSelection();
  let range;
  
  // Check if selection is within the editor
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    // Verify the selection is actually in the editor
    if (!editor.contains(range.commonAncestorContainer)) {
      // Selection is not in editor, create new range at end of editor
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // Collapse to end
    }
  } else {
    // No selection, create range at end of editor
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // Collapse to end
  }
  
  // Insert the date variable
  range.deleteContents();
  const chip = document.createElement('span');
  chip.className = 'variable-chip';
  chip.contentEditable = 'false';
  chip.textContent = format === 'long' ? '{{date}}' : `{{date:${format}}}`;
  range.insertNode(chip);
  
  // Move cursor after the inserted chip
  range.setStartAfter(chip);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Ensure editor stays focused
  editor.focus();
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
  const createBtn = document.getElementById('create-btn');
  const createDropdown = document.getElementById('create-dropdown');
  if (createBtn && createDropdown) {
    createBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      createDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#create-btn') && !e.target.closest('#create-dropdown')) {
        createDropdown.classList.remove('show');
      }
    });
  }

  document.getElementById('create-new').addEventListener('click', (e) => {
    e.preventDefault();
    createDropdown?.classList.remove('show');
    createNewTemplate();
  });

  document.getElementById('import-templates').addEventListener('click', (e) => {
    e.preventDefault();
    createDropdown?.classList.remove('show');
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
  
  // Theme selector
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', async () => {
      theme = themeSelect.value;
      const settings = await storage.getSettings();
      settings.theme = theme;
      await storage.saveSettings(settings);
      applyTheme(theme);
    });
  }

  // Listen for system theme change when theme is "system"
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme === 'system') {
      applyTheme('system');
    }
  });

  // Language selector
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.addEventListener('change', async () => {
      language = langSelect.value;
      const settings = await storage.getSettings();
      settings.language = language;
      await storage.saveSettings(settings);
      updateDateDropdownExamples();
      renderCustomDateFormats();
      updateUITranslations();
    });
  }

  // Add custom variable
  document.getElementById('add-variable-btn').addEventListener('click', addCustomVariable);

  // Custom date formats
  document.getElementById('add-date-format-btn')?.addEventListener('click', () => openDateFormatModal());
  document.getElementById('save-date-format-btn')?.addEventListener('click', handleSaveDateFormat);
  document.getElementById('cancel-date-format-btn')?.addEventListener('click', closeDateFormatModal);

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
        e.stopPropagation();
        variableDropdown.classList.remove('show');
        // Small delay to ensure dropdown closes and editor can receive focus
        setTimeout(() => {
          insertVariable(e.target.dataset.variable);
        }, 50);
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
    
    dateDropdown.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-format]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      dateDropdown.classList.remove('show');
      setTimeout(() => insertDate(link.dataset.format), 50);
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
  
  // Show templates list by default; editor opens on create/edit
  hideEditor();
});
