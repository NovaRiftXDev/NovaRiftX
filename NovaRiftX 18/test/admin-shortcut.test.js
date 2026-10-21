import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminShortcut,createLegacyAdminShortcut} from '../public/admin-shortcut.js';
const panels=[
 {factory:createAdminShortcut,keys:['j','y'],shifted:['J','Y'],codes:['KeyJ','KeyY'],numpad:null,modifiers:['Alt','Option'],flags:['altKey']},
 {factory:createLegacyAdminShortcut,keys:['+','_'],shifted:['+','_'],codes:['Equal','Minus'],numpad:['NumpadAdd','NumpadSubtract'],modifiers:['Meta','Control','OS'],flags:['metaKey','ctrlKey']}
];
const run=(factory,keys)=>{const f=factory();return keys.map((key,i)=>f({key},true,i*100)).at(-1);};
test('each panel supports its own modifier, left/right modifiers, physical keys, shifted symbols and numpads',()=>{
 for(const {factory,keys,shifted,codes,numpad,modifiers,flags}of panels){
  for(const modifier of modifiers)for(const side of ['Left','Right'])for(const pair of [codes,numpad].filter(Boolean)){
   const f=factory();
   f({key:'Shift',code:'Shift'+side},true,0);
   f({key:modifier,code:(modifier==='Control'?'Control':modifier==='Alt'||modifier==='Option'?'Alt':'Meta')+side},true,10);
   assert.equal(f({key:keys[0],code:pair[0]},true,20),false);
   assert.equal(f({key:keys[1],code:pair[1]},true,30),true);
  }
  for(const modifier of flags)for(const physical of [false,true]){
   const f=factory(),event=i=>({key:physical?'Unidentified':shifted[i],code:physical?codes[i]:undefined,shiftKey:true,[modifier]:true});
   assert.equal(f(event(0),true,0),false);
   assert.equal(f({...event(0),repeat:true},true,10),false);
   assert.equal(f(event(1),true,20),true);
  }
 }
});
test('plus/underscore opens only the full panel; J/Y opens only Core and Memes; old 6/7 and G/H are retired',()=>{
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','+','_']),true);
 assert.equal(run(createAdminShortcut,['Shift','Alt','j','y']),true);
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','j','y']),false);
 assert.equal(run(createAdminShortcut,['Shift','Meta','+','_']),false);
 assert.equal(run(createAdminShortcut,['Shift','Meta','j','y']),false);
 assert.equal(run(createAdminShortcut,['Shift','Control','j','y']),false);
 assert.equal(run(createLegacyAdminShortcut,['Shift','Alt','+','_']),false);
 for(const {factory}of panels)for(const keys of [['Shift','Meta','5','3'],['Shift','Meta','6','7'],['Shift','Meta','g','h']])assert.equal(run(factory,keys),false);
});
test('bare keys, wrong order, interruption, timeout, focus reset and leaving shop/game do not open panels',()=>{
 for(const {factory,keys:[a,b],modifiers}of panels){
  for(const keys of [[a,b],['Shift',a,b],['Meta',a,b],['Shift',modifiers[0],b,a],['Shift',modifiers[0],a,'x',b]])assert.equal(run(factory,keys),false);
  const f=factory(),prefix=()=>{f({key:'Shift'},true,0);f({key:modifiers[0]},true,100);f({key:a},true,200);};
  prefix();assert.equal(f({key:b},true,11000),false);
  prefix();f.reset();assert.equal(f({key:b},true,300),false);
  prefix();f({key:a},false,250);assert.equal(f({key:b},true,300),false);
 }
});
test('Mac keyup fallback can repeat the first symbol without opening twice',()=>{
 for(const {factory,keys,codes,flags}of panels){
  const f=factory(),event=i=>({key:keys[i],code:codes[i],shiftKey:true,[flags[0]]:true});
  f(event(0),true,0);f(event(0),true,10);assert.equal(f(event(1),true,20),true);
  assert.equal(f({...event(1),[flags[0]]:false,shiftKey:false},true,30),false);
 }
});
