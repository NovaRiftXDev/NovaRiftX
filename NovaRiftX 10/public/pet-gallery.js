import {catalog} from './catalog.js';
import {cosmeticPreview} from './cosmetic-preview.js';
for(const item of catalog.filter(i=>i.slot==='pet')){const card=document.createElement('article'),image=document.createElement('img'),title=document.createElement('h2');image.src=cosmeticPreview(item);image.alt=item.name;title.textContent=item.name;card.append(image,title);document.querySelector('#gallery').append(card);}
