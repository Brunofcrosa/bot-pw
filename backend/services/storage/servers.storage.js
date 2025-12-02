import fs from 'fs';
import path from 'path';
import CONFIGS from './storage.config.js';

export function get() {
    const filePath = path.join(CONFIGS.filePath, CONFIGS.folderName, CONFIGS.serversName);
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
    folderPath = path.join(folderPath, CONFIGS.serversName);
    try {
        const jsonData = JSON.stringify(data, null, 2);

        fs.writeFileSync(folderPath, jsonData, 'utf-8');
        return { success: true, code: 200 };
    } catch (error) {
        return { success: false, code: 500 };
    }
}

export default {}