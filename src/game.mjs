import {validRoutines} from './routines.mjs';
import {shopPurchase,validCommerce} from './shops.mjs';
import {validDate} from './dates.mjs';
import {validNotes} from './notes.mjs';
import {BUILDINGS,buildingCost,advanceRent} from './city.mjs';
import {validId,validPlacements,snapPlacement} from './placement.mjs';
import {validLegacySave} from './legacy/save.mjs';
import {machinesFor} from './legacy/machines.mjs';
import {placementsFor} from './legacy/placement.mjs';
export const DEFAULT_PROJECTS=['Business','School','Personal'];
export const INITIAL={version:2,cash:40,earned:0,minutes:0,notes:[],tasks:[],buildings:[],placements:{},rotations:{},layoutUndo:null,session:null,history:[],projects:DEFAULT_PROJECTS,calm:false,sound:false,haptics:false,rent:{lastTick:null,total:0}};
export function dayKey(now=Date.now()){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function migrate(state,now=Date.now()){
 if(state.version===2)return {...state,notes:state.notes??[],rent:state.rent.lastTick===null?{...state.rent,lastTick:now}:state.rent};
 const retired=machinesFor(state),upgradeCosts={core:[40,100],press:[90,150],assembler:[160,240]},refund=retired.reduce((sum,m)=>sum+upgradeCosts[m.kind].slice(0,Math.max(0,(m.level??state.levels[m.kind])-1)).reduce((a,b)=>a+b,0),0);
 const mapping={core:'house',press:'big-house',assembler:'park'};
 return {...INITIAL,cash:state.matter+(state.factory?.charge??0)+(state.factory?.stored??0)+refund,earned:state.earned,minutes:state.minutes,tasks:state.tasks.map(t=>({...t,notes:t.notes??'',today:t.today??dayKey(now)})),projects:[...new Set([...DEFAULT_PROJECTS,...(state.projects??[]),...state.tasks.map(t=>t.project)])],history:state.history,session:state.session,buildings:machinesFor(state).map(m=>({id:m.id,kind:mapping[m.kind]})),placements:placementsFor(state),rotations:state.rotations??{},layoutUndo:state.layoutUndo??null,calm:state.calm??false,rent:{lastTick:now,total:0},legacyFactory:{...state},conversionCredit:refund};
}
export function remaining(session,now=Date.now()){return session?Math.max(0,session.duration*60000-(now-session.started)):0;}
function undoFor(state){return {placements:{...state.placements},rotations:{...state.rotations}};}
function complete(state,id){if(!state.tasks.some(t=>t.id===id&&!t.done))return state;return {...state,cash:state.cash+20,earned:state.earned+20,tasks:state.tasks.map(t=>t.id===id?{...t,done:true}:t)};}
function claim(state,now,outcome='progress',note='',nextStep=''){
 if(!state.session||remaining(state.session,now)>0)return state;
 const {duration,taskId}=state.session,reward=duration*2;
 return {...state,cash:state.cash+reward,earned:state.earned+reward,minutes:state.minutes+duration,session:null,history:[{at:now,taskId,minutes:duration,outcome,nextStep:String(nextStep).slice(0,240),note:String(note).slice(0,500)},...state.history].slice(0,200)};
}
export function reduce(original,action){
 const now=action.now??Date.now();if(action.type==='reset')return {...INITIAL,rent:{lastTick:now,total:0}};let state=advanceRent(migrate(original,now),now);
 switch(action.type){
 case 'shopSale':return shopPurchase(state,action);
 case 'noteAdd':{
  if(typeof action.id!=='string'||!action.id||state.notes.some(n=>n.id===action.id))return state;
  return {...state,notes:[...state.notes,{id:action.id,title:'',project:null,blocks:[],createdAt:now,updatedAt:now,archived:false}]};
 }
 case 'noteEdit':{
  const notes=state.notes.map(n=>n.id===action.id?{...n,...(typeof action.title==='string'?{title:action.title.slice(0,160)}:{}),...(action.project===null||state.projects.includes(action.project)?{project:action.project}:{}),...(Array.isArray(action.blocks)?{blocks:action.blocks}:{}),...(typeof action.archived==='boolean'?{archived:action.archived}:{}),updatedAt:now}:n);
  return validNotes(notes)?{...state,notes}:state;
 }
 case 'tick':return state;
 case 'restore':return validCitySave(action.state)?advanceRent(migrate(action.state,now),now):state;
 case 'dismissMigration':return {...state,migrationNotice:false};
 case 'setAtmosphere':return ['day','evening'].includes(action.atmosphere)?{...state,atmosphere:action.atmosphere}:state;
 case 'setFeedback':return ['sound','haptics'].includes(action.key)?{...state,[action.key]:!!action.enabled}:state;
 case 'setCalm':return {...state,calm:!!action.calm};
 case 'place':{
  if(!Object.hasOwn(BUILDINGS,action.kind)||!validId(action.id))return state;
  const existing=state.buildings.find(m=>m.id===action.id);if(existing&&existing.kind!==action.kind)return state;
  const point=snapPlacement(state.placements,action.id,action.point,state.buildings,state.rotations,action.kind);if(!point)return state;
  const price=existing?0:buildingCost(state,action.kind);if(state.cash<price)return state;
  return {...state,cash:state.cash-price,buildings:existing?state.buildings:[...state.buildings,{id:action.id,kind:action.kind}],placements:{...state.placements,[action.id]:point},layoutUndo:undoFor(state)};
 }
 case 'unplace':{if(!state.placements[action.id])return state;const placements={...state.placements};delete placements[action.id];return {...state,placements,layoutUndo:undoFor(state)};}
 case 'rotate':{if(!state.placements[action.id])return state;const rotations={...state.rotations,[action.id]:((state.rotations[action.id]??0)+1)%4};const building=state.buildings.find(b=>b.id===action.id);if(!building||!snapPlacement(state.placements,action.id,state.placements[action.id],state.buildings,rotations,building.kind))return state;return {...state,rotations,layoutUndo:undoFor(state)};}
 case 'undoLayout':return state.layoutUndo?{...state,placements:state.layoutUndo.placements,rotations:state.layoutUndo.rotations,layoutUndo:null}:state;
 case 'projectAdd':{const name=String(action.name).trim().slice(0,40);return !name||state.projects.some(p=>p.toLowerCase()===name.toLowerCase())?state:{...state,projects:[...state.projects,name]};}
 case 'add':{if(action.dueDate!==undefined&&action.dueDate!==''&&!validDate(action.dueDate))return state;if(action.pageId!=null&&!state.notes.some(n=>n.id===action.pageId))return state;if(state.tasks.some(t=>t.id===action.id))return state;const title=String(action.title).trim().slice(0,240);if(!title)return state;return {...state,tasks:[...state.tasks,{id:action.id,title,project:action.project,done:false,steps:[],notes:'',today:action.dueDate?'':dayKey(now),dueDate:action.dueDate??'',pageId:action.pageId??null}]};}
 case 'edit':return {...state,tasks:state.tasks.map(t=>t.id!==action.id?t:{...t,...(typeof action.title==='string'&&action.title.trim()?{title:action.title.trim().slice(0,240)}:{}),...(typeof action.notes==='string'?{notes:action.notes.slice(0,10000)}:{}),...(state.projects.includes(action.project)?{project:action.project}:{}),...((action.dueDate===''||validDate(action.dueDate))?{dueDate:action.dueDate}:{}),...((action.pageId===null||state.notes.some(n=>n.id===action.pageId))?{pageId:action.pageId}:{}),...(action.today!==undefined?{today:action.today?dayKey(now):''}:{})})};
 case 'delete':return {...state,tasks:state.tasks.filter(t=>t.id!==action.id)};
 case 'step':return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:[...t.steps,{id:action.stepId,title:action.title,done:false}]}:t)};
 case 'toggleStep':return {...state,tasks:state.tasks.map(t=>t.id===action.id?{...t,steps:t.steps.map(s=>s.id===action.stepId?{...s,done:!s.done}:s)}:t)};
 case 'complete':return complete(state,action.id);
 case 'start':return state.session||![5,10,25].includes(action.duration)?state:{...state,session:{taskId:action.id,started:now,duration:action.duration}};
 case 'cancel':return {...state,session:null};
 case 'claim':return claim(state,now);
 case 'finishSession':{
  if(!state.session||remaining(state.session,now)>0||!['finished','progress','continue'].includes(action.outcome))return state;
  const session=state.session;state=claim(state,now,action.outcome,action.note,action.nextStep);
  if(action.outcome==='finished')state=complete(state,session.taskId);
  if(action.outcome==='continue')state={...state,session:{...session,started:now}};
  return state;
 }
 default:return state;
 }
}

