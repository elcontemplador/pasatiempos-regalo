import {createStateSession} from './state-session.js?v=37';
import {icon} from './icons.js?v=22';
import {readState,saveState} from './storage.js?v=22';
import {quizTopics} from './quiz-data.js?v=29';
import {makeRound,restoreRound,scoreRound,useFifty} from './quiz-engine.js?v=22';
const KEY='regalo-omar-quiz-v1';
export function initQuiz(){
 const $=id=>document.getElementById(id);
 const saved=readState(KEY);
 let topic=quizTopics.find(t=>t.id===saved.topic)||quizTopics[0];
 let rounds={},seen={},ready=false;
 for(const t of quizTopics){
  const round=restoreRound(saved.rounds?.[t.id],t.questions);if(round)rounds[t.id]=round;
  seen[t.id]=Array.isArray(saved.seen?.[t.id])?[...new Set(saved.seen[t.id].filter(id=>t.questions.some(q=>q.id===id)))]:[];
 }
 const session=createStateSession(KEY,['rounds','seen'],adopt);
 function adopt(value,external){
  const before=JSON.stringify(rounds[topic.id]);
  for(const t of quizTopics){
   const next=restoreRound(value.rounds?.[t.id],t.questions);if(next)rounds[t.id]=next;
   if(Array.isArray(value.seen?.[t.id]))seen[t.id]=[...new Set(value.seen[t.id].filter(id=>t.questions.some(q=>q.id===id)))];
  }
  const changed=before!==JSON.stringify(rounds[topic.id]);
  if(ready&&changed){render();if(external)$('quiz-sync-notice').textContent='La partida se ha actualizado desde otra pestaña. Puedes continuar aquí.';}
  return changed;
 }
 function sync(){return session.sync();}
 function save(){return session.write({topic:topic.id,rounds,seen});}
 window.addEventListener('storage',e=>{if(e.key===KEY)sync();});
 window.addEventListener('focus',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 function ensureRound(){if(!rounds[topic.id])start();}
 function start(){const next=makeRound(topic.questions,seen[topic.id],Math.random,rounds[topic.id]?.ids||[]);rounds[topic.id]=next.round;seen[topic.id]=next.seen;save();}
 function renderTopics(){
  const root=$('quiz-topics'),focused=root.contains(document.activeElement)?document.activeElement.dataset.quizTopic:null;root.replaceChildren();
  quizTopics.forEach(t=>{const b=document.createElement('button');b.className='theme-button'+(topic.id===t.id?' active':'');b.dataset.quizTopic=t.id;b.setAttribute('aria-pressed',String(topic.id===t.id));
   const label=document.createElement('span');label.textContent=t.title;const small=document.createElement('small');small.textContent=`${t.questions.length} preguntas`;label.append(small);b.innerHTML=icon({salamanca:'pin',campos:'sprout',deporte:'cup',recuerdos:'tv',rincones:'map',refranes:'chat'}[t.id]);b.append(label);
   b.addEventListener('click',()=>{sync();$('quiz-sync-notice').textContent='';topic=t;ensureRound();save();renderTopics();render();});$('quiz-topics').append(b);
  });
  if(focused)root.querySelector(`[data-quiz-topic="${focused}"]`)?.focus({preventScroll:true});
 }
 function sourceLink(q){const a=document.createElement('a');a.href=q.source;a.target='_blank';a.rel='noopener noreferrer';a.className='quiz-source';a.textContent='Saber más · fuente';a.setAttribute('aria-label','Consultar la fuente de esta curiosidad (se abre en otra pestaña)');return a;}
 function render(){
  const r=rounds[topic.id],done=r.index===10;
  $('quiz-title').textContent=topic.heading;$('quiz-description').textContent=topic.description;
  $('quiz-question-area').hidden=done;$('quiz-result').hidden=!done;
  $('quiz-feedback').hidden=true;$('quiz-feedback').replaceChildren();$('quiz-next').hidden=true;
  $('quiz-progress').textContent=done?'Partida terminada':`Pregunta ${r.index+1} de 10`;
  $('quiz-meter').value=r.answers.length;
  $('quiz-score').textContent=`${scoreRound(r,topic.questions)} ${scoreRound(r,topic.questions)===1?'acierto':'aciertos'}`;
  if(done){
   const score=scoreRound(r,topic.questions);$('quiz-result-title').textContent=`${score} de 10, Omar`;
   $('quiz-result-message').textContent=score===10?'¡Pleno! Diez curiosidades que ya conocías.':score>=7?'¡Muy bien! Siempre queda alguna curiosidad por descubrir.':'Diez curiosidades más para compartir. Otra partida cuando te apetezca.';
   $('quiz-review-list').replaceChildren();$('quiz-review').open=false;
   r.ids.forEach((id,i)=>{const q=topic.questions.find(q=>q.id===id),li=document.createElement('li'),title=document.createElement('strong'),p=document.createElement('p');title.textContent=q.question;p.textContent=`${r.answers[i]===q.answer?'✓ Acertaste.':'Tu respuesta: '+q.options[r.answers[i]]+'.'} Respuesta: ${q.options[q.answer]}. ${q.explanation}`;li.append(title,p,sourceLink(q));$('quiz-review-list').append(li);});
   return;
  }
  const q=topic.questions.find(q=>q.id===r.ids[r.index]),answered=r.answers.length>r.index;
  $('quiz-help').hidden=answered;$('quiz-fifty').disabled=!!r.fifty;
  $('quiz-fifty').textContent=r.fifty?'Comodín utilizado':'Comodín 50/50';
  $('quiz-help-note').textContent=!r.fifty?'Una vez por partida. Deja dos opciones.':r.fifty.index===r.index?'Quedan dos opciones. Elige cuando quieras.':'Ya lo has usado en esta partida.';
  $('quiz-question').textContent=q.question;$('quiz-answers').replaceChildren();
  r.orders[r.index].forEach((option,i)=>{
   const eliminated=r.fifty?.index===r.index&&r.fifty.removed===option;
   const b=document.createElement('button');b.className='quiz-answer';b.dataset.answer=option;b.disabled=answered||eliminated;b.hidden=eliminated;
   const letter=document.createElement('span');letter.className='quiz-letter';letter.textContent=String.fromCharCode(65+i);
   const text=document.createElement('span');text.textContent=q.options[option];b.append(letter,text);
   if(answered&&option===q.answer){b.classList.add('correct');const mark=document.createElement('span');mark.className='quiz-mark';mark.textContent='✓ Correcta';b.append(mark);}
   else if(answered&&option===r.answers[r.index]){b.classList.add('incorrect');const mark=document.createElement('span');mark.className='quiz-mark';mark.textContent='Tu respuesta';b.append(mark);}
   b.addEventListener('click',()=>{if(sync())return;const fresh=rounds[topic.id];if(fresh.ids[fresh.index]!==q.id||fresh.answers.length>fresh.index||eliminated)return;$('quiz-sync-notice').textContent='';fresh.answers.push(option);save();render();$('quiz-feedback').focus({preventScroll:true});$('quiz-feedback').scrollIntoView({block:'start'});});$('quiz-answers').append(b);
  });
  if(answered){
   const correct=r.answers[r.index]===q.answer,lead=document.createElement('strong'),p=document.createElement('p');lead.textContent=correct?'¡Correcto!':`La respuesta es: ${q.options[q.answer]}.`;p.textContent=q.explanation;
   $('quiz-feedback').append(lead,p,sourceLink(q));$('quiz-feedback').hidden=false;$('quiz-next').textContent=r.index===9?'Ver resultado':'Siguiente pregunta';$('quiz-next').hidden=false;
  }
 }
 $('quiz-fifty').addEventListener('click',()=>{if(sync())return;$('quiz-sync-notice').textContent='';if(!useFifty(rounds[topic.id],topic.questions))return;save();render();const first=$('quiz-answers').querySelector('button:not([hidden])');first.focus({preventScroll:true});first.scrollIntoView({block:'nearest'});});
 $('quiz-next').addEventListener('click',()=>{if(sync())return;$('quiz-sync-notice').textContent='';const r=rounds[topic.id];if(r.answers.length!==r.index+1||r.index>=10)return;r.index++;save();render();const focus=$(r.index===10?'quiz-result-title':'quiz-question');focus.focus({preventScroll:true});focus.scrollIntoView({block:'nearest'});});
 $('quiz-again').addEventListener('click',()=>{if(sync())return;$('quiz-sync-notice').textContent='';start();render();$('quiz-question').focus({preventScroll:true});$('quiz-title').scrollIntoView({block:'start'});});
 ensureRound();ready=true;renderTopics();render();save();
 return {surprise(){
  sync();$('quiz-sync-notice').textContent='';
  const others=quizTopics.filter(t=>t.id!==topic.id),unfinished=others.filter(t=>!rounds[t.id]||rounds[t.id].index<10),pool=unfinished.length?unfinished:others;
  topic=pool[Math.floor(Math.random()*pool.length)];ensureRound();save();renderTopics();render();return topic.title;
 }};
}
