import {test} from 'node:test';import assert from 'node:assert/strict';
import {createFeedback} from '../src/feedback.mjs';import {INITIAL,reduce,validSave} from '../src/game.mjs';
test('feedback preferences survive saves and old saves remain compatible',()=>{
 const base=reduce(INITIAL,{type:'tick',now:1000}),next=reduce(base,{type:'setFeedback',key:'sound',enabled:true,now:1000});
 assert.equal(next.sound,true);assert.equal(next.cash,base.cash);assert.ok(validSave(JSON.parse(JSON.stringify(next))));
 const old={...base};delete old.sound;delete old.haptics;assert.ok(validSave(old));assert.equal(validSave({...base,sound:'yes'}),false);
 assert.equal(reduce(next,{type:'reset',now:1000}).sound,false);
});
test('audio and vibration respect switches, visibility, unsupported APIs and rapid duplicates',()=>{
 let time=0,created=0,tones=0;const vibrations=[];
 class Audio{state='running';currentTime=0;destination={};constructor(){created++}resume(){return Promise.resolve()}suspend(){return Promise.resolve()}createOscillator(){tones++;return {frequency:{},connect(){},start(){},stop(){},disconnect(){}}}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}}
 const env={AudioContext:Audio,performance:{now:()=>time},document:{hidden:false},navigator:{vibrate:v=>vibrations.push(v)}};const f=createFeedback(env);
 assert.equal(f.play('task'),false);assert.equal(created,0);
 time+=200;assert.equal(f.play('task',{sound:true,haptics:true}),true);assert.equal(tones,2);assert.equal(vibrations.length,1);
 f.play('task',{sound:true});assert.equal(tones,2);
 time+=200;env.document.hidden=true;f.play('study',{sound:true,haptics:true});assert.equal(tones,2);assert.equal(vibrations.length,1);
 env.document.hidden=false;time+=200;f.play('study',{sound:true});assert.equal(tones,5);
 assert.doesNotThrow(()=>createFeedback({performance:{now:()=>0}}).play('task',{sound:true,haptics:true}));
});