const positive=n=>Number.isFinite(n)&&n>=0;
const rotations=r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.entries(r).every(([id,n])=>validId(id)&&Number.isInteger(n)&&n>=0&&n<4);
export function validCitySave(s){
 try{return !!(s?.version===2&&positive(s.cash)&&positive(s.earned)&&positive(s.minutes)&&typeof s.calm==='boolean'&&['sound','haptics'].every(k=>s[k]===undefined||typeof s[k]==='boolean')&&(s.atmosphere===undefined||['day','evening'].includes(s.atmosphere))&&(positive(s.rent?.lastTick)||(s.rent?.lastTick===null&&s.buildings?.length===0))&&positive(s.rent?.total)&&
 Array.isArray(s.buildings)&&s.buildings.every(b=>validId(b.id)&&Object.hasOwn(BUILDINGS,b.kind))&&new Set(s.buildings.map(b=>b.id)).size===s.buildings.length&&
 validPlacements(s.placements)&&Object.keys(s.placements).every(id=>s.buildings.some(b=>b.id===id))&&rotations(s.rotations)&&
 (s.layoutUndo==null||(validPlacements(s.layoutUndo.placements)&&Object.keys(s.layoutUndo.placements).every(id=>s.buildings.some(b=>b.id===id))&&rotations(s.layoutUndo.rotations)))&&
 (s.routines===undefined||validRoutines(s.routines))&&(s.commerce===undefined||validCommerce(s.commerce))&&(s.notes===undefined||validNotes(s.notes))&&
 Array.isArray(s.projects)&&s.projects.every(p=>typeof p==='string'&&p.trim()&&p.length<=40)&&
 Array.isArray(s.tasks)&&s.tasks.every(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&typeof t.project==='string'&&typeof t.done==='boolean'&&typeof t.notes==='string'&&typeof t.today==='string'&&(t.dueDate===undefined||t.dueDate===''||validDate(t.dueDate))&&(t.pageId==null||(typeof t.pageId==='string'&&s.notes?.some(n=>n.id===t.pageId)))&&Array.isArray(t.steps)&&t.steps.every(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.done==='boolean'))&&
 Array.isArray(s.history)&&s.history.every(h=>h&&Number.isFinite(h.at)&&typeof h.taskId==='string'&&positive(h.minutes)&&(h.note===undefined||typeof h.note==='string')&&(h.nextStep===undefined||typeof h.nextStep==='string')&&(h.outcome===undefined||['finished','progress','continue'].includes(h.outcome)))&&
 (s.session===null||(typeof s.session?.taskId==='string'&&Number.isFinite(s.session.started)&&[5,10,25].includes(s.session.duration))));}catch{return false}
}
export function validSave(s){try{return s?.version===2?validCitySave(s):!!validLegacySave(s)}catch{return false}}
