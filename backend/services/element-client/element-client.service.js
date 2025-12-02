import { spawn } from 'child_process'; // Add exec here
import path from 'path';
import psList from 'ps-list';
import * as settingsHandler from '../storage/settings.storage.js';
import { changeTitle } from './change-title.service.js';
import { openCrashWindow } from '../../../features/element-client/crash-window/crash-window.js';
import { forceSpecificServer, removeForcedServer, resetForceServer } from './force-server.service.js';
import { setCrashState, updatePid } from '../game-session/game-session.service.js';
import { getWindows, dirname } from '../../utils/shared-variables/shared-variables.js';

async function wasReportBug(pid) {
    const processes = await psList();
    const matches = processes.find(p => p.name.toLowerCase() === 'creportbugs.exe' && p.ppid === pid);
    return matches?.pid ?? null;
}

export async function openElementClient({ exePath, login, password, characterName, id, forceServer, argument }) {
    const __dirname = dirname;
    const targetPath = exePath;

    if (forceServer?.enabled) {
        forceSpecificServer(exePath, login, forceServer)
    } else {
        resetForceServer(exePath);
    }

    const args = [
        `exe:${targetPath}`,
        `user:${login}`,
        `pwd:${password}`,
        `role:${characterName}`,
        `extra:startbypatcher${argument ? ` ${argument}` : ''}`,
        `onlyAdd:false`
    ];

    const exe = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/open-element') :
        path.join(process.resourcesPath, 'open-element.exe');

    let task = spawn(exe, args, {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true
    });

    task.stdout.on('data', (data) => {
        console.log('data', data.toString());
        try {
            const { status, pid, exitCode } = JSON.parse(data.toString());
            if (status === "started") {
                startGame(pid, id, characterName);
            }
            if (status === 'error') {
                if (forceServer?.enabled) {
                    removeForcedServer(exePath, login, forceServer)
                }
                gameHasError();
            }
            if (status === 'closed') {
                if (forceServer?.enabled) {
                    removeForcedServer(exePath, login, forceServer)
                }
                gameClosed(pid, id, dirname, exitCode);
            }
        } catch (error) {
            console.log(error);
            gameHasError();
        }

    })
}

function gameHasError() {
    const { mainWindow } = getWindows();
    mainWindow.webContents.send('open-element-response', { success: false, code: 500, response: 'error' });
}

function startGame(pid, id, characterName) {
    console.log("Processo iniciado, PID:", pid);
    const settings = settingsHandler.get().response;
    const { minimizedPartyWindow, mainWindow, partiesWindow, toolsBarWindow } = getWindows();
    updatePid(id, pid);
    setCrashState(id, false);
    mainWindow.webContents.send('open-element-response', { success: true, code: 200, response: { pid: pid, id } });
    if (minimizedPartyWindow) {
        minimizedPartyWindow.webContents.send('open-element-response', { success: true, code: 200, response: { pid: pid, id } });
    }
    if (partiesWindow) {
        partiesWindow.webContents.send('open-element-response', { success: true, code: 200, response: { pid: pid, id } });
    }
    if (toolsBarWindow) {
        toolsBarWindow.webContents.send('open-element-response', { success: true, code: 200, response: { pid: pid, id } });
    }
    if (settings.customElement?.enable && settings.customElement?.changeWindowTitle) {
        setTimeout(() => {
            changeTitle(pid, characterName);
        }, 10000)
    }
}


async function gameClosed(pid, id, dirname, exitCode) {
    const { minimizedPartyWindow, mainWindow, partiesWindow, toolsBarWindow } = getWindows();
    const reportBug = await wasReportBug(pid);
    if (reportBug || (exitCode !== 0 && exitCode !== 1)) {
        if (reportBug) process.kill(reportBug);
        console.log(`Processo levou crash. PID: ${pid}`);
        setCrashState(id, true);
        if (minimizedPartyWindow) {
            minimizedPartyWindow.webContents.send('crash-window', { success: true, code: 500, response: pid });
            partiesWindow.webContents.send('crash-window', { success: true, code: 500, response: pid });
        } else {
            if (partiesWindow) {
                partiesWindow.webContents.send('crash-window', { success: true, code: 500, response: pid });
            } else {
                openCrashWindow(id, dirname);
            }
        }
        mainWindow.webContents.send('crash-window', { success: true, code: 500, response: pid });
        if (toolsBarWindow) {
            toolsBarWindow.webContents.send('crash-window', { success: true, code: 500, response: pid });
        }
    } else {
        console.log(`Processo fechado normalmente. PID: ${pid}`);
        mainWindow.webContents.send('close-element', { success: true, code: 200, response: pid });
    }
}