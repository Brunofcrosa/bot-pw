import { spawn } from 'child_process';
import path from 'path';
import { dirname, getScriptClickMirror, getWindows, setScriptClickMirror } from '../../utils/shared-variables/shared-variables.js';
import focusHandle from '../focus/focus.service.js';

export async function getCoordinates(pid, disableClickEvent, origin) {
    const __dirname = dirname;
    const exe = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/click-listener-c-v2.exe') :
        path.join(process.resourcesPath, 'click-listener-c-v2.exe');
    focusHandle.focusWindow(pid);
    if (origin === 'auto-forja') {
        const { autoForjaWindow } = getWindows();
        if (autoForjaWindow) {
            autoForjaWindow.hide();
        }
    }

    return await new Promise(resolve => {
        const params = disableClickEvent ? ['--block'] : [];
        const proc = spawn(exe, params);
        proc.stdout.on('data', (data) => {
            const { partiesWindow, autoForjaWindow } = getWindows();
            const str = data.toString().trim();
            console.log('str Event:', str);
            const keyEvent = JSON.parse(str); // converte JSON
            resolve({ response: keyEvent, success: true, code: 200 });
            setTimeout(() => {
                if (origin === 'party' && partiesWindow) {
                    partiesWindow.show();
                }
                if (origin === 'auto-forja' && autoForjaWindow) {
                    autoForjaWindow.show();
                }
            }, 0)
        })
    })
}

export async function getMirrorCoordinates() {
    const script = getScriptClickMirror();
    if (script) return;
    const __dirname = dirname;
    const exe = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/click-listener-c-v2.exe') :
        path.join(process.resourcesPath, 'click-listener-c-v2.exe');
    const params = ['--loop'];
    const proc = spawn(exe, params);
    setScriptClickMirror(proc);
    proc.stdout.on('data', (data) => {
        const { minimizedPartyWindow } = getWindows();
        const str = data.toString().trim();
        console.log('str Event:', str);
        const keyEvent = JSON.parse(str); // converte JSON
        if (keyEvent.button === 'left') {
            minimizedPartyWindow.webContents.send('click-mirror', { pid: keyEvent.pid, x: keyEvent.client.x, y: keyEvent.client.y });
        };
    })
}

export default {};
