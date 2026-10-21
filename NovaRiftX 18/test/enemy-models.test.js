import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const threeURL=import.meta.resolve('three');
const source=(await readFile(new URL('../public/enemy-models.js',import.meta.url),'utf8')).replace("'/vendor/three.module.js'",JSON.stringify(threeURL));
const {enemyModel}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const T=await import(threeURL);
test('all four creature models have finite animated geometry and distinct silhouettes',()=>{
 const sizes=[];
 for(let type=0;type<4;type++){
  const model=enemyModel(type);model.userData.animate(1.25);model.updateMatrixWorld(true);
  const size=new T.Box3().setFromObject(model).getSize(new T.Vector3());sizes.push(size);
  model.traverse(o=>{if(!o.isMesh)return;assert.ok(o.material);for(const v of o.matrixWorld.elements)assert.ok(Number.isFinite(v));});
  assert.ok(size.y>0&&size.y<3);assert.ok(size.x>0&&size.x<4);
 }
 assert.ok(sizes[0].x>sizes[0].y,'spider is low and wide');
 assert.ok(sizes[1].y>sizes[0].y*2,'Demegorgan is tall');
 assert.ok(sizes[2].x>sizes[2].y,'Phoenix has broad wings');
});
test('spiders retain green shells and visibly lift alternating legs when walking',()=>{
 const model=enemyModel(0),shell=model.children.find(o=>o.isMesh).material.color;
 assert.ok(shell.g>shell.r*2&&shell.g>shell.b*2);
 const legs=model.children.filter(o=>o.isGroup);assert.equal(legs.length,8);
 model.userData.animate(.13,true);assert.ok(legs.some(l=>l.position.y>.63));assert.ok(legs.some(l=>Math.abs(l.position.y-.58)<.001));
 model.userData.animate(.13,false);for(const leg of legs){assert.equal(leg.position.y,.58);assert.equal(leg.rotation.y,0);}
});
test('each enemy visibly changes pose during an attack and returns to a neutral pose',()=>{
 for(let type=0;type<4;type++){
  const model=enemyModel(type);model.userData.animate(0,false,0);model.updateMatrixWorld(true);const neutral=model.rotation.x;
  model.userData.animate(0,false,[.275,.275,.325,.175][type]);model.updateMatrixWorld(true);assert.ok(Math.abs(model.rotation.x-neutral)>.05,`type ${type} attack pose`);assert.ok(model.userData.attackPulse>.9);
  model.userData.animate(0,false,0);assert.ok(Math.abs(model.rotation.x)<1e-8);
 }
});
