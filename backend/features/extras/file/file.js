import { ipcMain } from "electron";
import { openFile, openFileExplorerPath, openMultipleFiles, openMultipleSimpleFiles, openPwLauncherFile } from "../../../services/file/file.service.js";

ipcMain.handle('open-file', openFile);
ipcMain.handle('open-multiple-simple-files', openMultipleSimpleFiles);
ipcMain.on('open-file-explorer-path', openFileExplorerPath);
ipcMain.handle('open-multiple-files', openMultipleFiles);
ipcMain.handle('open-pw-launcher-file', openPwLauncherFile);

export default {};