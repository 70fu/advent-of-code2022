import * as aocutils from "./aocutils";
const DAY = 1;

function solve(input:string) : number{
    //split input lines
    let lines = input.split(/\r?\n/);

    let bestSum = 0;
    let sum = 0;
    for(let line of lines)
    {
        if(!line.trim()) {
            bestSum = Math.max(sum,bestSum);
            sum=0;
        }
        else {
            let calories = Number.parseInt(line);
            sum+=calories;
        }
    }

    return Math.max(bestSum,sum);
}

function solve2(input:string) : number{
    //split input lines
    let lines = input.split(/\r?\n/);
    lines.push("");

    let bestSums = [0,0,0];
    let sum = 0;
    for(let line of lines)
    {
        if(!line.trim()) {
            //see if this elf has more than one of the current top 3 elves
            for(let i = 0;i<bestSums.length;++i){
                if(sum>bestSums[i]){
                    bestSums.splice(i,0,sum );
                    break;
                }
            }
            //trim array to 3 elements
            bestSums.splice(3);
            sum=0;
        }
        else {
            let calories = Number.parseInt(line);
            sum+=calories;
        }
    }

    return bestSums.reduce((sum,value)=>sum+value,0);
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve2(input));
});
