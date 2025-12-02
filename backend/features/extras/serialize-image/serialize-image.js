import { ipcMain } from "electron";
import { serializeImage } from "../../../services/serialize-image/serialize-image.js";

ipcMain.handle('serialize-image', serializeImage);

export default {};