import log from 'electron-log';

function logError(error) {
    const message = `[${new Date().toISOString()}] ${error.stack || error}\n\n`;
    log.error(message);
}

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

export default {};