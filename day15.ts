import * as aocutils from "./aocutils";
const DAY = 15;

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

interface Sensor{
    pos:Vector;
    closestBeacon:Vector;
    range:number;//manhattan distance from pos to closestBeacon
}

const LINE = 2000000;

function parseLine(input:string):Sensor{
    const tokens = input.split(" ");
    const sensorX = tokens[2].substring(2,tokens[2].length-1);
    const sensorY = tokens[3].substring(2,tokens[3].length-1);
    const beaconX = tokens[8].substring(2,tokens[8].length-1);
    const beaconY = tokens[9].substring(2,tokens[9].length);

    const pos = new Vector(parseInt(sensorX),parseInt(sensorY));
    const closestBeacon = new Vector(parseInt(beaconX),parseInt(beaconY))

    return {
        pos : pos ,
        closestBeacon : closestBeacon,
        range : Vector.sub(pos,closestBeacon).manhattan
    };
}

function printSensors(min:Vector,max:Vector,sensors:Array<Sensor>){
    const objects :Record<number,string> = [];
    for(let sensor of sensors){
        objects[sensor.pos.ihash]="S";
        objects[sensor.closestBeacon.ihash]="B";

        for(let y = sensor.pos.y-sensor.range;y<=sensor.pos.y+sensor.range;++y){
            const distToTargetLine = Math.abs(y - sensor.pos.y);
            const distDiff = sensor.range-distToTargetLine;
            for(let x = sensor.pos.x-distDiff;x<=sensor.pos.x+distDiff;++x){
                const pos = new Vector(x,y);
                if(!(pos.ihash in objects)){
                    objects[pos.ihash]="#";
                }   
            }
        }
    }


    for(let y = min.y;y<=max.y;++y){
        let line = "";
        for(let x = min.x;x<=max.x;++x){
            const pos = new Vector(x,y);
            if(pos.ihash in objects){
                line = line.concat(objects[pos.ihash]);
            } else {
                line = line.concat(".");
            }
        }
        console.log(`${line} ${y}`);
    }
    console.log();
}

function solve(input:string):number{
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());
    
    //load paths
    let sensors : Array<Sensor> = [];
    const MIN = new Vector(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
    const MAX = new Vector(-Number.MAX_SAFE_INTEGER,-Number.MAX_SAFE_INTEGER);
    function addSensor(sensor:Sensor){
        MIN.x = Math.min(MIN.x,Math.min(sensor.pos.x,sensor.closestBeacon.x));
        MIN.y = Math.min(MIN.y,Math.min(sensor.pos.y,sensor.closestBeacon.y));
        MAX.x = Math.max(MAX.x,Math.max(sensor.pos.x,sensor.closestBeacon.x));
        MAX.y = Math.max(MAX.y,Math.max(sensor.pos.y,sensor.closestBeacon.y));

        sensors.push(sensor);
    }
    for (let line of lines){
        addSensor(parseLine(line));
    }

    //printSensors(MIN,MAX,sensors);

    //register cells in target line which are reached by the sensor
    const cellsInRange : Set<number> = new Set;
    const beacons : Set<number>= new Set(sensors.map((sensor)=>sensor.closestBeacon.ihash));
    for(let sensor of sensors){
        const distToTargetLine = Math.abs(LINE - sensor.pos.y);
        const distDiff = sensor.range-distToTargetLine;
        if(distDiff<0){
            continue;
        }

        for(let i = -distDiff;i<=distDiff;++i){
            const pos = new Vector(sensor.pos.x+i,LINE);
            if(!(beacons.has(pos.ihash))){
                cellsInRange.add(pos.ihash);
            }
        }
    }

    console.log(`Cells in Range in line ${LINE}: ${cellsInRange.size}`);

    //part 2

    //find free spot
    const MAXCOORD = 4000000;
    const pos = new Vector();
    for(let y = 0; y<MAXCOORD;++y){
        pos.y=y;
        for(let x = 0;x<MAXCOORD;++x){
            pos.x=x;
            let sensorInRange = false;
            for(let sensor of sensors){
                const distToSensor = Vector.sub(pos,sensor.pos).manhattan;
                if(distToSensor<=sensor.range){
                    const distToTargetLine = Math.abs(y - sensor.pos.y);
                    const distDiff = sensor.range-distToTargetLine;
                    x = sensor.pos.x+distDiff;
                    sensorInRange=true;
                    break;
                }
            }
            if(!sensorInRange){
                console.log(`Found pos: ${pos.toString()}`);
                return x*MAXCOORD+y;
            }
        }
    }

    return -1;
}


aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
});
