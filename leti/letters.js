import {createStateSession} from './state-session.js?v=37';
import {letterWords} from './letters-data.js?v=22';
import {lettersOf,makeLettersRound,validLettersRound,placeLetter,removeLetter,giveLetter,revealWord} from './letters-engine.js?v=22';
import {readState,saveState} from './storage.js?v=22';
const KEY='regalo-leti-letters-v1';
export function initLetters(){
 const $=id=>document.getElementById(id),saved=readState(KEY);let rounds={},seen={},ready=false;let level=saved.level==='reto'?'reto':'calma';
 const bank=l=>letterWords.filter(w=>w.level===l);
 for(const l of ['calma','reto']){const words=bank(l);if(validLettersRound(saved.rounds?.[l],words))rounds[l]=saved.rounds[l];seen[l]=Array.isArray(saved.seen?.[l])?[...new Set(saved.seen[l].filter(id=>words.some(w=>w.id===id)))]:[];}
 const session=createStateSession(KEY,['rounds','seen'],adopt);
 function adopt(value,external){
  const before=JSON.stringify(rounds[level]);
  for(const l of ['calma','reto']){
   const words=bank(l);if(validLettersRound(value.rounds?.[l],words))rounds[l]=value.rounds[l];
   if(Array.isArray(value.seen?.[l]))seen[l]=[...new Set(value.seen[l].filter(id=>words.some(w=>w.id===id)))];
  }
  const changed=before!==JSON.stringify(rounds[level]);
  if(ready&&changed){render();if(external)feedback('La palabra se ha actualizado desde otra pestaña. Puedes continuar aquí.');}
  return changed;
 }
 function sync(){return session.sync();}
 function save(){return session.write({level,rounds,seen});}
 window.addEventListener('storage',e=>{if(e.key===KEY)sync();});
 window.addEventListener('focus',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 function start(){const next=makeLettersRound(bank(level),seen[level],Math.random,rounds[level]?.cards.map(c=>c.id)||[]);rounds[level]=next.round;seen[level]=next.seen;save();}
 function ensure(){if(!rounds[level])start();}
 const current=()=>rounds[level].cards[rounds[level].index];
 const entry=()=>letterWords.find(w=>w.id===current()?.id);
 function feedback(message){$('letters-feedback').textContent=message;}
 function focusPlay(){const target=current()?.status==='playing'?$('letters-pool').querySelector('button:not(:disabled)')||$('letters-slots').querySelector('button:not(:disabled)'):$('letters-next');target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',inline:'nearest'});}
 function afterChange(message){save();render();if(current().status==='playing')feedback(message);focusPlay();}
 function render(){
  const round=rounds[level],done=round.index===5;
  document.querySelectorAll('[name="letter-level"]').forEach(r=>r.checked=r.value===level);
  $('letters-level-note').textContent=level==='calma'?'De 6 a 8 letras, con una definición para empezar.':'De 9 a 13 letras. La definición aparece si pides una pista.';
  $('letters-play').hidden=done;$('letters-result').hidden=!done;
  $('letters-progress').textContent=done?'Ronda terminada':`Palabra ${round.index+1} de 5`;
  $('letters-meter').value=round.cards.filter(c=>c.status!=='playing').length;feedback('');
  if(done){
   const count=round.cards.filter(c=>c.status==='solved').length;
   $('letters-result-title').textContent=count===5?'¡Las cinco, Leti!':`${count} de 5 palabras resueltas`;
   $('letters-review').replaceChildren();
   round.cards.forEach(c=>{const w=letterWords.find(w=>w.id===c.id),li=document.createElement('li'),name=document.createElement('strong'),detail=document.createElement('span');name.textContent=w.word;detail.textContent=c.status==='revealed'?'Solución consultada':c.given.length||level==='reto'&&c.clue?'Resuelta con ayuda':'Resuelta';li.append(name,detail);$('letters-review').append(li);});return;
  }
  const c=current(),w=entry(),text=lettersOf(w.word),finished=c.status!=='playing';
  $('letters-category').textContent=w.category;$('letters-length').textContent=`${text.length} letras`;
  $('letters-clue').textContent=w.clue;$('letters-clue').hidden=!(c.clue||finished);
  $('letters-clue-invitation').hidden=c.clue||finished;
  $('letters-slots').replaceChildren();
  c.slots.forEach((token,i)=>{const b=document.createElement('button');b.className='letter-slot'+(token===null?' empty':'')+(c.given.includes(i)?' given':'');b.dataset.slot=i;
   const position=document.createElement('small'),letter=document.createElement('span');position.textContent=i+1;position.setAttribute('aria-hidden','true');letter.textContent=token===null?'·':text[token];b.append(position,letter);
   b.disabled=finished||token===null||c.given.includes(i);b.setAttribute('aria-label',`Posición ${i+1}: ${token===null?'vacía':text[token]+(c.given.includes(i)?', letra de ayuda':'. Toca para devolverla')}`);
   b.addEventListener('click',()=>{if(sync())return;if(removeLetter(current(),i))afterChange('Letra devuelta. Puedes colocar otra.');});$('letters-slots').append(b);
  });
  $('letters-pool').replaceChildren();
  c.order.forEach((token,i)=>{const b=document.createElement('button');b.className='loose-letter';b.dataset.token=token;b.textContent=text[token];b.disabled=finished||c.slots.includes(token);b.setAttribute('aria-label',`Letra ${text[token]}, ficha ${i+1}`);b.addEventListener('click',()=>{if(sync())return;const fresh=current();if(placeLetter(fresh,token,entry()))afterChange(fresh.slots.includes(null)?'Letra colocada.':'Todavía no es la palabra que buscamos. Toca una letra colocada para cambiarla.');});$('letters-pool').append(b);});
  $('letters-pool').hidden=finished;$('letters-actions').hidden=finished;$('letters-next').hidden=!finished;
  $('letters-next').textContent=round.index===4?'Ver la ronda':'Siguiente palabra';
  $('letters-hint').textContent=c.clue?'Colocar una letra':'Dame una pista';
  $('letters-clear').disabled=!c.slots.some((t,i)=>t!==null&&!c.given.includes(i));
  $('letters-slots').classList.toggle('complete',finished);
  if(finished)feedback(c.status==='solved'?`¡${w.word}! ${c.given.length?'Resuelta con ayuda.':'Bien encontrada.'}`:`La palabra era ${w.word}. Vamos a por otra cuando quieras.`);
 }
 document.querySelectorAll('[name="letter-level"]').forEach(r=>r.addEventListener('change',()=>{sync();level=r.value;ensure();render();save();}));
 $('letters-clear').addEventListener('click',()=>{if(sync())return;const c=current();c.slots=c.slots.map((v,i)=>c.given.includes(i)?v:null);afterChange('Puedes probar otro orden.');});
 $('letters-hint').addEventListener('click',()=>{if(sync())return;const c=current();if(!c.clue){c.clue=true;save();render();feedback(entry().clue);$('letters-hint').focus({preventScroll:true});}else{giveLetter(c,entry());afterChange('Hemos colocado una letra. Sigue con las demás.');}});
 $('letters-reveal').addEventListener('click',()=>{if(sync())return;revealWord(current(),entry());save();render();focusPlay();});
 $('letters-next').addEventListener('click',()=>{if(sync())return;const r=rounds[level];if(r.index>=5||current().status==='playing')return;r.index++;save();render();const heading=$(r.index===5?'letters-result-title':'letters-category');heading.focus({preventScroll:true});heading.scrollIntoView({block:'nearest'});});
 $('letters-again').addEventListener('click',()=>{if(sync())return;start();render();$('letters-category').focus({preventScroll:true});$('letters-title').scrollIntoView({block:'start'});});
 ensure();ready=true;render();save();
 return {surprise(){sync();ensure();render();return 'Letras revueltas';}};
}
