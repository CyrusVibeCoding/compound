import {BUILDINGS} from './city.mjs';
import {streetPath} from './paths.mjs';

const key=p=>`${Math.round(p[0]*2)},${Math.round(p[2]*2)}`;
const point=k=>{const [x,z]=k.split(',').map(Number);return [x/2,.03,z/2]};

// One shared network for pavement and resident routing; rebuilt only after layout changes.
/** @param {import('./World').BuildingInstance[]} buildings @param {import('./World').Placements} placements @param {Record<string,number>} rotations */
export function walkingNetwork(buildings,placements,rotations){
 const placed=buildings.filter(b=>placements[b.id]);
 const transform=(b,x,z)=>{const a=(rotations[b.id]??0)*Math.PI/2,p=placements[b.id];return [p[0]+Math.cos(a)*x+Math.sin(a)*z,0,p[2]-Math.sin(a)*x+Math.cos(a)*z]};
 const obstacles=placed.filter(b=>BUILDINGS[b.kind].residents).map(b=>placements[b.id]);
 for(const b of placed){
  if(b.kind==='park')for(const [x,z,radius] of [[-.55,-.48,.23],[.55,-.46,.23],[-.55,.42,.23],[0,-.126,.30],[0,-.48,.24],[0,.48,.24],[.57,.53,.12]])obstacles.push({point:transform(b,x,z),radius});
  if(b.kind==='plaza')for(const [x,z,radius] of [[-.42,0,.24],[0,.49,.23],[0,-.49,.23],[.595,-.56,.10]])obstacles.push({point:transform(b,x,z),radius});
  if(b.kind==='cafe'||b.kind==='bakery'){obstacles.push({point:transform(b,0,-.35),radius:.5});for(const x of [-.5,.5])obstacles.push({point:transform(b,x,.5),radius:.18});}
 }
 const entrances=placed.map(b=>({id:b.id,kind:b.kind,point:BUILDINGS[b.kind].residents?transform(b,0,1):transform(b,(b.kind==='park'||b.kind==='plaza')?.5:0,(b.kind==='park'||b.kind==='plaza')?0:.75),facing:(rotations[b.id]??0)*Math.PI/2+Math.PI}));
 const graph=new Map(),edges=new Map();
 const add=route=>{
  if(route.length===1){const p=point(key(route[0]));if(obstacles.some(o=>{const at=Array.isArray(o)?o:o.point,r=Array.isArray(o)?.94:o.radius;return Math.abs(p[0]-at[0])<r&&Math.abs(p[2]-at[2])<r}))return;}
  for(const p of route)if(!graph.has(key(p)))graph.set(key(p),new Set());
  for(let i=1;i<route.length;i++){
  const a=key(route[i-1]),b=key(route[i]);if(a===b)continue;
  if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());
  graph.get(a).add(b);graph.get(b).add(a);edges.set([a,b].sort().join('|'),[point(a),point(b)]);
 }};
 // Join each entrance to the nearest reachable prior entrance, rather than drawing
 // every possible errand. Intersecting branches share the same graph nodes.
 for(let i=1;i<entrances.length;i++){
  const start=entrances[i].point;
  const candidates=entrances.slice(0,i).sort((a,b)=>Math.hypot(start[0]-a.point[0],start[2]-a.point[2])-Math.hypot(start[0]-b.point[0],start[2]-b.point[2]));
  for(const target of candidates){const path=streetPath(start,target.point,obstacles);if(key(path.at(-1))===key(target.point)){add(path);break;}}
 }
 // A single home still has a tiny, visible neighborhood stroll.
 if(entrances.length===1&&BUILDINGS[entrances[0].kind].residents){const start=entrances[0].point;add(streetPath(start,[start[0]+2,0,start[2]+1],obstacles));}
 const cache=new Map();
 const route=(start,end)=>{
  const a=key(start),b=key(end),cacheKey=a+'|'+b;
  if(a===b)return [point(a)];if(cache.has(cacheKey))return cache.get(cacheKey);
  const queue=[a],from=new Map([[a,null]]);
  for(let i=0;i<queue.length&&!from.has(b);i++)for(const next of graph.get(queue[i])??[])if(!from.has(next)){from.set(next,queue[i]);queue.push(next);}
  if(!from.has(b))return [start];
  const result=[];let at=b;while(at!==null){result.push(point(at));at=from.get(at)}result.reverse();cache.set(cacheKey,result);return result;
 };
 const approaches=entrances.filter(e=>graph.has(key(e.point))&&BUILDINGS[e.kind].residents).map(e=>{
  const building=placed.find(b=>b.id===e.id);return [point(key(e.point)),transform(building,0,.7)];
 });
 return {rotations,approaches,entrances,obstacles,edges:[...edges.values()],nodes:[...graph.keys()].map(point),route};
}
