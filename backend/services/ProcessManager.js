const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ProcessManager {
    constructor(executablesPath) {
        this.executablesPath = executablesPath;
        this.runningProcesses = new Map();
        this.runningFocusByPidProcess = null;
        this.runningFocusBatchProcess = null;
        this.runningBackgroundFocusBatchProcess = null;
    }

    _spawnHelper(exeName, onDataCallback) {
        const exePath = path.join(this.executablesPath, exeName);
        if (!fs.existsSync(exePath)) {
            console.error(`[ProcessManager] ` + `Executável '${exeName}' não encontrado em ${exePath}`);
            return null;
        }

        const process = spawn(exePath, [], {
            stdio: ['pipe', 'pipe', 'ignore'],
            windowsHide: true
        });

        process.stdout.on('data', (data) => {
            const lines = data.toString().split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine === '[OK]') {
                    continue;
                }
                try {
                    const msg = JSON.parse(line);
                    if (onDataCallback) onDataCallback(msg);
                } catch (err) {
                    console.warn(`[ProcessManager] ` + `${exeName} output (raw):`, line);
                }
            }
        });

        console.log(`[ProcessManager] ` + `Script C# "${exeName}" iniciado.`);
        return process;
    }

    startFocusBatchScript() {
        this.runningFocusBatchProcess = this._spawnHelper(
            'focus-window-batch.exe',
            (msg) => console.log('[focus-batch]', msg)
        );
    }

    startBackgroundFocusBatchScript() {
        this.runningBackgroundFocusBatchProcess = this._spawnHelper(
            'background-focus-window-batch.exe',
            (msg) => console.log('[background-focus-batch]', msg)
        );
    }

    startFocusByPidScript() {
        this.runningFocusByPidProcess = this._spawnHelper('focus-window-by-pid.exe');
    }

    startFocusHelpers() {
        this.startFocusBatchScript();
        this.startBackgroundFocusBatchScript();
        this.startFocusByPidScript();
    }

    sendFocusPid(pid) {
        if (!pid) {
            console.warn(`[ProcessManager] ` + 'sendFocusPid chamado sem PID.');
            return;
        }
        if (this.runningFocusByPidProcess && this.runningFocusByPidProcess.stdin) {
            console.log(`[ProcessManager] ` + `Solicitando foco (via C#) para PID: ${pid}`);
            this.runningFocusByPidProcess.stdin.write(`${pid}\n`);
        } else {
            console.error(`[ProcessManager] ` + 'Erro: "focus-window-by-pid.exe" não está rodando.');
        }
    }

    launchGame(args, webContents) {
        const exeHelperPath = path.join(this.executablesPath, 'open-element.exe');
        const spawnArgs = [
            `exe:${args.exePath}`,
            `user:${args.login}`,
            `pwd:${args.password}`,
            `role:${args.characterName}`,
            `extra:startbypatcher${args.argument ? ` ${args.argument}` : ''}`,
            `onlyAdd:false`
        ];

        try {
            const exeDir = path.dirname(exeHelperPath);
            const child = spawn(exeHelperPath, spawnArgs, {
                stdio: ['pipe', 'pipe', 'ignore'],
                windowsHide: true,
                cwd: exeDir
            });

            this.runningProcesses.set(args.id, child);

            child.stdout.on('data', (data) => {
                console.log(`[Launcher Helper]: ${data.toString()}`);
                try {
                    const { status, pid } = JSON.parse(data.toString());
                    if (status === "started" && pid && webContents) {
                        console.log(`[ProcessManager] ` + `Jogo iniciado com PID: ${pid}. ID da Conta: ${args.id}`);
                        webContents.send('element-opened', { success: true, pid: pid, accountId: args.id });
                    }
                } catch (e) {
                    console.warn(`[ProcessManager] ` + 'Não foi possível parsear stdout do helper:', data.toString());
                }
            });

            child.on('error', (err) => {
                console.error(`[ProcessManager] ` + `Falha ao iniciar processo helper (conta ${args.id}):`, err);
                this.runningProcesses.delete(args.id);
            });

            child.on('close', (code) => {
                console.log(`[ProcessManager] ` + `Processo helper (conta ${args.id}) fechado com código ${code}`);
                this.runningProcesses.delete(args.id);
                if (webContents) {
                    webContents.send('element-closed', { success: true, accountId: args.id });
                }
            });

            return { success: true, pid: child.pid, accountId: args.id };

        } catch (error) {
            console.error(`[ProcessManager] ` + 'Falha ao executar launchGame:', error);
            return { success: false, error: error.message };
        }
    }

    killGameByPid(pid) {
        try {
            process.kill(pid);
            console.log(`[ProcessManager] ` + `Processo ${pid} finalizado.`);

            for (const [id, child] of this.runningProcesses.entries()) {
                if (child.pid === pid) {
                    this.runningProcesses.delete(id);
                    break;
                }
            }
            return { success: true, closedPid: pid };
        } catch (error) {
            console.error(`[ProcessManager] ` + `Falha ao finalizar processo ${pid}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    killAll() {
        this.runningProcesses.forEach((child) => child.kill());
        if (this.runningFocusBatchProcess) this.runningFocusBatchProcess.kill();
        if (this.runningBackgroundFocusBatchProcess) this.runningBackgroundFocusBatchProcess.kill();
        if (this.runningFocusByPidProcess) this.runningFocusByPidProcess.kill();
        console.log(`[ProcessManager] ` + 'Processos auxiliares e de jogo encerrados.');
    }
}

module.exports = { ProcessManager };
