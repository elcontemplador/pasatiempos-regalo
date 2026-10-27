import {cleanMatch,chooseChessMove} from './chess-engine.js?v=35';
self.onmessage=({data})=>{
 try{const match=cleanMatch(data.match);if(!match)throw Error('Invalid match');self.postMessage({id:data.id,move:chooseChessMove(match,{budget:650})});}
 catch{self.postMessage({id:data.id,error:true});}
};
