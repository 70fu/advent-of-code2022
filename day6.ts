import * as aocutils from "./aocutils";
const DAY = 6;


function solve(input:string,markerLength:number=4) : number{
    let charCounts : Record<string,number>={};

    for(let i = 0;i<input.length;++i) {
        const char = input.charAt(i);
        const discardIndex = i-markerLength;

        //reduce count of discarded character
        if(discardIndex >= 0) {
            const oldChar = input.charAt(discardIndex);
            --charCounts[oldChar];
        }

        //increase count of current character
        let count = charCounts[char];
        if(!count) {
            charCounts[char] = 1;
        } else {
            ++charCounts[char];
        }

        //do not check sequence, if less than markerLength characters have been read
        if(discardIndex<-1){
            continue;
        }

        //check if current sequence has only unique characters
        let pairFound=false;
        for (let j = discardIndex+1;j<=i;++j){
            pairFound = pairFound || charCounts[input[j]]!=1;
        }

        if(!pairFound){
            return i+1;
        }
    }

    return 0;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input,4));
    console.log("=========================");
    console.log(solve(input,14));
});
