import {terrainFor} from './terrain.js';

// Collision, ladder movement and the rendered lookout all use the same measurements.
export function outpostSpec(x,z,map=0){
 const ground=terrainFor(x,z,map);
 const highGround=Math.max(ground,...[-3.3,3.3].flatMap(dx=>[-3.3,3.3].map(dz=>terrainFor(x+dx,z+dz,map))));
 const floor=highGround+4.2;
 return {x,z,map,floor,roof:floor+2.9,half:3.45,ladder:{x,z:z+2.7,bottom:terrainFor(x,z+2.7,map),top:floor,width:1.15,reach:.82,landingX:x,landingZ:z+1.35}};
}

export function outpostBlocks(spec){
 const {x,z,map,floor,roof,half}=spec,blocks=[];
 const add=(cx,cz,w,d,h,base)=>{const block=[cx,cz,w,d,h,base];block.outpost=true;blocks.push(block);};
 // A broad deck with a genuine ladder hatch; no invisible slab seals its opening.
 add(x,z-0.725,half*2,5.45,.2,floor-.2);
 for(const side of [-1,1])add(x+side*2.125,z+2.725,2.65,1.45,.2,floor-.2);
 for(const dx of [-3.2,3.2])for(const dz of [-3.2,3.2]){
  const base=terrainFor(x+dx,z+dz,map);add(x+dx,z+dz,.28,.28,floor-base,base);
 }
 // The upper room's three full windows have separate sill, lintel and jambs.
 const windowWall=(cx,cz,alongX)=>{
  const width=6.9,opening=3.6,thickness=.22;
  add(cx,cz,alongX?width:thickness,alongX?thickness:width,.85,floor);
  add(cx,cz,alongX?width:thickness,alongX?thickness:width,.65,floor+2.1);
  for(const side of [-1,1])add(cx+(alongX?side*(opening+(width-opening)/2)/2:0),cz+(alongX?0:side*(opening+(width-opening)/2)/2),alongX?(width-opening)/2:thickness,alongX?thickness:(width-opening)/2,1.25,floor+.85);
 };
 windowWall(x,z-3.34,true);windowWall(x-3.34,z,false);windowWall(x+3.34,z,false);
 // The front opening joins the ladder hatch to the room without a step-over wall.
 for(const side of [-1,1])add(x+side*2.175,z+3.34,2.55,.22,.85,floor);
 add(x,z+3.34,6.9,.22,.45,floor+2.3);
 for(const side of [-1,1])add(x+side*3.2,z+3.34,.28,.22,1.45,floor+.85);
 add(x,z,7.4,7.4,.18,roof);
 return blocks;
}

export function ladderInReach(x,z,ladders=[]){
 return ladders.find(ladder=>Math.abs(x-ladder.x)<=ladder.width/2+.2&&Math.abs(z-ladder.z)<=ladder.reach)||null;
}
