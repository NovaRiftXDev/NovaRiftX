import test from 'node:test';
import assert from 'node:assert/strict';
import {royaleResult,blindOpacity} from '../public/match-feedback.js';
test('only the actual battle royale winner gets #1 WIN, including duplicate callsigns and bot matches',()=>{
 const state={phase:'over',mode:'royale',winner:'Ranger',winnerId:'first'};
 assert.deepEqual(royaleResult(state,'first'),{won:true,title:'#1 WIN',detail:'Last player standing'});
 assert.equal(royaleResult(state,'second').won,false);assert.equal(royaleResult({...state,phase:'fight'},'first').won,false);
 assert.equal(royaleResult({...state,winnerId:999,winner:'Bot 1'},'first').won,false);
 assert.equal(royaleResult({...state,winnerId:null,winner:'No survivor'},'first').won,false);
 assert.equal(royaleResult({...state,botFill:true},'first').title,'#1 WIN');
});
test('stronger blindness fades out but never obscures settings, menus, or eliminated players',()=>{
 assert.equal(blindOpacity(4,true),.94);assert.equal(blindOpacity(2,true),.94);
 assert.equal(blindOpacity(.6,true),.47);assert.equal(blindOpacity(0,true),0);
 assert.equal(blindOpacity(4,false),0);
});
