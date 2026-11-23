import {test} from 'node:test';import assert from 'node:assert/strict';
import {INITIAL,migrate,reduce,validSave} from '../src/game.mjs';import {SALE_INTERVAL} from '../src/shops.mjs';
const seed=()=>{let s={...migrate(INITIAL,0),cash:1000};for(const [id,kind,point] of [['home','house',[0,0,0]],['coffee','cafe',[3,0,0]],['bread','bakery',[-3,0,0]],['park','park',[0,0,3]]])s=reduce(s,{type:'place',id,kind,point,now:0});return s};
const buy=(s,now=0,shopId='coffee',resident=0)=>reduce(s,{type:'shopSale',shopId,homeId:'home',resident,now});
test('an actual resident and placed shop are required; paid visits never alter work earnings',()=>{
 const s=seed(),paid=buy(s);assert.equal(paid.cash,s.cash+4);assert.equal(paid.earned,s.earned);assert.ok(validSave(paid));
 for(const [shopId,resident] of [['park',0],['home',0],['coffee',1],['bread',-1],['missing',0]])assert.equal(buy(s,0,shopId,resident).cash,s.cash);
 const stored=reduce(s,{type:'unplace',id:'coffee',now:0});assert.equal(buy(stored).cash,stored.cash);
 const noHome=reduce(s,{type:'unplace',id:'home',now:0});assert.equal(buy(noHome).cash,noHome.cash);
});
test('shop and resident cooldowns prevent duplicate, cross-shop, reload and backwards-clock payouts',()=>{
 const s=buy(seed());assert.equal(buy(s).cash,s.cash);assert.equal(buy(s,0,'bread').cash,s.cash);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(buy(restored,SALE_INTERVAL-1).commerce.shops.coffee,0);
 assert.equal(buy(restored,-1).cash,s.cash);const later=buy(restored,SALE_INTERVAL,'bread');assert.equal(later.commerce.shops.bread,SALE_INTERVAL);
 // Remove normal home rent to isolate exactly one $3 bakery sale.
 assert.ok(Math.abs((later.cash-s.cash)-(3+2/6))<1e-8);
});
test('shop cooldown survives storing/replacing and no visit means no shop income offline',()=>{
 let s=buy(seed());s=reduce(s,{type:'unplace',id:'coffee',now:0});s=reduce(s,{type:'place',id:'coffee',kind:'cafe',point:[3,0,0],now:0});assert.equal(buy(s).cash,s.cash);
 const later=reduce(s,{type:'tick',now:3600000});assert.equal(later.cash,s.cash+2);
 assert.equal(validSave({...s,commerce:{shops:{coffee:NaN},residents:{}}}),false);assert.equal(validSave({...s,commerce:{shops:[],residents:{}}}),false);
 const old={...s};delete old.commerce;assert.ok(validSave(old));assert.equal(reduce(s,{type:'reset',now:0}).commerce,undefined);
});
test('one shop cannot pay two residents within the same interval',()=>{
 let s=seed();s=reduce(s,{type:'place',id:'more',kind:'big-house',point:[6,0,0],now:0});s=buy(s);
 const next=reduce(s,{type:'shopSale',shopId:'coffee',homeId:'more',resident:2,now:0});assert.equal(next.cash,s.cash);
});
