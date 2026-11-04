/* CRP direct advertising inventory v1: cosmetic DOM only, race engine untouched. */
(function(){'use strict';
if(window.__crpAdsLoaded)return;window.__crpAdsLoaded=true;
function boot(){
 var path=location.pathname.replace(/index\.html$/,'')||'/';
 if(/^\/(marketing|admin|api)\//.test(path)||/^\/(privacidad|terminos|juego-responsable)(\.html|\/|$)/.test(path))return;
 if(/\/(?:privacypolicy|copyright)\//.test(path))return;
 var main=document.querySelector('main');
 if(!main)return;
 var style=document.createElement('link');style.rel='stylesheet';style.href='/assets/ad-inventory.css?v=1';document.head.appendChild(style);
 var racing=path==='/'||path==='/index.html';
 var catalog={
  'home-top':{format:'Leaderboard · 970 × 90',label:'Cabecera de transmisión'},
  'race-post':{format:'Leaderboard · 970 × 90',label:'Post carrera'},
  'race-footer':{format:'Leaderboard · 970 × 90',label:'Cierre de transmisión'},
  'interior-top':{format:'Leaderboard · 728 × 90',label:'Cabecera de sección'},
  'interior-content':{format:'Display · 728 × 90',label:'Entre contenidos'},
  'interior-footer':{format:'Leaderboard · 970 × 90',label:'Cierre de sección'}
 };
 function node(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n}
 function make(id,type){
  if(document.querySelector('[data-crp-ad="'+id+'"]'))return null;
  var d=catalog[id];if(!d)return null;
  var box=node('aside','crp-ad-slot crp-ad-slot--'+type);box.dataset.crpAd=id;box.dataset.crpStatus='available';
  box.setAttribute('aria-label','Espacio publicitario disponible: '+d.label);
  var e=node('div','crp-ad-slot__eyebrow','PUBLICIDAD');e.append(node('span','',d.format));
  var copy=node('div','crp-ad-slot__copy');copy.append(node('strong','','Tu marca puede estar acá.'));
  copy.append(node('p','',''+d.label+' · Ubicación disponible para patrocinadores.'));
  var a=node('a','crp-ad-slot__cta','Conocer el espacio ↗');a.href='/marketing/?slot='+encodeURIComponent(id)+'#contacto';
  box.append(e,copy,a);return box
 }
 function placeAfter(target,id,type){if(target&&target.parentNode){var box=make(id,type);if(box)target.insertAdjacentElement('afterend',box)}}
 function placeBefore(target,id,type){if(target&&target.parentNode){var box=make(id,type);if(box)target.insertAdjacentElement('beforebegin',box)}}
 var header=document.querySelector('header.sitebar,header.top,header.bar');
 if(header)placeAfter(header,racing?'home-top':'interior-top','top');
 if(racing){
  placeAfter(main.querySelector('#stage,.stage,.viewer-card'), 'race-post','afterrace');
  placeBefore(main.querySelector('footer'), 'race-footer','footer');
 }else{
  var sections=Array.from(main.children).filter(function(e){return /^(SECTION|ARTICLE|DIV)$/.test(e.tagName)&&!e.classList.contains('crp-ad-slot')});
  var middle=sections.length>=3?sections[1]:sections.length>=2?sections[0]:null;
  if(middle)placeAfter(middle,'interior-content','incontent');
  var footer=document.querySelector('footer');
  if(footer)placeBefore(footer,'interior-footer','footer');
 }
 // Integrate unobtrusive commercial link into existing footer if possible.
 var list=document.querySelector('.site-footer .site-footer-grid > div:last-child ul');
 if(list&&!list.querySelector('a[href^="/marketing/"]')){
  var li=node('li');var a=node('a','','Publicidad y patrocinio');a.href='/marketing/';li.append(a);list.append(li)
 }
 // Commercial availability is centrally editable from JSON; hide slots marked reserved.
 if(typeof fetch==='function')fetch('/marketing/inventory.json',{credentials:'omit',cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('inventory');return r.json()}).then(function(data){
  if(!data||!Array.isArray(data.placements))return;
  data.placements.forEach(function(item){
   if(!item||typeof item.id!=='string')return;
   var slot=document.querySelector('[data-crp-ad="'+item.id+'"]');
   if(slot&&item.status==='reserved')slot.dataset.crpStatus='reserved';
  })
 }).catch(function(){/* Visual demo remains available offline without tracking or external calls. */});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
