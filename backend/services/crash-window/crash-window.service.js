import { getWindows, removeCrashWindow } from "../../utils/shared-variables/shared-variables.js";

export function closeCrashWindow(windowId) {
    const { crashWindows } = getWindows();
    const window = crashWindows.find(w => w.id === Number(windowId));
    if (window) {
        window.destroy();
        removeCrashWindow(window);
    }
}

export default {}