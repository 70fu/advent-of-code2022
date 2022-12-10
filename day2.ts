import * as aocutils from "./aocutils";
const DAY = 2;

type Choice = "rock" | "paper" | "scissors";
type RoundChoice = [opponent:Choice,player:Choice];


function parseInput(input:string) :RoundChoice[]{
    const charToChoice:Record<string,Choice> = {"A":"rock","B":"paper","C":"scissors","X":"rock","Y":"paper","Z":"scissors"};
    let lines = input.split(/\r?\n/);
    let rounds:RoundChoice[] = [];
    for(let line of lines){
        if(!line){
            continue;
        }

        let choices = line.split(" ");
        rounds.push([
            charToChoice[choices[0]],
            charToChoice[choices[1]]
        ]);
    }

    return rounds;
}

function parseInput2(input:string):RoundChoice[]{
    const charToChoice:Record<string,Choice> = {"A":"rock","B":"paper","C":"scissors"};
    const modifiers:Record<string,number>={"X":-1,"Y":0,"Z":1};
    const choiceToId = {"rock":0,"paper":1,"scissors":2};
    const idToChoice:Record<number,Choice> = {0:"rock",1:"paper",2:"scissors"};
    let lines = input.split(/\r?\n/);
    let rounds:RoundChoice[] = [];
    for(let line of lines){
        if(!line){
            continue;
        }

        let choices = line.split(" ");
        let opponent = charToChoice[choices[0]];
        let opponentId = choiceToId[opponent];
        let playerId = opponentId + modifiers[choices[1]];
        let player = idToChoice[(playerId+3)%3];
        rounds.push([
            opponent,
            player
        ]);
    }

    return rounds;
}

function getScore(round:RoundChoice):number{
    const ids = {"rock":0,"paper":1,"scissors":2};
    //calculate round score
    let roundScore = 0;
    let opponent = ids[round[0]];
    let player = ids[round[1]];
    if((player+2)%3==opponent){
        roundScore=6
    } else if (player==opponent) {
        roundScore=3
    }

    //calculate choice score
    let choiceScore = player+1;

    return roundScore+choiceScore;
}

type InputParser = (input:string) => RoundChoice[];
function solve(input:string,parser:InputParser) : number{
    let rounds = parser(input);
    let scores = rounds.map(getScore);
    return scores.reduce((sum,value)=>sum+value,0);
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input,parseInput));
    console.log("=========================");
    console.log(solve(input,parseInput2));
});
