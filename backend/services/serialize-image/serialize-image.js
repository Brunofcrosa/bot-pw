import { nativeImage } from 'electron';

export function serializeImage(event, filePath) {
    const image = nativeImage.createFromPath(filePath);
    if (!image.isEmpty()) {
        return { code: 200, response: image.toDataURL(), success: true }
    } else {
        return { code: 404, response: null, success: false };
    }
}

export default {};