import {terrainFor,arenaLooks} from './terrain.js';
export const VERSION='2.8.0';
export const weapons = [
 {name:'Pistol',mag:12,reserve:96,damage:45,delay:0.22,reload:1.1,pellets:1,spread:0.007,range:60},
 {name:'Shotgun',mag:6,reserve:36,damage:24,delay:0.85,reload:1.8,pellets:7,spread:0.095,range:25},
 {name:'Assault rifle',mag:30,reserve:180,damage:28,delay:0.11,reload:1.5,pellets:1,spread:0.022,range:60},
 {name:'SMG',mag:40,reserve:320,damage:22,delay:0.065,reload:1.2,pellets:1,spread:0.03,range:40},
 {name:'Marksman',mag:10,reserve:100,damage:110,delay:0.5,reload:1.4,pellets:1,spread:0.002,range:90},
 {name:'Machine gun',mag:80,reserve:400,damage:34,delay:0.09,reload:2.3,pellets:1,spread:0.025,range:65},
 {name:'Plasma carbine',mag:36,reserve:360,damage:38,delay:.13,reload:1.1,pellets:1,spread:.012,range:75},
 {name:'Rail rifle',mag:8,reserve:80,damage:180,delay:.7,reload:1.3,pellets:1,spread:0,range:130},
 {name:'Scatter blaster',mag:12,reserve:120,damage:19,delay:.38,reload:1.3,pellets:9,spread:.075,range:38},
 {name:'Pulse repeater',mag:60,reserve:480,damage:26,delay:.055,reload:1.6,pellets:1,spread:.018,range:70}
];
export const blocks = [ [-9,-7,4,3,3], [9,-7,4,3,3], [-9,7,4,3,3], [9,7,4,3,3], [0,-13,5,2,2], [0,13,5,2,2], [-16,0,2,6,3], [16,0,2,6,3] ];
export const maps = [
 {name:'Dust Basin',theme:'desert',sky:0xb8c5c8,ground:0x9c8969,cover:0x746c59,blocks},
 {name:'Pine Ridge',theme:'forest',sky:0x8eaaa9,ground:0x505b43,cover:0x606c59,blocks:[[-7,-8,6,3,2],[8,-5,3,8,3],[-10,5,4,4,2],[8,9,7,3,2],[0,15,4,3,3],[-16,-10,3,5,3],[16,3,3,4,2]]},
 {name:'Iron Yard',theme:'industrial',sky:0x88969e,ground:0x535b60,cover:0x586975,blocks:[[-10,-8,3,10,3],[9,-10,8,3,3],[-8,9,8,3,3],[10,7,3,9,3],[0,-16,4,2,2],[-17,0,2,4,2],[17,-2,2,4,2]]}
];
// Additional arenas have independent cover layouts; visual biomes remain deterministic.
const arenaSpecs=[
 ['Solar Ruins','desert',[[-12,-10,5,3,2],[7,-11,3,7,3],[-7,8,3,9,2],[11,8,7,3,3],[0,15,6,2,2],[15,-1,2,5,2]]],
 ['Emerald Divide','forest',[[-12,0,4,9,3],[12,0,4,9,3],[-6,-12,6,3,2],[6,12,6,3,2],[5,-6,3,3,2],[-5,6,3,3,2]]],
 ['Orbital Depot','industrial',[[-14,-12,3,8,3],[0,-12,8,3,3],[13,-7,3,8,2],[-12,8,7,3,2],[5,12,9,3,3],[8,3,3,3,2]]],
 ['Canyon Relay','desert',[[-10,-11,9,3,3],[10,11,9,3,3],[-13,4,3,10,2],[13,-4,3,10,2],[0,-6,4,2,2],[0,6,4,2,2]]],
 ['Mistwood','forest',[[-12,-12,4,4,3],[0,-14,3,5,2],[12,-10,5,3,2],[-10,11,5,3,2],[5,10,3,7,3],[-7,0,3,5,2],[9,2,5,3,2]]],
 ['Quantum Works','industrial',[[-15,0,3,12,3],[15,0,3,12,3],[0,-15,12,3,3],[0,15,12,3,3],[-6,-6,3,3,2],[6,6,3,3,2]]],
 ['Mirage Station','desert',[[-12,-9,6,4,2],[11,-12,4,6,3],[-11,12,4,6,3],[12,9,6,4,2],[-4,-5,2,4,2],[4,5,2,4,2]]],
 ['Verdant Crossing','forest',[[-14,-10,3,6,3],[13,11,3,6,3],[-7,12,7,3,2],[7,-12,7,3,2],[-8,-1,4,4,2],[8,1,4,4,2]]],
 ['Eclipse Terminal','industrial',[[-13,-13,8,3,3],[13,13,8,3,3],[-13,8,3,8,2],[13,-8,3,8,2],[0,-8,5,3,2],[0,8,5,3,2]]]
];
for(const [name,theme,layout]of arenaSpecs){const template=maps.find(m=>m.theme===theme);maps.push({...template,name,blocks:layout});}
for(let i=0;i<12;i++){const base=maps[i%3],angle=(i+1)*.37;const names=['Copper Mesa','Frost Relay','Ash Foundry','Saffron Canyon','Willow Citadel','Steel Harbor','Dune Fortress','Moss Ruins','Titan Hangar','Sunset Pass','Rainfall Outpost','Lunar Vault'];maps.push({...base,name:names[i],sky:[0xd0b9a0,0x91b6c4,0x79879b][i%3],blocks:base.blocks.map(([x,z,w,d,h],j)=>[Math.round(x*Math.cos(angle)-z*Math.sin(angle)),Math.round(x*Math.sin(angle)+z*Math.cos(angle)),w+(j%2),d,h+(i%2)*.5])});}
export const skins=[{name:'Ion',color:0x6997bb},{name:'Obsidian',color:0x45495d},{name:'Aurora',color:0x8768b1},{name:'Crimson',color:0xb2505f},{name:'Glacier',color:0xa9c6d0},{name:'Verdant',color:0x5d927d}];
export const ARENA_HALF=47;
export function terrainHeight(x,z,map=0){return terrainFor(x,z,map);}
// Spread cover across a 94 m arena, retaining clear routes onto the ramps.
for(const m of maps)m.blocks=m.blocks.map(([x,z,w,d,h])=>[x*1.7,z*1.7,w,d,h]);
export function blocked(x,z,r=.45,layout=maps[0].blocks,feet=-Infinity){return Math.abs(x)>ARENA_HALF-r||Math.abs(z)>ARENA_HALF-r||layout.some(([bx,bz,w,d,h])=>Math.abs(x-bx)<w/2+r&&Math.abs(z-bz)<d/2+r&&feet<terrainHeight(bx,bz,layout.mapIndex||0)+h);}
export function move(p,dx,dz,r=.45,layout=maps[0].blocks){if(!blocked(p.x+dx,p.z,r,layout,p.y))p.x+=dx;if(!blocked(p.x,p.z+dz,r,layout,p.y))p.z+=dz;}
export function rayBox(o,d,min,max){let near=0,far=Infinity;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-8){if(o[i]<min[i]||o[i]>max[i])return Infinity;}else{let a=(min[i]-o[i])/d[i],b=(max[i]-o[i])/d[i];near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}}return near<=far?near:Infinity;}
export function hasWindow(block){return block[2]>=3&&block[3]>=3&&block[4]>=3;}
export function coverBoxes(block,map=0){const [x,z,w,d,h]=block,y=terrainHeight(x,z,map);if(!hasWindow(block))return [[[x-w/2,y,z-d/2],[x+w/2,y+h,z+d/2]]];const opening=Math.min(1.5,w*.45);return [
 [[x-w/2,y,z-d/2],[x+w/2,y+1.05,z+d/2]],
 [[x-w/2,y+2.15,z-d/2],[x+w/2,y+h,z+d/2]],
 [[x-w/2,y+1.05,z-d/2],[x-opening/2,y+2.15,z+d/2]],
 [[x+opening/2,y+1.05,z-d/2],[x+w/2,y+2.15,z+d/2]]];}
