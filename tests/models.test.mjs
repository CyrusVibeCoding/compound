import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('city GLBs fit a small mobile budget and character exports retain animation pivots',()=>{
 for(const name of ['house','big-house','park','cafe','bakery','boy','girl']){
  const bytes=readFileSync(new URL(`../public/models/${name}.glb`,import.meta.url));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<250000,name+' asset too large');
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.ok(gltf.meshes.length<=12,name+' draw-call budget');
  if(name==='boy'||name==='girl')for(const joint of ['LeftLeg','RightLeg','LeftArm','RightArm'])assert.ok(gltf.nodes.some(n=>n.name===joint),name+' missing '+joint);
 }
});
