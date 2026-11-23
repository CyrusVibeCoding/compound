import {KINDS,placementsFor,validPlacements,snapPlacement} from './placement.mjs';
import {advance,addCharge} from './production.mjs';
import {FINISHES,finishUnlocked} from './progression.mjs';
import {machinesFor,validMachines,validId,newMachineCost} from './machines.mjs';
export const DEFAULT_PROJECTS=['Business','School','Personal'];
export const INITIAL={version:1,matter:0,earned:0,minutes:0,tasks:[],levels:{core:1,press:0,assembler:0},session:null,history:[],placements:{}};
export function dayKey(now=Date.now()){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function migrate(state,now=Date.now()){
 return {...state,machines:machinesFor(state),look:state.look??'porcelain',calm:state.calm??false,placements:placementsFor(state),rotations:state.rotations??{},layoutUndo:state.layoutUndo??null,projects:[...new Set([...DEFAULT_PROJECTS,...(state.projects??[]),...state.tasks.map(t=>t.project)])],factory:state.factory??{charge:0,stored:0,lastTick:now},tasks:state.tasks.map(t=>({...t,notes:t.notes??'',today:t.today??dayKey(now)}))};
}
export function cost(kind,level){return ({core:[0,40,100],press:[60,90,150],assembler:[120,160,240]})[kind]?.[level]??null;}
export function remaining(session,now=Date.now()){return session?Math.max(0,session.duration*60000-(now-session.started)):0;}
function undoFor(state){return {placements:{...state.placements},rotations:{...state.rotations}};}
function complete(state,id){if(!state.tasks.some(t=>t.id===id&&!t.done))return state;return addCharge({...state,matter:state.matter+20,earned:state.earned+20,tasks:state.tasks.map(t=>t.id===id?{...t,done:true}:t)},5);}
function claim(state,now,outcome='progress',note=''){
 if(!state.session||remaining(state.session,now)>0)return state;
 const {duration,taskId}=state.session,reward=duration*2;
 return addCharge({...state,matter:state.matter+reward,earned:state.earned+reward,minutes:state.minutes+duration,session:null,history:[{at:now,taskId,minutes:duration,outcome,note:String(note).slice(0,500)},...state.history].slice(0,200)},duration);
}
export function reduce(original,action){
 const now=action.now??Date.now();let state=advance(migrate(original,now),now);
 switch(action.type){
 case 'tick':return state;
 case 'setLook':return finishUnlocked(state,action.look)?{...state,look:action.look}:state;
 case 'setCalm':return {...state,calm:!!action.calm};
 case 'collect':return {...state,matter:state.matter+state.factory.stored,earned:state.earned+state.factory.stored,factory:{...state.factory,stored:0}};
 case 'place':{
  if(!KINDS.includes(action.kind))return state;
  const machines=machinesFor(state),id=action.id??machines.find(m=>m.kind===action.kind)?.id??action.kind;
  if(!validId(id)||(KINDS.includes(id)&&id!==action.kind))return state;
  const existing=machines.find(m=>m.id===id);if(existing&&existing.kind!==action.kind)return state;
  const point=snapPlacement(state.placements,id,action.point);if(!point)return state;
  const price=existing?0:newMachineCost(state,action.kind);if(!Number.isFinite(price)||state.matter<price)return state;
  return {...state,matter:state.matter-price,machines:existing?machines:[...machines,{id,kind:action.kind}],levels:{...state.levels,[action.kind]:Math.max(1,state.levels[action.kind])},placements:{...state.placements,[id]:point},layoutUndo:undoFor(state)};
 }
 case 'unplace':{const id=action.id??action.kind;if(!state.placements[id])return state;const placements={...state.placements};delete placements[id];return {...state,placements,layoutUndo:undoFor(state)};}
 case 'rotate':{const id=action.id??action.kind;if(!state.placements[id])return state;return {...state,rotations:{...state.rotations,[id]:((state.rotations[id]??0)+1)%4},layoutUndo:undoFor(state)};}
 case 'undoLayout':return state.layoutUndo?{...state,placements:state.layoutUndo.placements,rotations:state.layoutUndo.rotations,layoutUndo:null}:state;
 case 'projectAdd':{const name=String(action.name).trim().slice(0,40);return !name||state.projects.some(p=>p.toLowerCase()===name.toLowerCase())?state:{...state,projects:[...state.projects,name]};}
 case 'add':{const title=String(action.title).trim().slice(0,240);if(!title)return state;return {...state,tasks:[...state.tasks,{id:action.id,title,project:action.project,done:false,steps:[],notes:'',today:dayKey(now)}]};}
 case 'edit':return {...state,tasks:state.tasks.map(t=>t.id!==action.id?t:{...t,...(typeof action.title==='string'&&action.title.trim()?{title:action.title.trim().slice(0,240)}:{}),...(typeof action.notes==='string'?{notes:action.notes.slice(0,10000)}:{}),...(state.projects.includes(action.project)?{project:action.project}:{}),...(action.today!==undefined?{today:action.today?dayKey(now):''}:{})})};
 case 'delete':return {...state,tasks:state.tasks.filter(t=>t.id!==action.id)};
 case 'step':return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:[...t.steps,{id:action.stepId,title:action.title,done:false}]}:t)};
 case 'toggleStep':return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:t.steps.map(s=>s.id===action.stepId?{...s,done:!s.done}:s)}:t)};
 case 'complete':return complete(state,action.id);
 case 'upgrade':{if(!KINDS.includes(action.kind))return state;const level=state.levels[action.kind],price=cost(action.kind,level);if(price===null||state.matter<price)return state;return {...state,matter:state.matter-price,levels:{...state.levels,[action.kind]:level+1}};}
 case 'start':return state.session||![5,10,25].includes(action.duration)?state:{...state,session:{taskId:action.id,started:now,duration:action.duration}};
 case 'cancel':return {...state,session:null};
 case 'claim':return claim(state,now);
 case 'finishSession':{
  if(!state.session||remaining(state.session,now)>0||!['finished','progress','continue'].includes(action.outcome))return state;
  const session=state.session;state=claim(state,now,action.outcome,action.note);
  if(action.outcome==='finished')state=complete(state,session.taskId);
  if(action.outcome==='continue')state={...state,session:{...session,started:now}};
  return state;
 }
 default:return state;
 }
}
const finitePositive=n=>Number.isFinite(n)&&n>=0;
const rotationValid=r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.entries(r).every(([k,v])=>validId(k)&&Number.isInteger(v)&&v>=0&&v<=3);
export function validSave(s){
 return (s?.look===undefined||FINISHES.some(f=>f.id===s.look))&&(s?.calm===undefined||typeof s.calm==='boolean')&&s?.version===1&&finitePositive(s.matter)&&finitePositive(s.earned)&&finitePositive(s.minutes)&&
 (s.machines===undefined||(validMachines(s.machines)&&s.machines.every(m=>s.levels?.[m.kind]>0)))&&(s.placements===undefined||(validPlacements(s.placements)&&Object.keys(s.placements).every(id=>machinesFor(s).some(m=>m.id===id))))&&(s.rotations===undefined||rotationValid(s.rotations))&&
 (s.factory===undefined||(finitePositive(s.factory?.charge)&&finitePositive(s.factory?.stored)&&Number.isFinite(s.factory?.lastTick)))&&
 (s.projects===undefined||(Array.isArray(s.projects)&&s.projects.every(p=>typeof p==='string'&&p.trim()&&p.length<=40)))&&
 (s.layoutUndo==null||(validPlacements(s.layoutUndo.placements)&&rotationValid(s.layoutUndo.rotations)))&&
 Array.isArray(s.tasks)&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&typeof t.project==='string'&&typeof t.done==='boolean'&&(t.notes===undefined||typeof t.notes==='string')&&(t.today===undefined||typeof t.today==='string')&&Array.isArray(t.steps)&&t.steps.every(x=>typeof x.id==='string'&&typeof x.title==='string'&&typeof x.done==='boolean'))&&
 KINDS.every(k=>Number.isInteger(s.levels?.[k])&&s.levels[k]>=(k==='core'?1:0)&&s.levels[k]<=3)&&Array.isArray(s.history)&&s.history.every(h=>h&&Number.isFinite(h.at)&&typeof h.taskId==='string'&&finitePositive(h.minutes)&&(h.note===undefined||typeof h.note==='string')&&(h.outcome===undefined||['finished','progress','continue'].includes(h.outcome)))&&
 (s.session===null||(typeof s.session?.taskId==='string'&&Number.isFinite(s.session.started)&&[5,10,25].includes(s.session.duration)));
}
