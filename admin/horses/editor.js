import {TOKEN_ROSTER} from '/race-lab/source/src/data/tokenRoster.js';

const $=id=>document.getElementById(id);
const form=$('horse-form');
const appearanceNames={raceColor:'Color del token',coatColor:'Pelaje',muzzleColor:'Hocico',maneColor:'Crin',tailColor:'Cola',hoofColor:'Pezuñas',eyeColor:'Ojos',legsColor:'Patas',bridleColor:'Cabezada'};
const appearanceDefaults={muzzleColor:'#a07463',maneColor:'#45312c',tailColor:'#45312c',hoofColor:'#242424',eyeColor:'#2a1714',legsColor:'#62453b',bridleColor:'#d6c5a0'};
const roster=new Map(TOKEN_ROSTER.map(token=>[token.symbol,token]));
const state={revision:0,publishedRevision:0,drafts:{},published:{},csrf:'',selected:'BTC',dirty:false,busy:true,master:null,frame:0,logoId:null};
const symbols=TOKEN_ROSTER.map(t=>t.symbol);
const layers=['legs','coat','shade','maneDark','mane','hoof','gear','ink'];
const svgNS='http://www.w3.org/2000/svg';
const shapeNodes=new Map();

function notify(message,kind=''){$('message').textContent=message;$('message').className='notice '+kind;}
function setBusy(value){state.busy=value;for(const id of ['save','publish','reset','upload-logo','remove-logo'])$(id).disabled=value;}
function blank(token){return {
  name:token.name,nickname:'',tagline:'',biography:'',networks:[],logoId:null,
  links:{website:'',x:'',telegram:'',discord:''},
  appearance:{raceColor:token.color,coatColor:token.coat, ...appearanceDefaults,
    appearanceMode:'brand_colored',maneStyle:'medium',tailStyle:'medium',maneScale:1,tailScale:1}
};}
function profileFor(symbol){return structuredClone(state.drafts[symbol]||state.published[symbol]||blank(roster.get(symbol)));}
function labelFor(t){return ({star:'Estrella',core:'Principal',challenger:'Desafiante'})[t.tier]||t.tier;}
function renderRoster(){const q=$('search').value.trim().toLocaleLowerCase();const tier=$('tier').value;const items=TOKEN_ROSTER.filter(t=>(tier==='all'||tier===t.tier)&&`${t.name} ${t.symbol}`.toLocaleLowerCase().includes(q));$('counts').textContent=`${items.length} / ${TOKEN_ROSTER.length}`;
 const fragment=document.createDocumentFragment();items.forEach(token=>{const b=document.createElement('button');b.type='button';b.className='runner'+(token.symbol===state.selected?' selected':'');b.setAttribute('role','listitem');b.setAttribute('aria-current',token.symbol===state.selected?'true':'false');b.dataset.symbol=token.symbol;
 const ordinal=document.createElement('span');ordinal.className='ordinal';ordinal.textContent=String(symbols.indexOf(token.symbol)+1).padStart(2,'0');
 const dot=document.createElement('span');dot.className='dot';dot.style.background=state.published[token.symbol]?.appearance?.raceColor||token.color;
 const name=document.createElement('span');name.className='symbol';name.textContent=token.symbol;
 const details=document.createElement('span');details.className='runner-info';details.textContent=(state.drafts[token.symbol]||state.published[token.symbol])?.name||token.name;
 if(state.drafts[token.symbol]){const badge=document.createElement('span');badge.className='changed';badge.textContent='●';badge.title='Tiene ficha editada';name.append(badge)}
 b.append(ordinal,dot,name,details);b.addEventListener('click',()=>choose(token.symbol));fragment.append(b);});$('roster').replaceChildren(fragment);
}
function normalizeHex(value){const text=String(value).trim().toUpperCase();return /^#?[A-F0-9]{6}$/.test(text)?('#'+text.replace(/^#/,'')):null;}
function addColorFields(){const fragment=document.createDocumentFragment();Object.entries(appearanceNames).forEach(([name,label])=>{
 const div=document.createElement('div');div.className='color-tile';
 const picker=document.createElement('input');picker.type='color';picker.name=name;picker.id='picker-'+name;picker.setAttribute('aria-label',label+' · selector visual');
 const group=document.createElement('div');group.className='color-group';
 const title=document.createElement('label');title.htmlFor='hex-'+name;title.textContent=label;
 const hex=document.createElement('input');hex.type='text';hex.id='hex-'+name;hex.className='hex-input';hex.autocomplete='off';hex.spellcheck=false;hex.maxLength=7;hex.required=true;hex.pattern='#?[a-fA-F0-9]{6}';hex.setAttribute('aria-label',label+' · código hexadecimal');hex.placeholder='#RRGGBB';
 picker.addEventListener('input',()=>{hex.value=picker.value.toUpperCase();hex.setCustomValidity('');markDirty();paint();});
 hex.addEventListener('input',()=>{const valid=normalizeHex(hex.value);hex.setCustomValidity(valid?'':'Ingresá exactamente seis dígitos hexadecimales.');if(valid){picker.value=valid;paint();}markDirty();});
 hex.addEventListener('blur',()=>{const valid=normalizeHex(hex.value);if(valid){hex.value=valid;hex.setCustomValidity('');paint();}});
 group.append(title,hex);div.append(picker,group);fragment.append(div);
 });$('color-fields').append(fragment);}

function addNetwork(row={name:'',contract:'',explorer:''}){if($('network-list').children.length>=12){notify('Máximo 12 redes por token','error');return;}const div=document.createElement('div');div.className='network-row';
 for(const [field,label] of [['name','Blockchain / red'],['contract','Contrato'],['explorer','Explorador (URL)']]){const el=document.createElement('label');if(field==='explorer')el.className='explorer';el.textContent=label;const input=document.createElement('input');input.dataset.network=field;input.value=row[field]||'';input.maxLength=field==='name'?60:field==='contract'?130:350;if(field==='explorer')input.type='url';el.append(input);div.append(el);input.addEventListener('input',markDirty);}
 const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Quitar red');remove.addEventListener('click',()=>{div.remove();markDirty();});div.append(remove);$('network-list').append(div);
}
function populate(){const token=roster.get(state.selected);const data=profileFor(state.selected);$('logo-file').value='';form.elements.name.value=data.name||'';form.elements.nickname.value=data.nickname||'';form.elements.tagline.value=data.tagline||'';form.elements.biography.value=data.biography||'';
 for(const name of ['website','x','telegram','discord'])form.elements[name].value=data.links?.[name]||'';
 $('network-list').replaceChildren();(data.networks||[]).forEach(row=>addNetwork(row));
 for(const name of Object.keys(appearanceNames)){const value=normalizeHex(data.appearance?.[name]|| (name==='raceColor'?token.color:name==='coatColor'?token.coat:appearanceDefaults[name]))||'#000000';form.elements[name].value=value;const input=$('hex-'+name);input.value=value;input.setCustomValidity('');}
 form.elements.appearanceMode.value=data.appearance?.appearanceMode||'brand_colored';for(const name of ['maneStyle','tailStyle']){const length=data.appearance?.[name]||'medium';form.elements[name].value=['short','medium','long'].includes(length)?length:'medium';}
 for(const name of ['maneScale','tailScale'])form.elements[name].value=data.appearance?.[name]??1;
 $('maneScale-output').textContent=Number(form.elements.maneScale.value).toFixed(2)+'×';$('tailScale-output').textContent=Number(form.elements.tailScale.value).toFixed(2)+'×';
 $('selected-title').replaceChildren(document.createTextNode(token.symbol+' '));const span=document.createElement('span');span.textContent=token.name;$('selected-title').append(span);
 $('current-tier').textContent=labelFor(token).toUpperCase();$('current-publish').textContent=state.published[token.symbol]?'PUBLICADO':state.drafts[token.symbol]?'BORRADOR':'BASE';
 $('save-status').textContent=state.published[token.symbol]?'Perfil con versión pública':state.drafts[token.symbol]?'Borrador privado guardado':'Usando ficha base del plantel';state.logoId=data.logoId||null;state.dirty=false;updateLogo();paint();renderRoster();
 $('open-racer').href='/racers/#'+encodeURIComponent(token.symbol);
}
function collect(){const f=form.elements;return {
  name:f.name.value.trim(),nickname:f.nickname.value.trim(),tagline:f.tagline.value.trim(),biography:f.biography.value.trim(),
  logoId:state.logoId,networks:[...$('network-list').children].map(div=>Object.fromEntries([...div.querySelectorAll('[data-network]')].map(input=>[input.dataset.network,input.value.trim()]))),
  links:Object.fromEntries(['website','x','telegram','discord'].map(k=>[k,f[k].value.trim()])),
  appearance:{...Object.fromEntries(Object.keys(appearanceNames).map(k=>[k,normalizeHex($('hex-'+k).value)||f[k].value])),appearanceMode:f.appearanceMode.value,maneStyle:f.maneStyle.value,tailStyle:f.tailStyle.value,maneScale:Number(f.maneScale.value),tailScale:Number(f.tailScale.value)}
};}
function markDirty(){state.dirty=true;$('save-status').textContent='Cambios sin guardar';}
function updateLogo(){const image=$('logo-preview');image.hidden=!state.logoId;$('logo-placeholder').hidden=!!state.logoId;
 if(state.logoId){image.src='./logo.php?id='+encodeURIComponent(state.logoId);image.alt='Logo de '+state.selected;$('logo-status').textContent='Logo cargado · '+state.logoId.slice(0,12)+'…';}
 else{image.removeAttribute('src');$('logo-status').textContent='Sin logo personalizado';}
}
async function uploadLogo(){if(state.busy)return;const input=$('logo-file'),file=input.files?.[0];if(!file){notify('Elegí primero una imagen PNG, JPG o WebP.','error');return;}
 if(file.size>2*1024*1024||file.size===0){notify('El logo debe ocupar entre 1 byte y 2 MB.','error');return;}
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)){notify('Formato inválido. Solo PNG, JPG o WebP.','error');return;}
 const payload=new FormData();payload.append('logo',file);payload.append('csrf',state.csrf);payload.append('symbol',state.selected);
 setBusy(true);try{const response=await fetch('./logo-upload.php',{method:'POST',credentials:'same-origin',body:payload});const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'No se pudo cargar el logo');
 state.logoId=result.logoId;markDirty();updateLogo();notify('Logo cargado en almacenamiento privado. Guardá el borrador o publicá la ficha para asociarlo al caballo.','good');input.value='';
 }catch(error){notify('Error cargando logo: '+error.message,'error');}finally{setBusy(false);}}

