import * as T from '/vendor/three.module.js';
import {RoundedBoxGeometry} from './addons/geometries/RoundedBoxGeometry.js';
import {outpostBlocks} from './outposts.js';

export function addOutposts(parent,specs,look){
 const steel=new T.MeshStandardMaterial({color:look.cover,metalness:.65,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:0x253440,metalness:.65,roughness:.45});
 const rails=new T.MeshStandardMaterial({color:0xc8d4db,metalness:.8,roughness:.27});
 const accent=new T.MeshStandardMaterial({color:look.accent,emissive:look.accent,emissiveIntensity:.7,metalness:.3,roughness:.4});
 const add=(group,geo,mat,x,y,z)=>{const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;};
 const box=(group,w,h,d,mat,x,y,z)=>add(group,new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.12),mat,x,y,z);
 for(const [index,spec]of specs.entries()){
  const group=new T.Group();group.name='Outpost '+(index+1);parent.add(group);
  const {x,z,floor,roof,ladder}=spec;
  for(const [cx,cz,w,d,h,base]of outpostBlocks(spec))box(group,w,h,d,h<.25?dark:steel,cx,base+h/2,cz);
  // Silver frames define open windows at standing eye height.
  for(const side of [-1,1]){
   for(const y of [floor+.85,floor+2.1]){
    box(group,.32,.07,3.65,rails,x+side*3.34,y,z);
    box(group,3.65,.07,.32,rails,x,y,z-3.34);
   }
   for(const dz of [-1.8,1.8])box(group,.27,1.3,.07,rails,x+side*3.34,floor+1.48,z+dz);
  }
  for(const dx of [-1.8,1.8])box(group,.07,1.3,.27,rails,x+dx,floor+1.48,z-3.34);
  for(const side of [-1,1]){
   add(group,new T.CylinderGeometry(.055,.055,floor-ladder.bottom+.75,12),rails,x+side*.49,(floor+ladder.bottom)/2+.375,ladder.z);
   const hook=new T.Mesh(new T.TorusGeometry(.2,.055,8,16,Math.PI/2),rails);hook.position.set(x+side*.49,floor+.55,ladder.z-.2);hook.rotation.y=Math.PI/2;group.add(hook);
  }
  for(let y=ladder.bottom+.2;y<floor+.1;y+=.29){const rung=add(group,new T.CylinderGeometry(.042,.042,1.02,12),rails,x,y,ladder.z);rung.rotation.z=Math.PI/2;}
  // Bright hatch edging makes the climb route obvious from above and below.
  for(const side of [-1,1])box(group,.07,.035,1.45,accent,x+side*.84,floor+.018,z+2.725);
  box(group,1.7,.035,.07,accent,x,floor+.018,z+2);
  box(group,6.7,.06,.08,accent,x,roof-.08,z+3.55);
  const antenna=add(group,new T.CylinderGeometry(.04,.065,2.4,12),rails,x+2.4,roof+1.4,z-2.3);
  add(group,new T.SphereGeometry(.1,12,8),accent,antenna.position.x,roof+2.65,antenna.position.z);
  const panel=box(group,1.5,.1,1.2,dark,x-1.9,roof+.45,z-.8);panel.rotation.z=-.2;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#17232f';ctx.fillRect(0,0,512,128);ctx.fillStyle='#dcecf5';ctx.textAlign='center';ctx.font='bold 30px sans-serif';ctx.fillText('OUTPOST '+(index+1),256,52);ctx.fillStyle='#'+look.accent.toString(16).padStart(6,'0');ctx.font='23px sans-serif';ctx.fillText('LADDER  ↑  W / ↓  S',256,96);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const label=add(group,new T.PlaneGeometry(2.3,.575),new T.MeshBasicMaterial({map:texture}),x,floor-1.05,z+3.5);label.castShadow=false;
 }
}
