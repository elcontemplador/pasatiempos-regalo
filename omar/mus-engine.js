import {card,makeDeck,seeded} from './card-deck.js';

// Mus a ocho reyes y ocho ases. Una partida es un juego completo a 40 tantos.
// El estado es privado; la interfaz solo revela manos ajenas al terminar el reparto.
const VERSION=1, LIMIT=12000, LANCES=['grande','chica','pares','juego'];
const NAMES=['Tú','Rival derecho','Tu compañero','Rival izquierdo'];
const clone=value=>JSON.parse(JSON.stringify(value));
const team=seat=>seat%2;
const order=mano=>Array.from({length:4},(_,i)=>(mano+i)%4);
const rank=id=>{const r=card(id).rank;return r===3?12:r===2?1:r;};
const value=id=>Math.min(10,rank(id));
export const gameValue=hand=>hand.reduce((n,id)=>n+value(id),0);
export function pairInfo(hand){
 const counts=new Map();for(const id of hand){const r=rank(id);counts.set(r,(counts.get(r)||0)+1);}
 const entries=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 if(entries[0][1]===4)return {type:3,label:'Duples',ranks:[entries[0][0],entries[0][0]],points:3};
 if(entries[0][1]===3)return {type:2,label:'Medias',ranks:[entries[0][0]],points:2};
 const pairs=entries.filter(e=>e[1]===2).map(e=>e[0]).sort((a,b)=>b-a);
 return pairs.length===2?{type:3,label:'Duples',ranks:pairs,points:3}:pairs.length===1?{type:1,label:'Par',ranks:pairs,points:1}:{type:0,label:'Sin pares',ranks:[],points:0};
}
const gameOrder=[33,34,35,36,37,40,32,31];
function vector(hand,lance){
 if(lance==='grande')return hand.map(rank).sort((a,b)=>b-a);
 if(lance==='chica')return hand.map(rank).sort((a,b)=>a-b).map(n=>-n);
 if(lance==='pares'){const p=pairInfo(hand);return [p.type,...p.ranks];}
 const n=gameValue(hand);return [lance==='punto'?n:gameOrder.indexOf(n)];
}
export function compareHands(a,b,lance){const av=vector(a,lance),bv=vector(b,lance);for(let i=0;i<Math.max(av.length,bv.length);i++){const d=(av[i]||0)-(bv[i]||0);if(d)return Math.sign(d);}return 0;}
export function handSummary(hand){const n=gameValue(hand);return `${pairInfo(hand).label} · ${n>=31?'Juego de':'Punto de'} ${n}`;}
function eligibleFor(s,lance){return order(s.mano).filter(i=>lance==='pares'?pairInfo(s.hands[i]).type>0:lance==='juego'?gameValue(s.hands[i])>=31:true);}
function bestSeat(s,lance){const eligible=eligibleFor(s,lance);return eligible.reduce((winner,i)=>winner===null||compareHands(s.hands[i],s.hands[winner],lance)>0?i:winner,null);}
const label=lance=>({grande:'Grande',chica:'Chica',pares:'Pares',juego:'Juego',punto:'Punto'}[lance]||'Mus');
const pairName=t=>t===0?'Tu pareja':'Los rivales';
function log(s,text){s.log.push(text);if(s.log.length>80)s.log.shift();}
function nextRandom(s){s.rng=(s.rng+0x9e3779b9)>>>0;return s.rng;}
function shuffle(s,list){const a=[...list],random=seeded(nextRandom(s));for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function deal(s){
 s.phase='mus';s.mano=(s.dealer+1)%4;s.turn=s.mano;s.hands=[[],[],[],[]];s.stock=makeDeck(nextRandom(s));s.discards=[];
 for(let i=0;i<16;i++)s.hands[(s.mano+i)%4].push(s.stock.shift());
 s.musVotes=[];s.discardRounds=0;s.discardCount=0;s.discardIndex=0;s.pending=null;s.lance=null;s.lanceIndex=-1;s.passed=[];s.eligible=[];s.bets=[];s.results=[];s.declarations={pares:null,juego:null};s.finishReason='';
 log(s,`Reparto ${s.round}. ${NAMES[s.mano]} ${s.mano===0?'eres':'es'} mano.`);
}
export function newGame(seed=Date.now()){
 const normalized=Number.isSafeInteger(seed)?seed>>>0:Date.now()>>>0;
 const s={version:VERSION,kind:'mus',seed:normalized,rng:normalized,round:1,dealer:3,mano:0,phase:'mus',turn:0,hands:[[],[],[],[]],scores:[0,0],winner:null,log:[],history:[]};deal(s);return s;
}
function award(s,t,points,reason,lance,kind='lance'){
 if(points<=0||s.winner!==null)return;
 s.scores[t]+=points;s.results.push({lance,label:label(lance),team:t,points,reason,kind});log(s,`${pairName(t)}: +${points} (${reason}).`);
 if(s.scores[t]>=40){s.winner=t;s.phase='finished';s.turn=null;s.finishReason=`${pairName(t)} llega a ${s.scores[t]} tantos.`;log(s,s.finishReason);}
}
function settle(s){
 s.pending=null;
 for(const bet of s.bets){
  if(s.winner!==null)break;if(bet.mode==='none')continue;
  const seat=bestSeat(s,bet.lance),t=bet.mode==='fold'||bet.mode==='auto'?bet.team:team(seat);
  let points=bet.mode==='accepted'?bet.stake:0,reason='';
  if(bet.lance==='grande'||bet.lance==='chica'){if(bet.mode==='pass')points=1;reason=`${label(bet.lance)}${bet.mode==='accepted'?' · envite querido':' en paso'}`;}
  else if(bet.lance==='pares'){const own=[t,t+2].reduce((n,i)=>n+pairInfo(s.hands[i]).points,0);points+=own;reason=`Pares · ${own} de las cartas${bet.mode==='accepted'?` + ${bet.stake} de envite`:''}`;}
  else if(bet.lance==='juego'){const own=[t,t+2].reduce((n,i)=>{const v=gameValue(s.hands[i]);return n+(v===31?3:v>=31?2:0);},0);points+=own;reason=`Juego · ${own} de las cartas${bet.mode==='accepted'?` + ${bet.stake} de envite`:''}`;}
  else {points+=1;reason=`Punto · 1 de las cartas${bet.mode==='accepted'?` + ${bet.stake} de envite`:''}`;}
  award(s,t,points,reason,bet.lance);
 }
 if(s.winner===null){s.phase='roundEnd';s.turn=null;s.lance=null;log(s,'Cartas a la vista. Puedes revisar el tanteo y repartir de nuevo.');}
}
function startLance(s,index){
 if(s.winner!==null)return;
 s.lanceIndex=index;s.pending=null;s.passed=[];
 if(index>=4){settle(s);return;}
 s.lance=LANCES[index];s.eligible=eligibleFor(s,s.lance);
 if(s.lance==='pares'||s.lance==='juego'){
  s.declarations[s.lance]=s.hands.map((_,i)=>s.eligible.includes(i));
  log(s,`${label(s.lance)}: ${order(s.mano).map(i=>`${NAMES[i]} ${s.eligible.includes(i)?'sí':'no'}`).join(' · ')}.`);
 }
 if(s.lance==='juego'&&!s.eligible.length){s.lance='punto';s.eligible=order(s.mano);log(s,'Nadie tiene juego: se disputa el punto.');}
 if(!s.eligible.length){s.bets.push({lance:s.lance,mode:'none'});startLance(s,index+1);return;}
 const teams=[...new Set(s.eligible.map(team))];
 if(teams.length===1){s.bets.push({lance:s.lance,mode:'auto',team:teams[0]});log(s,`${pairName(teams[0])} tiene ${s.lance} sin oposición; se contará al final.`);startLance(s,index+1);return;}
 s.phase='bet';s.turn=s.eligible[0];log(s,`${label(s.lance)}: ${s.turn===0?'empiezas tú':'empieza '+NAMES[s.turn]}.`);
}
export function legalActions(s){
 if(!s||s.kind!=='mus'||s.winner!==null)return [];
 if(s.phase==='roundEnd')return [{type:'next',label:'Siguiente reparto'}];
 if(!Number.isInteger(s.turn)||s.turn<0||s.turn>3)return [];
 if(s.phase==='mus')return [{type:'mus',label:'Mus · cambiar cartas'},{type:'cut',label:'No hay mus'}];
 if(s.phase==='discard')return [{type:'discard',label:'Cambiar cartas'}];
 if(s.phase!=='bet')return [];
 if(!s.pending)return [{type:'pass',label:'Paso'},{type:'bet',amount:2,label:'Envido · 2 tantos'},{type:'ordago',label:'Órdago'}];
 return [{type:'accept',label:s.pending.ordago?'Quiero el órdago':'Quiero · '+s.pending.amount+' tantos'},{type:'reject',label:'No quiero'},...(!s.pending.ordago?[2,5,10].map(amount=>({type:'raise',amount,label:`Subir ${amount} · total ${s.pending.amount+amount}`})):[]),...(!s.pending.ordago?[{type:'ordago',label:'Órdago'}]:[])];
}
function canonical(s,a){
 if(!a||typeof a!=='object'||Array.isArray(a))return null;
 const legal=legalActions(s).find(x=>x.type===a.type&&(x.amount===undefined||x.amount===a.amount));if(!legal)return null;
 if(a.type==='discard'){
  if(!Array.isArray(a.cards)||a.cards.length>4||new Set(a.cards).size!==a.cards.length||!a.cards.every(id=>Number.isInteger(id)&&s.hands[s.turn].includes(id)))return null;
  return {type:'discard',cards:[...a.cards].sort((x,y)=>x-y)};
 }
 if(legal.amount!==undefined)return {type:legal.type,amount:legal.amount};return {type:legal.type};
}
function offer(s,seat,amount,ordago){
 const previous=s.pending?.amount||0;
 s.pending={seat,team:team(seat),amount:ordago?null:amount,ordago,previous,responders:order((seat+1)%4).filter(i=>team(i)!==team(seat)&&s.eligible.includes(i)),declined:[]};
 s.turn=s.pending.responders[0];log(s,`${NAMES[seat]}: ${ordago?'órdago a '+s.lance:`${previous?'reenvido':'envido'} a ${amount} en ${s.lance}`}.`);
}
function discard(s,a){
 const seat=s.turn,chosen=a.cards;
 s.hands[seat]=s.hands[seat].filter(id=>!chosen.includes(id));
 // El descarte actual se excluye del reciclado cuando solo falta este jugador.
 const own=[...chosen];let heldOut=s.discardIndex===3?own:[];
 if(!heldOut.length)s.discards.push(...own);
 for(let i=0;i<chosen.length;i++){
  if(!s.stock.length){s.stock=shuffle(s,s.discards);s.discards=[];}
  if(!s.stock.length)throw new Error('Mazo insuficiente en el descarte');
  s.hands[seat].push(s.stock.shift());
 }
 s.discards.push(...heldOut);s.discardCount+=chosen.length;
 log(s,`${NAMES[seat]} ${chosen.length?`${seat===0?'cambias':'cambia'} ${chosen.length} ${chosen.length===1?'carta':'cartas'}`:seat===0?'te quedas servido':'se queda servido'}.`);
 s.discardIndex++;
 if(s.discardIndex===4){s.phase='mus';s.turn=s.mano;s.musVotes=[];s.discardRounds++;}
 else s.turn=(s.turn+1)%4;
}
function transition(s,a){
 const seat=s.turn;
 if(a.type==='next'){s.round++;s.dealer=(s.dealer+1)%4;deal(s);return;}
 if(a.type==='mus'){s.musVotes.push(seat);log(s,`${NAMES[seat]}: mus.`);if(s.musVotes.length===4){s.phase='discard';s.turn=s.mano;s.discardIndex=0;}else s.turn=(seat+1)%4;return;}
 if(a.type==='cut'){log(s,`${NAMES[seat]}: no hay mus.`);startLance(s,0);return;}
 if(a.type==='discard'){discard(s,a);return;}
 if(a.type==='pass'){
  s.passed.push(seat);log(s,`${NAMES[seat]} ${seat===0?'pasas':'pasa'} a ${s.lance}.`);
  if(s.passed.length===s.eligible.length){s.bets.push({lance:s.lance,mode:'pass'});startLance(s,s.lanceIndex+1);}
  else s.turn=s.eligible[(s.eligible.indexOf(seat)+1)%s.eligible.length];return;
 }
 if(a.type==='bet'){offer(s,seat,a.amount,false);return;}
 if(a.type==='raise'){offer(s,seat,s.pending.amount+a.amount,false);return;}
 if(a.type==='ordago'){offer(s,seat,null,true);return;}
 if(a.type==='accept'){
  log(s,`${NAMES[seat]} ${seat===0?'quieres':'quiere'} ${s.pending.ordago?'el órdago':s.pending.amount+' tantos'} a ${s.lance}.`);
  if(s.pending.ordago){const winner=team(bestSeat(s,s.lance));s.winner=winner;s.scores[winner]=40;s.phase='finished';s.turn=null;s.finishReason=`${pairName(winner)} gana el órdago a ${s.lance}.`;s.results.push({lance:s.lance,label:label(s.lance),team:winner,points:0,reason:s.finishReason,kind:'ordago'});log(s,s.finishReason);return;}
  s.bets.push({lance:s.lance,mode:'accepted',stake:s.pending.amount});startLance(s,s.lanceIndex+1);return;
 }
 if(a.type==='reject'){
  log(s,`${NAMES[seat]} ${seat===0?'no quieres':'no quiere'} a ${s.lance}.`);s.pending.declined.push(seat);
  const next=s.pending.responders.find(i=>!s.pending.declined.includes(i));
  if(next!==undefined){s.turn=next;return;}
  const t=s.pending.team,points=s.pending.previous||1;
  s.bets.push({lance:s.lance,mode:'fold',team:t,deje:points});award(s,t,points,`No querido a ${s.lance}`,s.lance,'deje');
  if(s.winner===null)startLance(s,s.lanceIndex+1);
 }
}
export function applyAction(s,a){
 const action=canonical(s,a);if(!action)return s;
 const next=clone(s);transition(next,action);next.history.push(action);return next;
}
export function serialize(s){return {version:VERSION,kind:'mus',seed:s.seed,actions:clone(s.history)};}
export function restore(data){
 try{
  if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==VERSION||data.kind!=='mus'||!Number.isInteger(data.seed)||data.seed<0||data.seed>0xffffffff||!Array.isArray(data.actions)||data.actions.length>LIMIT||Object.keys(data).some(k=>!['version','kind','seed','actions'].includes(k)))return null;
  const s=newGame(data.seed);
  for(const input of data.actions){const a=canonical(s,input);if(!a||JSON.stringify(a)!==JSON.stringify(input))return null;transition(s,a);s.history.push(a);}
  return s;
 }catch{return null;}
}
function strength(hand,lance){
 const ranks=hand.map(rank),p=pairInfo(hand),n=gameValue(hand);
 if(lance==='grande'){const sorted=[...ranks].sort((a,b)=>b-a);return .42*(sorted[0]/12)+.3*(sorted[1]/12)+.18*(sorted[2]/12)+.1*(sorted[3]/12);}
 if(lance==='chica'){const sorted=[...ranks].sort((a,b)=>a-b);return .42*(1-(sorted[0]-1)/11)+.3*(1-(sorted[1]-1)/11)+.18*(1-(sorted[2]-1)/11)+.1*(1-(sorted[3]-1)/11);}
 if(lance==='pares')return p.type===3?.85+p.ranks[0]/120:p.type===2?.65+p.ranks[0]/100:p.type===1?.25+p.ranks[0]/48:0;
 if(lance==='juego')return n===31?.98:n===32?.84:n===40?.66:.4+(n-33)*.04;
 return Math.max(0,(n-14)/16)*.82;
}
export function chooseAction(s){
 const legal=legalActions(s);if(!legal.length)return null;
 // No se consultan mazo, semilla de reparto ni cartas de ningún otro jugador.
 const hand=s.hands[s.turn]||[],ranks=hand.map(rank),pairs=hand.length?pairInfo(hand):null,total=hand.length?gameValue(hand):0;
 if(s.phase==='roundEnd')return {type:'next'};
 if(s.phase==='mus')return {type:s.discardRounds>=2||total===31||pairs.type>=2||ranks.filter(r=>r===12).length>=3||ranks.filter(r=>r===1).length>=3?'cut':'mus'};
 if(s.phase==='discard'){
  if(total===31||pairs.type>=2)return {type:'discard',cards:[]};
  const counts=new Map();ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
  const repeated=[...counts].filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0];
  if(repeated)return {type:'discard',cards:hand.filter(id=>rank(id)!==repeated[0])};
  if(hand.filter(id=>value(id)===10).length===3)return {type:'discard',cards:hand.filter(id=>value(id)!==10)};
  return {type:'discard',cards:hand.filter(id=>rank(id)!==12)};
 }
 if(s.phase!=='bet')return legal[0];
 let hash=(s.round*101+s.turn*17+s.discardRounds*11+s.log.length*13)>>>0;for(const id of hand)hash=(Math.imul(hash,31)+id)>>>0;
 const roll=(hash%100)/100,power=strength(hand,s.lance);
 if(!s.pending&&power>=.96&&roll<.12)return {type:'ordago'};
 if(!s.pending)return {type:power>.63||roll<.045?'bet':'pass',...(power>.63||roll<.045?{amount:2}:{})};
 if(s.pending.ordago)return {type:power>=.9?'accept':'reject'};
 if(power>.87&&s.pending.amount<=4&&roll<.45)return {type:'raise',amount:2};
 return {type:power>=.43+Math.min(.35,s.pending.amount/60)||s.pending.amount<=2&&roll<.08?'accept':'reject'};
}
export function explain(s){
 if(s.phase==='finished')return {title:'Partida terminada',help:s.finishReason};
 if(s.phase==='roundEnd')return {title:'Reparto terminado',help:'Revisa las cartas y el tanteo. La partida continúa hasta 40 tantos.'};
 if(s.phase==='mus')return {title:s.turn===0?'¿Hay mus? · Te toca':'¿Hay mus? · Turno de '+NAMES[s.turn],help:'Todos deben querer mus para cambiar cartas. Una persona que corte inicia los lances.'};
 if(s.phase==='discard')return {title:s.turn===0?'Tu descarte':'Descarta '+NAMES[s.turn],help:s.turn===0?'Selecciona las cartas que quieres cambiar y confirma. Puedes conservar las cuatro.':'El ordenador decide qué cartas cambiar. Tu mano permanece visible.'};
 const title=label(s.lance),own=s.turn===0?'Te toca':'Turno de '+NAMES[s.turn];
 if(s.pending)return {title,help:`${own}. ${s.pending.ordago?'Hay un órdago: se decide toda la partida.':`Hay ${s.pending.amount} tantos propuestos. El no vale ${s.pending.previous||1}.`}${s.pending.declined.length?' El primer no no cierra la respuesta de la pareja.':''}`};
 return {title,help:`${own}. Puedes pasar, envidar dos tantos o lanzar un órdago.${s.lance==='pares'||s.lance==='juego'?' Solo participan quienes han declarado que tienen.':''}`};
}
