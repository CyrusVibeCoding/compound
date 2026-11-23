export function validId(id){return typeof id==='string'&&/^[a-z][a-z0-9-]{0,99}$/.test(id)&&!['constructor','prototype','__proto__','settings','guide','migration'].includes(id)}
export function validPlacements(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,p])=>validId(k)&&Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&p[1]===0&&Math.abs(p[0])<=12&&Math.abs(p[2])<=12);}
export function snapPlacement(placements,id,point){
 if(!validId(id)||!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))return null;
 const x=Math.round(point[0]*2)/2,z=Math.round(point[2]*2)/2;if(Math.abs(x)>12||Math.abs(z)>12)return null;
 if(Object.entries(placements).some(([key,p])=>key!==id&&Math.hypot(x-p[0],z-p[2])<1.9))return null;return [x,0,z];
}
