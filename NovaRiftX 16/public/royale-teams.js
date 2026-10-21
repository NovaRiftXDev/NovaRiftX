export const teamModes={1:'Solos',2:'Duos',3:'Trios',4:'Squads'};
export const validTeamSize=value=>Number.isInteger(value)&&Object.hasOwn(teamModes,value)?value:1;
export const teamBattle=room=>room.mode==='royale'&&room.botFill&&room.teamSize>1;
export const sameTeam=(room,a,b)=>teamBattle(room)&&a?.teamId!=null&&a.teamId===b?.teamId;
export const teamForSlot=(room,slot)=>teamBattle(room)?Math.floor(slot/room.teamSize)+1:null;
export function assignHumanTeams(room){let slot=0;for(const p of room.players.values())p.teamId=teamForSlot(room,slot++);}
export function livingSides(room){
 const alive=[...room.players.values(),...room.enemies].filter(p=>p.hp>0);
 return new Set(alive.map(p=>teamBattle(room)&&p.teamId!=null?'team:'+p.teamId:'player:'+p.id));
}
export function finishRoyale(room){
 if(livingSides(room).size>1)return false;
 const alive=[...room.players.values(),...room.enemies].filter(p=>p.hp>0),winner=alive[0];
 room.phase='over';room.winnerTeamId=teamBattle(room)?winner?.teamId??null:null;
 room.winner=room.winnerTeamId!=null?'Team '+room.winnerTeamId:winner?.name||'No survivor';
 room.winnerId=winner?.id??null;
 return true;
}
