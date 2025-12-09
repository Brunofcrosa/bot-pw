const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const ACCOUNTS_FILE_SUFFIX = '_accounts.json';
const GROUPS_FILE_SUFFIX = '_groups.json';
const SERVERS_FILE_NAME = 'servers.json';

// Constantes de criptografia
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

class PersistenceService {
    constructor(dataFolderPath) {
        this.dataFolderPath = dataFolderPath;
        this.encryptionKey = null;
        this.initDataFolder();
        this.initEncryptionKey();
    }

    initDataFolder() {
        if (!fs.existsSync(this.dataFolderPath)) {
            fs.mkdirSync(this.dataFolderPath, { recursive: true });
        }
    }

    // Gera uma chave de criptografia baseada no hardware
    initEncryptionKey() {
        const keyFilePath = path.join(this.dataFolderPath, '.key');

        // Identificador único baseado no hardware
        const machineId = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;

        let salt;
        if (fs.existsSync(keyFilePath)) {
            salt = fs.readFileSync(keyFilePath);
        } else {
            salt = crypto.randomBytes(SALT_LENGTH);
            fs.writeFileSync(keyFilePath, salt);
        }

        // Deriva a chave usando PBKDF2
        this.encryptionKey = crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256');
        console.log('Chave de criptografia inicializada.');
    }

    // Criptografa uma senha
    encryptPassword(password) {
        if (!password) return '';

        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

            let encrypted = cipher.update(password, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Formato: iv:authTag:encryptedData
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            console.error('Erro ao criptografar:', error.message);
            return password; // Fallback para senha original em caso de erro
        }
    }

    // Descriptografa uma senha
    decryptPassword(encryptedPassword) {
        if (!encryptedPassword) return '';

        // Se não tem o formato de criptografia, retorna como está (senha antiga não criptografada)
        if (!encryptedPassword.includes(':')) {
            return encryptedPassword;
        }

        try {
            const parts = encryptedPassword.split(':');
            if (parts.length !== 3) return encryptedPassword;

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Erro ao descriptografar:', error.message);
            return encryptedPassword; // Retorna original em caso de erro
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
            console.error('Falha ao carregar servidores:', error.message);
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
            console.error('Falha ao salvar servidores:', error.message);
            return { success: false, error: error.message };
        }
    }

    loadAccounts(serverName) {
        if (!serverName) return [];
        const filePath = this.getAccountsFilePath(serverName);
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const accounts = JSON.parse(data);

                // Descriptografa as senhas ao carregar
                return accounts.map(acc => ({
                    ...acc,
                    password: this.decryptPassword(acc.password)
                }));
            }
            return [];
        } catch (error) {
            console.error(`Falha ao carregar contas para ${serverName}:`, error.message);
            return [];
        }
    }

    saveAccounts(serverName, accounts) {
        if (!serverName) return { success: false, error: 'Server name missing' };
        const filePath = this.getAccountsFilePath(serverName);
        try {
            // Criptografa as senhas antes de salvar
            const encryptedAccounts = accounts.map(acc => ({
                ...acc,
                password: this.encryptPassword(acc.password)
            }));

            const data = JSON.stringify(encryptedAccounts, null, 2);
            fs.writeFileSync(filePath, data, 'utf8');
            return { success: true };
        } catch (error) {
            console.error(`Falha ao salvar contas para ${serverName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    deleteAccountsFile(serverId) {
        if (!serverId) return { success: false, error: 'Server ID missing' };
        const filePath = this.getAccountsFilePath(serverId);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Arquivo de contas para ${serverId} excluído.`);
            }
            return { success: true };
        } catch (error) {
            console.error(`Falha ao excluir arquivo de contas para ${serverId}:`, error.message);
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
            console.error(`Falha ao carregar grupos para ${serverName}:`, error.message);
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
            console.error(`Falha ao salvar grupos para ${serverName}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = { PersistenceService };
