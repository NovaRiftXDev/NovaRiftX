import {createBuildStream} from './public/build-stream.js';
import {roomLayout,buildCommand} from './public/building.js';
import {tickDragons} from './dragon-server.js';
import {fillBots,tickBots,startPractice,markAttack} from './game-modes.js';
import {authenticate,flushAccounts,closeAccounts,shopAdmin,customizePet,saveSettings,profile,publicProfile,reward,rename,shop,unequip,leaderboard} from './progression.js';
import {difficulties} from './public/catalog.js';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {weapons,maps,skins,ROYALE_MAP,PRACTICE_MAP,terrainHeight,supportHeight,ladderAt,move,blocked,rayBox,coverDistance} from './public/shared.js';
import {defaultModifiers} from './public/admin-config.js';
import {modsFor,damage,adminCommand} from './admin-server.js';
const root=path.resolve(fileURLToPath(new URL('./public/',import.meta.url)));
export const rooms=new Map();
let serial=0;
const send=(ws,data)=>{if(ws.readyState===1&&ws.bufferedAmount<100000)ws.send(JSON.stringify(data));};
export function makeRoom(code,map=0,mode='coop',difficulty='medium'){return {botFill:mode==='botroyale',bosses:true,memes:{},nuke:0,difficulty:Object.hasOwn(difficulties,difficulty)?difficulty:'medium',code,modifiers:defaultModifiers(),adminSerial:1000000,mode:['royale','botroyale'].includes(mode)?'royale':mode==='practice'?'practice':'coop',radius:65,elapsed:0,winner:null,winnerId:null,map:['royale','botroyale'].includes(mode)?ROYALE_MAP:mode==='practice'?PRACTICE_MAP:Number.isInteger(map)&&maps[map]&&map<24?map:0,players:new Map(),enemies:[],bolts:[],pickups:[],wave:0,phase:'lobby',timer:0,score:0,events:[]};}
function resetPlayer(p){const protection=p.protected??true;Object.assign(p,{x:Math.random()*4-2,z:Math.random()*4-2,y:0,vy:0,hp:100,energy:100,sprinting:false,climbing:false,slide:0,slideCooldown:0,slideHeld:false,lastDamage:0,poison:0,poisonTimer:0,blind:0,weapon:0,ammo:weapons.map(w=>w.mag),reserve:weapons.map(w=>w.reserve),reload:0,cooldown:0,input:{},protected:protection,yaw:0,pitch:0});}
export function newWave(r){const layout=roomLayout(r);r.wave++;r.phase='fight';r.enemies=[];for(let i=0;i<Math.min(24,2+r.wave+r.players.size*2);i++){let type=i%4;let a=i*2.399;let x=Math.cos(a)*39,z=Math.sin(a)*39;if(blocked(x,z,.8,layout)){x=40;z=35-i*.4;}const hp=([32,42,30,38][type]+Math.min(r.wave*2,30))*difficulties[r.difficulty].health;r.enemies.push({id:++serial,type,x,z,y:terrainHeight(x,z,r.map)+(type===2?3:0),hp,maxHp:hp,cd:1,attackTimer:0,attackSequence:0});}if(r.bosses&&r.wave%10===0){const hp=1200*(1+r.wave/20)*difficulties[r.difficulty].health;r.enemies.push({id:++serial,type:1,boss:true,x:0,z:39,y:terrainHeight(0,39,r.map),hp,maxHp:hp,cd:1,attackTimer:0,attackSequence:0});}for(const p of r.players.values())if(p.hp<=0)resetPlayer(p);r.pickups=[{id:++serial,type:'health',x:-4,z:0},{id:++serial,type:'ammo',x:4,z:0}];}
export function startRoyale(r){r.phase='fight';r.radius=65;r.elapsed=0;r.enemies=[];r.pickups=[];let used=[];for(const p of r.players.values()){let best=null,score=-1;for(let x=-39;x<=39;x+=6)for(let z=-39;z<=39;z+=6){if(blocked(x,z,.7,roomLayout(r)))continue;let d=used.length?Math.min(...used.map(q=>Math.hypot(q.x-x,q.z-z))):Math.hypot(x,z);if(d>score){score=d;best={x,z};}}Object.assign(p,best);p.y=terrainHeight(p.x,p.z,r.map);used.push(best);}for(let x=-32;x<=32;x+=16)for(let z=-32;z<=32;z+=16)if(!blocked(x,z,1,roomLayout(r)))r.pickups.push({id:++serial,type:(x+z)%32===0?'ammo':'health',x,z});}
function fire(r,p){const mods=modsFor(r,p),w=weapons[p.weapon],layout=roomLayout(r);if(p.cooldown>0||p.reload>0||(r.mode!=='practice'&&!p.ammo[p.weapon]))return;if(!mods.infiniteAmmo&&r.mode!=='practice')p.ammo[p.weapon]--;p.cooldown=w.delay*(mods.rapidFire?.2:1);const o=[p.x,p.y+(p.slide>0?.95:1.55),p.z];let hit=false;for(let i=0;i<(mods.shotgunStorm?12:w.pellets);i++){const yaw=p.yaw+(Math.random()-.5)*(mods.perfectAccuracy?0:w.spread)*2,pitch=p.pitch+(Math.random()-.5)*(mods.perfectAccuracy?0:w.spread)*2;const d=[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];let dist=Math.min(mods.longRange?150:w.range,mods.wallShots?Infinity:coverDistance(o,d,layout)),target=null;for(const e of (r.mode==='royale'?[...r.players.values(),...r.enemies].filter(q=>q.id!==p.id):r.enemies)){if(e.hp<=0||e.protected)continue;const s=e.boss?1.7:e.type===1?.8:.5;let t=rayBox(o,d,[e.x-s,e.y||0,e.z-s],[e.x+s,(e.y||0)+(e.boss?5.5:e.type===1?2.5:1.8),e.z+s]);if(t<dist){dist=t;target=e;}}if(target){damage(r,target,mods.oneShot?10000:w.damage*(r.mode==='coop'?1.4:1)*(r.players.get(target.id)===target?.5:1));if(mods.vampire)p.hp=Math.min(200,p.hp+10);hit=true;if(target.hp<=0){if(r.mode!=='practice')reward(p);r.score+=mods.doubleScore?200:100;if(r.mode!=='practice')r.pickups.push({id:++serial,type:Math.random()<.2?'health':'ammo',x:target.x,z:target.z});}}if(i===0)r.events.push({type:'shot',id:p.id,weapon:p.weapon,from:o,to:o.map((v,j)=>v+d[j]*dist)});}if(hit)send(p.ws,{type:'hit'});}

