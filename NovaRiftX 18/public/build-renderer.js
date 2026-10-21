import * as T from '/vendor/three.module.js';
import {buildBoxes,buildTriangles,buildTurn,editMask} from './building.js';

const EMPTY=[];
export function buildVisualKey(b){return `${b.id}:${b.kind}:${b.x}:${b.y}:${b.z}:${buildTurn(b)}:${editMask(b)}`;}
export function visualBoxes(b){
 if(!editMask(b)&&b.kind==='wall'){const turned=buildTurn(b)%2;return [[b.x,b.z,turned?.22:4,turned?4:.22,3,b.y]];}
 if(!editMask(b)&&b.kind==='floor')return [[b.x,b.z,4,4,.16,b.y-.16]];
 return buildBoxes(b);
}
const unit=new T.BoxGeometry(1,1,1).toNonIndexed();
export function buildRenderGeometry(b){
 const positions=[];
 if(b.kind==='ramp'||b.kind==='cone')positions.push(...buildTriangles(b));
 else for(const [x,z,w,d,h,y]of visualBoxes(b)){
  const a=unit.attributes.position;for(let i=0;i<a.count;i++)positions.push(x+a.getX(i)*w,y+h/2+a.getY(i)*h,z+a.getZ(i)*d);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}

// All walls/floors share one draw call; all sloped builds share a second.
// Updating a network snapshot with unchanged builds never rebuilds GPU buffers.
export function createBuildRenderer(scene){
 const material=new T.MeshStandardMaterial({color:0x567c9c,metalness:.38,roughness:.48,side:T.DoubleSide});
 const boxes=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,1800);boxes.count=0;boxes.visible=false;boxes.castShadow=boxes.receiveShadow=true;boxes.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(boxes);
 const slopes=new T.Mesh(new T.BufferGeometry(),material);slopes.visible=false;slopes.castShadow=slopes.receiveShadow=true;scene.add(slopes);
 const transform=new T.Object3D();let lastList=null,lastSignature='';
 return {boxes,slopes,sync(list=EMPTY){
  if(list===lastList)return false;lastList=list;
  const signature=list.map(buildVisualKey).join('|');if(signature===lastSignature)return false;lastSignature=signature;
  let count=0;const positions=[];
  for(const b of list){
   if(b.kind==='ramp'||b.kind==='cone')positions.push(...buildTriangles(b));
   else for(const [x,z,w,d,h,y]of visualBoxes(b)){transform.position.set(x,y+h/2,z);transform.scale.set(w,h,d);transform.updateMatrix();boxes.setMatrixAt(count++,transform.matrix);}
  }
  boxes.count=count;boxes.visible=count>0;boxes.instanceMatrix.needsUpdate=true;if(count)boxes.computeBoundingSphere();
  if(positions.length){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();slopes.geometry.dispose();slopes.geometry=geometry;}
  slopes.visible=positions.length>0;return true;
 },dispose(){boxes.geometry.dispose();slopes.geometry.dispose();material.dispose();boxes.removeFromParent();slopes.removeFromParent();}};
}
