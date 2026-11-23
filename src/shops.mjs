import {BUILDINGS} from './city.mjs';
// Each shop and each resident can make one paid purchase per ten minutes.
export const SALE_INTERVAL=10*60*1000;
export const SALE_AMOUNTS={cafe:4,bakery:3};
export function validCommerce(value){return value&&typeof value==='object'&&!Array.isArray(value)&&['shops','residents'].every(key=>value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key])&&Object.values(value[key]).every(t=>Number.isFinite(t)&&t>=0));}
export function shopPurchase(state,{shopId,homeId,resident,now}){
 const shop=state.buildings.find(b=>b.id===shopId),home=state.buildings.find(b=>b.id===homeId);
 const payment=shop&&Object.hasOwn(SALE_AMOUNTS,shop.kind)?SALE_AMOUNTS[shop.kind]:0;
 if(!payment||!home||!state.placements[shopId]||!state.placements[homeId]||!Number.isInteger(resident)||resident<0||resident>=BUILDINGS[home.kind].residents||!Number.isFinite(now)||now<0)return state;
 const commerce=state.commerce??{shops:{},residents:{}},customer=`${homeId}-${resident}`;
 for(const last of [commerce.shops[shopId],commerce.residents[customer]])if(last!==undefined&&now-last<SALE_INTERVAL)return state;
 return {...state,cash:state.cash+payment,commerce:{shops:{...commerce.shops,[shopId]:now},residents:{...commerce.residents,[customer]:now}}};
}
