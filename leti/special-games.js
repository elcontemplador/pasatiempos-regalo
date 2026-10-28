import {makeSudoku, sudokuValid, connectFourNew, connectFourPlay, connectFourComputer} from './special-engine.js';
import {readState,saveState} from './storage.js';

// The caller mounts exactly one recipient's game and keeps each prefix unique.
export function mountSpecialGame(root,{person,storagePrefix}={}){
 if(!(root instanceof Element)||!['omar','leti'].includes(person)||!storagePrefix)throw new Error('Falta el contenedor, el destinatario o el prefijo de guardado');
 const key=storagePrefix+'-'+(person==='omar'?'sudoku':'connect-four')+'-v1';
 let previous=readState(key),selected=0,noteMode=false,status='',lastCell=null;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const sudokuArray=(a,min,max)=>Array.isArray(a)&&a.length===81&&a.every(v=>Number.isInteger(v)&&v>=min&&v<=max);
 const sdkValid=x=>x&&sudokuArray(x.board,0,9)&&sudokuArray(x.puzzle,0,9)&&sudokuArray(x.solution,1,9)&&['calma','medio','reto'].includes(x.level)&&Array.isArray(x.notes)&&x.notes.length===81&&x.notes.every(a=>Array.isArray(a)&&a.every(v=>Number.isInteger(v)&&v>=1&&v<=9))&&x.solution.every((n,i)=>sudokuValid(x.solution,i,n)&&(!x.puzzle[i]||(x.puzzle[i]===n&&x.board[i]===n)))&&(!x.undo||(sudokuArray(x.undo.board,0,9)&&Array.isArray(x.undo.notes)&&x.undo.notes.length===81&&x.undo.notes.every(a=>Array.isArray(a)&&a.every(v=>Number.isInteger(v)&&v>=1&&v<=9))));
 function newSudoku(level){let x=makeSudoku(level);return {...x,board:[...x.puzzle],notes:Array.from({length:81},()=>[]),undo:null,previous:null};}
 const cfValid=x=>x&&Array.isArray(x.board)&&x.board.length===42&&x.board.every(v=>[0,1,2].includes(v))&&[1,2].includes(x.turn)&&[0,1,2].includes(x.winner)&&typeof x.draw==='boolean'&&['two','computer'].includes(x.mode);
 const valid=person==='omar'?sdkValid:cfValid;
 let baseline=JSON.stringify(previous);
 let state=person==='omar'?(sdkValid(previous)?previous:newSudoku('calma')):(cfValid(previous)?previous:connectFourNew('two'));
 const save=()=>{const disk=readState(key),serialized=JSON.stringify(disk);if(serialized!==baseline&&valid(disk)){state=disk;baseline=serialized;status='Esta partida se ha actualizado en otra pestaña.';return false;}const ok=saveState(key,state);if(ok)baseline=JSON.stringify(state);return ok;};
 save();
 const label=(n)=>n===1?'rojas':'amarillas';
 function sudokuCell(i){const value=state.board[i],given=!!state.puzzle[i],notes=state.notes[i]||[];const a=Math.floor(i/9)+1,b=i%9+1;
   const title=`Fila ${a}, columna ${b}: ${value?value+(given?', número inicial':''):notes.length?'notas '+notes.join(', '):'vacía'}`;
   return `<button type="button" class="sp-cell${given?' sp-given':''}${i===selected?' sp-selected':''}${i%9===2||i%9===5?' sp-line-r':''}${Math.floor(i/9)===2||Math.floor(i/9)===5?' sp-line-b':''}" data-cell="${i}" aria-label="${title}" aria-pressed="${i===selected}">${value||`<span class="sp-notes">${notes.map(n=>`<span>${n}</span>`).join('')}</span>`}</button>`;
 }
 function renderSudoku(){
 root.innerHTML=`<div class="sp-game"><div class="sp-heading"><div><p class="sp-kicker">UN JUEGO PARA OMAR</p><h2 id="letters-title">Sudoku</h2><p>Elige una casilla y coloca un número del 1 al 9.</p></div><span class="sp-badge">9 × 9</span></div>
 <div class="sp-toolbar"><label>Dificultad <select data-action="level"><option value="calma" ${state.level==='calma'?'selected':''}>Con calma</option><option value="medio" ${state.level==='medio'?'selected':''}>Un poco más</option><option value="reto" ${state.level==='reto'?'selected':''}>Un reto</option></select></label><button type="button" data-action="new">Nueva partida</button><button type="button" data-action="recover" ${state.previous?'':'disabled'}>Recuperar anterior</button></div>
 <div class="sp-sudoku" role="group" aria-label="Tablero de sudoku">${state.board.map((_,i)=>sudokuCell(i)).join('')}</div>
 <div class="sp-digits" aria-label="Números para colocar">${Array.from({length:9},(_,i)=>`<button type="button" data-number="${i+1}" aria-label="Colocar ${i+1}">${i+1}</button>`).join('')}</div>
 <div class="sp-toolbar sp-actions"><button type="button" data-action="note" aria-pressed="${noteMode}">✎ Notas: ${noteMode?'activadas':'desactivadas'}</button><button type="button" data-action="erase">Borrar</button><button type="button" data-action="undo" ${state.undo?'':'disabled'}>Deshacer</button><button type="button" data-action="hint">Dame una pista</button><button type="button" data-action="check">Comprobar</button></div>
 <p class="sp-status" role="status" aria-live="polite">${status||'Cada fila, columna y cuadrado contiene los números del 1 al 9.'}</p></div>`;
 }
 function renderConnect(){let turn=state.winner?`¡Ganan las ${label(state.winner)}!`:state.draw?'¡Empate! El tablero está completo.':`Turno de las ${label(state.turn)}${state.mode==='computer'&&state.turn===2?' (ordenador)':''}.`;
 root.innerHTML=`<div class="sp-game"><div class="sp-heading"><div><p class="sp-kicker">UN JUEGO PARA LETI</p><h2 id="letters-title">Cuatro en raya</h2><p>Toca una columna del tablero o su flecha para colocar una ficha.</p></div><span class="sp-badge">PARA COMPARTIR</span></div>
 <div class="sp-toolbar"><label>Modo <select data-action="mode"><option value="two" ${state.mode==='two'?'selected':''}>Dos personas</option><option value="computer" ${state.mode==='computer'?'selected':''}>Contra el ordenador</option></select></label><button type="button" data-action="new">Nueva partida</button><button type="button" data-action="recover" ${state.previous?'':'disabled'}>Recuperar anterior</button></div>
 <p class="sp-status" role="status" aria-live="polite">${status||turn}</p><div class="sp-column-controls" aria-label="Elige una columna">${Array.from({length:7},(_,i)=>`<button type="button" data-col="${i}" aria-label="Colocar ficha en la columna ${i+1}" ${state.board[i]||state.winner||state.draw?'disabled':''}>↓<span class="sp-sr-only"> Columna ${i+1}</span></button>`).join('')}</div>
 <div class="sp-connect" role="group" aria-label="Tablero de cuatro en raya. ${turn}">${state.board.map((v,i)=>`<div class="sp-hole sp-hole-${v}" data-play-col="${i%7}" role="img" aria-label="Fila ${Math.floor(i/7)+1}, columna ${i%7+1}: ${v?label(v):'vacía'}" title="Fila ${Math.floor(i/7)+1}, columna ${i%7+1}: ${v?label(v):'vacía'}">${v===1?'<span>●</span>':v===2?'<span>✦</span>':''}</div>`).join('')}</div>
 <p class="sp-caption">${state.mode==='two'?'Rojas y amarillas juegan en el mismo dispositivo.':'Tú juegas con las rojas; el ordenador, con las amarillas.'}</p></div>`;
 }
 function render(){const a=document.activeElement,inside=root.contains(a),d=inside?a.dataset:{};const selector=d.cell!==undefined?`[data-cell="${d.cell}"]`:d.number!==undefined?`[data-number="${d.number}"]`:d.col!==undefined?`[data-col="${d.col}"]`:d.action?`[data-action="${d.action}"]`:null;if(person==='omar')renderSudoku();else renderConnect();if(inside){let focus=selector&&root.querySelector(selector);if(!focus||focus.disabled)focus=person==='omar'?root.querySelector(`[data-cell="${selected}"]`):root.querySelector('[data-action="new"]');focus?.focus({preventScroll:true});}}
 window.addEventListener('storage',event=>{if(event.key!==key)return;const latest=readState(key);if(valid(latest)){state=latest;baseline=JSON.stringify(latest);status='Esta partida se ha actualizado en otra pestaña.';render();}});
 function changeValue(value){if(state.puzzle[selected]){status='Esta casilla ya viene dada. Elige otra.';render();return;}
   state.undo={board:[...state.board],notes:clone(state.notes)};
   if(noteMode&&value){const notes=state.notes[selected]||[];state.notes[selected]=notes.includes(value)?notes.filter(n=>n!==value):[...notes,value].sort();state.board[selected]=0;}
   else{state.board[selected]=value;state.notes[selected]=[];}
   status=state.board.every((v,i)=>v===state.solution[i])?'¡Sudoku completado!':value?'Número colocado.':'Casilla borrada.';save();render();
 }
 function playColumn(column){const old=state;state=connectFourPlay(state,column);if(state===old)return;if(state.mode==='computer'&&!state.winner&&!state.draw)state=connectFourComputer(state);status='';save();render();}
 root.addEventListener('click',event=>{const hole=event.target.closest('[data-play-col]');if(person==='leti'&&hole&&root.contains(hole)){playColumn(Number(hole.dataset.playCol));return;}const b=event.target.closest('button');if(!b||!root.contains(b))return;b.focus({preventScroll:true});
  if(b.dataset.cell!==undefined){selected=Number(b.dataset.cell);status='';render();root.querySelector(`[data-cell="${selected}"]`)?.focus();return;}
  if(b.dataset.number){changeValue(Number(b.dataset.number));return;}
  if(b.dataset.col!==undefined){playColumn(Number(b.dataset.col));return;}
  switch(b.dataset.action){
   case 'new': {const old=clone(state);old.previous=null;state=person==='omar'?newSudoku(state.level):connectFourNew(state.mode);state.previous=old;status='Nueva partida preparada.';break;}
   case 'recover': {if(!valid(state.previous)){state.previous=null;status='No hay una partida anterior recuperable.';break;}const old=clone(state);old.previous=null;state=state.previous;state.previous=old;status='Partida anterior recuperada.';break;}
   case 'note':noteMode=!noteMode;status=noteMode?'Modo notas activado.':'Modo notas desactivado.';break;
   case 'erase':changeValue(0);return;
   case 'undo':if(!state.undo)return;state.board=state.undo.board;state.notes=state.undo.notes;state.undo=null;status='Último cambio deshecho.';break;
   case 'hint':{let i=selected;if(state.puzzle[i]||state.board[i]===state.solution[i])i=state.board.findIndex((n,j)=>n!==state.solution[j]);if(i<0){status='Ya has completado el sudoku.';break;}selected=i;noteMode=false;changeValue(state.solution[i]);status='Pista colocada en la casilla seleccionada.';render();return;}
   case 'check':{const wrong=state.board.reduce((a,n,i)=>a+(n!==0&&n!==state.solution[i]?1:0),0);status=wrong?`Hay ${wrong} ${wrong===1?'número que no coincide':'números que no coinciden'} con la solución.`:state.board.every(Boolean)?'¡Sudoku completado!':'Por ahora, todos los números colocados son correctos.';break;}
   default:return;
  }save();render();
 });
 root.addEventListener('change',event=>{if(event.target.dataset.action==='level'&&person==='omar'){const old=clone(state);old.previous=null;state=newSudoku(event.target.value);state.previous=old;selected=0;status='Nueva dificultad y tablero preparados.';save();render();}else if(event.target.dataset.action==='mode'&&person==='leti'){const old=clone(state);old.previous=null;state=connectFourNew(event.target.value);state.previous=old;status='Modo cambiado. Nueva partida preparada.';save();render();}});
 root.addEventListener('keydown',event=>{const cell=event.target.closest('[data-cell]');if(person!=='omar'||!cell||event.ctrlKey||event.metaKey||event.altKey)return;selected=Number(cell.dataset.cell);const key=event.key;if(/^[1-9]$/.test(key)){event.preventDefault();changeValue(Number(key));root.querySelector(`[data-cell="${selected}"]`)?.focus();}else if(['Backspace','Delete','0'].includes(key)){event.preventDefault();changeValue(0);root.querySelector(`[data-cell="${selected}"]`)?.focus();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){event.preventDefault();const row=Math.floor(selected/9),col=selected%9;selected=key==='ArrowLeft'?row*9+Math.max(0,col-1):key==='ArrowRight'?row*9+Math.min(8,col+1):key==='ArrowUp'?Math.max(0,row-1)*9+col:Math.min(8,row+1)*9+col;render();root.querySelector(`[data-cell="${selected}"]`)?.focus();}});
 render();return {getState:()=>clone(state)};
}
