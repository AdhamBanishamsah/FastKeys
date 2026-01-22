// Inline utilities (service workers can't use ES modules in MV3)
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
  async saveTemplates(templates) {
    await this.set({ templates });
  },
  async getTags() {
    const tags = await this.get('tags');
    return tags || [];
  },
  async saveTags(tags) {
    await this.set({ tags });
  }
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Initialize with sample templates if empty
chrome.runtime.onInstalled.addListener(async () => {
  const templates = await storage.getTemplates();
  if (templates.length === 0) {
    const now = Date.now();
    const sampleTemplates = [
      {
        id: generateUUID(),
        trigger: '_thinkcell',
        title: 'ThinkCell License',
        bodyHtml: '<p>ThinkCell lisensnøkkel: <strong>TC-2024-XXXXX-YYYYY</strong></p>',
        bodyText: 'ThinkCell lisensnøkkel: TC-2024-XXXXX-YYYYY',
        tags: ['license'],
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateUUID(),
        trigger: '_vpn',
        title: 'VPN Message',
        bodyHtml: '<p>Hei,</p><p>Jeg trenger tilgang til VPN-tjenesten. Kan du hjelpe meg med dette?</p><p>Takk!</p>',
        bodyText: 'Hei,\n\nJeg trenger tilgang til VPN-tjenesten. Kan du hjelpe meg med dette?\n\nTakk!',
        tags: ['vpn'],
        createdAt: now,
        updatedAt: now
      }
    ];
    await storage.saveTemplates(sampleTemplates);

    const tags = await storage.getTags();
    if (tags.length === 0) {
      await storage.saveTags([
        { name: 'license', color: '#3B82F6' },
        { name: 'vpn', color: '#10B981' }
      ]);
    }
  }
});

// Handle commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-popup') {
    chrome.action.openPopup();
  }
});