function choose(symbol){if(state.busy||symbol===state.selected)return;if(state.dirty&&!confirm('Tenés cambios sin guardar. ¿Cambiar de caballo y descartarlos?'))return;state.selected=symbol;populate();location.hash=encodeURIComponent(symbol);}
function paint(){const token=roster.get(state.selected);if(!token)return;const data=collect();const a=data.appearance;const coat=a.appearanceMode==='brand_colored'?a.raceColor:a.coatColor;
 const fills={coat,shade:darken(coat,.73),legs:a.legsColor,mane:a.maneColor,maneDark:darken(a.maneColor,.55),hoof:a.hoofColor,gear:a.bridleColor,ink:'#17201c'};
 for(const [name,path] of shapeNodes)path.setAttribute('fill',fills[name]||'#fff');$('preview-symbol').textContent=state.selected;$('preview-name').textContent=data.name||token.name;$('preview-tagline').textContent=data.tagline||data.nickname||labelFor(token);$('preview-color').style.background=a.raceColor;
 $('horse-svg').setAttribute('aria-label',`Caballo ${state.selected}: pelaje ${coat}, crin ${a.maneColor}, pezuñas ${a.hoofColor}`);
}
function darken(hex,mult){const value=String(hex).replace('#','');return '#'+[0,2,4].map(i=>Math.round(parseInt(value.slice(i,i+2),16)*mult).toString(16).padStart(2,'0')).join('');}
async function loadMaster(){try{const response=await fetch('/racers/horse-master.v1.json',{cache:'force-cache'});if(!response.ok)throw Error(String(response.status));const master=await response.json();if(!Array.isArray(master.frames)||master.frames.length!==12)throw Error('12 poses no disponibles');state.master=master;const svg=$('horse-svg');for(const key of layers){const node=document.createElementNS(svgNS,'path');node.setAttribute('stroke','none');shapeNodes.set(key,node);svg.append(node);}drawFrame(0);paint();}
 catch(error){notify('No se pudo cargar la vista vectorial; la edición de datos sigue disponible.','error');}}
