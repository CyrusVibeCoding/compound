import {INITIAL,validSave} from './game.mjs';
export const SAVE_KEY='compound-city-v1',BACKUP_KEY='compound-city-v1-backup',LEGACY_KEY='compound-v1',TIME_KEY='compound-city-v1-saved-at';
function parse(raw){try{const state=JSON.parse(raw);return validSave(state)?state:null}catch{return null}}
export function loadLocal(storage){
 try{for(const [key,source] of [[SAVE_KEY,'saved'],[BACKUP_KEY,'backup'],['compound-v2','legacy'],['compound-v2-backup','legacy'],[LEGACY_KEY,'legacy']]){const raw=storage.getItem(key);if(!raw)continue;const state=parse(raw);if(state)return {state,source,at:Number(storage.getItem(TIME_KEY))||null};}return {state:INITIAL,source:'new',at:null}}catch{return {state:INITIAL,source:'unavailable',at:null}}
}
export function saveLocal(storage,state,at=Date.now()){
 if(!validSave(state))return {ok:false,at:null};
 try{const previous=storage.getItem(SAVE_KEY);if(previous&&parse(previous)){try{storage.setItem(BACKUP_KEY,previous)}catch{}}
  storage.setItem(SAVE_KEY,JSON.stringify(state));try{storage.setItem(TIME_KEY,String(at))}catch{}return {ok:true,at};
 }catch{return {ok:false,at:null}}
}

// Replace recovery copies too, so old progress cannot return after a reset.
export function resetLocal(storage,state,at=Date.now()){
 if(!validSave(state))return {ok:false,at:null};
 const keys=[SAVE_KEY,BACKUP_KEY,'compound-v2','compound-v2-backup',LEGACY_KEY,TIME_KEY],previous=new Map(),written=[];
 try{
  for(const key of keys)previous.set(key,storage.getItem(key));
  const raw=JSON.stringify(state);
  for(const key of keys){storage.setItem(key,key===TIME_KEY?String(at):raw);written.push(key)}
  return {ok:true,at};
 }catch{
  for(const key of written.reverse()){try{const value=previous.get(key);if(value===null)storage.removeItem(key);else storage.setItem(key,value)}catch{}}
  return {ok:false,at:null};
 }
}
