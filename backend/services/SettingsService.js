/**
 * Serviço de persistência de configurações do usuário
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./Logger');

const log = logger.child('SettingsService');

const SETTINGS_FILE_NAME = 'settings.json';

const DEFAULT_SETTINGS = {
    hotkeys: {
        cycle: 'Control+Shift+T',
        toggle: null,
        macro: null
    },
    macro: {
        keys: [],
        focusOnMacro: true,
        backgroundMacro: false,
        interval: 200
    },
    general: {
        autoBackup: true,
        autoBackupOnClose: true
    }
};

class SettingsService {
    constructor(dataFolderPath) {
        this.dataFolderPath = dataFolderPath;
        this.settingsFilePath = path.join(dataFolderPath, SETTINGS_FILE_NAME);
        this.settings = null;
        this.initSettings();
    }

    initSettings() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFilePath)) {
                const data = fs.readFileSync(this.settingsFilePath, 'utf8');
                const loadedSettings = JSON.parse(data);
                // Merge com defaults para garantir que novas configurações existam
                return this.mergeWithDefaults(loadedSettings);
            }
            return { ...DEFAULT_SETTINGS };
        } catch (error) {
            log.error('Falha ao carregar configurações:', error.message);
            return { ...DEFAULT_SETTINGS };
        }
    }

    mergeWithDefaults(loadedSettings) {
        return {
            hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...loadedSettings.hotkeys },
            macro: { ...DEFAULT_SETTINGS.macro, ...loadedSettings.macro },
            general: { ...DEFAULT_SETTINGS.general, ...loadedSettings.general }
        };
    }

    saveSettings(settings) {
        try {
            this.settings = this.mergeWithDefaults(settings);
            const data = JSON.stringify(this.settings, null, 2);
            fs.writeFileSync(this.settingsFilePath, data, 'utf8');
            log.info('Configurações salvas.');
            return { success: true };
        } catch (error) {
            log.error('Falha ao salvar configurações:', error.message);
            return { success: false, error: error.message };
        }
    }

    getSettings() {
        return this.settings;
    }

    getSetting(path) {
        const keys = path.split('.');
        let value = this.settings;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        return value;
    }

    setSetting(path, value) {
        const keys = path.split('.');
        let obj = this.settings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        return this.saveSettings(this.settings);
    }
}

module.exports = { SettingsService, DEFAULT_SETTINGS };
