import * as aocutils from "./aocutils";
const DAY = 7;

abstract class FileSystemNode{
    parent?:Directory;
    name:string;

    constructor(name:string){
        this.name=name;
    }

    isDirectory() : this is Directory{
        return this instanceof Directory;
    }

    isRoot():boolean{
        return !this.parent;
    }

    getRoot():FileSystemNode{
        let value = this as FileSystemNode;
        while(value.parent){
            value = value.parent as FileSystemNode;
        }

        return value;
    }

    abstract getSize():number;
}

class Directory extends FileSystemNode{
    private children:FileSystemNode[]=[];

    constructor(name:string){
        super(name);
    }

    getSize(): number {
        return this.children.map((node)=>node.getSize()).reduce((sum,size)=>sum+size,0);
    }

    getChild(childName:string):FileSystemNode|undefined{
        return this.children.find((child)=>child.name==childName);
    }

    addChild(child:FileSystemNode){
        this.children.push(child);
        child.parent=this;
    }

    sum(predicate:(node:FileSystemNode)=>boolean):number{
        let sum = 0;
        if(predicate(this)){
            sum+=this.getSize();
        }

        for(let child of this.children){
            if(child.isDirectory()){
                sum += child.sum(predicate);
            }
        }

        return sum;
    }

    min(predicate:(node:FileSystemNode)=>boolean):number{
        let min = Number.MAX_VALUE;
        if(predicate(this)){
            min = this.getSize();
        }

        for(let child of this.children){
            if(child.isDirectory()){
                min = Math.min(min,child.min(predicate));
            }
        }

        return min;
    }
}

class File extends FileSystemNode{
    size:number;

    constructor(name:string,size:number){
        super(name);
        this.size=size;
    }

    getSize(): number {
        return this.size;
    }
}



function getFileSystem(input:string) : Directory{
    let fileNode = new Directory("");
    let lines = input.split(/\r?\n/);

    for(let line of lines){
        if(!line.trim()){
            continue;
        }

        //is it a command?
        if(line.startsWith("$")) {
            const tokens = line.split(" ");
            const command = tokens[1];
            if(command=="ls"){
                continue;
            } else if (command=="cd"){
                let path = tokens[2];
                if(path == "/"){
                    fileNode = fileNode.getRoot() as Directory;
                } else if (path == ".."){
                    if(fileNode.parent){
                        fileNode = fileNode.parent;
                    }
                } else {
                    let child = fileNode.getChild(path);
                    if(child?.isDirectory()){
                        fileNode = child;
                    }
                }
            } else {
                console.warn(`unknown command ${command}`);
            }
        }
        else {
            const tokens = line.split(" ");
            if(tokens[0]=="dir"){
                fileNode.addChild(new Directory(tokens[1]));
            }
            else {
                fileNode.addChild(new File(tokens[1],parseInt(tokens[0])));
            }
        }
    }
    fileNode = fileNode.getRoot() as Directory;
    return fileNode;
}

aocutils.getInput(DAY).then((input)=>{
    let rootDir = getFileSystem(input);
    const SPACE = 70000000;
    const UPDATE_SIZE = 30000000;
    const freeSpace = SPACE - rootDir.getSize();
    const neededSpace = UPDATE_SIZE-freeSpace;
    console.log(rootDir.sum((node)=>!node.isRoot()&&node.isDirectory()&&node.getSize()<=100000));
    console.log("=========================");
    console.log(rootDir.min((node)=>node.isDirectory()&&node.getSize()>=neededSpace));
});
