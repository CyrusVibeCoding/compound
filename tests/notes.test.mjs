import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
import {matchingNotes} from '../src/notes.mjs';
import {saveLocal,loadLocal} from '../src/storage.mjs';
const seed=()=>migrate(INITIAL,100);
const block={id:'b',type:'check',text:'Read astronomy chapter',checked:false};
test('old city saves load and restore with empty pages without changing tasks or cash',()=>{
 const old={...seed(),tasks:[{id:'t',title:'Study',project:'School',done:false,steps:[],notes:'Keep me',today:''}]};delete old.notes;
 assert.ok(validSave(old));const migrated=migrate(old,100);assert.deepEqual(migrated.notes,[]);assert.deepEqual(migrated.tasks,old.tasks);
 const restored=reduce(seed(),{type:'restore',state:old,now:100});assert.deepEqual(restored.notes,[]);assert.equal(restored.cash,old.cash);
});
test('page editing, project links, checklists and archiving never earn cash or change tasks',()=>{
 let s=reduce(seed(),{type:'noteAdd',id:'a',now:200});s=reduce(s,{type:'noteEdit',id:'a',title:'Class notes',project:'School',blocks:[block],now:300});
 s=reduce(s,{type:'noteEdit',id:'a',blocks:[{...block,checked:true}],archived:true,now:400});
 assert.equal(s.notes[0].blocks[0].checked,true);assert.equal(s.notes[0].createdAt,200);assert.equal(s.notes[0].updatedAt,400);assert.equal(s.cash,40);assert.deepEqual(s.tasks,[]);
 s=reduce(s,{type:'noteEdit',id:'a',archived:false,now:500});assert.equal(s.notes[0].archived,false);
 assert.equal(reduce(s,{type:'noteAdd',id:'a',now:500}).notes.length,1);assert.deepEqual(reduce(s,{type:'reset',now:500}).notes,[]);
});
test('search finds body text, project filters and archive distinguish matching pages',()=>{
 let s=reduce(seed(),{type:'noteAdd',id:'a',now:200});s=reduce(s,{type:'noteEdit',id:'a',title:'Stars',blocks:[block],project:'School',now:300});
 assert.equal(matchingNotes(s.notes,'ASTRONOMY','School').length,1);assert.equal(matchingNotes(s.notes,'astronomy','Personal').length,0);
 s=reduce(s,{type:'noteEdit',id:'a',archived:true,now:400});assert.equal(matchingNotes(s.notes,'').length,0);assert.equal(matchingNotes(s.notes,'stars','',true).length,1);
});
test('pages round-trip through storage and JSON; malformed note imports fail',()=>{
 let s=reduce(seed(),{type:'noteAdd',id:'a',now:200});s=reduce(s,{type:'noteEdit',id:'a',blocks:[block],now:300});
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.ok(saveLocal(storage,s,300).ok);assert.deepEqual(loadLocal(storage).state.notes,s.notes);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 for(const notes of [null,{},[null],[{...s.notes[0],blocks:[{...block,type:'script'}]}],[{...s.notes[0],blocks:[block,block]}],[s.notes[0],s.notes[0]]])assert.equal(validSave({...s,notes}),false);
 const invalid=reduce(s,{type:'noteEdit',id:'a',blocks:[{...block,text:42}],now:300});assert.deepEqual(invalid.notes,s.notes);
});
