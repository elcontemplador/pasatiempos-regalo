export const themes=[{"id":"bares-salamanca","title":"Bares de Salamanca","short":"Bares de Salamanca","subtitle":"Nombres para recordar las noches salmantinas.","icon":"chat","words":["El Faro","El Pino","Belle Époque","La Polémica","Tee Pub","Camelot","Morgana","Hindagala","Tartana","Submarino"]},{"id":"marcas-coches","title":"Marcas de coches","short":"Marcas de coches","subtitle":"Diez marcas para quienes disfrutan del motor.","icon":"car","words":["Nissan","Toyota","Jeep","Suzuki","Subaru","Land Rover","Seat","Ford","Renault","Mercedes"]},{"id":"piezas-motor","title":"Piezas de motor","short":"Piezas de motor","subtitle":"Del taller al tablero.","icon":"engine","words":["Pistón","Cigüeñal","Biela","Cilindro","Culata","Válvula","Árbol de levas","Inyector","Bujía","Cárter"]},{"id":"piezas-moto","title":"Piezas de moto","short":"Piezas de moto","subtitle":"Dos ruedas y sus componentes.","icon":"motorbike","words":["Manillar","Horquilla","Cadena","Embrague","Depósito","Retrovisor","Sillín","Chasis","Caballete","Pistón"]},{"id":"sanabria","title":"Pueblos del entorno de Sanabria","short":"Sanabria","subtitle":"Localidades y núcleos de la comarca y del entorno del lago.","icon":"pin","unit":"localidades","words":["Ribadelago","San Martín de Castañeda","Vigo de Sanabria","Galende","Pedrazales","El Puente","Rabanillo","Cubelo","Sotillo de Sanabria","Quintana de Sanabria"]},{"id":"villarino-arribes","title":"Villarino y los Arribes","short":"Villarino y Arribes","subtitle":"Pueblos a ambos lados de las provincias de Salamanca y Zamora, con Villarino como punto de partida.","icon":"map","unit":"localidades","words":["Villarino de los Aires","Pereña de la Ribera","Masueco","Aldeadávila de la Ribera","Mieza","Vilvestre","Saucelle","Fermoselle","Hinojosa de Duero","La Fregeneda"]},{"id":"viana-lugares","title":"Los lugares de Viana do Bolo","short":"Viana do Bolo","subtitle":"Diez núcleos del municipio para recorrer sus nombres con calma.","icon":"sprout","unit":"lugares","words":["Viana do Bolo","Bembibre","Caldesiños","Grixoa","Hedroso","Mourisca","Penouta","Pradocabalos","Punxeiro","Quintela do Pando"]},{"id":"salamanca-territorio","title":"Salamanca y sus pueblos","short":"Salamanca","subtitle":"De la capital a las sierras y las villas de la provincia.","icon":"pin","unit":"localidades","words":["Salamanca","Alba de Tormes","Ciudad Rodrigo","Candelario","Béjar","La Alberca","Mogarraz","Ledesma","Miranda del Castañar","Peñaranda de Bracamonte"]}];
export const photos=[{"id":"ruta-agua","src":"./assets/photos/ruta-agua.jpg","thumb":"./assets/photos/ruta-agua.thumb.jpg","width":720,"height":540,"title":"Una ruta junto al agua","alt":"Un todoterreno cruza una zona de agua en un paisaje arbolado."},{"id":"dos-todoterrenos","src":"./assets/photos/dos-todoterrenos.jpg","thumb":"./assets/photos/dos-todoterrenos.thumb.jpg","width":1400,"height":1050,"title":"Dos todoterrenos en el campo","alt":"Dos vehículos todoterreno aparcados en un paisaje abierto."},{"id":"camino","src":"./assets/photos/camino.jpg","thumb":"./assets/photos/camino.thumb.jpg","width":1400,"height":1050,"title":"Camino abierto","alt":"Un todoterreno recorre un camino entre praderas bajo un cielo nublado."},{"id":"puente","src":"./assets/photos/puente.jpg","thumb":"./assets/photos/puente.thumb.jpg","width":960,"height":720,"title":"Una ruta sobre el puente","alt":"Varios vehículos cruzan un puente de piedra en un paisaje rural."},{"id":"niebla","src":"./assets/photos/niebla.jpg","thumb":"./assets/photos/niebla.thumb.jpg","width":396,"height":395,"title":"Un día entre la niebla","alt":"Una persona de pie en un paisaje con niebla."},{"id":"recuerdo-infancia","src":"./assets/photos/recuerdo-infancia.jpg","thumb":"./assets/photos/recuerdo-infancia.thumb.jpg","width":720,"height":960,"title":"Un recuerdo de infancia","alt":"Un niño con un jersey rojo junto a unas cortinas."},{"id":"atardecer-agua","src":"./assets/photos/atardecer-agua.jpg","thumb":"./assets/photos/atardecer-agua.thumb.jpg","width":1080,"height":647,"title":"Atardecer junto al agua","alt":"Una puesta de sol junto al agua, con un vehículo en la orilla."},{"id":"agua-y-montes","src":"./assets/photos/agua-y-montes.jpg","thumb":"./assets/photos/agua-y-montes.thumb.jpg","width":960,"height":720,"title":"Agua y montes","alt":"Un paisaje de agua, orillas y montes arbolados visto desde arriba."}];
export function normalize(text){return text.toLocaleUpperCase('es').replaceAll('Ñ','~').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('~','Ñ').replace(/[^A-ZÑ0-9]/g,'');}
export function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(list,rng=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function lineBetween(a,b,cols){const ar=Math.floor(a/cols),ac=a%cols,br=Math.floor(b/cols),bc=b%cols;const dr=br-ar,dc=bc-ac;if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return [];const len=Math.max(Math.abs(dr),Math.abs(dc));return Array.from({length:len+1},(_,i)=>(ar+i*Math.sign(dr))*cols+ac+i*Math.sign(dc));}
// Las etiquetas completas se conservan como identificadores de las partidas.
const shortSearches={
 'FAHRENHEIT451':'FAHRENHEIT','SANMARTINDECASTAÑEDA':'CASTAÑEDA','VIGODESANABRIA':'VIGO','SOTILLODESANABRIA':'SOTILLO','QUINTANADESANABRIA':'QUINTANA',
 'VILLARINODELOSAIRES':'VILLARINO','PEREÑADELARIBERA':'PEREÑA','ALDEADAVILADELARIBERA':'ALDEADAVILA','HINOJOSADEDUERO':'HINOJOSA','LAFREGENEDA':'FREGENEDA',
 'VIANADOBOLO':'VIANA','QUINTELADOPANDO':'QUINTELA','ALBADETORMES':'ALBA','CIUDADRODRIGO':'RODRIGO','MIRANDADELCASTAÑAR':'MIRANDA','PEÑARANDADEBRACAMONTE':'PEÑARANDA',
 'LAPOLLARECORDS':'LAPOLLA','VICTORFRANKENSTEIN':'FRANKENSTEIN'
};
export function makeWordSearch(words,{difficulty='calma',seed=Date.now(),version=1}={}){
  const rng=seeded(seed), entries=words.map(label=>{const text=normalize(label);return version===2?{label,text,search:shortSearches[text]||text}:{label,text};});
  const maxLength=Math.max(10,...entries.map(w=>(w.search||w.text).length));
  const cols=version===2?maxLength:10,rows=Math.max(10,maxLength);
  if(version===2&&new Set(entries.map(w=>w.search)).size!==entries.length)throw new Error('Hay palabras de búsqueda repetidas.');
  const dirs=difficulty==='reto'?[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]:[[0,1],[1,0]];
  for(let attempt=0;attempt<160;attempt++){
    const grid=Array(rows*cols).fill(''),placements=[];
    const sorted=shuffle(entries,rng).sort((a,b)=>(b.search||b.text).length-(a.search||a.text).length);
    for(const word of sorted){
      const letters=word.search||word.text,candidates=[];
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)for(const [dr,dc]of dirs){
        const er=r+dr*(letters.length-1),ec=c+dc*(letters.length-1);
        if(er<0||er>=rows||ec<0||ec>=cols)continue;
        const cells=Array.from(letters,(_,i)=>(r+i*dr)*cols+c+i*dc);
        if(cells.every((p,i)=>!grid[p]||grid[p]===letters[i]))candidates.push({cells,score:cells.filter(p=>grid[p]).length+rng()*.8});
      }
      if(!candidates.length)break;
      candidates.sort((a,b)=>b.score-a.score);const {cells}=candidates[0];
      cells.forEach((p,i)=>grid[p]=letters[i]);placements.push({...word,cells});
    }
    if(placements.length===entries.length){
      const alphabet='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
      return {cols,rows,grid:grid.map(c=>c||alphabet[Math.floor(rng()*alphabet.length)]),placements,seed,difficulty,...(version===2?{version:2}:{})};
    }
  }
  throw new Error('No se pudo preparar el tablero. Inténtalo de nuevo.');
}
export function matchWord(board,a,b){const cells=lineBetween(a,b,board.cols);if(!cells.length)return null;const str=cells.map(i=>board.grid[i]).join('');const word=board.placements.find(w=>(w.search||w.text)===str||(w.search||w.text)===[...str].reverse().join(''));return word?{text:word.text,label:word.label,cells}:null;}
export function puzzleSolved(tiles){return tiles.every((value,index)=>value===index);}
export function newPuzzle(size,rng=Math.random){let tiles=shuffle(Array.from({length:size*size},(_,i)=>i),rng);if(puzzleSolved(tiles))[tiles[0],tiles[1]]=[tiles[1],tiles[0]];return tiles;}
export function swapTiles(tiles,a,b){const next=[...tiles];[next[a],next[b]]=[next[b],next[a]];return next;}
