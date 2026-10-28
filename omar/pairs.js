import {readState,saveState} from './storage.js';
const levels=[4,6,8,12];
export function mountPairs(root,photos){
 const key='regalo-omar-parejas-v1',previousKey='regalo-omar-parejas-previous-v1',usable=photos.filter(p=>p.id&&p.thumb&&p.title),byId=new Map(usable.map(p=>[p.id,p]));
 if(usable.length<2){root.textContent='Añade al menos dos fotos para jugar.';return;}
 const sizes=levels.filter(n=>n<=usable.length);if(!sizes.length)sizes.push(usable.length);
 const valid=s=>s&&sizes.includes(s.size)&&Array.isArray(s.cards)&&s.cards.length===s.size*2&&s.cards.every(id=>byId.has(id))&&new Set(s.cards).size===s.size&&[...new Set(s.cards)].every(id=>s.cards.filter(x=>x===id).length===2)&&Array.isArray(s.matched)&&new Set(s.matched).size===s.matched.length&&s.matched.every(id=>s.cards.includes(id))&&Number.isSafeInteger(s.attempts)&&s.attempts>=0;
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a};
 function make(size){const chosen=shuffle(usable).slice(0,size).map(p=>p.id);return {size,cards:shuffle([...chosen,...chosen]),matched:[],attempts:0};}
 let state=readState(key),baseline=JSON.stringify(state);if(!valid(state))state=make(sizes[0]);
 let previous=readState(previousKey),previousBaseline=JSON.stringify(previous);if(!valid(previous))previous=null;
 let flipped=[],locked=false,timer=null;
 const completedMessage=()=>`¡Enhorabuena! Habéis encontrado todas las parejas en ${state.attempts} intentos.`;
 let message=state.matched.length===state.size?completedMessage():'Busca dos fotos iguales.';
 const status=document.createElement('p');status.className='pairs-status';status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');root.append(status);
 function clearTransient(){clearTimeout(timer);timer=null;flipped=[];locked=false;}
 function sync(){
  const latest=readState(key),serialized=JSON.stringify(latest),old=readState(previousKey),oldSerialized=JSON.stringify(old);
  let changed=false;
  if(oldSerialized!==previousBaseline&&valid(old)){previous=old;previousBaseline=oldSerialized;changed=true;}
  if(serialized!==baseline&&valid(latest)){
   clearTransient();state=latest;baseline=serialized;
   message='Partida actualizada desde otra pestaña.'+(state.matched.length===state.size?' '+completedMessage():'');
   render();return true;
  }
  if(changed)render();
  return false;
 }
 function persist(){
  // Recheck at the write boundary: storage/focus events can be delayed or missed.
  if(sync())return false;
  const ok=saveState(key,state);if(ok)baseline=JSON.stringify(state);return ok;
 }
 function savePrevious(){if(saveState(previousKey,previous))previousBaseline=JSON.stringify(previous);}
 function render(){
  const focused=root.contains(document.activeElement)?document.activeElement:null,focusIndex=focused?.dataset.index,focusAction=focused?.dataset.action,focusStatus=focused?.classList.contains('pairs-status');
  const title=document.createElement('div');title.className='pairs-heading';title.innerHTML='<p class="pairs-kicker">UN JUEGO PARA COMPARTIR</p><h2 id="parejas-title">Parejas de fotos</h2><p>Descubre dos fotos iguales. Podéis jugar juntos y sin prisa.</p>';
  const toolbar=document.createElement('div');toolbar.className='pairs-toolbar';if(sizes.length>1){const label=document.createElement('label');label.textContent='Número de parejas ';const select=document.createElement('select');select.dataset.action='size';for(const n of sizes){const opt=document.createElement('option');opt.value=n;opt.textContent=n+' parejas';opt.selected=n===state.size;select.append(opt);}label.append(select);toolbar.append(label);}const restart=document.createElement('button');restart.type='button';restart.dataset.action='new';restart.textContent='Nueva partida';const recover=document.createElement('button');recover.type='button';recover.dataset.action='recover';recover.textContent='Recuperar anterior';recover.disabled=!previous;toolbar.append(restart,recover);
  const progress=document.createElement('p');progress.className='pairs-progress';progress.textContent=`Parejas encontradas: ${state.matched.length} de ${state.size} · Intentos: ${state.attempts}`;
  const grid=document.createElement('div');grid.className='pairs-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Cartas para encontrar las parejas');
  state.cards.forEach((id,i)=>{const photo=byId.get(id),matched=state.matched.includes(id),face=matched||flipped.includes(i),button=document.createElement('button');button.type='button';button.className='pairs-card'+(face?' is-visible':'')+(matched?' is-matched':'');button.dataset.index=i;button.disabled=matched||locked||flipped.includes(i);button.setAttribute('aria-label',`Carta ${i+1}: ${face?photo.title+(matched?', pareja encontrada':''):'boca abajo'}`);if(face){const img=document.createElement('img');img.src=photo.thumb;img.alt='';img.draggable=false;button.append(img);const caption=document.createElement('span');caption.className='pairs-caption';caption.textContent=photo.title;button.append(caption)}else{const back=document.createElement('span');back.className='pairs-back';back.setAttribute('aria-hidden','true');back.textContent='✦';button.append(back)}grid.append(button)});
  // Keep the live region connected so assistive technology receives each turn.
  for(const child of [...root.children])if(child!==status)child.remove();
  root.prepend(title,toolbar,progress,grid);status.textContent=message;
  if(focusIndex!==undefined)(root.querySelector(`[data-index="${focusIndex}"]:enabled`)||root.querySelector('.pairs-card:enabled')||status).focus({preventScroll:true});
  else if(focusAction)(root.querySelector(`[data-action="${focusAction}"]:enabled`)||restart).focus({preventScroll:true});
  else if(focusStatus)(root.querySelector('.pairs-card:enabled')||status).focus({preventScroll:true});
 }
 function reset(size){
  if(!sizes.includes(size)||sync())return;
  clearTransient();previous=state;savePrevious();state=make(size);message='Busca dos fotos iguales.';persist();render();
 }
 root.addEventListener('click',event=>{
  const btn=event.target.closest('button');if(!btn||!root.contains(btn)||btn.disabled)return;
  if(sync())return;
  if(btn.dataset.action==='new'){reset(state.size);return;}
  if(btn.dataset.action==='recover'){
   if(!valid(previous))return;clearTransient();const swap=state;state=previous;previous=swap;savePrevious();message='Partida anterior recuperada.'+(state.matched.length===state.size?' '+completedMessage():'');persist();render();return;
  }
  if(btn.dataset.index===undefined||locked)return;
  const i=Number(btn.dataset.index);if(flipped.includes(i)||state.matched.includes(state.cards[i]))return;
  flipped.push(i);
  if(flipped.length===2){
   state.attempts++;const [a,b]=flipped;
   if(state.cards[a]===state.cards[b]){
    state.matched.push(state.cards[a]);flipped=[];message=state.matched.length===state.size?completedMessage():`¡Pareja encontrada: ${byId.get(state.cards[a]).title}!`;persist();render();return;
   }
   locked=true;message=`«${byId.get(state.cards[a]).title}» y «${byId.get(state.cards[b]).title}»: son diferentes. Mira bien y vuelve a intentarlo.`;persist();render();
   timer=setTimeout(()=>{if(sync())return;clearTransient();message='Prueba con otras dos cartas.';render();},1200);return;
  }
  message=`Has descubierto «${byId.get(state.cards[i]).title}». Elige otra carta.`;render();
 });
 root.addEventListener('change',event=>{if(event.target.dataset.action==='size')reset(Number(event.target.value));});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===previousKey)sync();});
 window.addEventListener('focus',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 persist();render();
}
