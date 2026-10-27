
import {asRecord,readState,saveState} from './storage.js?v=22';
const snapshot=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
// Compatible with existing keys and WebKit16; no locks or remote storage.
export function createStateSession(key,maps,onExternal){
 let baseline=readState(key),conflict=false;
 const acceptable=v=>maps.every(name=>record(v[name]));
 function sync(){
  const next=readState(key);if(same(next,baseline)||!acceptable(next))return false;
  baseline=snapshot(next);return onExternal(next,true)===true;
 }
 function write(value){
  conflict=false;
  const disk=readState(key),latest=acceptable(disk)?disk:baseline,merged={...latest,...value};
  for(const name of maps){
   const before=asRecord(baseline[name]),local=asRecord(value[name]),fresh=asRecord(latest[name]);
   merged[name]={...fresh};
   for(const id of new Set([...Object.keys(before),...Object.keys(local)])){
    if(same(local[id],before[id]))continue;
    // A stale edit never replaces a newer round (including a new board/seed).
    if(!same(fresh[id],before[id])&&!same(fresh[id],local[id])){
     baseline=snapshot(latest);conflict=true;onExternal(latest,true);return false;
    }
    if(Object.hasOwn(local,id))merged[name][id]=local[id];else delete merged[name][id];
   }
  }
  if(!saveState(key,merged))return false;
  baseline=snapshot(merged);onExternal(merged,false);return true;
 }
 return {sync,write,get conflict(){return conflict;}};
}
