export const storage = {
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

  async getAll() {
    try {
      return await chrome.storage.sync.get(null);
    } catch (error) {
      console.warn('Sync storage failed, falling back to local:', error);
      return await chrome.storage.local.get(null);
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
  },

  async getSettings() {
    const settings = await this.get('settings');
    return settings || { profile: {} };
  },

  async saveSettings(settings) {
    await this.set({ settings });
  }
};
