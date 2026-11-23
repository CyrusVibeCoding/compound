import {isShop,isActivity} from './buildingKinds.mjs';
import {streetPath} from './paths.mjs';

/** @typedef {import('./World').Point} Point */
/** @typedef {{id:string,kind:string,point:Point,facing:number}} Stop */
/** @typedef {{type:'walk',points:Point[],lengths:number[],start:number,end:number}|{type:'visit',stop:Stop,point:Point,start:number,end:number}|{type:'home',point:Point,start:number,end:number}} Segment */

// Build bounded, reusable timelines when the layout changes; never pathfind per frame.
/** @param {Point} home @param {Stop[]} stops @param {any[]} obstacles @param {(start:Point,end:Point)=>Point[]} [routeFor] */
export function makeOuting(home, stops, obstacles,routeFor=(start,end)=>streetPath(start,end,obstacles)) {
 /** @type {Segment[]} */
 const segments=[];let at=home,time=0;
 /** @param {Point[]} points */
 const walk=points=>{
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));
  const duration=lengths.at(-1)/.38;
  if(duration>0){segments.push({type:'walk',points,lengths,start:time,end:time+duration});time+=duration;}
 };
 for(const stop of stops){
  const route=routeFor(at,stop.point),end=route.at(-1);
  // A failed search returns only the start. Never sell at an unreachable destination.
  if(Math.hypot(end[0]-stop.point[0],end[2]-stop.point[2])>.36)continue;
  walk(route);at=end;
  const duration=(isActivity(stop.kind))?7:14;
  segments.push({type:'visit',stop,point:at,start:time,end:time+duration});time+=duration;
 }
 const back=routeFor(at,home);
 walk(back);
 segments.push({type:'home',point:back.at(-1),start:time,end:time+12});
 return {segments,duration:time+12};
}

// Alternate a small errand chain with a simple visit; every destination gets a turn.
/** @param {Stop[]} destinations @param {number} index @returns {Stop[][]} */
export function outingStops(destinations,index){
 const parks=destinations.filter(s=>s.kind==='park'||s.kind==='plaza');
 if(!destinations.length)return [[]];
 return destinations.map((_,n)=>{
  const stop=destinations[(index+n)%destinations.length],park=parks[(index+n)%parks.length];
  return (isShop(stop.kind))&&park&&n%2===0?[stop,park]:[stop];
 });
}
