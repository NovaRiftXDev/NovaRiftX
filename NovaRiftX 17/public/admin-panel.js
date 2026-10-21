import {createAdminShortcut,createLegacyAdminShortcut} from './admin-shortcut.js';
import {memeControls} from './memes.js';
import {adminControls} from './admin-config.js';

export function createAdminPanel(options){
 const panels=[];
 const mount=legacy=>mountAdminPanel({...options,legacy,onOpen:()=>{for(const p of panels)p.close();options.onOpen();}});
 panels.push(mount(false),mount(true));
 return {sync(){for(const p of panels)p.sync();},result(message){for(const p of panels)p.result(message);}};
}

function mountAdminPanel({getState,getId,send,onOpen,legacy}){
 const overlay=document.createElement('section');overlay.id=legacy?'legacyAdminPanel':'adminPanel';overlay.className='overlay hidden adminPanel';overlay.setAttribute('aria-label',legacy?'Original admin panel':'Core and Memes admin panel');
 const id=name=>legacy?'legacy'+name:name,el=name=>overlay.querySelector('#'+id(name));
 const nuke=legacy?'<button id="nukeMap">☢ Nuke whole map</button><p>Eliminates combatants. Settings protection and invulnerability still apply.</p>':'';
 const tabs=legacy?'<button id="shopAdminTab">Shop</button><button id="resetMemes">Clear memes</button>':'';
 const shop=legacy?'<section id="adminShopSection" class="adminShopSection" hidden><h3>Shop controls</h3><button id="openShopAdmin">Open shop admin</button><button data-shop="tokens">Toggle unlimited Rift Tokens</button><button data-shop="dragon">Summon Inferno dragon</button><button data-shop="recall">Recall dragon</button></section>':'';
 overlay.innerHTML=('<div class="panel adminShell"><div class="adminHeader"><div><h2>NovaRiftX · '+(legacy?'Original admin':'Core & Memes')+'</h2><p>Core controls + 50 memes.</p></div><button id="closeAdmin" class="secondary">Close</button></div><p id="adminStatus" class="adminStatus" role="status">Space rises in flight; either Shift key descends.</p>'+nuke+'<div class="shopTabs"><button id="coreTab">Core</button><button id="memeTab">Memes · 50</button>'+tabs+'</div>'+shop+'<div id="adminGrid" class="adminGrid"></div></div>').replace(/id="([^"]+)"/g,(_,name)=>'id="'+id(name)+'"');
 document.body.append(overlay);
 const grid=el('adminGrid'),status=el('adminStatus'),inputs=new Map();
 const combatSend=m=>{if(!getState()){status.textContent='Join or create a room to use combat controls.';return;}send(m);};
 for(const [i,c]of [...adminControls,...memeControls].entries()){
  const row=document.createElement('label');row.className='adminControl';row.dataset.section=i<adminControls.length?'core':'memes';row.hidden=i>=adminControls.length;
  const title=document.createElement('strong');title.textContent=String(i<adminControls.length?i+1:i-adminControls.length+1).padStart(2,'0')+' · '+c.label;
  const description=document.createElement('small');description.textContent=c.description;row.append(title,description);
  if(c.kind==='toggle'){
   const input=document.createElement('input');input.type='checkbox';input.setAttribute('aria-label',c.label);input.onchange=()=>combatSend({type:'admin',id:c.id,value:input.checked});row.append(input);inputs.set(c.id,input);
  }else{
   const button=document.createElement('button');button.textContent='Apply';button.setAttribute('aria-label',c.label);button.onclick=()=>combatSend({type:'admin',id:c.id});row.append(button);
  }
  grid.append(row);
 }
 function select(section){
  grid.hidden=section==='shop';if(legacy)el('adminShopSection').hidden=section!=='shop';
  for(const row of grid.children)row.hidden=row.dataset.section!==section;
  for(const [name,value]of [['coreTab','core'],['memeTab','memes'],...(legacy?[['shopAdminTab','shop']]:[])])el(name).setAttribute('aria-pressed',String(section===value));
 }
 el('coreTab').onclick=()=>select('core');el('memeTab').onclick=()=>select('memes');
 const shortcut=legacy?createLegacyAdminShortcut():createAdminShortcut();
 const close=()=>{overlay.classList.add('hidden');shortcut.reset();};el('closeAdmin').onclick=close;
 if(legacy){
  el('nukeMap').onclick=()=>combatSend({type:'admin',id:'nuke'});el('resetMemes').onclick=()=>combatSend({type:'admin',id:'resetMemes'});
  el('shopAdminTab').onclick=()=>select('shop');el('openShopAdmin').onclick=()=>{close();document.dispatchEvent(new Event('nova-shop-admin'));};
  for(const b of overlay.querySelectorAll('[data-shop]'))b.onclick=()=>{document.dispatchEvent(new CustomEvent('nova-shop-command',{detail:b.dataset.shop}));status.textContent='Shop control requested';};
 }
 const symbolCodes=legacy?['Equal','Minus','NumpadAdd','NumpadSubtract']:['KeyJ','KeyY'];
 const handleShortcut=event=>{
  const shopPanel=document.querySelector('#shopPanel'),inShop=!!shopPanel&&!shopPanel.classList.contains('hidden'),current=getState();
  const inGame=!!current&&['fight','break'].includes(current.phase);
  if(shortcut(event,inShop||inGame,performance.now())){
   event.preventDefault();event.stopImmediatePropagation();
   if(!overlay.classList.contains('hidden'))return;
   onOpen();document.exitPointerLock();overlay.classList.remove('hidden');select(legacy&&inShop?'shop':'core');
   status.textContent=current?'Space rises in flight; either Shift key descends.':legacy?'Shop controls are ready. Join a match to use combat controls.':'Join or create a room to use these controls.';
   el('closeAdmin').focus();
  }else if(shortcut.progress()===3&&symbolCodes.includes(event.code)){event.preventDefault();event.stopImmediatePropagation();}
  else if(event.key==='Escape'&&!overlay.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();close();}
 };
 window.addEventListener('keydown',handleShortcut,true);
 window.addEventListener('keyup',e=>{if(symbolCodes.includes(e.code))handleShortcut(e);},true);
 window.addEventListener('blur',()=>shortcut.reset());
 select('core');
 return {close,sync(){const s=getState();if(!s)return;const values={...s.memes,...s.players.find(p=>p.id===getId())?.modifiers,...Object.fromEntries(Object.entries(s.modifiers||{}).filter(([k])=>['freezeEnemies','slowEnemies','weakEnemies','peacefulEnemies','freezeStorm'].includes(k)))};for(const [name,input]of inputs)input.checked=!!values[name];},result(message){status.textContent=message;}};
}
