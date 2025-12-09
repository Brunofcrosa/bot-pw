/**
 * Serviço de backup e exportação de configurações
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./Logger');

const log = logger.child('BackupService');

class BackupService {
    constructor(dataPath) {
        this.dataPath = dataPath;
    }

    /**
     * Exporta todas as configurações para um arquivo JSON
     */
    async exportAll() {
        log.info('Iniciando exportação de backup...');
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {}
        };

        const files = ['servers.json', 'settings.json'];

        for (const file of files) {
            const filePath = path.join(this.dataPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    backup.data[file.replace('.json', '')] = JSON.parse(content);
                } catch (e) {
                    log.error(`Erro ao ler arquivo ${file}:`, e);
                }
            }
        }

        // Exporta contas de cada servidor (sem senhas por segurança)
        const serversPath = path.join(this.dataPath, 'servers.json');
        if (fs.existsSync(serversPath)) {
            try {
                const servers = JSON.parse(fs.readFileSync(serversPath, 'utf8'));
                backup.data.accounts = {};

                for (const server of servers) {
                    const accountsPath = path.join(this.dataPath, `${server.id}_accounts.json`);
                    if (fs.existsSync(accountsPath)) {
                        const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
                        // Remove senhas do backup por segurança
                        backup.data.accounts[server.id] = accounts.map(acc => ({
                            ...acc,
                            password: '***ENCRYPTED***'
                        }));
                    }
                }
            } catch (e) {
                log.error('Erro ao processar backup de servers/contas:', e);
            }
        }

        // Exporta grupos
        const groupsFiles = fs.readdirSync(this.dataPath)
            .filter(f => f.endsWith('_groups.json'));

        backup.data.groups = {};
        for (const file of groupsFiles) {
            const serverId = file.replace('_groups.json', '');
            const filePath = path.join(this.dataPath, file);
            try {
                backup.data.groups[serverId] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                log.error(`Erro ao ler grupos do arquivo ${file}:`, e);
            }
        }

        log.info('Exportação de backup concluída.');
        return backup;
    }

    /**
     * Importa configurações de um backup
     * @param {Object} backup - Objeto de backup
     * @param {Object} options - Opções de importação
     */
    async importBackup(backup, options = { overwrite: false }) {
        if (!backup || !backup.data) {
            log.warn('Tentativa de importar backup inválido.');
            return { success: false, error: 'Backup inválido' };
        }

        log.info('Iniciando importação de backup...');
        const results = { imported: [], errors: [] };

        // Importa servidores
        if (backup.data.servers) {
            try {
                const filePath = path.join(this.dataPath, 'servers.json');
                if (options.overwrite || !fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, JSON.stringify(backup.data.servers, null, 2));
                    results.imported.push('servers');
                }
            } catch (e) {
                log.error('Erro ao importar servers:', e);
                results.errors.push({ file: 'servers', error: e.message });
            }
        }

        // Importa grupos
        if (backup.data.groups) {
            for (const [serverId, groups] of Object.entries(backup.data.groups)) {
                try {
                    const filePath = path.join(this.dataPath, `${serverId}_groups.json`);
                    if (options.overwrite || !fs.existsSync(filePath)) {
                        fs.writeFileSync(filePath, JSON.stringify(groups, null, 2));
                        results.imported.push(`groups_${serverId}`);
                    }
                } catch (e) {
                    log.error(`Erro ao importar grupos para ${serverId}:`, e);
                    results.errors.push({ file: `groups_${serverId}`, error: e.message });
                }
            }
        }

        log.info(`Importação concluída. Importados: ${results.imported.length}, Erros: ${results.errors.length}`);
        return {
            success: results.errors.length === 0,
            imported: results.imported,
            errors: results.errors
        };
    }

    /**
     * Cria backup automático
     */
    async createAutoBackup() {
        const backup = await this.exportAll();
        const backupDir = path.join(this.dataPath, 'backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        log.info(`Backup automático criado em: ${backupFile}`);

        // Mantém apenas os últimos 5 backups
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_'))
            .sort()
            .reverse();

        for (let i = 5; i < backups.length; i++) {
            fs.unlinkSync(path.join(backupDir, backups[i]));
            log.info(`Backup antigo removido: ${backups[i]}`);
        }

        return backupFile;
    }
}

module.exports = { BackupService };
