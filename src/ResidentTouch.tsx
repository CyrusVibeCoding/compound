import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {isResidentTap,residentProfile} from './personality.mjs';
export type PersonHandle={profile:ReturnType<typeof residentProfile>,root:THREE.Group|null,status:string,tapRemaining:number,tapAngle:number};
export type People=Map<string,PersonHandle>;
export default function ResidentTouch({people,disabled,onSelect}:{people:People,disabled:boolean,onSelect:(id:string)=>void}){
 const {gl,camera,scene}=useThree();
 useEffect(()=>{
  if(disabled)return;
  let start:{id:number,x:number,y:number}|null=null,multi=false,moved=false;const raycaster=new THREE.Raycaster(),worldPosition=new THREE.Vector3();const pointers=new Set<number>(),position=new THREE.Vector3();
  const down=(e:PointerEvent)=>{pointers.add(e.pointerId);if(pointers.size>1){multi=true;start=null;return}if(e.button===0){multi=false;moved=false;start={id:e.pointerId,x:e.clientX,y:e.clientY}}};
  const up=(e:PointerEvent)=>{
   pointers.delete(e.pointerId);if(multi||moved||!isResidentTap(start,{id:e.pointerId,x:e.clientX,y:e.clientY})){start=null;return}start=null;
   const rect=gl.domElement.getBoundingClientRect();let best:string|null=null,distance=26;
   for(const [id,person] of people){if(!person.root||!person.root.visible)continue;person.root.getWorldPosition(position);position.y+=.24;worldPosition.copy(position);position.project(camera);if(position.z< -1||position.z>1)continue;
    const d=Math.hypot(rect.left+(position.x+1)*rect.width/2-e.clientX,rect.top+(1-position.y)*rect.height/2-e.clientY);if(d<distance){
     raycaster.setFromCamera(new THREE.Vector2(position.x,position.y),camera);
     const hit=raycaster.intersectObjects(scene.children,true)[0];if(hit&&hit.distance<raycaster.ray.origin.distanceTo(worldPosition)-.15)continue;
     distance=d;best=id;
    }
   }
   if(best){const person=people.get(best)!;if(person.tapRemaining<=0)person.tapRemaining=1.4;person.tapAngle=Math.atan2(camera.position.x-person.root!.position.x,camera.position.z-person.root!.position.z);onSelect(best);}
  };
  const move=(e:PointerEvent)=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)moved=true};
  const cancel=()=>{start=null;multi=true;pointers.clear()};
  const canvas=gl.domElement;canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('pointerleave',cancel);
  return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('pointerleave',cancel)};
 },[people,disabled,onSelect,gl,camera,scene]);return null;
}
