import { dialog, shell } from 'electron';
import ws from 'windows-shortcuts';
import fs from 'fs';
import path from 'path';

export async function openFile(event, filters = []) {
    return await dialog.showOpenDialog({ properties: ['openFile'], filters }).then(result => {
        if (!result.filePaths.length) {
            return { code: 404, success: true, response: '' };
        }
        const path = result.filePaths[0];
        return { code: 200, success: true, response: path };
    })
}

export async function openMultipleSimpleFiles(event, filters = []) {
    return await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters }).then(result => {
        if (!result.filePaths.length) {
            return { code: 404, success: true, response: '' };
        }
        const paths = result.filePaths;
        return { code: 200, success: true, response: paths };
    })
}

export async function openFileExplorerPath(event, absFolderPath) {
    const folder = path.resolve(absFolderPath);
    const error = await shell.openPath(folder);
    if (error) {
        console.error('Falha ao abrir pasta:', error);
    }
}

function parseArgs(args) {
    const result = {};

    // Substitui todos os espaços invisíveis por espaço normal
    const normalized = args.replace(/[\u00A0\u200B\u200C\u200D]/g, ' ');

    const regex = /\b(user|pwd|role):([^\s]+)/g;
    let match;
    while ((match = regex.exec(normalized)) !== null) {
        const key = match[1];
        const value = match[2];
        result[key] = value;
    }

    return {
        login: result['user'] || '',
        password: result['pwd'] || '',
        character: result['role'] || ''
    };
}

export async function openMultipleFiles(event, filters = []) {
    return await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters }).then(async result => {
        if (!result.filePaths.length) {
            return { code: 404, success: true, response: '' };
        }
        const resultados = await Promise.all(
            result.filePaths.map(caminho => {
                return new Promise((resolve, reject) => {
                    ws.query(caminho, (err, info) => {
                        if (err) return reject(err);
                        const parsed = parseArgs(info.args || '');
                        resolve({
                            target: info.target,
                            args: info.args,
                            parsed
                        });
                    });
                });
            }))
        console.log(resultados)
        return { code: 200, success: true, response: resultados };
    }).catch(err => {
        console.log(err);
        return { code: 500, success: false, response: err.message };
    });
}

export async function openPwLauncherFile(event, filters = []) {
    const result = await dialog.showOpenDialog({
        title: 'Selecione o arquivo do PW Launcher',
        filters: filters,
        properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
        console.log('Nenhum arquivo selecionado.');
        return { code: 500, success: false, response: 'Nenhum arquivo selecionado.' };
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');

    const lines = content.split('¬').filter(Boolean);

    const accounts = lines.map(line => {
        const loginMatch = line.match(/¹(.*?)²/);
        const senhaMatch = line.match(/²³(.*?)£/);
        const personagemMatch = line.match(/£¢(.*)/);

        return {
            login: loginMatch ? loginMatch[1].trim() : '',
            password: senhaMatch ? senhaMatch[1].trim() : '',
            character: personagemMatch ? personagemMatch[1].trim() : ''
        };
    }).filter(e => e.login && e.password);

    console.log(`Conversão concluída! Arquivo salvo em:`, accounts);

    return {
        code: 200,
        success: true,
        response: accounts
    }
}

export default {}