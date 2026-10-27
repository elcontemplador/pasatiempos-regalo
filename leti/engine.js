export const themes=[{"id":"gredos","short":"Gredos","title":"Pueblos de Gredos","subtitle":"Nombres de pueblos y lugares de la sierra.","icon":"map","words":["Barajas","Bohoyo","Candeleda","Guisando","El Arenal","El Hornillo","Mombeltrán","Gilgarcía","Tormellas","Navacepeda"]},{"id":"novelas","short":"Grandes novelas","title":"Entre novelas","subtitle":"Diez novelas para perderse entre las letras.","icon":"book","words":["Rayuela","Ulises","Orlando","Beloved","Frankenstein","Jane Eyre","Pedro Páramo","La Regenta","Persuasión","Fahrenheit 451"]},{"id":"punk","short":"Punk","title":"Suena punk","subtitle":"Grupos para buscar a todo volumen.","icon":"tv","words":["Ramones","The Clash","Buzzcocks","The Damned","La Polla Records","Sex Pistols","Bad Brains","Misfits","Descendents","X-Ray Spex"]},{"id":"gallardo","short":"Libros y Gallardo","title":"Bibliotecas y Gallardo","subtitle":"Palabras de bibliotecas, libros y su historia.","icon":"book","words":["Gallardo","Biblioteca","Catálogo","Manuscrito","Incunable","Bibliógrafo","Archivo","Lectura","Cortes","Campanario"]},{"id":"miradas","short":"Miradas","words":["Foto","Luz","Imagen","Paisaje","Mirada","Retrato","Color","Memoria"],"title":"Miradas (ejemplo)","icon":"pin","subtitle":"Palabras de muestra; las elegiremos juntos."}];
export const photos=[{"id":"mirada-camara","src":"./assets/photos/mirada-camara.jpg","thumb":"./assets/photos/mirada-camara.thumb.jpg","width":600,"height":960,"title":"Una mirada con cámara","alt":"Fotografía en blanco y negro de una persona con una cámara junto a troncos."},{"id":"arco","src":"./assets/photos/arco.jpg","thumb":"./assets/photos/arco.thumb.jpg","width":590,"height":960,"title":"Una mirada a través del arco","alt":"Fotografía en blanco y negro de una persona con cámara bajo un arco de piedra."},{"id":"celebracion","src":"./assets/photos/celebracion.jpg","thumb":"./assets/photos/celebracion.thumb.jpg","width":640,"height":480,"title":"Un día de celebración","alt":"Dos personas con vestimenta académica en una celebración."},{"id":"salamanca","src":"./assets/photos/salamanca.jpg","thumb":"./assets/photos/salamanca.thumb.jpg","width":1400,"height":730,"title":"Salamanca en blanco y negro","alt":"Panorámica en blanco y negro de Salamanca con la catedral."}];
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
