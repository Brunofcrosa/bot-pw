import fs from 'fs';
import path from 'path';
import CONFIGS from './storage.config.js';
import * as store from '../../utils/store/settings.store.js'

export function get() {
    const filePath = path.join(CONFIGS.filePath, CONFIGS.folderName, CONFIGS.settingsName);
    if (!fs.existsSync(filePath)) {
        console.log('File does not exist:', filePath);
        return { success: false, code: 404 }
    }

    try {
        const rawData = fs.readFileSync(filePath);
        const data = JSON.parse(rawData);
        return { success: true, code: 200, response: data }
    } catch (error) {
        return { success: false, code: 500 }
    }
}

export function set(data) {
    let folderPath = path.join(CONFIGS.filePath, CONFIGS.folderName);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    folderPath = path.join(folderPath, CONFIGS.settingsName);
    try {
        const jsonData = JSON.stringify(data, null, 2);

        fs.writeFileSync(folderPath, jsonData, 'utf-8');
        setSettingsInStore(data);
        return { success: true, code: 200 };
    } catch (error) {
        console.log('Error writing file:', error);
        return { success: false, code: 500 };
    }
}

export function setSettingsInStore(data) {
    if (data) {
        store.set(data);
        return;
    }
    const settings = get();
    if (settings.success) {
        store.set(settings.response);
    }
}

export default {};