import { storage } from '../lib/storage.js';
import { t } from '../lib/translations.js';

let templates = [];
let recentTemplates = [];
let language = 'en';

const getEffectiveTheme = (themeChoice) => {
  if (themeChoice === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeChoice;
};

const loadTemplates = async () => {
  templates = await storage.getTemplates();
  const settings = await storage.getSettings();
  recentTemplates = settings.recentTemplates || [];
  language = settings.language || 'en';
  const theme = settings.theme || 'system';
  const effectiveTheme = getEffectiveTheme(theme);
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  updateUITranslations();
  renderTemplates();
};

const updateUITranslations = () => {
  const elements = {
    'fastKeys': t('fastKeys', language),
    'search-input': t('searchTemplates', language),
    'recent': t('recent', language),
    'allTemplatesPopup': t('allTemplatesPopup', language)
  };

  Object.keys(elements).forEach(key => {
    const element = document.querySelector(`[data-i18n="${key}"]`);
    if (element) {
      if (element.tagName === 'INPUT') {
        element.placeholder = elements[key];
      } else {
        element.textContent = elements[key];
      }
    }
  });

  const settingsBtn = document.getElementById('popup-settings-btn');
  if (settingsBtn) {
    const settingsLabel = t('openSettings', language);
    settingsBtn.setAttribute('aria-label', settingsLabel);
    settingsBtn.setAttribute('title', settingsLabel);
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

const saveRecent = async (templateId) => {
  recentTemplates = recentTemplates.filter(id => id !== templateId);
  recentTemplates.unshift(templateId);
  recentTemplates = recentTemplates.slice(0, 5);
  
  const settings = await storage.getSettings();
  settings.recentTemplates = recentTemplates;
  await storage.saveSettings(settings);
};

const sendInsertMessage = (tabId, template, retryCount = 0) => {
  const onResponse = (response) => {
    if (chrome.runtime.lastError) {
      const errMsg = chrome.runtime.lastError?.message ?? String(chrome.runtime.lastError);
      const isReceivingEndMissing = errMsg && errMsg.includes('Receiving end does not exist');
      if (isReceivingEndMissing && retryCount === 0) {
        injectContentScriptAndRetry(tabId, template);
        return;
      }
      console.error('Content script error:', errMsg);
      alert('Could not insert template. Please refresh the page and try again.');
      return;
    }
    if (response && response.success === false) {
      alert('Could not insert template. Make sure you have a text field focused.');
      return;
    }
    window.close();
  };

  chrome.tabs.sendMessage(tabId, { action: 'insertTemplate', template }, onResponse);
};

const injectContentScriptAndRetry = (tabId, template) => {
  chrome.scripting.executeScript(
    { target: { tabId }, files: ['content/contentScript.js'] },
    (scriptErr) => {
      if (scriptErr) {
        console.error('Failed to inject content script:', scriptErr?.message ?? scriptErr);
        alert('Could not insert template. Please refresh the page and try again.');
        return;
      }
      chrome.scripting.insertCSS(
        { target: { tabId }, files: ['content/injectOverlay.css'] },
        () => {
          sendInsertMessage(tabId, template, 1);
        }
      );
    }
  );
};

const insertTemplate = async (template) => {
  await saveRecent(template.id);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      alert('Could not insert template. Please try again.');
      return;
    }
    sendInsertMessage(tab.id, template);
  } catch (error) {
    console.error('Error inserting template:', error);
    alert('Could not insert template. Please try again.');
  }
};

const renderTemplates = () => {
  const searchQuery = document.getElementById('popup-search').value.toLowerCase();
  const filtered = templates.filter(t => 
    t.trigger.toLowerCase().includes(searchQuery) ||
    (t.title && t.title.toLowerCase().includes(searchQuery)) ||
    t.bodyText.toLowerCase().includes(searchQuery)
  );

  const recentIds = new Set(recentTemplates);
  const recent = filtered.filter(t => recentIds.has(t.id));
  const others = filtered.filter(t => !recentIds.has(t.id));

  const recentList = document.getElementById('recent-templates');
  const allList = document.getElementById('all-templates');

  if (recent.length > 0) {
    recentList.innerHTML = recent.map(t => createTemplateItem(t)).join('');
    document.getElementById('recent-section').style.display = 'block';
  } else {
    document.getElementById('recent-section').style.display = 'none';
  }

  if (others.length > 0) {
    allList.innerHTML = others.map(t => createTemplateItem(t)).join('');
    document.getElementById('all-section').style.display = 'block';
    } else {
      allList.innerHTML = `<div class="empty-state">${t('noTemplatesFound', language)}</div>`;
      document.getElementById('all-section').style.display = 'block';
    }

  document.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const template = templates.find(t => t.id === id);
      if (template) {
        insertTemplate(template);
      }
    });
  });
};

const createTemplateItem = (template) => {
  const preview = template.bodyText.substring(0, 50) + (template.bodyText.length > 50 ? '...' : '');
  return `
    <div class="template-item" data-id="${template.id}">
      <div class="template-item-header">
        <span class="template-trigger">${template.trigger}</span>
      </div>
      <div class="template-preview">${preview}</div>
    </div>
  `;
};

const handleOpenSettings = () => {
  chrome.runtime.openOptionsPage();
  window.close();
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTemplates();

  document.getElementById('popup-search').addEventListener('input', renderTemplates);

  const settingsBtn = document.getElementById('popup-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', handleOpenSettings);
    settingsBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpenSettings();
      }
    });
  }

  // Reload when storage changes
  chrome.storage.onChanged.addListener(() => {
    loadTemplates();
  });
});
