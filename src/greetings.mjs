/** @typedef {{x:number,z:number,walking:boolean,socialPlace?:string,readyAt:number,greeting:null|{until:number,angle:number,started:number}}} Neighbor */
export function greetingWorld(){return {time:0,nextCheck:0,actors:new Map()};}
// At most two pairs; proximity is checked four times a second, with per-person cooldowns.
export function stepGreetings(world,delta,{paused=false,reduced=false,hidden=false}={}){
 if(paused||hidden)return;
 world.time+=Math.min(delta,.1);
 if(reduced){for(const actor of world.actors.values())actor.greeting=null;return;}
 let active=0;
 for(const actor of world.actors.values()){
  if(actor.greeting&&actor.greeting.until<=world.time)actor.greeting=null;
  if(actor.greeting)active++;
 }
 if(world.time<world.nextCheck)return;world.nextCheck=world.time+.25;
 const actors=[...world.actors.values()];
 for(let i=0;i<actors.length&&active<4;i++){
  const a=actors[i];if(!a.walking||a.greeting||a.readyAt>world.time)continue;
  for(let j=i+1;j<actors.length;j++){
   const b=actors[j];if(!b.walking||b.greeting||b.readyAt>world.time)continue;
   const d=Math.hypot(a.x-b.x,a.z-b.z);if(d<.25||d>(a.socialPlace&&a.socialPlace===b.socialPlace?1.1:.85))continue;
   a.greeting={started:world.time,until:world.time+2.2,angle:Math.atan2(b.x-a.x,b.z-a.z)};
   b.greeting={...a.greeting,angle:Math.atan2(a.x-b.x,a.z-b.z)};
   a.readyAt=b.readyAt=world.time+25;active+=2;break;
  }
 }
}