// Sample the path rather than the camera/input direction: a slide retains its
// original momentum even if the player turns or releases the movement keys.
export function risesAlong(p,dx,dz,layout){
 const length=Math.hypot(dx,dz);if(length<.000001)return false;
 let previous=supportHeight(p.x,p.z,p.y,layout);
 const steps=Math.max(1,Math.ceil(length/.08));
 for(let i=1;i<=steps;i++){
  const ground=supportHeight(p.x+dx*i/steps,p.z+dz*i/steps,previous+.65,layout);
  if(ground>previous+.0005)return true;
  previous=ground;
 }
 return false;
}
export function tick(r,dt){if(r.phase==='lobby'||r.phase==='over')return;
const layout=roomLayout(r);
r.supplyTimer=(r.supplyTimer||0)-dt;if(r.supplyTimer<=0&&r.mode!=='practice'){r.supplyTimer=4;for(const [x,z]of [[4,0],[-4,0],[0,8],[0,-8],[28,0],[-28,0],[0,38],[0,-38],[35,30],[-35,-30],...maps[r.map].outposts.map(([x,z])=>[x,z+5])])if(!blocked(x,z,1,layout)&&!r.pickups.some(k=>k.type==='ammo'&&Math.hypot(k.x-x,k.z-z)<2))r.pickups.push({id:++serial,type:'ammo',x,z});}

 for(const p of r.players.values()){
 if(r.mode==='practice'){p.hp=100;p.ammo=weapons.map(w=>w.mag);p.reload=0;p.reserve=weapons.map(w=>w.reserve);}if(p.hp<=0||p.protected)continue;const q=p.input,mods=modsFor(r,p);p.reserve=p.reserve.map((n,i)=>Math.max(n,weapons[i].reserve));p.yaw=q.yaw||0;p.pitch=q.pitch||0;
 if(mods.autoHeal)p.hp=Math.min(Math.max(100,p.hp),p.hp+15*dt);if(mods.infiniteReserve)p.reserve=weapons.map(w=>w.reserve);if(mods.infiniteAmmo)p.ammo=weapons.map(w=>w.mag);
 p.lastDamage=Math.max(0,(p.lastDamage||0)-dt);p.poisonTimer=Math.max(0,(p.poisonTimer||0)-dt);p.blind=Math.max(0,(p.blind||0)-dt);if(p.poison>0&&p.poisonTimer<=0){damage(r,p,2);p.poison--;p.poisonTimer=.8;}p.cooldown=Math.max(0,p.cooldown-dt);if(p.reload>0){p.reload-=mods.noReload?100:dt;if(p.reload<=0){let n=Math.min(weapons[p.weapon].mag-p.ammo[p.weapon],p.reserve[p.weapon]);p.ammo[p.weapon]+=n;p.reserve[p.weapon]-=n;}}
 if(Number.isInteger(q.weapon)&&q.weapon>=0&&q.weapon<weapons.length&&q.weapon!==p.weapon){p.weapon=q.weapon;p.reload=0;}
 const oldGround=supportHeight(p.x,p.z,p.y,layout),wasGrounded=p.y<=oldGround+.08;let f=(q.w?1:0)-(q.s?1:0),s=(q.d?1:0)-(q.a?1:0),norm=Math.hypot(f,s)||1,speed=6*(mods.superSpeed?4:1);
 p.energy??=100;if(!q.sprint)p.exhausted=false;if(p.energy<=0)p.exhausted=true;p.sprinting=!p.exhausted&&!!q.sprint&&!!q.w&&!q.s&&p.energy>0;
 if(p.sprinting){speed*=1.5;p.energy=Math.max(0,p.energy-18*dt);}else p.energy=Math.min(100,p.energy+24*dt);
 const directionX=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*s)/norm,directionZ=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*s)/norm;
 const uphill=risesAlong(p,directionX*.6,directionZ*.6,layout);
 p.slideCooldown=Math.max(0,(p.slideCooldown||0)-dt);p.slide=Math.max(0,(p.slide||0)-dt);
 if(q.slide&&!p.slideHeld&&wasGrounded&&p.sprinting&&!uphill&&!p.slideCooldown){p.slide=.7;p.slideCooldown=1.4;p.slideX=directionX;p.slideZ=directionZ;}
 const slideSpeed=12*(mods.superSpeed?4:1);
 p.slideHeld=!!q.slide;if(q.jump||(p.slide&&risesAlong(p,p.slideX*slideSpeed*dt,p.slideZ*slideSpeed*dt,layout)))p.slide=0;
 const dx=p.slide?p.slideX*slideSpeed*dt:directionX*speed*dt,dz=p.slide?p.slideZ*slideSpeed*dt:directionZ*speed*dt;
 const ladder=ladderAt(p.x,p.z,r.map);
 const leaveLadder=q.jump||q.a||q.d||mods.flight||mods.noclip;
 if(p.climbing&&q.jump)p.vy=5;
 const onLadder=ladder&&!leaveLadder&&p.y>=ladder.bottom-.3&&p.y<ladder.top+.15&&(p.climbing||q.w||(q.s&&p.y>ladder.bottom+.1));
 p.climbing=!!onLadder;
 if(onLadder){
  p.slide=0;p.sprinting=false;p.vy=0;p.x=ladder.x;p.z=ladder.z;
  p.y=Math.max(ladder.bottom,Math.min(ladder.top,p.y+((q.w?1:0)-(q.s?1:0))*2.8*dt));
  if(p.y>=ladder.top&&q.w){p.x=ladder.landingX;p.z=ladder.landingZ;p.climbing=false;}
  else if(p.y<=ladder.bottom&&q.s){p.z=ladder.z+.9;p.climbing=false;}
 }else{
  if(mods.noclip){p.x=Math.max(-46.5,Math.min(46.5,p.x+dx));p.z=Math.max(-46.5,Math.min(46.5,p.z+dz));}else move(p,dx,dz,.45,layout);
  const ground=supportHeight(p.x,p.z,p.y,layout);if(mods.flight){p.vy=0;p.y=Math.max(ground,Math.min(35,p.y+((q.jump?1:0)-(q.descend?1:0))*10*dt));}else if(mods.hover){p.vy=0;p.y=Math.max(ground,p.y);}else{if(wasGrounded&&p.vy<=0)p.y=ground;if(q.jump&&wasGrounded)p.vy=6*(mods.superJump?2.5:1);p.vy-=(mods.lowGravity?4:18)*dt;p.y=Math.max(ground,p.y+p.vy*dt);if(p.y<=ground)p.vy=0;}
 }
 const trigger=q.fire||mods.autoFire;
 if(mods.aimbot&&trigger){let targets=(r.mode==='royale'?[...r.players.values(),...r.enemies].filter(e=>e.id!==p.id):r.enemies).filter(e=>e.hp>0&&!e.protected),best=null,bestDist=Infinity;for(const e of targets){let delta=[e.x-p.x,(e.y||0)+1-(p.y+(p.slide>0?.95:1.55)),e.z-p.z],dist=Math.hypot(...delta),direction=delta.map(v=>v/dist);if(dist<bestDist&&(mods.wallShots||coverDistance([p.x,p.y+(p.slide>0?.95:1.55),p.z],direction,layout)>=dist-.5)){best=e;bestDist=dist;}}if(best){p.yaw=Math.atan2(-(best.x-p.x),-(best.z-p.z));p.pitch=Math.atan2((best.y||0)+1-(p.y+(p.slide>0?.95:1.55)),Math.hypot(best.x-p.x,best.z-p.z));}}
 if(r.mode!=='practice'&&(q.reload||(trigger&&p.ammo[p.weapon]===0))&&!p.reload&&p.ammo[p.weapon]<weapons[p.weapon].mag&&p.reserve[p.weapon]>0)p.reload=mods.noReload?.001:weapons[p.weapon].reload;
 if(trigger&&r.phase==='fight')fire(r,p);
 r.pickups=r.pickups.filter(k=>{if(Math.hypot(p.x-k.x,p.z-k.z)> (mods.magnet?16:5)||Math.abs(p.y-terrainHeight(k.x,k.z,r.map))>3)return true;if(k.type==='health'){if(p.hp>=100)return true;p.hp=Math.min(100,p.hp+35);}else p.reserve=p.reserve.map((n,i)=>Math.min(weapons[i].reserve,weapons[i].reserve));return false;});}
 tickDragons(r,dt);
 if(r.mode==='practice'){r.practiceTime=(r.practiceTime||0)+dt;for(const e of r.enemies){if(e.hp<=0){e.respawn=(e.respawn||0)+dt;if(e.respawn>=2){e.hp=e.maxHp;e.respawn=0;}}}return;}
 if(r.mode==='royale'){if(!r.modifiers.freezeStorm)r.elapsed+=dt;r.radius=Math.max(.5,65-Math.max(0,r.elapsed-15)*.26);for(const p of r.players.values())if(p.hp>0&&Math.hypot(p.x,p.z)>r.radius){if(!modsFor(r,p).stormImmunity)damage(r,p,dt*12);};if(r.botFill)tickBots(r,dt);const survivors=[...r.players.values(),...r.enemies].filter(p=>p.hp>0);if(survivors.length<=1){r.phase='over';r.winner=survivors[0]?.name||'No survivor';r.winnerId=survivors[0]?.id??null;}return;}
 const alive=[...r.players.values()].filter(p=>p.hp>0);if(!alive.length){r.phase='over';return;}
 if(r.phase==='break'){r.timer-=dt;if(r.timer<=0)newWave(r);return;}
 for(const e of r.enemies){
  e.attackTimer=Math.max(0,(e.attackTimer||0)-dt);
  if(e.hp<=0)continue;
  if(r.modifiers.weakEnemies)e.hp=Math.min(1,e.hp);
  if(r.modifiers.freezeEnemies)continue;
  const visible=alive.filter(p=>!p.protected&&!modsFor(r,p).invisible);if(!visible.length)continue;
  const p=visible.reduce((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)<Math.hypot(b.x-e.x,b.z-e.z)?a:b);
  let dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz)||1;
  e.cd-=dt;
  const speed=[4.1,5.2,5.8,2.1][e.type]*(r.modifiers.slowEnemies?.25:1)*difficulties[r.difficulty].speed;
  if(dist>(e.boss?2.8:e.type===3?10:1.1)){
   const ox=e.x,oz=e.z;move(e,dx/dist*speed*dt,dz/dist*speed*dt,.6,layout);
   if(Math.hypot(e.x-ox,e.z-oz)<speed*dt*.2)move(e,-dz/dist*speed*dt,dx/dist*speed*dt,.6,layout);
  }
  dx=p.x-e.x;dz=p.z-e.z;dist=Math.hypot(dx,dz);
  e.y=terrainHeight(e.x,e.z,r.map)+(e.type===2?3:0);e.yaw=Math.atan2(-dx,-dz);
  if(r.modifiers.peacefulEnemies)continue;
  if(e.type===3&&e.cd<=0){
   const o=[e.x,e.y+1.2,e.z],v=[dx,p.y+.9-(e.y+1.2),dz],len=Math.hypot(...v),d=v.map(n=>n/(len||1));
   if(coverDistance(o,d,layout)>=len){
    r.bolts.push({id:++serial,x:e.x,y:e.y+1.2,z:e.z,dx:d[0]*11,dy:d[1]*11,dz:d[2]*11,life:4});e.cd=1.6;markAttack(r,e,.35);
   }
  }else if(e.type!==3&&dist<(e.boss?3.6:1.5)&&e.cd<=0&&Math.abs(p.y-(e.y-(e.type===2?3:0)))<1.8){
   const o=[e.x,e.y-(e.type===2?3:0)+.6,e.z],v=[dx,p.y+.6-o[1],dz],len=Math.hypot(...v),d=v.map(n=>n/(len||1));
   if(coverDistance(o,d,layout)<len-.25)continue;
   damage(r,p,(e.boss?28:[10,15,12,4][e.type])*difficulties[r.difficulty].damage);
   if(e.type===0&&!p.poison){p.poison=3;p.poisonTimer=.8;}
   if(e.type===2)p.blind=4;
   e.cd=e.type===0?1.2:.9;markAttack(r,e,e.type===2?.65:.55);
  }
 }
 r.bolts=r.bolts.filter(b=>{b.x+=b.dx*dt;b.y+=b.dy*dt;b.z+=b.dz*dt;b.life-=dt;if(b.life<=0||blocked(b.x,b.z,.1,layout,b.y)||b.y<terrainHeight(b.x,b.z,r.map))return false;for(const p of alive)if(Math.hypot(p.x-b.x,p.z-b.z)<.65&&b.y>p.y&&b.y<p.y+1.8){damage(r,p,8*difficulties[r.difficulty].damage);return false;}return true;});r.enemies=r.enemies.filter(e=>e.hp>0);if(!r.enemies.length){r.phase='break';r.timer=6;r.bolts=[];for(const p of r.players.values()){if(!p.protected)reward(p,true);if(p.hp<=0)resetPlayer(p);p.hp=Math.min(100,p.hp+20);p.reserve=p.reserve.map((n,i)=>Math.min(weapons[i].reserve,weapons[i].reserve));}}}
