import {placementsFor} from './placement.mjs';
import {machinesFor} from './machines.mjs';
const round=n=>Math.round(n*1e6)/1e6;
export function factoryStats(state){
 const placed=placementsFor(state),list=machinesFor(state).filter(m=>placed[m.id]),cores=list.filter(m=>m.kind==='core'),presses=list.filter(m=>m.kind==='press'),assemblers=list.filter(m=>m.kind==='assembler');
 const level=m=>m.level??state.levels[m.kind],sum=ms=>ms.reduce((n,m)=>n+level(m),0),core=sum(cores),press=sum(presses),assembler=sum(assemblers);
 return {enabled:cores.length>0,rate:Math.max(1,cores.length)+press*.5,yield:cores.length?1+(core/cores.length-1)*.25:1,chargeCapacity:Math.max(1,core)*30+assembler*30,storageCapacity:20+assembler*40,autoCollect:assemblers.length>0,buildRate:120+press*60+assembler*60,buildYield:1+(Math.max(0,core-cores.length)+press+assembler)*.1};
}
export function advance(state,now){
 const f=state.factory,stats=factoryStats(state),at=Math.max(now,f.lastTick),elapsed=(at-f.lastTick)/60000;
 if(state.invention?.active){
  const needed=(50-state.invention.work)/stats.buildYield,spent=stats.enabled?Math.min(f.charge,elapsed*stats.buildRate,needed):0;
  return {...state,invention:{...state.invention,work:round(Math.min(50,state.invention.work+spent*stats.buildYield))},factory:{...f,charge:round(Math.max(0,f.charge-spent)),lastTick:at}};
 }
 const spent=stats.enabled?Math.min(f.charge,elapsed*stats.rate,stats.autoCollect?Infinity:Math.max(0,stats.storageCapacity-f.stored)/stats.yield):0;
 const generated=spent*stats.yield,bank=f.stored+generated,collect=stats.enabled&&stats.autoCollect?bank:0;
 if(at===f.lastTick&&collect===0)return state;
 return {...state,matter:round(state.matter+collect),earned:round(state.earned+collect),factory:{charge:round(Math.max(0,f.charge-spent)),stored:round(Math.max(0,bank-collect)),lastTick:at}};
}
export function addCharge(state,amount){const cap=factoryStats(state).chargeCapacity;return {...state,factory:{...state.factory,charge:round(state.factory.charge+Math.max(0,Math.min(amount,cap-state.factory.charge)))}};}
export function productionStatus(state){const s=factoryStats(state);if(!s.enabled)return 'Place Core to produce';if(state.invention?.active&&state.invention.work>=50)return 'Observatory complete';if(state.factory.charge<=0)return 'Needs Charge';if(!state.invention?.active&&!s.autoCollect&&state.factory.stored>=s.storageCapacity-.00001)return 'Storage full';return state.invention?.active?'Building':'Producing';}
export function upgradeBenefit(state,id){
 const machine=machinesFor(state).find(m=>m.id===id);if(!machine)return 'Select a machine';const level=machine.level??state.levels[machine.kind];if(level>=3)return 'Fully upgraded';
 const before=factoryStats(state),next={...state,machines:machinesFor(state).map(m=>m.id===id?{...m,level:level+1}:m)},after=factoryStats(next);
 if(!state.placements[id])return 'Place this machine to activate its upgrade. Compare active factory benefits after placement.';
 if(state.invention?.active&&state.invention.work<50){const left=50-state.invention.work;return `Build speed ${amount(before.buildRate*before.buildYield)} → ${amount(after.buildRate*after.buildYield)} parts/min. Charge to finish ${amount(left/before.buildYield)} → ${amount(left/after.buildYield)}. Current Charge makes ${amount(Math.min(left,state.factory.charge*before.buildYield))} → ${amount(Math.min(left,state.factory.charge*after.buildYield))} parts.`;}
 return `Charge capacity ${before.chargeCapacity} → ${after.chargeCapacity}. Production ${amount(before.rate*before.yield)} → ${amount(after.rate*after.yield)} Matter/min. Construction ${amount(before.buildRate*before.buildYield)} → ${amount(after.buildRate*after.buildYield)} parts/min.`;
}
export function amount(n){return n.toLocaleString(undefined,{maximumFractionDigits:1});}
