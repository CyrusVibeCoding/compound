let snapshots={};
export function loadRoutines(value){snapshots=validRoutines(value)?{...value}:{};}
export function captureRoutines(state){const ids=new Set(state.buildings.flatMap(b=>[0,1,2].map(i=>`${b.id}-${i}`)));return {...state,routines:Object.fromEntries(Object.entries(snapshots).filter(([id])=>ids.has(id)))};}
export function rememberRoutine(id,value){delete snapshots[id];snapshots[id]=value;const keys=Object.keys(snapshots);if(keys.length>32)delete snapshots[keys[0]];}
export function savedRoutine(id,layout){const s=snapshots[id];return s?.layout===layout?s:null;}
export function validRoutines(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).length<=32&&Object.entries(value).every(([id,s])=>/^[a-z][a-z0-9-]{0,103}$/.test(id)&&s&&typeof s.layout==='string'&&s.layout.length<=128&&['trip','segment','time','at','parkElapsed'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.time<=1e9&&s.parkElapsed<=1e9&&s.at<=8.64e15&&s.trip<=1e12&&Number.isSafeInteger(s.trip)&&Number.isSafeInteger(s.segment)&&['','cafe','bakery'].includes(s.carrying));}
// Skip entire cycles mathematically; no replayed purchases or frame-by-frame offline work.
export function advanceRoutine(outings,snapshot,seconds,parkDuration){
 let trip=snapshot.trip,segment=Math.min(snapshot.segment,outings[trip%outings.length].segments.length-1),offset=0,carrying=snapshot.carrying;
 const duration=s=>s.type==='visit'&&(s.stop.kind==='park'||s.stop.kind==='plaza')?parkDuration(s.stop):s.end-s.start;
 const current=outings[trip%outings.length].segments[segment];
 offset=current.type==='visit'&&(current.stop.kind==='park'||current.stop.kind==='plaza')?(snapshot.time>=current.end?duration(current):snapshot.parkElapsed):Math.max(0,snapshot.time-current.start);
 let remaining=Math.max(0,seconds)+offset;
 const cycle=outings.reduce((sum,o)=>sum+o.segments.reduce((n,s)=>n+duration(s),0),0);
 if(remaining>=cycle){const cycles=Math.floor(remaining/cycle);remaining%=cycle;trip+=cycles*outings.length;carrying='';}
 while(remaining>=duration(outings[trip%outings.length].segments[segment])){
  remaining-=duration(outings[trip%outings.length].segments[segment]);segment++;
  if(segment>=outings[trip%outings.length].segments.length){segment=0;trip++;carrying='';}
 }
 const s=outings[trip%outings.length].segments[segment],park=s.type==='visit'&&(s.stop.kind==='park'||s.stop.kind==='plaza');
 return {trip,segment,time:s.start+(park?0:remaining),parkElapsed:park?remaining:0,carrying};
}

export function routineLayout(outings){const text=JSON.stringify(outings);let a=2166136261,b=5381;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i)}return `${text.length}:${a>>>0}:${b>>>0}`;}