export const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');let pathname=decodeURIComponent(url.pathname);let file=pathname==='/vendor/three.module.js'?fileURLToPath(new URL('./node_modules/three/build/three.module.js',import.meta.url)):pathname==='/vendor/three.core.js'?fileURLToPath(new URL('./node_modules/three/build/three.core.js',import.meta.url)):path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)&&!pathname.startsWith('/vendor/')){res.writeHead(403).end();return;}if(pathname.startsWith('/vendor/')&&!['/vendor/three.module.js','/vendor/three.core.js'].includes(pathname)){res.writeHead(404).end();return;}let data=await readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}).end(data);}catch{res.writeHead(404).end('Not found');}});
const authAttempts=new Map();
const wss=new WebSocketServer({server,maxPayload:4096});
wss.on('connection',(ws,req)=>{let authBusy=false;const isHostRoom=()=>room&&player&&player.id===room.players.keys().next().value;let room,player,identity,count=0,windowStart=Date.now();ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);ws.on('message',async raw=>{try{if(Date.now()-windowStart>1000){count=0;windowStart=Date.now();}if(++count>90)return;const m=JSON.parse(raw);
if(m.type==='auth'){if(authBusy)return;const ip=req.socket.remoteAddress,now=Date.now();let limit=authAttempts.get(ip);if(!limit||now-limit.time>60000){limit={time:now,count:0};authAttempts.set(ip,limit);}if(++limit.count>10)return send(ws,{type:'authError',message:'Too many attempts. Wait one minute.'});if(!['register','login'].includes(m.action))return;authBusy=true;try{identity=await authenticate(m.action,m.username,m.password,m.key);await flushAccounts();send(ws,{type:'profile',key:identity.key,profile:publicProfile(identity.account),board:leaderboard(),authenticated:true});}catch(e){send(ws,{type:'authError',message:e.message});}finally{authBusy=false;}return;}
if(m.type==='settings'){if(identity?.account.username){saveSettings(identity.account,m.settings,m.name);if(player)player.name=identity.account.name;await flushAccounts();}return;}
if(m.type==='profile'){identity=profile(m.key);await flushAccounts();send(ws,{type:'profile',key:identity.key,profile:publicProfile(identity.account),board:leaderboard()});return;}
if(['buy','equip','unequip','board','petStyle','shopAdmin'].includes(m.type)){if(!identity)return;try{if(m.type==='shopAdmin')shopAdmin(identity.account,m.action);if(m.type==='petStyle')customizePet(identity.account,m.petStyle);if(m.type==='buy'||m.type==='equip')shop(identity.account,m.id,m.type==='equip');if(m.type==='unequip')unequip(identity.account,m.slot);await flushAccounts();send(ws,{type:'profile',profile:publicProfile(identity.account),board:leaderboard()});}catch(e){send(ws,{type:'shopError',message:e.message});}return;}
if(!player){if(m.type!=='join')return;identity??=profile(m.key);if(!identity.account.username&&process.env.NODE_ENV!=='test')return send(ws,{type:'error',message:'Create an account or log in first.'});const code=String(m.code||'').toUpperCase();if(code){room=rooms.get(code);if(!room)return send(ws,{type:'error',message:'Room not found. Check the code or create a room.'});}else{if(rooms.size>=100)return send(ws,{type:'error',message:'Server full. Try later.'});let c;do{c=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(c));room=makeRoom(c,m.map,m.mode,m.difficulty);room.bosses=m.bosses!==false;rooms.set(c,room);}if(room.mode==='royale'&&room.phase==='fight')return send(ws,{type:'error',message:'Battle royale already started. Join after this round.'});if(room.players.size>=(room.mode==='royale'?8:4))return send(ws,{type:'error',message:'That room is full.'});identity??=profile(m.key);rename(identity.account,m.name);player={account:identity.account,id:randomBytes(6).toString('hex'),name:String(m.name||'Ranger').slice(0,18),modifiers:defaultModifiers(),skin:Number.isInteger(m.skin)&&skins[m.skin]?m.skin:0,ws};resetPlayer(player);room.players.set(player.id,player);await flushAccounts();send(ws,{type:'joined',id:player.id,code:room.code});return;}
 if(m.type==='build'){send(ws,{type:'buildResult',message:buildCommand(room,player,m)});return;}
 if(m.type==='ready'){player.protected=m.ready!==true;player.input={};return;}
 if(m.type==='bosses'&&isHostRoom()){room.bosses=m.value===true;return;}
 if(m.type==='admin'){send(ws,{type:'adminResult',...adminCommand(room,player,m,newWave)});return;}
 if(m.type==='input'){const q=m.input||{};if(!Number.isFinite(q.yaw)||!Number.isFinite(q.pitch))return;player.input={...Object.fromEntries(['w','a','s','d','jump','slide','sprint','descend','fire','reload'].map(k=>[k,q[k]===true])),yaw:q.yaw%(Math.PI*2),pitch:Math.max(-1.45,Math.min(1.45,q.pitch)),weapon:q.weapon};}
 if(m.type==='start'&&player.id===room.players.keys().next().value&&(room.phase==='lobby'||room.phase==='over')){if(room.mode==='royale'&&!room.botFill&&room.players.size<2)return send(ws,{type:'error',message:'Battle royale needs at least 2 real players. Invite a friend first.'});room.builds=[];room.wave=0;room.score=0;room.bolts=[];room.winner=null;room.winnerId=null;for(const p of room.players.values())resetPlayer(p);if(room.mode==='royale'){startRoyale(room);if(room.botFill)fillBots(room);}else if(room.mode==='practice')startPractice(room);else newWave(room);}
 }catch{send(ws,{type:'error',message:'Invalid message.'});}});ws.on('close',()=>{if(room&&player){room.players.delete(player.id);if(!room.players.size)rooms.delete(room.code);}});});
