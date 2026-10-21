import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {WebSocket} from 'ws';
import {sameTeam,assignHumanTeams,livingSides,finishRoyale} from '../public/royale-teams.js';
import {royaleResult} from '../public/match-feedback.js';
import {radarMarkers} from '../public/minimap-data.js';
import {weapons,blocked} from '../public/shared.js';
import {defaultModifiers} from '../public/admin-config.js';
import {roomLayout} from '../public/building.js';
const data=mkdtempSync(tmpdir()+'/nova-teams-');process.env.NOVA_DATA_DIR=data;process.env.NODE_ENV='test';
const {server,rooms,makeRoom,startRoyale,tick,shutdown}=await import('../server.js');
const {fillBots,tickBots}=await import('../game-modes.js');
const {tickDragons}=await import('../dragon-server.js');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const sockets=[];
after(()=>{for(const ws of sockets)ws.terminate();shutdown();rmSync(data,{recursive:true,force:true});});
function human(id){return {id,name:id,ws:{readyState:0},x:0,z:0,y:0,vy:0,hp:100,energy:100,protected:false,weapon:0,ammo:weapons.map(w=>w.mag),reserve:weapons.map(w=>w.reserve),cooldown:0,reload:0,modifiers:defaultModifiers(),input:{yaw:0,pitch:0}};}
async function peer(teamSize=1,code=''){
 const ws=new WebSocket(`ws://127.0.0.1:${server.address().port}`),inbox=[];sockets.push(ws);ws.on('message',b=>inbox.push(JSON.parse(b)));
 await new Promise(resolve=>ws.on('open',resolve));
 const wait=async(type,predicate=()=>true)=>{for(let i=0;i<150;i++){const at=inbox.findIndex(m=>m.type===type&&predicate(m));if(at>=0)return inbox.splice(at,1)[0];await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Timed out '+type);};
 const send=m=>ws.send(JSON.stringify(m));send({type:'join',mode:'botroyale',teamSize,code,name:'Team tester'});
 return {ws,send,wait,joined:await wait('joined')};
}
test('real peers share Duos, Trios and Squads, host controls format, and restart preserves teams',async()=>{
 for(const size of [2,3,4]){
  const a=await peer(size),b=await peer(1,a.joined.code),r=rooms.get(a.joined.code);
  const lobby=await b.wait('state');assert.equal(lobby.teamSize,size);assert.equal(lobby.players[0].teamId,lobby.players[1].teamId);
  b.send({type:'teamSize',value:1});await new Promise(resolve=>setTimeout(resolve,40));assert.equal(r.teamSize,size,'guests cannot change team format');
  a.send({type:'teamSize',value:1});await a.wait('state',s=>s.teamSize===1);
  a.send({type:'teamSize',value:size});await a.wait('state',s=>s.teamSize===size);
  a.send({type:'start'});const active=await b.wait('state',s=>s.phase==='fight');
  assert.equal(active.players.length+active.enemies.length,100);assert.equal(active.teamSize,size);
  assert.ok(Math.hypot(active.players[0].x-active.players[1].x,active.players[0].z-active.players[1].z)<=9);
  const late=new WebSocket(`ws://127.0.0.1:${server.address().port}`);sockets.push(late);await new Promise(resolve=>late.on('open',resolve));
  const rejection=new Promise(resolve=>late.once('message',b=>resolve(JSON.parse(b))));late.send(JSON.stringify({type:'join',code:a.joined.code}));assert.equal((await rejection).type,'error');late.close();
  r.modifiers.freezeEnemies=true;r.enemies=r.enemies.filter(e=>sameTeam(r,r.players.get(a.joined.id),e));
  tick(r,.001);const over=await b.wait('state',s=>s.phase==='over');assert.equal(over.winnerTeamId,over.players[0].teamId);assert.equal(royaleResult(over,b.joined.id).won,true);
  a.send({type:'start'});await b.wait('state',s=>s.phase==='fight'&&s.winnerTeamId===null);assert.equal(r.enemies.length+r.players.size,100);
  a.ws.close();b.ws.close();
 }
});
test('team slots cap at selected size and bot fill reaches exactly 100, including the final partial trio',()=>{
 for(const size of [1,2,3,4])for(const count of [1,2,5,8]){
  const r=makeRoom('fill',0,'botroyale','medium',size);for(let i=0;i<count;i++)r.players.set('p'+i,human('p'+i));startRoyale(r);fillBots(r);
  const all=[...r.players.values(),...r.enemies];assert.equal(all.length,100);assert.ok(all.every(p=>!blocked(p.x,p.z,.55,roomLayout(r))));
  if(size===1){assert.ok(all.every(p=>p.teamId===null));continue;}
  const counts=new Map();for(const p of all)counts.set(p.teamId,(counts.get(p.teamId)||0)+1);
  assert.equal(counts.size,Math.ceil(100/size));assert.ok([...counts.values()].every(n=>n<=size));assert.equal(counts.get(Math.ceil(100/size)),100%size||size);
  assert.equal(all.filter(p=>sameTeam(r,all[0],p)).length,size);
 }
 assert.equal(makeRoom('invalid',0,'botroyale','medium',9).teamSize,1);assert.equal(makeRoom('coop',0,'coop','medium',4).teamSize,1);
});
test('player guns and aimbot ignore human and AI squadmates while hitting enemy humans',()=>{
 const r=makeRoom('fire',0,'botroyale','medium',3);r.map=0;r.phase='fight';r.radius=65;r.supplyTimer=100;r.modifiers.freezeEnemies=true;
 const p=human('p'),ally=human('ally'),other=human('other');p.teamId=ally.teamId=1;other.teamId=2;
 Object.assign(ally,{z:-2});Object.assign(other,{z:-6});r.players.set(p.id,p);r.players.set(ally.id,ally);r.players.set(other.id,other);
 const bot={id:500,bot:true,type:1,teamId:1,x:0,y:0,z:-4,hp:100,cd:100};r.enemies=[bot];p.input.fire=true;p.modifiers.perfectAccuracy=true;p.modifiers.aimbot=true;
 tick(r,1/30);assert.equal(ally.hp,100);assert.equal(bot.hp,100);assert.equal(other.hp,100-weapons[0].damage*.5);assert.equal(r.phase,'fight');
});
test('bot melee, Phoenix blindness, ranged fire and admin dragon exclude their own squad',()=>{
 for(const type of [0,1,2,3]){
  const r=makeRoom('friendly',0,'botroyale','medium',2);r.map=0;r.phase='fight';r.radius=65;r.elapsed=0;
  const ally=human('ally');ally.teamId=1;ally.x=.5;const b={id:51,bot:true,type,teamId:1,x:0,z:0,y:type===2?3:0,hp:100,cd:0};r.players.set(ally.id,ally);r.enemies=[b];
  tickBots(r,1);assert.equal(ally.hp,100);assert.equal(ally.blind,undefined);assert.equal(ally.poison,undefined);assert.equal(r.events.length,0);
  ally.account={adminDragon:true,equipped:{pet:'petAdminDragon'}};tickDragons(r,.1);assert.equal(b.hp,100);
 }
});
test('last team wins for living and eliminated teammates, and radar excludes friendly bots and all remote humans',()=>{
 const r=makeRoom('win',0,'botroyale','medium',4);r.phase='fight';
 const p=human('p'),q=human('q'),enemy=human('enemy');r.players.set(p.id,p);r.players.set(q.id,q);assignHumanTeams(r);enemy.teamId=2;r.players.set(enemy.id,enemy);
 p.hp=0;r.enemies=[{id:501,bot:true,teamId:1,hp:30,x:2,z:3},{id:502,bot:true,teamId:2,hp:30,x:6,z:7}];
 assert.equal(livingSides(r).size,2);assert.equal(finishRoyale(r),false);enemy.hp=0;r.enemies[1].hp=0;
 assert.equal(finishRoyale(r),true);assert.equal(r.winnerTeamId,1);
 const state={...r,players:[...r.players.values()]};assert.equal(royaleResult(state,p.id).title,'#1 WIN');assert.equal(royaleResult(state,q.id).won,true);assert.equal(royaleResult(state,enemy.id).won,false);
 assert.deepEqual(radarMarkers(state,q.id).enemies,[]);r.enemies[1].hp=30;assert.equal(radarMarkers(state,q.id).enemies.length,1);
});
