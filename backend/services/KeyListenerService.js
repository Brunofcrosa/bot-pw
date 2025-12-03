// backend/services/KeyListenerService.js
const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

class KeyListenerService extends EventEmitter {
    constructor(executablesPath) {
        super();
        this.executablesPath = executablesPath;
        this.process = null;
        this.buffer = ''; // Para lidar com fragmentação de dados do stdout
    }

    start() {
        if (this.process) return;

        // Check if platform is Windows
        if (process.platform !== 'win32') {
            console.warn('[KeyListener] Skipping key listener service: Not running on Windows.');
            return;
        }

        // Caminho para o executável fornecido pelo usuário
        const exePath = path.join(this.executablesPath, 'key-listener.exe');
        
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(exePath)) {
            console.warn(`[KeyListener] Skipping key listener service: Executable not found at ${exePath}`);
            return;
        }

        console.log(`[KeyListener] Iniciando serviço de escuta: ${exePath}`);

        try {
            this.process = spawn(exePath);

            this.process.stdout.on('data', (data) => {
                this.handleData(data);
            });

            this.process.stderr.on('data', (data) => {
                console.error(`[KeyListener Error] ${data}`);
            });

            this.process.on('close', (code) => {
                console.log(`[KeyListener] Processo encerrado com código ${code}`);
                this.process = null;
                // Opcional: Reiniciar automaticamente se cair inesperadamente
                // setTimeout(() => this.start(), 1000); 
            });

        } catch (error) {
            console.error('[KeyListener] Falha ao iniciar executável:', error);
        }
    }

    stop() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    handleData(chunk) {
        // Concatena o chunk atual ao buffer
        this.buffer += chunk.toString();

        // Tenta encontrar quebras de linha que indicam fim de um JSON
        let boundary = this.buffer.indexOf('\n');
        
        while (boundary !== -1) {
            const jsonStr = this.buffer.substring(0, boundary).trim();
            this.buffer = this.buffer.substring(boundary + 1);

            if (jsonStr) {
                try {
                    const event = JSON.parse(jsonStr);
                    // Emite o evento para quem estiver ouvindo (MacroService)
                    // Formato esperado do exe: { state: 'down'|'up', vk: 123, ... }
                    this.emit('key-event', event);
                } catch (e) {
                    // Ignora linhas que não são JSON válidos
                }
            }
            boundary = this.buffer.indexOf('\n');
        }
    }
}

module.exports = KeyListenerService;