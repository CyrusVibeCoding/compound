import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {BUILDINGS} from './city.mjs';
import {door} from './paths.mjs';
import {makeOuting,outingStops} from './outings.mjs';
import type {BuildingInstance,Placements,Point} from './World';

type Stop={id:string,kind:string,point:Point,facing:number};
type Outing=ReturnType<typeof makeOuting>;
const noRaycast=()=>{};
// Shared low-poly props: no textures, lights, shadows, or per-frame React updates.
const cupGeometry=new THREE.CylinderGeometry(.12,.09,.28,6);
const lidGeometry=new THREE.CylinderGeometry(.135,.135,.04,6);
const bagGeometry=new THREE.BoxGeometry(.25,.34,.16);
const cupMaterial=new THREE.MeshStandardMaterial({color:'#f5ead5'});
const lidMaterial=new THREE.MeshStandardMaterial({color:'#496a61'});
const bagMaterial=new THREE.MeshStandardMaterial({color:'#bc8753'});
function Person({outings,index,reduced,homeId,resident,onVisit,paused}:{outings:Outing[],homeId:string,resident:number,onVisit:(shopId:string,homeId:string,resident:number)=>boolean,paused:boolean,index:number,reduced:boolean}){
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/${index%2?'girl':'boy'}.glb?v=color-08`);
 const root=useRef<THREE.Group>(null),cup=useRef<THREE.Group>(null),bag=useRef<THREE.Group>(null);
 const clock=useRef({trip:0,segment:0,time:-index*.35,phase:index*2,carrying:''});
 useEffect(()=>{clock.current={trip:0,segment:0,time:-index*.35,phase:index*2,carrying:''};if(cup.current)cup.current.visible=false;if(bag.current)bag.current.visible=false},[outings,index]);
 const model=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.raycast=noRaycast}});return {copy,limbs:['LeftLeg','RightLeg','LeftArm','RightArm'].map(n=>copy.getObjectByName(n))}},[scene]);
 useFrame((_,delta)=>{
  const g=root.current;if(!g||paused||document.hidden)return;
  const c=clock.current,dt=Math.min(delta,.1),outing=outings[c.trip%outings.length];
  c.time+=dt;c.phase+=dt;
  let segment=outing.segments[c.segment];
  if(c.time>=segment.end){
   if(segment.type==='visit'){
    const stop=segment.stop as Stop;
    if((stop.kind==='cafe'||stop.kind==='bakery')&&onVisit(stop.id,homeId,resident))c.carrying=stop.kind;
   }
   if(c.segment===outing.segments.length-1){c.trip++;c.segment=0;c.time=0;c.carrying='';}
   else c.segment++;
   segment=outings[c.trip%outings.length].segments[c.segment];
  }
  const walking=segment.type==='walk';
  if(segment.type==='walk'){
   const distance=(c.time-segment.start)*.38;let i=1;
   while(i<segment.lengths.length-1&&segment.lengths[i]<distance)i++;
   const a=segment.points[i-1],b=segment.points[i],length=segment.lengths[i]-segment.lengths[i-1],t=length?THREE.MathUtils.clamp((distance-segment.lengths[i-1])/length,0,1):0;
   g.position.set(THREE.MathUtils.lerp(a[0],b[0],t),.025,THREE.MathUtils.lerp(a[2],b[2],t));
   g.rotation.y=Math.atan2(b[0]-a[0],b[2]-a[2]);
  }else{
   g.position.set(segment.point[0],.025,segment.point[2]);
   if(segment.type==='visit')g.rotation.y=segment.stop.facing;
   if(segment.type==='home')c.carrying='';
  }
  if(reduced){const first=outings[0].segments[0];g.position.set(...(first.type==='walk'?first.points[0]:first.point));g.rotation.y=0;}
  if(cup.current)cup.current.visible=!reduced&&c.carrying==='cafe';
  if(bag.current)bag.current.visible=!reduced&&c.carrying==='bakery';
  model.limbs.forEach((limb,j)=>{if(limb)limb.rotation.x=reduced?0:j===3&&c.carrying?-.65:walking?Math.sin(c.phase*9+(j%2?Math.PI:0))*(j<2?.45:.3):0});
 });
 return <group ref={root} scale={.32} raycast={noRaycast}>
  <primitive object={model.copy}/>
  <group ref={cup} visible={false} position={[.25,.74,.23]}><mesh geometry={cupGeometry} material={cupMaterial} raycast={noRaycast}/><mesh position={[0,.16,0]} geometry={lidGeometry} material={lidMaterial} raycast={noRaycast}/></group>
  <group ref={bag} visible={false} position={[.25,.55,.23]}><mesh geometry={bagGeometry} material={bagMaterial} raycast={noRaycast}/></group>
 </group>;
}
export default function Residents({buildings,placements,rotations,reduced,onVisit,paused}:{onVisit:(shopId:string,homeId:string,resident:number)=>boolean,paused:boolean,buildings:BuildingInstance[],placements:Placements,rotations:Record<string,number>,reduced:boolean}){
 const residents=useMemo(()=>{
  const placed=buildings.filter(b=>placements[b.id]),parks=placed.filter(b=>b.kind==='park'),shops=placed.filter(b=>b.kind==='cafe'||b.kind==='bakery');
  const transform=(b:BuildingInstance,x:number,z:number):Point=>{const a=(rotations[b.id]??0)*Math.PI/2,p=placements[b.id];return [p[0]+Math.cos(a)*x+Math.sin(a)*z,0,p[2]-Math.sin(a)*x+Math.cos(a)*z]};
  const obstacles:any[]=placed.filter(b=>BUILDINGS[b.kind].residents).map(b=>placements[b.id]);
  for(const park of parks)for(const [x,z,radius] of [[-.55,-.48,.23],[.55,-.46,.23],[-.55,.42,.23],[0,-.126,.30],[0,-.48,.24],[0,.48,.24],[.57,.53,.12]])obstacles.push({point:transform(park,x,z),radius});
  for(const shop of shops){obstacles.push({point:transform(shop,0,-.35),radius:.5});for(const x of [-.5,.5])obstacles.push({point:transform(shop,x,.5),radius:.18});}
  const destinations:Stop[]=placed.filter(b=>!BUILDINGS[b.kind].residents).map(b=>({id:b.id,kind:b.kind,point:transform(b,b.kind==='park'?.5:0,b.kind==='park'?0:.75),facing:(rotations[b.id]??0)*Math.PI/2+Math.PI}));
  let index=0;
  return placed.filter(b=>BUILDINGS[b.kind].residents).flatMap(b=>Array.from({length:BUILDINGS[b.kind].residents},(_,i)=>({id:`${b.id}-${i}`,index:index++,homeId:b.id,resident:i}))).slice(0,32).map(r=>{
   const home=door(placements[r.homeId],rotations[r.homeId]) as Point;
   const plans=outingStops(destinations,r.index);
   // Residents without destinations still take a short neighborhood stroll.
   if(!destinations.length)plans[0]=[{id:'stroll',kind:'stroll',point:[home[0]+(r.resident%2?-2:2),0,home[2]+1],facing:0}];
   return {...r,outings:plans.map(stops=>makeOuting(home,stops,obstacles))};
  });
 },[buildings,placements,rotations]);
 return <group>{residents.map(r=><Person {...r} key={r.id} onVisit={onVisit} paused={paused} reduced={reduced}/>)}</group>;
}
