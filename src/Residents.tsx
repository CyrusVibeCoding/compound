import {useMemo,useRef} from 'react';import {useFrame} from '@react-three/fiber';import {useGLTF} from '@react-three/drei';import * as THREE from 'three';
import {BUILDINGS} from './city.mjs';import {door,streetPath} from './paths.mjs';import type {BuildingInstance,Placements,Point} from './World';
function Person({route,index,reduced}:{route:Point[],index:number,reduced:boolean}){
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/${index%2?'girl':'boy'}.glb`),root=useRef<THREE.Group>(null),progress=useRef(index*1.8),phase=useRef(index*2);
 const model=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.raycast=()=>{}}});return {copy,limbs:['LeftLeg','RightLeg','LeftArm','RightArm'].map(n=>copy.getObjectByName(n))}},[scene]);
 const track=useMemo(()=>{const points=[...route,...route.slice(0,-1).reverse()],lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));return {points,lengths,total:lengths.at(-1)??0,mid:lengths[route.length-1]??0}},[route]);
 useFrame((_,delta)=>{const g=root.current;if(!g)return;if(reduced||track.total<.01){g.position.set(...track.points[index%track.points.length]);model.limbs.forEach(l=>{if(l)l.rotation.x=0});return}const dt=Math.min(delta,.05);phase.current+=dt;progress.current=(progress.current+dt*.38)%(track.total+6);const p=progress.current,visiting=p>=track.mid&&p<track.mid+3,dist=Math.min(p<track.mid?p:p<track.mid+3?track.mid:p-3,track.total);let i=1;while(i<track.lengths.length-1&&track.lengths[i]<dist)i++;const a=track.points[i-1],b=track.points[i],length=track.lengths[i]-track.lengths[i-1],t=length?(dist-track.lengths[i-1])/length:0;g.position.set(THREE.MathUtils.lerp(a[0],b[0],t),.025,THREE.MathUtils.lerp(a[2],b[2],t));const walking=!visiting&&p<track.total+3;g.rotation.y=Math.atan2(b[0]-a[0],b[2]-a[2]);model.limbs.forEach((l,j)=>{if(l)l.rotation.x=walking?Math.sin(phase.current*9+(j%2?Math.PI:0))*(j<2?.45:.3):0});});
 return <group ref={root} position={route[0]} scale={.32} raycast={()=>{}}><primitive object={model.copy} raycast={()=>{}}/></group>;
}
export default function Residents({buildings,placements,rotations,reduced}:{buildings:BuildingInstance[],placements:Placements,rotations:Record<string,number>,reduced:boolean}){
 const residents=useMemo(()=>{
  const placed=buildings.filter(b=>placements[b.id]),parks=placed.filter(b=>b.kind==='park');
  const transform=(b:BuildingInstance,x:number,z:number):Point=>{const a=(rotations[b.id]??0)*Math.PI/2,p=placements[b.id];return [p[0]+Math.cos(a)*x+Math.sin(a)*z,0,p[2]-Math.sin(a)*x+Math.cos(a)*z]};
  const obstacles:any[] = placed.filter(b=>b.kind!=='park').map(b=>placements[b.id]);
  for(const park of parks)for(const [x,z,radius] of [[-.55,-.48,.23],[.55,-.46,.23],[-.55,.42,.23],[0,-.126,.30],[0,-.48,.24],[0,.48,.24],[.57,.53,.12]])obstacles.push({point:transform(park,x,z),radius});
  let index=0;
  return placed.filter(b=>b.kind!=='park').flatMap(b=>Array.from({length:BUILDINGS[b.kind].residents},(_,i)=>{
   const home=door(placements[b.id],rotations[b.id]),park=parks[(index+i)%Math.max(1,parks.length)],target=park?transform(park,.5,0):[home[0]+(i%2?-2:2),0,home[2]+1] as Point;
   return {id:`${b.id}-${i}`,index:index++,route:streetPath(home,target,obstacles) as Point[]};
  })).slice(0,32);
 },[buildings,placements,rotations]);
 return <group>{residents.map(r=><Person key={r.id} index={r.index} route={r.route} reduced={reduced}/>)}</group>;
}
