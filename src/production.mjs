import {placementsFor} from './placement.mjs';
import {machinesFor} from './machines.mjs';
const round=n=>Math.round(n*1e6)/1e6;
export function factoryStats(state){
 const placed=placementsFor(state),list=machinesFor(state).filter(m=>placed[m.id]),cores=list.filter(m=>m.kind==='core').length,presses=list.filter(m=>m.kind==='press').length,assemblers=list.filter(m=>m.kind==='assembler').length,core=state.levels.core,press=presses*state.levels.press,assembler=assemblers*state.levels.assembler;
 return {enabled:cores>0,rate:Math.max(1,cores)+press*.5,yield:1+(core-1)*.25,chargeCapacity:Math.max(1,cores)*core*30+assembler*30,storageCapacity:20+assembler*40,autoCollect:assemblers>0};
}
export function advance(state,now){
 const f=state.factory,stats=factoryStats(state),at=Math.max(now,f.lastTick),elapsed=(at-f.lastTick)/60000;
 const spent=stats.enabled?Math.min(f.charge,elapsed*stats.rate,stats.autoCollect?Infinity:Math.max(0,stats.storageCapacity-f.stored)/stats.yield):0;
 const generated=spent*stats.yield,bank=f.stored+generated,collect=stats.enabled&&stats.autoCollect?bank:0;
 if(at===f.lastTick&&collect===0)return state;
 return {...state,matter:round(state.matter+collect),earned:round(state.earned+collect),factory:{charge:round(Math.max(0,f.charge-spent)),stored:round(Math.max(0,bank-collect)),lastTick:at}};
}
export function addCharge(state,amount){const cap=factoryStats(state).chargeCapacity;return {...state,factory:{...state.factory,charge:round(state.factory.charge+Math.max(0,Math.min(amount,cap-state.factory.charge)))}};}
export function productionStatus(state){const s=factoryStats(state);if(!s.enabled)return 'Place Core to produce';if(state.factory.charge<=0)return 'Needs Charge';if(!s.autoCollect&&state.factory.stored>=s.storageCapacity-.00001)return 'Storage full';return 'Producing';}
export function upgradeBenefit(state,kind){
 const level=state.levels[kind];if(level>=3)return 'Fully upgraded';
 const before=factoryStats(state),first=machinesFor(state).find(m=>m.kind===kind)?.id??kind,next={...state,levels:{...state.levels,[kind]:level+1},placements:{...placementsFor(state),[first]:placementsFor(state)[first]??[0,0,0]}},after=factoryStats(next);
 if(kind==='core')return `Charge capacity ${before.chargeCapacity} → ${after.chargeCapacity}. Matter per Charge ${before.yield} → ${after.yield}.`;
 if(kind==='press')return `Charge processing ${before.rate} → ${after.rate} per minute. Produces Matter faster.`;
 return `${level===0?'Automatic collection. ':''}Charge capacity ${before.chargeCapacity} → ${after.chargeCapacity}. Output storage ${before.storageCapacity} → ${after.storageCapacity}.`;
}
export function amount(n){return n.toLocaleString(undefined,{maximumFractionDigits:1});}
