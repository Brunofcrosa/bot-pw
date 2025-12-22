const StoreWrapper = require('./StoreWrapper');

class ServerStore extends StoreWrapper {
    constructor() {
        super('servers', {
            defaults: {
                servers: [{ id: 'default', name: 'Servidor Padrão' }]
            }
        });
    }

    getServers() {
        return this.get('servers');
    }

    saveServers(servers) {
        this.set('servers', servers);
        return { success: true };
    }
}

module.exports = ServerStore;
