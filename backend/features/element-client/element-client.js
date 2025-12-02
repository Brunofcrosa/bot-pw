import { ipcMain } from "electron";
import { openElementClient } from "../../services/element-client/element-client.service.js";
import { getServerList } from "../../services/element-client/get-servers-list.service.js";
import { closeCrashWindow } from "../../services/crash-window/crash-window.service.js";
import { closeWindow } from "../../services/element-client/close-element-client.service.js";
// Removi checkUpdate e openLauncher se não existirem nos seus serviços atuais, 
// ou ajuste o caminho se você tiver esses arquivos.
// import { checkUpdate, openLauncher } from "../../services/element-client/check-update.service.js";

ipcMain.on('open-element', (_, data) => openElementClient(data));
ipcMain.handle('get-pw-server-list', (_, exePath) => getServerList(exePath));
ipcMain.on('close-crash-window', (_, id) => closeCrashWindow(id));
ipcMain.on('close-element', (_, pid) => closeWindow(pid));
// ipcMain.handle('check-update', (_, serverId, executablePath) => checkUpdate(serverId, executablePath));
// ipcMain.handle('open-launcher', (_, executablePath) => openLauncher(executablePath));

export default {};