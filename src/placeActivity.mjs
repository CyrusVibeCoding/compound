// Transient activity only: no needs, extra payments, saved timers, or background simulation.
export function activityWorld(){return {visits:new Map(),spots:new Map(),shops:new Map()};}
export const PARK_SPOTS=[
 {id:'front-bench',x:0,z:.49,y:.125,facing:0,seated:true,via:[[.5,.36]]},
 {id:'back-bench',x:0,z:-.49,y:.125,facing:0,seated:true,via:[[.5,-.49]]},
 {id:'fountain',x:.5,z:0,y:.165,facing:-Math.PI/2,seated:false,via:[]},
];
export function releaseVisit(world,resident){
 const visit=world.visits.get(resident);if(!visit)return;
 if(visit.spot)world.spots.delete(`${visit.buildingId}:${visit.spot.id}`);
 if(visit.kind==='cafe'||visit.kind==='bakery'){
  const count=(world.shops.get(visit.buildingId)??1)-1;
  if(count>0)world.shops.set(visit.buildingId,count);else world.shops.delete(visit.buildingId);
 }
 world.visits.delete(resident);
}
export function beginVisit(world,resident,buildingId,kind,index=0){
 const current=world.visits.get(resident);if(current?.buildingId===buildingId)return current;
 releaseVisit(world,resident);
 let spot=null;
 if(kind==='park'){
  for(let n=0;n<PARK_SPOTS.length;n++){const candidate=PARK_SPOTS[(index+n)%PARK_SPOTS.length];if(!world.spots.has(`${buildingId}:${candidate.id}`)){spot=candidate;break;}}
  if(!spot)return null; // A full park is simply passed by; nobody waits in a queue.
  world.spots.set(`${buildingId}:${spot.id}`,resident);
 }
 const visit={buildingId,kind,spot,elapsed:0};world.visits.set(resident,visit);
 if(kind==='cafe'||kind==='bakery')world.shops.set(buildingId,(world.shops.get(buildingId)??0)+1);
 return visit;
}

// Routes stay inside the park's existing paved/planted footprint, around the fountain.
export function parkActivity(entrance,rotation,spot){
 const a=rotation*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
 const origin=[entrance[0]-c*.5,entrance[2]+s*.5];
 const local=(x,z,y=.165)=>[origin[0]+c*x+s*z,y,origin[1]-s*x+c*z];
 const points=[local(.5,0),...spot.via.map(([x,z])=>local(x,z)),local(spot.x,spot.z)];
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));
 const travel=lengths.at(-1)/.3,linger=spot.seated?10:7;
 return {points,lengths,travel,linger,duration:travel*2+linger,spot,facing:spot.facing+a};
}
// Mutates a small reusable output object rather than allocating per frame.
export function parkPose(plan,time,out){
 const resting=time>=plan.travel&&time<plan.travel+plan.linger;
 const returning=time>=plan.travel+plan.linger;
 const distance=resting?plan.lengths.at(-1):Math.max(0,returning?(plan.duration-time)*.3:time*.3);
 let i=1;while(i<plan.lengths.length-1&&plan.lengths[i]<distance)i++;
 const a=plan.points[Math.min(i-1,plan.points.length-1)],b=plan.points[Math.min(i,plan.points.length-1)];
 const length=plan.lengths[i]-plan.lengths[i-1],t=length?Math.min(1,distance/length-plan.lengths[i-1]/length):0;
 out.x=a[0]+(b[0]-a[0])*t;out.z=a[2]+(b[2]-a[2])*t;
 out.y=resting?plan.spot.y:.165;out.seated=resting&&plan.spot.seated;out.walking=!resting&&plan.travel>0;
 out.facing=resting||!out.walking?plan.facing:Math.atan2((b[0]-a[0])*(returning?-1:1),(b[2]-a[2])*(returning?-1:1));
 return out;
}