function drawFrame(index){if(!state.master)return;const p=state.master.frames[index]?.paths||{};for(const [key,path] of shapeNodes)path.setAttribute('d',p[key]||'');}
let last=0;function animate(timestamp){if(!document.hidden&&state.master&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&timestamp-last>1000/12){state.frame=(state.frame+1)%12;drawFrame(state.frame);last=timestamp;}requestAnimationFrame(animate);}requestAnimationFrame(animate);
async function load(){setBusy(true);try{const response=await fetch('./api.php',{cache:'no-store',credentials:'same-origin'});const payload=await response.json();if(!response.ok||!payload.ok)throw Error(payload.error||'No se pudo abrir el editor');if(payload.schema!=='cryptodromo-horses-v1'||!Array.isArray(payload.symbols)||payload.symbols.length!==100||!payload.symbols.every(x=>roster.has(x)))throw Error('Catálogo del editor y del sitio no coincide');
 Object.assign(state,{csrf:payload.csrf,revision:payload.revision,publishedRevision:payload.publishedRevision,drafts:payload.drafts,published:payload.published});
 const target=decodeURIComponent(location.hash.slice(1));state.selected=roster.has(target)?target:'BTC';populate();$('revision').textContent=`Revisión: ${state.revision} · publicada: ${state.publishedRevision}`;notify('Editor privado conectado. Los cambios se guardan por caballo.','good');}
 catch(error){notify('ERROR: '+error.message,'error');}finally{setBusy(false);}}
