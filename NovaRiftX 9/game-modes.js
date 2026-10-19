import {roomLayout} from './public/building.js';
import {maps,blocked,terrainHeight,move,coverDistance} from './public/shared.js';
import {damage} from './admin-server.js';
export function fillBots(r){const positions=[];for(let x=-40;x<=40;x+=5)for(let z=-40;z<=40;z+=5)if(!blocked(x,z,.7,roomLayout(r))&&![...r.players.values()].some(p=>Math.hypot(p.x-x,p.z-z)<3))positions.push({x,z});for(let i=positions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}r.enemies=positions.slice(0,100-r.players.size).map((p,i)=>({...p,y:terrainHeight(p.x,p.z,r.map)+(i%4===2?3:0),id:++r.adminSerial,name:`Bot ${i+1}`,bot:true,type:i%4,hp:[40,65,50,58][i%4],maxHp:[40,65,50,58][i%4],cd:1+Math.random()*2,attackTimer:0,attackSequence:0}));}

// Timers persist in snapshots, so clients can animate attacks even if an event
// arrives between rendered frames. A sequence distinguishes repeated attacks.
export function markAttack(r,enemy,duration=.55){
 enemy.attackTimer=duration;
 enemy.attackSequence=(enemy.attackSequence||0)+1;
 r.events.push({type:'attack',id:enemy.id,enemyType:enemy.type});
}

export function tickBots(r,dt){
 const targets=[...r.players.values(),...r.enemies],layout=roomLayout(r);
 for(const b of r.enemies){
  b.attackTimer=Math.max(0,(b.attackTimer||0)-dt);
  if(b.hp<=0)continue;
  if(Math.hypot(b.x,b.z)>r.radius)damage(r,b,dt*12);
  if(b.hp<=0||r.modifiers.freezeEnemies)continue;
  b.cd-=dt;
  let best=null,distance=Infinity;
  for(const q of targets){if(q===b||q.hp<=0||q.protected||q.modifiers?.invisible)continue;const d=Math.hypot(q.x-b.x,q.z-b.z);if(d<distance){best=q;distance=d;}}
  if(!best)continue;
  const targetX=best.x-b.x,targetZ=best.z-b.z;
  let dx=targetX,dz=targetZ;
  const outside=Math.hypot(b.x,b.z)>r.radius-3;
  if(outside){dx=-b.x;dz=-b.z;}
  const ranged=b.type===3;
  if(ranged&&distance<=10&&!outside){const side=Math.sin(r.elapsed*.6+b.id)>0?1:-1;[dx,dz]=[-dz*side,dx*side];}
  const length=Math.hypot(dx,dz)||1,speed=[3.8,5,4,5][b.type]*(r.modifiers.slowEnemies?.25:1);
  if(distance>(ranged?5:1)||outside){
   const x=b.x,z=b.z;
   move(b,dx/length*speed*dt,dz/length*speed*dt,.55,layout);
   if(x===b.x&&z===b.z)move(b,-dz/length*speed*dt,dx/length*speed*dt,.55,layout);
  }
  b.y=terrainHeight(b.x,b.z,r.map)+(b.type===2?3:0);
  b.yaw=Math.atan2(-targetX,-targetZ);
  if(b.cd>0||r.modifiers.peacefulEnemies)continue;
  if(ranged&&distance<40){
   const origin=[b.x,b.y+1.3,b.z],delta=[best.x-b.x,(best.y||0)+1-b.y-1.3,best.z-b.z],len=Math.hypot(...delta),direction=delta.map(v=>v/len);
   if(coverDistance(origin,direction,layout)<len-.4)continue;
   b.cd=.7+Math.random()*.8;markAttack(r,b,.35);
   if(Math.random()<(best.bot?.55:.2))damage(r,best,best.bot?12:4);
   r.events.push({type:'shot',id:b.id,weapon:2,from:origin,to:[best.x,(best.y||0)+1,best.z]});
  }else if(!ranged&&distance<1.5&&Math.abs((best.y||0)-(b.y-(b.type===2?3:0)))<1.8){
   const origin=[b.x,terrainHeight(b.x,b.z,r.map)+.6,b.z],delta=[best.x-b.x,(best.y||0)+.6-origin[1],best.z-b.z],len=Math.hypot(...delta),direction=delta.map(v=>v/(len||1));
   if(coverDistance(origin,direction,layout)<len-.25)continue;
   markAttack(r,b,b.type===2?.65:.55);b.cd=1.2;
   damage(r,best,b.type===0?6:b.type===1?6:3);
   if(b.type===0&&!best.bot&&!best.poison){best.poison=3;best.poisonTimer=.8;}
   if(b.type===2&&!best.bot)best.blind=1.5;
  }
 }
 r.enemies=r.enemies.filter(b=>b.hp>0);
}
export function startPractice(r){r.phase='fight';r.wave=0;r.enemies=[];for(let i=0;i<6;i++){const x=(i-2.5)*5,z=-10-i*4;r.enemies.push({id:++r.adminSerial,type:i%4,target:true,x,z,y:terrainHeight(x,z,r.map),hp:100,maxHp:100});}}
