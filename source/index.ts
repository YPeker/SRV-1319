import { createDecipheriv  } from "crypto"
import { createWriteStream, readFileSync } from "fs"
import { PassThrough } from "stream"
import { createUnzip } from "zlib"

const iv = readFileSync('iv.txt')
const secret = readFileSync('secret.enc')
const secretKey = readFileSync('secret.key', 'utf-8').substring(0, 32)
const decrypt = createDecipheriv('aes-256-gcm', secretKey, iv)

const decryptedData = decrypt.update(secret)

const fileStreamOut = createWriteStream('clear.txt')
var bufferStream = new PassThrough();
bufferStream.end(decryptedData)
bufferStream.pipe(createUnzip()).pipe(fileStreamOut)
console.log('Done.')
