import * as T from '/vendor/three.module.js';
import {buildBoxes} from './building.js';
import {terrainHeight,rayBox} from './shared.js';
export function buildingControls(scene,getState,getId,send){
 let enabled=false,kind='wall',models=new Map(),ghostKey='';
 const hint=document.createElement('div');hint.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);color:white;background:#102035dd;border-radius:12px;padding:8px;font:12px sans-serif;pointer-events:none;z-index:20';hint.hidden=true;document.body.append(hint);
 const ghost=new T.Group();scene.add(ghost);
 function mesh(b,preview=false){const g=new T.Group();for(const [x,z,w,d,h,y]of buildBoxes(b)){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:preview?0x77e6ff:0x567c9c,metalness:.55,roughness:.35,transparent:preview,opacity:preview?.35:1}));m.position.set(x,y+h/2,z);m.castShadow=!preview;m.receiveShadow=true;g.add(m);}return g;}
 function dispose(g){g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});g.removeFromParent();}
 function aim(){const s=getState(),p=s?.players.find(p=>p.id===getId());if(!p)return null;const o=[p.x,p.y+1.55,p.z],d=[-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)];return (s.builds||[]).filter(b=>b.owner===p.id).map(b=>({b,t:Math.min(...buildBoxes(b).map(([x,z,w,hz,h,y])=>rayBox(o,d,[x-w/2,y,z-hz/2],[x+w/2,y+h,z+hz/2])))})).filter(q=>q.t<9).sort((a,b)=>a.t-b.t)[0]?.b;}
 document.addEventListener('keydown',e=>{if(!document.pointerLockElement)return;if(e.code==='KeyB'){enabled=!enabled;e.preventDefault();}if(enabled&&['KeyZ','KeyX','KeyT'].includes(e.code)){kind={KeyZ:'wall',KeyX:'floor',KeyT:'ramp'}[e.code];e.preventDefault();}if(['KeyG','Delete','Backspace'].includes(e.code)&&!e.repeat){const b=aim();if(b){send({type:'build',action:e.code==='KeyG'?'edit':'remove',id:b.id});e.preventDefault();}}});
 document.addEventListener('mousedown',e=>{if(enabled&&document.pointerLockElement&&e.button===0){e.preventDefault();e.stopImmediatePropagation();send({type:'build',kind});}},true);
 return {update(){const s=getState(),p=s?.players.find(p=>p.id===getId());hint.hidden=!p||!document.pointerLockElement;hint.textContent=enabled?`BUILD: ${kind.toUpperCase()} · Click place · Z wall · X floor · T ramp · G door edit · Delete remove · B exit`:'B build · double-tap and hold W sprint · C slide';
 const keep=new Set();for(const b of s?.builds||[]){const key=JSON.stringify(b);keep.add(key);if(!models.has(key)){const g=mesh(b);models.set(key,g);scene.add(g);}}for(const [key,g]of models)if(!keep.has(key)){dispose(g);models.delete(key);}
 if(enabled&&p&&document.pointerLockElement){const x=Math.round((p.x-Math.sin(p.yaw)*5)/4)*4,z=Math.round((p.z-Math.cos(p.yaw)*5)/4)*4;const b={kind,x,z,y:Math.max(terrainHeight(x,z,s.map),Math.floor((p.y+.25)/3)*3),turn:Math.abs(Math.sin(p.yaw))>.7},key=JSON.stringify(b);if(key!==ghostKey){for(const g of [...ghost.children])dispose(g);ghost.add(mesh(b,true));ghostKey=key;}ghost.visible=true;}else ghost.visible=false;
 },result(message){hint.textContent=message;}};
}
