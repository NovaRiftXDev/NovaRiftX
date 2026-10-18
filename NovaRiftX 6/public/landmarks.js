import * as T from '/vendor/three.module.js';
import {maps,terrainHeight} from './shared.js';
import {RoundedBoxGeometry} from './addons/geometries/RoundedBoxGeometry.js';
// Buildings inside the playable area use the same outpost wall footprints as collision.
// Large skyline landmarks sit outside the boundary; overhead structures leave clear routes.
export function landmarks(group,index){const cfg=maps[index],kind=cfg.landmark;
 const steel=new T.MeshStandardMaterial({color:cfg.cover,metalness:.65,roughness:.35}),dark=new T.MeshStandardMaterial({color:0x192636,metalness:.6,roughness:.4}),glow=new T.MeshStandardMaterial({color:cfg.accent,emissive:cfg.accent,emissiveIntensity:1.7}),stone=new T.MeshStandardMaterial({color:cfg.cover,roughness:.95});
 const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m;};
 const box=(w,h,d,mat,x,y,z)=>add(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.1),mat,x,y,z);
 const tube=(r,h,mat,x,y,z)=>add(new T.CylinderGeometry(r,r,h,24),mat,x,y,z);
 const ring=(r,mat,x,y,z)=>add(new T.TorusGeometry(r,.22,12,72),mat,x,y,z);
 function sign(text,x,y,z,width=5){const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d');a.fillStyle='#0e1929';a.fillRect(0,0,512,128);a.strokeStyle='#'+cfg.accent.toString(16).padStart(6,'0');a.lineWidth=8;a.strokeRect(4,4,504,120);a.fillStyle='#edf6ff';a.textAlign='center';a.font='bold 28px sans-serif';a.fillText(text,256,76);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;add(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:texture}),x,y,z);}
 for(const [i,[x,z]]of cfg.outposts.entries()){const y=terrainHeight(x,z,index);box(7,.3,8,steel,x,y+5,z);for(const side of [-1,1])tube(.09,5,steel,x+side*3,y+2.5,z+3);sign('OUTPOST '+(i+1)+' / AMMO',x,y+3,z+3.2);ring(.6,glow,x,y+4,z);}
 const sci=['depot','reactor','terminal','hangar','vault','range'].includes(kind);
 if(sci){for(let i=0;i<95;i++){const a=i*2.399,r=90+(i%7)*3;const star=add(new T.SphereGeometry(.08,5,4),glow,Math.cos(a)*r,25+(i%23)*3,Math.sin(a)*r);star.castShadow=false;}
 const orbit=ring(kind==='depot'?29:18,steel,0,32,-60);orbit.rotation.y=.4;orbit.rotation.z=.3;ring(kind==='depot'?27.8:17,glow,0,32,-60).rotation.copy(orbit.rotation);}
 function crane(x,z){tube(.5,20,steel,x,10,z);box(24,.7,1,steel,x+8,20,z);tube(.07,13,dark,x+17,13.5,z);box(4,3,4,steel,x+17,6,z);}
 function tower(x,z,h=17){box(8,h,8,steel,x,h/2,z);for(let y=3;y<h;y+=4)box(8.1,.4,8.1,glow,x,y,z);}
 function dish(x,z){tube(.5,14,steel,x,7,z);const d=add(new T.SphereGeometry(5,32,16,0,Math.PI*2,0,Math.PI*.45),steel,x,14,z);d.rotation.z=.5;tube(.08,6,glow,x,17,z);}
 function arch(x,z,w=15){for(const side of [-1,1])box(2,14,3,stone,x+side*w/2,7,z);box(w+2,2,3,stone,x,14,z);}
 function ship(x,y,z){const hull=add(new T.CapsuleGeometry(2,12,8,24),steel,x,y,z);hull.rotation.x=Math.PI/2;for(const side of [-1,1]){const wing=box(8,.5,7,steel,x+side*4,y,z+2);wing.rotation.z=side*.12;const engine=tube(.9,4,dark,x+side*2,y,z+8);engine.rotation.x=Math.PI/2;const rim=ring(.65,glow,x+side*2,y,z+10);rim.scale.setScalar(1);}}
 switch(kind){
 case 'depot':for(const x of [-24,24]){tower(x,-59,16);ship(x,22,-60);}box(70,1,18,steel,0,13,-61);sign('ORBITAL DEPOT  /  DOCK 07',0,18,-50,16);break;
 case 'hangar':for(const x of [-39,39])box(4,30,28,steel,x,15,-60);box(82,3,30,steel,0,30,-60);ship(0,10,-58);sign('TITAN / FLIGHT BAY',0,26,-44,20);break;
 case 'reactor':tube(7,18,dark,0,9,-58);for(let i=0;i<5;i++){const r=ring(9,glow,0,3+i*4,-58);r.rotation.x=Math.PI/2;}break;
 case 'vault':add(new T.SphereGeometry(16,40,24),steel,0,0,-62);ring(10,glow,0,7,-48);sign('LUNAR VAULT',0,18,-48,12);break;
 case 'terminal':for(let i=-1;i<=1;i++)tower(i*22,-60,22+i*3);box(65,1.5,6,steel,0,18,-60);add(new T.SphereGeometry(12,40,24),dark,28,43,-85);break;
 case 'range':for(let i=0;i<6;i++){const x=(i-2.5)*5;for(let z=-6;z>=-32;z-=2)box(.08,.02,1,glow,x,terrainHeight(x,z,index)+.03,z);sign((i+1)+' / '+(10+i*4)+' M',x,4,-35,3);}sign('NOVA TRAINING LAB',0,10,-40,16);break;
 case 'cranes':crane(-25,-60);crane(30,-56);break;
 case 'harbor':crane(-32,-58);crane(35,-58);box(25,7,12,steel,0,3,-66);box(8,8,8,steel,7,10,-65);add(new T.PlaneGeometry(170,60),new T.MeshPhysicalMaterial({color:0x3b8dab,metalness:.5,roughness:.15}),0,-.1,-80).rotation.x=-Math.PI/2;break;
 case 'foundry':for(const x of [-25,0,25]){tube(5,20,steel,x,10,-61);tube(2,14,dark,x,27,-61);ring(4,glow,x,7,-55);}break;
 case 'ruins':case 'moss':for(let i=0;i<3;i++)arch(-28+i*26,-58,12+i*2);break;
 case 'citadel':case 'fortress':for(const x of [-30,30]){tube(6,22,stone,x,11,-59);tube(7,2,stone,x,22,-59);}box(60,13,4,stone,0,6.5,-60);arch(0,-55,13);break;
 case 'relay':case 'ice':dish(0,-58);for(const x of [-32,32])add(new T.ConeGeometry(13,32,32),stone,x,12,-65);break;
 case 'rain':dish(-25,-58);tower(22,-58,13);break;
 case 'station':for(const x of [-18,18])add(new T.SphereGeometry(11,32,20),steel,x,2,-60);dish(0,-64);break;
 case 'bridge':box(80,1,9,stone,0,9,-60);for(const x of [-30,-10,10,30])box(3,9,4,stone,x,4.5,-60);break;
 case 'divide':case 'pines':for(let i=0;i<12;i++){const x=-55+i*10,z=-59-(i%3)*5; tube(.5,13,stone,x,6.5,z);for(let j=0;j<3;j++)add(new T.ConeGeometry(4-j*.7,8,24),new T.MeshStandardMaterial({color:cfg.ground}),x,10+j*3,z);}break;
 case 'mist':for(let i=0;i<7;i++){const x=-45+i*15,z=-58; tube(.8,7,stone,x,3.5,z);const cap=add(new T.SphereGeometry(5,32,20),steel,x,8,z);cap.scale.y=.4;}break;
 case 'island':ship(0,35,-78);for(const x of [-30,30])dish(x,-62);const sea=add(new T.PlaneGeometry(250,250),new T.MeshPhysicalMaterial({color:0x278cab,roughness:.2,metalness:.3}),0,-.2,0);sea.rotation.x=-Math.PI/2;break;
 default:for(let i=0;i<7;i++){const x=-60+i*20,z=-65;const rock=add(new T.SphereGeometry(12,32,24),stone,x,4+i%3*3,z);rock.scale.set(kind==='mesa'?1.3:1,kind==='pass'?2:1,1);}if(kind==='basin')arch(25,-63,13);break;
 }
}
