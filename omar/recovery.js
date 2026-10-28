import {normalize} from './engine.js?v=28';

// One previous board per collection and level; never retain a blank restart.
export function wordRecovery(value,words){
 if(!value||!Number.isSafeInteger(value.seed)||!Array.isArray(value.found)||!value.found.length)return null;
 const known=new Set(words.map(normalize));
 if(new Set(value.found).size!==value.found.length||!value.found.every(word=>known.has(word)))return null;
 const paths={};
 for(const word of value.found){const cells=value.paths?.[word];if(Array.isArray(cells)&&cells.every(n=>Number.isSafeInteger(n)&&n>=0))paths[word]=[...cells];}
 return {seed:value.seed,found:[...value.found],paths,...(value.version===2?{version:2}:{})};
}
export function puzzleRecovery(value,size){
 const tiles=value?.tiles;
 if(!Array.isArray(tiles)||tiles.length!==size*size||new Set(tiles).size!==size*size||!tiles.every(n=>Number.isInteger(n)&&n>=0&&n<size*size)||!Number.isSafeInteger(value.moves)||value.moves<=0)return null;
 return {tiles:[...tiles],moves:value.moves};
}
export function cleanRecoveries(saved,themes,photos){
 const words={},puzzles={};
 for(const theme of themes)for(const level of ['calma','reto']){const key=`${theme.id}-${level}`,copy=wordRecovery(saved?.words?.[key],theme.words);if(copy)words[key]=copy;}
 for(const photo of photos)for(const size of [3,4]){const key=`${photo.id}-${size}`,copy=puzzleRecovery(saved?.puzzles?.[key],size);if(copy)puzzles[key]=copy;}
 return {words,puzzles};
}
