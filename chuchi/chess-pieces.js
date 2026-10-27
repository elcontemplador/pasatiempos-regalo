// Original vector pieces: no remote images, fonts or third-party artwork.
const shapes={
p:'<circle cx="30" cy="15" r="7"/><path d="M25 22h10l-2 10c1 5 4 8 8 12H19c4-4 7-7 8-12z"/><path d="M17 44h26l3 8H14z"/>',
r:'<path d="M15 9h7v7h5V9h6v7h5V9h7v15H15z"/><path d="M20 24h20l-2 18H22z"/><path d="M18 42h24l4 10H14z"/>',
n:'<path d="M16 43c1-7 2-12 8-17l-9 3-4-8L25 9l6-4 1 8c13 2 17 12 13 30z"/><circle cx="26" cy="18" r="1.6" fill="currentColor" stroke="none"/><path d="M20 27l6-3" stroke="currentColor"/><path d="M15 43h30l2 9H13"/>',
b:'<path d="M30 5c-3 7-12 11-12 20 0 6 6 10 12 10s12-4 12-10C42 16 33 12 30 5z"/><path d="M33 14l-8 10" fill="none" stroke="currentColor"/><path d="M25 35h10l4 9H21z"/><path d="M18 44h24l4 8H14z"/>',
q:'<path d="M15 18l5 20h20l5-20-10 8-5-13-5 13z"/><circle cx="14" cy="15" r="3"/><circle cx="30" cy="10" r="3"/><circle cx="46" cy="15" r="3"/><path d="M21 38h18l3 6H18z"/><path d="M17 44h26l3 8H14z"/>',
k:'<path d="M27 5h6v5h5v5h-5v7h-6v-7h-5v-5h5z"/><path d="M16 28c0-6 5-9 9-7l5 4 5-4c4-2 9 1 9 7 0 4-6 9-8 12H24c-2-3-8-8-8-12z"/><path d="M22 40h16l4 5H18z"/><path d="M17 45h26l3 7H14z"/>'
};
export function pieceSvg(type,color){
 const fill=color==='w'?'#fffaf0':'#26384b',stroke=color==='w'?'#293b4e':'#101c2b';
 return '<svg class="chess-piece piece-'+color+'" viewBox="0 0 60 60" aria-hidden="true" focusable="false" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="color:'+(color==='w'?'#293b4e':'#e3edf7')+'">'+(shapes[type]||'')+'</svg>';
}
