const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');

const log = logger.child('TitleChangerService');

class TitleChangerService {
    constructor(executablesPath) {
        this.executablesPath = executablesPath;
    }

    changeTitle(pid, newTitle) {
        const exePath = path.join(this.executablesPath, 'change-title.exe');

        if (!fs.existsSync(exePath)) {
            log.error(`Executável change-title.exe não encontrado em: ${exePath}`);
            return false;
        }

        const args = [String(pid), newTitle];

        log.info(`Alterando título da janela (PID: ${pid}) para: "${newTitle}"`);

        // Quote the path to handle spaces when using shell: true
        const process = spawn(`"${exePath}"`, args, {
            windowsHide: true,
            shell: true // REQUIRED for Admin/Elevation (UAC)
        });

        process.stdout.on('data', (data) => {
            log.debug(`[change-title]: ${data.toString().trim()}`);
        });

        process.stderr.on('data', (data) => {
            log.error(`[change-title error]: ${data.toString().trim()}`);
        });

        process.on('error', (err) => {
            log.error(`Erro ao executar change-title: ${err.message}`);
        });

        process.on('close', (code) => {
            if (code !== 0) {
                log.warn(`change-title encerrou com código: ${code}`);
            } else {
                log.debug(`Título alterado com sucesso.`);
            }
        });

        return true;
    }
}

module.exports = { TitleChangerService };
