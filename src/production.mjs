import {placementsFor} from './placement.mjs';
const round=n=>Math.round(n*1e6)/1e6;
export function factoryStats(state){
 const placed=placementsFor(state),core=state.levels.core,press=placed.press?state.levels.press:0,assembler=placed.assembler?state.levels.assembler:0;
 return {enabled:!!placed.core,rate:1+press*.5,yield:1+(core-1)*.25,chargeCapacity:core*30+assembler*30,storageCapacity:20+assembler*40,autoCollect:assembler>0};
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
 const before=factoryStats(state),next={...state,levels:{...state.levels,[kind]:level+1},placements:{...placementsFor(state),[kind]:[0,0,0]}},after=factoryStats(next);
 if(kind==='core')return `Charge capacity ${before.chargeCapacity} → ${after.chargeCapacity}. Matter per Charge ${before.yield} → ${after.yield}.`;
 if(kind==='press')return `Charge processing ${before.rate} → ${after.rate} per minute. Produces Matter faster.`;
 return `${level===0?'Automatic collection. ':''}Charge capacity ${before.chargeCapacity} → ${after.chargeCapacity}. Output storage ${before.storageCapacity} → ${after.storageCapacity}.`;
}
export function amount(n){return n.toLocaleString(undefined,{maximumFractionDigits:1});}
