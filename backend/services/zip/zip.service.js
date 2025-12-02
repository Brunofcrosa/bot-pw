import zlib from 'zlib';

export function compactString(code) {
    const compressed = zlib.deflateSync(code);
    return compressed.toString('base64');
}

export function discompactString(base64) {
    const buffer = Buffer.from(base64, 'base64');
    const decompressed = zlib.inflateSync(buffer).toString();
    return decompressed;
}