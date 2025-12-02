import path from 'path';
import dotenv from 'dotenv';

function setEnvironmentConfig(dirname) {
    const envPath = path.join(dirname, '.env');
    dotenv.config({
        path: envPath
    });
}

export default setEnvironmentConfig;