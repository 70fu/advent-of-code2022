import * as aocutils from "./aocutils";
const DAY = 4;

function doesRangeContainOther(line:string):boolean {
    if(!line) {
        return false;
    }
    let assignments=line.split(',');
    let range1 = assignments[0].split('-').map((str)=>parseInt(str));
    let range2 = assignments[1].split('-').map((str)=>parseInt(str));

    return range1[0]<=range2[0] && range1[1]>=range2[1] ||
            range2[0]<=range1[0] && range2[1]>=range1[1];
}

function solve(input:string) : number{
    let lines = input.split(/\r?\n/);
    return lines.map(doesRangeContainOther)
                .map((bool):number=>bool?1:0)
                .reduce((sum,value)=>sum+value);
}

function doesRangeOverlap(line:string):boolean{
    if(!line) {
        return false;
    }
    let assignments=line.split(',');
    let range1 = assignments[0].split('-').map((str)=>parseInt(str));
    let range2 = assignments[1].split('-').map((str)=>parseInt(str));

    return !(range1[1]<range2[0] || range2[1]<range1[0]);
}

function solve2(input:string) :number {
    let lines = input.split(/\r?\n/);
    return lines.map(doesRangeOverlap)
                .map((bool):number=>bool?1:0)
                .reduce((sum,value)=>sum+value);
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve2(input));
});