export function supportHeight(x,z,feet,layout){let ground=terrainHeight(x,z,layout.mapIndex||0);for(const [bx,bz,w,d,h]of layout){const top=terrainHeight(bx,bz,layout.mapIndex||0)+h;if(Math.abs(x-bx)<w/2+.25&&Math.abs(z-bz)<d/2+.25&&feet>=top-.15)ground=Math.max(ground,top);}return ground;}
export function coverDistance(o,d,layout=maps[0].blocks){let distance=Math.min(...layout.flatMap(block=>coverBoxes(block,layout.mapIndex||0).map(([min,max])=>rayBox(o,d,min,max))));for(let t=.25;t<Math.min(distance,150);t+=.35){const x=o[0]+d[0]*t,z=o[2]+d[2]*t;if(o[1]+d[1]*t<terrainHeight(x,z,layout.mapIndex||0)){distance=t;break;}}return distance;}

export const ROYALE_MAP=24,PRACTICE_MAP=25;
maps.push({name:'Riftfall Island',theme:'forest',blocks:[[-25,-24,8,5,4],[24,-20,7,6,5],[-18,23,6,7,3],[25,25,10,4,4],[-8,-18,4,4,2],[12,10,5,4,2]]},{name:'Nova Training Lab',theme:'industrial',blocks:[[-18,-18,1,30,3],[18,-18,1,30,3],[-12,-36,10,2,5],[0,-36,10,2,5],[12,-36,10,2,5]]});
for(const [i,m]of maps.entries()){
 Object.assign(m,arenaLooks[i]);
 m.outposts=i===25?[[-24,12],[24,12]]:[[-34,-28],[34,28]];
 for(const [x,z]of m.outposts){m.blocks.push([x-3,z,1,7,3.5],[x+3,z,1,7,3.5],[x,z-3,5,1,3.5]);}
 Object.defineProperty(m.blocks,'mapIndex',{value:i});
}
