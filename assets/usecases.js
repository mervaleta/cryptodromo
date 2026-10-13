(function (root) {
'use strict';
const VERSION = 'rng-uc-sha256-v1';
const SOURCE = 'https://cryptodromo.com/market-data/v1/index.php?action=snapshot&at=2026-10-05T00:00:00Z';
const SNAPSHOT = Object.freeze({ticker:'CRYPTO:BTC', currency:'USD',price:'100.00000000',time:'2026-10-05T00:00:00Z',simulation:true});
function canonical(value) {
 if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
 if(value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
 return JSON.stringify(value);
}
async function sha256(text) {
 if(!root.crypto || !root.crypto.subtle) throw Error('Se requiere HTTPS o localhost y Web Crypto.');
 const bytes = await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
function generator(seed, domain) {
 let counter=0;
 return async function range(size) {
  if(!Number.isInteger(size)||size<1||size>4294967296) throw Error('Rango inválido');
  const limit=Math.floor(4294967296/size)*size;
  for(;;) {
   const hash=await sha256(VERSION+':'+domain+':'+seed+':'+counter++);
   const word=parseInt(hash.slice(0,8),16);
   if(word<limit) return word%size;
  }
 };
}
function validate(kind,p) {
 if(!p || typeof p!=='object' || Array.isArray(p)) throw Error('Parámetros inválidos');
 const keys=Object.keys(p).sort().join(',');
 let ok=false;
 if(kind==='dados') ok=keys==='sides' && [6,20,100].includes(p.sides);
 if(kind==='mapas') ok=keys==='obstacles' && Number.isInteger(p.obstacles) && p.obstacles>=0 && p.obstacles<=40;
 if(kind==='torneos') ok=keys==='scenario' && p.scenario==='arena-8x8';
 if(kind==='bonus') ok=keys==='collection' && p.collection==='cosmetic-v1';
 if(kind==='sorteos') ok=keys==='closedAt,entries' && Array.isArray(p.entries) && p.entries.length>=2 && p.entries.length<=30 && p.entries.every(s=>typeof s==='string' && /^Persona [A-Z][A-Z0-9 ]{0,20}$/.test(s)) && new Set(p.entries).size===p.entries.length && /^2026-10-04T\d{2}:\d{2}:\d{2}Z$/.test(p.closedAt) && Number.isFinite(Date.parse(p.closedAt)) && Date.parse(p.closedAt)<Date.parse(SNAPSHOT.time);
 if(!ok) throw Error('Parámetros inválidos: use tamaños permitidos y personas ficticias únicas.');
}
async function outcome(kind, params, seed) {
 validate(kind,params);
 const range=generator(seed,kind);
 if(kind==='dados') return {value:1+await range(params.sides)};
 if(kind==='mapas') {
  const path=[0]; let x=0,y=0;
  while(x<7||y<7) { if(x===7) y++; else if(y===7) x++; else if(await range(2)) x++; else y++; path.push(y*8+x); }
  const cells=Array(64).fill('open'); path.forEach(i=>cells[i]='path');
  const candidates=cells.map((_,i)=>i).filter(i=>!path.includes(i));
  for(let n=0;n<params.obstacles;n++) { const j=await range(candidates.length); cells[candidates.splice(j,1)[0]]='obstacle'; }
  return {cells,path};
 }
 if(kind==='torneos') {
  const candidates=Array.from({length:32},(_,i)=>Math.floor(i/4)*8+i%4),left=[];
  for(let n=0;n<8;n++) left.push(candidates.splice(await range(candidates.length),1)[0]);
  return {inputLeft:'equal-loadout-v1',inputRight:'equal-loadout-v1',left,right:left.map(i=>Math.floor(i/8)*8+7-i%8)};
 }
 if(kind==='sorteos') return {winner:params.entries[await range(params.entries.length)],closedAt:params.closedAt};
 const roll=await range(100);
 return {rarity:roll<75?'común':roll<95?'raro':'épico',color:['ámbar','azul','violeta'][await range(3)],pattern:['ondas','puntos','rayas'][await range(3)]};
}
async function createAudit(kind,params) {
 validate(kind,params);
 const payload=canonical({algorithm:VERSION,kind,parameters:params,snapshot:SNAPSHOT,sourceURL:SOURCE,simulation:true});
 const seed=await sha256(payload);
 return {algorithm:VERSION,payload,seed,parameters:JSON.parse(canonical(params)),result:await outcome(kind,params,seed),sourceURL:SOURCE,sourceTime:SNAPSHOT.time,simulation:true};
}
async function verifyAudit(text,original) {
 if(typeof text!=='string'||text.length>100000) throw Error('JSON demasiado grande');
 const a=JSON.parse(text);
 if(typeof a.payload!=='string'||a.payload.length>20000) throw Error('Payload inválido');
 const p=JSON.parse(a.payload);
 validate(p.kind,p.parameters);
 const hash=await sha256(a.payload);
 const computed=await outcome(p.kind,p.parameters,hash);
 const hashMatch=hash===a.seed && (!original||hash===original.seed);
 const outcomeMatch=canonical(computed)===canonical(a.result) && (!original||canonical(computed)===canonical(original.result));
 const metadataMatch=a.payload===canonical(p) && p.algorithm===VERSION && a.algorithm===VERSION && canonical(p.snapshot)===canonical(SNAPSHOT) && p.sourceURL===SOURCE && p.simulation===true && a.sourceURL===SOURCE && a.sourceTime===SNAPSHOT.time && a.simulation===true && canonical(a.parameters)===canonical(p.parameters);
 return {verified:hashMatch&&outcomeMatch&&metadataMatch,hashMatch,outcomeMatch,metadataMatch};
}
function mount(container) {
 const doc=container.ownerDocument;
 function el(tag,cls,text) { const n=doc.createElement(tag); n.className='rng-uc-'+cls; if(text!==undefined) n.textContent=text; return n; }
 function button(text,action) { const b=el('button','button',text); b.type='button'; b.addEventListener('click',action); return b; }
 function field(parent,title,input,id) { const label=el('label','label',title); input.id=id; label.htmlFor=id; label.append(input); parent.append(label); return input; }
 container.querySelectorAll('[data-rng-uc-kind]').forEach(section=>{
  if(section.dataset.rngUcMounted) return; section.dataset.rngUcMounted='true';
  const kind=section.dataset.rngUcKind,host=section.querySelector('.rng-uc-demo');
  const controls=el('div','controls'); host.append(controls);
  let input;
  if(kind==='dados') {
   input=el('select','input'); [6,20,100].forEach(s=>{const o=el('option','option','D'+s);o.value=String(s);input.append(o);});
   field(controls,'Caras del dado',input,'rng-uc-'+kind+'-input');
  } else if(kind==='mapas') {
   input=el('input','input');input.type='number';input.min='0';input.max='40';input.step='1';input.value='20';
   field(controls,'Obstáculos (0–40)',input,'rng-uc-'+kind+'-input');
  } else if(kind==='sorteos') {
   input=el('textarea','textarea');input.rows=3;input.maxLength=700;input.value='Persona A\nPersona B\nPersona C\nPersona D';
   field(controls,'Lista ficticia cerrada (2–30, una persona por línea)',input,'rng-uc-'+kind+'-input');
  }
  const result=el('div','result','Generá una demo para ver el resultado.');result.setAttribute('aria-live','polite');host.append(result);
  const retry=button('Intentar de nuevo',()=>generate.click()); retry.classList.add('rng-uc-retry'); retry.hidden=true; host.append(retry);
  const details=el('details','audit'); details.append(el('summary','summary','Verificar ex post · JSON y descarga'));
  const recorded=el('textarea','textarea'); recorded.readOnly=true;recorded.rows=8;
  field(details,'Registro original de sólo lectura',recorded,'rng-uc-'+kind+'-original');
  const editable=el('textarea','textarea');editable.maxLength=100000;editable.rows=8;
  field(details,'JSON editable para verificar (copie el original y pruebe cambios)',editable,'rng-uc-'+kind+'-verify');
  const status=el('p','status','Genere primero.');status.setAttribute('role','status');
  let original;
  details.append(button('Copiar original al campo',()=>{if(original) editable.value=recorded.value;}));
  details.append(button('Recomputar y comparar',async()=>{
   try { if(!original) throw Error('Genere primero'); const r=await verifyAudit(editable.value,original);
    status.textContent=(r.verified?'Verified · verificado':'Mismatch · no coincide')+' | hash: '+r.hashMatch+' | resultado independiente: '+r.outcomeMatch+' | metadatos: '+r.metadataMatch;
   } catch(e) {status.textContent='Mismatch · '+e.message;}
  }));
  details.append(button('Descargar audit JSON',()=>{
   if(!original) {status.textContent='Genere primero.';return;}
   const url=root.URL.createObjectURL(new Blob([recorded.value],{type:'application/json;charset=utf-8'}));
   const a=doc.createElement('a');a.href=url;a.download='rng-uc-'+kind+'-audit.json';a.click();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);
  }),status);host.append(details);
  const generate=button('Generar demostración',async()=>{
   generate.disabled=true; retry.hidden=true;
   try {
    let p;
    if(kind==='dados') p={sides:Number(input.value)};
    if(kind==='mapas') p={obstacles:input.value.trim()===''?NaN:Number(input.value)};
    if(kind==='torneos') p={scenario:'arena-8x8'};
    if(kind==='sorteos') p={entries:input.value.split('\n').map(s=>s.trim()),closedAt:'2026-10-04T23:00:00Z'};
    if(kind==='bonus') p={collection:'cosmetic-v1'};
    original=await createAudit(kind,p); recorded.value=JSON.stringify(original,null,2);editable.value=recorded.value;
    const r=original.result;result.replaceChildren();
    if(kind==='dados') result.textContent='D'+p.sides+' → '+r.value;
    if(kind==='sorteos') result.textContent='Selección ficticia: '+r.winner+' · lista cerrada antes del tick simulado.';
    if(kind==='bonus') result.textContent='Cosmético: '+r.color+' · '+r.pattern+' · '+r.rarity;
    if(kind==='mapas'||kind==='torneos') {
     result.append(el('p','legend',kind==='mapas'?'I inicio · F fin · · camino · × obstáculo · vacío transitable':'A lado azul · B lado ámbar · posiciones reflejadas; cargas iguales.'));
     const grid=el('div','grid');grid.setAttribute('role','img');grid.setAttribute('aria-label',kind==='mapas'?'Mapa 8 por 8 con camino garantizado de inicio a fin':'Arena 8 por 8 con posiciones reflejadas');
     for(let i=0;i<64;i++) {
      const state=kind==='mapas'?r.cells[i]:r.left.includes(i)?'left':r.right.includes(i)?'right':'open';
      const mark=kind==='mapas'?(i===0?'I':i===63?'F':state==='obstacle'?'×':state==='path'?'·':''):state==='left'?'A':state==='right'?'B':'';
      const cell=el('span','cell rng-uc-'+state,mark);cell.title='Fila '+(Math.floor(i/8)+1)+', columna '+(i%8+1)+': '+state;grid.append(cell);
     } result.append(grid);
    }
    status.textContent='Registro listo. Podés intentarlo de nuevo para generar otra variante y conservar el comprobante anterior.'; retry.hidden=false;
   } catch(e) {result.textContent=e.message; retry.hidden=false;} finally {generate.disabled=false;}
  }); controls.append(generate);
 });
}
const api={canonical,sha256,generator,createAudit,outcome,verifyAudit,mount,SNAPSHOT,VERSION,SOURCE};
if(root.document) {
 const start=()=>root.document.querySelectorAll('.rng-uc-root').forEach(mount);
 if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
}
if(typeof module==='object'&&module.exports) module.exports=api;
if(root.window) root.RNGUsecases=api;
})(globalThis);