async function commit(action){if(state.busy)return;let profile=null;
 if(action!=='reset'){if(!form.reportValidity())return;profile=collect();if(!profile.name){notify('El nombre del caballo es obligatorio','error');return;}}
 if(action==='publish'&&!confirm(`¿Publicar la ficha de ${state.selected}? Quedará disponible en la API pública de caballos.`))return;
 if(action==='reset'&&!confirm(`¿Restaurar el perfil original de ${state.selected}? Se eliminarán su borrador y su personalización publicada.`))return;
 setBusy(true);const symbol=state.selected;
 try{const response=await fetch('./api.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:state.csrf,revision:state.revision,action,symbol,...(profile?{profile}:{})})});
 const payload=await response.json();if(!response.ok||!payload.ok)throw Error(payload.error||'No se pudo guardar');Object.assign(state,{revision:payload.revision,publishedRevision:payload.publishedRevision,drafts:payload.drafts,published:payload.published});state.dirty=false;populate();$('revision').textContent=`Revisión: ${state.revision} · publicada: ${state.publishedRevision}`;notify(action==='publish'?`${symbol} publicado. La ficha es accesible desde la API pública.`:action==='reset'?`${symbol} restaurado a la ficha original.`:`Borrador privado de ${symbol} guardado. No publicado.`,'good');}
 catch(error){notify('No se guardó: '+error.message,'error');if(error.message.includes('Conflicto'))notify('Conflicto de edición. Recargá antes de volver a guardar.','error');}
 finally{setBusy(false);}}

addColorFields();$('upload-logo').addEventListener('click',uploadLogo);$('remove-logo').addEventListener('click',()=>{if(!state.logoId)return;state.logoId=null;updateLogo();markDirty();});form.addEventListener('input',event=>{if(event.target.classList.contains('hex-input'))return;if(event.target.type!=='color')markDirty();if(event.target.type==='range')$(`${event.target.name}-output`).textContent=Number(event.target.value).toFixed(2)+'×';paint();});
form.addEventListener('change',event=>{if(event.target.classList.contains('hex-input'))return;markDirty();paint();});form.addEventListener('submit',e=>{e.preventDefault();commit('save');});$('publish').addEventListener('click',()=>commit('publish'));$('reset').addEventListener('click',()=>commit('reset'));$('add-network').addEventListener('click',()=>{addNetwork();markDirty();});$('search').addEventListener('input',renderRoster);$('tier').addEventListener('change',renderRoster);
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{const chosen=button.dataset.tab;for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));}for(const panel of document.querySelectorAll('[data-panel]'))panel.hidden=panel.dataset.panel!==chosen;}));
window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
loadMaster();load();
