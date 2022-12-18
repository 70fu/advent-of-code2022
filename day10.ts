import * as aocutils from "./aocutils";
const DAY = 10;


function solve(input:string) : number{
    let lines = input.split(/\r?\n/);

    const CHECK_SIGNAL_INTERVAL = 40;
    const SCREEN_WIDTH = 40;
    const UNLIT_CHAR = "⠀";
    const LIT_CHAR = "▮";
    let screenBuffer="";
    let checkSignalCounter = 20;
    let cycle = 1;
    let strength = 0;
    let register = 1;

    for(let line of lines){
        if(!line.trim()){
            continue;
        }
        const tokens = line.split(" ");
        const instruction = tokens[0];
        
        let cycleTime = 0;
        if(instruction=="addx"){
            cycleTime=2;
        }
        else { //if noop
            cycleTime = 1;
        }

        //execute command
        while(cycleTime>0){
            
            --checkSignalCounter;
            if(checkSignalCounter==0) {
                strength += cycle * register;
                checkSignalCounter = CHECK_SIGNAL_INTERVAL;
            }

            //draw on screen
            if(Math.abs((cycle-1)%SCREEN_WIDTH-register)<2){
                screenBuffer+=LIT_CHAR;
            } else {
                screenBuffer+=UNLIT_CHAR;
            }

            if(cycleTime == 1 && instruction == "addx"){
                const parameter = parseInt(tokens[1]);
                register+=parameter;
            }
            
            ++cycle;
            --cycleTime;
        }
    }

    //print screen
    for(let i = 0;i<screenBuffer.length;i+=40){
        console.log(screenBuffer.substring(i,i+40));
    }
    return strength;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
});
