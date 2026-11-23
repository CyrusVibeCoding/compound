// Small bounded grid search, run only when the layout changes. No per-frame pathfinding.
export function door(point,rotation=0){const a=rotation*Math.PI/2;return [point[0]+Math.sin(a)*1.25,0,point[2]+Math.cos(a)*1.25];}
export function streetPath(start,end,obstacles){
 const step=.5,key=(x,z)=>`${x},${z}`,snap=p=>[Math.round(p[0]/step),Math.round(p[2]/step)],a=snap(start),b=snap(end),startKey=key(...a),goal=key(...b);
 const blocked=(x,z)=>Math.abs(x)>30||Math.abs(z)>30||obstacles.some(o=>{const p=Array.isArray(o)?o:o.point,r=Array.isArray(o) ? .94 : o.radius;return Math.abs(x*step-p[0])<r&&Math.abs(z*step-p[2])<r});
 if(blocked(...a)||blocked(...b))return [start];
 const queue=[a],from=new Map([[startKey,null]]);let found=false;
 for(let i=0;i<queue.length&&i<3721;i++){const [x,z]=queue[i];if(key(x,z)===goal){found=true;break}for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!from.has(k)&&!blocked(nx,nz)){from.set(k,key(x,z));queue.push([nx,nz]);}}}
 if(!found)return [start];
 const route=[];let k=goal;while(k!==null){const [x,z]=k.split(',').map(Number);route.push([x*step,.03,z*step]);k=from.get(k)}return route.reverse();
}
