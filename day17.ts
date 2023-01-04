import * as aocutils from "./aocutils";
const DAY = 17;

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

//grid that uses circular buffer rows
//if accesing row with y=height+X, then first X rows are overwritten and grid stores rows from X to height+X
class Grid<T extends string>{
    readonly width:number;
    readonly height:number;
    elements:T[];
    yOffset:number;
    defaultValue:T;

    constructor(width:number,height:number,defaultValue:T){
        this.width=width;
        this.height=height;
        this.elements = new Array(width*height);
        for(let i = 0;i<this.elements.length;++i){
            this.elements[i]=defaultValue;
        }
        this.yOffset = 0;
        this.defaultValue = defaultValue;
    }

    toIndex(pos:Vector):number{
        return (pos.y%this.height) * this.width + pos.x;
    }

    //toPos(index:number):Vector{
    //    return new Vector(index%this.width,Math.floor(index/this.width)).add(this.origin);
    //}

    invalidPos(pos:Vector):boolean{
        return pos.x<0 || 
                pos.y-this.yOffset<0 || 
                pos.x>=this.width //|| 
                //transformedPos.y>=this.height;
    }

    onEdge(pos:Vector):boolean{
        const yPos = (pos.y+this.yOffset)%this.height;
        return pos.x==0 || 
                yPos==0 || 
                pos.x == this.width-1 || 
                yPos == this.height-1;
    }

    get size(){
        return this.width*this.height;
    }

    getByIndex(index:number):T|undefined{
        if(index<0 || index>=this.size){
            return undefined;
        }

        return this.elements[index];
    }

    //return undefined on invalid index
    get(pos:Vector):T | undefined{
        if(this.invalidPos(pos)){
            return undefined;
        }

        const overshoot = pos.y-(this.yOffset+this.height-1);
        if(overshoot>0){
            this.extendGrid(overshoot);
        }

        const i = this.toIndex(pos);
        return this.elements[i];
    }

    set(pos:Vector,value:T){
        if(!this.invalidPos(pos)){
            const overshoot = pos.y-(this.yOffset+this.height-1);
            if(overshoot>0){
                this.extendGrid(overshoot);
            }

            const i = this.toIndex(pos);
            this.elements[i] = value;
        }
    }

    compareRows(y1:number,y2:number):boolean{
        const pos = new Vector(0,y1);
        const i1 = this.toIndex(pos);
        pos.y = y2;
        const i2 = this.toIndex(pos);
        for(let offset = 0; offset<this.width;++offset){
            if(this.elements[i1+offset] != this.elements[i2+offset]){
                return false;
            }
        }

        return true;
    }

    isCycle(y1:number,y2:number):boolean{
        const minY = Math.min(y1,y2);
        const maxY = Math.max(y1,y2);
        const firstRow = minY-(maxY-minY-1);
        if(this.invalidPos(new Vector(0,firstRow))){
            return false;
        }
        for(let i = 0;i<maxY-minY;++i){
            if(!this.compareRows(maxY-i,minY-i)){
                return false;
            }
        }
        return true;
    }

    //first row index>=startIndex that has same values as row y
    findLowestMatchingRow(y:number, startIndex:number):number{
        for(let i = startIndex ; i<y;++i){
            if(this.compareRows(y,i)){
                return i;
            }
        }
        return y;
    }

    printRows(max:number,min:number){
        let i = this.toIndex(new Vector(0,max));
        for(let row = max; row>=min;--row){
            const rowString = "".concat(...this.elements.slice(i,i+this.width));
            console.log(`${rowString} ${row}`);
            i-=this.width;
            if(i<0){
                i += this.elements.length;
            }
        }
    }

    private extendGrid(extension:number){
        this.yOffset+=extension;
        //clean rows
        for(let y = 1;y<=extension;++y){
            for(let x = 0;x<this.width;++x){
                const pos = new Vector(x,this.yOffset-y);
                this.elements[this.toIndex(pos)] = this.defaultValue;
            }
        }
    }
}

type CellType = "#" | ".";

function isSolid(cell:CellType){
    return cell=="#";
}

class Rock {
    parts:Vector[];
    pos:Vector;

    constructor(){
        this.pos = new Vector(0,0);
        this.parts = [];
    }

    addPart(part:Vector):Rock{
        this.parts.push(part);
        return this;
    }

    move(move:Vector,objects:Grid<CellType>):boolean{
        const oldPos = this.pos;
        this.pos = Vector.add(move,this.pos);

        if(this.isOverlapping(objects)){
            //rollback position
            this.pos = oldPos;
            return false;//move failed
        }

        //move succeeded
        return true;
    }

    //true if not outside grid and no overlap with a solid object
    isOverlapping(objects:Grid<CellType>):boolean{
        for(let part of this.parts){
            const partPos = Vector.add(part,this.pos);
            if(objects.invalidPos(partPos) || isSolid(objects.get(partPos) as CellType)){
                return true;
            }
        }

        return false;
    }

    copy():Rock{
        const clone = new Rock();
        clone.pos = this.pos.copy();
        clone.parts = this.parts.map((part)=>part.copy());
        return clone;
    }

