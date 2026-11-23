export const KINDS=['core','press','assembler'];
export const DEFAULT_POSITIONS={core:[0,0,0],press:[2.6,0,-.8],assembler:[-2.6,0,-.8]};
export function placementsFor(state){return state.placements ?? Object.fromEntries(KINDS.filter(k=>state.levels[k]>0).map(k=>[k,DEFAULT_POSITIONS[k]]));}
export function validPlacements(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,p])=>KINDS.includes(k)&&Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&p[1]===0&&Math.abs(p[0])<=12&&Math.abs(p[2])<=12);}
export function snapPlacement(placements,kind,point){
 if(!KINDS.includes(kind)||!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))return null;
 const x=Math.round(point[0]*2)/2,z=Math.round(point[2]*2)/2;
 if(Math.abs(x)>12||Math.abs(z)>12)return null;
 if(Object.entries(placements).some(([k,p])=>k!==kind&&Math.hypot(x-p[0],z-p[2])<1.9))return null;
 return [x,0,z];
}
