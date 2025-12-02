import { ipcMain, shell } from "electron";

ipcMain.on('open-external', (_, url) => shell.openExternal(url));

export default {}