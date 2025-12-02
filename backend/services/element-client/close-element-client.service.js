export function closeWindow(pid) {
    try {
        process.kill(pid); // Terminate the process with the given PID
        console.log(`Closed window with PID: ${pid}`);
    } catch (error) {
        console.error(`Error closing window: ${error.message}`);
    }
}

export default {};