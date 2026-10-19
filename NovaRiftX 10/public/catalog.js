export const catalog=[
 ...['Copper','Ocean','Rose','Solar','Nebula','Prismatic'].map((name,i)=>({id:'suit'+i,name:name+' armor',slot:'suit',color:['#bd7847','#337bc4','#d75788','#f5c34e','#9f61ec','#54eccf'][i],rarity:['Common','Common','Rare','Rare','Epic','Legendary'][i],price:[15,20,60,80,180,400][i]})),
 ...['Arctic','Ember','Jade','Royal','Starlight','Gold'].map((name,i)=>({id:'gun'+i,name:name+' gun finish',slot:'gun',color:['#c7e8f0','#ed6742','#45bd95','#9569d7','#668bff','#ffcf58'][i],rarity:['Common','Common','Rare','Rare','Epic','Legendary'][i],price:[15,20,60,80,180,400][i]})),
 ...['Scout orb','Fox drone','Orbit dragon','Volt wolf','Solar phoenix','Astral owl','Kitsune','Night wyvern','Sky manta'].map((name,i)=>({id:'pet'+i,name,slot:'pet',color:['#61ded7','#f6ae64','#b38aff','#78aaff','#ff9e46','#d5c9ff','#ff80bc','#8071dd','#71e5d8'][i],rarity:['Rare','Epic','Legendary','Epic','Legendary','Rare','Legendary','Epic','Rare'][i],price:[80,200,450,220,500,100,500,250,120][i]})),
 ...['back','halo','charm'].flatMap((slot,j)=>['Rare','Epic','Legendary'].map((rarity,i)=>({id:slot+i,slot,rarity,name:[['Ion thrusters','Blade wings','Aegis shield'],['Orbit halo','Solar crown','Crystal satellites'],['Rift crystal','Nova star','Moon pearl']][j][i],color:['#69dfee','#b087ff','#ffce73'][i],price:[60,160,320][i]})))
];
export const difficulties={easy:{health:.7,speed:.8,damage:.65},medium:{health:1,speed:1,damage:1},hard:{health:1.5,speed:1.25,damage:1.5}};

// New purchases cost more; already-owned item IDs and equipment are unchanged.
for(const item of catalog)item.price*=4;
for(const [slot,names]of Object.entries({suit:['Stormguard','Nightfall','Roseblade','Sunbreaker','Voidwalker','Aurora Prime'],gun:['Glacial Camo','Molten Fang','Emerald Circuit','Imperial Lattice','Galaxy Drift','Royal Relic'],back:['Plasma Engines','Eclipse Wings','Obsidian Guard'],halo:['Rift Orbit','Inferno Crown','Astral Shards'],charm:['Void Gem','Starlight Sigil','Lunar Relic']}))for(const [i,name]of names.entries())catalog.push({id:slot+'v'+i,slot,name,design:i,variant:true,color:['#89d7ff','#ff6548','#74efbd','#e2baff','#8d9bff','#ffd179'][i],rarity:i<2?'Epic':'Legendary',price:800+i*400});

for(const [slot,names]of Object.entries({suit:['Cryo sentinel','Solar knight','Nebula ranger','Rift paladin','Comet runner','Phantom guard'],gun:['Photon weave','Void lightning','Supernova','Polar prism','Chrome circuit','Stellar filigree'],back:['Comet jets','Photon wings','Void bulwark'],halo:['Saturn orbit','Photon crown','Meteor shards'],charm:['Gravity gem','Cosmic compass','Tiny planet']}))for(const [i,name]of names.entries())catalog.push({id:slot+'x'+i,slot,name,design:i,variant:true,color:['#a5efff','#ffc9aa','#9b8cff','#7ffff0','#efadff','#dce8ff'][i],rarity:i<3?'Epic':'Legendary',price:900+i*420});
for(const [i,name]of ['Frost fox','Nebula wolf','Ember wyvern'].entries())catalog.push({id:'petx'+i,slot:'pet',name,design:[1,3,7][i],color:['#c5eeff','#a49aff','#ffb071'][i],rarity:'Legendary',price:2200+i*400});
export const essentials=['suit0','gun0','pet0','back0','halo0','charm0'];
export function dailyShop(now=Date.now()){const day=Math.floor(now/86400000),pool=catalog.filter(i=>!i.admin&&!essentials.includes(i.id));const start=(day*13)%pool.length;return {day:new Date(day*86400000).toISOString().slice(0,10),nextReset:(day+1)*86400000,ids:[...essentials,...Array.from({length:18},(_,i)=>pool[(start+i)%pool.length].id)]};}

catalog.push({id:'petAdminDragon',name:'Inferno sovereign',slot:'pet',design:7,color:'#743dc1',rarity:'Admin',price:0,admin:true});
