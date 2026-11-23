import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce} from '../src/game.mjs';
import {resetLocal,loadLocal,SAVE_KEY,BACKUP_KEY,LEGACY_KEY,TIME_KEY} from '../src/storage.mjs';
function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
test('reset clears tasks, sessions, machines and invention progress to fresh state',()=>{
 const old={...migrate(INITIAL,0),matter:500,minutes:25,session:{taskId:'math',duration:10,started:0},invention:{active:true,work:50,project:'School'},projects:['Custom'],tasks:[{id:'math',title:'Algebra',notes:'Notes',project:'Custom',done:false,steps:[]}]};
 assert.deepEqual(reduce(old,{type:'reset',now:1234}),migrate(INITIAL,1234));
});
test('reset replaces all recovery paths, keeps unrelated storage, and survives corrupted primary',()=>{
 const store=memory(),old=JSON.stringify({...INITIAL,matter:500}),fresh=migrate(INITIAL,100);
 for(const key of [SAVE_KEY,BACKUP_KEY,LEGACY_KEY])store.setItem(key,old);store.setItem('other-app','keep');
 assert.equal(resetLocal(store,fresh,100).ok,true);assert.deepEqual(loadLocal(store).state,fresh);assert.equal(store.getItem(TIME_KEY),'100');
 store.setItem(SAVE_KEY,'corrupt');assert.deepEqual(loadLocal(store).state,fresh);store.removeItem(BACKUP_KEY);assert.deepEqual(loadLocal(store).state,fresh);assert.equal(store.getItem('other-app'),'keep');
});
test('failed reset restores already written saves and never reports success',()=>{
 const store=memory(),old=JSON.stringify({...INITIAL,matter:500});for(const key of [SAVE_KEY,BACKUP_KEY,LEGACY_KEY])store.setItem(key,old);
 const failing={...store,setItem:(key,value)=>{if(key===LEGACY_KEY)throw Error('quota');store.setItem(key,value)}};
 assert.equal(resetLocal(failing,migrate(INITIAL,0)).ok,false);assert.equal(store.getItem(SAVE_KEY),old);assert.equal(store.getItem(BACKUP_KEY),old);
 assert.equal(resetLocal(store,{bad:true}).ok,false);
});
