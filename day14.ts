import * as aocutils from "./aocutils";
const DAY = 14;

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

    //integer hash using szudzik's function: http://szudzik.com/ElegantPairing.pdf
    get ihash(){
        if(this.x<0 || this.y <0)
        {
            console.warn(`coordinates are negative (${this.x},${this.y})`);
        }
        return this.x > this.y ? 
                this.x * this.x + this.x + this.y :
                this.y * this.y + this.x;
    }
}

type Unit = "#" | "o";
type Cave = Record<number,Unit>;
const SANDSTART = new Vector(500,0);


function parsePos(input:string):Vector{
    let coords = input.trim().split(",");
    return new Vector(parseInt(coords[0]),parseInt(coords[1]));
}

function isSolid(pos:Vector,cave:Cave):boolean{
    return pos.ihash in cave;
}

function printCave(min:Vector,max:Vector,cave : Cave){

    for(let y = 0;y<=max.y;++y){
        let line = "";
        for(let x = min.x;x<=max.x;++x){
            const pos = new Vector(x,y);
            if(pos.equals(SANDSTART)){
                line = line.concat("+");
            } else if(isSolid(pos,cave)){
                line = line.concat(cave[pos.ihash]);
            } else {
                line = line.concat(".");
            }
        }

        console.log(line);
    }
    console.log();
}

function solve(input:string,stopWhenSourceClogged:boolean = false):number{
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());
    
    //load paths
    let objects : Cave = {};
    const MIN = new Vector(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
    const MAX = new Vector(0,0);
    function addRock(pos:Vector){
        MIN.x = Math.min(MIN.x,pos.x);
        MIN.y = Math.min(MIN.y,pos.y);
        MAX.x = Math.max(MAX.x,pos.x);
        MAX.y = Math.max(MAX.y,pos.y);

        objects[pos.ihash]="#";
    }
    for (let line of lines){
        let points = line.split("->");
        if(points.length==0){
            continue;
        }
        let p1 = parsePos(points[0]);
        for(let i = 1;i<points.length;++i){
            let p2 = parsePos(points[i]);
            const direction = Vector.sub(p2,p1);
            direction.x = Math.sign(direction.x);
            direction.y = Math.sign(direction.y);

            do{
                addRock(p1);
                p1.add(direction);
            } while(!p1.equals(p2));
            addRock(p1);
        }
    }

    printCave(MIN,MAX,objects);

    //simulate sand
    const DOWN = new Vector(0,1);
    const LEFT_DOWN = new Vector(-1,1);
    const RIGHT_DOWN = new Vector(1,1);
    const DIRECTIONS = [DOWN,LEFT_DOWN,RIGHT_DOWN];
    let sandCount = 0;
    let sandPos = SANDSTART.copy();
    while(true){
        let sandMoved = false;
        for(const direction of DIRECTIONS){
            let test = Vector.add(sandPos,direction);
            if(!isSolid(test,objects) && test.y<MAX.y+2){
                sandPos = test;
                sandMoved = true;
                break;
            }
        }

        if(!stopWhenSourceClogged && sandMoved && sandPos.y>MAX.y){
            break;
        }
        if(!sandMoved){
            objects[sandPos.ihash] = "o";
            ++sandCount;
            if(sandPos.equals(SANDSTART)){
                printCave(MIN,Vector.add(MAX,DOWN),objects);
                return sandCount;
            }

            sandPos = SANDSTART.copy();
        }

    }

    printCave(MIN,MAX,objects);

    return sandCount;
}


aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve(input,true));
});
