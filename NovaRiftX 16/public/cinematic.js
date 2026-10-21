import {maps} from './shared.js';
import * as T from '/vendor/three.module.js';
import {EffectComposer} from './addons/postprocessing/EffectComposer.js';
import {RenderPass} from './addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './addons/postprocessing/OutputPass.js';
import {ShaderPass} from './addons/postprocessing/ShaderPass.js';
import {SSAOPass} from './addons/postprocessing/SSAOPass.js';
import {FXAAShader} from './addons/shaders/FXAAShader.js';
import {Sky} from './addons/objects/Sky.js';
export function cinematic(renderer,scene,camera,sun){
 const sky=new Sky();sky.scale.setScalar(400);scene.add(sky);
 const pmrem=new T.PMREMGenerator(renderer);let environment;
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,12);ao.kernelRadius=.8;ao.minDistance=.003;ao.maxDistance=.12;composer.addPass(ao);
 const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.18,.4,1.1);composer.addPass(bloom);composer.addPass(new OutputPass());
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},warmth:{value:.025}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float warmth;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float lum=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(lum),c,1.06);c=(c-.5)*1.04+.5;c+=vec3(warmth,0.,-warmth*.6);float v=(1.-smoothstep(.18,.8,distance(vUv,vec2(.5))));c*=mix(.86,1.,v);gl_FragColor=vec4(clamp(c,0.,1.),1.);}'});composer.addPass(grade);
 const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
 let quality='high',scale=1,bloomAllowed=true;
 function resize(){let ratio=scale*Math.min(devicePixelRatio,quality==='ultra'?2:quality==='high'?1.5:1);renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(ratio);composer.setSize(innerWidth,innerHeight);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*ratio),1/(innerHeight*ratio));}
 function setQuality(q){quality=q;ao.enabled=q==='ultra';bloom.enabled=bloomAllowed&&q!=='performance';sun.shadow.mapSize.setScalar(q==='ultra'?4096:q==='high'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;resize();}
 function atmosphere(map){const cfg=maps[map];let index=['desert','forest','industrial'].indexOf(cfg.theme);const elevation=[18,32,12][index],azimuth=[135,155,205][index];const direction=new T.Vector3().setFromSphericalCoords(1,T.MathUtils.degToRad(90-elevation),T.MathUtils.degToRad(azimuth));const u=sky.material.uniforms;u.turbidity.value=[4,3,7][index];u.rayleigh.value=[1.6,2,1.3][index];u.mieCoefficient.value=.005;u.mieDirectionalG.value=.8;u.sunPosition.value.copy(direction);sun.position.copy(direction).multiplyScalar(45);sun.color.setHex([0xffd8a0,0xfff0cd,0xffc28c][index]);sun.intensity=[3.2,3,3.5][index];sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;Object.assign(sun.shadow.camera,{near:.1,far:120});sun.shadow.camera.updateProjectionMatrix();sky.visible=!['depot','hangar','vault','reactor','terminal','range'].includes(cfg.landmark);scene.background=new T.Color(cfg.sky);scene.fog=new T.FogExp2(cfg.sky,cfg.landmark==='mist'?.016:.004);const envScene=new T.Scene();const envSky=sky.clone();envScene.add(envSky);const next=pmrem.fromScene(envScene,.04,.1,600);scene.environment=next.texture;environment?.dispose();environment=next;grade.uniforms.warmth.value=[.028,-.005,.02][index];}
 setQuality('high');atmosphere(0);
 return {setQuality,atmosphere,resize,setScale(value){if(value===scale)return;scale=value;resize();},setBloom(value){bloomAllowed=value;bloom.enabled=value&&quality!=='performance';},render:()=>composer.render()};
}
