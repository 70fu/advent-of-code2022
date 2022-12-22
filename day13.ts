import * as aocutils from "./aocutils";
const DAY = 13;

type PacketValue = Array<PacketValue> | number;
type Packet = Array<PacketValue>;

function parse(packet:Packet,line:string,startIndex:number):number{
    for(let i = startIndex ; i<line.length;){
        const char = line[i];
        if(char=='['){
            let subPacket:Packet = [];
            i = parse(subPacket,line,i+1);
            packet.push(subPacket);
        } else if(char ==','){
            ++i;
        } else if(char ==']'){
            return i+1;
        } else {
            //consume number
            let numberEnd=i+1;
            for(;numberEnd<line.length;numberEnd++){
                const charJ=line[numberEnd];
                if(charJ==',' || charJ == ']'){
                    break;
                }
            }
            let element = line.substring(i,numberEnd);
            packet.push(parseInt(element));
            i+=element.length;
        }
    }

    return line.length;
}

function parseLine(line:string):Packet{
    let packet:Packet = [];
    parse(packet,line,1);
    return packet;
}

function compare(p1:PacketValue,p2:PacketValue):number{
        if(typeof p1==="number" && typeof p2==="number"){
            return p1-p2;
        } else if(Array.isArray(p1) && Array.isArray(p2)) {
            for(let i = 0;i<p1.length;++i){
                //if right runs out of items first, then out of order
                if(i>=p2.length){
                    return 1;
                }

                const c = compare(p1[i],p2[i]);
                if(c!=0){
                    return c;
                }
            }

            //if left list runs out of items first, in order, otherwide continue
            return p1.length-p2.length;
        }
        else if(typeof p1==="number" && Array.isArray(p2)){
            return compare([p1],p2);
        } else {// if(typeof p2==="number" && Array.isArray(p1))
            return compare(p1,[p2]);
        }
}

function solve(input:string){
    let lines = input.split(/\r?\n/);
    let correctPairs = 0;
    let packets = [];

    //solve part 1
    for(let lineIndex = 0,pair=1; lineIndex<lines.length-1;lineIndex+=3,++pair){
        const line1 = lines[lineIndex];
        const line2 = lines[lineIndex+1];
        const p1 = parseLine(line1);
        const p2 = parseLine(line2);
        packets.push(p1,p2);

        if(compare(p1,p2)<=0){
            correctPairs+=pair;
        }
    }

    console.log(`Correct pairs: ${correctPairs}`);


    //add divider packets
    const DIVIDER_1:Packet = [[2]];
    const DIVIDER_2:Packet = [[6]];
    packets.push(DIVIDER_1,DIVIDER_2);

    //sort
    packets.sort(compare);

    const d1Index = packets.indexOf(DIVIDER_1);
    const d2Index = packets.indexOf(DIVIDER_2);

    console.log(`Decoder Key: ${(d1Index+1)*(d2Index+1)}`);
}


aocutils.getInput(DAY).then((input)=>{
    solve(input);
});
