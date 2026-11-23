import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildingVisitPose,setDoorOpen} from '../src/buildingVisits.mjs';
import {activityWorld,beginVisit,releaseVisit} from '../src/placeActivity.mjs';
test('residents cross rotated doorways, disappear inside, and return to their exact route endpoint',()=>{
 for(const kind of ['house','big-house','cafe','bakery'])for(let r=0;r<4;r++){
  const a=r*Math.PI/2,origin=[3,0,2],approach=[3+Math.sin(a),.025,2+Math.cos(a)],duration=kind.includes('house')?12:14;
  const start=buildingVisitPose(kind,origin,r,0,duration,undefined,approach),inside=buildingVisitPose(kind,origin,r,duration/2,duration,undefined,approach),end=buildingVisitPose(kind,origin,r,duration,duration,undefined,approach);
  assert.ok(start.walking&&start.doorOpen&&!start.inside);assert.ok(inside.inside&&!inside.doorOpen);assert.ok(end.walking&&!end.inside);
  assert.ok(Math.hypot(start.x-approach[0],start.z-approach[2])<1e-8);assert.ok(Math.hypot(end.x-approach[0],end.z-approach[2])<1e-8);
  assert.ok(Math.hypot(start.x-inside.x,start.z-inside.z)>.4);
 }
});
test('one resident leaving a doorway does not close it on another, and cleanup releases requests',()=>{
 const w=activityWorld();beginVisit(w,'a','home','home');beginVisit(w,'b','home','home');setDoorOpen(w,'home','a',true);setDoorOpen(w,'home','b',true);releaseVisit(w,'a');assert.equal(w.doors.get('home').size,1);setDoorOpen(w,'home','b',false);assert.equal(w.doors.size,0);releaseVisit(w,'b');assert.equal(w.visits.size,0);
});
