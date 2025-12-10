const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');

const log = logger.child('AutoForgeService');

class AutoForgeService {
    constructor(executablesPath) {
        this.executablesPath = executablesPath;
        this.process = null;
    }

    start(config, webContents) {
        if (this.process) {
            log.warn('Auto Forge já está rodando.');
            return false;
        }

        const exePath = path.join(this.executablesPath, 'auto-forja.exe');
        if (!fs.existsSync(exePath)) {
            log.error(`Executável auto-forja.exe não encontrado em: ${exePath}`);
            return false;
        }

        try {
            this.process = spawn(exePath, [], {
                stdio: ['pipe', 'pipe', 'ignore'],
                windowsHide: true
            });

            log.info('Processo Auto Forge iniciado.');

            this.process.stdout.on('data', (data) => {
                const lines = data.toString().split(/\r?\n/).filter(Boolean);
                lines.forEach(line => {
                    try {
                        const message = JSON.parse(line);
                        // Repassa eventos para o frontend
                        if (webContents) {
                            webContents.send('auto-forge-event', message);
                        }
                    } catch (error) {
                        log.debug(`Non-JSON output from AutoForge: ${line}`);
                    }
                });
            });

            this.process.on('close', (code) => {
                log.info(`Auto Forge encerrado (Code: ${code})`);
                this.process = null;
                if (webContents) {
                    webContents.send('auto-forge-stop', { code });
                }
            });

            // Envia comando de run inicial
            this.process.stdin.write(JSON.stringify({
                cmd: 'run',
                config
            }) + "\n");

            return true;

        } catch (error) {
            log.error('Erro ao iniciar Auto Forge:', error);
            return false;
        }
    }

    stop() {
        if (this.process) {
            try {
                this.process.stdin.write(JSON.stringify({
                    cmd: 'cancel'
                }) + "\n");
                // Dá um tempo para limpar e mata se necessário
                setTimeout(() => {
                    if (this.process) {
                        this.process.kill();
                        this.process = null;
                    }
                }, 1000);
            } catch (e) {
                if (this.process) this.process.kill();
                this.process = null;
            }
        }
    }

    isRunning() {
        return !!this.process;
    }
}

module.exports = { AutoForgeService };
