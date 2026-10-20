import {maps,terrainHeight} from './shared.js';
import {MAP_EXTENT,mapPoint,radarMarkers,buildFootprints} from './minimap-data.js';

export function createMinimap(){
 const shell=document.createElement('aside');shell.id='minimap';shell.hidden=true;shell.setAttribute('aria-label','Terrain minimap: white is you, red is AI enemies. Other players are hidden.');
 shell.innerHTML='<div class="radarHeading"><span>TERRAIN</span><b>N ↑</b></div><canvas width="384" height="384"></canvas><div class="radarKey"><span>● YOU</span><span>● ENEMIES</span></div>';
 const style=document.createElement('style');style.textContent='#minimap{position:fixed;right:22px;top:116px;width:184px;padding:8px;background:#111d2dde;border:1px solid #ffffff35;border-radius:15px;z-index:4;pointer-events:none;box-shadow:0 5px 25px #0005}#minimap[hidden]{display:none}#minimap canvas{position:static;display:block;width:166px;height:166px;border-radius:8px}.radarHeading,.radarKey{display:flex;justify-content:space-between;font:9px sans-serif;letter-spacing:1px;color:#d5deeb;padding:2px 0 6px}.radarHeading b{font-size:10px;color:white}.radarKey{padding:7px 0 1px;font-size:8px;letter-spacing:.6px}.radarKey span:first-child{color:white}.radarKey span:last-child{color:#ff6062}@media(max-width:700px){#minimap{width:140px;right:10px;top:140px}#minimap canvas{width:122px;height:122px}}';document.head.append(style);document.body.append(shell);
 const canvas=shell.querySelector('canvas'),ctx=canvas.getContext('2d'),size=canvas.width,base=document.createElement('canvas');base.width=base.height=size;const ground=base.getContext('2d');let cachedMap=-1,lastDraw=0;
 const rgb=n=>[(n>>16)&255,(n>>8)&255,n&255];
 const construction=document.createElement('canvas');construction.width=construction.height=size;const constructionCtx=construction.getContext('2d');let lastBuilds=null;
 function terrain(index){
  const map=maps[index],color=rgb(map.ground),image=ground.createImageData(size,size);
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
   const x=(px/size*2-1)*MAP_EXTENT,z=(py/size*2-1)*MAP_EXTENT,h=terrainHeight(x,z,index),dx=terrainHeight(x+.4,z,index)-h,dz=terrainHeight(x,z+.4,index)-h;
   const contour=Math.abs(h/.9-Math.round(h/.9))<.045&&h>.25?.76:1,light=Math.max(.55,Math.min(1.6,1+h*.035-dx*.8-dz*.5))*contour,i=(py*size+px)*4;
   image.data[i]=Math.min(255,color[0]*light);image.data[i+1]=Math.min(255,color[1]*light);image.data[i+2]=Math.min(255,color[2]*light);image.data[i+3]=255;
  }ground.putImageData(image,0,0);
  ground.strokeStyle='#ffffff12';ground.lineWidth=1;for(let n=1;n<8;n++){ground.beginPath();ground.moveTo(n*size/8,0);ground.lineTo(n*size/8,size);ground.moveTo(0,n*size/8);ground.lineTo(size,n*size/8);ground.stroke();}
  for(const b of map.blocks)block(ground,b,'#bac7d5','#243344');
  for(const [x,z]of map.outposts||[]){const [px,py]=mapPoint(x,z,size);ground.strokeStyle='#c1e9ff';ground.lineWidth=2;ground.strokeRect(px-14,py-14,28,28);}
  cachedMap=index;
 }
 function block(c,[x,z,w,d],fill,stroke){const [px,py]=mapPoint(x-w/2,z-d/2,size),sx=w*size/(MAP_EXTENT*2),sy=d*size/(MAP_EXTENT*2);c.fillStyle=fill;c.fillRect(px,py,sx,sy);c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(px,py,sx,sy);}
 return {update(state,id,now=performance.now()){
  const playing=state&&['fight','break'].includes(state.phase);shell.hidden=!playing;if(!playing||now-lastDraw<100)return;lastDraw=now;
  if(cachedMap!==state.map)terrain(state.map);ctx.drawImage(base,0,0);
  if(lastBuilds!==state.builds){constructionCtx.clearRect(0,0,size,size);for(const b of state.builds||[])for(const box of buildFootprints(b))block(constructionCtx,box,'#85bbdb','#244558');lastBuilds=state.builds;}
  ctx.drawImage(construction,0,0);
  if(state.mode==='royale'){const [x,z]=mapPoint(0,0,size);ctx.strokeStyle='#b6a4ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,z,state.radius*size/(MAP_EXTENT*2),0,Math.PI*2);ctx.stroke();}
  const {me,enemies}=radarMarkers(state,id);
  for(const enemy of enemies){const [x,z]=mapPoint(enemy.x,enemy.z,size);ctx.beginPath();ctx.arc(x,z,enemy.boss?7:4.5,0,Math.PI*2);ctx.fillStyle='#ff3b47';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#69121a';ctx.stroke();}
  if(me){const [x,z]=mapPoint(me.x,me.z,size);ctx.beginPath();ctx.moveTo(x,z);ctx.lineTo(x-Math.sin(me.yaw)*18,z-Math.cos(me.yaw)*18);ctx.strokeStyle='#ffffffb0';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(x,z,6,0,Math.PI*2);ctx.fillStyle='white';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#142032';ctx.lineWidth=2;ctx.stroke();}
 }};
}
