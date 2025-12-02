import { spawn } from 'child_process'; // Add exec here
import path from 'path';
import { dirname } from '../../utils/shared-variables/shared-variables.js';

export function changeTitle(pid, text) {
    const __dirname = dirname;
    const args = [
        pid.toString(),
        text
    ];

    const exe = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/change-title') :
        path.join(process.resourcesPath, 'change-title.exe');

    let task = spawn(exe, args, {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true
    });
}

export default {}