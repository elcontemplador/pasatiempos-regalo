import {mountSpecialGame} from './special-games.js';
import {mountCardGame} from './card-games.js';
import {createStateSession} from './state-session.js?v=37';
import {initChess} from './chess.js?v=36';
import {initDomino} from './domino.js?v=34';
import {cleanRecoveries,wordRecovery,puzzleRecovery} from './recovery.js?v=28';
import {initSharing} from './share.js?v=22';
import {initLetters} from './letters.js?v=37';
import {themes,photos,normalize,makeWordSearch,matchWord,newPuzzle,swapTiles,puzzleSolved} from './engine.js?v=28';
import {initQuiz} from './quiz.js?v=37';
import {asRecord,readState,saveState} from './storage.js?v=22';
import {initOffline} from './offline.js?v=22';
const GAMES=['words','puzzle','quiz','letters','sudoku','domino','chess','tute','mus'];
const $=id=>document.getElementById(id),KEY='regalo-chuchi-v1';
import {icon} from './icons.js?v=22';
let stored=readState(KEY);
const RECOVERY_KEY='regalo-chuchi-recovery-v1';let recoveries=cleanRecoveries(readState(RECOVERY_KEY),themes,photos);
function saveRecoveries(){return recoverySession.write(recoveries);}
let theme=themes.find(t=>t.id===stored.theme)||themes[0],difficulty=stored.difficulty==='reto'?'reto':'calma',photo=photos.find(p=>p.id===stored.photo)||photos[0],size=stored.size===4?4:3,mode=GAMES.includes(stored.mode)?stored.mode:'words';
let board,found=[],foundPaths={},wordFirst=null,hintCell=null,hintTimer,puzzle,selected=null,moves=0;
const dialogTriggers=new WeakMap();
let wordStates=asRecord(stored.wordStates),puzzleStates=asRecord(stored.puzzleStates);
function wordKey(){return `${theme.id}-${difficulty}`;}function puzzleKey(){return `${photo.id}-${size}`;}
const gameSession=createStateSession(KEY,['wordStates','puzzleStates'],adoptGames);
const recoverySession=createStateSession(RECOVERY_KEY,['words','puzzles'],value=>{recoveries=cleanRecoveries(value,themes,photos);if(board)paintWords();if(puzzle)paintPuzzle();});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function adoptGames(value,external){
 const ownWord=board?{seed:board.seed,found,paths:foundPaths,...(board.version===2?{version:2}:{})}:null,ownPuzzle=puzzle?{tiles:puzzle,moves}:null;
 wordStates={...asRecord(value.wordStates)};puzzleStates={...asRecord(value.puzzleStates)};
 const w=wordStates[wordKey()],p=puzzleStates[puzzleKey()];
 if(ownWord&&(!Number.isSafeInteger(w?.seed)||!Array.isArray(w?.found)))wordStates[wordKey()]=ownWord;
 if(ownPuzzle&&(!validTiles(p?.tiles)||!Number.isSafeInteger(p?.moves)||p.moves<0))puzzleStates[puzzleKey()]=ownPuzzle;
 const changedWord=ownWord&&!equal(ownWord,wordStates[wordKey()]),changedPuzzle=ownPuzzle&&!equal(ownPuzzle,puzzleStates[puzzleKey()]);
 if(changedWord)loadWords();if(changedPuzzle)loadPuzzle();
 if(external&&(changedWord||changedPuzzle))say('El tablero se ha actualizado desde otra pestaña. Puedes seguir jugando aquí.');
 return !!(changedWord||changedPuzzle);
}
function syncGames(){const changed=gameSession.sync();recoverySession.sync();return changed;}
function save(){wordStates[wordKey()]={seed:board.seed,found,paths:foundPaths,...(board.version===2?{version:2}:{})};puzzleStates[puzzleKey()]={tiles:puzzle,moves};return gameSession.write({theme:theme.id,difficulty,photo:photo.id,size,mode,wordStates,puzzleStates});}
window.addEventListener('storage',e=>{if(e.key===KEY)syncGames();if(e.key===RECOVERY_KEY)recoverySession.sync();});
window.addEventListener('focus',syncGames);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncGames();});
function say(text){$('announcement').classList.toggle('sr-only',mode==='words'||mode==='puzzle');$('announcement').textContent=text;$('word-feedback').textContent=mode==='words'?text:'';$('puzzle-feedback').textContent=mode==='puzzle'?text:'';$('puzzle-zoom-announcement').textContent=$('puzzle-zoom-dialog').open?text:'';}
const wordListPanel=document.querySelector('.word-list-panel');
function adaptWordList(){wordListPanel.classList.toggle('not-sticky',wordListPanel.getBoundingClientRect().height>innerHeight*.32);}
if('ResizeObserver'in window)new ResizeObserver(adaptWordList).observe(wordListPanel);
window.addEventListener('resize',adaptWordList);
function revealLetter(button,center=false){
 adaptWordList();button.focus({preventScroll:true});button.scrollIntoView({block:center?'center':'nearest',inline:'nearest',behavior:'auto'});
 const cover=getComputedStyle(wordListPanel).position==='sticky'?Math.max(0,wordListPanel.getBoundingClientRect().bottom):0;
 const top=button.getBoundingClientRect().top;if(top<cover+12)window.scrollBy({top:top-cover-12,behavior:'auto'});
}
function loadWords(reset=false){const saved=!reset&&wordStates[wordKey()];board=makeWordSearch(theme.words,{difficulty,seed:Number.isSafeInteger(saved?.seed)?saved.seed:Date.now()+Math.floor(Math.random()*100000),version:saved?(saved.version===2?2:1):2});found=Array.isArray(saved?.found)?[...new Set(saved.found.filter(t=>board.placements.some(p=>p.text===t)))]:[];foundPaths={};for(const text of found){const cells=saved?.paths?.[text];if(Array.isArray(cells)&&cells.every(i=>Number.isInteger(i)&&i>=0&&i<board.grid.length)){const hit=matchWord(board,cells[0],cells.at(-1));if(hit?.text===text&&JSON.stringify(hit.cells)===JSON.stringify(cells))foundPaths[text]=cells;}}wordFirst=null;hintCell=null;clearTimeout(hintTimer);renderWords();}
function validTiles(tiles){return Array.isArray(tiles)&&tiles.length===size*size&&new Set(tiles).size===size*size&&tiles.every(v=>Number.isInteger(v)&&v>=0&&v<size*size);}
function loadPuzzle(reset=false){const saved=!reset&&puzzleStates[puzzleKey()];puzzle=validTiles(saved?.tiles)?[...saved.tiles]:newPuzzle(size);moves=Number.isSafeInteger(saved?.moves)&&saved.moves>=0?saved.moves:0;selected=null;renderPuzzle();}
function renderThemes(){const root=$('themes'),focused=root.contains(document.activeElement)?document.activeElement.dataset.theme:null;root.replaceChildren();themes.forEach(t=>{const b=document.createElement('button');b.className='theme-button'+(theme.id===t.id?' active':'');b.setAttribute('aria-pressed',String(theme.id===t.id));b.dataset.theme=t.id;b.innerHTML=icon(t.icon)+`<span>${t.short}<small>${t.words.length} ${t.unit||'palabras'}</small></span>`;b.addEventListener('click',()=>{syncGames();save();theme=t;loadWords();renderThemes();save();say('');});root.append(b);});if(focused)root.querySelector(`[data-theme="${focused}"]`)?.focus({preventScroll:true});}
function renderWords(){
  $('word-title').textContent=theme.title;$('word-description').textContent=theme.subtitle;
  $('word-list-title').textContent=theme.unit==='títulos'?'Títulos a encontrar':'Palabras a encontrar';
  $('word-instruction').textContent=difficulty==='calma'?'Toca la primera y la última letra. Busca hacia la derecha y hacia abajo.':'Toca la primera y la última letra. También hay diagonales y palabras al revés.';
  document.querySelectorAll('[name="difficulty"]').forEach(r=>r.checked=r.value===difficulty);
  const grid=$('word-grid');grid.replaceChildren();grid.style.setProperty('--word-cols',board.cols);grid.setAttribute('aria-label',`${theme.title}. Tablero de ${board.rows} filas y ${board.cols} columnas.`);
  board.grid.forEach((letter,i)=>{const b=document.createElement('button');b.className='letter';b.textContent=letter;b.dataset.index=i;b.tabIndex=i===0?0:-1;b.setAttribute('aria-label',`${letter}, fila ${Math.floor(i/board.cols)+1}, columna ${i%board.cols+1}`);b.addEventListener('click',()=>chooseLetter(i));grid.append(b);});paintWords();
}
function paintWords(){
  const colors=new Map();found.forEach((text,n)=>{const cells=foundPaths[text]||board.placements.find(p=>p.text===text)?.cells;cells?.forEach(c=>colors.set(c,n%4));});
  [...$('word-grid').children].forEach((b,i)=>{b.classList.toggle('found',colors.has(i));b.classList.toggle('picked',i===wordFirst);b.classList.toggle('hinted',i===hintCell);b.dataset.color=colors.get(i)??'';b.setAttribute('aria-pressed',String(i===wordFirst));b.setAttribute('aria-label',`${i===hintCell?'Pista: ':''}${board.grid[i]}, fila ${Math.floor(i/board.cols)+1}, columna ${i%board.cols+1}`);});
  const list=$('word-list');list.replaceChildren();theme.words.forEach(label=>{const li=document.createElement('li');const done=found.includes(normalize(label));li.className=done?'done':'';const check=document.createElement('span');check.className='word-check';check.textContent='✓';check.setAttribute('aria-hidden','true');const name=document.createElement('span');name.className='word-name';const entry=board.placements.find(p=>p.text===normalize(label));name.textContent=entry?.search&&entry.search!==entry.text?`${label} · buscar ${entry.search}`:label;li.append(check,name);if(done)li.setAttribute('aria-label',label+', encontrada');list.append(li);});
  updateWordToggle();
  $('word-progress').textContent=`${found.length} de ${theme.words.length} encontradas`;
  $('word-win').hidden=found.length!==theme.words.length;$('word-hint').disabled=found.length===theme.words.length;
  $('word-recovery-tools').hidden=!recoveries.words[wordKey()];
}
function chooseLetter(i){
  if(syncGames())return;
  if(found.length===theme.words.length)return;
  if(wordFirst===null){wordFirst=i;hintCell=null;paintWords();say('Ahora toca la última letra de la palabra.');return;}
  if(wordFirst===i){wordFirst=null;paintWords();say('Selección cancelada.');return;}
  const hit=matchWord(board,wordFirst,i);wordFirst=null;hintCell=null;
  if(hit&&!found.includes(hit.text)){found.push(hit.text);foundPaths[hit.text]=hit.cells;say(found.length===theme.words.length?'¡Enhorabuena, Chuchi! Has encontrado todas las palabras.':`¡${hit.label}! Una más encontrada.`);save();}
  else if(hit){say('Esa palabra ya está encontrada. Vamos a por otra.');}
  else{say('No es una de las palabras. Prueba otra vez, sin prisa.');}
  paintWords();if(found.length===theme.words.length){$('word-win').focus({preventScroll:true});$('word-win').scrollIntoView({block:'nearest'});}
}
$('word-grid').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i))return;const offsets={ArrowUp:-board.cols,ArrowDown:board.cols,ArrowLeft:-1,ArrowRight:1};if(e.key==='Escape'){wordFirst=null;hintCell=null;paintWords();say('Selección cancelada.');return;}if(e.key in offsets){e.preventDefault();const next=Math.min(board.grid.length-1,Math.max(0,i+offsets[e.key]));e.target.tabIndex=-1;const target=$('word-grid').children[next];target.tabIndex=0;revealLetter(target);}});
$('word-grid').addEventListener('focusin',e=>{if(e.target.classList.contains('letter')){[...$('word-grid').children].forEach(b=>b.tabIndex=b===e.target?0:-1);}});
$('word-hint').addEventListener('click',()=>{if(syncGames())return;const next=board.placements.find(p=>!found.includes(p.text));if(!next)return;wordFirst=null;hintCell=next.cells[0];paintWords();revealLetter($('word-grid').children[hintCell],true);say(`Busca «${next.label}». Primera letra: fila ${Math.floor(hintCell/board.cols)+1}, columna ${hintCell%board.cols+1}, marcada en amarillo.`);clearTimeout(hintTimer);hintTimer=setTimeout(()=>{hintCell=null;paintWords();},12000);});
function newWords(){if(syncGames())return;const previous=wordRecovery({seed:board.seed,found,paths:foundPaths,...(board.version===2?{version:2}:{})},theme.words);if(previous){recoveries.words[wordKey()]=previous;saveRecoveries();}loadWords(true);save();say('Un tablero nuevo, cuando tú quieras.');revealLetter($('word-grid').firstElementChild);}
$('new-word').addEventListener('click',newWords);$('word-again').addEventListener('click',newWords);
$('word-recover').addEventListener('click',()=>{
 if(syncGames())return;
 const previous=recoveries.words[wordKey()];if(!previous)return;
 wordStates[wordKey()]=previous;loadWords();
 if(save()){delete recoveries.words[wordKey()];saveRecoveries();paintWords();}
 say('Tablero anterior recuperado, con las palabras que habías encontrado.');
 if(found.length===theme.words.length){$('word-win').focus({preventScroll:true});$('word-win').scrollIntoView({block:'nearest'});}else revealLetter($('word-grid').firstElementChild);
});
document.querySelectorAll('[name="difficulty"]').forEach(r=>r.addEventListener('change',()=>{syncGames();save();difficulty=r.value;loadWords();save();say('');}));
function renderPhotos(){const root=$('photo-options'),focused=root.contains(document.activeElement)?document.activeElement.dataset.photo:null;root.replaceChildren();photos.forEach(p=>{const b=document.createElement('button');b.className='photo-option'+(photo.id===p.id?' active':'');b.setAttribute('aria-pressed',String(photo.id===p.id));b.dataset.photo=p.id;const img=document.createElement('img');img.src=p.thumb;img.alt=p.alt;img.loading='lazy';img.decoding='async';img.width=360;img.height=Math.round(360*p.height/p.width);const label=document.createElement('span');label.textContent=p.title;b.append(img,label);b.addEventListener('click',()=>{syncGames();save();photo=p;loadPuzzle();renderPhotos();save();say('');$('gallery-dialog').close();});root.append(b);});if(focused)root.querySelector(`[data-photo="${focused}"]`)?.focus({preventScroll:true});}
function renderPuzzle(){
  $('chosen-photo').src=photo.thumb;$('chosen-photo').alt=photo.alt;$('chosen-title').textContent=photo.title;
  const credit=$('photo-credit');credit.replaceChildren();credit.hidden=!photo.attribution;
  if(photo.attribution){const a=photo.attribution;credit.append(document.createTextNode('Foto: '+a.author+' · '));const source=document.createElement('a');source.href=a.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Fuente';credit.append(source,document.createTextNode(' · '));const license=document.createElement('a');license.href=a.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';license.textContent=a.license;credit.append(license,document.createTextNode(' · adaptada en tamaño para el puzle.'));}

  $('puzzle-title').textContent=photo.title;document.querySelectorAll('[name="pieces"]').forEach(r=>r.checked=Number(r.value)===size);
  const root=$('puzzle-board');root.replaceChildren();root.style.setProperty('--pieces',size);root.parentElement.style.setProperty('--photo-padding',`${photo.height/photo.width*100}%`);
  puzzle.forEach((tile,index)=>{const b=document.createElement('button');b.className='puzzle-piece';b.dataset.index=index;b.setAttribute('aria-label',`Pieza ${tile+1}, posición ${index+1}`);b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src=photo.src;img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');img.style.width=img.style.height=`${size*100}%`;img.style.left=`${-(tile%size)*100}%`;img.style.top=`${-Math.floor(tile/size)*100}%`;b.append(img);b.addEventListener('click',()=>choosePiece(index));root.append(b);});paintPuzzle();queuePuzzleFit();
}
function paintPuzzle(){const solved=puzzleSolved(puzzle);[...$('puzzle-board').children].forEach((b,i)=>{b.classList.toggle('selected',i===selected);b.setAttribute('aria-pressed',String(i===selected));b.disabled=solved;});$('puzzle-board').classList.toggle('solved',solved);$('puzzle-progress').textContent=`${puzzle.filter((v,i)=>v===i).length} de ${size*size} en su sitio · ${moves} ${moves===1?'cambio':'cambios'}`;$('puzzle-win').hidden=!solved;$('puzzle-recovery-tools').hidden=!recoveries.puzzles[puzzleKey()];}
function choosePiece(index){if(syncGames())return;if(puzzleSolved(puzzle))return;if(selected===null){selected=index;paintPuzzle();say('Elige la pieza con la que quieres intercambiarla.');return;}if(selected===index){selected=null;paintPuzzle();say('Selección cancelada.');return;}puzzle=swapTiles(puzzle,selected,index);moves++;selected=null;renderPuzzle();save();if(puzzleSolved(puzzle)){say('¡Puzle completo! ¡Felicidades, Chuchi!');$('puzzle-win').focus({preventScroll:true});$('puzzle-win').scrollIntoView({block:'nearest'});}else{say('Piezas intercambiadas.');$('puzzle-board').children[index].focus({preventScroll:true});}}
function newPhotoPuzzle(){if(syncGames())return;const previous=puzzleRecovery({tiles:puzzle,moves},size);if(previous){recoveries.puzzles[puzzleKey()]=previous;saveRecoveries();}loadPuzzle(true);save();say('Las piezas están mezcladas. ¡A jugar!');const first=$('puzzle-board').firstElementChild;first.focus({preventScroll:true});first.scrollIntoView({block:'nearest'});}
$('new-puzzle').addEventListener('click',newPhotoPuzzle);$('puzzle-again').addEventListener('click',newPhotoPuzzle);
$('puzzle-recover').addEventListener('click',()=>{
 if(syncGames())return;
 const previous=recoveries.puzzles[puzzleKey()];if(!previous)return;
 puzzleStates[puzzleKey()]=previous;loadPuzzle();
 if(save()){delete recoveries.puzzles[puzzleKey()];saveRecoveries();paintPuzzle();}
 say('Puzle anterior recuperado, con las piezas y los cambios que llevabas.');
 const focus=puzzleSolved(puzzle)?$('puzzle-win'):$('puzzle-board').firstElementChild;focus.focus({preventScroll:true});focus.scrollIntoView({block:'nearest'});
});
document.querySelectorAll('[name="pieces"]').forEach(r=>r.addEventListener('change',()=>{syncGames();save();size=Number(r.value);loadPuzzle();save();say('');}));
function switchMode(next){syncGames();mode=next;GAMES.forEach(m=>{$(m+'-view').hidden=m!==next;$('tab-'+m).classList.toggle('active',m===next);$('tab-'+m).setAttribute('aria-pressed',String(m===next));});domino.setActive(next==='domino');chess.setActive(next==='chess');tute.setActive(next==='tute');mus.setActive(next==='mus');say('');if(board&&puzzle)save();}
// En móvil, acercar la navegación al juego sin cambiar sus guardados.
const mobileLayout=window.matchMedia('(max-width:680px), (max-width:960px) and (pointer:coarse)');
const mobileNav=$('mobile-nav'),gameMenu=$('game-menu');
function showMobileNav(show){
 mobileNav.hidden=!show;
 document.documentElement.style.setProperty('--mobile-nav-height',show?mobileNav.getBoundingClientRect().height+'px':'0px');
}
function updateMobileNav(){
 $('mobile-game-label').textContent=$('tab-'+mode).lastElementChild.firstChild.textContent.trim();
 showMobileNav(mobileLayout.matches&&gameMenu.getBoundingClientRect().bottom<=0);
}
let mobileNavQueued=false;
function queueMobileNav(){if(mobileNavQueued)return;mobileNavQueued=true;requestAnimationFrame(()=>{mobileNavQueued=false;updateMobileNav();});}
window.addEventListener('scroll',queueMobileNav,{passive:true});window.addEventListener('resize',queueMobileNav);
function mobileGoTo(el){if(!mobileLayout.matches)return;showMobileNav(true);el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'start',behavior:'auto'});queueMobileNav();}
$('mobile-games').addEventListener('click',()=>{gameMenu.focus({preventScroll:true});gameMenu.scrollIntoView({block:'start',behavior:'auto'});queueMobileNav();});
gameMenu.addEventListener('click',event=>{if(event.target.closest('.game-tab')){updateMobileNav();mobileGoTo($('main'));}});
$('themes').addEventListener('click',event=>{if(event.target.closest('[data-theme]'))mobileGoTo($('word-title'));});
$('quiz-topics').addEventListener('click',event=>{if(event.target.closest('[data-quiz-topic]'))mobileGoTo($('quiz-title'));});
function updateWordToggle(){const collapsed=wordListPanel.classList.contains('words-collapsed');$('word-list-toggle').setAttribute('aria-expanded',String(!collapsed));$('word-list-toggle').textContent=(collapsed?'Ver palabras':'Ocultar palabras')+` · ${found.length}/${theme.words.length}`;}
$('word-list-toggle').addEventListener('click',()=>{wordListPanel.classList.toggle('words-collapsed');updateWordToggle();adaptWordList();});
$('word-zoom').addEventListener('click',()=>{const active=$('word-grid').classList.toggle('word-grid-zoomed');$('word-zoom').setAttribute('aria-pressed',String(active));$('word-zoom').textContent=active?'Ver tablero completo':'Ampliar casillas';$('word-zoom-help').hidden=!active;});
$('word-jump').addEventListener('click',()=>{wordListPanel.classList.add('words-collapsed');updateWordToggle();adaptWordList();mobileGoTo($('word-grid'));});
$('tab-words').addEventListener('click',()=>switchMode('words'));$('tab-puzzle').addEventListener('click',()=>switchMode('puzzle'));
$('tab-quiz').addEventListener('click',()=>switchMode('quiz'));
$('tab-domino').addEventListener('click',()=>switchMode('domino'));
$('tab-chess').addEventListener('click',()=>switchMode('chess'));
$('tab-letters').addEventListener('click',()=>switchMode('letters'));$('tab-sudoku').addEventListener('click',()=>switchMode('sudoku'));
$('tab-tute').addEventListener('click',()=>switchMode('tute'));$('tab-mus').addEventListener('click',()=>switchMode('mus'));
function openDialog(id,trigger){const d=$(id);dialogTriggers.set(d,trigger);d.showModal();}
$('show-photo').addEventListener('click',e=>{$('reference-title').textContent=photo.title;$('reference-photo').src=photo.src;$('reference-photo').alt=photo.alt;openDialog('photo-dialog',e.currentTarget);});
$('change-photo').addEventListener('click',e=>openDialog('gallery-dialog',e.currentTarget));
$('install-help').addEventListener('click',e=>openDialog('help-dialog',e.currentTarget));
// Move the existing board: enlargement never starts or duplicates a game.
const puzzlePlay=$('puzzle-play'),puzzleHome=puzzlePlay.parentElement,zoomDialog=$('puzzle-zoom-dialog');
let puzzleFitQueued=false;
function fitPuzzle(){
 if(!zoomDialog.open)return;
 const surface=$('puzzle-board').parentElement,z=zoomDialog.getBoundingClientRect(),r=surface.getBoundingClientRect();
 const top=r.top-z.top+zoomDialog.scrollTop;
 const remaining=zoomDialog.clientHeight-top-document.querySelector('.puzzle-bottom').getBoundingClientRect().height-$('puzzle-feedback').getBoundingClientRect().height-42;
 const large=parseFloat(getComputedStyle(document.documentElement).fontSize)>20;
 const width=large?1100:Math.max(300,Math.min(1100,remaining*photo.width/photo.height));
 if(Math.abs(parseFloat(puzzlePlay.style.getPropertyValue('--puzzle-fit-width'))-width)>1||!puzzlePlay.style.getPropertyValue('--puzzle-fit-width'))puzzlePlay.style.setProperty('--puzzle-fit-width',width+'px');
}
function queuePuzzleFit(){if(puzzleFitQueued)return;puzzleFitQueued=true;requestAnimationFrame(()=>{puzzleFitQueued=false;fitPuzzle();});}
window.addEventListener('resize',queuePuzzleFit);
if(window.ResizeObserver){const observer=new ResizeObserver(queuePuzzleFit);for(const el of [zoomDialog,zoomDialog.querySelector('.puzzle-zoom-heading'),puzzlePlay.querySelector('.game-toolbar'),document.querySelector('.puzzle-bottom'),$('puzzle-feedback')])observer.observe(el);}
$('expand-puzzle').addEventListener('click',e=>{
 $('puzzle-zoom-title').textContent=photo.title;zoomDialog.append(puzzlePlay);e.currentTarget.hidden=true;
 openDialog('puzzle-zoom-dialog',e.currentTarget);$('close-puzzle-zoom').focus();zoomDialog.scrollTop=0;queuePuzzleFit();
});
$('close-puzzle-zoom').addEventListener('click',()=>zoomDialog.close());
zoomDialog.addEventListener('close',()=>{puzzleHome.append(puzzlePlay);$('expand-puzzle').hidden=false;});
document.querySelectorAll('dialog').forEach(d=>{d.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.addEventListener('click',()=>d.close()));d.addEventListener('close',()=>dialogTriggers.get(d)?.focus());d.addEventListener('click',e=>{if(e.target===d){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)d.close();}});});
loadWords();loadPuzzle();renderThemes();renderPhotos();const quiz=initQuiz(),letters=initLetters(),domino=initDomino(openDialog),chess=initChess(openDialog),tute=mountCardGame($('tute-view'),{kind:'tute',storagePrefix:'regalo-chuchi-'}),mus=mountCardGame($('mus-view'),{kind:'mus',storagePrefix:'regalo-chuchi-'});mountSpecialGame($('sudoku-view'),{person:'chuchi',storagePrefix:'regalo-chuchi',game:'sudoku'});switchMode(mode);updateMobileNav();
initOffline();
initSharing(openDialog);

