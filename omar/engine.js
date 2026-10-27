export const themes=[{"id":"rutas","short":"Rutas","words":["Camino","Motor","Ruta","Montaña","Tierra","Viaje","Valle","Rueda"],"title":"Rutas (ejemplo)","icon":"map","subtitle":"Palabras de muestra para la vista previa."},{"id":"taller","short":"Taller","words":["Llave","Tornillo","Aceite","Pieza","Engranaje","Taller","Freno","Tuerca"],"title":"En el taller (ejemplo)","icon":"cup","subtitle":"Palabras de muestra; las elegiremos juntos."}];
export const photos=[{"id":"ruta-agua","src":"./assets/photos/ruta-agua.jpg","thumb":"./assets/photos/ruta-agua.thumb.jpg","width":720,"height":540,"title":"Una ruta junto al agua","alt":"Un todoterreno cruza una zona de agua en un paisaje arbolado."},{"id":"dos-todoterrenos","src":"./assets/photos/dos-todoterrenos.jpg","thumb":"./assets/photos/dos-todoterrenos.thumb.jpg","width":1400,"height":1050,"title":"Dos todoterrenos en el campo","alt":"Dos vehículos todoterreno aparcados en un paisaje abierto."},{"id":"camino","src":"./assets/photos/camino.jpg","thumb":"./assets/photos/camino.thumb.jpg","width":1400,"height":1050,"title":"Camino abierto","alt":"Un todoterreno recorre un camino entre praderas bajo un cielo nublado."},{"id":"puente","src":"./assets/photos/puente.jpg","thumb":"./assets/photos/puente.thumb.jpg","width":960,"height":720,"title":"Una ruta sobre el puente","alt":"Varios vehículos cruzan un puente de piedra en un paisaje rural."}];
export function normalize(text){return text.toLocaleUpperCase('es').replaceAll('Ñ','~').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('~','Ñ').replace(/[^A-ZÑ0-9]/g,'');}
export function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(list,rng=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function lineBetween(a,b,cols){const ar=Math.floor(a/cols),ac=a%cols,br=Math.floor(b/cols),bc=b%cols;const dr=br-ar,dc=bc-ac;if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return [];const len=Math.max(Math.abs(dr),Math.abs(dc));return Array.from({length:len+1},(_,i)=>(ar+i*Math.sign(dr))*cols+ac+i*Math.sign(dc));}
export function makeWordSearch(words,{difficulty='calma',seed=Date.now()}={}){
  const rng=seeded(seed), entries=words.map(label=>({label,text:normalize(label)}));
  const cols=10,rows=Math.max(10,...entries.map(w=>w.text.length));
  const dirs=difficulty==='reto'?[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]:[[0,1],[1,0]];
  for(let attempt=0;attempt<160;attempt++){
    const grid=Array(rows*cols).fill(''),placements=[];
    const sorted=shuffle(entries,rng).sort((a,b)=>b.text.length-a.text.length);
    for(const word of sorted){
      const candidates=[];
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)for(const [dr,dc]of dirs){
        const er=r+dr*(word.text.length-1),ec=c+dc*(word.text.length-1);
        if(er<0||er>=rows||ec<0||ec>=cols)continue;
        const cells=Array.from(word.text,(_,i)=>(r+i*dr)*cols+c+i*dc);
        if(cells.every((p,i)=>!grid[p]||grid[p]===word.text[i]))candidates.push({cells,score:cells.filter(p=>grid[p]).length+rng()*.8});
      }
      if(!candidates.length)break;
      candidates.sort((a,b)=>b.score-a.score);const {cells}=candidates[0];
      cells.forEach((p,i)=>grid[p]=word.text[i]);placements.push({...word,cells});
    }
    if(placements.length===entries.length){
      const alphabet='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
      return {cols,rows,grid:grid.map(c=>c||alphabet[Math.floor(rng()*alphabet.length)]),placements,seed,difficulty};
    }
  }
  throw new Error('No se pudo preparar el tablero. Inténtalo de nuevo.');
}
export function matchWord(board,a,b){const cells=lineBetween(a,b,board.cols);if(!cells.length)return null;const str=cells.map(i=>board.grid[i]).join('');const word=board.placements.find(w=>w.text===str||w.text===[...str].reverse().join(''));return word?{text:word.text,label:word.label,cells}:null;}
export function puzzleSolved(tiles){return tiles.every((value,index)=>value===index);}
export function newPuzzle(size,rng=Math.random){let tiles=shuffle(Array.from({length:size*size},(_,i)=>i),rng);if(puzzleSolved(tiles))[tiles[0],tiles[1]]=[tiles[1],tiles[0]];return tiles;}
export function swapTiles(tiles,a,b){const next=[...tiles];[next[a],next[b]]=[next[b],next[a]];return next;}
