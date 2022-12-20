import * as aocutils from "./aocutils";
const DAY = 12;
//implemented dijkstra a few days ago so i just took that

type Up = {x:0,y:-1};
type Down = {x:0,y:1};
type Left = {x:-1,y:0};
type Right = {x:1,y:0};
type Direction = Up|Down|Left|Right;

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

interface HeapRecord {
    pos:number;
    priority:number;
}

class FibonacciHeap<T> {

    elements:T[];
    records:Map<T,HeapRecord>;

    constructor(){
        this.elements=[];
        this.records=new Map;
    }

    private static getParent(i:number) {
        return Math.floor((i-1)/2);
    }

    private static getLeft(i:number) {
        return 2*i+1;
    }

    private static getRight(i:number) {
        return 2*i+2;
    }

    private heapifyUp(i:number) {
        if (i>0) {
            let j = FibonacciHeap.getParent(i);
            let ei = this.elements[i];
            let ej = this.elements[j];
            if(this.records.get(ei)!.priority<this.records.get(ej)!.priority){
                this.swap(i,j);
                this.heapifyUp(j);
            }
        }
    }

    private heapifyDown(i:number){
        let li = FibonacciHeap.getLeft(i);
        if(li>=this.elements.length){
            return;
        }

        let minI=li;
        let minChild=this.elements[minI];
        let ri = FibonacciHeap.getRight(i);
        //check if right child exists and find child with min priority
        if(ri<this.elements.length) {
            let er = this.elements[ri];
            if(this.records.get(er)!.priority < 
                this.records.get(minChild)!.priority){
                minI=ri;
                minChild=er;   
            }
        }

        //check heap condition
        let ei=this.elements[i];
        if(this.records.get(minChild)!.priority < 
            this.records.get(ei)!.priority) {
            this.swap(i,minI);
            this.heapifyDown(minI);
        }
    }

    private swap(i:number,j:number) {
        //change position mapping
        this.records.get(this.elements[i])!.pos = j;
        this.records.get(this.elements[j])!.pos = i;

        let tmp = this.elements[i];
        this.elements[i] = this.elements[j];
        this.elements[j] = tmp;
    }

    /**
     * decreases priority of given element to new value if smaller
     * @param el 
     * @param newPriority 
     */
    decreasePriority(el:T,newPriority:number) {
        let record = this.records.get(el);
        if(record && record.priority>newPriority){
            record.priority=newPriority;
            this.heapifyUp(record.pos);
        }
    }

    insert(el:T, priority:number) {
        this.elements.push(el);
        this.records.set(el,{pos:this.elements.length-1,priority:priority});
        this.heapifyUp(this.elements.length-1);
    }

    /**
     * removes and returns element with smallest priority and associated priority or undefined if heap is empty
     */
    pop():[T,number] | undefined {
        if(this.elements.length===0) {
            return undefined;
        }
        //put min element at last position
        if(this.elements.length>1){
            this.swap(0,this.elements.length-1);
        }

        //store return value
        let rValue=this.elements.pop() as T;

        //restore heap condition
        if(this.elements.length>0) {
            this.heapifyDown(0);
        }

        let record = this.records.get(rValue);
        this.records.delete(rValue);
        return [rValue,record!.priority];
    }

