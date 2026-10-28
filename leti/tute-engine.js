// Tute por parejas: reglas, decisiones públicas y recuperación por repetición.
const SUITS=['oros','copas','espadas','bastos'];
const RANKS=[1,2,3,4,5,6,7,10,11,12];
const ORDER=[2,4,5,6,7,10,11,12,3,1];
const POINTS={1:11,3:10,12:4,11:3,10:2};
const NAMES=['Tú','Rival derecho','Tu compañero','Rival izquierdo'];
const team=seat=>seat%2;
const copy=value=>JSON.parse(JSON.stringify(value));
const suit=id=>SUITS[Math.floor(id/10)];
const rank=id=>RANKS[id%10];
const strength=id=>ORDER.indexOf(rank(id));
const textCard=id=>`${({1:'As',10:'Sota',11:'Caballo',12:'Rey'})[rank(id)]||rank(id)} de ${suit(id)}`;
export const cardPoints=id=>POINTS[rank(id)]||0;
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
function deck(seed){const random=rng(seed),cards=Array.from({length:40},(_,i)=>i);for(let i=39;i>0;i--){const j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
function note(state,message){state.log.push(message);if(state.log.length>160)state.log.splice(0,state.log.length-160);}
function deal(state){
 const cards=deck((state.seed+Math.imul(state.round,0x9e3779b9))>>>0);
 state.hands=[[],[],[],[]];state.scores=[0,0];state.tricksWon=[0,0];state.captured=[[],[]];state.sung=[[],[],[],[]];
 state.trick=[];state.lastTrick=[];state.trickWinner=null;state.roundWinner=null;state.singQueue=[];state.roundReason='';
 state.leader=(state.dealer+1)%4;state.turn=state.leader;state.phase='play';state.trumpCard=cards[39];state.trump=suit(cards[39]);
 cards.forEach((c,i)=>state.hands[(state.leader+i)%4].push(c));state.hands.forEach(h=>h.sort((a,b)=>Math.floor(a/10)-Math.floor(b/10)||strength(b)-strength(a)));
 note(state,`Mano ${state.round}. Pinta ${state.trump}. Sale ${NAMES[state.leader].toLowerCase()}.`);
}
export function newGame(seed=Date.now()){
 const normalized=Number.isFinite(seed)?Math.trunc(seed)>>>0:0;
 const state={kind:'tute',version:1,seed:normalized,target:3,round:1,dealer:normalized%4,winner:null,matchScore:[0,0],history:[],log:[]};
 deal(state);return state;
}
export function beats(candidate,current,lead,trump){
 const a=suit(candidate),b=suit(current);
 if(a===b)return strength(candidate)>strength(current);
 if(a===trump)return true;if(b===trump)return false;
 return a===lead&&b!==lead;
}
export function trickWinner(trick,trump){
 if(!trick.length)return null;let winner=trick[0];for(const play of trick.slice(1))if(beats(play.card,winner.card,suit(trick[0].card),trump))winner=play;return winner.seat;
}
export function playableCards(state,seat=state.turn){
 const hand=state.hands[seat];if(!Array.isArray(hand))return [];
 if(!state.trick.length)return [...hand];
 const lead=suit(state.trick[0].card),best=state.trick.find(x=>x.seat===trickWinner(state.trick,state.trump)).card;
 const follow=hand.filter(c=>suit(c)===lead),pool=follow.length?follow:hand;
 const winning=pool.filter(c=>beats(c,best,lead,state.trump));
 if(winning.length)return winning;
 return [...pool];
}
export function availableSongs(state,seat=state.turn){
 const hand=state.hands[seat]||[],already=state.sung[seat]||[];
 let songs=SUITS.filter(s=>!already.includes(s)&&hand.some(c=>suit(c)===s&&rank(c)===12)&&hand.some(c=>suit(c)===s&&rank(c)===11));
 if(already.some(s=>s!==state.trump))songs=songs.filter(s=>s!==state.trump);
 if(songs.includes(state.trump))return [state.trump];return songs;
}
export function hasTute(hand){return [12,11].find(r=>SUITS.every(s=>hand.some(c=>suit(c)===s&&rank(c)===r)))||null;}
export function legalActions(state){
 if(!state||state.kind!=='tute'||state.winner!==null)return [];
 if(state.phase==='play')return playableCards(state).map(card=>({type:'play',card,label:textCard(card)}));
 if(state.phase==='sing')return [
  ...(hasTute(state.hands[state.turn])?[{type:'tute',label:`Cantar tute de ${hasTute(state.hands[state.turn])===12?'reyes':'caballos'}`}]:[]),
  ...availableSongs(state).map(suit=>({type:'sing',suit,label:`Cantar ${suit===state.trump?'40':'20'} en ${suit}`})),
  {type:'pass',label:'Seguir sin cantar'}
 ];
 if(state.phase==='trickEnd')return [{type:'continue',label:state.hands.every(h=>!h.length)?'Ver resultado de la mano':'Continuar'}];
 if(state.phase==='roundEnd')return [{type:'next',label:'Repartir siguiente mano'}];
 return [];
}
function finishRound(state,winner,reason){
 state.roundWinner=winner;state.roundReason=reason;state.matchScore[winner]++;
 state.turn=null;state.singQueue=[];
 state.winner=state.matchScore[winner]>=state.target?winner:null;state.phase=state.winner===null?'roundEnd':'finished';
 note(state,`${winner===0?'Tu pareja':'Los rivales'} gana${winner===0?'':'n'} la mano. ${reason}`);
 if(state.winner!==null)note(state,`${winner===0?'¡Tu pareja gana':'Los rivales ganan'} la partida, ${state.matchScore[0]}–${state.matchScore[1]}!`);
}
function nextSinger(state){
 while(state.singQueue.length){const seat=state.singQueue.shift();if(availableSongs(state,seat).length||hasTute(state.hands[seat])){state.turn=seat;state.phase='sing';return;}}
 state.phase='play';state.turn=state.leader;
}
function canonical(action){
 if(!action||typeof action!=='object'||Array.isArray(action))return null;
 const allowed=action.type==='play'?['type','card','label']:action.type==='sing'?['type','suit','label']:['type','label'];
 if(Object.keys(action).some(k=>!allowed.includes(k)))return null;
 if(action.type==='play'&&(!Number.isInteger(action.card)||action.card<0||action.card>=40))return null;
 if(action.type==='sing'&&!SUITS.includes(action.suit))return null;
 return action.type==='play'?{type:'play',card:action.card}:action.type==='sing'?{type:'sing',suit:action.suit}:{type:action.type};
}
export function applyAction(state,action){
 const clean=canonical(action);if(!clean)return state;
 const legal=legalActions(state).find(a=>JSON.stringify(canonical(a))===JSON.stringify(clean));if(!legal)return state;
 const next=copy(state);next.history.push(clean);
 if(clean.type==='play'){
  const seat=next.turn;next.hands[seat].splice(next.hands[seat].indexOf(clean.card),1);next.trick.push({seat,card:clean.card});
  note(next,`${NAMES[seat]}: ${textCard(clean.card)}.`);
  if(next.trick.length===4){
   const winningSeat=trickWinner(next.trick,next.trump),side=team(winningSeat),points=next.trick.reduce((n,x)=>n+cardPoints(x.card),0);
   next.captured[side].push(...next.trick.map(x=>x.card));next.tricksWon[side]++;next.scores[side]+=points;
   next.lastTrick=copy(next.trick);next.trick=[];next.trickWinner=winningSeat;next.leader=winningSeat;next.turn=null;next.phase='trickEnd';
   const last=next.hands.every(h=>!h.length);if(last)next.scores[side]+=10;
   note(next,`${NAMES[winningSeat]} gana la baza: ${points} tantos${last?' y 10 de últimas':''}.`);
  }else next.turn=(seat+1)%4;
 }else if(clean.type==='continue'){
  if(next.hands.every(h=>!h.length)){
   const winner=next.scores[0]===next.scores[1]?team(next.trickWinner):next.scores[0]>next.scores[1]?0:1;
   finishRound(next,winner,`${next.scores[0]}–${next.scores[1]} tantos${next.scores[0]===next.scores[1]?'; el empate se decide por las diez últimas':''}.`);
  }else{next.singQueue=[next.leader,(next.leader+2)%4];nextSinger(next);}
 }else if(clean.type==='sing'){
  const seat=next.turn,value=clean.suit===next.trump?40:20;next.scores[team(seat)]+=value;next.sung[seat].push(clean.suit);
  note(next,`${NAMES[seat]} canta ${value} en ${clean.suit}.`);nextSinger(next);
 }else if(clean.type==='tute'){
  const seat=next.turn,value=hasTute(next.hands[seat]);finishRound(next,team(seat),`${NAMES[seat]} canta tute de ${value===12?'reyes':'caballos'}.`);
 }else if(clean.type==='pass'){nextSinger(next);}
 else if(clean.type==='next'){next.round++;next.dealer=(next.dealer+1)%4;deal(next);}
 return next;
}
// Bots use only the acting player's hand, cards already played, the public trump
// and public scores. No opponent or partner hand is inspected.
export function chooseAction(state){
 const actions=legalActions(state);if(!actions.length)return null;
 if(state.phase!=='play')return actions.find(a=>a.type==='tute')||actions.find(a=>a.type==='sing')||actions[0];
 const seat=state.turn,hand=state.hands[seat],lead=state.trick.length?suit(state.trick[0].card):null;
 const current=state.trick.length?state.trick.find(p=>p.seat===trickWinner(state.trick,state.trump)):null;
 const partnerAhead=current&&team(current.seat)===team(seat);
 const inTable=state.trick.reduce((n,p)=>n+cardPoints(p.card),0);
 const known=new Set([...state.captured.flat(),...state.trick.map(x=>x.card),...hand]);
 const safeHigh=c=>!Array.from({length:40},(_,i)=>i).some(id=>suit(id)===suit(c)&&strength(id)>strength(c)&&!known.has(id));
 function value(action){const c=action.card,p=cardPoints(c),trump=suit(c)===state.trump;
  const pairProtected=(rank(c)===11&&hand.some(x=>suit(x)===suit(c)&&rank(x)===12))||(rank(c)===12&&hand.some(x=>suit(x)===suit(c)&&rank(x)===11));
  const preserve=pairProtected&&!state.sung[seat].includes(suit(c))?16:0;
  if(!current)return (safeHigh(c)?-22:0)+p+strength(c)/8+(trump?6:0)+preserve;
  const winning=beats(c,current.card,lead,state.trump);
  if(partnerAhead&&!winning)return -p*2+preserve+(trump?8:0);
  if(winning)return p/5+strength(c)/4+(trump?2:0)+preserve-inTable/4;
  return p*2+(trump?10:0)+preserve+strength(c)/8;
 }
 return [...actions].sort((a,b)=>value(a)-value(b)||a.card-b.card)[0];
}
export function explain(state){
 if(state.phase==='finished')return {title:state.winner===0?'¡Habéis ganado la partida!':'La partida es para los rivales',help:`Manos: ${state.matchScore[0]}–${state.matchScore[1]}. ${state.roundReason}`};
 if(state.phase==='roundEnd')return {title:state.roundWinner===0?'Mano para tu pareja':'Mano para los rivales',help:state.roundReason+' La primera pareja con tres manos gana la partida.'};
 if(state.phase==='trickEnd')return {title:`Baza para ${NAMES[state.trickWinner].toLowerCase()}`,help:'Mira las cuatro cartas. Pulsa Continuar cuando quieras.'};
 if(state.turn!==0)return {title:`Turno de ${NAMES[state.turn].toLowerCase()}`,help:'El ordenador decide su jugada. Puedes esperar o avanzar una jugada cada vez.'};
 if(state.phase==='sing')return {title:'Puedes cantar',help:'Tras una baza de vuestra pareja podéis cantar rey y caballo del mismo palo: 40 en triunfos o 20 en otro palo. Las 40 van primero.'};
 if(!state.trick.length)return {title:state.turn===0?'Te toca salir':`Sale ${NAMES[state.turn].toLowerCase()}`,help:`Puedes salir con cualquier carta. El triunfo es ${state.trump}.`};
 const hand=state.hands[state.turn],lead=suit(state.trick[0].card),best=state.trick.find(x=>x.seat===trickWinner(state.trick,state.trump)).card;
 const follow=hand.filter(c=>suit(c)===lead),canBeat=playableCards(state).some(c=>beats(c,best,lead,state.trump));
 let help=follow.length?`Debes seguir ${lead}${canBeat?' y superar la carta ganadora si puedes':''}.`:canBeat?`Sin ${lead}: debes ${suit(best)===state.trump?'superar el triunfo':'jugar un triunfo'}.`:'No puedes ganar la baza ni seguir el palo: puedes jugar cualquier carta.';
 return {title:state.turn===0?'Tu turno':`Turno de ${NAMES[state.turn].toLowerCase()}`,help:help+' Las cartas disponibles están resaltadas.'};
}
export function serialize(state){return {kind:'tute',version:1,seed:state.seed,actions:copy(state.history)};}
export function restore(data){
 try{
  if(!data||typeof data!=='object'||data.kind!=='tute'||data.version!==1||!Number.isInteger(data.seed)||data.seed<0||data.seed>0xffffffff||!Array.isArray(data.actions)||data.actions.length>1024)return null;
  let state=newGame(data.seed);for(const action of data.actions){const next=applyAction(state,action);if(next===state)return null;state=next;}return state;
 }catch{return null;}
}
