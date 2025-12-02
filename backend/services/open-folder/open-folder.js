import { dialog } from 'electron';

export async function openFolder(event) {
    return await dialog.showOpenDialog({
        title: 'Escolha a pasta de backup',
        properties: ['openDirectory', 'createDirectory']
    }).then(result => {
        if (!result.filePaths.length) {
            return { code: 404, success: true, response: '' };
        }
        const path = result.filePaths[0];
        return { code: 200, success: true, response: path };
    })
}

export default {};