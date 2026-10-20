import * as T from '/vendor/three.module.js';
import {buildBoxes,buildPlacement,buildPoint,buildTurn,editMask,validEdit} from './building.js';
import {rayBox} from './shared.js';
import {createBuildRenderer,buildRenderGeometry} from './build-renderer.js';
export function buildingControls(scene,getState,getId,send){
 let enabled=false,kind='wall',rotation=0,ghostKey='',editing=null,dragging=false,paintValue=true,painted=new Set(),statusUntil=0;
 const renderedBuilds=createBuildRenderer(scene);
 const hint=document.createElement('div');hint.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);color:white;background:#102035dd;border-radius:12px;padding:8px;font:12px sans-serif;pointer-events:none;z-index:20';hint.hidden=true;document.body.append(hint);
 const ghost=new T.Group(),editGrid=new T.Group();scene.add(ghost,editGrid);
 function material(preview=false){return new T.MeshStandardMaterial({color:preview?0x77e6ff:0x567c9c,metalness:.38,roughness:.48,transparent:preview,opacity:preview?.35:1,side:T.DoubleSide});}
 function mesh(b,preview=false){
  const g=new T.Group(),m=new T.Mesh(buildRenderGeometry(b),material(preview));m.castShadow=!preview;m.receiveShadow=true;g.add(m);
  return g;
 }
 function dispose(g){const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const x of geometries)x.dispose();for(const x of materials)x.dispose();g.removeFromParent();}
 function clear(g){for(const child of [...g.children])dispose(child);}
 function player(){return getState()?.players.find(p=>p.id===getId());}
 function ray(){const p=player();if(!p)return null;return {o:[p.x,p.y+1.55,p.z],d:[-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)]};}
 function aim(){const s=getState(),p=player(),r=ray();if(!p||!r)return null;return (s.builds||[]).filter(b=>b.owner===p.id).map(b=>({b,t:Math.min(...buildBoxes(b).map(([x,z,w,hz,h,y])=>rayBox(r.o,r.d,[x-w/2,y,z-hz/2],[x+w/2,y+h,z+hz/2])))})).filter(q=>q.t<12).sort((a,b)=>a.t-b.t)[0]?.b;}
 function message(text){hint.textContent=text;statusUntil=performance.now()+1800;}
 function cellAtAim(){
  const r=ray();if(!editing||!r)return -1;const b=editing.build,a=buildTurn(b)*Math.PI/2,c=Math.round(Math.cos(a)),s=Math.round(Math.sin(a));
  const ox=r.o[0]-b.x,oz=r.o[2]-b.z,ou=c*ox-s*oz,ov=-s*ox-c*oz,du=c*r.d[0]-s*r.d[2],dv=-s*r.d[0]-c*r.d[2];
  let t,u,v;
  if(b.kind==='wall'){
   if(Math.abs(dv)<1e-6)return -1;t=-ov/dv;u=ou+du*t;v=r.o[1]+r.d[1]*t-b.y;
   if(t<0||t>14||u<=-2||u>=2||v<0||v>=3)return -1;
   return (2-Math.floor(v))*3+Math.floor((u+2)/(4/3));
  }
  // Edit ramp tiles directly on its sloping surface. Floor/cone use a flat blueprint.
  const slope=b.kind==='ramp'?.75:0,denom=r.d[1]-slope*dv;
  if(Math.abs(denom)<1e-6)return -1;t=(b.y+(b.kind==='ramp'?1.5:.06)+slope*ov-r.o[1])/denom;u=ou+du*t;v=ov+dv*t;
  if(t<0||t>14||u<=-2||u>=2||v<=-2||v>=2)return -1;
  return (v>=0?0:2)+(u>=0?1:0);
 }
 function drawEditGrid(){
  clear(editGrid);if(!editing)return;const b=editing.build,wall=b.kind==='wall',count=wall?9:4;
  for(let i=0;i<count;i++){
   const selected=!!(editing.mask&(1<<i)),hover=i===editing.hover;
   const color=hover?0xffdf85:selected?0x9eb4c8:0x38a3ff;
   const geometry=new T.BufferGeometry();let points;
   if(wall){const col=i%3,row=Math.floor(i/3),u=-2+col*4/3+.035,top=3-row-.035,low=2-row+.035,front=editing.face*.145;points=[[u,front,low],[u+4/3-.07,front,low],[u+4/3-.07,front,top],[u,front,top]];}
   else {const u=i%2?0:-2,v=i<2?0:-2,height=(x,z)=>b.kind==='ramp'?(z+2)*.75+.04:.06;points=[[u+.035,v+.035,height(u,v+.035)],[u+1.965,v+.035,height(u+2,v+.035)],[u+1.965,v+1.965,height(u+2,v+1.965)],[u+.035,v+1.965,height(u,v+1.965)]];}
   const positions=[...buildPoint(b,...points[0]),...buildPoint(b,...points[1]),...buildPoint(b,...points[2]),...buildPoint(b,...points[0]),...buildPoint(b,...points[2]),...buildPoint(b,...points[3])];
   geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
   const tile=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:selected?.2:hover?.8:.58,side:T.DoubleSide,depthTest:false,depthWrite:false}));tile.renderOrder=30;editGrid.add(tile);
   const border=new T.LineSegments(new T.EdgesGeometry(geometry),new T.LineBasicMaterial({color:hover?0xffffff:0xc5e7ff,transparent:true,opacity:.9,depthTest:false}));border.renderOrder=31;editGrid.add(border);
  }
 }
 function beginEdit(b){const p=player(),a=buildTurn(b)*Math.PI/2;editing={build:{...b},mask:editMask(b),hover:-1,face:Math.sign(-Math.sin(a)*(p.x-b.x)-Math.cos(a)*(p.z-b.z))||1};dragging=false;painted.clear();drawEditGrid();}
 function finishEdit(confirm){if(confirm&&editing){if(!validEdit(editing.build.kind,editing.mask)){message('Keep at least one tile, then press G.');return;}send({type:'build',action:'edit',id:editing.build.id,edit:editing.mask,turn:buildTurn(editing.build)});}editing=null;dragging=false;clear(editGrid);}
 function paint(){const cell=cellAtAim();if(cell<0||painted.has(cell)||!editing)return;painted.add(cell);if(paintValue)editing.mask|=1<<cell;else editing.mask&=~(1<<cell);drawEditGrid();}
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 document.addEventListener('keydown',e=>{
  if(!document.pointerLockElement)return;
  if(editing){
   if(e.code==='KeyG'&&!e.repeat){finishEdit(true);consume(e);return;}
   if(e.code==='Escape'||e.code==='KeyB'){finishEdit(false);consume(e);return;}
   if(e.code==='KeyR'&&!e.repeat){if(editing.build.kind!=='wall'){editing.build.turn=(buildTurn(editing.build)+1)%4;drawEditGrid();}consume(e);return;}
  }
  if(e.code==='KeyB'&&!e.repeat){enabled=!enabled;consume(e);return;}
  if(enabled&&['KeyZ','KeyX','KeyT','KeyY'].includes(e.code)){kind={KeyZ:'wall',KeyX:'floor',KeyT:'ramp',KeyY:'cone'}[e.code];consume(e);return;}
  if(enabled&&e.code==='KeyR'&&!e.repeat){rotation=(rotation+1)%4;consume(e);return;}
  if(['KeyG','Delete','Backspace'].includes(e.code)&&!e.repeat){const b=aim();if(b){if(e.code==='KeyG')beginEdit(b);else send({type:'build',action:'remove',id:b.id});consume(e);}}
 },true);
 document.addEventListener('mousedown',e=>{
  if(!document.pointerLockElement)return;
  if(editing){consume(e);if(e.button===2){editing.mask=0;drawEditGrid();}else if(e.button===0){const cell=cellAtAim();paintValue=cell<0||!(editing.mask&(1<<cell));dragging=true;painted.clear();paint();}return;}
  if(enabled){consume(e);if(e.button===0)send({type:'build',kind,rotation});}
 },true);
 document.addEventListener('mouseup',()=>{dragging=false;painted.clear();},true);
 document.addEventListener('contextmenu',e=>{if(editing||enabled)consume(e);},true);
 document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)finishEdit(false);});
 return {get active(){return enabled||!!editing;},get editing(){return !!editing;},update(){const s=getState(),p=player();hint.hidden=!p||!document.pointerLockElement;
 if(performance.now()>statusUntil)hint.textContent=editing?`EDIT ${editing.build.kind.toUpperCase()} · Aim + drag to cut tiles · G confirm · Right click reset · R rotate · B cancel`:enabled?`BUILD ${kind.toUpperCase()} · Click place · Z wall · X floor · T ramp · Y cone · R rotate · G edit · Delete remove · B exit`:'B build · G edit your build · double-tap and hold W sprint · C slide';
 renderedBuilds.sync(s?.builds);
 if(editing){if(!s?.builds?.some(b=>b.id===editing.build.id)||!p||p.hp<=0)finishEdit(false);else {const hovered=cellAtAim();if(hovered!==editing.hover){editing.hover=hovered;drawEditGrid();}if(dragging)paint();}}
 if(enabled&&!editing&&p&&document.pointerLockElement){const b=buildPlacement(p,s.map,kind,rotation),key=JSON.stringify(b);if(key!==ghostKey){clear(ghost);ghost.add(mesh(b,true));ghostKey=key;}ghost.visible=true;}else ghost.visible=false;
 },result:message};
}
