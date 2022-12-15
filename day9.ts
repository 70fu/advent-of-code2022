import * as aocutils from "./aocutils";
const DAY = 9;

type Up = {x:0,y:-1};
type Down = {x:0,y:1};
type Left = {x:-1,y:0};
type Right = {x:1,y:0};
type Direction = Up|Down|Left|Right;

class Vector{
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

function solve(input:string,length:number){
    let lines = input.split(/\r?\n/);
    //start with a high positive integer, so that we will likely not tap into negative coordinates,
    //since the hash function requires positive integers
    const STARTING_POS=100000;
    let knots = new Array(length);
    for(let i = 0;i<length;++i){
        knots[i]=new Vector(STARTING_POS,STARTING_POS);
    }
    const visited:Set<number> = new Set();
    //add start position
    visited.add(knots.at(-1).ihash);
    const charToDir :Record<string,Vector> = {
        "L":new Vector(-1,0),
        "R":new Vector(1,0),
        "D":new Vector(0,-1),
        "U":new Vector(0,1)
    }

    for(let line of lines){
        if(!line.trim()){
            continue;
        }
        const tokens = line.split(" ");
        const dir = charToDir[tokens[0]];
        let moves = parseInt(tokens[1]);
        
        while(moves>0){
            //move head
            knots[0].add(dir);

            //pull further knots
            for(let i = 0 ; i<length-1;++i){
                let currentKnot = knots[i];
                let nextKnot = knots[i+1];
                let dist = Vector.sub(currentKnot,nextKnot);
                if(dist.sqrLength<=2){
                    break;
                }

                nextKnot.add(new Vector(Math.sign(dist.x),Math.sign(dist.y)));

            }
            

            //mark tail position as visited
            visited.add(knots.at(-1).ihash);

            --moves;
        }
    }

    return visited.size;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input,2));
    console.log("=========================");
    console.log(solve(input,10));
});
