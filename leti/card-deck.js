export const SUITS=['oros','copas','espadas','bastos'];
export const RANKS=[1,2,3,4,5,6,7,10,11,12];
export function card(id){if(!Number.isInteger(id)||id<0||id>=40)return null;return {id,suit:SUITS[Math.floor(id/10)],rank:RANKS[id%10]};}
export function cardName(id){const c=card(id);return c?`${({1:'As',10:'Sota',11:'Caballo',12:'Rey'})[c.rank]||c.rank} de ${c.suit}`:'Carta oculta';}
export function seeded(seed){let v=Number(seed)>>>0;return()=>{v=(v+0x6D2B79F5)>>>0;let t=v;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function makeDeck(seed){const cards=Array.from({length:40},(_,i)=>i),rng=seeded(seed);for(let i=cards.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
