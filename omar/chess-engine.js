import {Chess,DEFAULT_POSITION} from './vendor/chess.js?v=1.4.0';
export {Chess,DEFAULT_POSITION};
export const LEVELS={calma:'Con calma',medio:'Un poco más',reto:'Un reto'};
export const PIECE_NAMES={p:'Peón',n:'Caballo',b:'Alfil',r:'Torre',q:'Dama',k:'Rey'};
export function buildGame(match){
 const game=new Chess(match.initial||DEFAULT_POSITION);
 for(const move of match.moves||[])game.move(move);
 return game;
}
export function newGame(color='w',level='calma'){return {initial:DEFAULT_POSITION,moves:[],color:color==='b'?'b':'w',level:level in LEVELS?level:'calma',ending:null};}
export function packGame(game,match){
 return {...match,moves:game.history({verbose:true}).map(m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})}))};
}
function repeated(game){
 const history=game.history({verbose:true}),key=game.fen().split(' ').slice(0,4).join(' ');
 const positions=history.length?[history[0].before,...history.map(m=>m.after)]:[game.fen()];
 return positions.filter(fen=>fen.split(' ').slice(0,4).join(' ')===key).length;
}
export function claimable(game){
 return !game.isCheckmate()&&!game.isStalemate()&&!game.isInsufficientMaterial()&&(game.isThreefoldRepetition()||Number(game.fen().split(' ')[4])>=100);
}
export function outcome(game,ending=null){
 if(game.isCheckmate())return {reason:'mate',winner:game.turn()==='w'?'b':'w'};
 if(game.isStalemate())return {reason:'stalemate',winner:null};
 if(game.isInsufficientMaterial())return {reason:'material',winner:null};
 if(Number(game.fen().split(' ')[4])>=150)return {reason:'seventyfive',winner:null};
 if(game.isThreefoldRepetition()&&repeated(game)>=5)return {reason:'fivefold',winner:null};
 if(ending?.reason==='resign'&&['w','b'].includes(ending.color))return {reason:'resign',winner:ending.color==='w'?'b':'w'};
 if(ending?.reason==='claim'&&claimable(game))return {reason:'claim',winner:null};
 return null;
}
export function cleanMatch(value){
 try{
  if(!value||typeof value!=='object'||typeof value.initial!=='string'||value.initial.length>120||!Array.isArray(value.moves)||value.moves.length>1500)return null;
  const match={...newGame(value.color,value.level),initial:value.initial},game=new Chess(match.initial);
  for(const m of value.moves){
   if(!m||!/^[a-h][1-8]$/.test(m.from)||!/^[a-h][1-8]$/.test(m.to)||(m.promotion&&!['q','r','b','n'].includes(m.promotion))||outcome(game))return null;
   game.move({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})});
  }
  const clean=packGame(game,match);
  if(value.ending?.reason==='resign'&&value.ending.color===clean.color)clean.ending={reason:'resign',color:clean.color};
  if(value.ending?.reason==='claim'&&claimable(game))clean.ending={reason:'claim'};
  return clean;
 }catch{return null;}
}
export function undoHuman(match){
 const game=buildGame(match),history=game.history({verbose:true});
 for(let i=history.length-1;i>=0;i--)if(history[i].color===match.color)return {...match,moves:match.moves.slice(0,i),ending:null};
 return null;
}
export function moveText(move){
 if(move.flags.includes('k'))return 'Enroque corto';
 if(move.flags.includes('q'))return 'Enroque largo';
 return PIECE_NAMES[move.piece]+' '+move.from+' → '+move.to+(move.captured?' · captura '+PIECE_NAMES[move.captured].toLowerCase():'')+(move.flags.includes('e')?' al paso':'')+(move.promotion?' · corona en '+PIECE_NAMES[move.promotion].toLowerCase():'')+(move.san.endsWith('#')?' · jaque mate':move.san.endsWith('+')?' · jaque':'');
}
export function spanishSan(san){return san.replace(/^[KQRBN]/,p=>({K:'R',Q:'D',R:'T',B:'A',N:'C'})[p]).replace(/=([QRBN])/,(_,p)=>'='+({Q:'D',R:'T',B:'A',N:'C'})[p]);}
const VALUES={p:100,n:320,b:335,r:500,q:900,k:0};
export function evaluate(game){
 let value=0;
 for(const row of game.board())for(const p of row)if(p){
  const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1])-1,advance=p.color==='w'?rank:7-rank,center=3.5-Math.abs(file-3.5)+3.5-Math.abs(rank-3.5);
  const bonus=p.type==='p'?advance*8+(3.5-Math.abs(file-3.5))*3:p.type==='n'||p.type==='b'?center*9:p.type==='q'?center*2:p.type==='r'?advance*2:advance<2?15:0;
  value+=(p.color==='w'?1:-1)*(VALUES[p.type]+bonus);
 }
 return value*(game.turn()==='w'?1:-1);
}
export function chooseChessMove(match,{budget=650,random=Math.random}={}){
 const game=buildGame(match),legal=game.moves({verbose:true});if(!legal.length||outcome(game,match.ending))return null;
 const start=Date.now(),maxDepth={calma:1,medio:2,reto:3}[match.level]||1;
 let best=legal[0],completed=0;
 const plain=m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})});
 const ordered=moves=>moves.sort((a,b)=>(VALUES[b.captured]||0)+(b.promotion?800:0)-(VALUES[a.captured]||0)-(a.promotion?800:0));
 let nodes=0;
 function search(depth,alpha,beta,ply){
  if((++nodes&15)===0&&Date.now()-start>budget)throw Error('time');
  if(game.isCheckmate())return -100000+ply;
  if(game.isStalemate()||game.isInsufficientMaterial()||game.isThreefoldRepetition()||Number(game.fen().split(' ')[4])>=150)return 0;
  if(depth===0)return evaluate(game);
  let score=-Infinity;
  for(const m of ordered(game.moves({verbose:true}))){
   game.move(plain(m));let v;
   try{v=-search(depth-1,-beta,-alpha,ply+1);}finally{game.undo();}
   score=Math.max(score,v);alpha=Math.max(alpha,v);if(alpha>=beta)break;
  }
  return score;
 }
 for(let depth=1;depth<=maxDepth;depth++){
  let candidate=best,value=-Infinity,finished=true;
  try{
   for(const m of ordered([...legal])){
    if(Date.now()-start>budget)throw Error('time');
    game.move(plain(m));let v;
    try{v=-search(depth-1,-Infinity,-value,1);}finally{game.undo();}
    v+=match.level==='calma'?(random()-.5)*90:(random()-.5)*2;
    if(v>value){value=v;candidate=m;}
   }
  }catch{finished=false;}
  if(finished){best=candidate;completed=depth;}else break;
 }
 return {...plain(best),depth:completed,nodes};
}
