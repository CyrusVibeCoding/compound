import {KINDS,validPlacements} from './placement.mjs';
import {machinesFor,validMachines,validId} from './machines.mjs';
import {FINISHES} from './progression.mjs';
const finitePositive=n=>Number.isFinite(n)&&n>=0;
const rotationValid=r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.entries(r).every(([k,v])=>validId(k)&&Number.isInteger(v)&&v>=0&&v<=3);
export function validLegacySave(s){
 return (s?.schemaRevision===undefined||[2,3].includes(s.schemaRevision))&&(s?.invention===undefined||(!!s.invention&&typeof s.invention==='object'&&!Array.isArray(s.invention)&&(s.invention.hidden===undefined||typeof s.invention.hidden==='boolean')&&typeof s.invention.active==='boolean'&&finitePositive(s.invention.work)&&s.invention.work<=50&&typeof s.invention.project==='string'&&(s.invention.blueprint===undefined||['observatory','clock'].includes(s.invention.blueprint))&&(s.invention.builds===undefined||(s.invention.builds&&typeof s.invention.builds==='object'&&!Array.isArray(s.invention.builds)&&Object.entries(s.invention.builds).every(([id,b])=>['observatory','clock'].includes(id)&&b&&finitePositive(b.work)&&b.work<=50&&typeof b.project==='string')))))&&(s?.look===undefined||FINISHES.some(f=>f.id===s.look))&&(s?.calm===undefined||typeof s.calm==='boolean')&&s?.version===1&&finitePositive(s.matter)&&finitePositive(s.earned)&&finitePositive(s.minutes)&&
 (s.machines===undefined||(validMachines(s.machines)&&s.machines.every(m=>s.levels?.[m.kind]>0)))&&(s.placements===undefined||(validPlacements(s.placements)&&Object.keys(s.placements).every(id=>machinesFor(s).some(m=>m.id===id))))&&(s.rotations===undefined||rotationValid(s.rotations))&&
 (s.factory===undefined||(finitePositive(s.factory?.charge)&&finitePositive(s.factory?.stored)&&Number.isFinite(s.factory?.lastTick)))&&
 (s.projects===undefined||(Array.isArray(s.projects)&&s.projects.every(p=>typeof p==='string'&&p.trim()&&p.length<=40)))&&
 (s.layoutUndo==null||(validPlacements(s.layoutUndo.placements)&&rotationValid(s.layoutUndo.rotations)))&&
 Array.isArray(s.tasks)&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&typeof t.project==='string'&&typeof t.done==='boolean'&&(t.notes===undefined||typeof t.notes==='string')&&(t.today===undefined||typeof t.today==='string')&&Array.isArray(t.steps)&&t.steps.every(x=>typeof x.id==='string'&&typeof x.title==='string'&&typeof x.done==='boolean'))&&
 KINDS.every(k=>Number.isInteger(s.levels?.[k])&&s.levels[k]>=(k==='core'?1:0)&&s.levels[k]<=3)&&Array.isArray(s.history)&&s.history.every(h=>h&&Number.isFinite(h.at)&&typeof h.taskId==='string'&&finitePositive(h.minutes)&&(h.nextStep===undefined||typeof h.nextStep==='string')&&(h.note===undefined||typeof h.note==='string')&&(h.outcome===undefined||['finished','progress','continue'].includes(h.outcome)))&&
 (s.session===null||(typeof s.session?.taskId==='string'&&Number.isFinite(s.session.started)&&[5,10,25].includes(s.session.duration)));
}
