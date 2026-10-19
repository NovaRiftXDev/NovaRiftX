// The full sequence is required, but keys may be held or released between steps.
export function createAdminShortcut(){
 let step=0,last=0;
 const shortcut=(event,inShop,now)=>{
  if(!inShop){step=0;return false;}
  if(event.repeat)return false;
  if(now-last>10000)step=0;
  last=now;
  const key=event.key,plus=key==='+'||event.code==='Equal'||event.code==='NumpadAdd',underscore=key==='_'||event.code==='Minus'||event.code==='NumpadSubtract';
  if(key==='Shift'){if(step<2)step=event.metaKey?2:1;return false;}
  if(key==='Meta'){if(step===1||event.shiftKey)step=2;return false;}
  if(plus&&((event.metaKey&&event.shiftKey)||step>=2)){step=3;event.preventDefault?.();return false;}
  if(step===3&&underscore){step=0;event.preventDefault?.();return true;}
  step=0;return false;
 };
 shortcut.progress=()=>step;
 return shortcut;
}
