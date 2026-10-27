// Table geometry only. Chain order and all legal moves remain in the rule engine.
export function tableLayout(chain,anchorTile,width=640,unit=32){
 const u=Math.max(32,unit),gap=2,w=Math.max(width,u*12),bound=w/2-u*2,pad=u*1.6;
 const anchor=Math.max(0,chain.findIndex(t=>t.tile===anchorTile)),poses=[];
 function dimensions(t,vertical){const double=t.a===t.b;return {length:double?u:2*u,cross:double?2*u:u,vertical,double};}
 function pose(t,index,x,y,vertical,forward,direction){
  const d=dimensions(t,vertical),angle=d.double?(vertical?0:90):vertical?(direction*forward>0?90:270):(direction*forward>0?0:180);
  const p={tile:t.tile,index,x,y,width:vertical?d.cross:d.length,height:vertical?d.length:d.cross,angle};poses.push(p);return p;
 }
 const start=chain.length?pose(chain[anchor],anchor,0,0,false,1,1):null;
 function branch(indices,initialDirection,verticalSign,forward){
  let dx=initialDirection,vertical=false,turns=0,out={x:start?start.x+dx*start.width/2:0,y:0,dx,dy:0};
  for(const index of indices){
   const t=chain[index];let d=dimensions(t,false),x,y;
   if(!vertical&&((dx>0&&out.x+gap+d.length>bound)||(dx<0&&out.x-gap-d.length< -bound))){vertical=true;turns=0;}
   if(vertical){
    d=dimensions(t,true);
    if(turns===0){x=out.x+dx*(d.cross/2+gap);y=out.y+verticalSign*(d.length/2-u/2);}
    else{x=out.x;y=out.y+verticalSign*(d.length/2+gap);}
    const p=pose(t,index,x,y,true,forward,verticalSign);out={x,y:y+verticalSign*p.height/2,dx:0,dy:verticalSign};turns++;
    if(turns===2){vertical=false;dx=-dx;out.bend=true;}
   }else{
    if(out.bend){x=out.x+dx*(d.length/2-u/2);y=out.y+verticalSign*(d.cross/2+gap);}
    else{x=out.x+dx*(d.length/2+gap);y=out.y;}
    const p=pose(t,index,x,y,false,forward,dx);out={x:x+dx*p.width/2,y,dx,dy:0};
   }
  }
  return out;
 }
 const left=branch(Array.from({length:anchor},(_,i)=>anchor-1-i),-1,-1,-1),right=branch(Array.from({length:Math.max(0,chain.length-anchor-1)},(_,i)=>anchor+1+i),1,1,1);
 const minY=Math.min(-u*2,...poses.map(p=>p.y-p.height/2),left.y-u*2,right.y-u*2),maxY=Math.max(u*2,...poses.map(p=>p.y+p.height/2),left.y+u*2,right.y+u*2),shiftY=pad-minY;
 for(const p of poses){p.x+=w/2;p.y+=shiftY;}
 function end(o){return {...o,x:o.x+w/2,y:o.y+shiftY};}
 return {width:w,height:maxY-minY+pad*2,poses:poses.sort((a,b)=>a.index-b.index),left:end(left),right:end(right),origin:{x:w/2,y:shiftY},unit:u};
}
