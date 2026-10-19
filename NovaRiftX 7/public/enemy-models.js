import * as T from '/vendor/three.module.js';

export const enemyNames=['Spider','Demegorgan','Phoenix','Shooter'];
let creatureSkin;
function smoothCreatureSkin(){
 if(creatureSkin)return creatureSkin.clone();
 const parts=[];
 const ell=(x,y,z,rx,ry,rz)=>parts.push([x,y,z,rx,ry,rz]);
 const limb=(points,radii)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));for(let i=0;i<=20;i++){const t=i/20,p=curve.getPoint(t),u=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(u)),r=T.MathUtils.lerp(radii[j],radii[j+1],u-j);ell(p.x,p.y,p.z,r,r,r);}};
 ell(0,1.30,.02,.27,.41,.21);ell(0,1.02,.03,.20,.26,.17);ell(0,1.58,.04,.32,.18,.20);
 limb([[0,1.55,.06],[0,1.76,-.01],[0,1.94,-.13]],[.14,.13,.17]);
 for(const side of [-1,1]){
  limb([[side*.15,1.0,.02],[side*.20,.65,.12],[side*.24,.22,-.07]],[.13,.095,.065]);ell(side*.24,.13,-.13,.10,.10,.21);
  limb([[side*.24,1.57,.03],[side*.40,1.43,-.01],[side*.52,1.03,-.08],[side*.63,.64,-.22]],[.14,.12,.09,.065]);ell(side*.64,.58,-.25,.10,.13,.075);
  for(let j=0;j<4;j++)limb([[side*(.59+j*.027),.55,-.25],[side*(.62+j*.038),.38,-.31],[side*(.66+j*.035),.34,-.39]],[.023,.019,.009]);
 }
 const min=[-.85,-.04,-.53],step=.035,size=[50,64,29],count=size[0]*size[1]*size[2],field=new Float32Array(count),grad=new Float32Array(count*3);
 const at=(x,y,z)=>(z*size[1]+y)*size[0]+x;
 function sdf(x,y,z){let d=10;for(const [cx,cy,cz,rx,ry,rz]of parts){const v=(Math.hypot((x-cx)/rx,(y-cy)/ry,(z-cz)/rz)-1)*Math.min(rx,ry,rz),h=Math.max(.045-Math.abs(d-v),0)/.045;d=Math.min(d,v)-h*h*.01125;}return d;}
 for(let z=0;z<size[2];z++)for(let y=0;y<size[1];y++)for(let x=0;x<size[0];x++)field[at(x,y,z)]=sdf(min[0]+x*step,min[1]+y*step,min[2]+z*step);
 for(let z=1;z<size[2]-1;z++)for(let y=1;y<size[1]-1;y++)for(let x=1;x<size[0]-1;x++){const n=at(x,y,z)*3;grad[n]=field[at(x+1,y,z)]-field[at(x-1,y,z)];grad[n+1]=field[at(x,y+1,z)]-field[at(x,y-1,z)];grad[n+2]=field[at(x,y,z+1)]-field[at(x,y,z-1)];}
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],positions=[],normals=[];
 const edge=(a,b)=>{const t=a.v/(a.v-b.v),p=a.p.map((v,i)=>v+(b.p[i]-v)*t),n=a.n.map((v,i)=>v+(b.n[i]-v)*t),l=Math.hypot(...n)||1;return {p,n:n.map(v=>v/l)};};
 function tri(a,b,c){const ab=new T.Vector3(...b.p).sub(new T.Vector3(...a.p)),ac=new T.Vector3(...c.p).sub(new T.Vector3(...a.p));if(ab.cross(ac).dot(new T.Vector3(...a.n))<0)[b,c]=[c,b];for(const v of [a,b,c]){positions.push(...v.p);normals.push(...v.n);}}
 for(let z=0;z<size[2]-1;z++)for(let y=0;y<size[1]-1;y++)for(let x=0;x<size[0]-1;x++){
  const ids=offsets.map(([a,b,c])=>at(x+a,y+b,z+c));if(ids.every(i=>field[i]>=0)||ids.every(i=>field[i]<0))continue;
  const corners=offsets.map(([a,b,c],i)=>({v:field[ids[i]],p:[min[0]+(x+a)*step,min[1]+(y+b)*step,min[2]+(z+c)*step],n:Array.from(grad.slice(ids[i]*3,ids[i]*3+3))}));
  for(const t of tetra){const inside=t.map(i=>corners[i]).filter(v=>v.v<0),outside=t.map(i=>corners[i]).filter(v=>v.v>=0);if(inside.length===1)tri(...outside.map(v=>edge(inside[0],v)));else if(inside.length===3)tri(...inside.map(v=>edge(outside[0],v)));else if(inside.length===2){const a=edge(inside[0],outside[0]),b=edge(inside[0],outside[1]),c=edge(inside[1],outside[0]),d=edge(inside[1],outside[1]);tri(a,b,c);tri(b,d,c);}}
 }
 creatureSkin=new T.BufferGeometry();creatureSkin.setAttribute('position',new T.Float32BufferAttribute(positions,3));creatureSkin.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return creatureSkin.clone();
}
export function enemyModel(type=0){
 const g=new T.Group(),legs=[],wings=[];let animateSkin;
 const metal=new T.MeshStandardMaterial({color:0x283941,metalness:.65,roughness:.35});
 const shell=new T.MeshPhysicalMaterial({color:[0x284d40,0x694653,0xe47d27,0x405b76][type],metalness:.4,roughness:.38,clearcoat:.35});
 const trim=new T.MeshStandardMaterial({color:0xabc2c4,metalness:.8,roughness:.25});
 const glow=new T.MeshStandardMaterial({color:[0x8cff54,0xff887c,0xffe19a,0x62dfff][type],emissive:[0x51c52b,0x992f28,0xff7014,0x28a9cb][type],emissiveIntensity:.9});
 function ell(parent,mat,x,y,z,rx,ry,rz){const m=new T.Mesh(new T.SphereGeometry(1,20,14),mat);m.position.set(x,y,z);m.scale.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function tube(parent,mat,points,r=.05){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,18,r,8,false),mat);m.castShadow=true;parent.add(m);return m;}
 function taper(parent,mat,from,to,r1,r2){const a=new T.Vector3(...from),b=new T.Vector3(...to),m=new T.Mesh(new T.CylinderGeometry(r2,r1,a.distanceTo(b),12),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());m.castShadow=true;parent.add(m);return m;}
 function feather(parent,mat,x,y,z,length,width,angle=0){const f=ell(parent,mat,x,y,z,width,.035,length/2);f.rotation.y=angle;return f;}
 if(type===0){
  // Two joined body masses, eight articulated legs, clustered eyes and fangs.
  ell(g,shell,0,.65,.26,.43,.32,.56);ell(g,metal,0,.6,-.35,.32,.23,.31);
  for(const side of [-1,1])for(let i=0;i<4;i++){
   const leg=new T.Group();leg.position.set(side*.23,.58,-.42+i*.23);g.add(leg);legs.push(leg);
   const z=(i-1.5)*.28,knee=[side*(.66+Math.sin(i)*.08),.18,z],foot=[side*(.86+Math.sin(i)*.1),-.52,z*1.8];
   taper(leg,metal,[0,0,0],knee,.065,.045);ell(leg,trim,...knee,.075,.075,.075);taper(leg,shell,knee,foot,.045,.008);
  }
  for(const side of [-1,1])for(let i=0;i<3;i++)ell(g,glow,side*(.075+i*.065),.64+i*.045,-.615+i*.025,.038,.04,.025);
  for(const side of [-1,1])tube(g,glow,[[side*.13,.49,-.53],[side*.17,.36,-.68],[side*.07,.34,-.75]],.023);
  for(let i=0;i<3;i++)ell(g,glow,0,.94-i*.035,.05+i*.19,.07,.015,.04);
 }else if(type===1){
  // One blended skin joins the neck, shoulders, torso, limbs, hands and feet.
  const skin=new T.MeshPhysicalMaterial({color:0x795a65,roughness:.57,metalness:0,clearcoat:.12});
  const body=new T.Mesh(smoothCreatureSkin(),skin);body.castShadow=body.receiveShadow=true;g.add(body);
  const phase={value:0};animateSkin=time=>phase.value=time;
  skin.onBeforeCompile=shader=>{shader.uniforms.creatureTime=phase;shader.vertexShader='uniform float creatureTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float stride=sin(creatureTime*9.0+step(0.0,position.x)*3.14159);
   float legWeight=1.0-smoothstep(.2,1.0,position.y);
   transformed.z+=stride*legWeight*.10;
   float armWeight=smoothstep(.30,.65,abs(position.x));
   transformed.z-=stride*armWeight*.045;
  `);};
  const mouth=new T.MeshStandardMaterial({color:0x291a27,roughness:.75});
  ell(g,skin,0,1.93,-.13,.18,.18,.13);ell(g,mouth,0,1.96,-.25,.11,.11,.04);
  const petalMaterial=new T.MeshPhysicalMaterial({color:0xa56d7e,roughness:.54,metalness:0,clearcoat:.15,side:T.DoubleSide});
  for(let i=0;i<5;i++){
   const a=i/5*Math.PI*2,geo=new T.SphereGeometry(1,36,28),v=geo.attributes.position;
   for(let j=0;j<v.count;j++){const x=v.getX(j),y=v.getY(j),z=v.getZ(j),t=(y+1)/2;v.setXYZ(j,x*.16*(.75+t*.25),t*.49,z*.045-.065*Math.sin(t*Math.PI)-.04*t*t);}
   geo.computeVertexNormals();const petal=new T.Group();petal.position.set(Math.sin(a)*.09,1.95+Math.cos(a)*.09,-.235);petal.rotation.z=-a;g.add(petal);const mesh=new T.Mesh(geo,petalMaterial);mesh.castShadow=true;petal.add(mesh);
   for(let j=0;j<4;j++)for(const side of [-1,1])ell(petal,petalMaterial,side*(.075-j*.009),.09+j*.075,-.08,.012,.024,.012);
  }
 }else if(type===2){
  // A bird with a distinct neck, hooked beak, swept layered wings and long tail.
  ell(g,shell,0,.68,.05,.23,.29,.43);ell(g,shell,0,.89,-.27,.14,.27,.16);ell(g,glow,0,1.1,-.39,.15,.15,.18);
  taper(g,trim,[0,1.09,-.52],[0,1.02,-.76],.095,.005);
  for(const side of [-1,1]){
   ell(g,metal,side*.127,1.15,-.47,.03,.034,.035);
   const wing=new T.Group();wing.position.set(side*.16,.8,-.04);g.add(wing);wings.push(wing);
   tube(wing,shell,[[0,0,0],[side*.46,.12,-.07],[side*1.03,.02,.25]],.055);
   for(let i=0;i<9;i++){const x=.15+i*.115;feather(wing,i%3===0?glow:shell,side*x,-.015,.12+i*.035,.54+i*.035,.065,side*(.12+i*.075));}
   for(let i=0;i<6;i++)feather(wing,glow,side*(.12+i*.12),.04,.01+i*.012,.27,.045,side*.3);
   tube(g,metal,[[side*.1,.48,.02],[side*.11,.27,.12],[side*.12,.18,.02]],.025);
   for(let i=-1;i<=1;i++)tube(g,trim,[[side*.12,.19,.01],[side*.12+i*.05,.15,-.13]],.012);
  }
  for(let i=-2;i<=2;i++)feather(g,i%2?glow:shell,i*.055,.57,.72+Math.abs(i)*.08,.9,.065,i*.15);
  for(let i=0;i<3;i++)taper(g,glow,[(i-1)*.06,1.19,-.32],[(i-1)*.12,1.45-i*.035,-.17],.045,.002);
 }else{
  // Purpose-built gunner, with a broad chest, a single optic and twin-barrel arm.
  ell(g,shell,0,1.12,0,.36,.38,.23);ell(g,metal,0,1.62,-.04,.25,.22,.22);ell(g,glow,0,1.64,-.25,.15,.045,.04);
  for(const side of [-1,1]){
   const leg=new T.Group();leg.position.set(side*.21,.86,0);g.add(leg);legs.push(leg);taper(leg,metal,[0,0,0],[0,-.59,0],.11,.085);ell(leg,shell,0,-.71,-.09,.14,.12,.23);
   ell(g,shell,side*.42,1.27,0,.17,.21,.17);tube(g,metal,[[side*.4,1.23,0],[side*.46,.95,-.28]],.085);
  }
  ell(g,metal,.46,1,-.4,.14,.14,.25);
  for(const side of [-1,1])taper(g,trim,[.46+side*.06,1,-.46],[.46+side*.06,1,-.91],.04,.04);
  ell(g,glow,-.08,1.19,-.235,.1,.1,.025);ell(g,metal,0,1.08,.28,.2,.29,.12);
 }
 g.userData.enemyType=type;
 g.userData.animate=(time,moving=true)=>{animateSkin?.(moving?time:0);legs.forEach((leg,i)=>{if(type===0)leg.rotation.y=moving?Math.sin(time*12+i*Math.PI*.7)*.14:0;else leg.rotation.x=moving?Math.sin(time*10+i*Math.PI)*.35:0;});wings.forEach((wing,i)=>wing.rotation.z=Math.sin(time*6)*(i?-.38:.38));};
 const animatedSurface=g.children.find(o=>o.isMesh);let lastFrame=-1;
 animatedSurface.onBeforeRender=renderer=>{if(renderer.info.render.frame===lastFrame)return;lastFrame=renderer.info.render.frame;g.userData.animate(performance.now()*.001);g.updateMatrixWorld(true);};
 return g;
}
