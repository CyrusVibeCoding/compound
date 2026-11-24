import {transportPaths,isTransport} from './transport.mjs';
import {snapPlacement} from './placement.mjs';
export function streetPorts(kind,point,rotation=0){
 if(!isTransport(kind)||kind==='sidewalk')return [];
 const path=transportPaths(kind).drive[0],ends=kind.startsWith('parking-')?[0]:[0,path.length-1];
 const localDirection=kind==='curved-road'?[[0,-1],[1,0]]:[[0,-1],[0,1]];
 const a=rotation*Math.PI/2,c=Math.cos(a),s=Math.sin(a),turn=([x,z])=>[c*x+s*z,-s*x+c*z];
 return ends.map((index,i)=>{const p=turn(path[index]),d=turn(localDirection[i]);return {point:[point[0]+p[0],0,point[2]+p[1]],direction:d};});
}
export function parkingRoadGuides(buildings,placements,rotations){
 return buildings.filter(b=>b.kind.startsWith('parking-')&&placements[b.id]).flatMap(b=>{
  const rotation=rotations[b.id]??0,port=streetPorts(b.kind,placements[b.id],rotation)[0],point=[port.point[0]+port.direction[0],0,port.point[2]+port.direction[1]],id=`guide-${b.id}`;
  return snapPlacement(placements,id,point,buildings,{...rotations,[id]:rotation},'road')?[{id,point,rotation}]:[];
 });
}
// Snap nearly aligned compatible ends without rotating the user's piece.
export function snapStreetConnection(kind,id,point,buildings,placements,rotations){
 if(!isTransport(kind)||kind==='sidewalk')return point;
 let best=point,distance=.56;
 const own=streetPorts(kind,point,rotations[id]??0);
 for(const b of buildings){if(b.id===id||!placements[b.id])continue;for(const target of streetPorts(b.kind,placements[b.id],rotations[b.id]??0))for(const port of own){
  if(port.direction[0]*target.direction[0]+port.direction[1]*target.direction[1]>-.99)continue;
  const dx=target.point[0]-port.point[0],dz=target.point[2]-port.point[2],d=Math.hypot(dx,dz),candidate=[point[0]+dx,0,point[2]+dz];
  if(d<distance){const snapped=snapPlacement(placements,id,candidate,buildings,rotations,kind);if(snapped){distance=d;best=[snapped[0]||0,0,snapped[2]||0];}}
 }}return best;
}
