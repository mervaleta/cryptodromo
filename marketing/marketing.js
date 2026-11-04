/* No external tracker or form submission. Inventory read is same-origin. */
(function(){'use strict';
var selectors=Array.from(document.querySelectorAll('[data-select-slot]'));
var select=document.getElementById('mk-slot');
document.getElementById('mk-year').textContent=String(new Date().getFullYear());
var allowed=new Set(Array.from(select.options).map(function(o){return o.value}));
function choose(id){if(allowed.has(id)){select.value=id;}}
var fromUrl=new URLSearchParams(window.location.search).get('slot');if(fromUrl)choose(fromUrl);
selectors.forEach(function(a){a.addEventListener('click',function(){choose(a.getAttribute('data-select-slot'));});});
var filters=Array.from(document.querySelectorAll('[data-filter]'));
filters.forEach(function(b){b.addEventListener('click',function(){
 var name=b.getAttribute('data-filter');
 filters.forEach(function(t){t.setAttribute('aria-pressed',String(t===b));});
 document.querySelectorAll('.mk-card').forEach(function(c){c.hidden=name!=='all'&&c.dataset.section!==name;});
});});
function applyInventory(data){
 if(!data||!Array.isArray(data.placements))return;
 data.placements.forEach(function(slot){
  if(!slot||!allowed.has(slot.id)||typeof slot.status!=='string')return;
  var card=document.querySelector('.mk-card[data-slot="'+slot.id+'"]');if(!card)return;
  var pill=card.querySelector('.mk-pill');if(!pill)return;
  var available=slot.status==='available';pill.textContent=available?'Disponible':'Reservado';pill.dataset.status=available?'available':'reserved';
  var a=card.querySelector('.mk-link');if(a){a.textContent=available?'Consultar este espacio ↗':'Consultar alternativas ↗';}
 });
}
fetch('/marketing/inventory.json',{credentials:'omit',cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('not found');return r.json()}).then(applyInventory).catch(function(){
 document.getElementById('inventory-note').textContent='La disponibilidad debe confirmarse por correo antes de reservar.';
});
var form=document.getElementById('mk-inquiry-form');
form.addEventListener('submit',function(event){
 if(!form.checkValidity())return;
 event.preventDefault();
 var brand=document.getElementById('mk-name').value.trim();
 var email=document.getElementById('mk-email').value.trim();
 var slot=select.options[select.selectedIndex].textContent;
 var details=document.getElementById('mk-message').value.trim();
 var subject='Consulta comercial Cryptódromo - '+slot;
 var body='Hola, equipo de Cryptódromo.\n\nQuiero consultar sobre publicidad y patrocinios.\n\nEmpresa / contacto: '+brand+'\nEmail: '+email+'\nEspacio: '+slot+'\nConsulta: '+(details||'Solicito disponibilidad y condiciones comerciales.')+'\n\nGracias.';
 window.location.href='mailto:info@cryptodromo.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
});
})();
