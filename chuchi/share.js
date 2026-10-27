export const SHARE_URL=new URL('./',window.location.href).href;
export function initSharing(openDialog){
 const $=id=>document.getElementById(id),share=$('share-native'),copy=$('share-copy'),link=$('share-link'),status=$('share-status');
 link.value=SHARE_URL;
 share.hidden=typeof navigator.share!=='function';
 $('share-friends').addEventListener('click',event=>{status.textContent='';openDialog('share-dialog',event.currentTarget);});
 share.addEventListener('click',async()=>{
  const hadFocus=document.activeElement===share;share.disabled=true;status.textContent='';
  try{await navigator.share({title:'Los pasatiempos de Chuchi',url:SHARE_URL});}
  catch(error){if(error?.name!=='AbortError')status.textContent='Puedes usar «Copiar enlace» para compartir la web.';}
  finally{share.disabled=false;if(hadFocus&&$('share-dialog').open&&[document.body,$('share-dialog')].includes(document.activeElement))share.focus({preventScroll:true});}
 });
 copy.addEventListener('click',async()=>{
  const hadFocus=document.activeElement===copy;copy.disabled=true;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(SHARE_URL);status.textContent='Enlace copiado. Ya puedes pegarlo donde quieras.';}
  catch{link.focus();link.select();link.setSelectionRange(0,link.value.length);status.textContent='El enlace está seleccionado. Mantén pulsado sobre él y elige «Copiar», o usa Ctrl+C en el ordenador.';}
  finally{copy.disabled=false;if(hadFocus&&$('share-dialog').open&&[document.body,$('share-dialog')].includes(document.activeElement))copy.focus({preventScroll:true});}
 });
}
