import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
export type Kind='core'|'press'|'assembler';
const positions:Record<Kind,[number,number,number]>={core:[0,0,0],press:[3.3,0,-1],assembler:[-3.3,0,-1]};
function Machine({kind,level,onSelect,reduced}:{kind:Kind,level:number,onSelect:(k:Kind)=>void,reduced:boolean}){
 const {scene}=useGLTF(`/models/${kind}.glb`);
 const copy=useMemo(()=>scene.clone(true),[scene]);
 useEffect(()=>{copy.traverse(o=>{o.visible=(!o.name.startsWith('L2')||level>=2)&&(!o.name.startsWith('L3')||level>=3);if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}})},[copy,level]);
 useFrame(({clock})=>{if(reduced)return;const t=clock.elapsedTime;const rotor=copy.getObjectByName('Rotor');if(rotor){rotor.rotation.y=t*.35;rotor.position.y=1.72+Math.sin(t)*.035;}const ring=copy.getObjectByName('InnerRing');if(ring)ring.rotation.y=t*.25;const hammer=copy.getObjectByName('Hammer');if(hammer)hammer.position.y=1.1+Math.sin(t*1.6)*.18;});
 return <group position={positions[kind]} onClick={e=>{e.stopPropagation();onSelect(kind)}}><primitive object={copy}/></group>
}
function Placeholder({kind,onSelect}:{kind:Kind,onSelect:(k:Kind)=>void}){return <group position={positions[kind]}><mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]}><ringGeometry args={[.88,.9,64]}/><meshBasicMaterial color="#dddddd"/></mesh><Html position={[0,.12,0]} center><button className="world-unlock" onClick={()=>onSelect(kind)}>+<span>{kind==='press'?'Press':'Assembler'}</span></button></Html></group>}
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="world-error">3D world unavailable.<br/>Tasks and progress still work.</div>:this.props.children}}
export default function World({levels,onSelect,reset}:{levels:Record<Kind,number>,onSelect:(k:Kind)=>void,reset:number}){
 const [reduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);const controls=useRef<any>(null);
 useEffect(()=>{controls.current?.reset()},[reset]);
 return <Boundary><Canvas shadows dpr={[1,1.5]} camera={{position:[7,6,9],fov:34}} gl={{antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>{gl.setClearColor('#ffffff')}}><ambientLight intensity={1.8}/><directionalLight position={[3,8,5]} intensity={3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-.001}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.12}/></mesh><Suspense fallback={<Html center><span className="loading-world">Assembling your world…</span></Html>}>{(['core','press','assembler'] as Kind[]).map(k=>levels[k]>0?<Machine key={k} kind={k} level={levels[k]} onSelect={onSelect} reduced={reduced}/>:<Placeholder key={k} kind={k} onSelect={onSelect}/>)}</Suspense><OrbitControls ref={controls} makeDefault target={[0,.7,0]} enableRotate={false} enableDamping={!reduced} minDistance={5} maxDistance={22} maxPolarAngle={Math.PI/2.2} touches={{ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN}} mouseButtons={{LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}}/></Canvas></Boundary>
}
