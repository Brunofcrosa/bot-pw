import { ipcMain } from "electron";
import focusHandle from "../../services/focus/focus.service.js";
import { getCoordinates, getMirrorCoordinates } from "../../services/get-coordinates/get-coordinates.service.js";
import { compactString, discompactString } from '../../services/zip/zip.service.js';
import { getScriptClickMirror, setScriptClickMirror } from "../../utils/shared-variables/shared-variables.js";

ipcMain.on('start-preset-party', (event, commands, presetId, loop) => focusHandle.focusWindowLote(event, commands, presetId, loop));
ipcMain.on('start-background-preset-party', (event, commands, presetId, loop) => focusHandle.backgroundFocusWindowLote(event, commands, presetId, loop));
ipcMain.on('focus-window', (event, pid, origin) => focusHandle.focusWindow(pid, origin));
ipcMain.on('stop-preset-party', (event, res) => focusHandle.cancelExecution(res));

ipcMain.handle('listen-click', async (event, pid, disableClickEvent, origin) => {
    const res = await getCoordinates(pid, disableClickEvent, origin);
    return res;
})

ipcMain.on('listen-click-mirror', async (event) => {
    getMirrorCoordinates();
})

ipcMain.on('stop-listen-click-mirror', async (event) => {
    const script = getScriptClickMirror();
    if (script) {
        script.kill();
        setScriptClickMirror(null);
    }
})

ipcMain.handle('compact-code', (event, code) => {
    return { code: 200, response: compactString(code), success: true };
})
ipcMain.handle('discompact-code', (event, code) => {
    try {
        return { code: 200, response: discompactString(code), success: true };
    } catch (error) {
        return { code: 500, response: null, success: false };
    }
});

export default {}