import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
import {BUILDINGS,buildingCost,advanceRent} from '../src/city.mjs';
import {SHOP_KINDS,ACTIVITY_KINDS} from '../src/buildingKinds.mjs';
import {SALE_AMOUNTS,shopPurchase} from '../src/shops.mjs';
import {walkingNetwork} from '../src/walking.mjs';import {makeOuting} from '../src/outings.mjs';
import {advanceRoutine,validRoutines} from '../src/routines.mjs';
import {activityWorld,beginVisit,releaseVisit,placeSpots,parkActivity,parkPose} from '../src/placeActivity.mjs';
const added=['playground','library','flower-shop','ice-cream','market'];
test('all five purchase, price, rotate, store, restore and undo without upkeep or rent',()=>{
 for(const kind of added){let s={...migrate(INITIAL,0),cash:1000};s=reduce(s,{type:'place',id:'new-place',kind,point:[0,0,0],now:0});const cash=1000-BUILDINGS[kind].price;assert.equal(s.cash,cash);assert.equal(buildingCost(s,kind),Math.ceil(BUILDINGS[kind].price*1.2));assert.ok(validSave(JSON.parse(JSON.stringify(s))));assert.equal(advanceRent(s,86400000).cash,cash);
 s=reduce(s,{type:'rotate',id:'new-place',now:0});s=reduce(s,{type:'unplace',id:'new-place',now:0});s=reduce(s,{type:'place',id:'new-place',kind,point:[3,0,0],now:0});assert.equal(s.cash,cash);assert.equal(s.rotations['new-place'],1);s=reduce(s,{type:'undoLayout',now:0});assert.equal(s.placements['new-place'],undefined);assert.ok(validSave(s));}
});
test('every new destination is reachable at all four rotations',()=>{
 for(const kind of added)for(let r=0;r<4;r++){
 const n=walkingNetwork([{id:'home',kind:'house'},{id:'place',kind}],{home:[0,0,0],place:[4,0,0]},{place:r});
 const plan=makeOuting(n.entrances[0].point,[n.entrances[1]],n.obstacles,n.route);assert.ok(plan.segments.some(s=>s.type==='visit'),kind+' rotation '+r);
 }
});
test('new shops pay only eligible purchases and retain both cooldowns across backups',()=>{
 for(const kind of added){const state={...migrate(INITIAL,0),buildings:[{id:'home',kind:'house'},{id:'place',kind}],placements:{home:[0,0,0],place:[4,0,0]}};const action={shopId:'place',homeId:'home',resident:0,now:1000};const next=shopPurchase(state,action);assert.equal(next.cash-state.cash,SALE_AMOUNTS[kind]??0);assert.equal(shopPurchase(JSON.parse(JSON.stringify(next)),{...action,now:2000}).cash,next.cash);}
});
test('free activities reserve exclusive seats, return to rotated entrances, and catch up without payments',()=>{
 for(const kind of ['playground','library']){
 const world=activityWorld(),spots=placeSpots(kind);for(let i=0;i<spots.length;i++)assert.ok(beginVisit(world,'r'+i,'place',kind,i));assert.equal(beginVisit(world,'extra','place',kind),null);releaseVisit(world,'r0');assert.ok(beginVisit(world,'extra','place',kind));assert.equal(world.shops.size,0);
 for(let r=0;r<4;r++)for(const spot of spots){const entrance=[2,0,3],plan=parkActivity(entrance,r,spot),pose=parkPose(plan,plan.duration,{});assert.ok(Math.hypot(pose.x-2,pose.z-3)<1e-8);}
 const outings=[{segments:[{type:'visit',stop:{kind},start:0,end:7},{type:'home',start:7,end:19}]}];const next=advanceRoutine(outings,{trip:0,segment:0,time:0,parkElapsed:2,carrying:'market'},5,()=>20);assert.equal(next.parkElapsed,7);assert.equal(next.carrying,'market');
 assert.ok(validRoutines({person:{...next,at:1000,layout:'test'}}));
 }
});
