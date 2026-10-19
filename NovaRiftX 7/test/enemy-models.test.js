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
