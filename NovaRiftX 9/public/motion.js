// Render between authoritative snapshots rather than chasing each network update.
export function samplePlayer(samples,id,time){if(!samples.length)return null;let a=samples[0],b=a;for(const s of samples){if(s.time<=time)a=s;if(s.time>=time){b=s;break;}b=s;}const p=a.players.find(p=>p.id===id),q=b.players.find(p=>p.id===id)||p;if(!p)return q;if(!q)return p;const t=b.time===a.time?1:Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));if(Math.hypot(p.x-q.x,p.z-q.z)>6)return q;return {x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:p.z+(q.z-p.z)*t};}

export function movementInput(keys,active){return {w:active&&!!(keys.KeyW||keys.ArrowUp),a:active&&!!(keys.KeyA||keys.ArrowLeft),s:active&&!!(keys.KeyS||keys.ArrowDown),d:active&&!!(keys.KeyD||keys.ArrowRight),jump:active&&!!keys.Space};}
