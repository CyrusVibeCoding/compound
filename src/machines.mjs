export const TYPES=['core','press','assembler'];
export function validId(id){return typeof id==='string'&&/^[a-z][a-z0-9-]{0,99}$/.test(id)&&!['constructor','prototype','__proto__','settings','unlocks'].includes(id);}
export function machinesFor(state){
 let list=state.machines??[];
 for(const kind of TYPES)if(state.levels?.[kind]>0&&!list.some(m=>m.kind===kind))list=[...list,{id:kind,kind}];
 return list;
}
export function placedMachines(state){return machinesFor(state).filter(m=>state.placements?.[m.id]);}
export function newMachineCost(state,kind){if(!TYPES.includes(kind))return null;const count=machinesFor(state).filter(m=>m.kind===kind).length;return Math.ceil(({core:40,press:60,assembler:120})[kind]*1.35**Math.max(0,count-(kind==='core'?1:0)));}
export function availableMachine(state,kind){return machinesFor(state).find(m=>m.kind===kind&&!state.placements?.[m.id])??null;}
export function validMachines(list){return Array.isArray(list)&&list.every(m=>m&&validId(m.id)&&TYPES.includes(m.kind)&&(m.level===undefined||(Number.isInteger(m.level)&&m.level>=1&&m.level<=3))&&(!TYPES.includes(m.id)||m.id===m.kind))&&new Set(list.map(m=>m.id)).size===list.length;}
