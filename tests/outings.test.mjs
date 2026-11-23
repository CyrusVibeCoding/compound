import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeOuting,outingStops} from '../src/outings.mjs';
const home=[0,.03,1.5],shop={id:'coffee',kind:'cafe',point:[3,0,1],facing:Math.PI},park={id:'green',kind:'park',point:[3,0,4],facing:Math.PI};
const visits=plan=>plan.segments.filter(s=>s.type==='visit');
test('errands go shop to park to home, with contiguous timed segments and walking speed',()=>{
 const plan=makeOuting(home,[shop,park],[[0,0,0]]);
 assert.deepEqual(visits(plan).map(s=>s.stop.id),['coffee','green']);
 assert.ok(Math.abs(visits(plan)[0].end-visits(plan)[0].start-14)<1e-8);
 assert.ok(Math.abs(visits(plan)[1].end-visits(plan)[1].start-7)<1e-8);
 assert.deepEqual(plan.segments.at(-1).point,home);
 let time=0;for(const s of plan.segments){assert.equal(s.start,time);assert.ok(s.end>s.start);time=s.end;if(s.type==='walk')assert.ok(Math.abs((s.end-s.start)*.38-s.lengths.at(-1))<1e-8)}
 assert.equal(plan.duration,time);
});
test('blocked shops are skipped while a reachable park can still be visited',()=>{
 const plan=makeOuting(home,[shop,park],[{point:shop.point,radius:.6}]);
 assert.deepEqual(visits(plan).map(s=>s.stop.id),['green']);
 assert.deepEqual(plan.segments.at(-1).point,home);
});
test('empty or entirely blocked outings safely stay home without visits',()=>{
 for(const stops of [[],[shop]]){const plan=makeOuting(home,stops,[{point:shop.point,radius:1}]);assert.equal(visits(plan).length,0);assert.equal(plan.duration,12);assert.deepEqual(plan.segments[0].point,home)}
});
test('all destinations remain represented with multiple shops, only parks, or only shops',()=>{
 const shops=Array.from({length:4},(_,n)=>({...shop,id:'shop'+n}));
 for(const destinations of [shops,[park],[...shops,park],[]])for(let index=0;index<5;index++){
  const plans=outingStops(destinations,index);
  assert.deepEqual(new Set(plans.flat().map(s=>s.id)),new Set(destinations.map(s=>s.id)));
  assert.ok(plans.every(stops=>stops.length<=2));
 }
 assert.deepEqual(outingStops([shop,park],0)[0],[shop,park]);
});
