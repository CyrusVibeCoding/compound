import {useEffect,useState} from 'react';
import type {Kind,Point} from './World';
export type SceneEvent={id:number,at:number,kind:'place'|'upgrade'|'collect',point:Point,machine?:Kind}|null;
export function useReducedEffects(calm=false){const [system,setSystem]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setSystem(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[]);return calm||system;}
