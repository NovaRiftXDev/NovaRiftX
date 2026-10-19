import test from 'node:test';
import assert from 'node:assert/strict';
import {mapPoint,radarMarkers} from '../public/minimap-data.js';
test('minimap maps north/top and preserves the terrain coordinate scale',()=>{
 assert.deepEqual(mapPoint(0,0,200),[100,100]);assert.deepEqual(mapPoint(-48,-48,200),[0,0]);assert.deepEqual(mapPoint(48,48,200),[200,200]);
});
test('minimap only reveals the local player and living AI, even in battle royale',()=>{
 const state={mode:'royale',players:[{id:'me',hp:100,x:1,z:2,yaw:0},{id:'friend',hp:100,x:4,z:5},{id:'opponent',hp:100,x:9,z:8}],enemies:[{id:1,hp:12,x:3,z:4,bot:true},{id:2,hp:0,x:5,z:6}]};
 assert.deepEqual(radarMarkers(state,'me'),{me:{x:1,z:2,yaw:0},enemies:[{x:3,z:4,boss:false}]});
 assert.equal(radarMarkers(state,'unknown').me,null);
});
