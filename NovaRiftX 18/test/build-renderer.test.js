import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {buildFootprints} from '../public/minimap-data.js';
const source=(await readFile(new URL('../public/build-renderer.js',import.meta.url),'utf8')).replace("'/vendor/three.module.js'",JSON.stringify(import.meta.resolve('three'))).replace("'./building.js'",JSON.stringify(new URL('../public/building.js',import.meta.url).href));
const {createBuildRenderer,buildRenderGeometry}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const builds=Array.from({length:200},(_,id)=>({id,kind:'wall',x:id%10*4-20,z:Math.floor(id/10)*4-40,y:0,turn:0,edit:0}));
test('200 walls batch into one renderable instead of 1800 separate meshes and unchanged snapshots keep buffers',()=>{
 const scene=new T.Scene(),draw=createBuildRenderer(scene);assert.equal(draw.sync(builds),true);assert.equal(scene.children.filter(o=>o.visible).length,1);assert.equal(draw.boxes.count,200);
 const geometry=draw.boxes.geometry,version=draw.boxes.instanceMatrix.version;
 assert.equal(draw.sync(structuredClone(builds)),false);assert.equal(draw.boxes.geometry,geometry);assert.equal(draw.boxes.instanceMatrix.version,version);
 const edited=structuredClone(builds);edited[0].edit=1<<4;assert.equal(draw.sync(edited),true);assert.equal(draw.boxes.count,207);
 draw.sync([]);assert.equal(scene.children.filter(o=>o.visible).length,0);draw.dispose();assert.equal(scene.children.length,0);
});
test('ramps and cones share one sloped batch and edited geometry retains openings',()=>{
 const scene=new T.Scene(),draw=createBuildRenderer(scene),list=builds.map((b,i)=>({...b,kind:i%2?'ramp':'cone'}));draw.sync(list);
 assert.equal(scene.children.filter(o=>o.visible).length,1);assert.ok(draw.slopes.geometry.attributes.position.count>0);
 const full=buildRenderGeometry(builds[0]),window=buildRenderGeometry({...builds[0],edit:1<<4});
 full.computeBoundingBox();window.computeBoundingBox();assert.deepEqual(full.boundingBox,window.boundingBox);assert.ok(window.attributes.position.count>full.attributes.position.count,'window is built from remaining tiles');
 draw.dispose();full.dispose();window.dispose();
});
test('minimap represents sloped builds with at most four footprints, preserving edited holes',()=>{
 for(const kind of ['wall','floor','ramp','cone'])for(const turn of [0,1,2,3]){const b={kind,x:4,z:8,y:0,turn,edit:0};assert.equal(buildFootprints(b).length,1);assert.ok(buildFootprints({...b,edit:1}).length<=4);}
 assert.equal(buildFootprints({kind:'cone',x:0,z:0,y:0,turn:0,edit:7}).length,1);
});
