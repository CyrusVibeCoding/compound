import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
import {advance,factoryStats,upgradeBenefit,productionStatus} from '../src/production.mjs';
const seed=()=>({...migrate(INITIAL,0),placements:{core:[0,0,0]},factory:{charge:10,stored:7,lastTick:0},matter:500});
test('legacy fleet inherits purchased levels once without altering identity or work',()=>{
 const old={...INITIAL,levels:{core:3,press:2,assembler:1},machines:[{id:'core',kind:'core'},{id:'core-two',kind:'core'},{id:'press',kind:'press'},{id:'assembler',kind:'assembler'}],placements:{core:[0,0,0],'core-two':[3,0,0]},rotations:{'core-two':2},factory:{charge:61,stored:9,lastTick:0}};
 const migrated=migrate(old,0);assert.deepEqual(migrated.machines.map(m=>m.level),[3,3,2,1]);assert.deepEqual(migrated.placements,old.placements);assert.deepEqual(migrated.rotations,old.rotations);assert.deepEqual(migrated.factory,old.factory);assert.equal(migrated.invention.active,false);assert.deepEqual(migrate(migrated,0),migrated);assert.ok(validSave(migrated));
});
test('new machines start at one; individual upgrade and storage retain purchased levels',()=>{
 let s=reduce(seed(),{type:'upgrade',id:'core',now:0});s=reduce(s,{type:'place',id:'core-two',kind:'core',point:[3,0,0],now:0});assert.deepEqual(s.machines.map(m=>m.level),[2,1]);s=reduce(s,{type:'unplace',id:'core',now:0});assert.equal(s.machines[0].level,2);assert.equal(factoryStats(s).chargeCapacity,30);assert.equal(reduce(s,{type:'upgrade',id:'ghost',now:0}).matter,s.matter);
});
test('ten Charge installs a lasting frame while stored Matter is preserved',()=>{
 let s=reduce(seed(),{type:'build',active:true,project:'School',now:0});s=advance(s,5000);assert.equal(s.invention.work,10);assert.equal(s.factory.charge,0);assert.equal(s.factory.stored,7);assert.equal(s.matter,500);assert.equal(s.invention.project,'School');assert.ok(validSave(JSON.parse(JSON.stringify(s))));assert.equal(advance(s,86400000).invention.work,10);
});
test('offline and online construction agree; completion never consumes spare Charge',()=>{
 const s=reduce({...seed(),factory:{charge:80,stored:7,lastTick:0}},{type:'build',active:true,now:0});let online=s;for(let i=1;i<=60;i++)online=advance(online,i*1000);const offline=advance(s,60000);assert.deepEqual(online,offline);assert.equal(offline.invention.work,50);assert.equal(offline.factory.charge,30);assert.deepEqual(advance(offline,120000).factory,{...offline.factory,lastTick:120000});
});
test('no Core means no construction, pause resumes Matter, display has no accounting effect',()=>{
 let s=reduce(seed(),{type:'build',active:true,now:0});assert.equal(advance({...s,placements:{}},5000).invention.work,0);const shown=advance(s,2000),hidden=advance({...s,invention:{...s.invention,hidden:true}},2000);assert.deepEqual(shown.factory,hidden.factory);s=reduce(shown,{type:'build',active:false,now:2000});const next=advance(s,62000);assert.equal(next.invention.work,4);assert.equal(next.factory.stored,8);
});
test('upgrades improve finite construction output, settle old rate, and preview exact cost',()=>{
 let s=reduce(seed(),{type:'build',active:true,now:0});const benefit=upgradeBenefit(s,'core');assert.match(benefit,/50 → 45.5/);s=reduce(s,{type:'upgrade',id:'core',now:2000});assert.equal(s.invention.work,4);const next=advance(s,4000);assert.equal(next.invention.work,8.4);assert.equal(next.factory.charge,2);assert.equal(next.machines[0].level,2);
});
test('invalid levels and invention values cannot enter backup storage',()=>{
 for(const level of [0,4,1.5,NaN])assert.equal(validSave({...seed(),machines:[{id:'core',kind:'core',level}]}),false);
 for(const work of [-1,51,NaN,Infinity])assert.equal(validSave({...seed(),invention:{active:true,work,project:''}}),false);
});

test('full Matter storage never blocks construction status; project association can be cleared',()=>{let s=reduce({...seed(),factory:{charge:10,stored:20,lastTick:0}},{type:'build',active:true,project:'School',now:0});assert.equal(productionStatus(s),'Building');s=reduce(s,{type:'build',project:'',now:0});assert.equal(s.invention.project,'');assert.equal(advance(s,5000).invention.work,10);assert.equal(validSave({...s,invention:null}),false);});
