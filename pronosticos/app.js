// Never compute an official finish here. The server's fixture and ledger are authoritative.
const $=id=>document.getElementById(id);
const tracks={'muybridge':'Eadweard Muybridge','genesis':'Genesis','vint-cerf':'Vint Cerf'};
const factors={winner:4,podium:25,exacta:30,trifecta:150};
const pickCount={winner:1,podium:3,exacta:2,trifecta:3};
const state={races:[],selected:null,picks:[],account:null,csrf:null,busy:false,requestKey:null,serverOffset:0};
const dt=n=>new Date(n*1000).toLocaleTimeString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const symbol=s=>String(s).replace(/[^A-Za-z0-9]/g,'').slice(0,12);
const say=(msg,isError=false)=>{$('alert').textContent=msg;$('alert').classList.toggle('error',isError);};
const mode=()=>$('mode').value;
const race=()=>state.selected;
const validStake=()=>{const n=$('stake').valueAsNumber;return Number.isInteger(n)&&n>=1&&n<=1000?n:null;};
async function request(action,method='GET',data=null){
 const opts={method,credentials:'same-origin',headers:{Accept:'application/json'}};
 if(data!==null){opts.headers['Content-Type']='application/json';opts.headers['X-CSRF-Token']=state.csrf||'';opts.body=JSON.stringify(data);}
 const response=await fetch('/api/predictions.php?action='+encodeURIComponent(action),opts);
 let obj;
 try{obj=await response.json();}catch{throw Error('El servidor no respondió en JSON.');}
 if(!response.ok)throw Object.assign(Error(obj.message||'Error de servicio'),{http:response.status});
 return obj;
}
function choose(item){
 state.selected=item;state.picks=[];state.requestKey=null;
 render();
}
function renderRaces(){
 const chosenId=state.selected?.race_id||'';
 const filter=$('track').value;
 const list=state.races.filter(r=>filter==='all'||r.track_id===filter);
 $('races').replaceChildren();
 if(!list.length){const p=document.createElement('p');p.className='muted';p.textContent='Sin nuevas admisiones en la ventana.';$('races').append(p);return;}
 for(const r of list){
  const b=document.createElement('button');b.type='button';b.className='race'+(r.race_id===chosenId?' selected':'');
  b.setAttribute('aria-pressed',String(r.race_id===chosenId));
  const a=document.createElement('span');a.className='race-track';a.textContent=tracks[r.track_id];
  const num=document.createElement('strong');num.textContent=dt(r.start_at);
  const meta=document.createElement('small');meta.textContent='#'+String(Math.floor(r.minute/3)+1).padStart(3,'0')+' · 12 participantes · cierre '+dt(r.close_at);
  b.append(a,num,meta);b.addEventListener('click',()=>choose(r));$('races').append(b);
 }
}
function renderRunners(){
 $('runners').replaceChildren();
 const r=race();if(!r)return;
 r.runners.forEach((token,i)=>{
  const b=document.createElement('button');b.type='button';
  b.className='runner'+(state.picks.includes(token)?' selected':'');
  b.setAttribute('aria-pressed',String(state.picks.includes(token)));
  const num=document.createElement('span');num.className='runner-number';num.textContent=String(i+1).padStart(2,'0');
  const ticker=document.createElement('strong');ticker.textContent=symbol(token);
  const pos=document.createElement('small');const where=state.picks.indexOf(token);pos.textContent=where<0?'ELEGIR':mode()==='podium'?'PODIO':(where+1)+'.º';
  b.append(num,ticker,pos);
  b.addEventListener('click',()=>{
   const index=state.picks.indexOf(token);
   if(index>=0)state.picks.splice(index,1);
   else if(state.picks.length<pickCount[mode()])state.picks.push(token);
   state.requestKey=null;render();
  });
  $('runners').append(b);
 });
}
function renderTicket(){
 const r=race();$('race-title').textContent=r?tracks[r.track_id]+' · '+dt(r.start_at):'Seleccioná una carrera';
 const now=Math.floor(Date.now()/1000+state.serverOffset);
 const remaining=r?r.close_at-now:null;
 $('cutoff').textContent=r?(remaining>0?'Cierra en '+remaining+' s · '+dt(r.close_at):'Admisión cerrada'):'Cierre verificado por servidor';
 $('picks').replaceChildren();
 if(!state.picks.length){$('picks').textContent='Elegí '+pickCount[mode()]+' corredor(es)';}
 else state.picks.forEach((s,i)=>{const x=document.createElement('span');x.className='chip';x.textContent=mode()==='podium'?s:(i+1)+'. '+s;$('picks').append(x);});
 const stake=validStake();$('reward').textContent=stake===null?'—':(stake*factors[mode()]).toLocaleString('es-AR')+' CR';
 $('confirm').disabled=state.busy||!state.account||!state.csrf||!r||remaining<=0||state.picks.length!==pickCount[mode()]||stake===null||stake>state.account.credits;
}
function renderHistory(){
 $('history').replaceChildren();
 const data=state.account?.history||[];
 if(!data.length){const p=document.createElement('p');p.className='muted';p.textContent=state.account?'Todavía no hay pronósticos registrados.':'Iniciá sesión verificada para ver tus comprobantes.';$('history').append(p);return;}
 const table=document.createElement('table');const head=document.createElement('thead');const headRow=document.createElement('tr');
 for(const title of ['Registro','Carrera','Modalidad','Selecciones','Comprometido','Estado','Recompensa']){const th=document.createElement('th');th.textContent=title;headRow.append(th);}head.append(headRow);table.append(head);
 const body=document.createElement('tbody');
 for(const item of data){const tr=document.createElement('tr');const values=[
  new Date(item.created_at*1000).toLocaleString('es-AR'),
  item.date+' '+dt(item.start_at)+' · '+tracks[item.track_id],
  item.modality,item.picks.join(' · '),item.stake+' CR',
  ({confirmed:'Confirmado',closed:'Cerrado',pending_result:'Resultado pendiente',won:'Ganador',lost:'No acertó',void:'Anulado'})[item.status]||item.status,
  item.payout+' CR'];
  for(const v of values){const td=document.createElement('td');td.textContent=v;tr.append(td);}
  tr.title='Comprobante '+item.id+' · '+item.race_id;
  tr.dataset.status=item.status;body.append(tr);
 }
 table.append(body);const scroll=document.createElement('div');scroll.className='scroll';scroll.append(table);$('history').append(scroll);
}
function render(){
 renderRaces();renderRunners();renderTicket();renderHistory();
 $('credits').textContent=state.account?state.account.credits.toLocaleString('es-AR')+' CR':'No conectada';
 $('identity').textContent=state.account?'Sesión verificada · Libro contable reconciliado':'Sin sesión de usuario verificada';
}
async function reload(){
 const responses=await Promise.allSettled([request('races'),request('me')]);
 if(responses[0].status==='fulfilled'){
  const result=responses[0].value;state.races=result.races;
  if(Number.isInteger(result.server_time))state.serverOffset=result.server_time-Date.now()/1000;
  const active=state.races.find(r=>r.race_id===state.selected?.race_id);
  if(state.selected && !active){state.selected=null;state.picks=[];state.requestKey=null;}
  else if(active)state.selected=active;
  else if(!state.selected)state.selected=state.races[0]||null;
 }else{state.races=[];say(responses[0].reason.message,true);}
 if(responses[1].status==='fulfilled'){
  state.account=responses[1].value.account;state.csrf=responses[1].value.csrf;
  if(responses[0].status==='fulfilled')say('Fixture oficial cargado. Seleccioná tu combinación virtual.');
 }else{
  state.account=null;state.csrf=null;
  if(responses[0].status==='fulfilled')say(responses[1].reason.http===401?'Se requiere iniciar sesión Google verificada para registrar un pronóstico.':responses[1].reason.message,true);
 }
 render();
}
$('track').addEventListener('change',renderRaces);
$('mode').addEventListener('change',()=>{state.picks=[];state.requestKey=null;render();});
$('stake').addEventListener('input',()=>{state.requestKey=null;renderTicket();});
$('reload').addEventListener('click',reload);
$('confirm').addEventListener('click',async()=>{
 if($('confirm').disabled || !race())return;
 state.busy=true;renderTicket();
 if(!state.requestKey)state.requestKey=crypto.randomUUID();
 const payload={race_id:race().race_id,modality:mode(),picks:[...state.picks],stake:validStake(),idempotency_key:state.requestKey};
 try{
  const result=await request('confirm','POST',payload);
  say('Comprobante '+result.ticket.id+' registrado en el servidor. Cerrará y se liquidará según el calendario oficial.');
  state.requestKey=null;state.picks=[];await reload();
 }catch(error){say('No se registró el pronóstico: '+error.message+' (podés reintentar sin doble débito).',true);}
 finally{state.busy=false;renderTicket();}
});
reload();
setInterval(()=>renderTicket(),1000);
setInterval(()=>{if(!state.busy)reload();},15000);
