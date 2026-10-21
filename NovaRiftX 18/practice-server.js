import {trainingDrills,movementCheckpoints,trainingEnemies} from './public/training-config.js';
import {terrainHeight,rayBox,coverDistance,blocked,move} from './public/shared.js';
import {roomLayout} from './public/building.js';
import {saveTrainingResult} from './progression.js';
export function ensurePractice(p){return p.practice??={drill:'free',elapsed:0,duration:0,shots:0,hits:0,pellets:0,pelletHits:0,damage:0,kills:0,distance:0,movingTime:0,maxSpeed:0,jumps:0,slides:0,dodges:0,hitsTaken:0,attacks:0,trackingTime:0,reactionTotal:0,reactions:0,builds:0,edits:0,pieces:[],checkpoint:0,stage:0,stageKills:0,stageEdits:0,finished:false,assisted:false,weapons:{},enemies:{},threats:[],previous:null};}
function target(r,p,x,z,type=3){return {id:++r.adminSerial,ownerId:p.id,target:true,type,x,z,originX:x,originZ:z,y:terrainHeight(x,z,r.map)+(type===2?3:0),hp:trainingEnemies[type].practiceHP,maxHp:trainingEnemies[type].practiceHP,appearedAt:ensurePractice(p).elapsed};}
function targetsFor(r,p){const s=ensurePractice(p);r.enemies=r.enemies.filter(e=>e.ownerId&&e.ownerId!==p.id);
 if(['movement','dodge'].includes(s.drill)){if(s.drill==='dodge')r.enemies.push(target(r,p,0,-12,3));return;}
 const count=s.drill==='course'?(s.stage===0?3:1):s.drill==='free'?6:s.drill==='tracking'?2:1;
 for(let i=0;i<count;i++)r.enemies.push(target(r,p,count===1?0:(i-(count-1)/2)*5,s.drill==='free'?-10-i*4:-12-i*3,s.enemyType>=0?s.enemyType:i%4));
 if(s.drill==='course'&&s.stage===1){r.adminSerial++;s.courseWallId=r.adminSerial;s.windowEdited=false;r.builds.push({id:r.adminSerial,owner:p.id,kind:'wall',x:0,z:-6,y:terrainHeight(0,-6,r.map),turn:0,edit:0});}
}
export function startDrill(r,p,choice={}){
 if(r.mode!=='practice'||r.phase!=='fight')return false;
 if(!Object.hasOwn(trainingDrills,choice.drill))return false;
 delete p.practice;const s=ensurePractice(p);s.drill=choice.drill;s.duration=choice.drill==='free'?0:choice.drill==='course'?180:[30,60,120].includes(choice.duration)?choice.duration:60;s.enemyType=Number.isInteger(choice.enemyType)&&choice.enemyType>=0&&choice.enemyType<4?choice.enemyType:-1;
 Object.assign(p,{x:0,z:0,y:terrainHeight(0,0,r.map),vy:0,yaw:0,pitch:0,input:{},slide:0,climbing:false,cooldown:0,lastBuild:0});
 r.builds=(r.builds||[]).filter(b=>b.owner!==p.id);r.bolts=r.bolts.filter(b=>b.practiceOwner!==p.id);
 if(s.drill==='movement')p.yaw=Math.PI;
 s.previous={x:p.x,y:p.y,z:p.z,grounded:true,slide:false,jump:false,vy:0};targetsFor(r,p);return true;
}
function bucket(dict,key){return dict[key]??={shots:0,hits:0,damage:0,kills:0,seconds:0};}
export function practiceHit(r,p,e,before){
 if(r.mode!=='practice'||e.ownerId&&e.ownerId!==p.id)return;
 const s=ensurePractice(p);if(s.finished)return;const dealt=Math.max(0,before-e.hp),w=bucket(s.weapons,p.weapon),enemy=bucket(s.enemies,e.type);
 s.damage+=dealt;w.damage+=dealt;enemy.damage+=dealt;enemy.hits++;
 if(!e.reactionRecorded&&s.drill!=='free'){e.reactionRecorded=true;s.reactions++;s.reactionTotal+=Math.max(0,s.elapsed-(e.appearedAt||0));}
 if(before>0&&e.hp<=0){s.kills++;w.kills++;enemy.kills++;
  let valid=true;
  if(s.drill==='course'&&s.stage===1){const wall=r.builds.find(b=>b.id===s.courseWallId),dz=-Math.cos(p.yaw)*Math.cos(p.pitch),t=wall&&Math.abs(dz)>.00001?(wall.z-p.z)/dz:-1,x=p.x-Math.sin(p.yaw)*Math.cos(p.pitch)*t,y=p.y+(p.slide>0?.95:1.55)+Math.sin(p.pitch)*t;
   valid=!!(wall&&s.windowEdited&&t>0&&t<Math.hypot(e.x-p.x,e.z-p.z)+1&&Math.abs(x-wall.x)<2/3&&y>wall.y+1&&y<wall.y+2);}
  if(valid)s.stageKills++;
 }
}
export function practiceShot(r,p,pellets,hits){if(r.mode!=='practice')return;const s=ensurePractice(p);if(s.finished)return;const w=bucket(s.weapons,p.weapon);s.shots++;w.shots++;s.pellets+=pellets;s.pelletHits+=hits;if(hits){s.hits++;w.hits++;}}
export function practiceBuild(r,p,m,result){if(r.mode!=='practice')return;const s=ensurePractice(p);if(s.finished)return;
 if(result.startsWith('Built ')){s.builds++;if(!s.pieces.includes(m.kind))s.pieces.push(m.kind);}
 if(result==='Structure updated'&&m.action==='edit'){const b=r.builds.find(b=>b.id===m.id&&b.owner===p.id);if(b?.edit){s.edits++;s.stageEdits++;}if(b?.id===s.courseWallId)s.windowEdited=!!(b.edit&16);}
}
function finish(p){const s=p.practice;if(s.finished)return;s.finished=true;s.threats=[];if(p.account&&!s.assisted)saveTrainingResult(p.account,s);}
function resolveAttack(s,hit){if(hit)s.hitsTaken++;else s.dodges++;}
export function tickPractice(r,dt){
 r.practiceTime=(r.practiceTime||0)+dt;r.enemies=r.enemies.filter(e=>!e.ownerId||r.players.has(e.ownerId));
 for(const p of r.players.values()){
  const s=ensurePractice(p);if(s.drill==='free'&&!r.enemies.some(e=>!e.ownerId||e.ownerId===p.id))targetsFor(r,p);if(p.protected||s.finished){s.previous={x:p.x,y:p.y,z:p.z,slide:!!p.slide,jump:!!p.input?.jump,vy:p.vy};continue;}
  s.elapsed+=dt;s.assisted ||= Object.values(p.modifiers||{}).some(Boolean)||Object.values(r.modifiers||{}).some(Boolean);
  const before=s.previous||p,d=Math.hypot(p.x-before.x,p.z-before.z);if(d<=50*dt+1){s.distance+=d;if(d>.01)s.movingTime+=dt;s.maxSpeed=Math.max(s.maxSpeed,d/dt);}else if(d>0)s.assisted=true;
  if(p.vy>0&&(before.vy||0)<=0)s.jumps++;if(p.slide&&!before.slide)s.slides++;
  s.previous={x:p.x,y:p.y,z:p.z,slide:!!p.slide,jump:!!p.input?.jump,vy:p.vy};bucket(s.weapons,p.weapon).seconds+=dt;
  const own=r.enemies.filter(e=>(!e.ownerId||e.ownerId===p.id)&&e.hp>0),o=[p.x,p.y+1.55,p.z],dir=[-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)],cover=coverDistance(o,dir,roomLayout(r));
  if(own.some(e=>{const w=e.type===1?.8:.5,h=e.type===1?2.5:1.8;return rayBox(o,dir,[e.x-w,e.y||0,e.z-w],[e.x+w,(e.y||0)+h,e.z+w])<cover;}))s.trackingTime+=dt;
  if(s.drill==='movement'){
   const point=movementCheckpoints[s.checkpoint];if(point&&Math.hypot(p.x-point[0],p.z-point[1])<1.6)s.checkpoint++;
   if(s.checkpoint===movementCheckpoints.length)finish(p);
  }
  if(s.drill==='course'){
   const cleared=s.stage===0?s.stageKills>=3:s.stage===1?s.stageKills>=1&&s.stageEdits>=1:s.stageKills>=1&&s.pieces.length===4;
   if(cleared){s.stage++;s.stageKills=0;s.stageEdits=0;s.pieces=[];if(s.stage===3)finish(p);else{r.builds=r.builds.filter(b=>b.owner!==p.id);targetsFor(r,p);}}
  }
  if(s.drill==='dodge'){
   s.attackClock=(s.attackClock||0)-dt;if(s.attackClock<=0){s.attackClock=2;s.attacks++;const melee=s.attacks%2===0;const source=own[0];if(source){source.attackTimer=.55;source.attackSequence=(source.attackSequence||0)+1;}
    s.threats.push({id:++r.adminSerial,type:melee?'melee':'bullet',x:p.x,z:p.z,y:p.y+1,remaining:melee?.85:1,targetX:p.x,targetZ:p.z});}
   s.threats=s.threats.filter(t=>{t.remaining-=dt;if(t.remaining>0)return true;
    if(t.type==='melee'){resolveAttack(s,Math.hypot(p.x-t.x,p.z-t.z)<1.8&&p.y+1<t.y+1.8);return false;}
    const from={x:t.targetX,z:t.targetZ-16,y:t.y},dx=t.targetX-from.x,dz=t.targetZ-from.z,len=Math.hypot(dx,dz);
    r.bolts.push({id:++r.adminSerial,practiceOwner:p.id,x:from.x,y:from.y,z:from.z,dx:dx/len*13,dy:0,dz:dz/len*13,life:2});return false;
   });
  }
  if(s.duration&&s.elapsed>=s.duration)finish(p);
 }
 const layout=roomLayout(r),active=[...r.players.values()].some(p=>!p.protected&&!p.practice?.finished);
 for(const e of r.enemies){e.walking=false;e.attackTimer=Math.max(0,(e.attackTimer||0)-dt);const p=r.players.get(e.ownerId),s=p?.practice;
  if(!active||p?.protected||r.modifiers.freezeEnemies||e.ownerId&&(!p||s?.finished))continue;
  if(e.hp<=0){e.respawn=(e.respawn||0)+dt;if(e.respawn>=2){e.hp=e.maxHp;e.respawn=0;e.reactionRecorded=false;e.appearedAt=s?.elapsed||0;if(s?.drill==='flick'){const x=Math.sin(e.id+(s.kills||0)*2.4)*9,z=-10-(s.kills%4)*3;if(!blocked(x,z,.6,roomLayout(r))){e.x=e.originX=x;e.z=e.originZ=z;e.y=terrainHeight(x,z,r.map)+(e.type===2?3:0);}}}}
  // Keep flick targets and the window-edit target steady; other targets patrol on solid ground.
  if(e.hp<=0||s?.drill==='flick'||s?.drill==='course'&&s.stage===1)continue;
  e.originX??=e.x;e.originZ??=e.z;e.patrolDirection??=e.id%2?1:-1;
  const speed=trainingEnemies[e.type].speed*(s?.drill==='tracking'?.65:.4)*(r.modifiers.slowEnemies?.25:1),beforeX=e.x,beforeZ=e.z;
  let remaining=speed*dt;
  // Small movement steps avoid tunnelling through walls, including at 4× match speed.
  while(remaining>.000001){
   const step=Math.min(.15,remaining),edge=e.originX+e.patrolDirection*3.5;
   if(Math.abs(edge-e.x)<step)e.patrolDirection*=-1;
   const x=e.x;move(e,e.patrolDirection*step,0,.55,layout);
   if(e.x===x)e.patrolDirection*=-1;
   remaining-=step;
  }
  e.walking=Math.hypot(e.x-beforeX,e.z-beforeZ)>.0001;
  if(e.walking)e.yaw=Math.atan2(-(e.x-beforeX),-(e.z-beforeZ));
  e.y=terrainHeight(e.x,e.z,r.map)+(e.type===2?3:0);
 }
 r.bolts=r.bolts.filter(b=>{if(!b.practiceOwner)return true;const p=r.players.get(b.practiceOwner),s=p?.practice;if(!p||s.finished)return false;if(p.protected)return true;
  const steps=Math.max(1,Math.ceil(Math.hypot(b.dx,b.dz)*dt/.25));for(let i=0;i<steps;i++){b.x+=b.dx*dt/steps;b.z+=b.dz*dt/steps;
   if(blocked(b.x,b.z,.1,roomLayout(r),b.y)){resolveAttack(s,false);return false;}
   if(Math.hypot(p.x-b.x,p.z-b.z)<.65&&b.y>p.y&&b.y<p.y+1.8){resolveAttack(s,true);return false;}}
  b.life-=dt;if(b.life<=0){resolveAttack(s,false);return false;}return true;
 });
}
