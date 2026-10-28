// Independent game state; letter identities distinguish repeated letters.
export function lettersOf(word){return word.toUpperCase().replaceAll('Ñ','\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('\u0001','Ñ');}
function shuffle(items,rng){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function scramble(word,rng=Math.random){
 const text=lettersOf(word),base=Array.from(text,(_,i)=>i);let best=base,score=0;
 for(let k=0;k<20;k++){const order=shuffle(base,rng),moved=order.filter((v,i)=>text[v]!==text[i]).length;if(moved>score){best=order;score=moved;}if(score>=Math.ceil(text.length*.75))break;}
 if(!score)for(let shift=1;shift<text.length;shift++){const order=[...base.slice(shift),...base.slice(0,shift)];if(order.some((v,i)=>text[v]!==text[i]))return order;}
 return best;
}
export function makeLettersRound(bank,seen=[],rng=Math.random,recent=[]){
 const fresh=shuffle(bank.filter(w=>!seen.includes(w.id)),rng),old=[...shuffle(bank.filter(w=>seen.includes(w.id)&&!recent.includes(w.id)),rng),...shuffle(bank.filter(w=>seen.includes(w.id)&&recent.includes(w.id)),rng)];
 const selected=[...fresh,...old].slice(0,5);
 return {round:{index:0,cards:selected.map(w=>({id:w.id,order:scramble(w.word,rng),slots:Array(lettersOf(w.word).length).fill(null),clue:w.level==='calma',given:[],status:'playing'}))},seen:fresh.length>=5?[...new Set([...seen,...selected.map(w=>w.id)])]:selected.slice(fresh.length).map(w=>w.id)};
}
const permutation=(a,n)=>Array.isArray(a)&&a.length===n&&new Set(a).size===n&&a.every(v=>Number.isInteger(v)&&v>=0&&v<n);
export function answerText(card,entry){const text=lettersOf(entry.word);return card.slots.map(i=>i===null?'_':text[i]).join('');}
export function validLettersRound(round,bank){
 if(!round||!Number.isInteger(round.index)||round.index<0||round.index>5||!Array.isArray(round.cards)||round.cards.length!==5||new Set(round.cards.map(c=>c?.id)).size!==5)return false;
 return round.cards.every((c,i)=>{
  const entry=bank.find(w=>w.id===c?.id);if(!entry)return false;const text=lettersOf(entry.word),n=text.length;
  if(!permutation(c.order,n)||!Array.isArray(c.slots)||c.slots.length!==n||!c.slots.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<n))return false;
  const used=c.slots.filter(v=>v!==null);if(new Set(used).size!==used.length||typeof c.clue!=='boolean'||!Array.isArray(c.given)||new Set(c.given).size!==c.given.length)return false;
  if(!c.given.every(p=>Number.isInteger(p)&&p>=0&&p<n&&c.slots[p]!==null&&text[c.slots[p]]===text[p]))return false;
  if(!['playing','solved','revealed'].includes(c.status))return false;
  const solved=answerText(c,entry)===text;
  if(c.status==='playing'?solved:!solved)return false;
  if(i<round.index&&c.status==='playing'||i>round.index&&c.status!=='playing')return false;
  return true;
 });
}
export function placeLetter(card,token,entry){
 if(card.status!=='playing'||!Number.isInteger(token)||token<0||token>=card.slots.length||card.slots.includes(token))return false;
 const position=card.slots.indexOf(null);if(position<0)return false;card.slots[position]=token;checkSolved(card,entry);return true;
}
export function removeLetter(card,position){
 if(card.status!=='playing'||!Number.isInteger(position)||position<0||position>=card.slots.length||card.given.includes(position)||card.slots[position]===null)return false;
 card.slots[position]=null;return true;
}
function checkSolved(card,entry){if(answerText(card,entry)===lettersOf(entry.word))card.status='solved';}
export function giveLetter(card,entry){
 if(card.status!=='playing')return false;
 const text=lettersOf(entry.word),position=card.slots.findIndex((v,i)=>v===null||text[v]!==text[i]);if(position<0)return false;
 const candidates=card.order.filter(t=>text[t]===text[position]&&!card.given.some(p=>card.slots[p]===t));
 const token=candidates.find(t=>!card.slots.includes(t))??candidates.find(t=>{const p=card.slots.indexOf(t);return text[p]!==text[t];})??candidates[0];
 const previous=card.slots.indexOf(token);if(previous>=0)card.slots[previous]=null;
 card.slots[position]=token;card.given.push(position);checkSolved(card,entry);return true;
}
export function revealWord(card,entry){if(card.status!=='playing')return;card.slots=Array.from(lettersOf(entry.word),(_,i)=>i);card.clue=true;card.status='revealed';}

// Preserve any played historical round. Automatically replace only untouched deals.
export function restoreLettersRound(round,active,legacy,level){
 const available=[...active,...legacy].filter(w=>w.level===level);
 if(!validLettersRound(round,available))return null;
 const untouched=round.index===0&&round.cards.every(c=>legacy.some(w=>w.id===c.id)&&c.status==='playing'&&c.slots.every(t=>t===null)&&c.given.length===0&&c.clue===(level==='calma'));
 return untouched?null:round;
}
