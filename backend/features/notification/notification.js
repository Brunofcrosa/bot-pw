import { ipcMain, Notification, shell } from "electron";
import path from 'path';
import { dirname } from "../../utils/shared-variables/shared-variables.js";

ipcMain.on('notification', (event, data) => {
    const __dirname = dirname;
    const notification = new Notification({
        title: data.title,
        body: data.message,
        icon: path.join(__dirname, 'pw-helper-icon.ico'),
    });

    notification.on('click', () => {
        shell.openExternal(data.url)
    })
    notification.show();
});

export default {};