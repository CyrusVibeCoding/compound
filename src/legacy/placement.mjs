import {validId} from './machines.mjs';
export const KINDS=['core','press','assembler'];
export const DEFAULT_POSITIONS={core:[0,0,0],press:[2.6,0,-.8],assembler:[-2.6,0,-.8]};
export function placementsFor(state){return state.placements ?? Object.fromEntries(KINDS.filter(k=>state.levels[k]>0).map(k=>[k,DEFAULT_POSITIONS[k]]));}
export function validPlacements(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,p])=>validId(k)&&Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&p[1]===0&&Math.abs(p[0])<=12&&Math.abs(p[2])<=12);}
