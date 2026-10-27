export const themes=[{"id":"aves","short":"Aves","words":["Ala","Nido","Pluma","Canto","Vuelo","Pico","Cielo","Árbol"],"title":"Entre aves (ejemplo)","icon":"sprout","subtitle":"Palabras de muestra para la vista previa."},{"id":"madera","short":"Taller","words":["Madera","Sierra","Banco","Lija","Pieza","Metro","Clavo","Cepillo"],"title":"En el taller (ejemplo)","icon":"cup","subtitle":"Palabras de muestra; las elegiremos juntos."}];
export const photos=[{"id":"caja-nido","src":"./assets/photos/caja-nido.jpg","thumb":"./assets/photos/caja-nido.thumb.jpg","width":1051,"height":1400,"title":"Una caja nido","alt":"Una caja nido de madera colocada en un árbol."},{"id":"ave-tejado","src":"./assets/photos/ave-tejado.jpg","thumb":"./assets/photos/ave-tejado.thumb.jpg","width":1377,"height":1364,"title":"Un pájaro en el tejado","alt":"Un pájaro posado sobre un tejado de tejas."},{"id":"abejaruco","src":"./assets/photos/abejaruco.jpg","thumb":"./assets/photos/abejaruco.thumb.jpg","width":1400,"height":933,"title":"Abejaruco en vuelo","alt":"Un abejaruco europeo vuela con las alas extendidas sobre un cielo azul.","attribution":{"author":"Charles J. Sharp","source":"https://commons.wikimedia.org/wiki/File:European_bee-eater_(Merops_apiaster)_in_flight.jpg","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0/"}},{"id":"petirrojo","src":"./assets/photos/petirrojo.jpg","thumb":"./assets/photos/petirrojo.thumb.jpg","width":1400,"height":933,"title":"Petirrojo","alt":"Un petirrojo europeo posado en el suelo.","attribution":{"author":"Diego Delso, delso.photo","source":"https://commons.wikimedia.org/wiki/File:Petirrojo_europeo_(Erithacus_rubecula),_Almuradiel,_Ciudad_Real,_Espa%C3%B1a,_2021-12-19,_DD_14.jpg","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0/"}},{"id":"ciguena","src":"./assets/photos/ciguena.jpg","thumb":"./assets/photos/ciguena.thumb.jpg","width":1400,"height":1050,"title":"Cigüeña blanca","alt":"Una cigüeña blanca entre hierbas en un humedal.","attribution":{"author":"Fernando Losada Rodríguez","source":"https://commons.wikimedia.org/wiki/File:Ciconia_ciconia.002_-_Villafafila.jpg","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0/"}}];
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
