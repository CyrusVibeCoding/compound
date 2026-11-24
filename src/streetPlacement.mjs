import {isTransport,transportPaths} from './transport.mjs';
function rect(x,z,hx,hz){return [[x-hx,z-hz],[x+hx,z-hz],[x+hx,z+hz],[x-hx,z+hz]];}
function strip(a,b,width){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),x=-dz/length*width/2,z=dx/length*width/2;return [[a[0]+x,a[1]+z],[b[0]+x,b[1]+z],[b[0]-x,b[1]-z],[a[0]-x,a[1]-z]];}
function shapes(kind,asphaltOnly){
 if(kind==='sidewalk')return [rect(0,0,.16,1)];
 if(kind.startsWith('parking-'))return [rect(0,0,kind==='parking-small'?.8:1,1)];
 if(kind==='road'||kind==='curved-road'){const path=transportPaths(kind).drive[0],width=asphaltOnly?.72:1.28;return path.slice(1).map((p,i)=>strip(path[i],p,width));}
 return [rect(0,0,.81,.81)];
}
function overlaps(a,b){for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],axis=[p[1]-q[1],q[0]-p[0]],length=Math.hypot(...axis),project=poly=>poly.map(v=>(v[0]*axis[0]+v[1]*axis[1])/length),av=project(a),bv=project(b);if(Math.min(Math.max(...av),Math.max(...bv))-Math.max(Math.min(...av),Math.min(...bv))<=.025)return false;}return true;}
export function streetCollision(kind,point,rotation,otherKind,otherPoint,otherRotation){
 if(!isTransport(kind)&&!isTransport(otherKind))return Math.hypot(point[0]-otherPoint[0],point[2]-otherPoint[2])<1.9;
 if(Math.hypot(point[0]-otherPoint[0],point[2]-otherPoint[2])<.1)return true;
 const transform=(shape,p,r)=>{const a=r*Math.PI/2,c=Math.cos(a),s=Math.sin(a);return shape.map(([x,z])=>[p[0]+c*x+s*z,p[2]-s*x+c*z]);};
 const a=shapes(kind,otherKind==='sidewalk').map(s=>transform(s,point,rotation));
 const b=shapes(otherKind,kind==='sidewalk').map(s=>transform(s,otherPoint,otherRotation));
 return a.some(x=>b.some(y=>overlaps(x,y)));
}
