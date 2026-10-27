// Pointer Events work with fingers, mouse and stylus; no native HTML drag-and-drop dependency.
export function initTileDrag({hand,root,targets,movesFor,drop,cancelNotice,tableDrop,preview,scrollables=[]}){
 const currentTargets=()=>typeof targets==='function'?targets():targets;
 let drag=null,frame=null,suppressed=null;
 function clear(){
  const d=drag;drag=null;preview?.(null);cancelAnimationFrame(frame);frame=null;if(!d)return;
  if(d.moved)suppressed={tile:d.tile,until:performance.now()+600};
  d.source.classList.remove('drag-origin');d.ghost?.remove();root.classList.remove('domino-dragging');
  currentTargets().forEach(({el})=>el.classList.remove('drop-available','drop-hover','drop-invalid'));
  try{if(d.source.hasPointerCapture(d.pointerId))d.source.releasePointerCapture(d.pointerId);}catch{/* Pointer may already have been cancelled by the browser. */}
 }
 function cancel(){clear();}
 function targetAt(x,y){
  const under=document.elementFromPoint(x,y);
  return currentTargets().filter(({el})=>!el.hidden).map(t=>{
   const rect=t.el.getBoundingClientRect(),clip=t.el.closest('.domino-arena')?.getBoundingClientRect();
   const left=Math.max(0,rect.left,clip?.left||0),right=Math.min(innerWidth,rect.right,clip?.right||innerWidth),top=Math.max(0,rect.top,clip?.top||0),bottom=Math.min(innerHeight,rect.bottom,clip?.bottom||innerHeight);
   return {...t,visibleHit:t.el.contains(under)||!!clip&&t.el.closest('.domino-arena').contains(under),rect:{left,right,top,bottom,width:right-left,height:bottom-top}};
  }).filter(({rect:r,visibleHit})=>visibleHit&&r.width>0&&r.height>0&&x>=r.left-10&&x<=r.right+10&&y>=r.top-10&&y<=r.bottom+10)
   .sort((a,b)=>Math.hypot(x-(a.rect.left+a.rect.width/2),y-(a.rect.top+a.rect.height/2))-Math.hypot(x-(b.rect.left+b.rect.width/2),y-(b.rect.top+b.rect.height/2)))[0];

 }
 function position(){
  if(!drag?.moved)return;
  drag.ghost.style.left=(drag.x-drag.width/2)+'px';drag.ghost.style.top=(drag.y-drag.height/2)+'px';
  const moves=movesFor(drag.tile),hit=targetAt(drag.x,drag.y)||tableDrop?.(drag.x,drag.y,moves);
  preview?.(drag.tile,hit&&moves.find(m=>m.side===hit.side||hit.side==='left'&&m.side==='start'));
  currentTargets().forEach(({el,side})=>{
   const valid=moves.some(m=>m.side===side||side==='left'&&m.side==='start');
   el.classList.toggle('drop-available',valid);el.classList.toggle('drop-hover',valid&&hit?.el===el);el.classList.toggle('drop-invalid',!valid&&hit?.el===el);
  });
 }
 function autoScroll(){
  if(!drag?.moved)return;
  const inner=scrollables.find(el=>{const r=el.getBoundingClientRect();return drag.x>=r.left&&drag.x<=r.right&&drag.y>=r.top&&drag.y<=r.bottom;});
  const hit=targetAt(drag.x,drag.y);
  if(inner&&!hit){
   const r=inner.getBoundingClientRect(),band=32;
   const dx=drag.x<r.left+band?-6:drag.x>r.right-band?6:0,dy=drag.y<r.top+band?-6:drag.y>r.bottom-band?6:0;
   if(dx||dy){inner.scrollLeft+=dx;inner.scrollTop+=dy;position();}
  }else if(!inner){
   const scroller=root.closest('dialog[open]'),r=scroller?.getBoundingClientRect(),top=(r?.top||0)+65,bottom=Math.min(r?.bottom||innerHeight,innerHeight)-25,band=50;
   const delta=drag.y<top+band?-Math.min(12,(top+band-drag.y)/4):drag.y>bottom-band?Math.min(12,(drag.y-bottom+band)/4):0;
   if(delta){if(scroller)scroller.scrollTop+=delta;else window.scrollBy(0,delta);position();}
  }
  frame=requestAnimationFrame(autoScroll);
 }
 hand.addEventListener('pointerdown',e=>{
  const source=e.target.closest('.domino-tile');
  if(drag||!source||source.disabled||e.isPrimary===false||e.button!==0||!movesFor(Number(source.dataset.tile)).length)return;
  suppressed=null;const r=source.getBoundingClientRect();drag={source,tile:Number(source.dataset.tile),pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,width:r.width,height:r.height,moved:false};
  try{source.setPointerCapture(e.pointerId);}catch{/* Window listeners also handle mouse movement without capture. */}
 });
 window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  drag.x=e.clientX;drag.y=e.clientY;
  if(!drag.moved&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<8)return;
  if(!drag.moved){
   drag.moved=true;drag.ghost=drag.source.cloneNode(true);drag.ghost.removeAttribute('id');drag.ghost.disabled=true;drag.ghost.tabIndex=-1;drag.ghost.setAttribute('aria-hidden','true');drag.ghost.classList.add('domino-drag-ghost');drag.ghost.style.width=drag.width+'px';drag.ghost.style.height=drag.height+'px';
   root.append(drag.ghost);drag.source.classList.add('drag-origin');root.classList.add('domino-dragging');frame=requestAnimationFrame(autoScroll);
  }
  if(e.cancelable)e.preventDefault();position();
 },{passive:false});
 window.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  const d=drag;if(!d.moved){clear();return;}
  const moves=movesFor(d.tile),hit=targetAt(e.clientX,e.clientY)||tableDrop?.(e.clientX,e.clientY,moves),move=hit&&moves.find(m=>m.side===hit.side||hit.side==='left'&&m.side==='start');
  suppressed={tile:d.tile,until:performance.now()+600};if(e.cancelable)e.preventDefault();clear();
  if(move)drop(move);else cancelNotice();
 });
 hand.addEventListener('click',e=>{
  if(e.detail!==0&&suppressed&&performance.now()<suppressed.until&&Number(e.target.closest('.domino-tile')?.dataset.tile)===suppressed.tile){e.preventDefault();e.stopImmediatePropagation();suppressed=null;}
 },true);
 hand.addEventListener('dragstart',e=>e.preventDefault());
 hand.addEventListener('contextmenu',e=>{if(drag)e.preventDefault();});
 hand.addEventListener('lostpointercapture',e=>{if(drag?.pointerId===e.pointerId)clear();});
 window.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId)clear();});
 window.addEventListener('pointerdown',e=>{if(drag&&e.pointerId!==drag.pointerId)clear();},true);
 window.addEventListener('blur',clear);window.addEventListener('resize',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag?.moved){e.preventDefault();e.stopImmediatePropagation();clear();}},true);
 return {cancel};
}
