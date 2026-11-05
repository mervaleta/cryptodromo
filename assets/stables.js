/**
 * Escuderías Alpha18: guest-only demo UI. Server decides credits, results and XP.
 */
import { TOKEN_ROSTER } from '/race-lab/source/src/data/tokenRoster.js?v=coat-20261102';
const $ = id => document.getElementById(id);
const fmt = n => Number(n || 0).toLocaleString('es-AR',{maximumFractionDigits:2});
const allTokens = TOKEN_ROSTER;
const tokenMap = new Map(allTokens.map(t=>[t.symbol,t]));
const page = document.body.dataset.stablesPage;
let csrf='',state=null,plans={},chosen=[],mode='total',tier='all',pendingKey='';
function notice(msg){const el=$('service-error');if(!el)return;el.hidden=!msg;if(msg)el.textContent=msg;}
async function call(action,body=null,params=null){
 const qs = new URLSearchParams({action,...(params||{})});
 const ctrl=new AbortController();
 const timer=setTimeout(()=>ctrl.abort(),25000);
 try{
  const response=await fetch('/api/stables.php?'+qs.toString(),{
    method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',
    headers:body?{'Content-Type':'application/json'}:{'Accept':'application/json'},
    body:body?JSON.stringify({...body,csrf}):undefined,signal:ctrl.signal
  });
  const result=await response.json().catch(()=>{throw Error('El servidor no devolvió JSON. ¿Está activo PHP?');});
  if(!response.ok||!result.ok)throw Error(result.error||'Operación rechazada');
  return result;
 }finally{clearTimeout(timer);}
}
function write(id,text){if($(id))$(id).textContent=String(text);}
function options(){return Object.entries(plans).map(([cap,cost])=>({cap:Number(cap),cost:Number(cost)})).sort((a,b)=>a.cap-b.cap);}
function capacity(){return Number($('plan')?.value||2);}
function stats(){
 if(!state)return;
 const u=state.user,s=state.stable;
 write('owner-alias',u.alias);write('wallet-balance',fmt(u.credits));
 write('team-current',s?.name||'Sin fundar');
 write('team-level',s?s.capacity+' caballos · '+s.captain+' capitán':'Elegí tu licencia');
 write('my-xp',fmt(s?.xp||0));
 write('my-rate',fmt(s?.starts)+' participaciones · '+fmt(s?.efficiency)+' XP/participación');
 if($('alias-input'))$('alias-input').value=u.alias;
}
function renderPlans(){
 const select=$('plan');if(!select)return;
 select.replaceChildren();
 for(const p of options()){
  if(state?.stable && p.cap<state.stable.capacity)continue;
  const opt=document.createElement('option');opt.value=String(p.cap);
  opt.textContent=p.cap+' caballos · '+fmt(p.cost)+' créditos ficticios';select.append(opt);
 }
 select.value=String(state?.stable?.capacity||2);
 if(!select.value)select.selectedIndex=0;
}
function selection(){
 const max=capacity(),holder=$('selected'),captain=$('captain'),save=$('save-stable');
 holder.replaceChildren();captain.replaceChildren();
 if(!chosen.length){const p=document.createElement('span');p.textContent='Elegí un caballo para comenzar.';holder.append(p);}
 for(const symbol of chosen){
  const tag=document.createElement('b');tag.textContent=symbol;holder.append(tag);
  const opt=document.createElement('option');opt.value=symbol;opt.textContent=symbol+' · '+tokenMap.get(symbol)?.name;captain.append(opt);
 }
 if(chosen.includes(state?.stable?.captain))captain.value=state.stable.captain;
 write('selection-count',chosen.length+' de '+max+' corredores elegidos');
 save.disabled=chosen.length!==max;
 const cost=Number(plans[max]),previous=Number(plans[state?.stable?.capacity]||0);
 write('plan-hint',state?.stable?
    max>state.stable.capacity?'Ampliación: '+fmt(cost-previous)+' créditos ficticios; sólo pagás la diferencia.'
     :'Se permiten hasta dos reemplazos semanales, efectivos desde la próxima largada.'
    :'Licencia: '+fmt(cost)+' créditos ficticios. Ninguna compra altera las carreras.');
 write('save-stable',state?.stable?(max>state.stable.capacity?'Ampliar escudería':'Guardar plantilla'):'Fundar escudería');
}
function renderTokens(){
 const root=$('tokens');root.replaceChildren();
 const query=$('token-search').value.trim().toLowerCase();
 for(const token of allTokens){
  if(tier!=='all'&&tier!==token.tier)continue;
  if(query&&!(token.symbol+' '+token.name).toLowerCase().includes(query))continue;
  const selected=chosen.includes(token.symbol);
  const b=document.createElement('button');b.type='button';b.className='stable-token';
  b.title=token.name;b.setAttribute('aria-pressed',String(selected));
  b.disabled=!selected&&chosen.length>=capacity();
  const dot=document.createElement('span');dot.className='token-dot';dot.style.backgroundColor=token.color;
  const label=document.createElement('span');label.textContent=token.symbol;b.append(dot,label);
  b.addEventListener('click',()=>{
   chosen=selected?chosen.filter(t=>t!==token.symbol):[...chosen,token.symbol];
   renderTokens();selection();
  });
  root.append(b);
 }
 if(!root.childElementCount){const p=document.createElement('p');p.textContent='No hay corredores con ese filtro.';root.append(p);}
}
function refreshForm(){
 const s=state.stable,name=$('stable-name');
 name.disabled=!!s;name.value=s?.name||'';
 $('stable-color').value=s?.color||'#13d69a';
 chosen=(s?.roster||[]).filter(t=>tokenMap.has(t));
 renderPlans();renderTokens();selection();
}
function operationKey(){
 if(!pendingKey){const a=crypto.getRandomValues(new Uint8Array(20));pendingKey='st'+Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join('');}
 return pendingKey;
}
async function save(e){
 e.preventDefault();
 const button=$('save-stable'),max=capacity();
 if(chosen.length!==max){write('save-status','Completá las plazas de la licencia.');return;}
 const prev=state.stable;
 const action=!prev?'create':max>prev.capacity?'upgrade':'roster';
 const body={capacity:max,name:$('stable-name').value.trim(),color:$('stable-color').value,
   captain:$('captain').value,tokens:[...chosen]};
 if(action!=='roster')body.key=operationKey();
 button.disabled=true;write('save-status','Guardando…');
 try{
  const r=await call(action,body);
  pendingKey='';state=r.state;
  write('save-status',r.replayed?'La operación ya estaba registrada.':'Guardado. Los caballos puntuarán desde la próxima largada.');
  stats();refreshForm();await recent();
 }catch(error){write('save-status',error.message);selection();}
}
async function recent(){
 const s=state?.stable,holder=$('recent-results');if(!s||!holder)return;
 try{
  const response=await call('stable',null,{id:s.id});
  holder.replaceChildren();
  if(!response.stable.ledger.length){const p=document.createElement('p');p.textContent='Esperando las primeras llegadas desde tu inscripción.';holder.append(p);return;}
  for(const item of response.stable.ledger.slice(0,12)){
   const p=document.createElement('p'),b=document.createElement('b');b.textContent=item.symbol;
   const number=Number(item.round_no);
   p.append(b,document.createTextNode(' · jornada '+(Math.floor((number%3360)/480)+1)
      +' · carrera '+(number%480+1)+' · puesto '+item.place+' · +'+item.xp+' XP'));
   holder.append(p);
  }
 }catch(error){holder.textContent='No se pudo consultar el historial: '+error.message;}
}
async function publicView(id){
 const {stable:s}=await call('stable',null,{id});
 const box=document.createElement('section');box.className='stable-panel';
 const h=document.createElement('h2');h.textContent=s.name;h.style.color=s.color;
 const p=document.createElement('p');p.textContent='Entrenador: '+s.owner+' · '+s.capacity+' caballos · capitán '+s.captain;
 const horses=document.createElement('p');horses.textContent='Plantilla: '+s.roster.join(' · ');
 const a=document.createElement('a');a.href='/stables/';a.className='stable-button';a.textContent='Volver a mi escudería';
 box.append(h,p,horses,a);$('loading').replaceWith(box);
}
async function manager(){
 try{
  const result=await call('bootstrap');csrf=result.csrf;plans=result.plans;state=result.state;
  const id=new URLSearchParams(location.search).get('id');
  if(id&&/^\d+$/.test(id)&&Number(id)!==state.stable?.id){await publicView(id);return;}
  $('loading').hidden=true;$('application').hidden=false;
  stats();refreshForm();
  $('stable-form').addEventListener('submit',save);
  $('plan').addEventListener('change',()=>{chosen=chosen.slice(0,capacity());renderTokens();selection();});
  $('token-search').addEventListener('input',renderTokens);
  document.querySelectorAll('[data-tier]').forEach(b=>b.addEventListener('click',()=>{
   tier=b.dataset.tier;
   document.querySelectorAll('[data-tier]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
   renderTokens();
  }));
  $('alias-form').addEventListener('submit',async event=>{
   event.preventDefault();const b=event.currentTarget.querySelector('button');b.disabled=true;
   try{const r=await call('profile',{alias:$('alias-input').value.trim()});state=r.state;stats();notice('');}
   catch(error){notice(error.message);}finally{b.disabled=false;}
  });
  await recent();
  if(result.pending)notice('Hay resultados pendientes en algunas escuderías. Actualizá la página para completar el cómputo.');
 }catch(error){$('loading').hidden=true;notice('El servicio de escuderías no está disponible: '+error.message+'. El hosting debe tener PHP 8 y PDO SQLite.');}
}
function td(row,text,klass=''){const el=document.createElement('td');el.textContent=String(text);if(klass)el.className=klass;row.append(el);return el;}
async function leaderboard(){
 write('ranking-explanation',mode==='total'?
  'Por XP total: acumular participaciones es importante, pero los podios también cuentan.':
  'Por XP por participación: la selección importa más que el tamaño. Equipos sin el mínimo aparecen provisionales.');
 write('ranking-status','Actualizando actas…');
 try{
  const r=await call('leaderboard',null,{mode,period:$('period').value});
  write('stable-count',fmt(r.entries.length));write('minimum',r.minimum_starts);
  write('as-of',new Date(r.as_of).toLocaleTimeString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit'})+' (Bs. As.)');
  const body=$('ranking-rows');body.replaceChildren();
  if(!r.entries.length){const row=document.createElement('tr');td(row,'Aún no hay escuderías fundadas. ¡Podés ser el primero!').colSpan=7;body.append(row);}
  for(const s of r.entries){
   const row=document.createElement('tr');td(row,s.rank?'#'+s.rank:'—','rank');
   const name=td(row,''),a=document.createElement('a');a.href='/stables/?id='+s.id;a.className='stable-title';a.textContent='◈ '+s.name;a.style.color=s.color;
   const owner=document.createElement('div');owner.className='stable-owner';owner.textContent=s.owner+(s.provisional?' · provisional':'');
   name.append(a,owner);
   td(row,s.capacity);td(row,fmt(s.xp));td(row,fmt(s.starts));td(row,fmt(s.efficiency));td(row,fmt(s.podiums));body.append(row);
  }
  write('ranking-status',r.pending?'Algunos equipos siguen procesando carreras pendientes. Actualizá para completar el ranking.':r.entries.length+' escuderías registradas · actas sintéticas y sin apuestas.');
 }catch(error){write('ranking-status','No se pudo consultar: '+error.message);notice(error.message);}
}
function championship(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));leaderboard();
 }));
 $('period').addEventListener('change',leaderboard);leaderboard();
}
if(page==='manager')manager();
if(page==='championship')championship();
