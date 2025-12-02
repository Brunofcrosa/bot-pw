import { spawn } from "child_process"
import { dirname, getRunningAutoForjaProccess, getWindows, setRunningAutoForjaProccess } from "../../utils/shared-variables/shared-variables.js";
import path from "path";
import * as autoForjaStorage from '../storage/auto-forja.storage.js';

export function play(config) {
    const scriptRunning = getRunningAutoForjaProccess();
    scriptRunning.stdin.write(JSON.stringify({
        cmd: 'run',
        config
    }) + "\n")
}

export function stop(config) {
    const scriptRunning = getRunningAutoForjaProccess();
    scriptRunning.stdin.write(JSON.stringify({
        cmd: 'cancel',
        config
    }) + "\n")
}

export function startScript() {
    const exe = process.env.NODE_ENV === 'development' ?
        path.join(dirname, 'electron/v2/shared/exe/auto-forja') :
        path.join(process.resourcesPath, 'auto-forja.exe');

    let task = spawn(exe, {}, {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true
    });
    const { autoForjaPlayWindow } = getWindows();
    task.stdout.on('data', (data) => {
        const lines = data.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach(line => {
            try {
                const message = JSON.parse(line);
                console.log(message);
                if (message.event.includes('debug')) {
                    autoForjaPlayWindow.webContents.send('auto-forja-debug', message);
                } else {
                    if (message.event === 'runner-stopped') {
                        autoForjaPlayWindow.webContents.send('auto-forja-runner-stopped', message);
                    }
                    if (message.event === 'cycle-start') {
                        autoForjaPlayWindow.webContents.send('auto-forja-cycle-start', message);
                    }
                    if (message.event === 'clicked-max') {
                        autoForjaPlayWindow.webContents.send('auto-forja-clicked-max', message);
                    }
                    if (message.event === 'clicked-start') {
                        autoForjaPlayWindow.webContents.send('auto-forja-clicked-start', message);
                    }
                    if (message.event === 'slot-hover') {
                        autoForjaPlayWindow.webContents.send('auto-forja-slot-hover', message);
                    }
                    if (message.event === 'match') {
                        autoForjaPlayWindow.webContents.send('auto-forja-match', message);
                    }
                    if (message.event === 'slot-identified') {
                        autoForjaPlayWindow.webContents.send('auto-forja-slot-identified', message);
                    }
                    if (message.event === 'cycle-end') {
                        autoForjaPlayWindow.webContents.send('auto-forja-cycle-end', message);
                    }
                }
            } catch (error) {
                console.error(`[Auto-Forja] Failed to parse message: ${line}`);
            }
        });
    });

    setRunningAutoForjaProccess(task);
}

export default {}