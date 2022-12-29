import * as aocutils from "./aocutils";
const DAY = 16;

const START = "AA";

//integer hash using szudzik's function: http://szudzik.com/ElegantPairing.pdf
function szudik(x:number,y:number){
    if(x<0 || y <0)
    {
        console.warn(`coordinates are negative (${x},${y})`);
    }
    return x >= y ? 
           x * x + x + y :
           y * y + x;
}

//paired szudiks from : https://www.vertexfragment.com/ramblings/cantor-szudzik-pairing-functions/
function szudikSigned(x:number,y:number) 
{
    const a = (x >= 0 ? 2 * x : (-2 * x) - 1);
    const b = (y >= 0 ? 2 * y : (-2 * y) - 1);
    return szudik(a, b) * 0.5;
}

interface Position{
    x:number;
    y:number;
}

class Vector implements Position{
    x:number;
    y:number;

    constructor(x:number=0,y:number=0){
        this.x = x;
        this.y = y;
    }

    get sqrLength(){
        return this.x*this.x + this.y*this.y;
    }

    get manhattan(){
        return Math.abs(this.x)+Math.abs(this.y);
    }

    //adds given vector to this vector, returns this
    add(v:Vector):Vector{
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    equals(other:Vector){
        return this.x == other.x && this.y == other.y;
    }

    copy(){
        return new Vector(this.x,this.y);
    }

    static add(a:Vector,b:Vector):Vector{
        return new Vector(a.x+b.x,a.y+b.y);

    }

    //returns new vector a-b
    static sub(a:Vector,b:Vector):Vector{
        return new Vector(a.x-b.x,a.y-b.y);
    }

    get ihash(){
        return szudikSigned(this.x,this.y);
    }

    public toString(){
        return `(${this.x};${this.y})`;
    }
}

type Tunnels = Record<string,number>;

interface Valve {
    id:string;
    flowRate:number;
    neighbors: Tunnels;
}

type Valves = Record<string,Valve>;
interface OpenEvent{
    valve:Valve;
    remainingTime:number;
}

interface ValveState{
    valves:Valves;//remaining unopened valves, that can be reached in the remaining time
    location:Valve;//current valve
    remainingTime:number;
    pressureReleased:number;
    
    //debug
    opened:OpenEvent[];
}

function copyValveState(state:ValveState):ValveState{
    return {
        ...state,
        valves:{...state.valves},
        opened:[...state.opened]
    };
}

//mutates state to remove all valves which cannot be reached and opened in the remaining time
function discardUnreachableValves(state:ValveState){
    const reachable = Object.values(state.valves).filter((valve)=>(state.location.neighbors[valve.id]+1)<state.remainingTime);
    state.valves = Object.fromEntries(reachable.map((valve)=>[valve.id,valve]));
}

//produce a new valve state going to and opening given valve
//does not check time, thus may produce a state with negative remaining time
function openValve(state:ValveState,targetValve:Valve):ValveState{
    let copied = copyValveState(state);
    
    //decrease time by traveling and opening valve
    copied.remainingTime-=state.location.neighbors[targetValve.id]+1;

    //add released pressure
    copied.pressureReleased+=targetValve.flowRate * copied.remainingTime;

    //remove target valve from remaining valves
    delete copied.valves[targetValve.id];
    
    //set current location
    copied.location = targetValve;

    //remove all unreachable valves
    discardUnreachableValves(copied);

    //add action record for debugging
    copied.opened.push({
        valve:targetValve,
        remainingTime:copied.remainingTime
    });

    return copied;
}

//greedy strategy to generate a lower bound
function greedy(start:ValveState):ValveState{
    //sort by flow rate descending, open as many valves as possible from the sorted list favoring valves with higher flow rate
    let remaining = Object.values(start.valves).sort((a,b)=>b.flowRate-a.flowRate);

    let currentState = start;
    for(let i = 0 ; i<remaining.length;++i){
        const valve = remaining[i];
        const distance = currentState.location.neighbors[valve.id];
        //is there enough time to run to valve? and get benefit from it (time>0 after running to and opening valve)
        if(currentState.remainingTime>distance+1){
            currentState = openValve(currentState,valve);
            remaining.splice(i,1);
            //reset iteration, start from 0
            i = -1;
        }
    }

    return currentState;
}

function upperBound(state:ValveState):number{
    let upper = state.pressureReleased;

    //assume all valves with distance<remainingTime can be reached
    //time for opening valves is not taken into account
    let reachable = Object.values(state.valves);

    //return if there is no valve reachable
    if(reachable.length==0){
        return upper;
    }

    //sort by distance
    reachable.sort((a,b)=>state.location.neighbors[a.id]-state.location.neighbors[b.id]);

    //since it might be possible to reach all of them in the remaining time (we only look at distances form current location)
    //we open them from lowest to highest distance from current location, because in the best case the distance from A->C <= A->...->C
    //we only pay the opening time only for the first valve
    let distanceTravelled = 0;
    for(let i = 0;i<reachable.length;++i){
        let valve = reachable[i];
        const distance = state.location.neighbors[valve.id];
        distanceTravelled = Math.max(distanceTravelled,distance);
        const remainingTime = state.remainingTime-1-distanceTravelled;

        upper+=valve.flowRate*remainingTime;
    }

    return upper;
}

function parseLine(line:string):Valve{
    const tokens = line.split(" ");
    const id = tokens[1];
    const flowRateToken = tokens[4];
    const flowRate = parseInt(
        flowRateToken.substring(
            flowRateToken.indexOf("=")+1,
            flowRateToken.indexOf(";")
        )
    );

    let tunnels:Tunnels = {};
    //parse neighbors
    for(let i = 9;i<tokens.length;++i){
        tunnels[tokens[i].slice(0,2)] = 1;
    }

    return {
        id:id,
        flowRate:flowRate,
        neighbors:tunnels
    };
}

function copyValve(valve:Valve):Valve{
    return {
        id:valve.id,
        flowRate:valve.flowRate,
        neighbors:{}
    };
}


function isImportant(valve:Valve):boolean{
    return valve.id==START || valve.flowRate>0
}

function solve(input:string):number{
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());

