import {useRef} from 'react';import {useFrame} from '@react-three/fiber';import * as THREE from 'three';
import type {InventionState} from './Invention';import Part from './BuildPart';import type {Point} from './World';
export default function Clock({state,point,reduced,onOpen}:{state:InventionState,point:Point,reduced:boolean,onOpen:()=>void}){
 const gears=useRef<THREE.Group>(null),hands=useRef<THREE.Group>(null),hours=useRef<THREE.Group>(null),work=state.work;
 useFrame((_,dt)=>{if(reduced||work<50)return;if(gears.current)gears.current.children.forEach((g,i)=>g.rotation.z+=Math.min(dt,.05)*.3*(i%2?-1:1));if(hours.current)hours.current.rotation.z-=Math.min(dt,.05)*.2/12;if(hands.current)hands.current.rotation.z-=Math.min(dt,.05)*.2});
 return <group position={point} onClick={e=>{e.stopPropagation();onOpen()}}><mesh position={[0,.08,0]}><cylinderGeometry args={[1,1.1,.16,40]}/><meshStandardMaterial color="#ddd"/></mesh><group position={[0,1.15,0]}>
 {[0,1,2,3].map(i=><Part key={i} visible={work>=(i+1)*2} reduced={reduced} position={[(i%2?1:-1)*.75,0,(i<2?1:-1)*.18]}><mesh><boxGeometry args={[.12,1.8,.12]}/><meshStandardMaterial color="#555" metalness={.5}/></mesh></Part>)}
 <Part visible={work>=10} reduced={reduced} position={[0,0,0]}><mesh><torusGeometry args={[.8,.08,8,48]}/><meshStandardMaterial color="#bfc3c6" metalness={.7} roughness={.3}/></mesh></Part>
 <group ref={gears}>{[-.38,0,.38].map((x,i)=><group key={i} position={[x,(i%2?-.25:.2),.05]}><Part visible={work>=14+i*6} reduced={reduced} position={[0,0,0]}><mesh><torusGeometry args={[.25,.065,6,24]}/><meshStandardMaterial color={i%2?'#bbb':'#444'} metalness={.6}/></mesh>{Array.from({length:10},(_,j)=><mesh key={j} position={[Math.cos(j*Math.PI/5)*.27,Math.sin(j*Math.PI/5)*.27,0]} rotation={[0,0,j*Math.PI/5]}><boxGeometry args={[.11,.07,.09]}/><meshStandardMaterial color="#555"/></mesh>)}</Part></group>)}</group>
 {Array.from({length:12},(_,i)=><Part key={i} visible={work>=28+i} reduced={reduced} position={[Math.sin(i*Math.PI/6)*.68,Math.cos(i*Math.PI/6)*.68,.16]}><mesh rotation={[0,0,-i*Math.PI/6]}><boxGeometry args={[.03,.09,.04]}/><meshStandardMaterial color="#333"/></mesh></Part>)}
 <group ref={hands}><Part visible={work>=44} reduced={reduced} position={[0,.22,.25]}><mesh><boxGeometry args={[.04,.44,.04]}/><meshStandardMaterial color="#333"/></mesh></Part></group><group ref={hours}><Part visible={work>=50} reduced={reduced} position={[.15,0,.29]}><mesh rotation={[0,0,Math.PI/2]}><boxGeometry args={[.05,.3,.04]}/><meshStandardMaterial color="#666"/></mesh></Part></group>
 </group></group>;
}