    get worldParts(){
        return this.parts.map((part)=>Vector.add(part,this.pos));
    }
}
const ROCKS:Rock[] = [
    //####
    new Rock()
        .addPart(new Vector(0,0))
        .addPart(new Vector(1,0))
        .addPart(new Vector(2,0))
        .addPart(new Vector(3,0)),
    //.#.
    //###
    //.#.
    new Rock()
        .addPart(new Vector(1,0))
        .addPart(new Vector(0,1))
        .addPart(new Vector(1,1))
        .addPart(new Vector(2,1))
        .addPart(new Vector(1,2)),
    //..#
    //..#
    //###
    new Rock()
        .addPart(new Vector(0,0))
        .addPart(new Vector(1,0))
        .addPart(new Vector(2,0))
        .addPart(new Vector(2,1))
        .addPart(new Vector(2,2)),
    //#
    //#
    //#
    //#
    new Rock()
        .addPart(new Vector(0,0))
        .addPart(new Vector(0,1))
        .addPart(new Vector(0,2))
        .addPart(new Vector(0,3)),
    //##
    //##
    new Rock()
        .addPart(new Vector(0,0))
        .addPart(new Vector(1,0))
        .addPart(new Vector(0,1))
        .addPart(new Vector(1,1)),
]

type JetDirection = "<" | ">";

function solve(input:string, rockCount:number):number{
    //parse input
    const lines = input.split(/\r?\n/);
    const jetPattern = lines[0];
    let jetIndex = 0;
    let rockIndex = 0;

    const down = new Vector(0,-1);
    const jetDirection = {
        "<":new Vector(-1,0),
        ">":new Vector(1,0)
    };
    const jetIndices:number[] = [];
    function popJetDir(){
        const dir = jetDirection[jetPattern.charAt(jetIndex) as JetDirection];
        if(++jetIndex == jetPattern.length){
            jetIndex=0;
        }
        return dir;
    }
    function popRock(){
        return ROCKS[(rockIndex++)%ROCKS.length].copy()
    }

    const grid = new Grid<CellType>(7,2048*16,'.');
    let highestHeight = -1;
    let firstCycle:number[]=[];
    let rockIndexFirstCycle = 0;
    let simulatedCycleHeight = 0;
    while(rockIndex<rockCount){
        //spawn rock
        const rock = popRock();
        rock.pos = new Vector(2,highestHeight+4);

        //move rock until it stops
        while(true){
            //perform push by jet of hot gas
            rock.move(popJetDir(),grid);

            //perform downward move
            if(!rock.move(down,grid)){
                break;
            }
        }

        //add rock to grid
        let lowestModifiedRow = highestHeight+4;
        for(let part of rock.worldParts){
            grid.set(part,'#');
            highestHeight = Math.max(highestHeight,part.y);
            lowestModifiedRow = Math.min(lowestModifiedRow,part.y);
        }

        //check for cycles from highestHeight to lowestModifiedRow (inclusive)
        if(firstCycle.length == 0){
            for(let i = highestHeight;i>=lowestModifiedRow;--i){
                let rowIndex=grid.findLowestMatchingRow(i,0);
                while(rowIndex!=i){
                    //check if there already 2 occurences of a cycle
                    if(rowIndex>=0 && grid.isCycle(i,rowIndex) && i-rowIndex>10 && grid.isCycle(rowIndex,rowIndex-(i-rowIndex))){
                        console.log(`Cycle of size ${i-rowIndex} found: ${rowIndex+1}-${i}`);
                        //grid.printRows(i,rowIndex+1);
                        //grid.printRows(rowIndex,rowIndex-(i-rowIndex)+1)
                        //store index of rock that completed cycle
                        rockIndexFirstCycle = rockIndex;
                        //store last row of the two cycle occurences
                        firstCycle.push(rowIndex,i);
                        //modify i to break out of for loop
                        i = lowestModifiedRow-1;
                        break;
                    }
                    rowIndex = grid.findLowestMatchingRow(i,rowIndex+1);
                }
            }
        }
        else if(simulatedCycleHeight==0) {
            //if cycle reappears, count how many rocks it needed to finish cycle
            const cycleHeight = (firstCycle[1]-firstCycle[0]);
            const targetRow = firstCycle[1]+cycleHeight
            if(highestHeight>=targetRow && grid.isCycle(firstCycle[1],targetRow)){
                const cycleRockCount = rockIndex - rockIndexFirstCycle;
                const remainingRocks = rockCount - rockIndex - 1;

                const remainingCycles = Math.floor(remainingRocks/cycleRockCount);

                //add rocks of the simulated cycles
                rockIndex+=cycleRockCount*remainingCycles;
                //height of the simulated cycles
                simulatedCycleHeight = remainingCycles * cycleHeight;
            }
        }
    

        if(rockIndex%ROCKS.length == 0){
            jetIndices.push(jetIndex);
        }
    }

    return highestHeight + simulatedCycleHeight +1;
}


aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input,2022));
    console.log("=========================");
    console.log(solve(input,1000000000000))
});
