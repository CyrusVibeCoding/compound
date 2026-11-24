import {test} from 'node:test';import assert from 'node:assert/strict';
import {streetCollision} from '../src/streetPlacement.mjs';import {parkingRoadGuides,snapStreetConnection,streetPorts} from '../src/streetConnections.mjs';
import {roadNetwork} from '../src/transport.mjs';import {INITIAL,migrate,reduce} from '../src/game.mjs';
test('both curve ends accept straight roads and both parking sizes at every rotation',()=>{
 for(let r=0;r<4;r++){const a=r*Math.PI/2,rotate=([x,z])=>[Math.cos(a)*x+Math.sin(a)*z,0,-Math.sin(a)*x+Math.cos(a)*z];
  for(const kind of ['road','parking-small','parking-big'])for(const [p,rot] of [[[0,-2],kind==='road'?0:2],[[2,0],1]]){
   const point=rotate(p),rotation=(r+rot)%4;assert.equal(streetCollision('curved-road',[0,0,0],r,kind,point,rotation),false,kind+' rotation '+r);
   const buildings=[{id:'curve',kind:'curved-road'},{id:'next',kind}],placements={curve:[0,0,0],next:point},rotations={curve:r,next:rotation},n=roadNetwork(buildings,placements,rotations),port=streetPorts(kind,point,rotation).find(p=>streetPorts('curved-road',[0,0,0],r).some(c=>Math.hypot(c.point[0]-p.point[0],c.point[2]-p.point[2])<.01));assert.ok(port);assert.ok(n.route(port.point,streetPorts('curved-road',[0,0,0],r)[0].point));
   let state={...migrate(INITIAL,0),cash:1000,buildings:[buildings[1]],placements:{next:point},rotations:{...rotations}};state=reduce(state,{type:'place',id:'curve',kind:'curved-road',point:[0,0,0],now:0});assert.deepEqual(state.placements.curve,[0,0,0]);
  }
 }
});
test('curve ends do not admit genuine road or building overlaps',()=>{assert.equal(streetCollision('curved-road',[0,0,0],0,'road',[0,0,-1.5],0),true);assert.equal(streetCollision('curved-road',[0,0,0],0,'house',[.5,0,-.5],0),true);});
test('parking guides use the matching road entrance and disappear when occupied',()=>{
 for(const kind of ['parking-small','parking-big'])for(let r=0;r<4;r++){const buildings=[{id:'lot',kind}],placements={lot:[0,0,0]},rotations={lot:r},guides=parkingRoadGuides(buildings,placements,rotations);assert.equal(guides.length,1);const g=guides[0];assert.equal(g.rotation,r);const ports=streetPorts('road',g.point,g.rotation),lot=streetPorts(kind,[0,0,0],r)[0];assert.ok(ports.some(p=>Math.hypot(p.point[0]-lot.point[0],p.point[2]-lot.point[2])<1e-8));assert.equal(parkingRoadGuides([...buildings,{id:'road',kind:'road'}],{...placements,road:g.point},{...rotations,road:r}).length,0);}
 assert.equal(parkingRoadGuides([{id:'lot',kind:'parking-small'},{id:'home',kind:'house'}],{lot:[0,0,0],home:[0,0,-2]},{}).length,0);
});
test('nearby compatible street ends snap exactly, while distant pieces stay put',()=>{const buildings=[{id:'road',kind:'road'}],placements={road:[0,0,-2]};assert.deepEqual(snapStreetConnection('curved-road','curve',[.22,0,.15],buildings,placements,{}),[0,0,0]);assert.deepEqual(snapStreetConnection('curved-road','curve',[5,0,5],buildings,placements,{}),[5,0,5]);});
test('two curves connect into a continuous route between parking lots',()=>{
 const buildings=[{id:'a',kind:'parking-small'},{id:'b',kind:'parking-big'},{id:'c1',kind:'curved-road'},{id:'c2',kind:'curved-road'}],placements={a:[0,0,-2],b:[2,0,-2],c1:[0,0,0],c2:[2,0,0]},rotations={a:2,b:2,c2:1};assert.equal(streetCollision('curved-road',placements.c1,0,'curved-road',placements.c2,1),false);const n=roadNetwork(buildings,placements,rotations);assert.ok(n.route(n.lots[0].point,n.lots[1].point)?.length>16);
});
test('placing a road on a parking guide commits orientation atomically and undo restores it',()=>{
 for(let r=0;r<4;r++){let state={...migrate(INITIAL,0),cash:1000,buildings:[{id:'lot',kind:'parking-small'}],placements:{lot:[0,0,0]},rotations:{lot:r}};const g=parkingRoadGuides(state.buildings,state.placements,state.rotations)[0];state=reduce(state,{type:'place',id:'road',kind:'road',point:g.point,rotation:g.rotation,now:0});assert.equal(state.rotations.road,r);assert.deepEqual(state.placements.road,g.point.map(n=>Math.round(n*2)/2));const restored=reduce(state,{type:'undoLayout',now:0});assert.equal(restored.placements.road,undefined);assert.equal(restored.rotations.road,undefined);}
});
