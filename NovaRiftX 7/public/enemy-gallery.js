import * as T from '/vendor/three.module.js';
import {enemyModel} from './enemy-models.js';
const scene=new T.Scene();scene.background=new T.Color('#0d1721');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(34,innerWidth/innerHeight,.1,80);camera.position.set(0,5,15);camera.lookAt(0,1,0);
scene.add(new T.HemisphereLight(0xd3edff,0x34404c,2.5));const sun=new T.DirectionalLight(0xffe0bc,4);sun.position.set(-4,7,6);sun.castShadow=true;scene.add(sun);const rim=new T.DirectionalLight(0x7ebaff,3);rim.position.set(4,4,-5);scene.add(rim);
const models=[];for(let i=0;i<4;i++){const x=(i-1.5)*3.15,model=enemyModel(i);model.position.set(x,i===2?1.15:0,0);model.rotation.y=Math.PI-.32;scene.add(model);models.push(model);const base=new T.Mesh(new T.CylinderGeometry(1.32,1.4,.14,64),new T.MeshStandardMaterial({color:0x253b49,roughness:.7,metalness:.3}));base.position.set(x,-.12,0);base.receiveShadow=true;scene.add(base);}
function render(time){requestAnimationFrame(render);for(const m of models)m.userData.animate(time*.001);renderer.render(scene,camera);}requestAnimationFrame(render);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
