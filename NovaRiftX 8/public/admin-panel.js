import {createAdminShortcut} from './admin-shortcut.js';
import {memeControls} from './memes.js';
import {adminControls} from './admin-config.js';
export function createAdminPanel({getState,getId,send,onOpen}){
 const overlay=document.createElement('section');overlay.id='adminPanel';overlay.className='overlay hidden';overlay.setAttribute('aria-label','Admin panel');
 overlay.innerHTML='<div class="panel adminShell"><div class="adminHeader"><div><h2>NovaRiftX · Admin controls</h2><p>Core controls + 50 memes. Modifiers affect you unless marked Room.</p></div><button id="closeAdmin" class="secondary">Close</button></div><p id="adminStatus" role="status">Space rises in flight; either Shift key descends.</p><button id="nukeMap">☢ Nuke whole map</button><p>Eliminates combatants across the arena. Settings protection and invulnerability still apply.</p><div class="shopTabs"><button id="coreTab">Core</button><button id="memeTab">Memes · 50</button><button id="shopAdminTab">Shop</button><button id="resetMemes">Clear memes</button></div><section id="adminShopSection" hidden><h3>Shop controls</h3><button id="openShopAdmin">Open shop admin</button><button data-shop="tokens">Toggle unlimited Rift Tokens</button><button data-shop="dragon">Summon Inferno dragon</button><button data-shop="recall">Recall dragon</button></section><div id="adminGrid"></div></div>';
 document.body.append(overlay);const grid=overlay.querySelector('#adminGrid');const inputs=new Map();
 const combatSend=m=>{if(!getState()){overlay.querySelector('#adminStatus').textContent='Join or create a room first to use combat controls. Shop controls work here in the lobby.';return;}send(m);};
 for(const [i,c] of [...adminControls,...memeControls].entries()){const row=document.createElement('label');row.className='adminControl';row.dataset.section=i<adminControls.length?'core':'memes';row.hidden=i>=adminControls.length;const title=document.createElement('strong');title.textContent=String(i+1).padStart(2,'0')+' · '+c.label;const description=document.createElement('small');description.textContent=c.description;row.append(title,description);if(c.kind==='toggle'){const input=document.createElement('input');input.type='checkbox';input.setAttribute('aria-label',c.label);input.onchange=()=>combatSend({type:'admin',id:c.id,value:input.checked});row.append(input);inputs.set(c.id,input);}else{const button=document.createElement('button');button.textContent='Apply';button.setAttribute('aria-label',c.label);button.onclick=()=>combatSend({type:'admin',id:c.id});row.append(button);}grid.append(row);}
 for(const [button,section]of [['coreTab','core'],['memeTab','memes']])overlay.querySelector('#'+button).onclick=()=>{grid.hidden=false;overlay.querySelector('#adminShopSection').hidden=true;for(const row of grid.children)row.hidden=row.dataset.section!==section;};overlay.querySelector('#nukeMap').onclick=()=>combatSend({type:'admin',id:'nuke'});overlay.querySelector('#resetMemes').onclick=()=>combatSend({type:'admin',id:'resetMemes'});
 overlay.querySelector('#shopAdminTab').onclick=()=>{grid.hidden=true;overlay.querySelector('#adminShopSection').hidden=false;};overlay.querySelector('#openShopAdmin').onclick=()=>{close();document.dispatchEvent(new Event('nova-shop-admin'));};for(const b of overlay.querySelectorAll('[data-shop]'))b.onclick=()=>{document.dispatchEvent(new CustomEvent('nova-shop-command',{detail:b.dataset.shop}));overlay.querySelector('#adminStatus').textContent='Shop control requested';};
 function close(){overlay.classList.add('hidden');}
 overlay.querySelector('#closeAdmin').onclick=close;
 const shortcut=createAdminShortcut();const handleShortcut=event=>{
 const shop=document.querySelector('#shopPanel');
 const inShop=!!shop&&!shop.classList.contains('hidden');
 const current=getState();
 const inGame=!!current&&(current.phase==='fight'||current.phase==='break');
 const shortcutContext=inShop||inGame;
 const activated=shortcut(event,shortcutContext,performance.now());
 if(inShop&&shortcut.progress()===3)shop.querySelector('#shopStatus').textContent='Shortcut detected — release Command, then tap the minus / underscore key.';
 if(activated){
 if(shop)shop.querySelector('#shopStatus').textContent='';
 event.preventDefault();event.stopImmediatePropagation();
 if(!overlay.classList.contains('hidden'))return;
 onOpen();document.exitPointerLock();overlay.classList.remove('hidden');
 grid.hidden=inShop;overlay.querySelector('#adminShopSection').hidden=!inShop;for(const row of grid.children)row.hidden=row.dataset.section!=='core';
 overlay.querySelector('#adminStatus').textContent=getState()?'Space rises in flight; either Shift key descends.':'Shop controls are ready. Join a match to use combat controls.';
 overlay.querySelector('#closeAdmin').focus();
 }else if(event.key==='Escape'&&!overlay.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();close();}
 };window.addEventListener('keydown',handleShortcut,true);
 // macOS can suppress keydown while Command is held; keyup still completes the sequence.
 window.addEventListener('keyup',e=>{if(['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(e.code))handleShortcut(e);},true);

 return {sync(){const s=getState();if(!s)return;for(const [id,input]of inputs)input.checked=!!({...s.memes,...s.players.find(p=>p.id===getId())?.modifiers,...Object.fromEntries(Object.entries(s.modifiers||{}).filter(([k])=>['freezeEnemies','slowEnemies','weakEnemies','peacefulEnemies','freezeStorm'].includes(k)))})[id];},result(message){overlay.querySelector('#adminStatus').textContent=message;}};
}
