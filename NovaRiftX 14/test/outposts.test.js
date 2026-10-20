import test from 'node:test';
import assert from 'node:assert/strict';
import {maps,ladderAt,blocked,supportHeight,coverBoxes,rayBox} from '../public/shared.js';
import {outpostBlocks} from '../public/outposts.js';

test('every arena has reachable ladder shafts and solid upper landings',()=>{
 for(const [map,m]of maps.entries())for(const lookout of m.lookouts){
  const ladder=lookout.ladder;
  assert.equal(ladderAt(ladder.x,ladder.z,map),ladder,m.name);
  assert.ok(ladder.top>ladder.bottom+3,m.name);
  for(let y=ladder.bottom;y<=ladder.top;y+=.1)assert.equal(blocked(ladder.x,ladder.z,.45,m.blocks,y),false,`${m.name}: ladder at ${y}`);
  assert.equal(blocked(ladder.landingX,ladder.landingZ,.45,m.blocks,ladder.top),false,`${m.name}: landing`);
  assert.ok(Math.abs(supportHeight(ladder.landingX,ladder.landingZ,ladder.top,m.blocks)-ladder.top)<1e-8,`${m.name}: deck support`);
 }
 assert.equal(ladderAt(0,0,25),null);
});

test('outpost lookout windows are genuine openings for sight and shots',()=>{
 for(const m of maps)for(const lookout of m.lookouts){
  const boxes=outpostBlocks(lookout).flatMap(block=>coverBoxes(block,lookout.map));
  for(const direction of [[-1,0,0],[1,0,0],[0,0,-1]]){
   const eye=[lookout.x,lookout.floor+1.55,lookout.z];
   assert.equal(Math.min(...boxes.map(([min,max])=>rayBox(eye,direction,min,max))),Infinity,m.name);
  }
  const sill=[lookout.x,lookout.floor+.4,lookout.z];
  assert.ok(Math.min(...boxes.map(([min,max])=>rayBox(sill,[0,0,-1],min,max)))<3.5,m.name);
 }
});
