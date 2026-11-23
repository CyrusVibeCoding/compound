import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
import {buildingCost,cityStats,advanceRent} from '../src/city.mjs';
import {walkingNetwork} from '../src/walking.mjs';
import {activityWorld,beginVisit,releaseVisit,parkActivity,parkPose,PLAZA_SPOTS} from '../src/placeActivity.mjs';
import {makeOuting,outingStops} from '../src/outings.mjs';
import {advanceRoutine} from '../src/routines.mjs';
test('plaza ownership escalates normally, survives backups and storage, and creates no income',()=>{
 let s={...migrate(INITIAL,0),cash:500};s=reduce(s,{type:'place',id:'square',kind:'plaza',point:[0,0,0],now:0});
 assert.equal(s.cash,450);assert.equal(buildingCost(s,'plaza'),60);assert.deepEqual(cityStats(s),{residents:0,rent:0,homes:0});assert.equal(advanceRent(s,86400000).cash,450);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 assert.equal(reduce(s,{type:'shopSale',shopId:'square',homeId:'square',resident:0,now:0}).cash,450);
 s=reduce(s,{type:'rotate',id:'square',now:0});s=reduce(s,{type:'unplace',id:'square',now:0});s=reduce(s,{type:'place',id:'square',kind:'plaza',point:[3,0,0],now:0});assert.equal(s.cash,450);assert.equal(s.rotations.square,1);
 s=reduce(s,{type:'undoLayout',now:0});assert.equal(s.placements.square,undefined);assert.ok(validSave(s));
});
test('plaza seats are exclusive and each rotated activity avoids the planter and returns to its entrance',()=>{
 const w=activityWorld();for(let i=0;i<3;i++)assert.ok(beginVisit(w,'r'+i,'square','plaza',i));assert.equal(beginVisit(w,'extra','square','plaza'),null);releaseVisit(w,'r0');assert.ok(beginVisit(w,'extra','square','plaza'));assert.equal(w.shops.size,0);
 for(let r=0;r<4;r++){
  const angle=r*Math.PI/2,entrance=[3+Math.cos(angle)*.5,0,-Math.sin(angle)*.5],planter=[3-Math.cos(angle)*.42,Math.sin(angle)*.42];
  for(const spot of PLAZA_SPOTS){const plan=parkActivity(entrance,r,spot),out={};for(let t=0;t<=plan.duration;t+=.1){parkPose(plan,t,out);assert.ok(Math.hypot(out.x-planter[0],out.z-planter[1])>.3)}parkPose(plan,plan.duration,out);assert.ok(Math.hypot(out.x-entrance[0],out.z-entrance[2])<1e-8);}
 }
});
test('plazas are connected at every rotation and shop outings can stop there without duplicate plaza stops',()=>{
 for(let r=0;r<4;r++){
  const n=walkingNetwork([{id:'home',kind:'house'},{id:'square',kind:'plaza'}],{home:[0,0,0],square:[3,0,0]},{square:r});
  const plan=makeOuting(n.entrances[0].point,[n.entrances[1]],n.obstacles,n.route);assert.equal(plan.segments.filter(s=>s.type==='visit').length,1);
 }
 const stops=[{id:'coffee',kind:'cafe'},{id:'square',kind:'plaza'}];const plans=outingStops(stops,0);assert.deepEqual(plans[0],stops);assert.ok(plans.every(p=>new Set(p.map(s=>s.id)).size===p.length));
});
test('elapsed-time continuity treats plaza activities as full visits without any payment callback',()=>{
 const outings=[{segments:[{type:'visit',stop:{kind:'plaza'},start:0,end:7},{type:'home',start:7,end:12}]}];
 const s=advanceRoutine(outings,{trip:0,segment:0,time:0,parkElapsed:4,carrying:'cafe'},8,()=>20);assert.equal(s.segment,0);assert.equal(s.parkElapsed,12);assert.equal(s.carrying,'cafe');
});

test('neighbors on opposite plaza benches can greet without affecting ordinary street distances',async()=>{
 const {greetingWorld,stepGreetings}=await import('../src/greetings.mjs');
 for(const same of [true,false]){const w=greetingWorld(),a={x:0,z:.49,walking:true,readyAt:0,greeting:null,socialPlace:'square'},b={...a,z:-.49,socialPlace:same?'square':'other'};w.actors.set('a',a);w.actors.set('b',b);stepGreetings(w,.1);assert.equal(!!a.greeting,same);}
});
