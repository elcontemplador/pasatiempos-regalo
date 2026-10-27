import {tableLayout} from './domino-layout.js?v=33';
import {initTileDrag} from './domino-drag.js?v=34';
import {TILES,tileName,newMatch,legalMoves,step,serialize,restore,observe,chooseMove,random,restoreUndo} from './domino-engine.js?v=31';
import {readState,saveState} from './storage.js?v=22';
const KEY='regalo-omar-domino-v1',$=id=>document.getElementById(id);
const names=['Tú','Rival izquierdo','Tu compañero','Rival derecho'];
const subjects=['tú','el rival izquierdo','tu compañero','el rival derecho'];
const patterns=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
function half(n){const root=document.createElement('span');root.className='domino-half';root.setAttribute('aria-hidden','true');for(let i=0;i<9;i++){const dot=document.createElement('i');if(patterns[n].includes(i))dot.className='pip';root.append(dot);}return root;}
function face(a,b){const root=document.createElement('span');root.className='domino-face';root.setAttribute('aria-hidden','true');root.append(half(a),half(b));return root;}
export function initDomino(openDialog){
 const raw=readState(KEY),restoredMatch=restore(raw.match);let dragController,tableGeometry,boardSignature='';
 let s=restoredMatch||newMatch(),previous=restore(raw.previous),undo=restoreUndo(raw.undo,s),selected=null,timer=null,active=false,paused=restoredMatch&&raw.paused===true,lastRendered=-1,lastWritten=JSON.stringify(raw);
 const PREF_KEY='regalo-omar-domino-preferences-v1';
 const normalizePrefs=v=>({speed:['normal','slow','step'].includes(v.speed)?v.speed:'normal',sound:v.sound===true,guideDismissed:v.guideDismissed===true});
 let prefs=normalizePrefs(readState(PREF_KEY)),audio=null,overview=false,viewScale=1,lastArenaHeight=0,resultPending=false,resultTimer=null,keyboardInput=false;
 function savePrefs(){saveState(PREF_KEY,prefs);}
 function notice(text=''){$('domino-notice').textContent=text;}
 function warmAudio(){if(!prefs.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){$('domino-sound-status').textContent='Los sonidos no están disponibles en este navegador.';return;}audio||=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{$('domino-sound-status').textContent='Los sonidos no están disponibles en este navegador.';}}
 function tone(kind){if(!prefs.sound||!active||document.hidden||!audio||audio.state!=='running')return;try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='sine';o.frequency.value=kind==='turn'?520:kind==='win'?660:330;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.15);o.onended=()=>{o.disconnect();g.disconnect();};}catch{/* Optional audio never interrupts play. */}}
 function clearResult(){clearTimeout(resultTimer);resultTimer=null;resultPending=false;}
 function renderHistory(){for(const [id,events]of [['domino-recent',s.history.slice(-4)],['domino-history-list',s.history]]){const list=$(id);list.replaceChildren();events.forEach(e=>{const item=document.createElement('li');item.dataset.seat=e.seat;const label=document.createElement('span');label.textContent=names[e.seat]+(e.type==='pass'?' · pasó':' · '+tileName(e.tile));item.append(label);if(e.type==='play'){const t=TILES[e.tile];item.append(face(t.a,t.b));}list.append(item);});if(!events.length){const item=document.createElement('li');item.textContent='Todavía no hay jugadas en esta mano.';list.append(item);}}}
 function clearPreview(){$('domino-drop-preview')?.remove();$('domino-drop-caption').hidden=true;}
 function preview(tile,move){
  clearPreview();if(tile===null||!move||paused||s.turn!==0||!tableGeometry)return;
  const candidate=step(s,{type:'play',seat:0,...move}),first=candidate.history.find(e=>e.type==='play'),g=tableLayout(candidate.chain,first?.tile,tableGeometry.width,tableGeometry.unit),p=g.poses.find(p=>p.tile===tile),t=candidate.chain.find(t=>t.tile===tile);
  const item=document.createElement('li');item.id='domino-drop-preview';item.className='domino-preview';item.setAttribute('aria-hidden','true');Object.assign(item.style,{left:(p.x-g.origin.x+tableGeometry.origin.x)+'px',top:(p.y-g.origin.y+tableGeometry.origin.y)+'px',width:p.width+'px',height:p.height+'px'});
  const f=face(t.a,t.b);Object.assign(f.style,{width:2*g.unit+'px',height:g.unit+'px',transform:'translate(-50%,-50%) rotate('+p.angle+'deg)'});item.append(f);$('domino-chain').append(item);
  const caption=$('domino-drop-caption'),arena=$('domino-arena');caption.textContent=move.side==='start'?'Encajará en el centro':'Encajará en '+(move.side==='left'?'A · '+s.chain[0].a:'B · '+s.chain.at(-1).b);caption.hidden=false;caption.style.left=(arena.scrollLeft+arena.clientWidth/2)+'px';caption.style.top=(arena.scrollTop+8)+'px';
 }
 function panTo(p){const a=$('domino-arena');a.scrollLeft=p.x*viewScale-a.clientWidth/2;a.scrollTop=p.y*viewScale-a.clientHeight/2;}
 function viewPart(part){dragController?.cancel();overview=false;boardSignature='';renderBoard();if(part==='last'){const last=[...s.history].reverse().find(e=>e.type==='play');panTo(tableGeometry.poses.find(p=>p.tile===last?.tile)||tableGeometry.origin);}else panTo(tableGeometry[part]);}
 if(raw.match&&!restoredMatch)$('domino-notice').textContent='La partida guardada estaba incompleta. Hemos preparado una nueva; los demás juegos siguen guardados.';
 function save(){
  const value={match:serialize(s),previous:previous?serialize(previous):null,undo:undo?serialize(undo):null,paused:!!paused};
  const saved=saveState(KEY,value);if(saved)lastWritten=JSON.stringify(value);return saved;
 }
 function adopt(value){
  const match=restore(value.match);if(!match)return false;
  const focused=document.activeElement,hadGameFocus=$('domino-hand').contains(focused)||['domino-left','domino-right','domino-pass'].includes(focused.id);
  stop();clearResult();s=match;previous=restore(value.previous);undo=restoreUndo(value.undo,s);paused=value.paused===true;selected=null;lastRendered=-1;lastWritten=JSON.stringify(value);
  render();if(active&&hadGameFocus&&!document.querySelector('dialog[open]:not(#domino-zoom-dialog)'))$('domino-instruction').focus({preventScroll:true});
  $('domino-notice').textContent='La partida se ha actualizado desde otra pestaña. Puedes continuar aquí.';return true;
 }
 function refreshIfChanged(){const current=readState(KEY);return JSON.stringify(current)!==lastWritten&&adopt(current);}
 function stop(){clearTimeout(timer);timer=null;}
 function canRun(){return active&&!document.hidden&&!paused&&!document.querySelector('dialog[open]:not(#domino-zoom-dialog)')&&s.phase==='playing'&&s.turn!==0;}
 function schedule(){stop();$('domino-step').disabled=!canRun();if(!canRun()||prefs.speed==='step')return;timer=setTimeout(()=>{timer=null;if(canRun())commit(chooseMove(observe(s),random((s.seed+s.round*173+s.actions.length*937)>>>0)));},prefs.speed==='slow'?3200:1700);}
 function lastMessage(){
  if(!s.history.length)return s.round===1?(s.starter===0?'Sales con el doble seis.':`Sale ${subjects[s.starter]} con el doble seis.`):(s.starter===0?'Abres la mano con la ficha que prefieras.':`Abre la mano ${subjects[s.starter]} con la ficha que prefiera.`);
  const e=s.history[s.history.length-1];return e.type==='pass'?(e.seat===0?'Has pasado.':`${names[e.seat]} pasa.`):`${e.seat===0?'Has colocado':names[e.seat]+' coloca'} ${tileName(e.tile)}${e.side==='start'?'':e.side==='left'?' en el extremo A':' en el extremo B'}.`;
 }
 function render(){
  dragController?.cancel();
  $('domino-play').classList.toggle('is-paused',!!paused);$('domino-play').classList.toggle('manual-turn',prefs.speed==='step');$('domino-guide-tip').hidden=prefs.guideDismissed;
  const moves=paused?[]:legalMoves(s,0),isHuman=!paused&&s.phase==='playing'&&s.turn===0;
  if(!moves.some(m=>m.tile===selected))selected=null;
  $('domino-round').textContent=`Mano ${s.round} · A 100 puntos`;
  $('domino-us').textContent=s.scores[0];$('domino-them').textContent=s.scores[1];
  $('domino-variant').textContent=`${s.settings.level==='reto'?'Con estrategia':'Con calma'} · ${s.settings.scoring==='all'?'Se suman todas las fichas pendientes':'Se suman las fichas de los rivales'}`;
  const latest=s.history.at(-1);
  for(let seat=0;seat<4;seat++){
   const el=$('domino-seat-'+seat);el.replaceChildren();el.classList.toggle('our-team',seat%2===0);el.classList.toggle('current',!paused&&s.phase==='playing'&&s.turn===seat);el.classList.toggle('just-played',latest?.seat===seat);
   const label=document.createElement('strong');label.textContent=names[seat];const count=document.createElement('span');count.className='seat-count';count.textContent=s.hands[seat].length+' '+(s.hands[seat].length===1?'ficha':'fichas');
   const turn=document.createElement('span');turn.className='seat-turn';turn.textContent=paused&&s.turn===seat?'En pausa':latest?.seat===seat?'Acaba de jugar':s.phase==='playing'&&s.turn===seat?(seat===0?'Te toca':'Su turno'):'';
   const backs=document.createElement('span');backs.className='domino-backs';backs.setAttribute('aria-hidden','true');for(let i=0;i<s.hands[seat].length;i++)backs.append(document.createElement('i'));
   el.append(label,count,backs,turn);
   const last=[...s.history].reverse().find(e=>e.seat===seat);
   if(last){const chip=document.createElement('span');chip.className='seat-last';chip.setAttribute('aria-label',last.type==='pass'?'Última jugada: pasó':'Última ficha: '+tileName(last.tile));if(last.type==='play'){const t=TILES[last.tile];chip.append(face(t.a,t.b));const values=document.createElement('span');values.className='seat-last-values';values.textContent='Última: '+tileName(last.tile);chip.append(values);}else chip.textContent='Última: pasó';el.append(chip);}
  }
  renderBoard();
  renderHistory();
  $('domino-left').textContent=s.chain.length?`A · ${s.chain[0].a}`:'Colocar salida';
  $('domino-right').textContent=s.chain.length?`B · ${s.chain[s.chain.length-1].b}`:'B';
  $('domino-right').hidden=!s.chain.length;
  $('domino-left').disabled=selected===null||!moves.some(m=>m.tile===selected&&(m.side==='left'||m.side==='start'));
  $('domino-right').disabled=selected===null||!moves.some(m=>m.tile===selected&&m.side==='right');
  const focus=$('domino-hand').contains(document.activeElement)?document.activeElement.dataset.tile:null;
  const hand=$('domino-hand');hand.replaceChildren();
  for(const id of [...s.hands[0]].sort((a,b)=>a-b)){
   const t=TILES[id],button=document.createElement('button');button.className='domino-tile'+(id===selected?' selected':'');button.dataset.tile=id;
   button.setAttribute('aria-label',`Ficha ${tileName(id)}${isHuman&&!moves.some(m=>m.tile===id)?', no encaja':''}`);
   button.setAttribute('aria-pressed',String(id===selected));button.disabled=!moves.some(m=>m.tile===id);
   button.append(face(t.a,t.b));const label=document.createElement('span');label.className='domino-numbers';label.textContent=tileName(id);button.append(label);
   button.addEventListener('click',e=>{warmAudio();keyboardInput=e.detail===0;selected=selected===id?null:id;render();if(selected!==null&&keyboardInput){const end=!$('domino-left').disabled?$('domino-left'):$('domino-right');end.focus({preventScroll:true});}});
   hand.append(button);
  }
  if(focus!==null)hand.querySelector(`[data-tile="${focus}"]`)?.focus({preventScroll:true});
  $('domino-pass').hidden=!isHuman||moves.length>0;
  $('domino-pause').hidden=s.phase!=='playing';$('domino-pause').textContent=paused?'Continuar partida':'Pausar partida';$('domino-pause').setAttribute('aria-pressed',String(paused));
  $('domino-step').hidden=prefs.speed!=='step'||s.phase!=='playing'||s.turn===0;$('domino-step').disabled=!canRun();
  let instruction=s.phase!=='playing'?'La mano ha terminado.':paused?'Partida en pausa. Continúa cuando quieras.':isHuman?(moves.length?selected!==null?'Ficha '+tileName(selected)+'. Elige A o B.':!s.chain.length&&s.round===1?'Tu turno: sales con el doble seis.':'Tu turno: toca o arrastra una ficha.':'Pulsa «Pasar»: no tienes una ficha que encaje.'):'Juega '+subjects[s.turn]+'.';
  $('domino-instruction').textContent=instruction;
  $('domino-status').textContent=lastMessage();$('domino-result').hidden=s.phase==='playing'||resultPending;
  $('domino-next').hidden=s.phase!=='hand-over';$('domino-again').hidden=s.phase!=='match-over';
  $('domino-recover').hidden=!previous;
  $('domino-undo').hidden=!undo;
  if(s.result){
   const r=s.result,ours=r.winner===0,match=s.phase==='match-over';
   $('domino-result-title').textContent=r.winner===null?'Mesa cerrada: empate':match?(ours?'¡Habéis ganado la partida!':'La partida es de los rivales'):ours?'¡La mano es vuestra!':'La mano es de los rivales';
   $('domino-result-text').textContent=`${r.reason==='closed'?'Mesa cerrada. ':'Todas las fichas de un jugador colocadas. '}Puntos pendientes: vuestra pareja, ${r.teams[0]}; rivales, ${r.teams[1]}. ${r.winner===null?'No se suman puntos.':`${ours?'Vuestra pareja suma':'Los rivales suman'} ${r.points} puntos.`}`;
   $('domino-score-change').textContent=r.winner===null?'Marcador sin cambios: '+s.scores[0]+'–'+s.scores[1]+'.':(ours?'Vuestra pareja':'Los rivales')+': '+(s.scores[r.winner]-r.points)+' + '+r.points+' = '+s.scores[r.winner]+' puntos. Marcador: '+s.scores[0]+'–'+s.scores[1]+'.';
   const remaining=$('domino-remaining');remaining.replaceChildren();
   s.hands.forEach((h,seat)=>{const p=document.createElement('p');p.textContent=`${names[seat]}: ${h.length?h.map(tileName).join(', '):'sin fichas'}`;remaining.append(p);});
  }
  schedule();
 }
 function renderBoard(){
  const board=$('domino-chain'),arena=$('domino-arena'),unit=Math.max(32,parseFloat(getComputedStyle(document.documentElement).fontSize)*2);
  $('domino-play').classList.toggle('big-text',unit>48);
  const width=Math.max(384,arena.clientWidth),signature=[width,unit,arena.clientHeight,overview,s.chain.map(t=>t.tile).join(','),s.history.length,paused,s.turn,selected].join('|');
  if(signature===boardSignature)return;boardSignature=signature;
  const first=s.history.find(e=>e.type==='play'),previousGeometry=tableGeometry;
  tableGeometry=tableLayout(s.chain,first?.tile,width,unit);
  const oldLeft=arena.scrollLeft,oldTop=arena.scrollTop;clearPreview();board.replaceChildren();board.style.width=tableGeometry.width+'px';board.style.height=tableGeometry.height+'px';
  viewScale=overview?Math.max(.75,Math.min(1,(arena.clientWidth-8)/tableGeometry.width,(arena.clientHeight-8)/tableGeometry.height)):1;board.style.transform='scale('+viewScale+')';const surface=$('domino-surface');surface.style.width=tableGeometry.width*viewScale+'px';surface.style.height=tableGeometry.height*viewScale+'px';lastArenaHeight=arena.clientHeight;$('domino-play').classList.toggle('overview-mode',overview);$('domino-fit').textContent=overview?'Ver detalle':'Mesa completa';$('domino-fit').setAttribute('aria-pressed',String(overview));
  for(const p of tableGeometry.poses){
   const t=s.chain[p.index],item=document.createElement('li');item.className='domino-placed'+(s.history.at(-1)?.tile===t.tile?' last-play':'');if(active&&lastRendered!==s.actions.length&&s.history.at(-1)?.tile===t.tile)item.classList.add('new-play');item.style.setProperty('--arrival-x',(t.seat===1?-55:t.seat===3?55:0)+'px');item.style.setProperty('--arrival-y',(t.seat===2?-55:t.seat===0?55:0)+'px');item.dataset.tile=t.tile;item.dataset.seat=t.seat;item.dataset.index=p.index;item.setAttribute('aria-label',names[t.seat]+': '+t.a+' con '+t.b);
   Object.assign(item.style,{left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.height+'px'});
   const f=face(t.a,t.b);Object.assign(f.style,{width:2*unit+'px',height:unit+'px',transform:'translate(-50%,-50%) rotate('+p.angle+'deg)'});item.append(f);board.append(item);
  }
  for(const side of ['left','right']){
   const end=tableGeometry[side],socket=document.createElement('button');socket.id='domino-end-'+side;socket.className='domino-socket';socket.dataset.side=side;socket.textContent=s.chain.length?(side==='left'?'A · '+s.chain[0].a:'B · '+s.chain.at(-1).b):'+';
   socket.setAttribute('aria-label',s.chain.length?'Colocar junto al extremo '+(side==='left'?'A, '+s.chain[0].a:'B, '+s.chain.at(-1).b):'Colocar ficha de salida');socket.style.width=Math.max(48,48/viewScale)+'px';socket.style.height=Math.max(48,48/viewScale)+'px';
   socket.hidden=!s.chain.length&&side==='right';socket.disabled=paused||!legalMoves(s,0).some(m=>m.tile===selected&&(m.side===side||side==='left'&&m.side==='start'));
   socket.style.left=(end.x+end.dx*(unit+10))+'px';socket.style.top=(end.y+end.dy*(unit+10))+'px';socket.addEventListener('click',()=>playSide(side));board.append(socket);
  }
  if(!s.chain.length){const note=document.createElement('p');note.className='domino-center-note';note.textContent='Lleva tu ficha hasta el centro de la mesa';note.style.left=tableGeometry.origin.x+'px';note.style.top=(tableGeometry.origin.y-unit*2.5)+'px';board.append(note);}
  const fresh=active&&lastRendered!==s.actions.length;
  if(fresh||!previousGeometry){const last=[...s.history].reverse().find(e=>e.type==='play'),p=tableGeometry.poses.find(p=>p.tile===last?.tile)||tableGeometry.origin;panTo(p);}
  else{arena.scrollLeft=oldLeft+(tableGeometry.origin.x-(previousGeometry?.origin.x||tableGeometry.origin.x))*viewScale;arena.scrollTop=oldTop+(tableGeometry.origin.y-(previousGeometry?.origin.y||tableGeometry.origin.y))*viewScale;}
  lastRendered=s.actions.length;
 }
 function tableTargets(){
  const board=$('domino-chain'),result=[];
  for(const side of ['left','right']){
   const socket=$('domino-end-'+side);if(socket&&!socket.hidden)result.push({el:socket,side});
   if(s.chain.length>1){const end=board.querySelector('[data-index="'+(side==='left'?0:s.chain.length-1)+'"]');if(end)result.push({el:end,side});}
  }
  result.push({el:$('domino-left'),side:'left'},{el:$('domino-right'),side:'right'});return result;
 }
 function tableDrop(x,y,moves){
  const arena=$('domino-arena'),r=arena.getBoundingClientRect();if(!arena.contains(document.elementFromPoint(x,y))||x<r.left||x>r.right||y<r.top||y>r.bottom||!moves.length)return null;
  const ox=r.left-arena.scrollLeft,oy=r.top-arena.scrollTop;
  const ordered=moves.map(m=>({move:m,side:m.side==='start'?'left':m.side,point:tableGeometry[m.side==='start'?'left':m.side]})).sort((a,b)=>Math.hypot((x-ox)/viewScale-a.point.x,(y-oy)/viewScale-a.point.y)-Math.hypot((x-ox)/viewScale-b.point.x,(y-oy)/viewScale-b.point.y));
  const best=ordered[0];return {side:best.side,el:$('domino-end-'+best.side)};
 }
 function focusPlayable(){const t=$('domino-hand').querySelector('button:not(:disabled)')||(!$('domino-pass').hidden?$('domino-pass'):$('domino-instruction'));t.focus({preventScroll:true});if(keyboardInput)t.scrollIntoView({block:'nearest'});}
 function commit(action){if(refreshIfChanged()||paused)return;const human=action.seat===0,waitingFocus=[$('domino-instruction'),$('domino-step')].includes(document.activeElement),checkpoint=human?s:undo;notice();clearResult();s=step(s,action);undo=checkpoint;selected=null;resultPending=s.phase!=='playing';save();render();tone(s.phase!=='playing'?'win':s.turn===0?'turn':'tile');
  if(resultPending){resultTimer=setTimeout(()=>{resultTimer=null;resultPending=false;render();if(active&&!document.hidden&&!document.querySelector('dialog[open]:not(#domino-zoom-dialog)')){$('domino-result-title').focus({preventScroll:true});$('domino-result').scrollIntoView({block:'nearest'});}},650);}
  else if(human)$('domino-instruction').focus({preventScroll:true});else if(s.turn===0&&waitingFocus)focusPlayable();
 }
 function playSide(side){const m=legalMoves(s,0).find(m=>m.tile===selected&&(m.side===side||side==='left'&&m.side==='start'));if(m&&!paused)commit({type:'play',seat:0,...m});}
 $('domino-left').addEventListener('click',()=>playSide('left'));$('domino-right').addEventListener('click',()=>playSide('right'));
 $('domino-pass').addEventListener('click',()=>{if(!paused&&s.turn===0&&!legalMoves(s).length)commit({type:'pass',seat:0});});
 $('domino-next').addEventListener('click',()=>{if(refreshIfChanged())return;clearResult();notice();undo=null;s=step(s,{type:'next'});selected=null;paused=false;save();render();$('domino-instruction').focus({preventScroll:true});});
 $('domino-pause').addEventListener('click',()=>{if(refreshIfChanged())return;paused=!paused;selected=null;save();render();});
 $('domino-undo').addEventListener('click',()=>{if(refreshIfChanged()||!undo)return;stop();clearResult();s=undo;undo=null;selected=null;paused=false;save();render();notice('Has recuperado tu último turno, incluidas las respuestas posteriores.');focusPlayable();});
 function openNew(trigger){dragController?.cancel();stop();$('domino-level').value=s.settings.level;$('domino-scoring').value=s.settings.scoring;openDialog('domino-new-dialog',trigger);}
 $('domino-new').addEventListener('click',e=>openNew(e.currentTarget));$('domino-again').addEventListener('click',e=>openNew(e.currentTarget));
 $('domino-start').addEventListener('click',()=>{
  if(refreshIfChanged())return;clearResult();notice();undo=null;
  previous=s.actions.length?s:previous;
  s=newMatch((Date.now()+Math.floor(Math.random()*1000000))>>>0,{level:$('domino-level').value,scoring:$('domino-scoring').value});
  selected=null;paused=false;save();$('domino-new-dialog').close();render();$('domino-instruction').focus({preventScroll:true});
 });
 $('domino-recover').addEventListener('click',()=>{if(refreshIfChanged()||!previous)return;clearResult();notice();undo=null;[s,previous]=[previous,s];selected=null;paused=false;save();render();$('domino-instruction').focus({preventScroll:true});});

 $('domino-see-left').addEventListener('click',()=>viewPart('left'));$('domino-see-right').addEventListener('click',()=>viewPart('right'));$('domino-see-last').addEventListener('click',()=>viewPart('last'));
 $('domino-fit').addEventListener('click',()=>{dragController?.cancel();overview=!overview;boardSignature='';renderBoard();panTo(tableGeometry.origin);});
 $('domino-history').addEventListener('click',e=>{dragController?.cancel();stop();renderHistory();openDialog('domino-history-dialog',e.currentTarget);});
 $('domino-settings').addEventListener('click',e=>{dragController?.cancel();stop();$('domino-speed').value=prefs.speed;$('domino-sound').checked=prefs.sound;openDialog('domino-settings-dialog',e.currentTarget);});
 $('domino-speed').addEventListener('change',()=>{prefs.speed=$('domino-speed').value;savePrefs();render();});
 $('domino-sound').addEventListener('change',()=>{prefs.sound=$('domino-sound').checked;savePrefs();$('domino-sound-status').textContent=prefs.sound?'Sonidos activados.':'Sonidos desactivados.';if(prefs.sound){warmAudio();setTimeout(()=>tone('tile'),80);}});
 const openGuide=e=>{dragController?.cancel();stop();openDialog('domino-guide-dialog',e.currentTarget);};$('domino-guide-open').addEventListener('click',openGuide);$('domino-guide-settings').addEventListener('click',openGuide);
 $('domino-guide-dismiss').addEventListener('click',()=>{prefs.guideDismissed=true;savePrefs();$('domino-guide-tip').hidden=true;$('expand-domino').focus({preventScroll:true});});
 $('domino-step').addEventListener('click',()=>{warmAudio();if(prefs.speed==='step'&&canRun())commit(chooseMove(observe(s),random((s.seed+s.round*173+s.actions.length*937)>>>0)));});
 $('domino-rules').addEventListener('click',e=>{dragController?.cancel();stop();openDialog('domino-rules-dialog',e.currentTarget);});
 document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',schedule));
 const play=$('domino-play'),home=play.parentElement,zoom=$('domino-zoom-dialog');
 play.addEventListener('pointerdown',()=>{keyboardInput=false;warmAudio();});play.addEventListener('keydown',()=>{keyboardInput=true;warmAudio();});
 dragController=initTileDrag({hand:$('domino-hand'),root:play,targets:tableTargets,tableDrop,scrollables:[$('domino-arena')],preview,movesFor(tile){return active&&!paused&&!document.hidden&&s.turn===0&&!document.querySelector('dialog[open]:not(#domino-zoom-dialog)')?legalMoves(s,0).filter(m=>m.tile===tile):[];},drop(move){commit({type:'play',seat:0,...move});},cancelNotice(){ $('domino-notice').textContent='La ficha vuelve a tu mano. Suéltala dentro de la mesa o junto a un extremo de la cadena.'; }});
 $('expand-domino').addEventListener('click',e=>{zoom.append(play);e.currentTarget.hidden=true;openDialog('domino-zoom-dialog',e.currentTarget);$('close-domino-zoom').focus();zoom.scrollTop=0;boardSignature='';renderBoard();schedule();});
 $('close-domino-zoom').addEventListener('click',()=>zoom.close());
 zoom.addEventListener('close',()=>{dragController?.cancel();home.append(play);boardSignature='';renderBoard();$('expand-domino').hidden=false;$('expand-domino').focus({preventScroll:true});schedule();});
 window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{const value=JSON.parse(e.newValue);if(JSON.stringify(value)!==lastWritten)adopt(value);}catch{/* Ignore a damaged external save without discarding this playable match. */}});
 const resizeTable=()=>{if(active){const unit=Math.max(32,parseFloat(getComputedStyle(document.documentElement).fontSize)*2),width=Math.max(384,$('domino-arena').clientWidth,unit*12);if(tableGeometry?.width===width&&tableGeometry?.unit===unit&&lastArenaHeight===$('domino-arena').clientHeight)return;dragController?.cancel();boardSignature='';renderBoard();}};
 new ResizeObserver(resizeTable).observe($('domino-arena'));new MutationObserver(resizeTable).observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
 window.addEventListener('resize',resizeTable);
 document.addEventListener('visibilitychange',schedule);
 window.addEventListener('pagehide',stop);
 window.addEventListener('pageshow',schedule);
 // Persist each move; never let time spent in another game advance this match.
 render();save();
 return {setActive(value){active=value;if(!value)dragController?.cancel();else{warmAudio();boardSignature='';renderBoard();}schedule();}};
}
