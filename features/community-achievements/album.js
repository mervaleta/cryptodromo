/**
 * Cryptódromo Community Album
 * Mounts a read-only badge album from trusted API JSON; never grants achievements.
 * Usage: renderBadgeAlbum(document.querySelector('#badge-album'), payload)
 * payload: { badges:[{code,title,description,category,rarity,icon_key,unlocked,progress,target_count,showcase_slot}], handle, display_name }
 */
const ICONS=Object.freeze({
 horseshoe:'♞',ticket:'◈',grandstand:'▥',finish:'⚑',film:'▣',
 horse:'♘',book:'▤',cloud:'☁',profile:'◉',heart:'♥',
 gallery:'✦',megaphone:'♫',star:'★',calendar:'▦'
});
const RARITIES=new Set(['common','uncommon','rare','legendary']);
export function renderBadgeAlbum(root,payload){
 if(!(root instanceof Element))throw new TypeError('Contenedor inválido');
 root.replaceChildren();
 const badges=Array.isArray(payload?.badges)?payload.badges:[];
 const heading=document.createElement('div');heading.className='crp-album-heading';
 const title=document.createElement('h2');title.textContent='Mi álbum de insignias';
 const summary=document.createElement('span');
 const owned=badges.filter(b=>b.unlocked).length;
 summary.textContent=owned+' / '+badges.length+' desbloqueadas';
 heading.append(title,summary);root.append(heading);
 const showcase=document.createElement('section');showcase.className='crp-showcase';
 const showcaseTitle=document.createElement('h3');showcaseTitle.textContent='Vitrina';
 showcase.append(showcaseTitle);
 const displayed=badges.filter(b=>b.unlocked&&Number.isInteger(b.showcase_slot)&&b.showcase_slot>=1&&b.showcase_slot<=3).sort((a,b)=>a.showcase_slot-b.showcase_slot);
 const showcaseList=document.createElement('div');showcaseList.className='crp-showcase-list';
 for(const badge of displayed)showcaseList.append(createBadge(badge));
 if(!displayed.length){const p=document.createElement('p');p.textContent='Todavía no elegiste insignias para exhibir.';showcaseList.append(p);}
 showcase.append(showcaseList);root.append(showcase);
 const grid=document.createElement('div');grid.className='crp-badge-grid';
 for(const badge of badges)grid.append(createBadge(badge));
 root.append(grid);
}
function createBadge(b){
 const article=document.createElement('article');article.className='crp-badge';
 if(!b.unlocked)article.classList.add('is-locked');
 article.dataset.rarity=RARITIES.has(b.rarity)?b.rarity:'common';
 const icon=document.createElement('div');icon.className='crp-badge-icon';
 icon.textContent=b.unlocked?(ICONS[b.icon_key]||'✧'):'◇';
 const title=document.createElement('h4');title.textContent=String(b.title||'Insignia');
 const desc=document.createElement('p');desc.textContent=String(b.description||'');
 const foot=document.createElement('small');
 const target=Math.max(1,Number(b.target_count)||1),progress=Math.min(target,Math.max(0,Number(b.progress)||0));
 foot.textContent=b.unlocked?'CONSEGUIDA':progress+' / '+target;
 article.append(icon,title,desc,foot);return article;
}
