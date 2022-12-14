import * as aocutils from "./aocutils";
const DAY = 8;

type Up = {x:0,y:-1};
type Down = {x:0,y:1};
type Left = {x:-1,y:0};
type Right = {x:1,y:0};
type Direction = Up|Down|Left|Right;

interface Position{
    x:number;
    y:number;
}

function addPos(a:Position,b:Position):Position {
    return {x:a.x+b.x,y:a.y+b.y};
}

function inverseDir(dir:Direction):Direction{
    dir.x*=-1;
    dir.y*=-1;
    return dir;
}

class Tree{
    height:number;
    xVisible:boolean;
    yVisible:boolean;
    constructor(height:number,visible:boolean){
        this.height=height;
        this.xVisible=this.yVisible=visible;
    }

    get visible(){
        return this.xVisible || this.yVisible;
    }

    isVisible(dir:Direction):boolean{
        if(dir.x==0){
            return this.yVisible;
        }
        return this.xVisible;
    }

    makeVisible(dir:Direction){
        if(dir.x==0){
            this.yVisible=true;
        }
        this.xVisible=true;
    }
}

class Grid<T>{
    readonly width:number;
    readonly height:number;
    elements:T[];

    constructor(width:number,height:number){
        this.width=width;
        this.height=height;
        this.elements = new Array(width*height);
    }

    private toIndex(pos:Position):number{
        return pos.y * this.width + pos.x;
    }

    invalidPos(pos:Position):boolean{
        return pos.x<0 || pos.y<0 || pos.x>=this.width || pos.y>=this.height;
    }

    onEdge(pos:Position):boolean{
        return pos.x==0 || pos.y==0 || pos.x == this.width-1 || pos.y == this.height-1;
    }

    get size(){
        return this.width*this.height;
    }

    translateSpiralPos(spiralPos:Position):Grid<T>{
        spiralPos.x+=Math.floor(this.width/2);
        spiralPos.y+=Math.floor(this.height/2);
        return this;
    }

    //return undefined on invalid index
    get(pos:Position):T | undefined{
        if(this.invalidPos(pos)){
            return undefined;
        }

        const i = this.toIndex(pos);
        return this.elements[i];
    }

    set(pos:Position,value:T){
        if(!this.invalidPos(pos)){
            const i = this.toIndex(pos);
            this.elements[i] = value;
        }
    }
}

//indexing via ulma spiral
//source: https://stackoverflow.com/a/11551316
function first(cycle:number){
    let x = 2 * cycle - 1;
    return x * x;
}

function cycle(index:number){
    return Math.floor((Math.sqrt(index) + 1)/2)
}

function length(cycle:number){
    return 8 * cycle;
}

function sector(index:number){
    const c = cycle(index);
    const offset = index - first(c);
    const n = length(c);
    return Math.floor(4 * offset / n);
}

function position(index:number):Position{
    if(index==0){
        return {x:0,y:0};
    }
    const c = cycle(index);
    const s = sector(index)
    const sectorOffset = index - first(c) - Math.floor(s * length(c) / 4);
    if(s == 0) //north
        return {y:-c, x:-c + sectorOffset + 1};
    if(s == 1) //east
        return {y:-c + sectorOffset + 1, x:c};
    if(s == 2) //south
        return {y:c, x:c - sectorOffset - 1};
    // else, west
    return {y:c - sectorOffset - 1, x:-c};
}

function raycast(origin:Position,dir:Direction,grid:Grid<Tree>){
    let currentPos = {x:origin.x,y:origin.y};
    let currentTree = grid.get(origin) as Tree;
    let originTree = currentTree;
    while(!currentTree.isVisible(dir)) {
        let nextPos = addPos(currentPos,dir);
        let nextTree = grid.get(nextPos) as Tree;

        if(nextTree.height>=originTree.height){
            return;
        }

        currentPos = nextPos;
        currentTree = nextTree;
    }

    originTree.makeVisible(dir);
}

function solve(input:string){
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());

    let grid = new Grid<Tree>(lines[0].length,lines.length);
    //load grid
    let y = 0;
    for(let line of lines){
        for(let x = 0;x<line.length;++x){
            const pos = {x:x,y:y};
            const height = parseInt(line[x]);
            grid.set(pos,new Tree(height,grid.onEdge(pos)));
        }
        ++y;
    }

    for(let i = 0,visitedCells=0 ; visitedCells<grid.size;++i){
        const pos = position(i);
        if(grid.translateSpiralPos(pos).invalidPos(pos)){
            continue;
        }

        ++visitedCells;
        const tree = grid.get(pos);

        let count = 0;
    for(let i = 0;i<grid.size;++i){
        if(grid.elements[i].visible)
            ++count;
    }

        if(tree?.visible){
            continue;
        }
        
        raycast(pos,{x:0,y:-1},grid);
        raycast(pos,{x:0,y:1},grid);
        raycast(pos,{x:-1,y:0},grid);
        raycast(pos,{x:1,y:0},grid);
    }

    let count = 0;
    for(let i = 0;i<grid.size;++i){
        if(grid.elements[i].visible)
            ++count;
    }
    return count;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
});
