import {maps,terrainHeight,ARENA_HALF} from './shared.js';

export const BUILD_SIZE=4,BUILD_HEIGHT=3;
export const BUILD_KINDS=['wall','floor','ramp','cone'];
const quarter=n=>((Math.round(n)||0)%4+4)%4;
export const buildTurn=b=>Number.isInteger(b.turn)?quarter(b.turn):(b.turn?1:0);
export function buildPoint(b,u,v=0,y=0){
 const a=buildTurn(b)*Math.PI/2,c=Math.round(Math.cos(a)),s=Math.round(Math.sin(a));
 return [b.x+c*u-s*v,b.y+y,b.z-s*u-c*v];
}
export function editMask(b){return Number.isInteger(b.edit)?b.edit:(b.edited&&b.kind==='wall'?(1<<4)|(1<<7):0);}
export function buildPlacement(p,map,kind='wall',rotation=0){
 const turn=quarter(Math.round((p.yaw||0)/(Math.PI/2))+quarter(rotation)),a=turn*Math.PI/2;
 const x=Math.round((p.x-Math.sin(p.yaw||0)*5)/BUILD_SIZE)*BUILD_SIZE;
 const z=Math.round((p.z-Math.cos(p.yaw||0)*5)/BUILD_SIZE)*BUILD_SIZE;
 // Every structure uses the same vertical lattice, including on sloping terrain.
 // Ground can cover the foot of a wall, but adjacent pieces never shift apart.
 let y=Math.max(0,Math.floor(((p.y||0)+.28)/BUILD_HEIGHT)*BUILD_HEIGHT);
 // A floor can bridge above a hillside on the next full level, while its walls
 // remain rooted in the lower level and join its top edge exactly.
 if(kind==='floor')y=Math.max(y,Math.ceil((terrainHeight(x,z,map)-.04)/BUILD_HEIGHT)*BUILD_HEIGHT);
 return {kind,x:kind==='wall'?x+Math.round(Math.sin(a))*2:x,z:kind==='wall'?z+Math.round(Math.cos(a))*2:z,y,turn,edit:0};
}
export function buildKey(b){return `${b.kind}:${b.x}:${b.z}:${b.y}:${b.kind==='wall'?buildTurn(b)%2:0}`;}
function localBox(b,u,v,w,d,h,base=0,step=false){
 const [x,,z]=buildPoint(b,u,v),turned=buildTurn(b)%2;
 return [x,z,(turned?d:w)+(step?.002:0),(turned?w:d)+(step?.002:0),h,b.y+base,step];
}
function keptQuadrants(b){const mask=editMask(b);return [0,1,2,3].filter(i=>!(mask&(1<<i)));}
function quadrant(i){return {u:i%2?0:-2,v:i<2?0:-2};}
const collisionCache=new WeakMap(),layoutCache=new WeakMap(),noBuilds=[];
export function buildBoxes(b){
 const mask=editMask(b),turn=buildTurn(b),cached=collisionCache.get(b);
 if(cached&&cached.kind===b.kind&&cached.x===b.x&&cached.z===b.z&&cached.y===b.y&&cached.turn===turn&&cached.mask===mask)return cached.boxes;
 const result=[];
 if(b.kind==='wall'){
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(!(mask&(1<<(row*3+col))))result.push(localBox(b,(col-1)*4/3,0,4/3,.22,1,2-row));
 }else if(b.kind==='floor'){
  for(const i of keptQuadrants(b)){const {u,v}=quadrant(i);result.push(localBox(b,u+1,v+1,2,2,.16,-.16));}
 }else if(b.kind==='ramp'){
  // Fine collision slices support a smooth rendered ramp without big stair jumps.
  for(const i of keptQuadrants(b)){
   const {u,v}=quadrant(i);
   for(let j=0;j<10;j++){const front=v+(j+1)*.2,height=(front+2)*.75;result.push(localBox(b,u+1,front-.1,2,.2,Math.max(.02,height),0,true));}
  }
 }else if(b.kind==='cone'){
  // Nested pyramid steps keep the top walkable on every face, even after edits.
  for(const i of keptQuadrants(b)){
   const {u,v}=quadrant(i);
   for(let level=1;level<=20;level++){
    const radius=2-(level-1)*.1,left=Math.max(u,-radius),right=Math.min(u+2,radius),back=Math.max(v,-radius),front=Math.min(v+2,radius);
    if(right>left&&front>back)result.push(localBox(b,(left+right)/2,(back+front)/2,right-left,front-back,level*.15,0,true));
   }
  }
 }
 collisionCache.set(b,{kind:b.kind,x:b.x,z:b.z,y:b.y,turn,mask,boxes:result});
 return result;
}

