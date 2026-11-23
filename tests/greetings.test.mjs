import {test} from 'node:test';import assert from 'node:assert/strict';
import {greetingWorld,stepGreetings} from '../src/greetings.mjs';
const actor=(x,z,overrides={})=>({x,z,walking:true,readyAt:0,greeting:null,...overrides});
const advance=(w,seconds,opts={})=>{for(let i=0;i<seconds*10;i++)stepGreetings(w,.1,opts)};
test('nearby walkers pair, face one another, finish and observe a cooldown',()=>{
 const w=greetingWorld(),a=actor(0,0),b=actor(.5,0);w.actors.set('a',a);w.actors.set('b',b);stepGreetings(w,.1);
 assert.ok(a.greeting&&b.greeting);assert.equal(a.greeting.angle,Math.PI/2);assert.equal(b.greeting.angle,-Math.PI/2);
 advance(w,3);assert.equal(a.greeting,null);assert.equal(b.greeting,null);advance(w,20);assert.equal(a.greeting,null);
 advance(w,3);assert.ok(a.greeting);
});
test('distant, overlapping, resting, or cooling-down residents do not greet',()=>{
 for(const b of [actor(3,0),actor(.1,0),actor(.5,0,{walking:false}),actor(.5,0,{readyAt:10})]){const w=greetingWorld();w.actors.set('a',actor(0,0));w.actors.set('b',b);stepGreetings(w,.1);assert.equal(b.greeting,null);}
});
test('only two pairs greet at once; paused and hidden time cannot advance greetings',()=>{
 const w=greetingWorld();for(let i=0;i<8;i++)w.actors.set(i,actor(i*.3,0));stepGreetings(w,.1);
 assert.equal([...w.actors.values()].filter(a=>a.greeting).length,4);
 const t=w.time;advance(w,5,{paused:true});advance(w,5,{hidden:true});assert.equal(w.time,t);
 stepGreetings(w,.1,{reduced:true});assert.ok([...w.actors.values()].every(a=>!a.greeting));
});
test('a lone walker never greets and deleting a resident is safe',()=>{
 const w=greetingWorld();w.actors.set('a',actor(0,0));advance(w,30);assert.equal(w.actors.get('a').greeting,null);
 w.actors.clear();advance(w,5);assert.equal(w.actors.size,0);
});
