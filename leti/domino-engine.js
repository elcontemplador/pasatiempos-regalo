// Double-six, four seats, fixed partnerships. Bot decisions use public information only.
export const TILES=Object.freeze(Array.from({length:7},(_,a)=>Array.from({length:7-a},(_,i)=>Object.freeze({id:0,a,b:a+i}))).flat().map((t,id)=>Object.freeze({...t,id})));
export const tileName=id=>{const t=TILES[id];return `${t.a}–${t.b}`;};
export const nextSeat=seat=>(seat+3)%4;
export function random(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function deal(seed,round){const r=random((seed+Math.imul(round,2654435761))>>>0),ids=TILES.map(t=>t.id);for(let i=27;i>0;i--){const j=Math.floor(r()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return Array.from({length:4},(_,s)=>ids.slice(s*7,s*7+7));}
function handState(seed,round,starter){const hands=deal(seed,round);if(round===1)starter=hands.findIndex(h=>h.includes(27));return {hands,round,starter,turn:starter,chain:[],passes:0,history:[],phase:'playing',result:null};}
export function newMatch(seed=Date.now()>>>0,settings={}){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Semilla inválida');
 return {version:1,seed,settings:{level:settings.level==='calma'?'calma':'reto',scoring:settings.scoring==='opponents'?'opponents':'all'},scores:[0,0],actions:[],...handState(seed,1,0)};
}
export function movesFor(hand,chain,first=false){
 if(!chain.length)return hand.filter(id=>!first||id===27).map(tile=>({tile,side:'start'}));
 const l=chain[0].a,r=chain[chain.length-1].b,m=[];
 for(const tile of hand){const t=TILES[tile];if(t.a===l||t.b===l)m.push({tile,side:'left'});if(t.a===r||t.b===r)m.push({tile,side:'right'});}return m;
}
export function legalMoves(s,seat=s.turn){return s.phase==='playing'&&seat===s.turn?movesFor(s.hands[seat],s.chain,s.round===1):[];}
export function remaining(s){return s.hands.map(h=>h.reduce((n,id)=>n+TILES[id].a+TILES[id].b,0));}
function finish(s,emptySeat=null){
 const pips=remaining(s),teams=[pips[0]+pips[2],pips[1]+pips[3]];
 const winner=emptySeat===null?(teams[0]===teams[1]?null:teams[0]<teams[1]?0:1):emptySeat%2;
 const points=winner===null?0:s.settings.scoring==='all'?teams[0]+teams[1]:teams[1-winner];
 s.scores=[...s.scores];if(winner!==null)s.scores[winner]+=points;
 s.result={winner,points,pips,teams,reason:emptySeat===null?'closed':'empty',seat:emptySeat};
 s.phase=s.scores.some(n=>n>=100)?'match-over':'hand-over';return s;
}
export function step(s,action){
 if(!action||typeof action!=='object')throw new Error('Jugada inválida');
 if(action.type==='next'){
  if(s.phase!=='hand-over')throw new Error('La mano no ha terminado');
  return {...s,...handState(s.seed,s.round+1,nextSeat(s.starter)),actions:[...s.actions,{type:'next'}]};
 }
 if(s.phase!=='playing'||action.seat!==s.turn)throw new Error('No es tu turno');
 const moves=legalMoves(s),base={...s,hands:s.hands.map(h=>[...h]),chain:[...s.chain],history:[...s.history],actions:[...s.actions]};
 if(action.type==='pass'){
  if(moves.length)throw new Error('Tienes una ficha para jugar');
  const ends=s.chain.length?[s.chain[0].a,s.chain[s.chain.length-1].b]:[];
  base.actions.push({type:'pass',seat:s.turn});base.history.push({type:'pass',seat:s.turn,ends});base.passes++;
  if(base.passes===4)return finish(base);base.turn=nextSeat(s.turn);return base;
 }
 if(action.type!=='play'||!moves.some(m=>m.tile===action.tile&&m.side===action.side))throw new Error('Esa ficha no encaja');
 let {a,b}=TILES[action.tile];
 if(action.side==='left'&&b!==s.chain[0].a)[a,b]=[b,a];
 if(action.side==='right'&&a!==s.chain[s.chain.length-1].b)[a,b]=[b,a];
 const placed={tile:action.tile,a,b,seat:s.turn};
 if(action.side==='left')base.chain.unshift(placed);else base.chain.push(placed);
 base.hands[s.turn].splice(base.hands[s.turn].indexOf(action.tile),1);
 const event={type:'play',seat:s.turn,tile:action.tile,side:action.side};
 base.actions.push(event);base.history.push(event);base.passes=0;
 if(!base.hands[s.turn].length)return finish(base,s.turn);
 base.turn=nextSeat(s.turn);return base;
}
export function serialize(s){return {version:1,seed:s.seed,settings:s.settings,actions:s.actions};}
export function restore(raw){
 try{
  if(!raw||raw.version!==1||!Number.isInteger(raw.seed)||raw.seed<0||raw.seed>4294967295||!raw.settings||!['calma','reto'].includes(raw.settings.level)||!['all','opponents'].includes(raw.settings.scoring)||!Array.isArray(raw.actions)||raw.actions.length>12000)return null;
  let s=newMatch(raw.seed,raw.settings);for(const action of raw.actions)s=step(s,action);return s;
 }catch{return null;}
}
export function observe(s,seat=s.turn){
 return {seat,hand:[...s.hands[seat]],counts:s.hands.map(h=>h.length),chain:s.chain.map(t=>({...t})),history:s.history.map(e=>({...e,ends:e.ends?[...e.ends]:undefined})),first:s.round===1,level:s.settings.level};
}
export function chooseMove(view,rng=random(0)){
 const moves=movesFor(view.hand,view.chain,view.first);if(!moves.length)return {type:'pass',seat:view.seat};
 const absent=Array.from({length:4},()=>new Set());
 for(const e of view.history)if(e.type==='pass')for(const n of e.ends)absent[e.seat].add(n);
 const partner=(view.seat+2)%4,opponents=[(view.seat+1)%4,(view.seat+3)%4];
 const scored=moves.map(m=>{
  const t=TILES[m.tile],own=view.hand.filter(id=>id!==m.tile);
  let score=(t.a+t.b)*1.5+(t.a===t.b?3:0);
  if(view.level==='reto'&&view.chain.length){
   const l=view.chain[0].a,r=view.chain[view.chain.length-1].b;
   const ends=m.side==='left'?[t.a===l?t.b:t.a,r]:[l,t.a===r?t.b:t.a];
   score+=own.filter(id=>ends.some(n=>TILES[id].a===n||TILES[id].b===n)).length*2;
   for(const seat of opponents)if(ends.every(n=>absent[seat].has(n)))score+=9+(7-view.counts[seat]);
   if(ends.every(n=>absent[partner].has(n)))score-=view.counts[partner]<=3?16:7;
   if(view.counts[partner]<=2)score-=own.filter(id=>ends.some(n=>TILES[id].a===n||TILES[id].b===n)).length;
  }
  return {m,score:score+rng()*(view.level==='calma'?9:1)};
 });
 scored.sort((a,b)=>b.score-a.score);return {type:'play',seat:view.seat,...scored[0].m};
}

// An undo checkpoint must be the prefix immediately before a human action in this hand.
// Validate it independently so a damaged optional checkpoint never destroys a valid match.
export function restoreUndo(raw,current){
 const checkpoint=restore(raw);
 if(!checkpoint||checkpoint.phase!=='playing'||checkpoint.turn!==0||checkpoint.seed!==current.seed||checkpoint.round!==current.round||JSON.stringify(checkpoint.settings)!==JSON.stringify(current.settings))return null;
 const n=checkpoint.actions.length;
 if(current.actions.length<=n||JSON.stringify(checkpoint.actions)!==JSON.stringify(current.actions.slice(0,n)))return null;
 const human=current.actions[n];
 if(human.seat!==0||!['play','pass'].includes(human.type)||current.actions.slice(n).some(a=>a.type==='next'))return null;
 return checkpoint;
}
