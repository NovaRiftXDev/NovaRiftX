import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {weapons,maps,terrainHeight,supportHeight,blocked} from '../public/shared.js';
import {roomLayout} from '../public/building.js';
import {defaultModifiers} from '../public/admin-config.js';

const testData=mkdtempSync(tmpdir()+'/nova-simulation-');
process.env.NOVA_DATA_DIR=testData;process.env.NODE_ENV='test';
const {makeRoom,newWave,tick,risesAlong,shutdown}=await import('../server.js');
const {tickBots}=await import('../game-modes.js');
after(()=>{shutdown();rmSync(testData,{recursive:true,force:true});});

function player(overrides={}){
 return {id:'human',name:'Test',ws:{readyState:0},x:0,y:0,z:0,vy:0,hp:100,energy:100,protected:false,
  weapon:0,ammo:weapons.map(w=>w.mag),reserve:weapons.map(w=>w.reserve),cooldown:0,reload:0,
  modifiers:defaultModifiers(),input:{yaw:0,pitch:0},...overrides};
}
function room(mode='coop',overrides={}){
 const r=makeRoom('simulation',0,mode);r.phase='fight';r.supplyTimer=100;r.players.set('human',player());
 Object.assign(r,overrides);return r;
}

test('practice ignores held reload and depleted ammo for every weapon without creating ammo drops',()=>{
 const r=room('practice'),p=r.players.get('human');
 r.enemies=[{id:90,type:0,x:0,y:0,z:-3,hp:1,maxHp:100}];
 for(let weapon=0;weapon<weapons.length;weapon++){
  p.ammo[weapon]=0;p.reserve[weapon]=0;p.reload=10;p.cooldown=0;
  p.input={yaw:0,pitch:0,weapon,fire:true,reload:true};
  tick(r,1/30);
  assert.equal(p.reload,0);assert.equal(p.ammo[weapon],weapons[weapon].mag);
  assert.equal(r.events.filter(e=>e.type==='shot').length,weapon+1);
 }
 assert.equal(r.pickups.length,0);
});

test('spiders have lower health, a slower pursuit and a bounded delayed poison bite',()=>{
 const wave=room();newWave(wave);assert.equal(wave.enemies.find(e=>e.type===0).maxHp,20);
 const r=room(),p=r.players.get('human');
 r.enemies=[{id:1,type:0,x:0,z:-5,y:0,hp:20,maxHp:20,cd:20}];
 tick(r,.1);assert.ok(Math.abs(r.enemies[0].z+5)<=.226);
 const e=r.enemies[0];e.z=-1;e.cd=0;tick(r,.01);
 assert.equal(p.hp,96);assert.equal(p.poison,2);assert.equal(e.attackSequence,1);assert.ok(e.attackTimer>0);
 tick(r,.4);assert.equal(p.hp,96);assert.equal(e.attackSequence,1);
 r.modifiers.peacefulEnemies=true;
 tick(r,.41);tick(r,.81);assert.equal(p.hp,92);assert.equal(p.poison,0);
});

test('all four enemies expose attack animation timers and cooldowns prevent continuous retriggering',()=>{
 for(let type=0;type<4;type++){
  const r=room(),p=r.players.get('human');
  const e={id:101,type,x:0,z:type===3?-4:-1,y:type===2?3:0,hp:100,maxHp:100,cd:0};
  r.enemies=[e];tick(r,.01);
  assert.equal(e.attackSequence,1,'type '+type);assert.ok(e.attackTimer>0);
  assert.ok(r.events.some(event=>event.type==='attack'&&event.id===e.id));
  tick(r,.02);assert.equal(e.attackSequence,1);assert.ok(e.attackTimer>0);
  if(type===3)assert.ok(r.bolts.length>0);else assert.ok(p.hp<100);
 }
});

test('royale bot species animate melee, blind and ranged attacks with protected players excluded',()=>{
 for(let type=0;type<4;type++){
  const r=room('botroyale'),p=r.players.get('human');
  const e={id:201,type,bot:true,x:0,z:type===3?-5:-1,y:type===2?3:0,hp:100,cd:0};r.enemies=[e];
  tickBots(r,.01);assert.equal(e.attackSequence,1,'bot type '+type);assert.ok(e.attackTimer>0);
  p.protected=true;e.cd=0;const previous=e.attackSequence;tickBots(r,.1);assert.equal(e.attackSequence,previous);
 }
});

test('slides reject even gentle uphill terrain and cancel on the stored heading after turning the camera',()=>{
 const r=room('practice');r.map=0;const p=r.players.get('human');
 p.x=10.1;p.y=terrainHeight(p.x,0,0);p.input={yaw:-Math.PI/2,pitch:0,w:true,sprint:true,slide:true};
 tick(r,.05);assert.equal(p.slide,0);
 p.x=9.7;p.z=0;p.y=terrainHeight(p.x,0,0);p.slide=.5;p.slideX=1;p.slideZ=0;
 p.input={yaw:Math.PI/2,pitch:0};tick(r,.1);
 assert.equal(p.slide,0);assert.equal(p.x,9.7);
 p.x=14;p.y=terrainHeight(p.x,0,0);p.slide=.5;p.slideX=-1;p.slideZ=0;
 tick(r,.1);assert.ok(p.slide>0);assert.ok(p.x<14);
});

test('slide elevation checks include solid ascending ramp collision support',()=>{
 const layout=[];layout.mapIndex=25;
 for(let i=0;i<20;i++)layout.push([0,-2+(i+.5)*.2,4,.2,(i+1)*.15,0,true]);
 const p=player({x:0,z:-1.9,y:.15});
 assert.equal(risesAlong(p,0,.4,layout),true);
 p.z=1.9;p.y=3;assert.equal(risesAlong(p,0,-.4,layout),false);
});

test('every outpost ladder climbs to its shared upper deck, supports stopping and descends through the hatch',()=>{
 for(let map=0;map<maps.length;map++)for(const ladder of maps[map].ladders){
  const r=room('practice',{map}),p=r.players.get('human');
  Object.assign(p,{x:ladder.x,z:ladder.z,y:ladder.bottom,input:{yaw:0,pitch:0,w:true}});
  tick(r,.1);assert.equal(p.climbing,true);assert.ok(p.y>ladder.bottom);
  p.input={yaw:0,pitch:0};const stopped=p.y;tick(r,.1);assert.equal(p.y,stopped);
  p.input={yaw:0,pitch:0,w:true};
  for(let i=0;i<100&&p.climbing;i++)tick(r,.05);
  assert.equal(p.climbing,false);assert.equal(p.y,ladder.top);assert.equal(p.z,ladder.landingZ);
  const layout=roomLayout(r);assert.equal(blocked(p.x,p.z,.45,layout,p.y),false);
  assert.equal(supportHeight(p.x,p.z,p.y,layout),ladder.top);
  Object.assign(p,{x:ladder.x,z:ladder.z,input:{yaw:0,pitch:0,s:true}});
  tick(r,.1);assert.ok(p.climbing);assert.ok(p.y<ladder.top);
 }
});
