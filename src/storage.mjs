import {INITIAL,validSave} from './game.mjs';
export const SAVE_KEY='compound-v2',BACKUP_KEY='compound-v2-backup',LEGACY_KEY='compound-v1',TIME_KEY='compound-v2-saved-at';
function parse(raw){try{const state=JSON.parse(raw);return validSave(state)?state:null}catch{return null}}
export function loadLocal(storage){
 try{for(const [key,source] of [[SAVE_KEY,'saved'],[BACKUP_KEY,'backup'],[LEGACY_KEY,'legacy']]){const raw=storage.getItem(key);if(!raw)continue;const state=parse(raw);if(state)return {state,source,at:Number(storage.getItem(TIME_KEY))||null};}return {state:INITIAL,source:'new',at:null}}catch{return {state:INITIAL,source:'unavailable',at:null}}
}
export function saveLocal(storage,state,at=Date.now()){
 if(!validSave(state))return {ok:false,at:null};
 try{const previous=storage.getItem(SAVE_KEY);if(previous&&parse(previous)){try{storage.setItem(BACKUP_KEY,previous)}catch{}}
  storage.setItem(SAVE_KEY,JSON.stringify(state));try{storage.setItem(TIME_KEY,String(at))}catch{}return {ok:true,at};
 }catch{return {ok:false,at:null}}
}
