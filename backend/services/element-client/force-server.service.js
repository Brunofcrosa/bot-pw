import path from 'path';
import { findFolder } from "../find-folder/find-folder.js";
import fs from 'fs';

export function forceSpecificServer(exePath, login, forceServer) {
    const folderPath = findFolder(exePath, 'userdata');
    if (!folderPath) {
        console.error('Pasta userdata não encontrada!');
        return;
    }
    const serverList = [];
    if (!serverList) {
        console.error('Lista de servidores não encontrada!');
        return;
    }
    const accountsFilePath = path.join(folderPath, 'accounts.txt');
    let hasContent;
    if (!fs.existsSync(accountsFilePath)) {
        hasContent = '';
        fs.writeFileSync(accountsFilePath, '');
    } else {
        hasContent = fs.readFileSync(accountsFilePath, 'utf-8');
    }
    const serverEncoded = encodeAccountLineToBase64(`${login} ${forceServer.server},${forceServer.name},${forceServer.index}`);
    const text = `${!hasContent.trim() ? `\ntrue` : ''}\n${serverEncoded.part1} ${serverEncoded.part2}`;
    fs.chmodSync(accountsFilePath, 0o666);
    fs.appendFileSync(accountsFilePath, text);

    const currentServerIni = path.join(folderPath, 'currentserver.ini');
    if (!fs.existsSync(currentServerIni)) {
        fs.writeFileSync(currentServerIni, '');
    }
    fs.chmodSync(currentServerIni, 0o666);
    const textIniFile = `[Server]\nCurrentServer=${forceServer.name}\nCurrentServerAddress=${forceServer.server}\nCurrentLine=${forceServer.index}\n`;
    fs.writeFileSync(currentServerIni, textIniFile);
}

export function resetForceServer(exePath) {
    const folderPath = findFolder(exePath, 'userdata');
    const accountsFilePath = path.join(folderPath, 'accounts.txt');
    const currentServerIni = path.join(folderPath, 'currentserver.ini');
    if (!fs.existsSync(accountsFilePath)) {
        fs.writeFileSync(accountsFilePath, 'false');
    }
    fs.writeFileSync(currentServerIni, '');
    fs.chmodSync(accountsFilePath, 0o666);
    fs.writeFileSync(accountsFilePath, 'false');
}

export function removeForcedServer(exePath, login, forceServer) {
    const folderPath = findFolder(exePath, 'userdata');
    const accountsFilePath = path.join(folderPath, 'accounts.txt');
    const hasContent = fs.readFileSync(accountsFilePath, 'utf-8');
    fs.chmodSync(accountsFilePath, 0o666);
    const serverEncoded = encodeAccountLineToBase64(`${login} ${forceServer.server},${forceServer.name},${forceServer.index}`);
    const regex = new RegExp(`${serverEncoded.part1}\\s+[A-Za-z0-9+/=]+\\r?\\n?`, 'g');

    const newContent = hasContent.replace(regex, '');
    fs.writeFileSync(accountsFilePath, newContent.trim());
}


function encodeAccountLineToBase64(input) {
    const [login, ...rest] = input.split(" ");
    const restString = rest.join(" ");

    const part1 = Buffer.from(login, "utf16le").toString("base64");
    const part2 = Buffer.from(restString, "utf16le").toString("base64");

    return { part1, part2 };
}

export default {}