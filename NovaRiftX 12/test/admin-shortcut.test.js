import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminShortcut,createLegacyAdminShortcut} from '../public/admin-shortcut.js';
const panels=[
 {factory:createAdminShortcut,keys:['5','3'],shifted:['%','#'],codes:['Digit5','Digit3'],numpad:['Numpad5','Numpad3']},
 {factory:createLegacyAdminShortcut,keys:['+','_'],shifted:['+','_'],codes:['Equal','Minus'],numpad:['NumpadAdd','NumpadSubtract']}
];
const run=(factory,keys)=>{const f=factory();return keys.map((key,i)=>f({key},true,i*100)).at(-1);};
test('both distinct panels support Command/Ctrl, left/right modifiers, physical keys, shifted symbols and numpads',()=>{
 for(const {factory,keys,shifted,codes,numpad}of panels){
  for(const modifier of ['Meta','Control','OS'])for(const side of ['Left','Right'])for(const pair of [codes,numpad]){
   const f=factory();
   f({key:'Shift',code:'Shift'+side},true,0);
   f({key:modifier,code:(modifier==='Control'?'Control':'Meta')+side},true,10);
   assert.equal(f({key:keys[0],code:pair[0]},true,20),false);
   assert.equal(f({key:keys[1],code:pair[1]},true,30),true);
  }
  for(const modifier of ['metaKey','ctrlKey'])for(const physical of [false,true]){
   const f=factory(),event=i=>({key:physical?'Unidentified':shifted[i],code:physical?codes[i]:undefined,shiftKey:true,[modifier]:true});
   assert.equal(f(event(0),true,0),false);
   assert.equal(f({...event(0),repeat:true},true,10),false);
   assert.equal(f(event(1),true,20),true);
  }
 }
});
test('plus/underscore opens only the full panel; 5/3 opens only Core and Memes; old 6/7 and G/H are retired',()=>{
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','+','_']),true);
 assert.equal(run(createAdminShortcut,['Shift','Meta','5','3']),true);
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','5','3']),false);
 assert.equal(run(createAdminShortcut,['Shift','Meta','+','_']),false);
 for(const {factory}of panels)for(const keys of [['Shift','Meta','6','7'],['Shift','Meta','g','h']])assert.equal(run(factory,keys),false);
});
test('bare keys, wrong order, interruption, timeout, focus reset and leaving shop/game do not open panels',()=>{
 for(const {factory,keys:[a,b]}of panels){
  for(const keys of [[a,b],['Shift',a,b],['Meta',a,b],['Shift','Meta',b,a],['Shift','Meta',a,'x',b]])assert.equal(run(factory,keys),false);
  const f=factory(),prefix=()=>{f({key:'Shift'},true,0);f({key:'Control'},true,100);f({key:a},true,200);};
  prefix();assert.equal(f({key:b},true,11000),false);
  prefix();f.reset();assert.equal(f({key:b},true,300),false);
  prefix();f({key:a},false,250);assert.equal(f({key:b},true,300),false);
 }
});
test('Mac keyup fallback can repeat the first symbol without opening twice',()=>{
 for(const {factory,keys,codes}of panels){
  const f=factory(),event=i=>({key:keys[i],code:codes[i],shiftKey:true,metaKey:true});
  f(event(0),true,0);f(event(0),true,10);assert.equal(f(event(1),true,20),true);
  assert.equal(f({...event(1),metaKey:false,shiftKey:false},true,30),false);
 }
});
