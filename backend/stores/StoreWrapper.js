const Store = require('electron-store');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

class StoreWrapper {
    constructor(name, options = {}) {
        this.encryptionKey = this.getEncryptionKey();

        // Configuração padrão
        const defaults = {
            name: name,
            fileExtension: 'json',
            cwd: path.join(process.cwd(), 'backend', 'data'), // Mantendo compatibilidade com diretório de dados
            encryptionKey: options.encrypted ? this.encryptionKey : undefined,
            clearInvalidConfig: true,
            ...options
        };

        this.store = new Store(defaults);
    }

    // Derivação de chave baseada em hardware (Mesma lógica do PersistenceService para manter consistência)
    getEncryptionKey() {
        try {
            const dataPath = path.join(process.cwd(), 'backend', 'data');
            if (!fs.existsSync(dataPath)) {
                fs.mkdirSync(dataPath, { recursive: true });
            }
            const keyFilePath = path.join(dataPath, '.key');

            const machineId = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;

            let salt;
            if (fs.existsSync(keyFilePath)) {
                salt = fs.readFileSync(keyFilePath);
            } else {
                salt = crypto.randomBytes(32);
                fs.writeFileSync(keyFilePath, salt);
            }

            // Retorna string hex para o electron-store
            return crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256').toString('hex');
        } catch (error) {
            console.error('Erro ao gerar chave de criptografia:', error);
            return 'fallback-secret-key';
        }
    }

    get(key, defaultValue) {
        return this.store.get(key, defaultValue);
    }

    set(key, value) {
        this.store.set(key, value);
    }

    delete(key) {
        this.store.delete(key);
    }

    has(key) {
        return this.store.has(key);
    }

    clear() {
        this.store.clear();
    }

    get path() {
        return this.store.path;
    }

    // Helper methods for field-level encryption (ported from PersistenceService)
    encrypt(text) {
        if (!text) return '';
        try {
            const iv = crypto.randomBytes(16);
            // Derive key from the stored hex string or use it directly if it's already buffer-compatible
            // PersistenceService used crypto.scrypt or similar? No, it used pbkdf2Sync returning a key Buffer.
            // My getEncryptionKey returns a HEX string.
            // createCipheriv needs Key as Buffer or string. 
            // Let's ensure we use the Buffer key. 
            // Re-deriving or converting hex to buffer:
            const keyBuffer = Buffer.from(this.encryptionKey, 'hex');

            const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            console.error('Encryption error:', error);
            return text;
        }
    }

    decrypt(encryptedText) {
        if (!encryptedText) return '';
        if (!encryptedText.includes(':')) return encryptedText; // Not encrypted

        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) return encryptedText;

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const keyBuffer = Buffer.from(this.encryptionKey, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return encryptedText;
        }
    }
}

module.exports = StoreWrapper;
