// Pure game rules, independent from the DOM and storage.
const shuffled = (arr, random=Math.random) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
export const sudokuValid=(board,index,value)=>{
 if(!Number.isInteger(value)||value<1||value>9||index<0||index>80)return false;
 const row=Math.floor(index/9),col=index%9;
 for(let i=0;i<81;i++) if(i!==index&&board[i]===value&&(Math.floor(i/9)===row||i%9===col||(Math.floor(Math.floor(i/9)/3)===Math.floor(row/3)&&Math.floor((i%9)/3)===Math.floor(col/3)))) return false;
 return true;
};
export function countSudokuSolutions(input,limit=2){
 const board=[...input]; if(board.length!==81||board.some((v,i)=>!Number.isInteger(v)||v<0||v>9||(v!==0&&!sudokuValid(board,i,v))))return 0;
 function solve(){let best=-1,choices=null;for(let i=0;i<81;i++)if(!board[i]){const legal=[];for(let n=1;n<=9;n++)if(sudokuValid(board,i,n))legal.push(n);if(!legal.length)return 0;if(!choices||legal.length<choices.length){best=i;choices=legal;if(legal.length===1)break;}}if(best<0)return 1;let total=0;for(const n of choices){board[best]=n;total+=solve();if(total>=limit)break;}board[best]=0;return total;}
 return solve();
}
export function makeSudoku(level='calma',random=Math.random){
 // Permuting a valid Latin pattern preserves all Sudoku constraints.
 const bands=shuffled([0,1,2],random),stacks=shuffled([0,1,2],random);
 const rows=bands.flatMap(b=>shuffled([0,1,2],random).map(r=>b*3+r));
 const cols=stacks.flatMap(b=>shuffled([0,1,2],random).map(c=>b*3+c));
 const nums=shuffled([1,2,3,4,5,6,7,8,9],random);
 const solution=rows.flatMap(r=>cols.map(c=>nums[(r*3+Math.floor(r/3)+c)%9]));
 const puzzle=[...solution], removals={calma:34,medio:42,reto:49}[level]??34; let removed=0;
 for(const i of shuffled(Array.from({length:81},(_,i)=>i),random)){const n=puzzle[i];puzzle[i]=0;if(countSudokuSolutions(puzzle,2)!==1)puzzle[i]=n;else if(++removed>=removals)break;}
 return {puzzle,solution,level};
}
export function connectFourNew(mode='two'){return {board:Array(42).fill(0),turn:1,winner:0,draw:false,mode};}
export function connectFourPlay(state,column){
 if(state.winner||state.draw||!Number.isInteger(column)||column<0||column>6)return state;
 const board=[...state.board];let row=5;while(row>=0&&board[row*7+column])row--;if(row<0)return state;
 const player=state.turn;board[row*7+column]=player;let win=false;
 for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){let count=1;for(const sign of [-1,1]){let r=row+sign*dr,c=column+sign*dc;while(r>=0&&r<6&&c>=0&&c<7&&board[r*7+c]===player){count++;r+=sign*dr;c+=sign*dc;}}if(count>=4)win=true;}
 return {...state,board,turn:player===1?2:1,winner:win?player:0,draw:!win&&board.every(Boolean)};
}
export function connectFourComputer(state,random=Math.random){
 const legal=[0,1,2,3,4,5,6].filter(c=>!state.board[c]);if(!legal.length)return state;
 const win=legal.find(c=>connectFourPlay(state,c).winner===state.turn);if(win!==undefined)return connectFourPlay(state,win);
 const opponent=state.turn===1?2:1;const block=legal.find(c=>connectFourPlay({...state,turn:opponent},c).winner===opponent);if(block!==undefined)return connectFourPlay(state,block);
 return connectFourPlay(state,legal[Math.floor(random()*legal.length)]);
}
