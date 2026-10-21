import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {buildCommand} from '../public/building.js';
const threeURL=import.meta.resolve('three');
async function browserModule(file){
 let source=(await readFile(new URL('../public/'+file,import.meta.url),'utf8')).replace("'/vendor/three.module.js'",JSON.stringify(threeURL));
 if(file==='build-controls.js'){
  const renderer=(await readFile(new URL('../public/build-renderer.js',import.meta.url),'utf8')).replace("'/vendor/three.module.js'",JSON.stringify(threeURL)).replace("'./building.js'",JSON.stringify(new URL('../public/building.js',import.meta.url).href));
  source=source.replace("'./build-renderer.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(renderer).toString('base64')));
 }
 source=source.replace(/from '\.\/([^']+)'/g,(_,path)=>'from '+JSON.stringify(new URL('../public/'+path,import.meta.url).href));
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const {companionPoint,blocksView,updateCompanion}=await browserModule('companion-motion.js');
const {buildingControls}=await browserModule('build-controls.js');

test('pets follow behind the owner, walk on the ground, stop their gait, and hide when crossing the aiming view',()=>{
 const owner={id:'p',hp:100,x:0,z:0,y:0,yaw:0},state={map:25,builds:[],players:[owner]},g=new T.Group(),body=new T.Mesh(new T.BoxGeometry(.4,.8,.7),new T.MeshBasicMaterial());g.add(body);g.scale.setScalar(.5);
 let gait=0;g.userData.animate=(t,stride)=>gait=stride;const camera=new T.PerspectiveCamera();camera.position.set(0,1.55,0);camera.lookAt(0,1.55,-10);camera.updateMatrixWorld(true);
 updateCompanion(g,owner,state,camera,.016,0,{own:true});assert.ok(g.position.z>owner.z);const start=g.position.clone();
 for(let i=0;i<100;i++){owner.x+=.06;camera.position.x=owner.x;updateCompanion(g,owner,state,camera,.016,i*16,{own:true});}
 assert.ok(g.position.x-start.x>3);assert.ok(gait>.8);assert.ok(Math.abs(g.position.y-.2)<.02);
 for(let i=0;i<220;i++)updateCompanion(g,owner,state,camera,.016,2000+i*16,{own:true});assert.ok(gait<.01,'standing pets settle their legs');
 assert.equal(blocksView({x:0,y:1.55,z:-1},camera.position.clone().set(0,1.55,0),{x:0,y:0,z:-1}),true);
 assert.equal(blocksView({x:1.8,y:.3,z:2.3},{x:0,y:1.55,z:0},{x:0,y:0,z:-1}),false);
 assert.ok(companionPoint({...owner,yaw:Math.PI}).z<owner.z);
 updateCompanion(g,owner,state,camera,.016,6000,{own:true,scoped:true});assert.equal(g.visible,false);
});

test('build controls place a wall, enter a 3x3 edit, cut a window, reset it and choose a cone',()=>{
 const listeners=new Map(),nodes=[];
 const fakeDocument={pointerLockElement:{},body:{append(node){nodes.push(node);}},createElement(){return {style:{},textContent:'',hidden:false};},addEventListener(type,listener){const list=listeners.get(type)||[];list.push(listener);listeners.set(type,list);}};
 const previous=globalThis.document;globalThis.document=fakeDocument;
 try{
  const p={id:'p',x:0,y:0,z:0,yaw:0,pitch:0,hp:100,protected:false},r={map:25,phase:'fight',players:new Map([['p',p]]),enemies:[],builds:[],adminSerial:0},scene=new T.Scene();
  const control=buildingControls(scene,()=>({...r,players:[p]}),()=>p.id,m=>{p.lastBuild=0;buildCommand(r,p,m);});
  const event=(type,values)=>{const e={preventDefault(){},stopImmediatePropagation(){},...values};for(const fn of listeners.get(type)||[])fn(e);};
  event('keydown',{code:'KeyB'});assert.equal(control.active,true);event('mousedown',{button:0});assert.equal(r.builds[0].kind,'wall');
  event('keydown',{code:'KeyG'});assert.equal(control.editing,true);control.update();assert.ok(nodes[0].textContent.includes('Aim + drag'));
  event('mousedown',{button:0});event('mouseup',{});event('keydown',{code:'KeyG'});assert.equal(r.builds[0].edit,1<<4);assert.equal(control.editing,false);
  p.pitch=.5;event('keydown',{code:'KeyG'});assert.equal(control.editing,true);event('mousedown',{button:2});event('keydown',{code:'KeyG'});assert.equal(r.builds[0].edit,0);
  event('keydown',{code:'KeyY'});event('mousedown',{button:0});assert.ok(r.builds.some(b=>b.kind==='cone'));
 }finally{globalThis.document=previous;}
});
