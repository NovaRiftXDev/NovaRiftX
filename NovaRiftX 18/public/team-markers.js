import * as T from '/vendor/three.module.js';
import {sameTeam} from './royale-teams.js';
// At most three squad markers; keep instanced creature rendering unchanged.
export function createTeamMarkers(scene){
 const markers=new Map();
 return {update(state,id){
  const me=state?.players.find(p=>p.id===id),active=new Set();
  for(const q of [...(state?.players||[]),...(state?.enemies||[])]){
   if(q.id===id||q.hp<=0||!sameTeam(state,me,q)||!['fight','break'].includes(state.phase))continue;
   active.add(q.id);let sprite=markers.get(q.id);
   if(!sprite){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#102a24dd';ctx.fillRect(0,0,256,64);ctx.fillStyle='#82f5c5';ctx.font='bold 23px system-ui';ctx.textAlign='center';ctx.fillText('ALLY · '+String(q.name).slice(0,15),128,41);const map=new T.CanvasTexture(canvas);sprite=new T.Sprite(new T.SpriteMaterial({map,depthTest:false,transparent:true}));sprite.scale.set(2.4,.6,1);sprite.renderOrder=10;scene.add(sprite);markers.set(q.id,sprite);}
   sprite.position.set(q.x,(q.y||0)+2.6,q.z);
  }
  for(const [key,sprite]of markers)if(!active.has(key)){scene.remove(sprite);sprite.material.map.dispose();sprite.material.dispose();markers.delete(key);}
 }};
}
