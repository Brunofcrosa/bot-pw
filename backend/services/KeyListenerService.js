const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const { logger } = require('./Logger');

const log = logger.child('KeyListenerService');

class KeyListenerService extends EventEmitter {
    constructor(executablesPath) {
        super();
        this.executablesPath = executablesPath;
        this.process = null;
        this.buffer = '';
    }

    start() {
        if (this.process) return;

        if (process.platform !== 'win32') {
            log.warn('Skipping key listener service: Not running on Windows.');
            return;
        }

        const exePath = path.join(this.executablesPath, 'key-listener.exe');

        const fs = require('fs');
        if (!fs.existsSync(exePath)) {
            log.warn(`Skipping key listener service: Executable not found at ${exePath}`);
            return;
        }

        log.info(`Iniciando serviço de escuta: ${exePath}`);

        try {
            this.process = spawn(exePath);

            this.process.stdout.on('data', (data) => {
                this.handleData(data);
            });

            this.process.stderr.on('data', (data) => {
                log.error(`Error: ${data}`);
            });

            this.process.on('close', (code) => {
                log.info(`Processo encerrado com código ${code}`);
                this.process = null;
            });

        } catch (error) {
            log.error('Falha ao iniciar executável:', error);
        }
    }

    stop() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    handleData(chunk) {
        this.buffer += chunk.toString();

        let boundary = this.buffer.indexOf('\n');

        while (boundary !== -1) {
            const jsonStr = this.buffer.substring(0, boundary).trim();
            this.buffer = this.buffer.substring(boundary + 1);

            if (jsonStr) {
                // DEBUG LOG
                // log.info(`[KeyListener] Raw Data: ${jsonStr}`);

                try {
                    const event = JSON.parse(jsonStr);
                    this.emit('key-event', event);
                } catch (e) {
                    log.debug('Invalid JSON in key event stream:', e.message);
                }
            }
            boundary = this.buffer.indexOf('\n');
        }
    }
}

module.exports = KeyListenerService;
