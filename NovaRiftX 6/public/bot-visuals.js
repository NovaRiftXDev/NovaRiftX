import * as T from '/vendor/three.module.js';
export function botVisuals(scene){const group=new T.Group();scene.add(group);const parts=[
 [new T.CapsuleGeometry(.27,.35,4,8),0,1.05,0,.65,1,1,0x56687c],
 [new T.SphereGeometry(.23,10,8),0,1.62,0,1,1,1,0x272f3e],
 [new T.BoxGeometry(.32,.08,.1),0,1.64,-.22,1,1,1,0xffa963],
 ...[-1,1].map(s=>[new T.CapsuleGeometry(.10,.44,3,6),s*.18,.43,0,1,1,1,0x465365]),
 ...[-1,1].map(s=>[new T.CapsuleGeometry(.09,.38,3,6),s*.37,1.04,-.04,1,1,1,0x586b80])
 ];const draws=parts.map(([geometry,,,,,,,color])=>{const m=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color,roughness:.65}),100);m.count=0;m.castShadow=true;group.add(m);return m;});const dummy=new T.Object3D();return {update(bots){for(let part=0;part<draws.length;part++){const [,x,y,z,sx,sy,sz]=parts[part],draw=draws[part];draw.count=bots.length;for(let i=0;i<bots.length;i++){const b=bots[i],angle=b.yaw||0;dummy.position.set(b.x+x*Math.cos(angle)+z*Math.sin(angle),b.y+y,b.z-x*Math.sin(angle)+z*Math.cos(angle));dummy.rotation.set(0,angle,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();draw.setMatrixAt(i,dummy.matrix);}draw.instanceMatrix.needsUpdate=true;draw.computeBoundingSphere();}}};}