const buildStream=createBuildStream();
const interval=setInterval(()=>{for(const r of rooms.values()){tick(r,1/30);const state={type:'state',builds:r.builds||[],botFill:r.botFill,bosses:r.bosses,memes:r.memes,nuke:r.nuke,modifiers:r.modifiers,adminActive:Object.values(r.modifiers).some(Boolean)||[...r.players.values()].some(p=>Object.values(p.modifiers).some(Boolean)),difficulty:r.difficulty,map:r.map,mode:r.mode,radius:r.radius,elapsed:r.elapsed,winner:r.winner,winnerId:r.winnerId,host:r.players.keys().next().value,phase:r.phase,wave:r.wave,timer:r.timer,score:r.score,enemies:r.enemies,bolts:r.bolts,pickups:r.pickups,events:r.events,players:[...r.players.values()].map(({ws,input,account,...p})=>({...p,cosmetics:account?.equipped||{},petStyle:account?.equipped.pet==='petAdminDragon'?{name:'Inferno',size:1.3,color:'#743dc1',accessory:'crown',...account.petStyle}:account?.petStyle||null,progress:account?{tokens:account.tokens,infiniteTokens:!!account.infiniteTokens,points:account.points}:null}))};const packet=buildStream.packet(r,state);for(const p of r.players.values())packet.send(p.ws);r.events=[];}},1000/30);
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive)ws.terminate();else{ws.isAlive=false;ws.ping();}}},30000);
export function shutdown(){clearInterval(interval);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close();server.close();}
if(process.env.NODE_ENV!=='test'){server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`NovaRiftX: http://localhost:${server.address().port}`));}

if(process.env.NODE_ENV!=='test'){for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{shutdown();closeAccounts().then(()=>process.exit(0),()=>process.exit(1));});}
