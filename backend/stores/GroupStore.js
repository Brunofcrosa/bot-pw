const StoreWrapper = require('./StoreWrapper');

class GroupStore {
    constructor() {
        this.stores = new Map();
    }

    getStore(serverId) {
        if (!serverId) throw new Error('Server ID required');

        if (!this.stores.has(serverId)) {
            const safeName = serverId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const storeName = `${safeName}_groups`;
            this.stores.set(serverId, new StoreWrapper(storeName)); // Grupos não precisam ser criptografados
        }
        return this.stores.get(serverId);
    }

    getGroups(serverId) {
        try {
            const store = this.getStore(serverId);
            return store.get('groups', []);
        } catch (error) {
            console.error(`Erro ao carregar grupos de ${serverId}:`, error);
            return [];
        }
    }

    saveGroups(serverId, groups) {
        try {
            const store = this.getStore(serverId);

            // Limpa null/undefined values dos arrays de accountIds
            const cleanedGroups = groups.map(g => ({
                ...g,
                accountIds: g.accountIds ? g.accountIds.filter(id => id != null) : []
            }));

            store.set('groups', cleanedGroups);
            return { success: true };
        } catch (error) {
            console.error(`Erro ao salvar grupos de ${serverId}:`, error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = GroupStore;
