import { parse } from 'csv-parse'
import { createReadStream, appendFileSync, writeFile } from 'fs';


const parser = parse({
    delimiter: ';',
    fromLine: 2,
    ignore_last_delimiters: true,
    skip_empty_lines: true,
    columns: ['tenantId', 'eMail', 'licenseStartDate', 'amountOfSMS', 'contractCode', "tenantData"],
})

type TenantBillData = {
    tenantId: string,
    eMail: string,
    licenseStartDate: Date,
    amountOfSMS: number,
    contractCode: string,
    tenantData: string,
    parsedTenantData: {
        userName: string,
        userStartDate: Date,
        userEndDate: Date,
        userPartialBillAmount: number
    }[]
}

type ResultBil = {
    contractCode?: string
    tenantIds: string[]
    totalBill: number
}

const appendData= (bill: ResultBil) => {
    appendFileSync('bill.csv', `${bill.contractCode};"${bill.tenantIds.map(x=>`${x}`)}";${bill.totalBill};\n`)
}

const records: Map<string,{tenantIds: string[], totalBill:number}> = new Map()

writeFile('bill.csv', 'contractCode;tenantIds;totalBill\n',  (err) => {
    if (err)
      console.log(err);
    else {
      console.log("File written successfully\n");
    }
  } )
parser.on('readable', function () {
    let record: TenantBillData
    while ((record = parser.read()) !== null) {
        record.parsedTenantData = []
        const valueArray = record.tenantData.split(';')
        for (let index = 0; index < valueArray.length; index += 4) {
            const userName: string = valueArray[index]
            const userStartDate: Date = new Date(valueArray[index + 1])
            const userEndDate: Date = new Date(valueArray[index + 2])
            const userPartialBillAmount: number = Number.parseFloat(valueArray[index + 3])

            record.parsedTenantData.push({
                userName,
                userStartDate,
                userEndDate,
                userPartialBillAmount,
            })
        }
        // if there is no contract code skip the user
        let totalBill =  record.parsedTenantData.map(x => x.userPartialBillAmount).reduce((x,y) => x +y, 0)
        let allTenantIds = [record.tenantId]
        if(record.contractCode ==='' || record.contractCode === null || record.contractCode === undefined) {
            appendData({
            tenantIds: [record.tenantId],
            totalBill: totalBill,
            })
            continue
        }
        // if we already have the same contract code saved, add the previous value
        if(records.has(record.contractCode)) {
            totalBill += (records.get(record.contractCode)!.totalBill)
            allTenantIds.push(...records.get(record.contractCode)!.tenantIds)
        }
        records.set(record.contractCode, {  
            tenantIds:allTenantIds,
            totalBill: totalBill
        })
    }

});


// Catch any error
parser.on('error', function (err) {
    console.error({ error: err.message }, 'ERROR');
});

parser.on('end', function () {
    for (const iterator of records.entries()) {
        const contractCode = iterator[0]
        const tenantIdsAndTotalBill: {tenantIds: string[], totalBill:number} = iterator[1]
        appendData({
            contractCode,
            tenantIds: tenantIdsAndTotalBill.tenantIds,
            totalBill: tenantIdsAndTotalBill.totalBill
        })
    } 
});

createReadStream('./testTenants.csv').pipe(parser)

