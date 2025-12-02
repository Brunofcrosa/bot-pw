import { ipcMain } from "electron";
import { openFolder } from "../../../services/open-folder/open-folder.js";

ipcMain.handle('open-folder', openFolder);

export default {};