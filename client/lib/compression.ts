const Buffer = require('buffer').Buffer
const zlib = require('zlib')

export function gzip(str: string){
    const content = encodeURIComponent(str)
    const result = zlib.gzipSync(content)
    const value = result.toString('base64')
    return value
}

export function unzip(value: string){
    const buffer = Buffer.from(value, 'base64')
    const result = zlib.unzipSync(buffer)
    const str = decodeURIComponent(result).toString() // Add 'utf-8' argument if necessary
    return str
}
