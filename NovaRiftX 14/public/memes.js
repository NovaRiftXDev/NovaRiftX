// Stable IDs keep existing room toggles compatible with the updated effects.
const shapes=[
 ['Big brain time','Stretch the squad upward'],['Smol bean','Shrink everyone to half size'],
 ['Longcat','Tall, narrow internet-cat proportions'],['Flat Stanley','Squash everyone into pancakes'],
 ['Wide walking','Extra-wide squad silhouettes'],['Slenderman stretch','Thin, stretched silhouettes'],
 ['Gigachad squad','Make everyone tower over the arena'],['Ant-Man moment','Pocket-sized combatants'],
 ['Built different','Wide shoulders and a taller stance'],['Absolute unit','Round, chunky proportions']
];
const motions=[
 ['Pedro raccoon spin','Everyone spins like a looping dance clip'],['NPC livestream','Jerky stop-and-go head tilts'],
 ['Yippee!','Excited little victory hops'],['Rickroll','Side-step and sway across the arena'],
 ['Assert dominance','T-pose-inspired sideways lean'],['Griddy shuffle','Alternating shoulder dips and bouncy steps'],
 ['Smooth Criminal','Impossible forward lean'],['Helicopter helicopter','Fast spinning squad'],
 ['Wednesday dance','Sharp shoulder and head movements'],['Coffin dance','Synchronized swaying and bouncing']
];
const hats=[
 ['Doge','🐕','Much wow: dog icons above the squad'],['Bananacat','🍌','Banana hats for the whole squad'],
 ['Let him cook','👨‍🍳','Chef hats over every combatant'],['Clown moment','🤡','Clown faces over the squad'],
 ['Frog squad','🐸','Frog icons above everyone'],['Keyboard Cat','🎹','Floating keyboards over every combatant'],
 ['Among Us sus','👽','Suspicious visitors above the squad'],['Skibidi squad','🚽','Floating toilet icons'],
 ['Chipi chipi cat','🐱','Dancing-cat party hats'],['Deal with it','😎','Cool shades for every combatant']
];
const rain=[
 ['W chat','W','The arena showers everyone with Ws'],['Bruh moment','BRUH','Falling BRUH reactions'],
 ['Emotional damage','💔','Broken-heart reaction rain'],['Rizz overload','💖','Heart reactions everywhere'],
 ['F in the chat','F','Falling Fs pay their respects'],['Nyan Cat rain','🌈','Rainbow showers across the screen'],
 ['Vine boom energy','💥','Comic explosion icons rain down'],['No thoughts, head empty','🧠','Brain emoji shower'],
 ['Bombastic side eye','👀','An arena full of watching eyes'],['Certified cinema','🎬','Movie-clapper reaction rain']
];
const filters=[
 ['To be continued','sepia(1)','Sepia freeze-frame-style grading'],
 ['Nyan rainbow vision','hue-rotate(60deg)','Rainbow-tinted arena colors'],
 ['Caught in 4K: blue edition','hue-rotate(180deg)','Cold hue-shifted video grading'],
 ['Galaxy brain vision','hue-rotate(260deg)','Cosmic purple color shift'],
 ['Shrek swamp vision','hue-rotate(90deg)','Green swamp color shift'],
 ['Deep-fried meme','saturate(2) contrast(1.25)','Crunchy, oversaturated meme colors'],
 ['Dramatic flashback','saturate(.5) brightness(1.2)','Washed-out flashback colors'],
 ['Main character energy','saturate(1.8)','Bold, saturated highlight-reel colors'],
 ['Sad violin moment','grayscale(1)','Black-and-white dramatic colors'],
 ['This is fine','sepia(.7) saturate(1.8)','Warm orange comic-style grading']
];
export const memeControls=[
 ...shapes.map(([label,description],index)=>({id:'mshape'+index,label,description,group:'shape',index})),
 ...motions.map(([label,description],index)=>({id:'mmotion'+index,label,description,group:'motion',index})),
 ...hats.map(([label,symbol,description],index)=>({id:'mhat'+index,label,symbol,description,group:'hat',index})),
 ...rain.map(([label,symbol,description],index)=>({id:'mrain'+index,label,symbol,description,group:'rain',index})),
 ...filters.map(([label,value,description],index)=>({id:'mfilter'+index,label,value,description,group:'filter',index}))
].map(c=>({...c,kind:'toggle',description:c.description+' · cosmetic only'}));
