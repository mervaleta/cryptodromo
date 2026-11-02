import { TOKEN_ROSTER } from '/race-lab/source/src/data/tokenRoster.js';
const labels={star:'Estrella',core:'Principal',challenger:'Desafiante'};
const descriptions={star:'Los protagonistas más frecuentes del fixture, mezclados con el resto del plantel en cada carrera.',core:'El núcleo del plantel. Cuatro corredores de esta categoría participan en cada carrera.',challenger:'Nuevos rivales en cada largada. Cuatro desafiantes comparten la pista con estrellas y principales.'};
const $=s=>document.querySelector(s);
let tier='all', selected=TOKEN_ROSTER.find(t=>t.symbol===location.hash.slice(1))||TOKEN_ROSTER[0], preview;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
function select(token,scroll=false){
 selected=token;
 $('#horse-tier').textContent=labels[token.tier].toUpperCase();$('#horse-symbol').textContent=token.symbol;$('#horse-name').textContent=token.name;
 $('#horse-number').textContent=`${String(TOKEN_ROSTER.indexOf(token)+1).padStart(2,'0')} / ${TOKEN_ROSTER.length}`;
 $('#horse-description').textContent=descriptions[token.tier];
 for(const [key,value] of [['color',token.color],['coat',token.coat]]){$(`#horse-${key}`).textContent=value.toUpperCase();$(`#${key}-swatch`).style.background=value;}
 document.querySelectorAll('.runner').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.symbol===token.symbol)));
 $('#horse-canvas').setAttribute('aria-label',`Caballo de ${token.name}, color de carrera ${token.color}, pelaje ${token.coat}`);
 preview?.select(token);if(!$('#preview-fallback').hidden)fallback(token);history.replaceState(null,'',`#${token.symbol}`);
 if(scroll)document.querySelector('.feature').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function render(){
 const query=$('#search').value.trim().toLocaleLowerCase();
 const tokens=TOKEN_ROSTER.filter(t=>(tier==='all'||t.tier===tier)&&`${t.symbol} ${t.name}`.toLocaleLowerCase().includes(query));
 const order=$('#sort').value;if(order!=='roster')tokens.sort((a,b)=>a[order].localeCompare(b[order]));
 $('#grid').replaceChildren(...tokens.map(t=>{
 const button=document.createElement('button');button.type='button';button.className='runner';button.dataset.symbol=t.symbol;
 button.setAttribute('aria-pressed',String(t.symbol===selected.symbol));button.setAttribute('aria-label',`Ver caballo de ${t.name} (${t.symbol})`);
 button.innerHTML=`<div class="card-top"><span>${String(TOKEN_ROSTER.indexOf(t)+1).padStart(2,'0')}</span><span class="token-dot" style="background:${t.color}"></span></div><h3>${t.symbol}</h3><p>${t.name}</p><div class="card-bottom"><span class="${t.tier==='star'?'star-label':''}">${labels[t.tier]}</span><span class="mini-swatches" aria-hidden="true"><i style="background:${t.color}"></i><i style="background:${t.coat}"></i></span><span aria-hidden="true">↗</span></div>`;
 button.addEventListener('click',()=>select(t,true));return button;
 }));
 $('#result-count').textContent=`${tokens.length} de ${TOKEN_ROSTER.length} corredores`;
 $('#empty').hidden=tokens.length>0;
}
$('.filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tier=b.dataset.tier;document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);
$('#clear').addEventListener('click',()=>{$('#search').value='';tier='all';document.querySelectorAll('.filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tier==='all')));render();$('#search').focus();});
function motion(){ $('#motion').textContent=paused?'Reanudar galope':'Pausar galope';$('#motion').setAttribute('aria-pressed',String(!paused));preview?.pause(paused); }
$('#motion').addEventListener('click',()=>{paused=!paused;motion();});
window.addEventListener('hashchange',()=>{const t=TOKEN_ROSTER.find(t=>t.symbol===location.hash.slice(1));if(t)select(t);});
render();select(selected);motion();
function fallback(token){
 $('#preview-fallback').innerHTML=`<svg viewBox="0 0 480 300" role="img" aria-label="Vista 2D del caballo ${token.symbol}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="233" cy="264" rx="158" ry="13" fill="#07140c" opacity=".45"/><g fill="${token.coat}" stroke="#302b27" stroke-width="2" stroke-linejoin="round"><path d="M125 152 Q85 130 68 174 L54 207 68 200 Q90 157 120 173Z" fill="#29251f"/><path d="M137 177 L137 215 112 257 124 260 158 217 166 180Z"/><path d="M253 174 L267 213 300 254 312 251 286 204 281 165Z"/><path d="M149 174 L160 218 147 260 160 263 182 216 181 172Z"/><path d="M240 172 L232 216 253 260 266 257 253 213 268 173Z"/><path d="M114 155 Q120 118 169 118 L241 123 276 82 287 56 304 48 322 71 355 93 349 110 321 109 294 98 282 149 Q281 178 248 186 L157 183 Q121 182 114 155Z"/><path d="M287 60 L282 28 297 50 303 25 312 57Z"/><path d="M285 61 L273 77 258 109 249 131 262 134 284 88 294 66Z" fill="#26231f"/><path d="M165 124 L224 126 224 160 169 157Z" fill="${token.color}" stroke="#efeddb" stroke-width="3"/><path d="M326 86 L320 105" stroke="#d6bd8e" stroke-width="4"/><path d="M295 88 L237 130" fill="none" stroke="#29251f" stroke-width="3"/><circle cx="317" cy="77" r="3" fill="#070e08"/><path d="M147 260 L162 260 164 266 144 266Z M252 258 L266 256 270 263 252 266Z M111 257 L124 258 126 265 107 264Z M299 252 L313 250 318 257 300 260Z" fill="#211e19"/></g><text x="195" y="147" font-family="Arial" font-weight="bold" font-size="13" fill="#fff" stroke="#000" stroke-width=".3" text-anchor="middle">${token.symbol}</text></svg>`;
}
// The directory remains usable when WebGL or the external Three.js module is unavailable.
import('./horse-preview.js').then(({createPreview})=>{preview=createPreview($('#horse-canvas'));preview.select(selected);preview.pause(paused);$('#preview-state').textContent='3D · COLORES DE CARRERA';}).catch(()=>{$('#preview-state').textContent='VISTA 3D NO DISPONIBLE';$('#preview-fallback').hidden=false;$('#horse-canvas').hidden=true;$('#motion').hidden=true;$('#preview-state').textContent='VISTA 2D · COMPATIBILIDAD';fallback(selected);});
