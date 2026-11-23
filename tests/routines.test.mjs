import {test} from 'node:test';import assert from 'node:assert/strict';
import {advanceRoutine,loadRoutines,rememberRoutine,savedRoutine,captureRoutines,validRoutines} from '../src/routines.mjs';
const outings=[{segments:[{type:'walk',start:0,end:10},{type:'visit',stop:{kind:'park'},start:10,end:17},{type:'home',start:17,end:22}]}];
const seed={trip:0,segment:0,time:4,parkElapsed:0,carrying:'cafe',at:100,layout:'layout'};
test('time away advances walking, park activity and complete cycles without replaying money',()=>{
 let s=advanceRoutine(outings,seed,9,()=>20);assert.equal(s.segment,1);assert.equal(s.parkElapsed,3);
 s=advanceRoutine(outings,s,26,()=>20);assert.equal(s.trip,1);assert.equal(s.segment,0);assert.equal(s.time,4);assert.equal(s.carrying,'');
 s=advanceRoutine(outings,seed,35*1000000,()=>20);assert.equal(s.trip,1000000);assert.equal(s.time,4);
});
test('snapshots survive remounts/backups, reject changed layouts, and prune removed homes',()=>{
 loadRoutines(undefined);rememberRoutine('home-0',seed);assert.deepEqual(savedRoutine('home-0','layout'),seed);assert.equal(savedRoutine('home-0','changed'),null);
 const saved=JSON.parse(JSON.stringify(captureRoutines({buildings:[{id:'home'}]})));loadRoutines(saved.routines);assert.deepEqual(savedRoutine('home-0','layout'),seed);assert.equal(validRoutines(saved.routines),true);
 assert.deepEqual(captureRoutines({buildings:[]}).routines,{});loadRoutines(undefined);assert.equal(savedRoutine('home-0','layout'),null);
});
test('backwards clocks do not rewind and malformed snapshots are rejected',()=>{
 assert.equal(advanceRoutine(outings,seed,-5,()=>20).time,4);
 for(const bad of [{...seed,time:NaN},{...seed,carrying:'money'},{...seed,segment:-1}])assert.equal(validRoutines({'home-0':bad}),false);
});
