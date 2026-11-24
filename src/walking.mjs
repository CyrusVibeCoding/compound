import {isTransport,roadNetwork} from './transport.mjs';
import {isShop,isActivity} from './buildingKinds.mjs';
import {BUILDINGS} from './city.mjs';
import {streetPath} from './paths.mjs';

const key=p=>`${Math.round(p[0]*1000)},${Math.round(p[2]*1000)}`;
const gridkey=p=>key([Math.round(p[0]*2)/2,0,Math.round(p[2]*2)/2]);
const point=k=>{const [x,z]=k.split(',').map(Number);return [x/1000,.03,z/1000]};

// One shared network for pavement and resident routing; rebuilt only after layout changes.
/** @param {import('./World').BuildingInstance[]} buildings @param {import('./World').Placements} placements @param {Record<string,number>} rotations */
export function walkingNetwork(buildings,placements,rotations){
 const placed=buildings.filter(b=>placements[b.id]);
 const transform=(b,x,z)=>{const a=(rotations[b.id]??0)*Math.PI/2,p=placements[b.id];return [p[0]+Math.cos(a)*x+Math.sin(a)*z,0,p[2]-Math.sin(a)*x+Math.cos(a)*z]};
 const obstacles=placed.filter(b=>BUILDINGS[b.kind].residents).map(b=>placements[b.id]);
 for(const b of placed){
  if(b.kind==='park')for(const [x,z,radius] of [[-.55,-.48,.23],[.55,-.46,.23],[-.55,.42,.23],[0,-.126,.30],[0,-.48,.24],[0,.48,.24],[.57,.53,.12]])obstacles.push({point:transform(b,x,z),radius});
  if(['plaza','playground','library'].includes(b.kind))for(const [x,z,radius] of (b.kind==='library'||b.kind==='playground'?[[ -.5,0,.29],[0,.49,.23],[0,-.49,.23]]:[[ -.42,0,.24],[0,.49,.23],[0,-.49,.23],[.595,-.56,.10]]))obstacles.push({point:transform(b,x,z),radius});
  if(isShop(b.kind)){obstacles.push({point:transform(b,0,-.35),radius:.5});for(const x of [-.5,.5])obstacles.push({point:transform(b,x,.5),radius:.18});}
 }
 for(const b of placed.filter(b=>b.kind==='road'||b.kind==='curved-road')){const path=roadNetwork([b],placements,rotations);const raw=(b.kind==='road'?Array.from({length:9},(_,i)=>[0,-1+i*.25]):Array.from({length:13},(_,i)=>[1+Math.cos(Math.PI-i*Math.PI/24),-1+Math.sin(Math.PI-i*Math.PI/24)]));for(const [x,z] of raw)obstacles.push({point:transform(b,x,z),radius:.23});}
 const entrances=placed.filter(b=>!isTransport(b.kind)).map(b=>({id:b.id,kind:b.kind,point:BUILDINGS[b.kind].residents?transform(b,0,1):transform(b,(isActivity(b.kind))?.5:0,(isActivity(b.kind))?0:.75),facing:(rotations[b.id]??0)*Math.PI/2+Math.PI}));
 const graph=new Map(),edges=new Map();
 const add=route=>{
  if(route.length===1){const p=point(key(route[0]));if(obstacles.some(o=>{const at=Array.isArray(o)?o:o.point,r=Array.isArray(o)?.94:o.radius;return Math.abs(p[0]-at[0])<r&&Math.abs(p[2]-at[2])<r}))return;}
  for(const p of route)if(!graph.has(key(p)))graph.set(key(p),new Set());
  for(let i=1;i<route.length;i++){
  const a=key(route[i-1]),b=key(route[i]);if(a===b)continue;
  if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());
  graph.get(a).add(b);graph.get(b).add(a);edges.set([a,b].sort().join('|'),[point(a),point(b)]);
 }};
 const roads=roadNetwork(buildings,placements,rotations);
 for(const path of roads.sidewalks){const sampled=[];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.25));if(i===1)sampled.push(a);for(let j=1;j<=steps;j++)sampled.push([a[0]+(b[0]-a[0])*j/steps,.03,a[2]+(b[2]-a[2])*j/steps]);}add(sampled);}
 // Adjacent paved strips share a short walking link even when their centerlines differ.
 const buckets=new Map();for(const path of roads.sidewalks)for(const p of path){const bx=Math.floor(p[0]/.35),bz=Math.floor(p[2]/.35);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const q of buckets.get(`${bx+dx},${bz+dz}`)??[]){const distance=Math.hypot(p[0]-q[0],p[2]-q[2]);if(distance>.001&&distance<=.32)add([p,q]);}const k=`${bx},${bz}`;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(p);}
 const streetEnds=roads.sidewalks.flatMap(p=>[p[0],p.at(-1)]);
 // Connect buildings to nearby sidewalk ends, then retain automatic pedestrian access.
 for(const entrance of entrances){const near=[...streetEnds].sort((a,b)=>Math.hypot(a[0]-entrance.point[0],a[2]-entrance.point[2])-Math.hypot(b[0]-entrance.point[0],b[2]-entrance.point[2]))[0];if(near){const path=streetPath(entrance.point,near,obstacles);if(Math.hypot(path.at(-1)[0]-near[0],path.at(-1)[2]-near[2])<=.36){path.push(near);add(path);}}}
 // Join each entrance to the nearest reachable prior entrance, rather than drawing
 // every possible errand. Intersecting branches share the same graph nodes.
 for(let i=1;i<entrances.length;i++){
  const start=entrances[i].point;
  const candidates=entrances.slice(0,i).sort((a,b)=>Math.hypot(start[0]-a.point[0],start[2]-a.point[2])-Math.hypot(start[0]-b.point[0],start[2]-b.point[2]));
  for(const target of candidates){const path=streetPath(start,target.point,obstacles);if(key(path.at(-1))===gridkey(target.point)){add(path);break;}}
 }
 // A single home still has a tiny, visible neighborhood stroll.
 if(entrances.length===1&&BUILDINGS[entrances[0].kind].residents){const start=entrances[0].point;add(streetPath(start,[start[0]+2,0,start[2]+1],obstacles));}
 const cache=new Map();
 const route=(start,end)=>{
  const a=gridkey(start),b=gridkey(end),cacheKey=a+'|'+b;
  if(a===b)return [point(a)];if(cache.has(cacheKey))return cache.get(cacheKey);
  const queue=[a],from=new Map([[a,null]]);
  for(let i=0;i<queue.length&&!from.has(b);i++)for(const next of graph.get(queue[i])??[])if(!from.has(next)){from.set(next,queue[i]);queue.push(next);}
  if(!from.has(b))return [start];
  const result=[];let at=b;while(at!==null){result.push(point(at));at=from.get(at)}result.reverse();cache.set(cacheKey,result);return result;
 };
 const approaches=entrances.filter(e=>graph.has(gridkey(e.point))&&BUILDINGS[e.kind].residents).map(e=>{
  const building=placed.find(b=>b.id===e.id);return [point(gridkey(e.point)),transform(building,0,.7)];
 });
 const drive=(start,end)=>{
  const near=p=>roads.lots.filter(l=>Math.hypot(l.walk[0]-p[0],l.walk[2]-p[2])<=4).sort((a,b)=>Math.hypot(a.walk[0]-p[0],a.walk[2]-p[2])-Math.hypot(b.walk[0]-p[0],b.walk[2]-p[2]));
  for(const a of near(start))for(const b of near(end)){if(a.id===b.id)continue;const car=roads.route(a.point,b.point);if(!car)continue;const first=streetPath(start,a.point,obstacles),last=streetPath(b.point,end,obstacles);if(Math.hypot(first.at(-1)[0]-a.point[0],first.at(-1)[2]-a.point[2])>.1||Math.hypot(last.at(-1)[0]-end[0],last.at(-1)[2]-end[2])>.36)continue;return [{points:first,vehicle:false},{points:car,vehicle:true},{points:last,vehicle:false}];}return null;
 };
 Object.assign(route,{drive});
 return {placements,rotations,approaches,entrances,obstacles,edges:[...edges.values()],nodes:[...graph.keys()].map(point),route};
}
