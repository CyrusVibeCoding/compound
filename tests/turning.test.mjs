import {test} from 'node:test';import assert from 'node:assert/strict';
import {turnTowards} from '../src/turning.mjs';
test('turns ease along the shortest arc across the angle seam',()=>{
 const a=179*Math.PI/180,b=-179*Math.PI/180,next=turnTowards(a,b,1/60);
 assert.ok(next>a&&next<a+2*Math.PI/180);
 let heading=0;for(let i=0;i<30;i++)heading=turnTowards(heading,Math.PI/2,1/60);
 assert.ok(Math.abs(heading-Math.PI/2)<.005);
});
test('turning is frame-rate independent and has no motion at zero delta',()=>{
 const run=hz=>{let a=0;for(let i=0;i<hz;i++)a=turnTowards(a,2,1/hz);return a};
 assert.ok(Math.abs(run(30)-run(60))<1e-10);assert.equal(turnTowards(1,2,0),1);
});
