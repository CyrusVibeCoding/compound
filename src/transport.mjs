export const TRANSPORT=['sidewalk','road','curved-road','parking-small','parking-big'];
export const isTransport=k=>TRANSPORT.includes(k);
export function transportPaths(kind){
 if(kind==='sidewalk')return {walk:[[[0,-1],[0,1]]],drive:[]};
 if(kind.startsWith('parking-'))return {walk:[[[-1,.75],[1,.75]]],drive:[[[0,-1],[0,0]]]};
 if(kind==='road')return {walk:[[-.5,.5].map(x=>[[x,-1],[x,1]])].flat(),drive:[[[0,-1],[0,1]]]};
 if(kind==='curved-road'){const arc=r=>Array.from({length:9},(_,i)=>{const a=Math.PI-i*Math.PI/16;return [1+Math.cos(a)*r,-1+Math.sin(a)*r]});return {walk:[arc(.5),arc(1.5)],drive:[arc(1)]};}
 return {walk:[],drive:[]};
}
const key=p=>String(Math.round(p[0]*1000))+','+String(Math.round(p[2]*1000));
export function roadNetwork(buildings,placements,rotations){
 const graph=new Map(),positions=new Map(),lots=[];
 const transform=(b,p)=>{const a=(rotations[b.id]??0)*Math.PI/2,o=placements[b.id];return [o[0]+Math.cos(a)*p[0]+Math.sin(a)*p[1],.04,o[2]-Math.sin(a)*p[0]+Math.cos(a)*p[1]]};
 const sidewalks=[];
 for(const b of buildings.filter(b=>placements[b.id]&&isTransport(b.kind))){const paths=transportPaths(b.kind);for(const path of paths.walk)sidewalks.push(path.map(p=>transform(b,p)));for(const path of paths.drive){const points=path.map(p=>transform(b,p));for(let i=0;i<points.length;i++){const k=key(points[i]);positions.set(k,points[i]);if(!graph.has(k))graph.set(k,new Set());if(i){const prev=key(points[i-1]);graph.get(k).add(prev);graph.get(prev).add(k);}}}if(b.kind.startsWith('parking-'))lots.push({id:b.id,point:transform(b,[0,0]),walk:transform(b,[0,.75]),entry:transform(b,[0,-1])});}
 // Only physically touching road/lot endpoints connect; no invented road links.
 const route=(a,b)=>{const from=new Map([[key(a),null]]),queue=[key(a)];for(let i=0;i<queue.length&&!from.has(key(b));i++)for(const n of graph.get(queue[i])??[])if(!from.has(n)){from.set(n,queue[i]);queue.push(n)}if(!from.has(key(b)))return null;const out=[];let k=key(b);while(k!==null){out.push(positions.get(k));k=from.get(k)}return out.reverse();};
 return {sidewalks,lots,route};
}
