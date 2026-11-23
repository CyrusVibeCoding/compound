// Doorway travel and concealed indoor time; no interiors, physics, or extra payments.
export function buildingVisitPose(kind,origin,rotation,elapsed,duration,out={x:0,y:0,z:0,inside:false,walking:false,doorOpen:false,facing:0},approach=/** @type {number[]|null} */(null)){
 const shop=kind==='cafe'||kind==='bakery',a=rotation*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
 const path=shop?[[0,1, .025],[0,.68,.10],[.15,.18,.10],[.301,.10,.10]]:[[0,1,.025],[kind==='big-house'?.084:0,.46,.12]];
 if(approach){const dx=approach[0]-origin[0],dz=approach[2]-origin[2];path[0]=[c*dx-s*dz,s*dx+c*dz,approach[1]];}
 const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
 const travel=lengths.at(-1)/.45,t=Math.max(0,Math.min(duration,elapsed)),entering=t<travel,exiting=t>=duration-travel;
 const distance=entering?t*.45:exiting?(duration-t)*.45:lengths.at(-1);
 let i=1;while(i<path.length-1&&lengths[i]<distance)i++;
 const p=path[i-1],q=path[i],span=lengths[i]-lengths[i-1],f=span?Math.max(0,Math.min(1,(distance-lengths[i-1])/span)):0,x=p[0]+(q[0]-p[0])*f,z=p[1]+(q[1]-p[1])*f;
 out.x=origin[0]+c*x+s*z;out.z=origin[2]-s*x+c*z;out.y=p[2]+(q[2]-p[2])*f;out.inside=!entering&&!exiting;out.walking=entering||exiting;out.doorOpen=out.walking;out.facing=a+(exiting?0:Math.PI);return out;
}
export function setDoorOpen(world,buildingId,resident,open){
 let people=world.doors.get(buildingId);if(open){if(!people){people=new Set();world.doors.set(buildingId,people)}people.add(resident)}else if(people){people.delete(resident);if(!people.size)world.doors.delete(buildingId)}
}

// Visibility is a pose property, never a latch left over from a previous segment.
export function residentVisible(segment,time,placements,rotations,homeId,homeKind){
 const shop=segment.type==='visit'&&['cafe','bakery'].includes(segment.stop.kind);
 if(segment.type!=='home'&&!shop)return true;
 const id=shop?segment.stop.id:homeId,kind=shop?segment.stop.kind:homeKind;
 return !buildingVisitPose(kind,placements[id],rotations[id]??0,time-segment.start,segment.end-segment.start,undefined,segment.point).inside;
}
