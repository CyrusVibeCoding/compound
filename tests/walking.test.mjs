import {test} from 'node:test';import assert from 'node:assert/strict';
import {walkingNetwork} from '../src/walking.mjs';
import {makeOuting} from '../src/outings.mjs';
const buildings=[{id:'home',kind:'house'},{id:'shop',kind:'cafe'},{id:'park',kind:'park'},{id:'bakery',kind:'bakery'}];
const placements={home:[0,0,0],shop:[3,0,0],park:[0,0,3],bakery:[-3,0,0]};
const key=p=>[p[0],p[2]].join(',');
test('residents use exactly the visible graph for every leg of an outing',()=>{
 const n=walkingNetwork(buildings,placements,{}),home=n.entrances[0].point;
 const plan=makeOuting(home,n.entrances.slice(1),n.obstacles,n.route);
 assert.equal(plan.segments.filter(s=>s.type==='visit').length,3);
 const edges=new Set(n.edges.flatMap(([a,b])=>[key(a)+'|'+key(b),key(b)+'|'+key(a)]));
 for(const segment of plan.segments)if(segment.type==='walk')for(let i=1;i<segment.points.length;i++)assert.ok(edges.has(key(segment.points[i-1])+'|'+key(segment.points[i])));
 assert.equal(key(plan.segments.at(-1).point),key([Math.round(home[0]*2)/2,0,Math.round(home[2]*2)/2]));
 assert.equal(new Set(n.edges.map(([a,b])=>[key(a),key(b)].sort().join('|'))).size,n.edges.length);
});
test('paths avoid obstacles and entrances remain reachable at every rotation',()=>{
 for(let r=0;r<4;r++){
  const n=walkingNetwork(buildings,placements,{home:r,shop:r,park:r,bakery:r});
  for(const target of n.entrances.slice(1)){const route=n.route(n.entrances[0].point,target.point);assert.equal(key(route.at(-1)),key([Math.round(target.point[0]*2)/2,0,Math.round(target.point[2]*2)/2]));}
  for(const p of n.nodes)for(const o of n.obstacles){const at=Array.isArray(o)?o:o.point,r=Array.isArray(o)?.94:o.radius;assert.ok(Math.abs(p[0]-at[0])>=r||Math.abs(p[2]-at[2])>=r);}
 }
});
test('moving, rotating, or storing buildings rebuilds paths without save mutations',()=>{
 const before=JSON.stringify({buildings,placements}),first=walkingNetwork(buildings,placements,{});
 const moved=walkingNetwork(buildings,{...placements,shop:[6,0,0]},{shop:1});
 assert.notDeepEqual(moved.edges,first.edges);assert.notDeepEqual(moved.entrances[1].point,first.entrances[1].point);
 const stored=walkingNetwork(buildings,{home:placements.home},{});assert.equal(stored.entrances.length,1);assert.ok(stored.edges.length>0);
 assert.equal(JSON.stringify({buildings,placements}),before);
 assert.deepEqual(walkingNetwork([],{},{}).edges,[]);
});
test('disconnected targets never produce invented routes or visits',()=>{
 const n=walkingNetwork(buildings,{...placements,shop:[0,0,-.5]},{});
 const shop=n.entrances.find(e=>e.id==='shop');
 const plan=makeOuting(n.entrances[0].point,[shop],n.obstacles,n.route);
 assert.equal(plan.segments.filter(s=>s.type==='visit').length,0);
});

test('facing homes with a shared doorstep retain a visible junction and approaches',()=>{
 const n=walkingNetwork([{id:'a',kind:'house'},{id:'b',kind:'house'}],{a:[0,0,0],b:[2,0,0]},{a:1,b:3});
 assert.equal(n.nodes.length,1);assert.equal(n.approaches.length,2);
 assert.equal(key(n.route(n.entrances[0].point,n.entrances[1].point)[0]),'1,0');
});
