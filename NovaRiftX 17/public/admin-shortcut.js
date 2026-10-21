// Full panel: Command/Ctrl. Core & Memes: Option/Alt. Release modifiers before
// the final keys to avoid shortcuts reserved by the operating system.
export const createAdminShortcut=()=>createShortcut(false);
export const createLegacyAdminShortcut=()=>createShortcut(true);
function createShortcut(legacy){
 let step=0,last=0;
 const shortcut=(event,allowed,now)=>{
  if(!allowed){step=0;return false;}
  if(event.repeat)return false;
  if(now-last>10000)step=0;
  last=now;
  const key=event.key;
  const command=legacy?(event.metaKey||event.ctrlKey):event.altKey;
  const first=legacy?(key==='+'||event.code==='Equal'||event.code==='NumpadAdd'):(key==='j'||key==='J'||event.code==='KeyJ');
  const second=legacy?(key==='_'||event.code==='Minus'||event.code==='NumpadSubtract'):(key==='y'||key==='Y'||event.code==='KeyY');
  if(key==='Shift'||event.code==='ShiftLeft'||event.code==='ShiftRight'){if(step<2)step=command?2:1;return false;}
  const modifier=legacy?(['Meta','Control','OS'].includes(key)||['MetaLeft','MetaRight','ControlLeft','ControlRight'].includes(event.code)):(['Alt','Option'].includes(key)||['AltLeft','AltRight'].includes(event.code));
  if(modifier){if(step===1||event.shiftKey)step=2;return false;}
  if(first&&((command&&event.shiftKey)||step>=2)){step=3;event.preventDefault?.();return false;}
  if(step===3&&second){step=0;event.preventDefault?.();return true;}
  step=0;return false;
 };
 shortcut.progress=()=>step;
 shortcut.reset=()=>{step=0;last=0;};
 return shortcut;
}
