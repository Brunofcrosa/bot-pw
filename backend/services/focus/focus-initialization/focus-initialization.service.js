import { spawn } from 'child_process';
import path from 'path';
import { getCurrentWindows, getWebsocketMirror, setRunningProccessBatch, setRunningBackgroundProccessBatch, dirname, setRunningFocusByPidProccess } from '../../../utils/shared-variables/shared-variables.js';

export function startFocusBatchScript() {
    const __dirname = dirname;
    const exePath = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/focus-window-batch.exe') :
        path.join(process.resourcesPath, 'focus-window-batch.exe'); // ajuste o caminho se necessário
    let runningProcess = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true
    });
    runningProcess.stdout.on('data', (data) => {
        const { partiesWindow, minimizedPartyWindow } = getCurrentWindows();
        const websocketMirror = getWebsocketMirror();
        const lines = data.toString().split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
            try {
                const msg = JSON.parse(line);
                console.log(msg);
                if (msg.status === "done" || msg.status === "shutting_down" || msg.status === "cancelled") {
                    console.log('[focus-batch] execução finalizada:', msg.status);
                    if (minimizedPartyWindow) {
                        minimizedPartyWindow.webContents.send('focus-ends', { jobId: msg.jobId, rawFocus: true });
                    } else if (partiesWindow) {
                        partiesWindow.webContents.send('focus-ends', { jobId: msg.jobId, rawFocus: true });
                    }
                    if (websocketMirror) websocketMirror.send(JSON.stringify({ type: 'focus-ends' }));
                } else if (msg.pid) {
                    console.log('[focus-batch callback]', msg.pid);
                    if (minimizedPartyWindow) {
                        minimizedPartyWindow.webContents.send('change-character', { pid: msg.pid, jobId: msg.jobId });
                    } else if (partiesWindow) {
                        partiesWindow.webContents.send('change-character', { pid: msg.pid, jobId: msg.jobId });
                    }
                    if (websocketMirror) websocketMirror.send(JSON.stringify({ type: 'change-character', response: { pid: msg.pid } }));
                } else if (msg.status === "error") {
                    console.error('[focus-batch error]', msg.message);
                }
            } catch (err) {
                console.error('[focus-batch parse error]', err, line);
            }
        }
    });
    setRunningProccessBatch(runningProcess);
}


export function startBackgroundFocusBatchScript() {
    const __dirname = dirname;
    const exePath = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/background-focus-window-batch.exe') :
        path.join(process.resourcesPath, 'background-focus-window-batch.exe'); // ajuste o caminho se necessário
    let runningProcess = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true
    });
    runningProcess.stdout.on('data', (data) => {
        const { partiesWindow, minimizedPartyWindow } = getCurrentWindows();
        const websocketMirror = getWebsocketMirror();
        const lines = data.toString().split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
            try {
                const msg = JSON.parse(line);
                console.log(msg);
                if (msg.status === "done" || msg.status === "shutting_down" || msg.status === "cancelled") {
                    console.log('[focus-batch] execução finalizada:', msg.status);
                    if (minimizedPartyWindow) {
                        minimizedPartyWindow.webContents.send('focus-ends', { jobId: msg.jobId });
                    } else if (partiesWindow) {
                        partiesWindow.webContents.send('focus-ends', { jobId: msg.jobId });
                    }
                    if (websocketMirror) websocketMirror.send(JSON.stringify({ type: 'focus-ends' }));
                } else if (msg.pid) {
                    console.log('[focus-batch callback]', msg.pid);
                    if (minimizedPartyWindow) {
                        minimizedPartyWindow.webContents.send('background-change-character', { pid: msg.pid, jobId: msg.jobId });
                    } else if (partiesWindow) {
                        partiesWindow.webContents.send('change-character', { pid: msg.pid, jobId: msg.jobId });
                    }
                    if (websocketMirror) websocketMirror.send(JSON.stringify({ type: 'change-character', response: { pid: msg.pid } }));
                } else if (msg.status === "error") {
                    console.error('[focus-batch error]', msg.message);
                }
            } catch (err) {
                console.error('[focus-batch parse error]', err, line);
            }
        }
    });
    setRunningBackgroundProccessBatch(runningProcess);
}

export function startFocusByPidScript() {
    const __dirname = dirname;
    const exePath = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/focus-window-by-pid.exe') :
        path.join(process.resourcesPath, 'focus-window-by-pid.exe'); // ajuste o caminho se necessário
    let runningProcess = spawn(exePath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
    });
    setRunningFocusByPidProccess(runningProcess);
}

export default {}
