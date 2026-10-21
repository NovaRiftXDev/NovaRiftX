import * as T from '/vendor/three.module.js';
import {terrainHeight,supportHeight,move} from './shared.js';
import {roomLayout} from './building.js';

export function companionPoint(owner){return {x:owner.x+Math.cos(owner.yaw)*1.8+Math.sin(owner.yaw)*2.3,z:owner.z-Math.sin(owner.yaw)*1.8+Math.cos(owner.yaw)*2.3};}
export function blocksView(point,camera,forward,radius=.65){
 const dx=point.x-camera.x,dy=point.y-camera.y,dz=point.z-camera.z,d=Math.hypot(dx,dy,dz);
 return d<.9||(d<5&&((dx*forward.x+dy*forward.y+dz*forward.z)/d)>.83-radius/Math.max(1,d)*.15);
}
const view=new T.Vector3();
export function updateCompanion(g,owner,state,camera,dt,now,{own=false,scoped=false}={}){
 const desired=companionPoint(owner),flying=!!g.userData.flying;
 if(!g.userData.petReady){
  // Keep even oversized shop pets below knee height in the arena.
  if(g.scale.x>.7)g.scale.setScalar(.7);
  g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g);g.userData.footOffset=-bounds.min.y;
  g.position.set(desired.x,terrainHeight(desired.x,desired.z,state.map)+(flying?.9:g.userData.footOffset),desired.z);g.userData.petReady=true;g.userData.petTime=0;g.userData.stride=0;
 }
 const before=g.position.clone(),dx=desired.x-g.position.x,dz=desired.z-g.position.z,distance=Math.hypot(dx,dz),step=Math.min(distance,Math.max(0,distance-.18)*dt*4.5,dt*(owner.sprinting?13:9));
 if(distance>16){g.position.x=desired.x;g.position.z=desired.z;}
 else if(distance>.2){
  if(flying){g.position.x+=dx/distance*step;g.position.z+=dz/distance*step;}
  else {const position={x:g.position.x,z:g.position.z,y:g.position.y-g.userData.footOffset};move(position,dx/distance*step,dz/distance*step,.18,roomLayout(state));g.position.x=position.x;g.position.z=position.z;}
 }
 const moved=Math.hypot(g.position.x-before.x,g.position.z-before.z),speed=moved/Math.max(.001,dt);
 if(moved>.002){const angle=Math.atan2(-(g.position.x-before.x),-(g.position.z-before.z));g.rotation.y+=Math.atan2(Math.sin(angle-g.rotation.y),Math.cos(angle-g.rotation.y))*(1-Math.exp(-10*dt));}
 const feet=g.position.y-(flying?.9:g.userData.footOffset),ground=supportHeight(g.position.x,g.position.z,feet+.2,roomLayout(state));
 const height=ground+(flying?.95+Math.sin(now*.004)*.1:g.userData.footOffset);
 g.position.y=T.MathUtils.lerp(g.position.y,height,1-Math.exp(-14*dt));
 g.userData.stride=T.MathUtils.lerp(g.userData.stride,Math.min(1,speed/.8),1-Math.exp(-14*dt));
 g.userData.petTime+=dt*(flying?1:Math.min(1.8,speed/2));g.userData.animate?.(g.userData.petTime,flying?1:g.userData.stride);
 camera.getWorldDirection(view);const center={x:g.position.x,y:g.position.y+.1,z:g.position.z};
 g.visible=!(own&&scoped)&&!blocksView(center,camera.position,view,own?.8:.35);
}
