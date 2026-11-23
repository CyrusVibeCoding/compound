import {test} from 'node:test';import assert from 'node:assert/strict';
import {residentProfile,personalOutings,isResidentTap} from '../src/personality.mjs';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';
test('identities and favorites are deterministic across backups, storage and layout changes',()=>{
 const a=residentProfile('house-example',0);assert.deepEqual(residentProfile('house-example',0),a);
 const state=JSON.parse(JSON.stringify({...migrate(INITIAL,0),buildings:[{id:'house-example',kind:'big-house'}]}));assert.deepEqual(residentProfile(state.buildings[0].id,0),a);
 assert.notDeepEqual(residentProfile('house-example',1),a);
 for(let i=0;i<32;i++){const p=residentProfile('home'+i,i%3);assert.ok(p.name.includes(' '));assert.ok(['park','cafe','bakery'].includes(p.favorite));}
});
test('favorites add outings while retaining every ordinary destination, with graceful absence',()=>{
 const destinations=[{kind:'cafe',id:'c'},{kind:'park',id:'p'},{kind:'bakery',id:'b'}],plans=destinations.map(d=>[d]);
 const weighted=personalOutings(plans,destinations,{favorite:'park'},0);
 assert.ok(weighted.flat().filter(s=>s.kind==='park').length>1);assert.deepEqual(new Set(weighted.flat().map(s=>s.id)),new Set(['c','p','b']));
 assert.equal(personalOutings(plans,destinations,{favorite:'missing'},0),plans);
});
test('tap recognition rejects movement and mismatched pointers',()=>{
 const start={id:1,x:10,y:20};assert.ok(isResidentTap(start,{id:1,x:14,y:24}));assert.ok(!isResidentTap(start,{id:1,x:25,y:20}));assert.ok(!isResidentTap(start,{id:2,x:10,y:20}));assert.ok(!isResidentTap(null,start));
});
test('atmosphere is optional for old saves, persists in backups, and never changes income',()=>{
 const s=migrate(INITIAL,0);assert.ok(validSave(s));const evening=reduce(s,{type:'setAtmosphere',atmosphere:'evening',now:0});assert.equal(evening.atmosphere,'evening');assert.equal(evening.cash,s.cash);assert.equal(evening.earned,s.earned);assert.ok(validSave(JSON.parse(JSON.stringify(evening))));
 assert.equal(validSave({...s,atmosphere:'invalid'}),false);assert.deepEqual(reduce(s,{type:'setAtmosphere',atmosphere:'invalid',now:0}),s);assert.equal(reduce(evening,{type:'reset',now:0}).atmosphere,undefined);
});
