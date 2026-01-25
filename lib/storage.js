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
    try {
      const [syncResult, localResult] = await Promise.all([
        chrome.storage.sync.get('templates').catch(() => ({})),
        chrome.storage.local.get('templates').catch(() => ({}))
      ]);
      const syncTemplates = syncResult.templates || [];
      const localTemplates = localResult.templates || [];
      if (syncTemplates.length === 0 && localTemplates.length > 0) {
        return localTemplates;
      }
      if (localTemplates.length === 0) {
        return syncTemplates;
      }
      const merged = new Map();
      syncTemplates.forEach(t => merged.set(t.id, t));
      localTemplates.forEach(t => {
        if (!merged.has(t.id)) merged.set(t.id, t);
      });
      return Array.from(merged.values());
    } catch (error) {
      console.warn('Storage read failed, returning empty templates:', error);
      return [];
    }
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
