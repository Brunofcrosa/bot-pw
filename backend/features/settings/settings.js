import { ipcMain, app } from "electron";

ipcMain.on('enable-start-with-windows', (event) => {
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe'),
        args: ['--auto-launch']
    });
});
ipcMain.on('disable-start-with-windows', (event) => {
    app.setLoginItemSettings({ openAtLogin: false });
});

export default {}