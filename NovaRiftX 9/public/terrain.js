const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const hill=(x,z,cx,cz,sx,sz,h)=>h*Math.exp(-1*(((x-cx)/sx)**2+((z-cz)/sz)**2));
const ridge=(x,z,a,offset,width,h)=>h*Math.exp(-1*((x*Math.cos(a)+z*Math.sin(a)-offset)/width)**2);
const plateau=(x,z,cx,cz,w,d,h)=>h*smooth((w-Math.abs(x-cx))/8)*smooth((d-Math.abs(z-cz))/8);
export function terrainFor(x,z,i=0){let h=0;const r=Math.hypot(x,z);
 switch(i){
 case 0:h=Math.max(4*smooth((x-10)/12)*smooth((44-x)/8)*smooth((23-Math.abs(z))/9),2.5*smooth((-x-12)/10)*smooth((44+x)/8)*smooth((25-Math.abs(z-5))/10),3*smooth((-z-22)/12)*smooth((46+z)/9)*smooth((24-Math.abs(x))/10));break;
 case 1:h=ridge(x,z,.3,19,13,7)+hill(x,z,-26,-22,16,19,4);break;
 case 2:h=plateau(x,z,-26,16,17,20,3)+plateau(x,z,25,-18,16,18,1.8);break;
 case 3:h=hill(x,z,-20,20,23,16,5)+ridge(x,z,1.1,-28,9,3);break;
 case 4:h=5*(1-Math.exp(-1*((x-z*.25)/18)**2));break;
 case 5:h=plateau(x,z,-25,-23,20,19,4)+plateau(x,z,26,20,18,18,2.5);break;
 case 6:h=7*(1-Math.exp(-1*((x+Math.sin(z*.08)*8)/19)**2));break;
 case 7:h=hill(x,z,-16,-24,15,13,4)+hill(x,z,26,18,19,16,3)+hill(x,z,-28,22,12,15,2);break;
 case 8:h=3.8*Math.exp(-1*((r-27)/8)**2);break;
 case 9:h=hill(x,z,25,-23,25,10,4)+hill(x,z,-24,24,15,22,2);break;
 case 10:h=3*(1-Math.exp(-1*((z-Math.sin(x*.09)*6)/10)**2))+hill(x,z,-32,30,13,13,3);break;
 case 11:h=plateau(x,z,0,-30,38,17,4)+plateau(x,z,30,12,15,25,2);break;
 case 12:h=plateau(x,z,-25,-20,20,22,6)+plateau(x,z,25,23,18,19,3.5);break;
 case 13:h=ridge(x,z,.85,24,12,5)+ridge(x,z,-.65,-25,14,3);break;
 case 14:h=plateau(x,z,26,0,16,38,5)+hill(x,z,-22,-22,18,18,3);break;
 case 15:h=6*(1-Math.exp(-1*((z-x*.4)/16)**2))+hill(x,z,-28,-8,14,14,3);break;
 case 16:h=4*Math.exp(-1*((r-25)/11)**2)+hill(x,z,20,-28,12,12,2);break;
 case 17:h=plateau(x,z,-24,0,19,44,3)+plateau(x,z,25,20,15,20,1.5);break;
 case 18:h=plateau(x,z,0,-22,30,22,5)+hill(x,z,-30,25,17,18,4);break;
 case 19:h=hill(x,z,-24,-24,19,18,4)+hill(x,z,24,0,18,24,5)+hill(x,z,-20,28,18,12,2);break;
 case 20:h=plateau(x,z,-29,0,15,42,3)+plateau(x,z,29,0,15,42,3);break;
 case 21:h=8*(1-Math.exp(-1*((x+z*.65)/18)**2));break;
 case 22:h=hill(x,z,-24,16,21,20,6)+ridge(x,z,.4,29,10,3);break;
 case 23:h=4.5*Math.exp(-1*((r-29)/9)**2)+hill(x,z,27,-15,10,15,2);break;
 case 24:h=hill(x,z,-22,-20,20,24,7)+hill(x,z,25,22,17,20,5)+ridge(x,z,.7,30,11,3);break;
 case 25:h=plateau(x,z,-27,15,15,20,2)+plateau(x,z,27,15,15,20,3);break;
 }
 // Smooth central staging area and a continuous, rounded transition at the perimeter.
 return h*smooth((r-5)/9)*smooth((54-Math.max(Math.abs(x),Math.abs(z)))/10);
}
const specs=[
 ['desert',0xc8d8de,0xc5a578,0xa78b67,0xf2c777,'basin','Sand dunes and a sunken central basin'],
 ['forest',0xa4c2d1,0x496c43,0x73866b,0xa8dc93,'pines','A sloping pine ridge and wooded hills'],
 ['industrial',0xaebcc4,0x5c6670,0x78818b,0xffad66,'cranes','Raised loading yards and iron gantries'],
 ['desert',0xebc0a0,0xb69b78,0xd9c3a1,0xffd571,'ruins','Ancient solar arches on rolling dunes'],
 ['forest',0x9dc4b7,0x427b5a,0x678878,0x72f2b0,'divide','Twin green banks and a winding low valley'],
 ['industrial',0x172b4d,0x465c78,0x8cabc6,0x73eaff,'depot','Starship berths, cargo docks and orbital rings'],
 ['desert',0xdbad89,0xaf7353,0xc88c61,0xffd083,'relay','Curving canyon walls and a relay dish'],
 ['forest',0x819eac,0x536d66,0x748e81,0xc3eddf,'mist','Misty knolls and towering mushrooms'],
 ['industrial',0x302946,0x575273,0x9184b2,0xb7a0ff,'reactor','A terraced ring around a quantum reactor'],
 ['desert',0xe0d3b4,0xc4ae83,0xe2ceb1,0x77e1e1,'station','Oasis dunes and a remote research station'],
 ['forest',0xa3c5bf,0x58896d,0x7a9580,0xa7e4c2,'bridge','A low crossing between lush raised banks'],
 ['industrial',0x372e48,0x514966,0x94819d,0xe2a1d3,'terminal','Terminal terraces under an eclipsed sky'],
 ['desert',0xccafa0,0xb77852,0xd49968,0xffbd84,'mesa','Two broad copper mesas with smooth approaches'],
 ['forest',0xc4e2ef,0xc3dae0,0xa9c5d2,0x85d6ff,'ice','Snowy ridges and a frozen comms relay'],
 ['industrial',0x73646a,0x5e5457,0x8d7167,0xff824c,'foundry','Ash slopes and a glowing furnace complex'],
 ['desert',0xe7c18a,0xc2944e,0xe2b56d,0xffe08a,'canyon','Golden canyon banks cut by a diagonal pass'],
 ['forest',0x9eb8a0,0x658050,0x96a57d,0xd9efa6,'citadel','A raised circular citadel with willow groves'],
 ['industrial',0x9fbecb,0x657d88,0x8ea4ad,0x73daef,'harbor','Steel quays, cranes and a distant harbor'],
 ['desert',0xceba99,0xb6a071,0xd7bb85,0xf7dca0,'fortress','A dune fortress with broad earthen ramps'],
 ['forest',0x99afa2,0x547458,0x809777,0xb4e293,'moss','Mossy ruins scattered over uneven green hills'],
 ['industrial',0x26374e,0x53657b,0x94a9bf,0x6ccaff,'hangar','A giant starfighter hangar and raised side decks'],
 ['desert',0xefb39e,0xae8473,0xd2a18e,0xffa7a0,'pass','A diagonal mountain pass in sunset colors'],
 ['forest',0x8babbc,0x4d6d65,0x78918d,0x88dce6,'rain','Rain-darkened hills and a communications outpost'],
 ['industrial',0x1e2440,0x77798b,0xb6b5c5,0xb6bfff,'vault','A lunar crater with a central vault complex'],
 ['forest',0x9bd9ec,0x729c69,0xa3b491,0x71eddb,'island','Battle royale island: hills, coast and scattered outposts'],
 ['industrial',0x243850,0x65778e,0xa6bbd2,0x66e9ff,'range','Dedicated firing lanes and two movement ramps']
];
export const arenaLooks=specs.map(([theme,sky,ground,cover,accent,landmark,description])=>({theme,sky,ground,cover,accent,landmark,description}));