    //parse input
    const valves:Valves = Object.fromEntries(lines.map(parseLine).map((valve)=>[valve.id,valve]));
    const importantValves = Object.values(valves).filter(isImportant);

    //perform breadth-first search to find the distance of the shortest path of the important valves (start or flow rate > 0) to each other important valve
    const simplifiedValves:Valves = Object.fromEntries(importantValves.map((valve)=>[valve.id,copyValve(valve)]));
    for(let valve of importantValves){
        let queue = [valve];
        let depth = 1;
        let visited:Set<string>=new Set();
        while(queue.length>0){
            let levelSize = queue.length;
            while(levelSize>0){
                let node = queue.splice(0,1)[0];
                for(let tunnel of Object.entries(node.neighbors)){
                    const neighborId = tunnel[0];
                    if(!visited.has(neighborId)){
                        queue.push(valves[neighborId]);
                        visited.add(neighborId);
                        if(neighborId in simplifiedValves && !(neighborId in simplifiedValves[valve.id].neighbors)){
                            simplifiedValves[neighborId].neighbors[valve.id]=depth;
                            simplifiedValves[valve.id].neighbors[neighborId]=depth;
                        }
                    }
                }
                --levelSize;
            }
            ++depth;
        }
    }

    //generate initial state
    const initialState:ValveState = {
        valves:simplifiedValves,
        location:simplifiedValves[START],
        remainingTime:30,
        pressureReleased:0,
        opened:[]
    };
    delete initialState.valves[START];
    discardUnreachableValves(initialState);

    //branch and bound algorithm
    //stack of states
    let states : ValveState[] = [initialState];
    let bestSolution = greedy(initialState);
    while(states.length>0){
        const state = states.pop() as ValveState;

        //calculate upper bound, can this state lead to a better solution?
        const upper = upperBound(state);
        if(upper > bestSolution.pressureReleased){
            //calculate lower bound, is it better than current best solution?
            const lower = greedy(state);
            if(lower.pressureReleased>bestSolution.pressureReleased){
                bestSolution=lower;
            }

            //branch:
            //run into each room and open valve, that may be reached in the remaining time
            for(let valve of Object.values(state.valves)){
                states.push(openValve(state,valve));
            }
        }
    }
    
    return bestSolution.pressureReleased;
}


aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
});
