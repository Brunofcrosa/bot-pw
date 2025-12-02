import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';
import chardet from 'chardet';
import { findFolder } from '../find-folder/find-folder.js';

export function getServerList(exePath) {
    let folderPath = findFolder(exePath, 'patcher');
    let serverListFolder = path.join((folderPath ?? ''), 'server', 'serverlist.txt');
    if (!folderPath || !fs.existsSync(serverListFolder)) {
        folderPath = findFolder(exePath, 'userdata');
        serverListFolder = path.join(folderPath, 'server', 'serverlist.txt');
    }

    const content = readFileWithRightEncode(serverListFolder);
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.endsWith('&2'));

    const result = [];

    for (const line of lines) {
        // Ignora títulos e cabeçalhos (ex: "The Classic PW", "PW Nacional", etc)
        if (!line.includes('\t')) continue;

        const parts = line.split('\t');

        const name = parts[0]?.trim();
        const server = parts[1]?.trim();

        if (name && server) {
            result.push({ name, server });
        }
    }
    return { code: 200, success: true, response: result };
}

function readFileWithRightEncode(filePath) {
    const buffer = fs.readFileSync(filePath);
    const encoding = chardet.detect(buffer) || 'utf8'; // fallback

    console.log(`📎 Encoding detectado: ${encoding}`);

    const content = iconv.decode(buffer, encoding);
    return content;
}