const PREFS='regalo-chuchi-preferences-v1';
let largeText=readState(PREFS).largeText===true;
function applyTextSize(){document.documentElement.classList.toggle('large-text',largeText);$('large-text').setAttribute('aria-pressed',String(largeText));adaptWordList();}
applyTextSize();
$('large-text').addEventListener('click',()=>{largeText=!largeText;applyTextSize();saveState(PREFS,{largeText});say(largeText?'Letra grande activada.':'Tamaño de letra habitual.');});
const pick=items=>items[Math.floor(Math.random()*items.length)];
$('surprise').addEventListener('click',()=>{
 syncGames();save();const next=pick(GAMES);let title;
 if(next==='words'){
  const available=themes.filter(t=>t.id!==theme.id&&((wordStates[`${t.id}-${difficulty}`]?.found?.length||0)<t.words.length));
  const alternatives=themes.filter(t=>t.id!==theme.id);theme=pick(available.length?available:alternatives.length?alternatives:themes);loadWords();renderThemes();title=theme.title;
 }else if(next==='puzzle'){
  const available=photos.filter(p=>{const tiles=puzzleStates[`${p.id}-${size}`]?.tiles;return p.id!==photo.id&&(!validTiles(tiles)||!puzzleSolved(tiles));});
  const alternatives=photos.filter(p=>p.id!==photo.id);photo=pick(available.length?available:alternatives.length?alternatives:photos);loadPuzzle();renderPhotos();title=photo.title;
 }else if(next==='quiz')title=quiz.surprise();else if(next==='letters')title=letters.surprise();else if(next==='sudoku')title='Sudoku';else title={chess:'Una partida de ajedrez',domino:'Dominó por parejas',tute:'Una partida de tute',mus:'Una partida de mus'}[next];
 switchMode(next);updateMobileNav();const heading=$(next==='words'?'word-title':next==='puzzle'?'puzzle-title':next==='quiz'?'quiz-title':next==='letters'?'letters-title':next+'-title');if(mobileLayout.matches)mobileGoTo(heading);else{heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}say(`Te propongo: ${title}. ¡A disfrutar!`);
});
