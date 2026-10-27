// Keep existing storage keys. Repair only invalid containers, not valid progress.
const failedKeys=new Set();
export function asRecord(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function storageStatus(key,failed){
 if(failed)failedKeys.add(key);else failedKeys.delete(key);
 const notice=document.getElementById('storage-status');
 if(notice){notice.hidden=failedKeys.size===0;notice.textContent=failedKeys.size?'Este navegador no permite guardar alguna partida. Puedes seguir jugando, pero esos avances no se conservarán al cerrar.':'';}
}
export function readState(key){
 let raw;try{raw=localStorage.getItem(key);}catch{storageStatus(key,true);return {};}
 try{return asRecord(JSON.parse(raw));}catch{return {};}
}
export function saveState(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));storageStatus(key,false);return true;}
 catch{storageStatus(key,true);return false;}
}