// Smooth outer faces for ramps and cones. Collision uses the same height profile.
export function buildTriangles(b){
 const vertices=[],tri=(a,c,d)=>vertices.push(...buildPoint(b,...a),...buildPoint(b,...c),...buildPoint(b,...d));
 const quad=(a,c,d,e)=>{tri(a,c,d);tri(a,d,e);};
 const top=(u,v)=>b.kind==='ramp'?(v+2)*.75:3*(1-Math.max(Math.abs(u),Math.abs(v))/2);
 for(const i of keptQuadrants(b)){
  const {u,v}=quadrant(i),a=[u,v,top(u,v)],c=[u+2,v,top(u+2,v)],d=[u+2,v+2,top(u+2,v+2)],e=[u,v+2,top(u,v+2)];
  // The diagonal joins the cone apex in each quarter.
  if(b.kind==='cone'&&(i===0||i===3)){tri(a,c,e);tri(c,d,e);}else quad(a,c,d,e);
  quad([u,v,0],[u+2,v,0],c,a);quad([u+2,v,0],[u+2,v+2,0],d,c);
  quad([u+2,v+2,0],[u,v+2,0],e,d);quad([u,v+2,0],[u,v,0],a,e);
 }
 return vertices;
}
export function validEdit(kind,mask){
 if(!Number.isInteger(mask)||mask<0)return false;
 const all=kind==='wall'?511:15;
 return BUILD_KINDS.includes(kind)&&mask<all;
}
export function roomLayout(r){
 const builds=r.builds||noBuilds,blocks=maps[r.map].blocks;
 if(!builds.length)return blocks;
 const cached=layoutCache.get(builds),parts=new Array(builds.length);
 let changed=!cached||cached.map!==r.map||cached.blocks!==blocks||cached.parts.length!==builds.length;
 // Build edits mutate records in place. Checking their cached slice identities
 // catches edits, moves, rotations and removals without regenerating geometry.
 for(let i=0;i<builds.length;i++){parts[i]=buildBoxes(builds[i]);if(!changed&&parts[i]!==cached.parts[i])changed=true;}
 if(!changed)return cached.layout;
 const layout=blocks.slice();for(const boxes of parts)for(const box of boxes)layout.push(box);
 layout.mapIndex=r.map;layoutCache.set(builds,{map:r.map,blocks,parts,layout});return layout;
}
export function buildCommand(r,p,m){
 if(p.hp<=0||p.protected||!['fight','break'].includes(r.phase))return 'Enter the arena to build.';
 r.builds??=[];
 if(Date.now()-(p.lastBuild||0)<180)return 'Build cooldown';
 if(m.action==='edit'||m.action==='remove'){
  const b=r.builds.find(b=>b.id===m.id&&b.owner===p.id);
  if(!b||Math.hypot(b.x-p.x,b.z-p.z)>12)return 'Aim at your own nearby structure.';
  if(m.action==='remove')r.builds=r.builds.filter(q=>q!==b);
  else {
   const mask=m.edit===undefined?(editMask(b)?0:(b.kind==='wall'?144:1)):m.edit;
   if(!validEdit(b.kind,mask))return 'Keep at least one build tile.';
   const candidate={...b,edit:mask,turn:m.turn===undefined?buildTurn(b):quarter(m.turn),edited:mask!==0};
   // Rotating walls changes edges, so only ramps/cones/floors rotate during an edit.
   if(b.kind==='wall')candidate.turn=buildTurn(b);
   Object.assign(b,candidate);
  }
  p.lastBuild=Date.now();return 'Structure updated';
 }
 if(!BUILD_KINDS.includes(m.kind))return 'Choose wall, floor, ramp or cone.';
 if(r.builds.length>=200)return 'Build limit reached';
 const b=buildPlacement(p,r.map,m.kind,m.rotation);
 if(Math.abs(b.x)>ARENA_HALF-2||Math.abs(b.z)>ARENA_HALF-2||b.y>24||Math.hypot(b.x-p.x,b.z-p.z)>10)return 'Outside build area';
 if(r.builds.some(q=>buildKey(q)===buildKey(b)||(q.x===b.x&&q.z===b.z&&q.y===b.y&&['ramp','cone'].includes(q.kind)&&['ramp','cone'].includes(b.kind))))return 'Already built here';
 const boxes=buildBoxes(b);
 if([...r.players.values(),...(r.enemies||[])].some(q=>q.hp>0&&boxes.some(([x,z,w,d,h,y])=>Math.abs(q.x-x)<w/2+.35&&Math.abs(q.z-z)<d/2+.35&&q.y<y+h-.3&&q.y+1.8>y+.05)))return 'Space occupied';
 // Do not create a fully buried structure when aiming into a higher hillside.
 if(terrainHeight(b.x,b.z,r.map)>b.y+(b.kind==='floor'?.35:2.8))return 'Aim at a clear building surface.';
 r.adminSerial=(r.adminSerial||0)+1;
 r.builds.push({...b,id:r.adminSerial,owner:p.id,edited:false});p.lastBuild=Date.now();return 'Built '+m.kind;
}
