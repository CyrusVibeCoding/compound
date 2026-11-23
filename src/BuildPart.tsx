import {useRef} from 'react';import {useFrame} from '@react-three/fiber';import * as THREE from 'three';import type {Point} from './World';
export default function Part({visible,position,reduced,children}:{visible:boolean,position:Point,reduced:boolean,children:React.ReactNode}){
 const ref=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(!ref.current)return;const target=visible?1:0;ref.current.scale.setScalar(reduced?target:THREE.MathUtils.damp(ref.current.scale.x,target,9,Math.min(dt,.05)));ref.current.position.y=position[1]+(1-ref.current.scale.x)*.5;});
 return <group ref={ref} position={position} scale={reduced&&visible?1:.001}>{children}</group>;
}
