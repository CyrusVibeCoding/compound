import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {Point} from './World';
export type InventionState={active:boolean,work:number,project:string,hidden?:boolean};
export function buildPoint(placements:Record<string,Point>):Point {
 const points=Object.values(placements);
 const center=points.length?[points.reduce((s,p)=>s+p[0],0)/points.length,points.reduce((s,p)=>s+p[2],0)/points.length]:[0,0];
 for(let r=3;r<40;r+=2.5)for(let i=0;i<8;i++){const x=center[0]+Math.cos(i*Math.PI/4)*r,z=center[1]+Math.sin(i*Math.PI/4)*r;if(points.every(p=>Math.hypot(p[0]-x,p[2]-z)>=2.6))return [x,0,z]}
 return [0,0,-4];
}
function Part({visible,position,reduced,children}:{visible:boolean,position:Point,reduced:boolean,children:React.ReactNode}){
 const ref=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(!ref.current)return;const target=visible?1:0;ref.current.scale.setScalar(reduced?target:THREE.MathUtils.damp(ref.current.scale.x,target,9,Math.min(dt,.05)));ref.current.position.y=position[1]+(1-ref.current.scale.x)*.5;});
 return <group ref={ref} position={position} scale={reduced&&visible?1:.001}>{children}</group>;
}
export default function Invention({state,point,reduced,onOpen}:{state:InventionState,point:Point,reduced:boolean,onOpen:()=>void}){
 const turn=useRef<THREE.Group>(null),work=state.work,complete=work>=50;
 useFrame((_,dt)=>{if(turn.current&&complete&&!reduced)turn.current.rotation.y+=Math.min(dt,.05)*.22});
 const box=(size:Point,color='#e3e5e7')=><mesh castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.35} metalness={.3}/></mesh>;
 return <group position={point} onClick={e=>{e.stopPropagation();onOpen()}}>
  <mesh position={[0,.04,0]}><cylinderGeometry args={[1.15,1.2,.08,48]}/><meshStandardMaterial color="#e6e8ea"/></mesh>
  {Array.from({length:10},(_,i)=><Part key={i} visible={work>=i+1} position={[Math.cos(i*Math.PI/5)*.65,.35,Math.sin(i*Math.PI/5)*.65]} reduced={reduced}>{box([.14,.6,.14],i%2?'#45494d':'#b6bbc0')}</Part>)}
  <Part visible={work>=10} position={[0,.7,0]} reduced={reduced}><mesh><cylinderGeometry args={[.8,.8,.13,48]}/><meshStandardMaterial color="#34383c" metalness={.6} roughness={.3}/></mesh></Part>
  {Array.from({length:8},(_,i)=><Part key={i} visible={work>=12+i*2} position={[0,.8+i*.07,0]} reduced={reduced}>{box([.42-i*.025,.06,.42-i*.025])}</Part>)}
  <group ref={turn} position={[0,1.45,0]}>
   <Part visible={work>=26} position={[0,0,0]} reduced={reduced}><mesh rotation={[.4,0,.15]}><cylinderGeometry args={[.12,.68,.25,48,1,true]}/><meshStandardMaterial side={THREE.DoubleSide} color="#c3c8cc" metalness={.65} roughness={.25}/></mesh></Part>
   {Array.from({length:8},(_,i)=><Part key={i} visible={work>=28+i*2} position={[Math.cos(i*Math.PI/4)*.55,.15,Math.sin(i*Math.PI/4)*.55]} reduced={reduced}>{box([.22,.04,.22],'#f6f6f6')}</Part>)}
   <Part visible={work>=44} position={[0,.45,0]} reduced={reduced}>{box([.04,.7,.04],'#34383c')}</Part>
   <Part visible={complete} position={[0,.82,0]} reduced={reduced}><mesh><sphereGeometry args={[.12,16,12]}/><meshStandardMaterial color="#34383c" metalness={.7} roughness={.2}/></mesh></Part>
  </group>
 </group>;
}
