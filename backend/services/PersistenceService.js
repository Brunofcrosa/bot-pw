const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE_SUFFIX = '_accounts.json';
const GROUPS_FILE_SUFFIX = '_groups.json';
const SERVERS_FILE_NAME = 'servers.json';

class PersistenceService {
    constructor(dataFolderPath) {
        this.dataFolderPath = dataFolderPath;
        this.initDataFolder();
    }

    initDataFolder() {
        if (!fs.existsSync(this.dataFolderPath)) {
            fs.mkdirSync(this.dataFolderPath, { recursive: true });
        }
    }

    getServersFilePath() {
        return path.join(this.dataFolderPath, SERVERS_FILE_NAME);
    }

    getAccountsFilePath(serverName) {
        const safeServerName = serverName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return path.join(this.dataFolderPath, `${safeServerName}${ACCOUNTS_FILE_SUFFIX}`);
    }

    getGroupsFilePath(serverName) {
        const safeServerName = serverName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return path.join(this.dataFolderPath, `${safeServerName}${GROUPS_FILE_SUFFIX}`);
    }

    loadServers() {
        const filePath = this.getServersFilePath();
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
            return [{ id: 'default', name: 'Servidor Padrão' }];
        } catch (error) {
            console.error(`[Persistence] Falha ao carregar servidores:`, error.message);
            return [{ id: 'default', name: 'Servidor Padrão' }];
        }
    }

    saveServers(servers) {
        const filePath = this.getServersFilePath();
        try {
            const data = JSON.stringify(servers, null, 2);
            fs.writeFileSync(filePath, data, 'utf8');
            return { success: true };
        } catch (error) {
            console.error(`[Persistence] Falha ao salvar servidores:`, error.message);
            return { success: false, error: error.message };
        }
    }

    loadAccounts(serverName) {
        if (!serverName) return [];
        const filePath = this.getAccountsFilePath(serverName);
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error(`[Persistence] Falha ao carregar contas para ${serverName}:`, error.message);
            return [];
        }
    }

    saveAccounts(serverName, accounts) {
        if (!serverName) return { success: false, error: 'Server name missing' };
        const filePath = this.getAccountsFilePath(serverName);
        try {
            const data = JSON.stringify(accounts, null, 2);
            fs.writeFileSync(filePath, data, 'utf8');
            return { success: true };
        } catch (error) {
            console.error(`[Persistence] Falha ao salvar contas para ${serverName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    deleteAccountsFile(serverId) {
        if (!serverId) return { success: false, error: 'Server ID missing' };
        const filePath = this.getAccountsFilePath(serverId);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[Persistence] Arquivo de contas para ${serverId} excluído.`);
            }
            return { success: true };
        } catch (error) {
            console.error(`[Persistence] Falha ao excluir arquivo de contas para ${serverId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    loadGroups(serverName) {
        if (!serverName) return [];
        const filePath = this.getGroupsFilePath(serverName);
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error(`[Persistence] Falha ao carregar grupos para ${serverName}:`, error.message);
            return [];
        }
    }

    saveGroups(serverName, groups) {
        if (!serverName) return { success: false, error: 'Server name missing' };
        const filePath = this.getGroupsFilePath(serverName);
        try {
            const data = JSON.stringify(groups, null, 2);
            fs.writeFileSync(filePath, data, 'utf8');
            return { success: true };
        } catch (error) {
            console.error(`[Persistence] Falha ao salvar grupos para ${serverName}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = { PersistenceService };