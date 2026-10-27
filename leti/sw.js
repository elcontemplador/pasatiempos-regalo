const VERSION='22',CACHE='regalo-leti-vbf0290f336b5';
const CORE=['./state-session.js?v=37','./chess.js?v=36','./chess-engine.js?v=35','./chess-ai-worker.js?v=35','./chess-pieces.js?v=36','./chess.css?v=37','./vendor/chess.js?v=1.4.0','./domino-layout.js?v=33','./domino-drag.js?v=34','./domino.js?v=34','./domino-engine.js?v=31','./domino.css?v=37','./share.js?v=22','./recovery.js?v=28','./','./index.html','./style.css?v=37','./app.js?v=37','./engine.js?v=28','./engine.js','./quiz.js?v=37','./quiz-data.js?v=29','./quiz-engine.js?v=22','./storage.js?v=22','./offline.js?v=22','./icons.js?v=22','./letters.js?v=37','./letters-engine.js?v=22','./letters-data.js?v=22','./icon.svg','./manifest.webmanifest'];
const PHOTOS=["./assets/photos/mirada-camara.jpg","./assets/photos/mirada-camara.thumb.jpg","./assets/photos/arco.jpg","./assets/photos/arco.thumb.jpg","./assets/photos/celebracion.jpg","./assets/photos/celebracion.thumb.jpg","./assets/photos/salamanca.jpg","./assets/photos/salamanca.thumb.jpg","./assets/header.jpg"];
const ASSETS=[...PHOTOS];
CORE.push('./theme.css','./special-games.css','./special-games.js','./special-engine.js','./storage.js');
const absolute=path=>new URL(path,self.location.href).href;
const managed=new Set([...CORE,...ASSETS].map(absolute));
let preparation=null;
async function download(path){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
 try{const response=await fetch(path,{cache:'reload',signal:abort.signal});if(!response.ok)throw new Error('Download incomplete');const body=await response.arrayBuffer();return new Response(body,{status:response.status,headers:response.headers});}
 finally{clearTimeout(timer);}
}
async function status(pending=!!preparation){
 const cache=await caches.open(CACHE);
 const core=(await Promise.all(CORE.map(path=>cache.match(path)))).every(Boolean);
 const images=(await Promise.all(PHOTOS.map(path=>cache.match(path)))).filter(Boolean).length;
 return {type:'OFFLINE_STATUS',version:VERSION,state:!core?'unavailable':images===PHOTOS.length?'ready':pending?'pending':'partial',core,images,total:PHOTOS.length};
}
async function broadcast(pending){
 const message=await status(pending);
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 clients.filter(client=>new URL(client.url).pathname.startsWith(new URL('./',self.location.href).pathname)).forEach(client=>client.postMessage(message));
}
function prepareAssets(){
 if(preparation)return preparation;
 preparation=(async()=>{
  const cache=await caches.open(CACHE);await broadcast(true);
  await Promise.all(CORE.map(async path=>{try{if(!(await cache.match(path)))await cache.put(path,await download(path));}catch{/* Retry a missing essential file on the next attempt. */}}));
  await Promise.all(ASSETS.map(async path=>{
   try{if(await cache.match(path))return;await cache.put(path,await download(path));}catch{/* Keep the shell and other photos usable; retry later. */}
  }));
  await broadcast(false);
 })().catch(()=>broadcast(false)).finally(()=>{preparation=null;});
 return preparation;
}
self.addEventListener('install',event=>{
 // Photos never block installation. A failed core leaves the previous worker active.
 event.waitUntil((async()=>{const responses=await Promise.all(CORE.map(download));const cache=await caches.open(CACHE);await Promise.all(CORE.map((path,i)=>cache.put(path,responses[i])));await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
 // Retain earlier caches for pages that are still open with older module URLs.
 event.waitUntil(self.clients.claim());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='PREPARE_OFFLINE')event.waitUntil(prepareAssets());
 if(event.data?.type==='OFFLINE_STATUS')event.waitUntil(status().then(value=>event.source?.postMessage(value)));
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  let current;try{current=await caches.open(CACHE);}catch{try{return await fetch(request);}catch{return Response.error();}}
  if(request.mode==='navigate'){
   try{const response=await fetch(request);if(response.ok)return response;}catch{}
   return (await current.match('./index.html'))||Response.error();
  }
  // Exact URL match, current generation first; legacy assets are only a fallback.
  let cached;try{cached=await current.match(request);}catch{}if(cached)return cached;
  try{const response=await fetch(request);if(response.ok&&managed.has(request.url)){try{await current.put(request,response.clone());}catch{/* A cache quota error must not break a successful online response. */}}return response;}catch{return Response.error();}
 })());
});
