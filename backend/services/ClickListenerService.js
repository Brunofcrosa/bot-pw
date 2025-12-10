const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');

const log = logger.child('ClickListenerService');

class ClickListenerService {
    constructor(executablesPath, windowService) {
        this.executablesPath = executablesPath;
        this.windowService = windowService;
    }

    async getCoordinates(pid) {
        const exePath = path.join(this.executablesPath, 'click-listener-c-v2.exe');

        if (!fs.existsSync(exePath)) {
            log.error(`Executável click-listener-c-v2.exe não encontrado.`);
            return { success: false, error: 'Executável não encontrado' };
        }

        // Tenta focar a janela primeiro
        if (pid) {
            this.windowService.focusWindowByPid(pid);
        }

        return new Promise((resolve) => {
            // --block impede o clique de passar para o jogo (opcional, baseado no código original)
            const params = ['--block'];

            log.info('Iniciando captura de coordenadas...');
            const proc = spawn(exePath, params);

            let captured = false;

            proc.stdout.on('data', (data) => {
                const str = data.toString().trim();
                try {
                    const keyEvent = JSON.parse(str);
                    if (!captured) {
                        captured = true;
                        log.info('Coordenada capturada:', keyEvent);
                        resolve({ success: true, data: keyEvent });
                        proc.kill(); // Encerra após capturar um clique
                    }
                } catch (e) {
                    // Ignore non-json
                }
            });

            proc.on('close', (code) => {
                if (!captured) {
                    resolve({ success: false, error: 'Processo encerrado sem captura' });
                }
            });

            // Timeout de segurança (30s)
            setTimeout(() => {
                if (!captured) {
                    proc.kill();
                    resolve({ success: false, error: 'Timeout' });
                }
            }, 30000);
        });
    }
}

module.exports = { ClickListenerService };
