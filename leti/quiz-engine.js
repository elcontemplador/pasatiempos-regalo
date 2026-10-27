export function shuffled(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeRound(bank,seen=[],rng=Math.random,recent=[]){
  const known=new Set(bank.map(q=>q.id)),history=[...new Set(seen.filter(id=>known.has(id)))];
  const unseen=bank.filter(q=>!history.includes(q.id)).map(q=>q.id);
  const fresh=[...shuffled(unseen.filter(id=>!recent.includes(id)),rng),...shuffled(unseen.filter(id=>recent.includes(id)),rng)];
  const ids=fresh.slice(0,10);
  if(ids.length<10){const older=[...shuffled(history.filter(id=>!ids.includes(id)&&!recent.includes(id)),rng),...shuffled(history.filter(id=>!ids.includes(id)&&recent.includes(id)),rng)];ids.push(...older.slice(0,10-ids.length));}
  const nextSeen=fresh.length>=10?[...history,...ids]:ids.slice(fresh.length);
  return {round:{ids,orders:ids.map(()=>shuffled([0,1,2],rng)),answers:[],index:0,fifty:null},seen:nextSeen};
}
export function validRound(round,bank){
  if(!round||!Array.isArray(round.ids)||round.ids.length!==10||new Set(round.ids).size!==10||!round.ids.every(id=>bank.some(q=>q.id===id)))return false;
  if(!Array.isArray(round.orders)||round.orders.length!==10||!round.orders.every(a=>Array.isArray(a)&&a.length===3&&new Set(a).size===3&&a.every(n=>Number.isInteger(n)&&n>=0&&n<3)))return false;
  if(!Array.isArray(round.answers)||round.answers.length>10||!round.answers.every(n=>Number.isInteger(n)&&n>=0&&n<3))return false;
  if(!Number.isInteger(round.index)||round.index<0||round.index>10||!(round.answers.length===round.index||(round.index<10&&round.answers.length===round.index+1)))return false;
  if(round.fifty==null)return true; // Saved games from before the lifeline remain valid.
  const {index,removed}=round.fifty;
  return Number.isInteger(index)&&index>=0&&index<10&&index<=round.index&&Number.isInteger(removed)&&removed>=0&&removed<3&&removed!==bank.find(q=>q.id===round.ids[index]).answer&&round.answers[index]!==removed;
}
export function restoreRound(round,bank){
  if(validRound(round,bank))return round;
  // A damaged lifeline must not erase an otherwise valid set of answers.
  const repaired={...round,fifty:null};return validRound(repaired,bank)?repaired:null;
}
export function useFifty(round,bank,rng=Math.random){
  if(!validRound(round,bank)||round.fifty||round.index>=10||round.answers.length!==round.index)return false;
  const q=bank.find(q=>q.id===round.ids[round.index]),wrong=[0,1,2].filter(option=>option!==q.answer);
  round.fifty={index:round.index,removed:wrong[Math.floor(rng()*wrong.length)]};return true;
}
export function scoreRound(round,bank){return round.answers.reduce((score,a,i)=>score+Number(a===bank.find(q=>q.id===round.ids[i]).answer),0);}
