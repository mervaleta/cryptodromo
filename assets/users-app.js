import {TOKEN_ROSTER} from '/race-lab/source/src/data/tokenRoster.js?v=coat-20261102';
import {getTripleRaceFixture} from '/race-lab/source/src/data/tripleRaceFixture.js';
const $=id=>document.getElementById(id);
const roster=new Map(TOKEN_ROSTER.map(t=>[t.symbol,t]));
let csrf='',me=null,favorites=[],mailEnabled=false,googleClient='',googleInitialized=false;
const params=new URLSearchParams(location.search);
const publicAlias=params.get('perfil');
const resetToken=params.get('reset');
const verifyToken=params.get('verify');
function visible(id,value){$(id).hidden=!value;}
function notice(text,bad=false){const el=$('message');el.textContent=text||'';el.classList.toggle('error',bad);}
async function api(action,data,query={}){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const response=await fetch('/api/users.php?'+new URLSearchParams({action,...query}),{
      method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{'Accept':'application/json'},
      body:data?JSON.stringify({...data,csrf}):undefined,
      credentials:'same-origin',cache:'no-store',signal:ctrl.signal
    });
    let result;
    try{result=await response.json();}catch{throw Error('El servidor no devolvió JSON válido.');}
    if(!response.ok||!result.ok)throw Error(result.error||'Operación rechazada.');
    return result;
  }finally{clearTimeout(timer);}
}
async function submit(form,action,transform){
  const button=form.querySelector('[type=submit]');button.disabled=true;
  try{
    const data=Object.fromEntries(new FormData(form).entries());
    const result=await api(action,transform?transform(data):data);
    form.reset();notice('Cambios guardados correctamente.');
    await reload();
    return result;
  }catch(e){notice(e.message||'Error de red.',true);return null;}
  finally{button.disabled=false;}
}
function safeText(el,text){el.textContent=String(text??'');}
function line(parent,text,extra){
  const div=document.createElement('div');div.className='card-line';
  const value=document.createElement('span');value.textContent=text;div.append(value);
  if(extra){const more=document.createElement('span');more.textContent=extra;div.append(more);}
  parent.append(div);
}
async function loadPublic(){
  visible('guest',false);visible('dashboard',false);visible('public-profile',true);
  try{
    const result=await api('profile',null,{alias:publicAlias});
    const box=$('public-content');box.replaceChildren();
    const h=document.createElement('h3');h.textContent='@'+result.profile.alias;box.append(h);
    line(box,'Ingreso',new Date(result.profile.joined_at*1000).toLocaleDateString('es-AR'));
  }catch(e){notice(e.message,true);}
}
function fillProfile(){
  safeText($('dashboard-alias'),'@'+me.alias);
  safeText($('dashboard-email'),me.email);
  safeText($('verification-status'),me.email_verified?'Correo verificado':'Correo sin verificar');
  visible('verify-email',!me.email_verified&&mailEnabled);
  $('profile-alias').value=me.alias;
  const zone=$('profile-zone');
  if(![...zone.options].some(o=>o.value===me.timezone)){
    const option=new Option(me.timezone,me.timezone);zone.add(option);
  }
  zone.value=me.timezone;$('profile-locale').value=me.locale;
  $('profile-public').checked=me.public_profile;
  $('profile-notify').checked=me.notify_enabled;
  const box=$('public-link');box.replaceChildren();
  if(me.public_profile){
    const link=document.createElement('a');link.href='/cuenta/?perfil='+encodeURIComponent(me.alias);
    link.textContent='Ver mi ficha pública';box.append(link);
  }else box.textContent='Tu perfil no aparece públicamente.';
}
function renderFavorites(){
 const select=$('horse-select');select.replaceChildren(new Option('Elegí un corredor…',''));
 for(const t of TOKEN_ROSTER)select.add(new Option(t.name+' · '+t.symbol,t.symbol));
 const list=$('favorites-list');list.replaceChildren();
 safeText($('favorite-count'),favorites.length);
 if(!favorites.length){const li=document.createElement('li');li.textContent='Todavía no seguís ningún caballo.';list.append(li);return;}
 for(const fav of favorites){
   const li=document.createElement('li');
   const link=document.createElement('a');link.href='/racers/#'+encodeURIComponent(fav.symbol);
   link.textContent=(roster.get(fav.symbol)?.name||fav.symbol)+' · '+fav.symbol;
   const archive=document.createElement('a');archive.href='/stadiums/crypto/archive/';
   archive.textContent='Archivo';archive.className='hint';
   const btn=document.createElement('button');btn.type='button';btn.textContent='Dejar de seguir';
   btn.addEventListener('click',async()=>{
     btn.disabled=true;try{await api('favorite',{symbol:fav.symbol,enabled:false});notice('Caballo eliminado de favoritos.');await loadDashboard();}
     catch(e){notice(e.message,true);}finally{btn.disabled=false;}
   });
   li.append(link,archive,btn);list.append(li);
 }
}
async function loadUpcoming(){
 const box=$('upcoming');box.replaceChildren();
 if(!favorites.length){box.textContent='Agregá un favorito para consultar sus próximas largadas.';return;}
 try{
   // This imports official Alpha19 scheduling; no second fixture or winner calculator.
   const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',
     year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})
     .formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
   const anchor=Date.UTC(2026,10,2);
   const dayOffset=Math.floor((Date.UTC(parts.year,parts.month-1,parts.day)-anchor)/86400000);
   const minute=parts.hour*60+parts.minute+(parts.second>29?1:0);
   const wanted=new Set(favorites.map(f=>f.symbol));
   let count=0;
   // Bounded scan keeps price engine responsive even on mobile.
   for(let i=0;i<65&&count<5;i++){
     const idx=minute+i,day=dayOffset+Math.floor(idx/1440),slot=((idx%1440)+1440)%1440;
     const fixture=getTripleRaceFixture(slot,day);
     const matching=fixture.entries.filter(e=>wanted.has(e.symbol));
     if(!matching.length)continue;
     line(box,fixture.trackName+' · '+fixture.time+':30',matching.map(e=>e.symbol).join(', '));count++;
   }
   if(!count)box.textContent='Sin participaciones en las próximas 65 largadas. Verificá el fixture mundial.';
 }catch(e){
   box.textContent='Fixture no disponible en este momento. Consultá la transmisión.';
 }
}
async function loadDashboard(){
 const calls=await Promise.allSettled(['favorites','sessions','activity','notifications'].map(x=>api(x)));
 const [f,s,a,n]=calls.map(x=>x.status==='fulfilled'?x.value:null);
 if(calls.some(x=>x.status==='rejected'))notice('Algunos datos personales no pudieron cargarse.',true);
 favorites=f?.favorites||[];
 renderFavorites();safeText($('session-count'),s?.active_sessions??'—');
 safeText($('activity-count'),a?.activity?.length??'—');
 const activity=$('activity');activity.replaceChildren();
 if(!a?.activity?.length)activity.textContent='Sin actividad registrada.';
 else for(const x of a.activity)line(activity,x.kind,new Date(x.created_at*1000).toLocaleString('es-AR'));
 const notifications=$('notifications');notifications.replaceChildren();
 if(!n?.notifications?.length)notifications.textContent='No hay notificaciones reales todavía.';
 else for(const x of n.notifications){
   const div=document.createElement('div');div.className='card-line';
   const title=document.createElement('span');title.textContent=x.title+' · '+x.body;div.append(title);
   if(!x.read_at){const btn=document.createElement('button');btn.type='button';btn.textContent='Marcar leída';
     btn.addEventListener('click',async()=>{try{await api('read_notification',{id:Number(x.id)});await loadDashboard();}catch(e){notice(e.message,true);}});
     div.append(btn);}
   notifications.append(div);
 }
 await loadUpcoming();
}
async function initializeGoogle(){
 if (!googleClient || googleInitialized) return;
 googleInitialized=true;
 const script=document.createElement('script');
 script.src='https://accounts.google.com/gsi/client';
 script.async=true;script.defer=true;
 script.onload=()=>{
   if(!window.google?.accounts?.id){notice('Google Identity no está disponible.',true);return;}
   window.google.accounts.id.initialize({
     client_id:googleClient, auto_select:false,
     callback:async({credential})=>{
       if(typeof credential!=='string'||!credential) return;
       try{
         const response=await fetch('/api/auth.php?action=login_google',{
           method:'POST',credentials:'same-origin',cache:'no-store',
           headers:{'Content-Type':'application/json'},body:JSON.stringify({id_token:credential})
         });
         const result=await response.json();
         if(!response.ok||result.status!=='success')throw Error(result.message||'Google no pudo iniciar la sesión.');
         notice('Sesión iniciada con Google.');
         await reload();
       }catch(e){notice(e.message||'Error de inicio de sesión Google.',true);}
     }
   });
   window.google.accounts.id.renderButton($('google-signin'),{
     type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'pill'
   });
 };
 script.onerror=()=>notice('No se pudo cargar el acceso Google.',true);
 document.head.append(script);
}
async function reload(){
 const data=await api('bootstrap');csrf=data.csrf;me=data.user;mailEnabled=data.mail_enabled;
 googleClient=data.google_client_id||'';
 visible('google-area',!me&&!!googleClient);
 if(!me&&googleClient)initializeGoogle();
 visible('service-error',false);visible('guest',!me);visible('dashboard',!!me);
 if(me){fillProfile();await loadDashboard();}
}
function bind(formId,action,transform){
 $(formId).addEventListener('submit',async e=>{e.preventDefault();await submit(e.currentTarget,action,transform);});
}
bind('login-form','login');
bind('register-form','register');
bind('profile-form','update_profile',d=>({
 alias:d.alias,timezone:d.timezone,locale:d.locale,
 public_profile:$('profile-public').checked,notify_enabled:$('profile-notify').checked
}));
bind('favorite-form','favorite',d=>({symbol:d.symbol,enabled:true}));
bind('password-form','change_password');
bind('reset-form','request_reset');
$('new-password-form').addEventListener('submit',async e=>{
 e.preventDefault();
 await submit(e.currentTarget,'reset_password',d=>({password:d.password,token:resetToken}));
});
$('show-reset').addEventListener('click',()=>{
 visible('reset-panel',true);$('reset-email').focus();
});
$('retry').addEventListener('click',()=>init());
$('verify-email').addEventListener('click',async()=>{try{await api('request_verification',{});notice('Solicitud enviada al proveedor de correo.');}catch(e){notice(e.message,true);}});
for(const action of ['logout','logout_all']){
 $(action.replace('_','-')).addEventListener('click',async()=>{
   try{await api(action,{});notice('Sesión cerrada.');await reload();}
   catch(e){notice(e.message,true);}
 });
}
async function init(){
 visible('service-error',false);notice('');
 try{
   await reload();
   if(publicAlias){await loadPublic();return;}
   if(verifyToken){
     await api('verify_email',{token:verifyToken});
     history.replaceState(null,'','/cuenta/');notice('Correo verificado correctamente.');await reload();
   }
   if(resetToken){
     visible('reset-panel',true);visible('new-password-form',true);visible('reset-form',false);
     visible('guest',true);$('new-password').focus();
   }
 }catch(e){visible('guest',false);visible('dashboard',false);visible('service-error',true);notice(e.message,true);}
}
init();