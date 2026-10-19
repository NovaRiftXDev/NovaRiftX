// Transmit construction only when it changes. Every newly joined/reconnected
// socket still receives a complete build snapshot before compact state updates.
export function createBuildStream(){
 const rooms=new WeakMap(),clients=new WeakMap();
 return {packet(room,state){
  const builds=room.builds||[],signature=JSON.stringify(builds);let cached=rooms.get(room);
  if(!cached||cached.signature!==signature){cached={signature,revision:(cached?.revision||0)+1};rooms.set(room,cached);}
  let complete,compact;const revision=cached.revision;
  return {send(ws){
   if(ws.readyState!==1||ws.bufferedAmount>=100000)return false;
   const previous=clients.get(ws),needsBuilds=previous?.room!==room||previous?.revision!==revision;
   const data=needsBuilds?(complete??=JSON.stringify({...state,buildRevision:revision,builds})):(compact??=JSON.stringify({...state,buildRevision:revision,builds:undefined}));
   ws.send(data);clients.set(ws,{room,revision});return true;
  }};
 }};
}
export function restoreBuilds(next,previous){
 if(!Object.hasOwn(next,'builds'))next.builds=previous?.builds||[];
 return next;
}
