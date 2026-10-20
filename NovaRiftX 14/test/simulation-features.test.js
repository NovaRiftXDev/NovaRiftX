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
const {fillBots,tickBots}=await import('../game-modes.js');
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

test('all ten guns deal half damage to real players while retaining their AI damage',()=>{
 for(let weapon=0;weapon<weapons.length;weapon++)for(const human of [true,false]){
  const r=room('royale',{map:0}),p=r.players.get('human');
  p.weapon=weapon;p.input={yaw:0,pitch:0,weapon,fire:true};p.modifiers.perfectAccuracy=true;
  const target=player({id:'target',x:0,y:0,z:-3,hp:10000});
  if(human)r.players.set(target.id,target);else r.enemies=[{...target,type:1,cd:100}];
  const victim=human?target:r.enemies[0];tick(r,1/30);
  assert.equal(10000-victim.hp,weapons[weapon].damage*weapons[weapon].pellets*(human?.5:1),`${weapons[weapon].name} vs ${human?'human':'AI'}`);
 }
});

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

test('spiders pursue at a useful speed and deliver a stronger bite with short delayed poison',()=>{
 const wave=room();newWave(wave);assert.equal(wave.enemies.find(e=>e.type===0).maxHp,34);
 assert.ok(wave.enemies.find(e=>e.type===0).maxHp<wave.enemies.find(e=>e.type===1).maxHp);
 const r=room(),p=r.players.get('human');
 r.enemies=[{id:1,type:0,x:0,z:-5,y:0,hp:34,maxHp:34,cd:20}];
 tick(r,.1);assert.ok(r.enemies[0].z>-4.60&&r.enemies[0].z<-4.58);
 const e=r.enemies[0];e.z=-1;e.cd=0;tick(r,.01);
 assert.equal(p.hp,90);assert.equal(p.poison,3);assert.equal(e.cd,1.2);assert.equal(e.attackSequence,1);assert.ok(e.attackTimer>0);
 tick(r,.4);assert.equal(p.hp,90);assert.equal(e.attackSequence,1);
 r.modifiers.peacefulEnemies=true;
 tick(r,.41);tick(r,.81);tick(r,.81);assert.equal(p.hp,84);assert.equal(p.poison,0);
 tick(r,1);assert.equal(p.hp,84);
});

test('multiple spider bites do not stack poison or postpone its next tick',()=>{
 const r=room(),p=r.players.get('human');
 const e={id:1,type:0,x:0,z:-1,y:0,hp:34,maxHp:34,cd:0};r.enemies=[e];
 tick(r,.01);tick(r,.4);e.cd=0;tick(r,.1);
 assert.equal(p.hp,80);assert.equal(p.poison,3);assert.ok(Math.abs(p.poisonTimer-.3)<.000001);
 r.modifiers.peacefulEnemies=true;tick(r,.31);
 assert.equal(p.hp,78);assert.equal(p.poison,2);
});

test('royale spiders have moderate health and melee pressure without matching co-op damage',()=>{
 const r=room('botroyale'),p=r.players.get('human');fillBots(r);
 assert.equal(r.enemies.filter(e=>e.type===0).every(e=>e.hp===40&&e.maxHp===40),true);
 const e={id:201,type:0,bot:true,x:0,z:-5,y:0,hp:40,maxHp:40,cd:20};r.enemies=[e];
 tickBots(r,.1);assert.ok(e.z>-4.63&&e.z<-4.61);
 e.z=-1;e.cd=0;tickBots(r,.01);
 assert.equal(p.hp,94);assert.equal(p.poison,3);assert.equal(e.cd,1.2);
 tickBots(r,.4);assert.equal(p.hp,94);assert.equal(e.attackSequence,1);
});

test('Phoenix pursuit, damage and four-second blindness are stronger in co-op and royale',()=>{
 const r=room(),p=r.players.get('human'),e={id:212,type:2,x:0,z:-8,y:3,hp:100,maxHp:100,cd:99};r.enemies=[e];
 tick(r,.1);assert.ok(Math.abs(e.z+8-.58)<.00001,'co-op Phoenix speed is 5.8m/s');
 e.z=-1;e.cd=0;tick(r,.01);assert.equal(p.hp,88);assert.equal(p.blind,4);assert.equal(e.attackSequence,1);
 tick(r,.1);assert.equal(p.hp,88);assert.ok(p.blind<4&&p.blind>3.8,'blindness counts down');
 r.modifiers.freezeEnemies=true;tick(r,4.1);assert.equal(p.blind,0);
 const battle=room('botroyale'),human=battle.players.get('human'),bot={id:213,type:2,bot:true,x:0,z:-8,y:3,hp:100,cd:99};battle.enemies=[bot];
 tickBots(battle,.1);assert.ok(Math.abs(bot.z+8-.58)<.00001,'royale Phoenix speed is 5.8m/s');
 bot.z=-1;bot.cd=0;tickBots(battle,.01);assert.equal(human.hp,91);assert.equal(human.blind,4);
 human.protected=true;bot.cd=0;tickBots(battle,.1);assert.equal(human.hp,91);
});

test('battle royale records the winning entity id and can distinguish a bot victory',()=>{
 const r=room('botroyale'),p=r.players.get('human');r.enemies=[];tick(r,.01);assert.equal(r.phase,'over');assert.equal(r.winnerId,p.id);
 const battle=room('botroyale');battle.players.get('human').hp=0;battle.enemies=[{id:250,name:'Bot 1',type:2,bot:true,x:0,z:0,y:3,hp:100,cd:99}];
 tick(battle,.01);assert.equal(battle.phase,'over');assert.equal(battle.winnerId,250);assert.equal(battle.winner,'Bot 1');
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