    isEmpty():boolean{
        return this.elements.length===0;
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

    toIndex(pos:Position):number{
        return pos.y * this.width + pos.x;
    }

    toPos(index:number):Position{
        return {x:index%this.width,y:Math.floor(index/this.width)};
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

    getByIndex(index:number):T|undefined{
        if(index<0 || index>=this.size){
            return undefined;
        }

        return this.elements[index];
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

function solve(input:string):number{
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());

    const startPos = {x:-1,y:-1};
    const targetPos = {x:-1,y:-1};
    let grid = new Grid<number>(lines[0].length,lines.length);
    //load grid
    let y = 0;
    for(let line of lines){
        for(let x = 0;x<line.length;++x){
            const pos = {x:x,y:y};
            let char = line[x];
            if(char == 'S'){
                startPos.x=pos.x;
                startPos.y=pos.y;
                char = 'a';
            } else if (char == 'E'){
                targetPos.x=pos.x;
                targetPos.y=pos.y;
                char = 'z';
            }
            const height = char.charCodeAt(0);
            grid.set(pos,height);
        }
        ++y;
    }

    //dijkstra algorithm with fibonacci heap
    const startIndex = grid.toIndex(startPos);
    const targetIndex = grid.toIndex(targetPos);

    let weights:Record<number,number>={};
    let heap:FibonacciHeap<number> = new FibonacciHeap();
    let predecessors:Record<number,number>={};

    //set values for start node
    weights[startIndex] = 0;
    heap.insert(startIndex,0);

    //init weights
    for(let i = 0;i<grid.size;++i){

        if(i==startIndex)
            continue;

        weights[i]=Number.MAX_VALUE;
        heap.insert(i,Number.MAX_VALUE);
        predecessors[i]=-1;
    }

    //perform search
    while(!heap.isEmpty()){
        //get node with lowest weight
        let u = heap.pop()![0];
        const currentAltitude = grid.getByIndex(u) as number;

        if(u===targetIndex){
            break;
        }

        //iterate over all neighbors of chosen node
        //a neighbor is a horizontally or vertically adjacent grid cell with at most 1 altitude difference
        const currentPos : Vector = grid.toPos(u) as Vector;
        const neighbors = [
            Vector.add(currentPos,new Vector(-1,0)),
            Vector.add(currentPos,new Vector(1,0)),
            Vector.add(currentPos,new Vector(0,-1)),
            Vector.add(currentPos,new Vector(0,1)),
        ].filter((pos)=>!grid.invalidPos(pos) && (grid.get(pos) as number)-currentAltitude<2);
        for(let neighborPos of neighbors) {
            let v = grid.toIndex(neighborPos);
            if(predecessors[v] == u){
                continue;
            }

            let distOverU = 1+weights[u];
            //check if the path to v over u is better
            if(distOverU<weights[v]) {
                //set predecessor to u
                predecessors[v]=u;
                weights[v]=distOverU;
                heap.decreasePriority(v,distOverU);
            }
        }
    }

    return weights[targetIndex];
}

function solve2(input:string):number{
    let lines = input.split(/\r?\n/);
    lines = lines.filter((line)=>line.trim());

    const startPos = {x:-1,y:-1};
    const targetPos = {x:-1,y:-1};
    let grid = new Grid<number>(lines[0].length,lines.length);
    //load grid
    let y = 0;
    for(let line of lines){
        for(let x = 0;x<line.length;++x){
            const pos = {x:x,y:y};
            let char = line[x];
            if(char == 'S'){
                startPos.x=pos.x;
                startPos.y=pos.y;
                char = 'a';
            } else if (char == 'E'){
                targetPos.x=pos.x;
                targetPos.y=pos.y;
                char = 'z';
            }
            const height = char.charCodeAt(0);
            grid.set(pos,height);
        }
        ++y;
    }

    //dijkstra algorithm with fibonacci heap
    const startIndex = grid.toIndex(targetPos);//START AT DESTINATION!!!

    let weights:Record<number,number>={};
    let heap:FibonacciHeap<number> = new FibonacciHeap();
    let predecessors:Record<number,number>={};

    //set values for start node
    weights[startIndex] = 0;
    heap.insert(startIndex,0);

    //init weights
    for(let i = 0;i<grid.size;++i){

        if(i==startIndex)
            continue;

        weights[i]=Number.MAX_VALUE;
        heap.insert(i,Number.MAX_VALUE);
        predecessors[i]=-1;
    }

    //perform search
    while(!heap.isEmpty()){
        //get node with lowest weight
        let u = heap.pop()![0];
        const currentAltitude = grid.getByIndex(u) as number;

        if(currentAltitude==='a'.charCodeAt(0)){
            return weights[u];
        }

        //iterate over all neighbors of chosen node
        //a neighbor is a horizontally or vertically adjacent grid cell with at most 1 altitude difference
        const currentPos : Vector = grid.toPos(u) as Vector;
        const neighbors = [
            Vector.add(currentPos,new Vector(-1,0)),
            Vector.add(currentPos,new Vector(1,0)),
            Vector.add(currentPos,new Vector(0,-1)),
            Vector.add(currentPos,new Vector(0,1)),
        ].filter((pos)=>!grid.invalidPos(pos) && (grid.get(pos) as number)-currentAltitude>-2);
        for(let neighborPos of neighbors) {
            let v = grid.toIndex(neighborPos);
            if(predecessors[v] == u){
                continue;
            }

            let distOverU = 1+weights[u];
            //check if the path to v over u is better
            if(distOverU<weights[v]) {
                //set predecessor to u
                predecessors[v]=u;
                weights[v]=distOverU;
                heap.decreasePriority(v,distOverU);
            }
        }
    }

    return -1;
}


aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input));
    console.log("=========================");
    console.log(solve2(input));

});
