import { createDecipheriv } from "crypto"
import { createReadStream, createWriteStream, readFileSync } from "fs"
import { PassThrough } from "stream"
import { createUnzip } from "zlib"

const iv = readFileSync('iv.txt')
const secret = readFileSync('secret.enc')
const secretKey = readFileSync('secret.key', 'utf-8').substring(0, 32)
const decrypt = createDecipheriv('aes-256-gcm', secretKey, iv)

const decryptedData = decrypt.update(secret)

var bufferStream = new PassThrough();
bufferStream.end(decryptedData)
bufferStream.pipe(createUnzip())

let sumOfAllNumbers = 0
bufferStream.on('data', function (chunk: string) {
    const stringChunk = chunk.toString()
    for (const char of stringChunk) {
        const possibleNumber = Number.parseInt(char)
        if (!Number.isNaN(possibleNumber)) {
            sumOfAllNumbers += possibleNumber
            continue
        }

        switch (char) {
            case 'a':
                sumOfAllNumbers += 2
                break;
            case 'e':
                sumOfAllNumbers += 4
                break;
            case 'i':
                sumOfAllNumbers += 8
                break;
            case 'o':
                sumOfAllNumbers += 16
                break;
            case 'u':
                sumOfAllNumbers += 32
                break;
            default:
                break;
        }
    }
}).on('end', function () {
    console.log('Sum of all numbers is:', sumOfAllNumbers);
    console.log('Done');
});
