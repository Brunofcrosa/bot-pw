import fs from 'fs';
import path from 'path';
import STORAGE_CONFIGS from '../storage/storage.config.js';
import { getWindows } from '../../utils/shared-variables/shared-variables.js';

function getDefaultFolderPath() {
    return path.join(STORAGE_CONFIGS.filePath, STORAGE_CONFIGS.folderName);
}

export function backup({ backupPath, timestamp, maxBackups = 5 }) {
    try {
        const pastaBackup = path.join(backupPath, `backup-${timestamp.replace(/[:.]/g, '-')}`);

        fs.mkdirSync(pastaBackup, { recursive: true });

        // Copia todos os arquivos JSON da pasta de dados
        const arquivos = fs.readdirSync(getDefaultFolderPath()).filter(a => a.endsWith('.json') && !a.includes('settings'));

        for (const arquivo of arquivos) {
            const origem = path.join(getDefaultFolderPath(), arquivo);
            const destino = path.join(pastaBackup, arquivo);
            fs.copyFileSync(origem, destino);
        }
        // 👉 Limpeza de backups antigos
        const backups = fs.readdirSync(backupPath)
            .filter(nome => nome.startsWith('backup-'))
            .map(nome => ({
                nome,
                caminho: path.join(backupPath, nome),
                ctime: fs.statSync(path.join(backupPath, nome)).ctimeMs
            }))
            .sort((a, b) => a.ctime - b.ctime); // Mais antigos primeiro

        const backupsExcedentes = backups.length - maxBackups;
        if (backupsExcedentes > 0) {
            for (let i = 0; i < backupsExcedentes; i++) {
                fs.rmSync(backups[i].caminho, { recursive: true, force: true });
                console.log(`🗑️ Backup antigo removido: ${backups[i].nome}`);
            }
        }
        return { code: 200, success: true };
    } catch (error) {
        return { code: 500, success: false };
    }
}

export function listBackups(backupPath) {
    const data = fs.readdirSync(backupPath).filter(a => a.startsWith('backup-'));
    const backupDetails = data.map(backup => {
        const backupDir = path.join(backupPath, backup);
        const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
        let accounts = 0, servers = 0, groupAccounts = 0, groups = 0;

        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (file.includes('accounts')) accounts += content.length || 0;
            if (file.includes('servers')) servers += content.length || 0;
            if (file.includes('account-group')) groupAccounts += content.length || 0;
            if (file.includes('parties')) groups += content.length || 0;
        }

        return { backup: backup.split('backup-')[1], accounts, servers, groupAccounts, groups };
    });
    return { code: 200, success: true, response: backupDetails };
}

export function restore(backup, options, backupPath) {
    try {
        const { partiesWindow, minimizedPartyWindow } = getWindows();
        const backupDir = path.join(backupPath, `backup-${backup}`);
        const files = fs.readdirSync(backupDir);

        if (!files.length) return { code: 500, success: false };

        if (options.servers) {
            restoreServers(backupDir, files);
        }

        if (options.accountGroups) {
            restoreAccountGroup(backupDir, files)
        }

        if (options.parties) {
            restoreParties(backupDir, files)
        }

        if (options.accounts) {
            restoreAccounts(backupDir, files)
        }

        if (partiesWindow) {
            partiesWindow.close();
        }
        if (minimizedPartyWindow) {
            minimizedPartyWindow.close();
        }
        return { code: 200, success: true, response: true };
    } catch (error) {
        console.log(error);
        return { code: 500, success: false };
    }
}

function restoreServers(backupDir, files) {
    const servers = files.find(e => e.includes('servers'))
    if (servers) {
        const filePath = path.join(backupDir, servers);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fs.writeFileSync(path.join(getDefaultFolderPath(), servers), JSON.stringify(content, null, 2));
    }
}

function restoreAccountGroup(backupDir, files) {
    const accountGroup = files.find(e => e.includes('account-group'))
    if (accountGroup) {
        const filePath = path.join(backupDir, accountGroup);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fs.writeFileSync(path.join(getDefaultFolderPath(), accountGroup), JSON.stringify(content, null, 2));
    }
}

function restoreParties(backupDir, files) {
    const parties = files.find(e => e.includes('parties'))
    if (parties) {
        const filePath = path.join(backupDir, parties);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fs.writeFileSync(path.join(getDefaultFolderPath(), parties), JSON.stringify(content, null, 2));
    }
}

function restoreAccounts(backupDir, files) {
    const accountsFile = files.find(e => e.includes('accounts'));
    if (accountsFile) {
        const filePath = path.join(backupDir, accountsFile);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const servers = JSON.parse(fs.readFileSync(path.join(getDefaultFolderPath(), 'servers.json'), 'utf-8'));
        const accountGroup = JSON.parse(fs.readFileSync(path.join(getDefaultFolderPath(), 'account-group.json'), 'utf-8'));

        const accounts = content.filter(account => servers.some(server => server.id === account.server_id));
        accounts.forEach(e => {
            if (!accountGroup.some(f => f.id === e.group?.id)) {
                delete e.group;
            }
        });
        fs.writeFileSync(path.join(getDefaultFolderPath(), accountsFile), JSON.stringify(accounts, null, 2));
    }
}

export function getBackupDefaultPath() {
    return { response: path.join(getDefaultFolderPath(), 'backup'), code: 200, success: true }
}

export default {};
