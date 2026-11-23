import {machinesFor} from './machines.mjs';
import {placementsFor} from './placement.mjs';
export const BLUEPRINTS={observatory:{name:'Kinetic observatory',stages:['Support frame','Dish & gimbal','Mechanism & activation'],next:['Build support frame','Install rotating dish','Activate observatory']},clock:{name:'Mechanical clock',stages:['Clock frame','Gear train','Hands & activation'],next:['Build clock frame','Install interlocking gears','Start moving hands']}};
export const blueprintId=s=>s.invention?.blueprint??'observatory';
export const blueprint=s=>BLUEPRINTS[blueprintId(s)];
export const stageIndex=work=>work<10?0:work<26?1:2;
export function operation(state,work=state.invention.work){
 const list=machinesFor(state).filter(m=>placementsFor(state)[m.id]),index=stageIndex(work),role=['core','press','assembler'][index],specialists=list.filter(m=>m.kind===role),workers=specialists.length?specialists:list.filter(m=>m.kind==='core');
 const levels=workers.reduce((n,m)=>n+(m.level??state.levels[m.kind]),0),extra=role==='core'||!specialists.length?levels-workers.length:levels;
 return {role,worker:workers[0]?.id,rate:index===0?120+(workers.length-1)*60:specialists.length?120+levels*60:60,yield:1+Math.max(0,extra)*.1,fallback:index>0&&!specialists.length};
}
export function forecast(state,charge=state.factory.charge){
 let work=state.invention.work,spent=0;if(!machinesFor(state).some(m=>m.kind==='core'&&placementsFor(state)[m.id]))return {work,spent};
 for(const end of [10,26,50]){if(work>=end)continue;const op=operation(state,work),cost=(end-work)/op.yield,use=Math.max(0,Math.min(charge-spent,cost));work+=use*op.yield;spent+=use;if(use<cost)break;work=end;}
 return {work,spent};
}
export function chargeToFinish(state){let total=0;for(const end of [10,26,50]){const start=Math.max(state.invention.work,end===10?0:end===26?10:26);if(start<end)total+=(end-start)/operation(state,start).yield}return total;}
