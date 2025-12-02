import { getRunningFocusByPidProccess, getRunningProccessBatch, getRunningBackgroundProccessBatch, getWindows } from '../../utils/shared-variables/shared-variables.js';

function focusWindow(pid, origin) {
    console.log('focusWindow', pid);
    const scriptRunning = getRunningFocusByPidProccess();
    scriptRunning.stdin.write(`${pid}\n`);
    const { minimizedPartyWindow, toolsBarWindow } = getWindows();
    if (minimizedPartyWindow) {
        minimizedPartyWindow.webContents.send('change-character', { pid });
    }
    if (origin !== 'tools-bar' && toolsBarWindow) {
        toolsBarWindow.webContents.send('change-character', { pid });
    }
}

function focusWindowLote(event, commands, presetId, loop = false) {
    const scriptRunning = getRunningProccessBatch();
    scriptRunning.stdin.write(JSON.stringify({
        type: "execute",
        jobId: presetId,
        commands,
        loop
    }) + "\n")
}

function backgroundFocusWindowLote(event, commands, presetId, loop = false,) {
    const scriptRunning = getRunningBackgroundProccessBatch();
    scriptRunning.stdin.write(JSON.stringify({
        type: "execute",
        jobId: presetId,
        commands,
        loop
    }) + "\n")
}

function cancelExecution(res) {
    const scriptRunning = getRunningProccessBatch();
    const scriptRunningBackground = getRunningBackgroundProccessBatch();
    if (scriptRunning && res.backgroundPreset) {
        scriptRunning.stdin.write(JSON.stringify({ type: 'exit' }) + '\n');
    }
    if (scriptRunningBackground && !res.backgroundPreset) {
        scriptRunningBackground.stdin.write(JSON.stringify({ type: 'cancel', jobId: res.jobId }) + '\n');
    }
}

function cancelAllExecution(res) {
    const scriptRunning = getRunningProccessBatch();
    const scriptRunningBackground = getRunningBackgroundProccessBatch();
    if (scriptRunning) {
        scriptRunning.stdin.write(JSON.stringify({ type: 'exit' }) + '\n');
    }
    if (scriptRunningBackground) {
        res.jobs.forEach((job) => {
            scriptRunningBackground.stdin.write(JSON.stringify({ type: 'cancel', jobId: job }) + '\n');
        })
    }
}

export default { focusWindow, focusWindowLote, cancelExecution, cancelAllExecution, backgroundFocusWindowLote };
