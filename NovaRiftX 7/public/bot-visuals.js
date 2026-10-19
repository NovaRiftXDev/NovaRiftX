import * as T from '/vendor/three.module.js';
import {enemyModel} from './enemy-models.js';

// Share each creature's geometry between all bots of that type.
export function botVisuals(scene){
 const batches=[0,1,2,3].map(type=>{
  const model=enemyModel(type),group=new T.Group();scene.add(group);model.updateMatrixWorld(true);
  const parts=[];model.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const draw=new T.InstancedMesh(mesh.geometry,mesh.material,100);draw.count=0;draw.castShadow=true;draw.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(draw);parts.push({mesh,draw});
  });
  return {model,parts};
 });
 const transform=new T.Object3D(),matrix=new T.Matrix4();
 return {update(bots){
  const time=performance.now()*.001;
  for(let type=0;type<4;type++){
   const batch=batches[type],selected=bots.filter(b=>b.type===type);
   batch.model.userData.animate(time);batch.model.updateMatrixWorld(true);
   for(const {mesh,draw}of batch.parts){
    draw.count=selected.length;
    for(let i=0;i<selected.length;i++){
     const b=selected[i];transform.position.set(b.x,b.y||0,b.z);transform.rotation.set(0,b.yaw||0,0);transform.updateMatrix();matrix.multiplyMatrices(transform.matrix,mesh.matrixWorld);draw.setMatrixAt(i,matrix);
    }
    draw.instanceMatrix.needsUpdate=true;draw.computeBoundingSphere();
   }
  }
 }};
}
