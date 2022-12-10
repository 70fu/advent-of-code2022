import * as fs from 'node:fs/promises';


export async function getInput(day:number) {
    const filePath=`./input/${day}.txt`;

    try {
        const data = await fs.readFile(filePath);
        return data.toString();
    }
    catch(error) {
        console.error(`file ${filePath} not found`);
    }

    return "";
}