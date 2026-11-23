import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
export type Kind='core'|'press'|'assembler';
export type Point=[number,number,number];
export type Placements=Partial<Record<Kind,Point>>;
export type WorldApi={project:(x:number,y:number)=>Point|null};
export type Preview={kind:Kind,point:Point,valid:boolean}|null;
function Machine({kind,level,position,onSelect,reduced,ghost=false}:{kind:Kind,level:number,position:Point,onSelect:(k:Kind)=>void,reduced:boolean,ghost?:boolean}){
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/${kind}.glb`);
 const copy=useMemo(()=>{const clone=scene.clone(true);if(ghost)clone.traverse(o=>{if(o instanceof THREE.Mesh){const fade=(m:THREE.Material)=>{const c=m.clone();c.transparent=true;c.opacity=.35;c.depthWrite=false;return c;};o.material=Array.isArray(o.material)?o.material.map(fade):fade(o.material)}});return clone;},[scene,ghost]);
 useEffect(()=>{copy.traverse(o=>{o.visible=(!o.name.startsWith('L2')||level>=2)&&(!o.name.startsWith('L3')||level>=3);if(o instanceof THREE.Mesh){o.castShadow=!ghost;o.receiveShadow=!ghost;}})},[copy,level,ghost]);
 useEffect(()=>()=>{if(ghost)copy.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())})},[copy,ghost]);
 useFrame(({clock})=>{if(reduced||ghost)return;const t=clock.elapsedTime;const rotor=copy.getObjectByName('Rotor');if(rotor){rotor.rotation.y=t*.35;rotor.position.y=1.72+Math.sin(t)*.035;}const ring=copy.getObjectByName('InnerRing');if(ring)ring.rotation.y=t*.25;const hammer=copy.getObjectByName('Hammer');if(hammer)hammer.position.y=1.1+Math.sin(t*1.6)*.18;});
 return <group position={position} scale={.7} onClick={ghost?undefined:e=>{e.stopPropagation();onSelect(kind)}}><primitive object={copy}/></group>
}
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="world-error">3D world unavailable.<br/>Tasks and progress still work.</div>:this.props.children}}
function EditorCamera({controls,reset,api}:{controls:RefObject<any>,reset:number,api:RefObject<WorldApi|null>}){
 const {camera,size,gl}=useThree();
 useEffect(()=>{camera.position.set(7,8,11);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/9,size.height/7,64);camera.updateProjectionMatrix();}controls.current?.target.set(0,.55,0);controls.current?.update();},[camera,size.width,size.height,reset,controls]);
 useEffect(()=>{api.current={project:(x,y)=>{const r=gl.domElement.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);const point=new THREE.Vector3();return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)?[point.x,0,point.z]:null;}};return()=>{api.current=null}},[api,camera,gl]);
 return null;
}
export default function World({levels,placements,onSelect,reset,api,preview,dragging,onGround}:{levels:Record<Kind,number>,placements:Placements,onSelect:(k:Kind)=>void,reset:number,api:RefObject<WorldApi|null>,preview:Preview,dragging:boolean,onGround:(x:number,y:number)=>void}){
 const [reduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);const controls=useRef<any>(null);
 return <Boundary><Canvas orthographic shadows dpr={[1,1.5]} camera={{position:[7,8,11],zoom:40}} gl={{antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>gl.setClearColor('#ffffff')} onPointerMissed={e=>onGround(e.clientX,e.clientY)}><ambientLight intensity={1.8}/><directionalLight position={[3,8,5]} intensity={3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-.001}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow onClick={e=>{e.stopPropagation();onGround(e.nativeEvent.clientX,e.nativeEvent.clientY)}}><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.12}/></mesh><Suspense fallback={<Html center><span className="loading-world">Loading objects…</span></Html>}>{(Object.entries(placements) as [Kind,Point][]).filter(([k])=>levels[k]>0).map(([k,p])=><Machine key={k} kind={k} level={levels[k]} position={p} onSelect={onSelect} reduced={reduced}/>)}{preview&&<><Machine kind={preview.kind} level={Math.max(1,levels[preview.kind])} position={preview.point} onSelect={()=>{}} reduced ghost/><mesh rotation={[-Math.PI/2,0,0]} position={[preview.point[0],.01,preview.point[2]]}><ringGeometry args={[1,1.025,48]}/><meshBasicMaterial color={preview.valid?'#96999c':'#333333'}/></mesh></>}</Suspense><OrbitControls ref={controls} makeDefault target={[0,.55,0]} enabled={!dragging} enableRotate={false} enableDamping={!reduced} minZoom={15} maxZoom={150} maxPolarAngle={Math.PI/2.2} touches={{ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN}} mouseButtons={{LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}}/><EditorCamera controls={controls} reset={reset} api={api}/></Canvas></Boundary>
}
