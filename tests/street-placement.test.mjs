import {test} from 'node:test';import assert from 'node:assert/strict';
import {snapPlacement} from '../src/placement.mjs';import {streetCollision} from '../src/streetPlacement.mjs';import {INITIAL,migrate,reduce} from '../src/game.mjs';import {walkingNetwork} from '../src/walking.mjs';
test('sidewalks attach to either road edge and end without building-sized clearance',()=>{
 for(let r=0;r<4;r++){const a=r*Math.PI/2,turn=([x,z])=>[Math.cos(a)*x+Math.sin(a)*z,0,-Math.sin(a)*x+Math.cos(a)*z];for(const side of [-1,1]){const buildings=[{id:'road',kind:'road'},{id:'walk',kind:'sidewalk'}],rotations={road:r,walk:(r+1)%4};assert.ok(snapPlacement({road:[0,0,0]},'walk',turn([side*1.5,0]),buildings,rotations,'sidewalk'));}
 assert.equal(streetCollision('sidewalk',turn([.5,2]),r,'road',[0,0,0],r),false);
 }
});
test('street placement blocks asphalt and buildings while preserving ordinary home clearance',()=>{
 assert.equal(streetCollision('sidewalk',[0,0,0],1,'road',[0,0,0],0),true);
 assert.equal(streetCollision('sidewalk',[.5,0,0],1,'road',[0,0,0],0),true);
 assert.equal(streetCollision('road',[.5,0,0],0,'road',[0,0,0],0),true);
 assert.equal(streetCollision('sidewalk',[0,0,1],0,'house',[0,0,0],0),true);
 assert.equal(snapPlacement({house:[0,0,0]},'other',[1.5,0,0]),null);
});
test('preview and purchase use the same footprints, reject overlapping rotations and permit undo',()=>{
 let s={...migrate(INITIAL,0),cash:1000};s=reduce(s,{type:'place',id:'road',kind:'road',point:[0,0,0],now:0});s=reduce(s,{type:'place',id:'walk',kind:'sidewalk',point:[.5,0,2],now:0});assert.deepEqual(s.placements.walk,[.5,0,2]);
 s=reduce(s,{type:'place',id:'walk',kind:'sidewalk',point:[1.5,0,0],now:0});s=reduce(s,{type:'rotate',id:'walk',now:0});assert.equal(s.rotations.walk,1);const rotated=reduce(s,{type:'rotate',id:'road',now:0});assert.equal(rotated.rotations.road,undefined);const undone=reduce(s,{type:'undoLayout',now:0});assert.equal(undone.rotations.walk,undefined);
});
test('a perpendicular sidewalk joins the middle of a road pedestrian edge',()=>{
 const n=walkingNetwork([{id:'road',kind:'road'},{id:'walk',kind:'sidewalk'}],{road:[0,0,0],walk:[1.5,0,0]},{walk:1});const route=n.route([2.5,0,0],[.5,0,1]);assert.ok(route.length>2);assert.ok(Math.hypot(route.at(-1)[0]-.5,route.at(-1)[2]-1)<.01);assert.ok(route.every(p=>p[0]>=.5));
});
test('a sidewalk can sit flush along the outside of the built-in road sidewalk',()=>{
 const buildings=[{id:'road',kind:'road'},{id:'walk',kind:'sidewalk'}];assert.deepEqual(snapPlacement({road:[0,0,0]},'walk',[.8,0,0],buildings,{},'sidewalk'),[.8,0,0]);const n=walkingNetwork(buildings,{road:[0,0,0],walk:[.8,0,0]},{});assert.ok(n.edges.some(([a,b])=>Math.abs(a[0]-b[0])>.29&&Math.abs(a[0]-b[0])<.31&&Math.abs(a[2]-b[2])<.01));
});
