import * as aocutils from "./aocutils";
const DAY = 11;

//for learning purposes I created an interpreted language for parsing the input file and use the interpreter to initialize my 'monkey engine'

import grammar, {MonkeyScriptSemantics} from './monkeyScript.ohm-bundle';

type MonkeyOperation = (old:number)=>number;
type MonkeyTestFun = (worryLevel:number)=>number;

interface MonkeyTest{
    divisor:number;
    trueMonkey:number;
    falseMonkey:number;
    test:MonkeyTestFun;
}
interface Monkey{
    id:number;
    items:number[];
    operation:MonkeyOperation;
    testParameter:MonkeyTest;
    monkeyBusiness?:number;
}

//euclidian algorithm
function gcd(a:number,b:number):number{
    return b==0?a:gcd(b,a%b);
}

function lcm(a:number,b:number):number{
    return a*b/gcd(a,b);
}

class MonkeyEngine{
    monkeys:Record<number,Monkey>={};
    lcm:number=0;

    calcLCM(){
        let divisors = Object.values(this.monkeys).map((monkey)=>monkey.testParameter.divisor);
        if(divisors.length==0){
            return;
        }

        this.lcm = divisors[0];
        for(let i = 1 ; i<divisors.length;++i){
            this.lcm = lcm(this.lcm,divisors[i]);
        }
    }

    executeRound(worryLevelDivisor:number = 1){
        for(let id in this.monkeys){
            const monkey = this.monkeys[id];            

            while(monkey.items.length>0){
                //increase monkey business
                if(!monkey.monkeyBusiness){
                    monkey.monkeyBusiness=1;
                } else{
                    ++monkey.monkeyBusiness;
                }

                //obtain and remove first item
                let item = monkey.items.splice(0,1)[0];

                //perform operation
                item = monkey.operation(item);

                //divide worry level by divisor
                item = Math.floor(item/worryLevelDivisor);

                //reduce worry level by lcm to prevent too large numbers
                item = item%this.lcm;

                //perform test
                const targetMonkey = monkey.testParameter.test(item);

                //throw to other monkey
                this.monkeys[targetMonkey].items.push(item);
            }
        }
    }

    get monkeyBusiness(){
        let businesses = Object.values(this.monkeys).filter((monkey)=>monkey.monkeyBusiness || monkey.monkeyBusiness==0).map((monkey)=>monkey.monkeyBusiness) as number[];
        if(businesses.length<2){
            return 0;
        }
        businesses.sort((a,b)=>a-b);
        return (businesses.at(-1) as number)* (businesses.at(-2) as number);
    }
}

const semantics = grammar.createSemantics();

//register actions
semantics.addOperation<any>(`createEngine()`,{
    Monkeys(monkeyNodes){
        let engine = new MonkeyEngine;
        let monkeys = monkeyNodes.children.map((monkey)=>monkey.createEngine()) as Monkey[];
        monkeys.sort((a,b)=>a.id-b.id);
        for(let monkey of monkeys){
            engine.monkeys[monkey.id]=monkey;
        }
        engine.calcLCM();
        return engine;
    },
    Monkey(t1,id,t2,startingItemsLine,operationLine,testLine) :Monkey{
        let monkey:Monkey = {
            id:id.createEngine() as number,
            items:startingItemsLine.createEngine() as number[],
            operation:operationLine.createEngine() as MonkeyOperation,
            testParameter:testLine.createEngine() as MonkeyTest
        } as Monkey;        
        return monkey;
    },
    StartingItems(t1,inventory){
        return inventory.createEngine();
    },
    Inventory(first, t1, others) {
        return [first.createEngine(),...others.children.map((num)=>num.createEngine())];
    },
    OperationLine(t1, op) {
        return op.createEngine();
    },
    Operation(t1, t2, exp) {
        return exp.createEngine();
    },
    MulExp(o1, t1, o2) {
        const f1 = o1.sourceString=="old"?1:0;
        const f2 = o2.sourceString=="old"?1:0;
        const f3 = f1==0 ? parseInt(o1.sourceString) : 1;
        const f4 = f2==0 ? parseInt(o2.sourceString) : 1;

        return (old:number)=>{
            return Math.pow(old,f1) *
                    Math.pow(old,f2) *
                    f3 *
                    f4
        }

    },
    AddExp(o1,t1,o2){
        const f1 = o1.sourceString=="old"?1:0;
        const f2 = o2.sourceString=="old"?1:0;
        const f3 = f1==0 ? parseInt(o1.sourceString) : 0;
        const f4 = f2==0 ? parseInt(o2.sourceString) : 0;

        return (old:number)=>{
            return f1*old +
                    f2*old +
                    f3 +
                    f4
        }
    },
    Test(t1,divisorNode,trueCon,falseCon):MonkeyTest{
        const divisor=divisorNode.createEngine();
        const trueMonkey=trueCon.createEngine();
        const falseMonkey=falseCon.createEngine();

        return {
            divisor:divisor,
            trueMonkey:trueMonkey,
            falseMonkey:falseMonkey,
            test:(worryLevel:number)=>{
                if(worryLevel%divisor==0){
                    return trueMonkey;
                }
                return falseMonkey;
            }
        };
    },
    TrueCondition(t1, monkeyId) {
        return monkeyId.createEngine();
    },
    FalseCondition(t1, monkeyId) {
        return monkeyId.createEngine();
    },
    number(_){
        return parseInt(this.sourceString);
    }
});


function solve(input:string,rounds:number,divisor:number=1) : number{
    const matchResult = grammar.match(input);
    let monkeyEngine = semantics(matchResult).createEngine() as MonkeyEngine;
    for(let i = 0;i<rounds;++i){
        monkeyEngine.executeRound(divisor);
    }
    return monkeyEngine.monkeyBusiness;
}

aocutils.getInput(DAY).then((input)=>{
    console.log(solve(input,20,3));
    console.log(solve(input,10000,1));
});
