import {maps,terrainHeight} from './shared.js';
export function buildBoxes(b){
 const box=(x,z,w,d,h,y=b.y)=>[x,z,w,d,h,y];
 if(b.kind==='floor')return [box(b.x,b.z,4,4,.2)];
 if(b.kind==='ramp')return Array.from({length:20},(_,i)=>{const t=(i+.5)/20*4-2;return box(b.x+(b.turn?t:0),b.z+(b.turn?0:t),b.turn?.2:4,b.turn?4:.2,(i+1)*.15).concat(true);});
 const wall=(offset,width,height,y)=>box(b.x+(b.turn?0:offset),b.z+(b.turn?offset:0),b.turn?.22:width,b.turn?width:.22,height,y);
 if(!b.edited)return [wall(0,4,3,b.y)];
 return [wall(-1.4,1.2,3,b.y),wall(1.4,1.2,3,b.y),wall(0,1.6,.6,b.y+2.4)];
}
export function roomLayout(r){const layout=[...maps[r.map].blocks,...(r.builds||[]).flatMap(buildBoxes)];layout.mapIndex=r.map;return layout;}
export function buildCommand(r,p,m){
 if(p.hp<=0||p.protected||!['fight','break'].includes(r.phase))return 'Enter the arena to build.';
 r.builds??=[];
 if(Date.now()-(p.lastBuild||0)<180)return 'Build cooldown';
 if(m.action==='edit'||m.action==='remove'){
 const b=r.builds.find(b=>b.id===m.id&&b.owner===p.id);
 if(!b||Math.hypot(b.x-p.x,b.z-p.z)>9)return 'Aim at your own nearby structure.';
 if(m.action==='remove')r.builds=r.builds.filter(q=>q!==b);
 else {if(b.kind!=='wall')return 'Only walls have door edits.';b.edited=!b.edited;}
 p.lastBuild=Date.now();return 'Structure updated';
 }
 if(!['wall','floor','ramp'].includes(m.kind)||r.builds.length>=200)return 'Build limit reached';
 const x=Math.round((p.x-Math.sin(p.yaw)*5)/4)*4,z=Math.round((p.z-Math.cos(p.yaw)*5)/4)*4;
 const y=Math.max(terrainHeight(x,z,r.map),Math.floor((p.y+.25)/3)*3),turn=Math.abs(Math.sin(p.yaw))>.7;
 if(Math.abs(x)>44||Math.abs(z)>44||y>24)return 'Outside build area';
 if(r.builds.some(b=>b.x===x&&b.z===z&&Math.abs(b.y-y)<.3&&b.kind===m.kind))return 'Already built here';
 if([...r.players.values(),...r.enemies].some(q=>q.hp>0&&Math.abs(q.x-x)<2.5&&Math.abs(q.z-z)<2.5&&Math.abs(q.y-y)<3))return 'Space occupied';
 r.builds.push({id:++r.adminSerial,owner:p.id,kind:m.kind,x,z,y,turn,edited:false});p.lastBuild=Date.now();return 'Built '+m.kind;
}
