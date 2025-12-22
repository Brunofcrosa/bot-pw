const { logger } = require('../services/Logger');
const log = logger.child('MacroStore');

class MacroStore {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }

    getPresets() {
        return this.settingsService.getSetting('macro.presets') || [];
    }

    savePresets(presets) {
        return this.settingsService.setSetting('macro.presets', presets);
    }

    addPreset(preset) {
        const current = this.getPresets();
        const updated = [...current, preset];
        return this.savePresets(updated);
    }

    removePreset(id) {
        const current = this.getPresets();
        const updated = current.filter(p => p.id !== id);
        return this.savePresets(updated);
    }

    updatePreset(id, updates) {
        const current = this.getPresets();
        const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
        return this.savePresets(updated);
    }
}

module.exports = MacroStore;
