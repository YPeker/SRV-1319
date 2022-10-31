import { createDecipheriv } from "crypto"
import { readFileSync } from "fs"
import { PassThrough } from "stream"
import { createUnzip } from "zlib"
import { createServer } from 'https'

const iv = readFileSync('iv.txt')
const secret = readFileSync('secret.enc')
const secretKey = readFileSync('secret.key', 'utf-8').substring(0, 32)
const decrypt = createDecipheriv('aes-256-gcm', secretKey, iv)

const decryptedData = decrypt.update(secret)

const numberArr: number[] = []
const totalAmountArr: number[] = []
var bufferStream = new PassThrough()
bufferStream.end(decryptedData)
bufferStream.pipe(createUnzip()).on('data', function (chunk) {
    const stringChunk = chunk.toString()
    const sentences = stringChunk.split(/[\.\?\!]/)
    for (const sentence of sentences) {
        let sumOfAllNumbersInSentence = 0
        let sumOfAllLetterValuesInSentence = 0
        for (const char of sentence) {
            const possibleNumber = Number.parseInt(char)
            if (!Number.isNaN(possibleNumber)) {
                sumOfAllNumbersInSentence += possibleNumber
                continue
            }
        
            switch (char) {
                case 'a':
                    sumOfAllLetterValuesInSentence += 2
                    break
                case 'e':
                    sumOfAllLetterValuesInSentence += 4
                    break
                case 'i':
                    sumOfAllLetterValuesInSentence += 8
                    break
                case 'o':
                    sumOfAllLetterValuesInSentence += 16
                    break
                case 'u':
                    sumOfAllLetterValuesInSentence += 32
                    break
                default:
                    break
            }
        }
        totalAmountArr.push(sumOfAllNumbersInSentence+sumOfAllLetterValuesInSentence)
        numberArr.push(sumOfAllNumbersInSentence)
    }
}).on('end', function () {
    const sumOfAllNumbers = totalAmountArr.reduce((previous,current) => previous+current,0)
    let numberArrWithIndex = numberArr.map((value,index) => {return {value, index}})
    numberArrWithIndex.sort((a,b) => b.value-a.value)

    numberArrWithIndex = numberArrWithIndex.slice(0,10)
    numberArrWithIndex.sort((a,b) => a.index-b.index)
    const numbersSubstractedWithIndex= numberArrWithIndex.map(( item, index) =>  item.value- index)

    console.log('Sum of all numbers and letter values is:', sumOfAllNumbers)
    const solution =  String.fromCharCode(...numbersSubstractedWithIndex)

    console.log({solution})
    console.log('Starting web server')
    const options = {
        key: readFileSync('localhost.key'),
        cert: readFileSync('localhost.crt')
      }
      
      createServer(options, function (req, res) {
        res.writeHead(200)
        res.end(solution)
      }).listen(8000)
})


