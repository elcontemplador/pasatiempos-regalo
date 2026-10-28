import {buildGame,newGame,cleanMatch,packGame,undoHuman,outcome,claimable,moveText,spanishSan,PIECE_NAMES,LEVELS} from './chess-engine.js?v=35';
import {pieceSvg} from './chess-pieces.js?v=36';
import {readState,saveState} from './storage.js?v=22';
const KEY='regalo-omar-chess-v1',PREF='regalo-omar-chess-preferences-v1',$=id=>document.getElementById(id),other=c=>c==='w'?'b':'w';
export function initChess(openDialog){
 const raw=readState(KEY),valid=cleanMatch(raw.match),view=readState(PREF);
 let match=valid||newGame(),game=buildGame(match),previous=cleanMatch(raw.previous),paused=valid&&raw.paused===true,active=false,selected=null,flipped=view.color===match.color&&typeof view.flipped==='boolean'?view.flipped:match.color==='b',pending=null;
 let worker=null,delay=null,deadline=null,request=0,thinking=false,keyboardInput=false,lastWritten=JSON.stringify(raw),drag=null,suppressClick=false,focusSquare=match.color==='w'?'e2':'e7';
 const play=$('chess-play'),board=$('chess-board'),zoom=$('chess-zoom-dialog'),home=play.parentElement;
 const squareName=s=>s.toUpperCase(),human=()=>game.turn()===match.color&&!outcome(game,match.ending);
 function saveView(){saveState(PREF,{color:match.color,flipped});}
 function undoTarget(){return match.ending?.reason==='resign'?{...match,ending:null}:undoHuman(match);}
 function fitBoard(){
  if(!zoom.open)return;
  const frame=$('chess-board').getBoundingClientRect(),zr=zoom.getBoundingClientRect(),you=$('chess-you-row').getBoundingClientRect();
  const stacked=getComputedStyle(play.querySelector('.chess-layout')).gridTemplateColumns.split(' ').length===1;
  const reserve=stacked?Math.min(130,($('chess-status').offsetHeight+$('chess-actions').offsetHeight+28)):0;
  const available=zoom.clientHeight-(frame.top-zr.top+zoom.scrollTop)-$('chess-files').offsetHeight-you.height-18-reserve;
  const ranks=$('chess-ranks').getBoundingClientRect().width+2;
  const largeText=parseFloat(getComputedStyle(document.documentElement).fontSize)>20;
  // On portrait phones enlargement uses the available width, even when controls need scrolling.
  const portraitPhone=zoom.clientWidth<=680&&zoom.clientHeight>zoom.clientWidth;
  const width=largeText||portraitPhone?680:Math.max(244,Math.min(680,available+ranks));
  if(Math.abs(parseFloat(play.style.getPropertyValue('--chess-fit-width'))-width)>1||!play.style.getPropertyValue('--chess-fit-width'))play.style.setProperty('--chess-fit-width',width+'px');
 }
 const queueFit=()=>requestAnimationFrame(fitBoard);
 window.addEventListener('resize',queueFit);
 if(window.ResizeObserver){const observer=new ResizeObserver(queueFit);for(const el of [zoom,play.querySelector('.chess-toolbar'),$('chess-you-row'),$('chess-computer-row'),$('chess-status')])observer.observe(el);}
 function message(text=''){$('chess-notice').textContent=text;}
 function save(){const value={match,previous,paused:!!paused};if(saveState(KEY,value))lastWritten=JSON.stringify(value);}
 function stop(){clearTimeout(delay);clearTimeout(deadline);delay=deadline=null;worker?.terminate();worker=null;request++;thinking=false;}
 function canCompute(){return active&&!paused&&!document.hidden&&!outcome(game,match.ending)&&!human()&&!document.querySelector('dialog[open]:not(#chess-zoom-dialog)');}
 function sync(){
  const value=readState(KEY);if(JSON.stringify(value)===lastWritten)return false;
  const m=cleanMatch(value.match);if(!m)return false;
  stop();cancelDrag();match=m;game=buildGame(match);previous=cleanMatch(value.previous);paused=value.paused===true;selected=null;pending=null;const preference=readState(PREF);flipped=preference.color===match.color&&typeof preference.flipped==='boolean'?preference.flipped:match.color==='b';lastWritten=JSON.stringify(value);
  if($('chess-promotion-dialog').open)$('chess-promotion-dialog').close();
  render();message('La partida se ha actualizado desde otra pestaña. Puedes continuar aquí.');schedule();return true;
 }
 function schedule(){
  stop();if(!canCompute())return;
  const id=request,key=JSON.stringify(match);thinking=true;status();
  delay=setTimeout(()=>{
   delay=null;if(!canCompute()||id!==request||sync())return;
   if(claimable(game)){match.ending={reason:'claim'};save();render();focusResult();return;}
   function receive(move){
    if(id!==request||!canCompute()||sync()||key!==JSON.stringify(match))return;
    stop();
    const legal=game.moves({verbose:true}),chosen=legal.find(m=>m.from===move?.from&&m.to===move?.to&&m.promotion===(move.promotion||undefined))||legal[0];
    if(chosen)commit(chosen,false);
   }
   function fallback(){receive(game.moves({verbose:true}).find(m=>m.captured)||game.moves({verbose:true})[0]);}
   try{
    worker=new Worker(new URL('./chess-ai-worker.js?v=35',import.meta.url),{type:'module'});
    worker.onmessage=e=>{if(e.data.id===id){if(e.data.error)fallback();else receive(e.data.move);}};
    worker.onerror=e=>{e.preventDefault();fallback();};
    deadline=setTimeout(fallback,2500);worker.postMessage({id,match});
   }catch{fallback();}
  },500);
 }
 function status(){
  const end=outcome(game,match.ending);
  let text=end?'Partida terminada.':paused?'Partida en pausa. Continúa cuando quieras.':human()?(game.isCheck()?'Estás en jaque. Protege tu rey.':selected?(game.moves({square:selected}).length?'Elige una de las casillas marcadas.':'Esta pieza no puede moverse ahora. Elige otra de tus piezas.'):'Tu turno: toca una pieza y su destino, o arrástrala.'):(thinking?'El ordenador está pensando…':'Turno del ordenador.');
  $('chess-status').textContent=text;
  $('chess-pause').hidden=!!end;$('chess-pause').textContent=paused?'Continuar partida':'Pausar partida';$('chess-pause').setAttribute('aria-pressed',String(!!paused));
  $('chess-claim').hidden=!human()||!claimable(game);$('chess-claim').disabled=!!paused;
  $('chess-undo').disabled=!undoTarget();
  $('chess-undo').textContent=match.ending?.reason==='resign'?'Retomar partida':'Rectificar jugada';
  for(const [id,isYou]of [['chess-your-turn',true],['chess-computer-turn',false]]){
   $(id).textContent=end?'Terminada':paused?'En pausa':human()===isYou?(isYou?'Te toca':'Pensando…'):'En espera';
  }
  queueFit();
 }
 function focusCell(square,reveal=false){const b=board.querySelector('[data-square="'+square+'"]');b?.focus({preventScroll:true});if(reveal)b?.scrollIntoView({block:'nearest',inline:'nearest'});}
 function focusResult(){if(active&&!document.hidden&&!document.querySelector('dialog[open]:not(#chess-zoom-dialog)')){$('chess-result-title').focus({preventScroll:true});$('chess-result').scrollIntoView({block:'nearest'});}}
 function render(){
  const hadBoardFocus=board.contains(document.activeElement);cancelDrag();const history=game.history({verbose:true}),last=history.at(-1),end=outcome(game,match.ending);
  const files=flipped?'hgfedcba':'abcdefgh',ranks=flipped?'12345678':'87654321';
  const draggableSquares=new Set(!paused&&human()?game.moves({verbose:true}).map(move=>move.from):[]);
  const legal=selected&&!paused&&human()?game.moves({square:selected,verbose:true}):[],targets=new Set(legal.map(m=>m.to)),captures=new Set(legal.filter(m=>m.captured).map(m=>m.to));
  board.replaceChildren(...Array.from({length:64},(_,i)=>{
   const square=files[i%8]+ranks[Math.floor(i/8)],p=game.get(square);
   const b=document.createElement('button');b.type='button';b.dataset.square=square;
   const dark=(square.charCodeAt(0)-97+Number(square[1]))%2===1;
   b.className='chess-square '+(dark?'dark':'light')+(selected===square?' selected':'')+(targets.has(square)?captures.has(square)?' capture-target':' legal-target':'')+(last&&(last.from===square||last.to===square)?' last-move'+(last.to===square?' last-destination':' last-origin'):'')+(p?.type==='k'&&p.color===game.turn()&&game.isCheck()?' in-check':'');
   b.tabIndex=square===focusSquare?0:-1;b.setAttribute('aria-pressed',String(selected===square));b.setAttribute('aria-label',squareName(square)+(p?', '+PIECE_NAMES[p.type]+' '+(p.color==='w'?(['q','r'].includes(p.type)?'blanca':'blanco'):(['q','r'].includes(p.type)?'negra':'negro')):', vacía')+(targets.has(square)?captures.has(square)?', captura posible':', destino posible':''));
   b.classList.toggle('draggable-piece',draggableSquares.has(square));
   if(p)b.innerHTML=pieceSvg(p.type,p.color);
   b.addEventListener('click',e=>{if(suppressClick)return;focusSquare=square;choose(square,e.detail===0);});return b;
  }));
  if(hadBoardFocus)focusCell(focusSquare,keyboardInput);
  const rankRoot=$('chess-ranks'),fileRoot=$('chess-files');rankRoot.replaceChildren();fileRoot.replaceChildren();
  for(const text of ranks){const el=document.createElement('span');el.textContent=text;rankRoot.append(el);}
  for(const text of files){const el=document.createElement('span');el.textContent=text;fileRoot.append(el);}
  $('chess-you').textContent='Tú · '+(match.color==='w'?'blancas':'negras');
  $('chess-computer').textContent='Ordenador · '+LEVELS[match.level];
  $('chess-you-piece').innerHTML=pieceSvg('k',match.color);$('chess-computer-piece').innerHTML=pieceSvg('k',other(match.color));
  $('chess-you-row').classList.toggle('current',human()&&!paused&&!end);$('chess-computer-row').classList.toggle('current',!human()&&!paused&&!end);
  for(const [id,color]of [['chess-your-captures',match.color],['chess-computer-captures',other(match.color)]]){
   const root=$(id),captured=history.filter(m=>m.color===color&&m.captured);root.replaceChildren();
   const counts=new Map();for(const m of captured)counts.set(m.captured,(counts.get(m.captured)||0)+1);
   root.setAttribute('aria-label',captured.length?'Piezas capturadas: '+[...counts].map(([type,n])=>PIECE_NAMES[type]+' × '+n).join(', '):'Sin capturas');
   for(const type of ['q','r','b','n','p']){
    const n=counts.get(type);if(!n)continue;
    const span=document.createElement('span');span.innerHTML=pieceSvg(type,other(color))+'<b>×'+n+'</b>';root.append(span);
   }
  }
  const own=[...history].reverse().find(m=>m.color===match.color),bot=[...history].reverse().find(m=>m.color!==match.color);
  $('chess-your-last').textContent=own?moveText(own):'';
  $('chess-computer-last').textContent=bot?moveText(bot):'';
  const recent=$('chess-recent-list');recent.replaceChildren();
  for(const m of history.slice(-6)){const li=document.createElement('li');li.textContent=(m.color===match.color?'Tú':'Ordenador')+' · '+spanishSan(m.san);recent.append(li);}
  $('chess-recent').hidden=!history.length;
  $('chess-recover').hidden=!previous;
  $('chess-result').hidden=!end;
  if(end){
   $('chess-result-title').textContent=end.winner===null?'Tablas':end.winner===match.color?'¡Has ganado, Omar!':'La partida es del ordenador';
   $('chess-result-text').textContent=({mate:'Jaque mate.',stalemate:'Rey ahogado: no hay una jugada legal, pero el rey no está en jaque.',material:'Material insuficiente para dar mate.',fivefold:'La misma posición se ha repetido cinco veces.',seventyfive:'75 movimientos de cada lado sin mover un peón ni capturar.',claim:'Tablas reclamadas por repetición o por 50 movimientos sin peones ni capturas.',resign:'Has dado por terminada esta partida.'})[end.reason]+' Otra partida cuando te apetezca.';
  }
  status();
 }
 function repaint(keyboard=false){render();if(keyboard)focusCell(focusSquare,true);}
 function commit(move,isHuman){
  if(sync()||paused||outcome(game,match.ending))return;
  stop();try{game.move({from:move.from,to:move.to,...(move.promotion?{promotion:move.promotion}:{})});}catch{message('Esa jugada no es válida. Prueba otro destino.');schedule();return;}
  match=packGame(game,match);selected=null;pending=null;focusSquare=move.to;message();save();render();
  if(outcome(game,match.ending)){
   focusResult();
  }else if(isHuman)focusCell(focusSquare,keyboardInput);
  schedule();
 }
 function tryMove(from,to,keyboard=false){
  if(sync()||!active||paused||!human())return;
  const moves=game.moves({square:from,verbose:true}).filter(m=>m.to===to);
  if(!moves.length){message('La pieza vuelve a su sitio. Elige una casilla marcada.');return;}
  if(moves[0].promotion){
   pending={from,to};$('chess-promotion-options').replaceChildren();
   for(const type of ['q','r','b','n']){
    const b=document.createElement('button');b.className='chess-promote comfort-button';b.dataset.promotion=type;b.innerHTML=pieceSvg(type,match.color)+'<span>'+PIECE_NAMES[type]+'</span>';
    b.addEventListener('click',()=>{if(!pending)return;const m={...pending,promotion:type};pending=null;$('chess-promotion-dialog').close();commit(m,true);});$('chess-promotion-options').append(b);
   }
   openDialog('chess-promotion-dialog',board.querySelector('[data-square="'+from+'"]'));return;
  }
  commit(moves[0],true);if(keyboard&&!outcome(game,match.ending))focusCell(to,true);
 }
 function choose(square,keyboard){
  if(sync())return;
  if(paused){message('La partida está en pausa. Pulsa «Continuar partida».');return;}
  if(!human()){message(outcome(game,match.ending)?'La partida ha terminado. Puedes empezar otra.':'Es el turno del ordenador.');return;}
  const p=game.get(square);
  if(selected===square){selected=null;message();repaint(keyboard);return;}
  if(p?.color===match.color){
   selected=square;message(game.moves({square}).length?'':PIECE_NAMES[p.type]+' no tiene ahora un destino legal.');repaint(keyboard);return;
  }
  if(selected)tryMove(selected,square,keyboard);else message('Elige primero una de tus piezas.');
 }
 board.addEventListener('keydown',e=>{
  keyboardInput=true;const b=e.target.closest('[data-square]');if(!b)return;
  const buttons=[...board.children],i=buttons.indexOf(b),row=Math.floor(i/8),col=i%8;
  const nextIndex={ArrowUp:Math.max(0,row-1)*8+col,ArrowDown:Math.min(7,row+1)*8+col,ArrowLeft:row*8+Math.max(0,col-1),ArrowRight:row*8+Math.min(7,col+1),Home:row*8,End:row*8+7}[e.key];
  if(nextIndex!==undefined){e.preventDefault();const next=buttons[nextIndex];focusSquare=next.dataset.square;buttons.forEach(el=>el.tabIndex=el===next?0:-1);next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest'});}
  if(e.key==='Escape'&&selected){e.preventDefault();e.stopPropagation();selected=null;message();repaint(true);}
 });
 board.addEventListener('focusin',e=>{const b=e.target.closest('[data-square]');if(b){focusSquare=b.dataset.square;[...board.children].forEach(el=>el.tabIndex=el===b?0:-1);}});
 function cancelDrag(){
  if(!drag)return;
  $('chess-drag-ghost')?.remove();board.classList.remove('dragging');board.querySelectorAll('.drag-over,.drag-origin').forEach(e=>e.classList.remove('drag-over','drag-origin'));drag=null;
 }
 board.addEventListener('pointerdown',e=>{
  keyboardInput=false;const b=e.target.closest('[data-square]');if(!b||drag||e.isPrimary===false||e.button!==0||sync()||!active||paused||!human()||game.get(b.dataset.square)?.color!==match.color)return;
  drag={id:e.pointerId,from:b.dataset.square,x:e.clientX,y:e.clientY,started:false,button:b,touch:e.pointerType==='touch'};
 });
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.started&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
  if(!drag.started){
   drag.started=true;selected=drag.from;focusSquare=drag.from;const current=drag;drag=null;render();drag=current;
   const source=board.querySelector('[data-square="'+drag.from+'"]');source.classList.add('drag-origin');
   const ghost=document.createElement('div');ghost.id='chess-drag-ghost';ghost.innerHTML=source.innerHTML;ghost.style.width=source.getBoundingClientRect().width+'px';ghost.style.height=source.getBoundingClientRect().height+'px';play.append(ghost);board.classList.add('dragging');
  }
  e.preventDefault();
  const ghost=$('chess-drag-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=(e.clientY-(drag.touch?24:0))+'px';
  board.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
  const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-square]');if(over&&board.contains(over))over.classList.add('drag-over');
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.started){drag=null;return;}
  e.preventDefault();const from=drag.from,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-square]'),to=target&&board.contains(target)?target.dataset.square:null;
  suppressClick=true;setTimeout(()=>suppressClick=false,250);cancelDrag();if(to)tryMove(from,to);else message('La pieza vuelve a su sitio. Suéltala en una casilla marcada.');
 },{passive:false});
 document.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)cancelDrag();});
 window.addEventListener('blur',cancelDrag);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag?.started){e.preventDefault();e.stopImmediatePropagation();cancelDrag();message('Arrastre cancelado.');}},{capture:true});
 function openNew(e){stop();cancelDrag();$('chess-new-color').value=match.color;$('chess-new-level').value=match.level;openDialog('chess-new-dialog',e.currentTarget);}
 $('chess-new').addEventListener('click',openNew);$('chess-again').addEventListener('click',openNew);
 $('chess-start').addEventListener('click',()=>{
  if(sync())return;stop();cancelDrag();if(match.moves.length)previous=match;match=newGame($('chess-new-color').value,$('chess-new-level').value);game=buildGame(match);paused=false;selected=null;pending=null;flipped=match.color==='b';saveView();focusSquare=match.color==='w'?'e2':'e7';message();save();$('chess-new-dialog').close();render();focusCell(focusSquare,true);schedule();
 });
 $('chess-undo').addEventListener('click',()=>{
  if(sync())return;const prior=undoTarget();if(!prior)return;
  const retake=match.ending?.reason==='resign',lastOwn=game.history({verbose:true}).filter(m=>m.color===match.color).at(-1);
  stop();cancelDrag();match=prior;game=buildGame(match);paused=retake;selected=null;pending=null;
  focusSquare=retake?focusSquare:(lastOwn?.from||focusSquare);
  message(retake?'Partida recuperada en pausa. Pulsa «Continuar partida» cuando quieras.':'Última jugada recuperada, incluida la respuesta del ordenador.');
  save();render();focusCell(focusSquare,true);schedule();
 });
 $('chess-recover').addEventListener('click',()=>{
  if(sync()||!previous)return;stop();cancelDrag();[match,previous]=[previous,match];game=buildGame(match);const end=outcome(game,match.ending);paused=!end;selected=null;pending=null;flipped=match.color==='b';saveView();focusSquare=match.color==='w'?'e2':'e7';message(end?(end.reason==='resign'?'Partida anterior recuperada. Puedes retomarla con «Retomar partida».':'Partida anterior recuperada. Puedes ver el resultado y las jugadas.'): 'Partida anterior recuperada en pausa. Pulsa «Continuar partida» cuando quieras.');save();render();if(end)focusResult();else focusCell(focusSquare,true);schedule();
 });
 $('chess-pause').addEventListener('click',()=>{if(sync())return;stop();cancelDrag();paused=!paused;selected=null;message();save();render();schedule();});
 $('chess-options').addEventListener('click',e=>{stop();cancelDrag();$('chess-level').value=match.level;$('chess-resign').disabled=!!outcome(game,match.ending);openDialog('chess-options-dialog',e.currentTarget);});
 $('chess-level').addEventListener('change',()=>{if(sync())return;match.level=$('chess-level').value;save();render();});
 $('chess-flip').addEventListener('click',()=>{flipped=!flipped;selected=null;saveView();render();});
 $('chess-rules').addEventListener('click',e=>{stop();cancelDrag();openDialog('chess-rules-dialog',e.currentTarget);});
 $('chess-resign').addEventListener('click',e=>openDialog('chess-resign-dialog',e.currentTarget));
 $('chess-confirm-resign').addEventListener('click',()=>{
  if(sync()||outcome(game,match.ending))return;stop();match.ending={reason:'resign',color:match.color};save();$('chess-resign-dialog').close();$('chess-options-dialog').close();render();setTimeout(focusResult,0);
 });
 $('chess-claim').addEventListener('click',()=>{if(sync()||paused||!human()||!claimable(game))return;stop();match.ending={reason:'claim'};save();render();focusResult();});
 $('chess-history').addEventListener('click',e=>{
  stop();cancelDrag();const root=$('chess-history-list');root.replaceChildren();const history=game.history({verbose:true});
  history.forEach((m,i)=>{const li=document.createElement('li');li.textContent=(m.color===match.color?'Tú':'Ordenador')+' · '+spanishSan(m.san)+' · '+moveText(m);root.append(li);});
  if(!history.length){const li=document.createElement('li');li.textContent='Todavía no hay jugadas.';root.append(li);}openDialog('chess-history-dialog',e.currentTarget);
 });
 $('expand-chess').addEventListener('click',e=>{
  stop();cancelDrag();zoom.append(play);e.currentTarget.hidden=true;openDialog('chess-zoom-dialog',e.currentTarget);$('close-chess-zoom').focus();zoom.scrollTop=0;render();schedule();
 });
 $('close-chess-zoom').addEventListener('click',()=>zoom.close());
 zoom.addEventListener('close',()=>{cancelDrag();home.append(play);$('expand-chess').hidden=false;render();$('expand-chess').focus({preventScroll:true});schedule();});
 $('chess-promotion-dialog').addEventListener('close',()=>{pending=null;});
 document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',schedule));
 window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue)sync();});
 document.addEventListener('visibilitychange',()=>{cancelDrag();schedule();status();});
 window.addEventListener('pagehide',()=>{stop();cancelDrag();});window.addEventListener('pageshow',schedule);
 render();if(raw.match&&!valid)message('La partida guardada estaba incompleta. Hemos preparado otra; los demás juegos siguen guardados.');save();
 return {setActive(value){active=value;stop();cancelDrag();selected=null;render();schedule();}};
}
