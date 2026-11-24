import {useEffect,useMemo,useRef} from 'react';import {useFrame,type ThreeEvent} from '@react-three/fiber';import {useGLTF} from '@react-three/drei';import * as THREE from 'three';
import type {activityWorld} from './placeActivity.mjs';
import {spring} from './spring.mjs';import type {Kind,Point,DragHandlers} from './World';
export default function Building({id,kind,position,rotation=0,reduced,ghost=false,ghostOpacity=.3,handlers,activity,paused=false,evening=false}:{evening?:boolean,activity?:ReturnType<typeof activityWorld>,paused?:boolean,id:string,kind:Kind,position:Point,rotation?:number,reduced:boolean,ghost?:boolean,ghostOpacity?:number,handlers?:DragHandlers}){
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/${kind}.glb?v=entry-19`),root=useRef<THREE.Group>(null),velocity=useRef([0,0,0,0,0]),initial=useRef<Point>([position[0],position[1]+(ghost||reduced?0:.3),position[2]]);
 const model=useMemo(()=>{const copy=scene.clone(true),materials:THREE.Material[]=[];copy.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=!ghost;o.receiveShadow=!ghost;if(ghost)o.raycast=()=>{};if(!ghost&&['Blue windows','Warm lantern'].includes((o.material as THREE.Material).name)){
 const m=(o.material as THREE.MeshStandardMaterial).clone();m.emissive.set('#ffb966');m.emissiveIntensity=0;o.material=m;materials.push(m);
 }if(ghost){const clone=(m:THREE.Material)=>{const n=m.clone();n.transparent=true;n.opacity=ghostOpacity;n.depthWrite=false;materials.push(n);return n};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material)}}});return {copy,materials,windows:materials.filter(m=>['Blue windows','Warm lantern'].includes(m.name)) as THREE.MeshStandardMaterial[],door:copy.getObjectByName('ShopDoor')??copy.getObjectByName('BuildingDoor'),window:copy.getObjectByName('ShopWindow') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>|undefined}},[scene,ghost,ghostOpacity]);
 useEffect(()=>{model.windows.forEach(m=>m.emissiveIntensity=evening?.3:0)},[model,evening]);
 useEffect(()=>()=>model.materials.forEach(m=>m.dispose()),[model]);
 useEffect(()=>{if((reduced||ghost)&&root.current){root.current.position.set(...position);root.current.rotation.y=rotation*Math.PI/2;root.current.scale.setScalar(.7);velocity.current.fill(0)}},[position,rotation,reduced,ghost]);
 useFrame((_,dt)=>{
  if(!ghost&&!document.hidden){
   const active=!reduced&&!!activity?.shops.get(id),step=Math.min(dt,.1);
   if(kind==='playground'&&!paused){for(const [name,spot] of [['SwingFront','front-bench'],['SwingBack','back-bench']]){const swing=model.copy.getObjectByName(name);if(swing){const visit=Array.from(activity?.visits.values()??[]).find(v=>v.buildingId===id&&v.spot?.id===spot);swing.rotation.x=!reduced&&visit?.swinging?Math.sin(visit.elapsed*2)*.12:0;}}}
   if(model.door&&!paused)model.door.rotation.y=THREE.MathUtils.damp(model.door.rotation.y,!reduced&&activity?.doors.get(id)?.size?-.95:0,9,step);
   if(model.window&&!paused){const m=model.window.material;m.emissiveIntensity=reduced?(evening?.3:0):THREE.MathUtils.damp(m.emissiveIntensity,active ? .65 : evening?.3:0,6,step);}
   if(reduced&&model.door)model.door.rotation.y=0;
  }
  const g=root.current;if(!g||reduced||ghost)return;for(let i=0;i<3;i++){const k=(['x','y','z'] as const)[i];[g.position[k],velocity.current[i]]=spring(g.position[k],velocity.current[i],position[i],dt)}const angle=g.rotation.y+Math.atan2(Math.sin(rotation*Math.PI/2-g.rotation.y),Math.cos(rotation*Math.PI/2-g.rotation.y));[g.rotation.y,velocity.current[3]]=spring(g.rotation.y,velocity.current[3],angle,dt);const [s,v]=spring(g.scale.x,velocity.current[4],.7,dt);g.scale.setScalar(s);velocity.current[4]=v;});
 const down=(e:ThreeEvent<PointerEvent>)=>{if(e.button!==0||!handlers)return;e.nativeEvent.preventDefault();e.stopPropagation();(e.target as HTMLElement)?.setPointerCapture(e.pointerId);handlers?.start(id,e.nativeEvent)};
 return <group name={`building-${id}`} ref={root} position={initial.current} scale={(ghost||reduced)? .7 : .55} onPointerDown={ghost||!handlers?undefined:down} onPointerMove={ghost||!handlers?undefined:e=>handlers?.move(e.nativeEvent)} onPointerUp={ghost||!handlers?undefined:e=>{e.stopPropagation();handlers?.end(e.nativeEvent);(e.target as HTMLElement)?.releasePointerCapture(e.pointerId)}} onPointerCancel={ghost||!handlers?undefined:()=>handlers?.cancel()} onClick={ghost||!handlers?undefined:e=>e.stopPropagation()}><primitive object={model.copy}/></group>;
}
