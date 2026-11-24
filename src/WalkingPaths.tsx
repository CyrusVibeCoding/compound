import {useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import type {walkingNetwork} from './walking.mjs';
export default function WalkingPaths({network}:{network:ReturnType<typeof walkingNetwork>}){
 const border=useRef<THREE.InstancedMesh>(null),surface=useRef<THREE.InstancedMesh>(null);
 const paved=(p:number[])=>network.pavedPaths.some(path=>path.slice(1).some((b,i)=>{const a=path[i],dx=b[0]-a[0],dz=b[2]-a[2],span=dx*dx+dz*dz,t=span?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[2]-a[2])*dz)/span)):0;return Math.hypot(p[0]-a[0]-t*dx,p[2]-a[2]-t*dz)<.17;}));
 const tiles=useMemo(()=>[
  ...network.nodes.filter(p=>!paved(p)).map(p=>({x:p[0],z:p[2],length:.36,angle:0})),
  ...[...network.edges,...network.approaches].filter(([a,b])=>!(paved(a)&&paved(b)&&paved([(a[0]+b[0])/2,0,(a[2]+b[2])/2]))).map(([a,b])=>({x:(a[0]+b[0])/2,z:(a[2]+b[2])/2,length:Math.hypot(a[0]-b[0],a[2]-b[2]),angle:Math.atan2(b[2]-a[2],b[0]-a[0])}))
 ],[network]);
 useLayoutEffect(()=>{const o=new THREE.Object3D();for(const [mesh,inset,y] of [[border.current,0,.004],[surface.current,.035,.006]] as const){if(!mesh)continue;tiles.forEach((t,i)=>{o.position.set(t.x,y,t.z);o.rotation.set(-Math.PI/2,0,-t.angle);o.scale.set(t.length-inset,.36-inset,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}},[tiles]);
 if(!tiles.length)return null;
 return <group name="walking-network" raycast={()=>{}}>{[border,surface].map((ref,i)=><instancedMesh key={`${i}-${tiles.length}`} ref={ref} args={[undefined,undefined,tiles.length]} raycast={()=>{}}><planeGeometry/><meshBasicMaterial color={i?'#ddd9ce':'#c9c6bc'} toneMapped={false}/></instancedMesh>)}</group>;
}
