import { storage } from '../lib/storage.js';

let templates = [];
let recentTemplates = [];

const loadTemplates = async () => {
  templates = await storage.getTemplates();
  const settings = await storage.getSettings();
  recentTemplates = settings.recentTemplates || [];
  renderTemplates();
};

const saveRecent = async (templateId) => {
  recentTemplates = recentTemplates.filter(id => id !== templateId);
  recentTemplates.unshift(templateId);
  recentTemplates = recentTemplates.slice(0, 5);
  
  const settings = await storage.getSettings();
  settings.recentTemplates = recentTemplates;
  await storage.saveSettings(settings);
};

const insertTemplate = async (template) => {
  await saveRecent(template.id);
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'insertTemplate',
      template
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Content script error:', chrome.runtime.lastError);
        alert('Could not insert template. Please refresh the page and try again.');
        return;
      }
      
      if (response && response.success) {
        window.close();
      } else {
        alert('Could not insert template. Make sure you have a text field focused.');
      }
    });
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
    allList.innerHTML = '<div class="empty-state">No templates found</div>';
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadTemplates();

  document.getElementById('popup-search').addEventListener('input', renderTemplates);

  // Reload when storage changes
  chrome.storage.onChanged.addListener(() => {
    loadTemplates();
  });
});
