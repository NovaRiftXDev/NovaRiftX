import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {WebSocket} from 'ws';
import {weapons,terrainHeight} from '../public/shared.js';
import {defaultModifiers} from '../public/admin-config.js';
import {trainingSummary,movementCheckpoints,trainingEnemies} from '../public/training-config.js';
import {buildCommand} from '../public/building.js';
const data=mkdtempSync(tmpdir()+'/nova-training-');process.env.NOVA_DATA_DIR=data;process.env.NODE_ENV='test';
const {makeRoom,tick,server,rooms,newWave,shutdown}=await import('../server.js');
const {startPractice}=await import('../game-modes.js');
const {startDrill,practiceBuild,tickPractice}=await import('../practice-server.js');
const {profile}=await import('../progression.js');
after(()=>{shutdown();rmSync(data,{recursive:true,force:true});});
function player(id='p'){return {id,name:id,ws:{readyState:0},x:0,y:0,z:0,vy:0,hp:100,energy:100,protected:false,weapon:0,ammo:weapons.map(w=>w.mag),reserve:weapons.map(w=>w.reserve),reload:0,cooldown:0,modifiers:defaultModifiers(),input:{yaw:0,pitch:0}};}
function setup(drill='free'){const r=makeRoom('train',0,'practice'),p=player();r.players.set(p.id,p);startPractice(r);assert.equal(startDrill(r,p,{drill}),true);return {r,p};}
function shoot(r,p,e,weapon=7){const dx=e.x-p.x,dz=e.z-p.z;p.cooldown=0;p.input={yaw:Math.atan2(-dx,-dz),pitch:Math.atan2((e.y||0)+.9-(p.y+1.55),Math.hypot(dx,dz)),weapon,fire:true};tick(r,.01);p.input={yaw:p.yaw,pitch:p.pitch};}
test('actual practice shots count hits, misses, pellets, capped damage and enemy/weapon breakdowns without currency',()=>{
 const {r,p}=setup();p.account=profile().account;r.enemies=[{id:500,ownerId:p.id,type:1,x:0,z:-3,y:0,hp:1000,maxHp:1000}];
 shoot(r,p,r.enemies[0],7);assert.equal(p.practice.shots,1);assert.equal(p.practice.hits,1);assert.equal(p.practice.damage,1000);assert.equal(p.practice.kills,1);assert.equal(p.practice.weapons[7].damage,1000);assert.equal(p.practice.enemies[1].kills,1);
 p.cooldown=0;p.input={yaw:Math.PI,pitch:0,weapon:0,fire:true};tick(r,.01);assert.equal(p.practice.shots,2);assert.equal(p.practice.hits,1);assert.equal(trainingSummary(p.practice).accuracy,50);
 r.enemies=[{id:501,ownerId:p.id,type:1,x:0,z:-3,y:0,hp:1000,maxHp:1000}];p.modifiers.perfectAccuracy=true;shoot(r,p,r.enemies[0],1);
 assert.equal(p.practice.weapons[1].shots,1);assert.equal(p.practice.weapons[1].hits,1);assert.equal(p.practice.pellets,9);assert.equal(p.practice.pelletHits,8);assert.equal(p.practice.weapons[1].damage,42);
 assert.equal(p.account.tokens,0);assert.equal(p.account.points,0);assert.equal(p.ammo[1],weapons[1].mag);assert.equal(p.reload,0);
});
test('tracking and flick drills move targets; protected settings pause time and do not add false movement',()=>{
 const {r,p}=setup('tracking');const before=r.enemies[0].x;tick(r,.2);assert.notEqual(r.enemies[0].x,before);
 const t=p.practice.elapsed,d=p.practice.distance;p.protected=true;p.x=20;tick(r,1);assert.equal(p.practice.elapsed,t);assert.equal(p.practice.distance,d);
 p.protected=false;p.input={yaw:0,pitch:0,w:true};tick(r,.1);assert.ok(p.practice.distance>0&&p.practice.distance<1);
 startDrill(r,p,{drill:'flick'});const e=r.enemies[0],x=e.x;shoot(r,p,e);tickPractice(r,2);assert.equal(e.hp,e.maxHp);assert.notEqual(e.x,x);assert.equal(p.practice.reactions,1);
});
test('aim/edit/piece course enforces each stage and real edits/builds, saves results and awards no tokens',()=>{
 const {r,p}=setup('course');const identity=profile();p.account=identity.account;
 for(const e of [...r.enemies])shoot(r,p,e);assert.equal(p.practice.stage,1);const wall=r.builds.find(b=>b.owner===p.id);assert.ok(wall);
 shoot(r,p,r.enemies[0]);assert.equal(r.enemies[0].hp,r.enemies[0].maxHp,'solid wall blocks the shot');assert.equal(p.practice.stage,1);
 const edit={action:'edit',id:wall.id,edit:16};const edited=buildCommand(r,p,edit);assert.equal(edited,'Structure updated');practiceBuild(r,p,edit,edited);
 shoot(r,p,r.enemies[0]);assert.equal(p.practice.stage,2);
 shoot(r,p,r.enemies[0]);assert.equal(p.practice.stage,2,'a kill alone does not complete the build stage');
 for(const [i,kind]of ['wall','floor','ramp','cone'].entries()){
  Object.assign(p,{x:-12+i*8,z:8,y:0,yaw:0,pitch:0,lastBuild:0});const command={kind},result=buildCommand(r,p,command);assert.equal(result,'Built '+kind);practiceBuild(r,p,command,result);
 }
 // The target may have been eliminated before the four pieces: completion needs both.
 Object.assign(p,{x:0,z:0,y:0});tickPractice(r,.01);assert.equal(p.practice.stage,3);assert.equal(p.practice.finished,true);
 assert.equal(p.account.training.course.last.completed,true);assert.ok(p.account.training.course.best.score>0);assert.equal(p.account.tokens,0);assert.equal(p.account.points,0);
 const saved=JSON.parse(readFileSync(data+'/profiles.json','utf8'));assert.equal(saved[identity.key].training.course.best.completed,true);
});
test('movement rings finish in order, real jumping and sliding are recorded, and assisted runs do not set bests',()=>{
 const {r,p}=setup('movement');p.account=profile().account;p.input={yaw:0,pitch:0,jump:true};tick(r,.1);assert.equal(p.practice.jumps,1);
 p.input={yaw:0,pitch:0,w:true,sprint:true,slide:true};p.y=terrainHeight(p.x,p.z,r.map);p.vy=0;tick(r,.01);assert.equal(p.practice.slides,1);
 for(const [x,z]of movementCheckpoints){p.x=x;p.z=z;tickPractice(r,.01);}assert.equal(p.practice.finished,true);assert.equal(p.practice.checkpoint,8);assert.equal(p.account.training,undefined,'teleported/assisted checkpoints do not save bests');
});
test('dodge drills resolve real projectile hits and misses plus telegraphed melee while keeping health safe',()=>{
 const {r,p}=setup('dodge');tickPractice(r,.01);assert.equal(p.practice.attacks,1);tickPractice(r,1);assert.equal(r.bolts.length,1);
 for(let i=0;i<40;i++)tickPractice(r,.05);assert.ok(p.practice.hitsTaken>=1);assert.equal(p.hp,100);
 p.practice.threats=[{id:999,type:'melee',x:p.x,z:p.z,y:p.y+1,remaining:.1}];p.practice.attackClock=10;p.x+=4;tickPractice(r,.2);assert.ok(p.practice.dodges>=1);
 r.bolts=[{id:998,practiceOwner:p.id,x:p.x+3,y:p.y+1,z:p.z-1,dx:0,dz:13,life:.1}];const dodges=p.practice.dodges;tickPractice(r,.2);assert.equal(p.practice.dodges,dodges+1);assert.equal(p.hp,100);
});
test('player-owned drills isolate targets and builds; weapon/enemy displayed baselines match survival',()=>{
 const {r,p}=setup('course'),q=player('q');r.players.set(q.id,q);startDrill(r,q,{drill:'flick'});assert.ok(r.enemies.some(e=>e.ownerId===p.id));assert.ok(r.enemies.some(e=>e.ownerId===q.id));
 const other=r.enemies.find(e=>e.ownerId===q.id);r.enemies=r.enemies.filter(e=>e===other);shoot(r,p,other);assert.equal(other.hp,other.maxHp,'other player cannot shoot your private practice target');
 assert.equal(startDrill(r,q,{drill:'invalid'}),false);assert.equal(startDrill(makeRoom('normal'),p,{drill:'course'}),false);
 const coop=makeRoom('check');coop.players.set('p',player());newWave(coop);for(let type=0;type<4;type++)assert.equal(coop.enemies.find(e=>e.type===type).hp,trainingEnemies[type].survivalHP);
});
test('practice types have distinct health, walk physically, pause safely and restore their own health',()=>{
 const {r,p}=setup();assert.equal(new Set(trainingEnemies.map(e=>e.practiceHP)).size,4);
 for(const e of r.enemies)assert.equal(e.hp,trainingEnemies[e.type].practiceHP);
 const e=r.enemies[0];Object.assign(e,{x:0,z:0,y:0,originX:0,originZ:0,patrolDirection:1});r.enemies=[e];
 tickPractice(r,.25);assert.ok(e.x>0);assert.equal(e.walking,true);assert.ok(Math.abs(e.yaw+Math.PI/2)<.001);
 const x=e.x;p.protected=true;tickPractice(r,1);assert.equal(e.x,x);assert.equal(e.walking,false);
 p.protected=false;r.modifiers.freezeEnemies=true;tickPractice(r,1);assert.equal(e.x,x);
 r.modifiers.freezeEnemies=false;e.hp=0;tickPractice(r,2.1);assert.equal(e.hp,trainingEnemies[0].practiceHP);
 startPractice(r);for(const target of r.enemies)assert.equal(target.maxHp,trainingEnemies[target.type].practiceHP);
});
test('walking patrols stay in their lanes and cannot walk through a built wall',()=>{
 const {r,p}=setup();const e=r.enemies[0];Object.assign(e,{x:0,z:0,y:0,originX:0,originZ:0,patrolDirection:1});r.enemies=[e];
 r.builds=[{id:123,owner:p.id,kind:'wall',x:2,z:0,y:0,turn:1,edit:0}];
 for(let i=0;i<300;i++){tickPractice(r,.05);assert.ok(e.x<1.4,'wall stops the patrol');assert.ok(Math.abs(e.x)<=3.5);}
 assert.equal(e.y,terrainHeight(e.x,e.z,r.map));
 startDrill(r,p,{drill:'course'});p.practice.stage=1;
 const stationary=r.enemies[0],x=stationary.x;tickPractice(r,.1);assert.equal(stationary.x,x);assert.equal(stationary.walking,false);
});
test('walking speed stays consistent across server update rates',()=>{
 const first=setup(),second=setup();
 for(const {r}of [first,second]){const e=r.enemies[0];Object.assign(e,{x:0,z:0,y:0,originX:0,originZ:0,patrolDirection:1});r.enemies=[e];}
 for(let i=0;i<30;i++)tickPractice(first.r,1/30);
 for(let i=0;i<60;i++)tickPractice(second.r,1/60);
 assert.ok(Math.abs(first.r.enemies[0].x-second.r.enemies[0].x)<.001);
});
test('real WebSocket clients can select a drill and receive authoritative practice stats',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const ws=new WebSocket(`ws://127.0.0.1:${server.address().port}`),inbox=[];ws.on('message',b=>inbox.push(JSON.parse(b)));
 const wait=async(type,predicate=()=>true)=>{for(let i=0;i<150;i++){const index=inbox.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return inbox.splice(index,1)[0];await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Missing '+type);};
 try{await new Promise(resolve=>ws.on('open',resolve));ws.send(JSON.stringify({type:'join',mode:'practice'}));await wait('joined');ws.send(JSON.stringify({type:'start'}));await wait('state',s=>s.phase==='fight');
  ws.send(JSON.stringify({type:'practice',drill:'tracking',duration:30,enemyType:3}));await wait('practiceStarted');const state=await wait('state',s=>s.players[0].practice?.drill==='tracking');assert.equal(state.players[0].practice.duration,30);assert.equal(state.players[0].practice.elapsed,0);assert.equal(state.enemies.filter(e=>e.ownerId===state.players[0].id).length,2);
  ws.send(JSON.stringify({type:'ready',ready:true}));await wait('state',s=>s.players[0].practice?.elapsed>0);assert.equal(rooms.size,1);
 }finally{ws.close();}
});
