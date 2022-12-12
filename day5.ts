import * as aocutils from "./aocutils";
const DAY = 5;

interface CraneMove{
    count:number;
    source:number;
    target:number;
}

function parseCraneMove(line:string):CraneMove{
    let words = line.split(' ');

    return {
        count:parseInt(words[1]),
        source:parseInt(words[3]),
        target:parseInt(words[5])
    };
}

function solve(input:string,reverseCrateOrder=true) : string{
    let lines = input.split(/\r?\n/);

    //split lines into stacks and procedure
    let seperatorLineIndex = lines.findIndex((line)=>!line.trim());
    let stackLines = lines.slice(0,seperatorLineIndex-1); //-1 since we dont need the numbering
    let stackNumberLine = lines[seperatorLineIndex-1];
    let stackCount = (stackNumberLine.length+1)/4; // get stack count by counting characters
    let stepLines = lines.slice(seperatorLineIndex+1,lines.length-1);

    //parse stack input, extract crate label at calculated index
    let stacks:string[][] = Array(stackCount);
    for(let i = 0;i<stackCount;++i){
        stacks[i]=[];
    }
    for(let line of stackLines){
        for(let i = 0;i<stackCount;++i) {
            let label = line[i*4+1];
            //check if there is a crate at this position
            if(label.trim()){
                stacks[i].push(label);
            }
        }
    }   
    
    //parse crane moves
    let moves = stepLines.map(parseCraneMove);

    //execute moves
    for(let move of moves){
        let movingCrates = stacks[move.source-1].splice(0,move.count);
        if(reverseCrateOrder){
            movingCrates.reverse();
        }
        stacks[move.target-1].splice(0,0,...movingCrates);
    }

    return stacks.reduce((sum,stack)=>sum+stack[0],"");
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve(input,false));
});
