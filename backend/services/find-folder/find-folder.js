import fs from 'fs';
import path from 'path';

/**
 * Sobe recursivamente até encontrar a pasta-alvo.
 * @param startDir Diretório inicial (ex: o caminho do executável do jogo)
 * @param targetFolder Nome da pasta que queremos encontrar (ex: 'patcher')
 * @returns Caminho completo da pasta se encontrada, ou null
 */
export function findFolder(startDir, targetFolder) {
    let currentDir = startDir;

    while (true) {
        const checkPath = path.join(currentDir, targetFolder);

        if (fs.existsSync(checkPath) && fs.lstatSync(checkPath).isDirectory()) {
            return checkPath;
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break; // chegou na raiz do disco

        currentDir = parentDir;
    }

    return null; // não encontrou
}

export default {};