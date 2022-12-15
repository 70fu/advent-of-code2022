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

function raycast(origin:Position,dir:Direction,grid:Grid<Tree>){
    let currentPos = origin
    let currentTree = grid.get(origin) as Tree;
    let originTree = currentTree;
    let highest = originTree.height;
    do {
        if(highest<currentTree.height){
            currentTree.makeVisible(dir);
            highest = currentTree.height;
            if(highest==9){
                return;
            }
        }
        currentPos = addPos(currentPos,dir);
        currentTree = grid.get(currentPos) as Tree;
    }while(!grid.invalidPos(currentPos) && !grid.onEdge(currentPos));
}

function calcScenicScore(origin:Position,grid:Grid<Tree>){
    return getLookDistance(origin,{x:-1,y:0},grid) *
    getLookDistance(origin,{x:1,y:0},grid) *
    getLookDistance(origin,{x:0,y:-1},grid) *
    getLookDistance(origin,{x:0,y:1},grid);
}

function getLookDistance(origin:Position,dir:Direction,grid:Grid<Tree>):number{
    let distance = 0;
    let originTree = grid.get(origin) as Tree;
    let pos = addPos(origin,dir);
    while(!grid.invalidPos(pos)){
        ++distance;
        let tree = grid.get(pos) as Tree;
        if(tree.height>=originTree.height){
            return distance;
        }

        pos = addPos(pos,dir);
    }
    return distance;
}

function loadGrid(input:string):Grid<Tree>{
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

    return grid;
}

function solve(input:string){
    let grid = loadGrid(input);

    for(let x = 1;x<grid.width-1;++x){
        raycast({x:x,y:grid.height-1},{x:0,y:-1},grid);
        raycast({x:x,y:0},{x:0,y:1},grid);
    }
    for(let y = 1;y<grid.height-1;++y){
        raycast({x:0,y:y},{x:1,y:0},grid);
        raycast({x:grid.width-1,y:y},{x:-1,y:0},grid);
    }

    let count = 0;
    for(let i = 0;i<grid.size;++i){
        if(grid.elements[i].visible)
            ++count;
    }
    return count;
}

function solve2(input:string){
    let grid = loadGrid(input);

    //pretty much brute forcing
    let bestScenicScore = 0;
    for(let x = 1;x<grid.width-1;++x){
        for(let y = 1;y<grid.height-1;++y){
            bestScenicScore = Math.max(bestScenicScore,calcScenicScore({x:x,y:y},grid));
        }
    }

    return bestScenicScore;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve2(input));
});
