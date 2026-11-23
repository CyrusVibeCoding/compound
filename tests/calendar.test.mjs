import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {validDate,localDate,dateKey,monthDays,shiftMonth,todayTasks,overdueTasks} from '../src/dates.mjs';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
const now=new Date(2026,10,23,12).getTime(),seed=()=>migrate(INITIAL,now);
test('date-only validation rejects rollovers and handles leap years',()=>{
 for(const value of ['2024-02-29','2000-02-29','2026-11-23','1000-01-01','9999-12-31'])assert.ok(validDate(value));
 for(const value of ['2026-02-29','1900-02-29','2026-04-31','2026-13-01','2026-1-01','0999-12-31','',null,12])assert.equal(validDate(value),false);
 assert.equal(dateKey(localDate('2026-11-23')),'2026-11-23');
});
test('calendar rows start Monday and cross year and leap-day boundaries',()=>{
 const days=monthDays('2024-02-01');assert.equal(days.length,42);assert.equal(days[0],'2024-01-29');assert.ok(days.includes('2024-02-29'));assert.equal(new Set(days).size,42);
 assert.equal(shiftMonth('2026-12-31',1),'2027-01-01');assert.equal(shiftMonth('2026-01-31',-1),'2025-12-01');
});
test('date-only operations stay on the same day across timezones and DST',()=>{
 const code="import {localDate,dateKey,monthDays} from './src/dates.mjs';for(const d of ['2026-03-08','2026-11-01','2026-01-01']){if(dateKey(localDate(d))!==d)throw Error(d)}if(!monthDays('2026-03-01').includes('2026-03-08'))throw Error('DST')";
 for(const TZ of ['America/Los_Angeles','Pacific/Auckland','Asia/Tokyo'])execFileSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ}});
});
test('due today and manual Today form one list; overdue and completed stay separate',()=>{
 const tasks=[{id:'a',today:'2026-11-23',dueDate:'2026-11-23'},{id:'b',today:'',dueDate:'2026-11-23'},{id:'c',today:'',dueDate:'2026-11-22'},{id:'d',today:'2026-11-23',dueDate:'2026-11-22',done:true},{id:'e',today:'2026-11-23',dueDate:'2026-11-30'}];
 assert.deepEqual(todayTasks(tasks,'2026-11-23').map(t=>t.id),['a','b','e']);assert.deepEqual(overdueTasks(tasks,'2026-11-23').map(t=>t.id),['c']);
});
test('schedule, reschedule, clear and link tasks without minting cash; completion pays once',()=>{
 let s=reduce(seed(),{type:'noteAdd',id:'page',now});s=reduce(s,{type:'add',id:'t',title:'Read',project:'School',dueDate:'2026-12-04',pageId:'page',now});
 assert.equal(s.tasks[0].today,'');assert.equal(s.cash,40);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 s=reduce(s,{type:'edit',id:'t',dueDate:'2026-11-23',today:true,now});assert.equal(todayTasks(s.tasks,'2026-11-23').length,1);
 s=reduce(s,{type:'edit',id:'t',dueDate:'',pageId:null,now});assert.equal(s.tasks[0].dueDate,'');assert.equal(s.tasks[0].pageId,null);assert.equal(s.tasks[0].today,'2026-11-23');
 s=reduce(s,{type:'complete',id:'t',now});s=reduce(s,{type:'complete',id:'t',now});assert.equal(s.cash,60);
});
test('bad dates and missing page links cannot enter state or imported backups',()=>{
 let s=reduce(seed(),{type:'add',id:'t',title:'Read',project:'School',now});
 assert.equal(reduce(s,{type:'add',id:'bad',title:'Bad',dueDate:'2026-02-31',now}).tasks.length,1);
 assert.equal(reduce(s,{type:'add',id:'bad',title:'Bad',pageId:'missing',now}).tasks.length,1);
 assert.equal(reduce(s,{type:'add',id:'t',title:'Duplicate',now}).tasks.length,1);
 s=reduce(s,{type:'edit',id:'t',dueDate:'2026-02-31',pageId:'missing',now});assert.equal(s.tasks[0].dueDate,'');assert.equal(s.tasks[0].pageId,null);
 for(const patch of [{dueDate:'tomorrow'},{dueDate:'2026-02-31'},{pageId:'missing'}])assert.equal(validSave({...s,tasks:[{...s.tasks[0],...patch}]}),false);
 const old={...s,tasks:s.tasks.map(({dueDate,pageId,...task})=>task)};assert.ok(validSave(old));
});
