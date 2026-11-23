export const FINISHES=[{id:'porcelain',name:'Porcelain',description:'Soft white ceramic.',milestone:null},{id:'graphite',name:'Graphite',description:'Dark satin machinery. White world.',milestone:'three-tasks'},{id:'silver',name:'Brushed silver',description:'Polished gray metal.',milestone:'focus-25'}];
export function milestones(state){
 const done=state.tasks.filter(t=>t.done).length,built=Object.values(state.levels).filter(n=>n>0).length;
 return [{id:'first-task',name:'First real step',detail:'Finish 1 task',value:done,target:1,reward:'First work badge'},
 {id:'three-tasks',name:'Make it a rhythm',detail:'Finish 3 tasks',value:done,target:3,reward:'Graphite finish'},
 {id:'focus-25',name:'Room to focus',detail:'Complete 25 focus minutes',value:state.minutes,target:25,reward:'Brushed silver finish'},
 {id:'full-farm',name:'A little factory',detail:'Own all 3 machine types',value:built,target:3,reward:'Factory badge'},
 {id:'matter-250',name:'Effort compounds',detail:'Earn 250 Matter in total',value:state.earned,target:250,reward:'Compound badge'}].map(m=>({...m,progress:Math.min(1,Math.max(0,m.value/m.target)),achieved:m.value>=m.target}));
}
export function finishUnlocked(state,id){const f=FINISHES.find(f=>f.id===id);return !!f&&(f.milestone===null||milestones(state).some(m=>m.id===f.milestone&&m.achieved));}
export function effectiveFinish(state){return finishUnlocked(state,state.look)?state.look:'porcelain';}
