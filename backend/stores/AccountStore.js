const StoreWrapper = require('./StoreWrapper');

class AccountStore {
    constructor() {
        this.stores = new Map();
    }

    getStore(serverId) {
        if (!serverId) throw new Error('Server ID required');

        // Cache stores instances
        if (!this.stores.has(serverId)) {
            const safeName = serverId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const storeName = `${safeName}_accounts`;

            // Habilita criptografia para o arquivo de contas inteiro
            // TODO: Migration logic for existing plain JSON files. For now, disabling encryption to allow reading existing data.
            this.stores.set(serverId, new StoreWrapper(storeName, { encrypted: false }));
        }
        return this.stores.get(serverId);
    }

    getAccounts(serverId) {
        try {
            const store = this.getStore(serverId);
            const accounts = store.get('accounts', []);
            // Decrypt passwords like PersistenceService did
            return accounts.map(acc => ({
                ...acc,
                password: store.decrypt(acc.password)
            }));
        } catch (error) {
            console.error(`Erro ao carregar contas de ${serverId}:`, error);
            return [];
        }
    }

    saveAccounts(serverId, accounts) {
        try {
            const store = this.getStore(serverId);

            // Encrypt passwords before saving
            const encryptedAccounts = accounts.map(acc => ({
                ...acc,
                password: store.encrypt(acc.password)
            }));

            store.set('accounts', encryptedAccounts);
            return { success: true };
        } catch (error) {
            console.error(`Erro ao salvar contas de ${serverId}:`, error);
            return { success: false, error: error.message };
        }
    }

    deleteStore(serverId) {
        try {
            const store = this.getStore(serverId);
            store.clear();
            // Electron-store não tem deleteFile direto exposto fácil, mas clear limpa o conteúdo.
            // Para deletar arquivo seria via fs remove, mas clear resolve funcionalmente.
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AccountStore;
