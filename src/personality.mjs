const names=['Maya','Leo','Amira','Noah','Iris','Theo','Zoe','Eli','Nora','Kai','Ava','Luca','Ruby','Omar','Ada','Finn','Milo','Esme','Sana','Jude','Lily','Arlo','Cleo','Remy'];
export const FAVORITES={playground:'the playground',library:'the library','flower-shop':'the flower shop','ice-cream':'the ice-cream stand',market:'the corner market',plaza:'the plaza',park:'the park',cafe:'the café',bakery:'the bakery'};
// Stable across reloads, layout changes, storage, and JSON backups without adding save records.
export function residentProfile(homeId,resident){
 let hash=2166136261;for(const c of `${homeId}:${resident}`)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const surnames=['Chen','Rivera','Patel','Brooks','Kim','Reed','Silva','Ali','Park','Lane','Costa','Singh','Bennett','Sato','Wells','Rossi'];
 return {avatar:hash%2?'girl':'boy',name:names[hash%names.length]+' '+surnames[Math.floor(hash/72)%surnames.length],favorite:['park','cafe','bakery'][Math.floor(hash/names.length)%3]};
}
/** @param {import('./outings.mjs').Stop[][]} plans @param {import('./outings.mjs').Stop[]} destinations @param {{favorite:string}} profile @param {number} index */
export function personalOutings(plans,destinations,profile,index){
 const favorites=destinations.filter(s=>s.kind===profile.favorite);if(!favorites.length)return plans;
 const result=[];for(let i=0;i<plans.length;i++){result.push(plans[i]);if(i%2===0)result.push([favorites[index%favorites.length]]);}return result;
}
export function isResidentTap(start,end){return !!start&&start.id===end.id&&Math.hypot(start.x-end.x,start.y-end.y)<=8;}
