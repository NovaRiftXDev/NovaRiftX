export const MAP_EXTENT=48;
export function mapPoint(x,z,size,extent=MAP_EXTENT){return [(x/extent+1)*size/2,(z/extent+1)*size/2];}
// Never accept the player list here: real players must never appear as red dots.
export function radarMarkers(state,ownId){
 const me=state?.players?.find(p=>p.id===ownId);
 return {me:me?.hp>0?{x:me.x,z:me.z,yaw:me.yaw}:null,enemies:(state?.enemies||[]).filter(e=>e.hp>0).map(e=>({x:e.x,z:e.z,boss:!!e.boss}))};
}
