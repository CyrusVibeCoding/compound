import {KINDS,placementsFor,validPlacements,snapPlacement} from './placement.mjs';
export const INITIAL = { version:1, matter:0, earned:0, minutes:0, tasks:[], levels:{core:1,press:0,assembler:0}, session:null, history:[], placements:{} };
export function cost(kind,level){ return ({core:[0,40,100],press:[60,90,150],assembler:[120,160,240]})[kind]?.[level] ?? null; }
export function remaining(session,now=Date.now()){ return session ? Math.max(0,session.duration*60000-(now-session.started)) : 0; }
export function reduce(state,action){
 switch(action.type){
 case 'place':{
  if(!KINDS.includes(action.kind))return state;
  const placements=placementsFor(state),point=snapPlacement(placements,action.kind,action.point);
  if(!point)return state;
  const level=state.levels[action.kind],price=level===0?cost(action.kind,0):0;
  if(state.matter<price)return state;
  return {...state,matter:state.matter-price,levels:{...state.levels,[action.kind]:Math.max(1,level)},placements:{...placements,[action.kind]:point}};
 }
 case 'unplace':{const placements={...placementsFor(state)};delete placements[action.kind];return {...state,placements};}

 case 'add': return {...state,tasks:[...state.tasks,{id:action.id,title:action.title.trim(),project:action.project,done:false,steps:[]}]};
 case 'delete': return {...state,tasks:state.tasks.filter(t=>t.id!==action.id)};
 case 'step': return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:[...t.steps,{id:action.stepId,title:action.title,done:false}]}:t)};
 case 'toggleStep':return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:t.steps.map(s=>s.id===action.stepId?{...s,done:!s.done}:s)}:t)};
 case 'complete': {
  if(!state.tasks.some(t=>t.id===action.id&&!t.done))return state;
  return {...state,matter:state.matter+20,earned:state.earned+20,tasks:state.tasks.map(t=>t.id===action.id?{...t,done:true}:t)};
 }
 case 'upgrade':{let l=state.levels[action.kind],c=cost(action.kind,l);if(c===null||state.matter<c)return state;return {...state,matter:state.matter-c,levels:{...state.levels,[action.kind]:l+1}};}
 case 'start':return state.session?state:{...state,session:{taskId:action.id,started:action.now,duration:action.duration}};
 case 'cancel':return {...state,session:null};
 case 'claim':{
  if(!state.session||remaining(state.session,action.now)>0)return state;
  const reward=state.session.duration*2;
  return {...state,matter:state.matter+reward,earned:state.earned+reward,minutes:state.minutes+state.session.duration,session:null,history:[{at:action.now,taskId:state.session.taskId,minutes:state.session.duration},...state.history].slice(0,200)};
 }
 default:return state;
 }
}
export function validSave(s){return (s?.placements===undefined||validPlacements(s.placements))&&s?.version===1&&Number.isFinite(s.matter)&&s.matter>=0&&Number.isFinite(s.earned)&&Number.isFinite(s.minutes)&&Array.isArray(s.tasks)&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&typeof t.project==='string'&&typeof t.done==='boolean'&&Array.isArray(t.steps)&&t.steps.every(x=>typeof x.id==='string'&&typeof x.title==='string'&&typeof x.done==='boolean'))&&['core','press','assembler'].every(k=>Number.isInteger(s.levels?.[k])&&s.levels[k]>=(k==='core'?1:0)&&s.levels[k]<=3)&&Array.isArray(s.history)&&(s.session===null||(typeof s.session?.taskId==='string'&&Number.isFinite(s.session.started)&&[5,10,25].includes(s.session.duration)));}
