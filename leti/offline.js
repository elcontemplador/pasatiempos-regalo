const VERSION='22';
export function initOffline(){
 const label=document.getElementById('offline-status'),retry=document.getElementById('offline-retry');
 let registration=null,hasReport=false,retryTimer;
 function unavailable(){if(!hasReport){label.dataset.state='unavailable';label.textContent='No se ha podido preparar el juego sin conexión. Puedes seguir jugando con internet.';retry.hidden=false;}}
 function ask(){navigator.serviceWorker.controller?.postMessage({type:'PREPARE_OFFLINE'});}
 async function register(){
  try{
   registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
   const watch=worker=>{if(worker?.state==='redundant')unavailable();else if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant')unavailable();});};
   watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));
   if(navigator.serviceWorker.controller)ask();
  }catch{unavailable();}
 }
 if(!('serviceWorker'in navigator)){label.textContent='Este navegador necesita conexión para jugar.';label.dataset.state='unavailable';return;}
 navigator.serviceWorker.addEventListener('message',event=>{
  const data=event.data;if(data?.type!=='OFFLINE_STATUS'||data.version!==VERSION||event.source!==navigator.serviceWorker.controller)return;
  hasReport=true;label.dataset.state=data.state;clearTimeout(retryTimer);
  const text={ready:'Todos los juegos y fotos disponibles sin conexión.',pending:data.core?'Sopas y trivial disponibles sin conexión. Preparando las fotos…':'Preparando el juego sin conexión…',partial:'Sopas y trivial disponibles sin conexión. Faltan algunas fotos por descargar.',unavailable:'No se ha podido preparar el juego sin conexión. Puedes seguir jugando con internet.'};
  label.textContent=text[data.state];retry.hidden=!['partial','unavailable'].includes(data.state);
  if(data.state==='partial'&&navigator.onLine)retryTimer=setTimeout(ask,30000);
 });
 navigator.serviceWorker.addEventListener('controllerchange',()=>{hasReport=false;ask();});
 window.addEventListener('online',()=>{if(navigator.serviceWorker.controller)ask();else register();});
 retry.addEventListener('click',async()=>{retry.hidden=true;label.textContent='Comprobando las descargas…';if(registration&&navigator.serviceWorker.controller){try{await registration.update();}catch{}ask();}else await register();});
 register();
}
