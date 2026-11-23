import {test} from 'node:test';import assert from 'node:assert/strict';
import {activityWorld,beginVisit,releaseVisit,PARK_SPOTS,parkActivity,parkPose} from '../src/placeActivity.mjs';
test('park spots are exclusive, full parks skip extra visitors, and released seats are reusable',()=>{
 const w=activityWorld(),visits=[];
 for(let i=0;i<3;i++)visits.push(beginVisit(w,'r'+i,'park','park',0));
 assert.equal(new Set(visits.map(v=>v.spot.id)).size,3);assert.equal(beginVisit(w,'extra','park','park'),null);
 assert.equal(w.visits.size,3);assert.equal(w.shops.size,0);
 const seat=visits[0].spot;releaseVisit(w,'r0');assert.equal(beginVisit(w,'extra','park','park',0).spot,seat);
 releaseVisit(w,'missing');assert.equal(w.spots.size,3);
});
test('shop activity counts visitors independently from payment and survives one customer leaving',()=>{
 const w=activityWorld(),a=beginVisit(w,'a','cafe','cafe');
 assert.equal(beginVisit(w,'a','cafe','cafe'),a);assert.equal(w.shops.get('cafe'),1);
 beginVisit(w,'b','cafe','cafe');releaseVisit(w,'a');assert.equal(w.shops.get('cafe'),1);
 releaseVisit(w,'b');releaseVisit(w,'b');assert.equal(w.shops.size,0);
 beginVisit(w,'a','cafe','cafe');beginVisit(w,'a','bakery','bakery');assert.equal(w.shops.has('cafe'),false);assert.equal(w.shops.get('bakery'),1);
 beginVisit(w,'a','park','park');assert.equal(w.shops.size,0);releaseVisit(w,'a');assert.equal(w.visits.size,0);assert.equal(w.spots.size,0);
});
test('park activities walk to distinct spots, linger seated or standing, and return to the entrance at every rotation',()=>{
 for(let r=0;r<4;r++){
  const angle=r*Math.PI/2,entrance=[3+Math.cos(angle)*.5,0,2-Math.sin(angle)*.5],restPositions=[];
  for(const spot of PARK_SPOTS){
   const plan=parkActivity(entrance,r,spot),out={};
   parkPose(plan,0,out);assert.ok(Math.abs(out.x-entrance[0])<1e-8&&Math.abs(out.z-entrance[2])<1e-8);
   parkPose(plan,plan.travel+1,out);assert.equal(out.seated,spot.seated);assert.equal(out.walking,false);restPositions.push([out.x,out.z]);
   parkPose(plan,plan.duration,out);assert.ok(Math.abs(out.x-entrance[0])<1e-8&&Math.abs(out.z-entrance[2])<1e-8);
   // Every sample stays within the park and out of the fountain basin.
   for(let t=0;t<plan.duration;t+=.1){parkPose(plan,t,out);assert.ok(Number.isFinite(out.x+out.y+out.z+out.facing));assert.ok(Math.hypot(out.x-3,out.z-2)<.85);const fx=3-Math.sin(angle)*.126,fz=2-Math.cos(angle)*.126;assert.ok(Math.hypot(out.x-fx,out.z-fz)>.29);}
  }
  for(let i=0;i<restPositions.length;i++)for(let j=i+1;j<restPositions.length;j++)assert.ok(Math.hypot(restPositions[i][0]-restPositions[j][0],restPositions[i][1]-restPositions[j][1])>.4);
 }
});
