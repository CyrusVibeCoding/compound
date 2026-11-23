// Small synthesized cues: no downloads, background loops, or gameplay effects.
export function createFeedback(env=globalThis){
 let context=null,last=-Infinity;
 const hidden=()=>env.document?.hidden;
 function unlock(){try{const Audio=env.AudioContext??env.webkitAudioContext;if(!Audio||hidden())return;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function stop(){try{context?.suspend().catch(()=>{});env.navigator?.vibrate?.(0);}catch{}}
 function play(kind,{sound=false,haptics=false}={}){
  if(hidden()||!['task','place','study'].includes(kind))return false;
  const at=env.performance.now();if(at-last<150)return false;last=at;
  if(haptics)try{env.navigator?.vibrate?.(kind==='task'?[12,40,12]:12);}catch{}
  if(!sound)return false;
  unlock();if(!context||context.state!=='running')return false;
  const notes=kind==='task'?[659,880]:kind==='study'?[523,659,784]:[220,330];
  try{notes.forEach((frequency,i)=>{
   const start=context.currentTime+i*.085,osc=context.createOscillator(),gain=context.createGain();
   osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.055,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.18);
   osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.2);osc.onended=()=>{osc.disconnect();gain.disconnect()};
  });return true;}catch{return false;}
 }
 return {unlock,play,stop};
}
export const feedback=createFeedback();
