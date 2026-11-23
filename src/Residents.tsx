import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {BUILDINGS} from './city.mjs';
import {greetingWorld,stepGreetings,type Neighbor} from './greetings.mjs';
import type {walkingNetwork} from './walking.mjs';
import {makeOuting,outingStops} from './outings.mjs';
import type {BuildingInstance,Point} from './World';

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
function Person({outings,index,reduced,homeId,resident,onVisit,paused,world,homeFacing}:{world:ReturnType<typeof greetingWorld>,homeFacing:number,outings:Outing[],homeId:string,resident:number,onVisit:(shopId:string,homeId:string,resident:number)=>boolean,paused:boolean,index:number,reduced:boolean}){
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/${index%2?'girl':'boy'}.glb?v=color-08`);
 const root=useRef<THREE.Group>(null),cup=useRef<THREE.Group>(null),bag=useRef<THREE.Group>(null);
 const actor=useMemo<Neighbor>(()=>({x:0,z:0,walking:false,readyAt:world.time+8+index*.4,greeting:null}),[world,index]);
 useEffect(()=>{const id=`${homeId}-${resident}`;world.actors.set(id,actor);return()=>{world.actors.delete(id)}},[world,actor,homeId,resident]);
 const clock=useRef({trip:0,segment:0,time:-index*.35,phase:index*2,carrying:''});
 useEffect(()=>{clock.current={trip:0,segment:0,time:-index*.35,phase:index*2,carrying:''};if(cup.current)cup.current.visible=false;if(bag.current)bag.current.visible=false},[outings,index]);
 const model=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.raycast=noRaycast}});return {copy,limbs:['LeftLeg','RightLeg','LeftArm','RightArm'].map(n=>copy.getObjectByName(n))}},[scene]);
 useFrame((_,delta)=>{
  const g=root.current;if(!g||paused||document.hidden)return;
  const c=clock.current,dt=Math.min(delta,.1),outing=outings[c.trip%outings.length];
  if(actor.greeting&&!reduced){
   g.rotation.y=actor.greeting.angle;
   model.limbs.forEach((limb,j)=>{if(limb){limb.rotation.x=j===3&&c.carrying?-.65:0;limb.rotation.z=j===2?-2.1+Math.sin((world.time-actor.greeting!.started)*12)*.25:0}});
   return;
  }
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
   if(segment.type==='home'){c.carrying='';g.rotation.y=homeFacing;}
  }
  if(reduced){const first=outings[0].segments[0];g.position.set(...(first.type==='walk'?first.points[0]:first.point));g.rotation.y=0;}
  actor.x=g.position.x;actor.z=g.position.z;
  actor.walking=!reduced&&walking&&c.time-segment.start>1&&segment.end-c.time>1;
  if(cup.current)cup.current.visible=!reduced&&c.carrying==='cafe';
  if(bag.current)bag.current.visible=!reduced&&c.carrying==='bakery';
  model.limbs.forEach((limb,j)=>{if(limb){limb.rotation.z=0;limb.rotation.x=reduced?0:j===3&&c.carrying?-.65:walking?Math.sin(c.phase*9+(j%2?Math.PI:0))*(j<2?.45:.3):0}});
 });
 return <group name={`resident-${homeId}-${resident}`} ref={root} scale={.32} raycast={noRaycast}>
  <primitive object={model.copy}/>
  <group ref={cup} visible={false} position={[.25,.74,.23]}><mesh geometry={cupGeometry} material={cupMaterial} raycast={noRaycast}/><mesh position={[0,.16,0]} geometry={lidGeometry} material={lidMaterial} raycast={noRaycast}/></group>
  <group ref={bag} visible={false} position={[.25,.55,.23]}><mesh geometry={bagGeometry} material={bagMaterial} raycast={noRaycast}/></group>
 </group>;
}
export default function Residents({buildings,network,reduced,onVisit,paused}:{network:ReturnType<typeof walkingNetwork>,onVisit:(shopId:string,homeId:string,resident:number)=>boolean,paused:boolean,buildings:BuildingInstance[],reduced:boolean}){
 const world=useMemo(()=>greetingWorld(),[network]);
 useFrame((_,delta)=>stepGreetings(world,delta,{paused,reduced,hidden:document.hidden}),-1);
 const residents=useMemo(()=>{
  const destinations=network.entrances.filter(b=>!BUILDINGS[b.kind as keyof typeof BUILDINGS].residents) as Stop[];
  let index=0;
  return buildings.filter(b=>network.entrances.some(e=>e.id===b.id)&&BUILDINGS[b.kind].residents).flatMap(b=>Array.from({length:BUILDINGS[b.kind].residents},(_,i)=>({id:`${b.id}-${i}`,index:index++,homeId:b.id,resident:i}))).slice(0,32).map(r=>{
   const entrance=network.entrances.find(b=>b.id===r.homeId)!,home=entrance.point as Point;
   const plans=outingStops(destinations,r.index);
   if(!destinations.length){
    const other=network.entrances.find(e=>e.id!==r.homeId);
    plans[0]=[{id:'stroll',kind:'stroll',point:other?other.point as Point:[home[0]+2,0,home[2]+1],facing:0}];
   }
   return {...r,homeFacing:entrance.facing,outings:plans.map(stops=>makeOuting(home,stops,network.obstacles,network.route))};
  });
 },[buildings,network]);
 return <group>{residents.map(r=><Person {...r} world={world} key={r.id} onVisit={onVisit} paused={paused} reduced={reduced}/>)}</group>;
}
