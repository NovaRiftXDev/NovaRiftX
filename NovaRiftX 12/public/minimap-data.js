import {buildPoint,buildTurn,editMask} from './building.js';
export const MAP_EXTENT=48;
export function buildFootprints(b){
 const mask=editMask(b),turned=buildTurn(b)%2;
 const rect=(u,v,w,d)=>{const [x,,z]=buildPoint(b,u,v);return [x,z,turned?d:w,turned?w:d];};
 if(b.kind==='wall'){
  if(!mask)return [rect(0,0,4,.22)];
  return [0,1,2].filter(col=>[0,1,2].some(row=>!(mask&(1<<(row*3+col))))).map(col=>rect((col-1)*4/3,0,4/3,.22));
 }
 if(!mask)return [rect(0,0,4,4)];
 return [0,1,2,3].filter(i=>!(mask&(1<<i))).map(i=>rect(i%2?1:-1,i<2?1:-1,2,2));
}
export function mapPoint(x,z,size,extent=MAP_EXTENT){return [(x/extent+1)*size/2,(z/extent+1)*size/2];}
// Never accept the player list here: real players must never appear as red dots.
export function radarMarkers(state,ownId){
 const me=state?.players?.find(p=>p.id===ownId);
 return {me:me?.hp>0?{x:me.x,z:me.z,yaw:me.yaw}:null,enemies:(state?.enemies||[]).filter(e=>e.hp>0).map(e=>({x:e.x,z:e.z,boss:!!e.boss}))};
}
