import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminShortcut,createLegacyAdminShortcut} from '../public/admin-shortcut.js';
test('new panel ignores the original shortcut, ordinary weapon numbers, wrong order and expired sequences',()=>{
 const run=(keys)=>{const f=createAdminShortcut();return keys.map((key,i)=>f({key},true,i*100)).at(-1);};
 for(const keys of [['Shift','Meta','+','_'],['5','3'],['Shift','5','3'],['Meta','5','3'],['Shift','Meta','3','5'],['Shift','Meta','5','x','3']])assert.equal(run(keys),false);
 const f=createAdminShortcut();f({key:'Shift'},true,0);f({key:'Meta'},true,100);f({key:'5'},true,200);assert.equal(f({key:'3'},true,11000),false);
});
test('the original and new shortcuts open only their own panel',()=>{
 const run=(factory,keys)=>{const f=factory();return keys.map((key,i)=>f({key},true,i*100)).at(-1);};
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','+','_']),true);
 assert.equal(run(createLegacyAdminShortcut,['Shift','Meta','5','3']),false);
 assert.equal(run(createAdminShortcut,['Shift','Meta','+','_']),false);
 assert.equal(run(createAdminShortcut,['Shift','Meta','5','3']),true);
 const f=createLegacyAdminShortcut();f({key:'Shift'},true,0);f({key:'Meta'},true,10);f({key:'+'},true,20);f.reset();assert.equal(f({key:'_'},true,30),false);
});
test('releasing modifiers before the digits works and leaving shop/game cancels the shortcut',()=>{
 const f=createAdminShortcut();f({key:'Shift'},true,0);f({key:'Meta'},true,100);f({key:'5',code:'Digit5'},true,200);assert.equal(f({key:'3',code:'Digit3'},true,300),true);
 f({key:'Shift'},true,400);f({key:'Meta'},true,500);f({key:'5'},false,600);assert.equal(f({key:'3'},true,700),false);
});
