import { Suspense, useEffect, useRef, Component, type ReactNode, type RefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import Building from './Building';
import Residents from './Residents';
import {Halo,SceneBurst} from './SceneEffects';
import type {SceneEvent} from './effects';
export type Kind='house'|'big-house'|'park'|'cafe';
export type Point=[number,number,number];
export type BuildingInstance={id:string,kind:Kind};
export type Placements=Record<string,Point>;
export type WorldApi={project:(x:number,y:number)=>Point|null};
export type Preview={id:string,kind:Kind,point:Point,valid:boolean}|null;
export type DragHandlers={start:(id:string,e:PointerEvent)=>void,move:(e:PointerEvent)=>void,end:(e:PointerEvent)=>void,cancel:()=>void};
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="world-error">3D world unavailable.<br/>Tasks and progress still work.</div>:this.props.children}}
function EditorCamera({controls,reset,api,placements}:{controls:RefObject<any>,reset:number,api:RefObject<WorldApi|null>,placements:Placements}){
 const {camera,size,gl}=useThree(),layout=useRef(placements);layout.current=placements;
 useEffect(()=>{const points=Object.values(layout.current) as Point[];const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);const minX=points.length?Math.min(...xs):0,maxX=points.length?Math.max(...xs):0,minZ=points.length?Math.min(...zs):0,maxZ=points.length?Math.max(...zs):0,x=(minX+maxX)/2,z=(minZ+maxZ)/2,span=Math.hypot(maxX-minX,maxZ-minZ)+3;camera.position.set(x+7,8,z+11);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/9,size.height/7,64,size.width/span,size.height/(span*.7));camera.updateProjectionMatrix();}controls.current?.target.set(x,.55,z);controls.current?.update();},[camera,size.width,size.height,reset,controls]);
 useEffect(()=>{api.current={project:(x,y)=>{const r=gl.domElement.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);const point=new THREE.Vector3();return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)?[point.x,0,point.z]:null;}};return()=>{api.current=null}},[api,camera,gl]);
 return null;
}
export default function World({buildings,placements,rotations,reset,api,preview,dragging,editing,canEdit,onGround,handlers,reduced,event,selection}:{buildings:BuildingInstance[],placements:Placements,rotations:Record<string,number>,reset:number,api:RefObject<WorldApi|null>,preview:Preview,dragging:boolean,editing:boolean,canEdit:boolean,onGround:(x:number,y:number)=>void,handlers:DragHandlers,reduced:boolean,event:SceneEvent,selection:string|null}){
 const controls=useRef<any>(null);
 const wrappedHandlers={...handlers,start:(id:string,e:PointerEvent)=>{if(e.button!==0)return;if(controls.current)controls.current.enabled=false;handlers.start(id,e)}};
 return <Boundary><Canvas orthographic shadows dpr={[1,1.5]} camera={{position:[7,8,11],zoom:40}} gl={{antialias:true,powerPreference:'low-power',alpha:true}} onCreated={({gl})=>gl.setClearColor('#ffffff',0)} onPointerMissed={e=>onGround(e.clientX,e.clientY)}>
  <ambientLight intensity={1.8}/><directionalLight position={[3,8,5]} intensity={3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-.001}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow onClick={e=>{e.stopPropagation();onGround(e.nativeEvent.clientX,e.nativeEvent.clientY)}}><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.12}/></mesh>
  <Grid position={[0,-.008,0]} args={[200,200]} infiniteGrid followCamera cellSize={.5} sectionSize={2} cellThickness={editing ? .65 : .5} sectionThickness={.7} cellColor="#e8eaec" sectionColor="#dde1e4" fadeDistance={200} fadeStrength={1} raycast={()=>{}}/>
  <Suspense fallback={null}>
   {buildings.filter(m=>placements[m.id]).map(m=><Building key={m.id} id={m.id} kind={m.kind} position={placements[m.id]} rotation={rotations[m.id]} handlers={canEdit?wrappedHandlers:undefined} reduced={reduced}/>)}
   {preview&&<><Building id={preview.id} kind={preview.kind} position={preview.point} rotation={rotations[preview.id]} reduced ghost/><mesh rotation={[-Math.PI/2,0,0]} position={[preview.point[0],.01,preview.point[2]]}><ringGeometry args={[1,1.025,48]}/><meshBasicMaterial color={preview.valid?'#96999c':'#333333'}/></mesh>{!preview.valid&&<group position={preview.point}>{[-1,1].map(n=><mesh key={n} rotation={[-Math.PI/2,0,n*Math.PI/4]} position={[0,.02,0]}><planeGeometry args={[.5,.04]}/><meshBasicMaterial color="#333"/></mesh>)}</group>}</>}
  </Suspense>
  <Suspense fallback={null}><Residents buildings={buildings} placements={placements} rotations={rotations} reduced={reduced}/></Suspense>{selection&&placements[selection]&&<Halo point={placements[selection]!} reduced={reduced}/>}<SceneBurst event={event} reduced={reduced}/>
  <OrbitControls ref={controls} makeDefault target={[0,.55,0]} enabled={!dragging} enableRotate={false} enableDamping={!reduced} minZoom={8} maxZoom={150} maxPolarAngle={Math.PI/2.2} touches={{ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN}} mouseButtons={{LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}}/>
  <EditorCamera controls={controls} reset={reset} api={api} placements={placements}/>
 </Canvas></Boundary>;
}
