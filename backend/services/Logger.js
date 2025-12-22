/**
 * Sistema de logging estruturado para o backend
 * Substitui console.log por logs formatados com níveis e timestamps
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor(options = {}) {
        this.level = LOG_LEVELS[options.level?.toUpperCase()] ?? LOG_LEVELS.INFO;
        this.serviceName = options.serviceName || 'App';
        this.logToFile = options.logToFile || false;
        this.logDir = options.logDir || path.join(__dirname, '..', 'logs');

        if (this.logToFile && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    _formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${dataStr}`;
    }

    _writeToFile(formattedMessage) {
        if (!this.logToFile) return;

        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `${date}.log`);

        fs.appendFileSync(logFile, formattedMessage + '\n', 'utf8');
    }

    _log(level, levelName, message, data) {
        if (level < this.level) return;

        const formattedMessage = this._formatMessage(levelName, message, data);

        switch (levelName) {
            case 'ERROR':
                console.error(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            default:
                // eslint-disable-next-line no-console
                console.log(formattedMessage);
        }

        this._writeToFile(formattedMessage);
    }

    debug(message, data) {
        this._log(LOG_LEVELS.DEBUG, 'DEBUG', message, data);
    }

    info(message, data) {
        this._log(LOG_LEVELS.INFO, 'INFO', message, data);
    }

    warn(message, data) {
        this._log(LOG_LEVELS.WARN, 'WARN', message, data);
    }

    error(message, data) {
        this._log(LOG_LEVELS.ERROR, 'ERROR', message, data);
    }

    // Cria um logger filho com serviceName diferente
    child(serviceName) {
        return new Logger({
            level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === this.level),
            serviceName,
            logToFile: this.logToFile,
            logDir: this.logDir
        });
    }
}

// Logger global
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'INFO',
    serviceName: 'Main',
    logToFile: true // Always log to file for debugging
});

module.exports = { Logger, logger };
