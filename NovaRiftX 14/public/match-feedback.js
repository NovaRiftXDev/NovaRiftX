export function royaleResult(state,playerId){
 const me=state.players?.find(p=>p.id===playerId),teamWin=state.winnerTeamId!=null&&me?.teamId===state.winnerTeamId;
 const won=state.phase==='over'&&(teamWin||(state.winnerTeamId==null&&state.winnerId!=null&&state.winnerId===playerId));
 return {won,title:won?'#1 WIN':'Battle Royale results',detail:won?(teamWin?'Last team standing':'Last player standing'):`Winner: ${state.winner||'No survivor'}`};
}
export function blindOpacity(seconds,active){
 return active&&seconds>0?Math.min(.94,seconds/1.2*.94):0;
}
