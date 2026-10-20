export function royaleResult(state,playerId){
 const won=state.phase==='over'&&state.winnerId!=null&&state.winnerId===playerId;
 return {won,title:won?'#1 WIN':'Battle Royale results',detail:won?'Last player standing':`Winner: ${state.winner||'No survivor'}`};
}
export function blindOpacity(seconds,active){
 return active&&seconds>0?Math.min(.94,seconds/1.2*.94):0;
}
