// Run directly with Node. This is a repeatable CPU benchmark, not a timing test.
import {performance} from 'node:perf_hooks';
import {roomLayout} from '../public/building.js';
import {blocked,supportHeight,coverDistance} from '../public/shared.js';

function room(count){return {map:25,builds:Array.from({length:count},(_,i)=>({id:i+1,kind:['wall','floor','ramp','cone'][i%4],x:(i%10-4.5)*8,z:(Math.floor(i/10)%10-4.5)*8,y:Math.floor(i/100)*3,turn:i%4,edit:0}))};}
function tick(r,frame){
 let checksum=0;
 for(let i=0;i<24;i++){
  const a=i*.73+frame*.01,x=Math.sin(a)*32,z=Math.cos(a)*32;
  checksum+=Number(blocked(x,z,.45,roomLayout(r),3));
  checksum+=Number(blocked(x+.12,z,.45,roomLayout(r),3));
  checksum+=supportHeight(x,z,3,roomLayout(r));
 }
 for(let i=0;i<8;i++){
  const a=i*.7+frame*.03,d=[Math.sin(a),0,Math.cos(a)];
  checksum+=Math.min(150,coverDistance([0,1.5,0],d,roomLayout(r)));
 }
 return checksum;
}
const result=[];
for(const count of [0,100,200]){
 const r=room(count);for(let f=0;f<3;f++)tick(r,f);
 const samples=[];let checksum=0;
 for(let run=0;run<3;run++){const start=performance.now();for(let f=0;f<15;f++)checksum+=tick(r,f);samples.push((performance.now()-start)/15);}
 samples.sort((a,b)=>a-b);
 result.push({builds:count,collisionBoxes:roomLayout(r).length,medianMsPerTick:Number(samples[1].toFixed(3)),checksum:Number(checksum.toFixed(3))});
}
console.log(JSON.stringify(result,null,2));
