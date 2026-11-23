export const TYPES=['core','press','assembler'];
export function validId(id){return typeof id==='string'&&/^[a-z][a-z0-9-]{0,99}$/.test(id)&&!['constructor','prototype','__proto__','settings','unlocks'].includes(id);}
export function machinesFor(state){
 let list=state.machines??[];
 for(const kind of TYPES)if(state.levels?.[kind]>0&&!list.some(m=>m.kind===kind))list=[...list,{id:kind,kind}];
 return list;
}
export function validMachines(list){return Array.isArray(list)&&list.every(m=>m&&validId(m.id)&&TYPES.includes(m.kind)&&(m.level===undefined||(Number.isInteger(m.level)&&m.level>=1&&m.level<=3))&&(!TYPES.includes(m.id)||m.id===m.kind))&&new Set(list.map(m=>m.id)).size===list.length;}
