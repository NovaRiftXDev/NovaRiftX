import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuildStream,restoreBuilds} from '../public/build-stream.js';
const socket=()=>({readyState:1,bufferedAmount:0,messages:[],send(data){this.messages.push(JSON.parse(data));}});
test('build stream sends full snapshots on join and edits, compact states between, and clears removals',()=>{
 const stream=createBuildStream(),r={builds:[{id:1,kind:'wall',edit:0}]},a=socket(),b=socket();const state={type:'state',phase:'fight',players:[]};
 stream.packet(r,state).send(a);assert.equal(a.messages[0].builds.length,1);
 stream.packet(r,state).send(a);assert.equal(Object.hasOwn(a.messages[1],'builds'),false);
 const restored=restoreBuilds(a.messages[1],a.messages[0]);assert.equal(restored.builds,a.messages[0].builds);
 stream.packet(r,state).send(b);assert.equal(b.messages[0].builds.length,1);
 r.builds[0].edit=16;stream.packet(r,state).send(a);assert.equal(a.messages.at(-1).builds[0].edit,16);
 assert.notEqual(a.messages.at(-1).buildRevision,a.messages[0].buildRevision);
 r.builds=[];stream.packet(r,state).send(a);assert.deepEqual(a.messages.at(-1).builds,[]);
});
test('backpressure cannot make a client miss a construction revision',()=>{
 const stream=createBuildStream(),r={builds:[]},ws=socket();ws.bufferedAmount=100000;assert.equal(stream.packet(r,{type:'state'}).send(ws),false);
 r.builds.push({id:2,kind:'cone'});ws.bufferedAmount=0;stream.packet(r,{type:'state'}).send(ws);assert.equal(ws.messages.at(-1).builds[0].id,2);
 const newRoom={builds:[]};stream.packet(newRoom,{type:'state'}).send(ws);assert.deepEqual(ws.messages.at(-1).builds,[]);
});
