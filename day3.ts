import * as aocutils from "./aocutils";
const DAY = 3;

function getPriority(char:string):number{
    if(char==char.toLowerCase()){
        //ascii value of a is 97
        //so, 97-1=96
        return char.charCodeAt(0)-96;
    } else {
        //ascii value of A is 65
        //so, 65-27=38
        return char.charCodeAt(0)-38;
    }
}

function getSharedItemPriority(line:string):number{
    //filter empty lines
    if(!line.trim()) {
        return 0;
    }

    //split into compartments
    let part1 = line.substring(0,line.length/2);
    let part2 = line.substring(line.length/2);

    //sort compartments, O(n logn)
    part1 = part1.split('').sort().join('');
    part2 = part2.split('').sort().join('');

    //iterate over backpack in O(n)
    let i=0;
    let j=0;
    let item1 = part1.charCodeAt(i);
    let item2 = part2.charCodeAt(j);
    while(item1!=item2){
        if(item1<item2){
            ++i;
            item1= part1.charCodeAt(i);
        } else if (item1>item2) {
            ++j;
            item2 = part2.charCodeAt(j);
        }
    }

    return getPriority(part1.charAt(i));
}

function solve(input:string) : number{
    let lines = input.split(/\r?\n/);
    return lines.map(getSharedItemPriority)
                .reduce((sum,value)=>sum+value);
}

function getSharedItemPriorityN(rucksacks:string[]) {
    //sort rucksacks
    for(let i = 0;i<rucksacks.length;++i){
        rucksacks[i] = rucksacks[i].split('').sort().join('');
    }

    //find matching item
    let indices = Array(rucksacks.length).fill(0);
    do{
        let items = indices.map((itemIndex,rucksackIndex)=>rucksacks[rucksackIndex].charCodeAt(itemIndex));
        let min = Math.min(...items);
        let max = Math.max(...items);
        
        if(min == max){
            break;
        }
        
        //advance index of min item
        let minIndex = items.findIndex((item)=>item == min);
        indices[minIndex]=indices[minIndex]+1;
        
    } while(true);

    return getPriority(rucksacks[0].charAt(indices[0]));
}

function solve2(input:string) : number{
    //split input lines
    let lines = input.split(/\r?\n/);
    let sum = 0
    for(let i = 0;i+2<lines.length;i+=3){
        sum += getSharedItemPriorityN(lines.slice(i,i+3));
    }
    
    return sum;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve2(input));
});
