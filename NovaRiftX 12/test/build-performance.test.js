import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBoxes,buildPoint,roomLayout} from '../public/building.js';
import {ARENA_HALF,maps,blocked,supportHeight,coverDistance,coverBoxes,rayBox,terrainHeight} from '../public/shared.js';

// Independent original full-scan rules verify that spatial pruning never changes
// gameplay around windows, doors, stairs, cones or terrain.
function fullBlocked(x,z,r,layout,feet){
 return Math.abs(x)>ARENA_HALF-r||Math.abs(z)>ARENA_HALF-r||layout.some(([bx,bz,w,d,h,base,step])=>{
  const y=base??terrainHeight(bx,bz,layout.mapIndex||0);
  return Math.abs(x-bx)<w/2+(step?0:r)&&Math.abs(z-bz)<d/2+(step?0:r)&&feet<y+h-(step?.32:base===undefined?0:.18)&&(base===undefined||feet+1.8>y);
 });
}
function fullSupport(x,z,feet,layout){
 let ground=terrainHeight(x,z,layout.mapIndex||0);
 for(const [bx,bz,w,d,h,base,step]of layout){const top=(base??terrainHeight(bx,bz,layout.mapIndex||0))+h;if(Math.abs(x-bx)<w/2+(step?0:.25)&&Math.abs(z-bz)<d/2+(step?0:.25)&&feet>=top-(step?.35:base===undefined?.15:.2))ground=Math.max(ground,top);}
 return ground;
}
function fullCover(o,d,layout){
 let distance=Infinity;for(const block of layout)for(const [min,max]of coverBoxes(block,layout.mapIndex||0))distance=Math.min(distance,rayBox(o,d,min,max));
 for(let t=.25;t<Math.min(distance,150);t+=.35)if(o[1]+d[1]*t<terrainHeight(o[0]+d[0]*t,o[2]+d[2]*t,layout.mapIndex||0)){distance=t;break;}
 return distance;
}
function close(actual,expected){assert.ok(actual===expected||Math.abs(actual-expected)<1e-8,`${actual} should equal ${expected}`);}

test('unchanged build layouts reuse collision arrays across game snapshots',()=>{
 const builds=[{kind:'wall',x:0,z:0,y:0,turn:0,edit:0},{kind:'ramp',x:8,z:0,y:0,turn:0,edit:0}];
 const first=roomLayout({map:25,builds}),wall=buildBoxes(builds[0]);
 assert.strictEqual(roomLayout({map:25,builds}),first);
 assert.strictEqual(buildBoxes(builds[0]),wall);
 builds[0].hp=50;builds[0].owner='different-player';
 assert.strictEqual(roomLayout({map:25,builds}),first,'non-geometric changes do not rebuild all collision data');
});

test('cached layouts notice in-place edits, rotations, moves, replacements and restart',()=>{
 const wall={kind:'wall',x:0,z:0,y:0,turn:0,edit:0},r={map:25,builds:[wall]};
 let layout=roomLayout(r);assert.equal(blocked(0,0,.45,layout,0),true);
 wall.edit=(1<<4)|(1<<7);let changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;
 assert.equal(blocked(0,0,.45,layout,0),false,'opening a door updates movement immediately');
 assert.ok(coverDistance([0,1.5,2],[0,0,-1],layout)>10,'the opened door also updates shots');
 wall.edit=0;changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;
 assert.equal(blocked(0,0,.45,layout,0),true,'resetting an edit restores solid cover');
 for(const mutation of [{turn:1},{x:4},{y:3},{kind:'floor'}]){Object.assign(wall,mutation);changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;}
 r.builds[0]={...wall,z:4};changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;
 r.builds.push({kind:'cone',x:12,z:4,y:0,turn:0});changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;
 r.builds.splice(0,1);changed=roomLayout(r);assert.notStrictEqual(changed,layout);layout=changed;
 r.map=0;changed=roomLayout(r);assert.notStrictEqual(changed,layout);assert.equal(changed.mapIndex,0);
 r.builds.length=0;assert.strictEqual(roomLayout(r),maps[0].blocks,'restarting with no builds drops old collisions');
 r.map=25;assert.strictEqual(roomLayout(r),maps[25].blocks,'a map change also replaces empty-room collision data');
});

test('spatial collision and shots match full scans in heavily built edited arenas',()=>{
 let seed=127;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const map of [0,5,25]){
  const builds=Array.from({length:100},(_,i)=>({kind:['wall','floor','ramp','cone'][i%4],x:(i%10-4.5)*8,z:(Math.floor(i/10)-4.5)*8,y:Math.floor(i/40)*3,turn:i%4,edit:i%3===0?1:0}));
  const layout=roomLayout({map,builds});
  for(let i=0;i<250;i++){
   const x=random()*96-48,z=random()*96-48,feet=random()*12,r=random()*.8;
   assert.equal(blocked(x,z,r,layout,feet),fullBlocked(x,z,r,layout,feet),`movement on map ${map} at ${x},${z}`);
   close(supportHeight(x,z,feet,layout),fullSupport(x,z,feet,layout));
  }
  for(let i=0;i<75;i++){
   const o=[random()*120-60,random()*14,random()*120-60],yaw=i<4?i*Math.PI/2:random()*Math.PI*2,pitch=(random()-.5)*.7;
   const d=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
   close(coverDistance(o,d,layout),fullCover(o,d,layout));
  }
 }
});

test('ramp edits keep walkable support and floor holes immediately invalidate cached support',()=>{
 const ramp={kind:'ramp',x:0,z:0,y:0,turn:0,edit:0},floor={kind:'floor',x:8,z:0,y:3,turn:0,edit:0},r={map:25,builds:[ramp,floor]};
 let layout=roomLayout(r),point=buildPoint(floor,-1,1);
 assert.equal(supportHeight(point[0],point[2],3,layout),3);
 floor.edit=1;layout=roomLayout(r);assert.equal(supportHeight(point[0],point[2],3,layout),0);
 ramp.turn=1;ramp.edit=1;layout=roomLayout(r);
 for(const u of [-1,1])for(const v of [-1,1]){
  point=buildPoint(ramp,u,v);close(supportHeight(point[0],point[2],4,layout),fullSupport(point[0],point[2],4,layout));
 }
});
