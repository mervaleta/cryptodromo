/* Alpha18 CRP universal navigation: DOM enhancement, does not touch race logic. */
(()=>{'use strict';
const groups=[
 {label:'Explorar',icon:'◈',items:[['/stadiums/','Estadios del mundo'],['/stadiums/fixture/','Fixture mundial'],['/estadio/','Estadio 3D'],['/parade/','Modo Parade'],['/visual-lab/','Visual Lab'],['/laboratorio/','Laboratorio'],['/estadisticas/','Estadísticas'],['/stadiums/crypto/archive/','Archivo Satoshi']]},
 {label:'Comunidad',icon:'♧',items:[['/comunidad/','Jugadores e insignias'],['/stables/','Escuderías'],['/championship/','Campeonatos'],['/cronicas/','Crónicas'],['/apuestas/','Favoritos · demo'],['/eventos.html','Eventos']]},
 {label:'Proyecto',icon:'▤',items:[['/institucional/','Presentación'],['/como-funciona.html','Cómo funciona'],['/contacto.html','Contacto'],['/preguntas.html','Ayuda']]}
];
const main=[['/','Inicio'],['/stadiums/crypto/live/','Carreras · demo'],['/racers/','Corredores'],['/fixture/','Fixture'],['/resultados/','Resultados'],['/grandes-premios/','Grandes Premios']];
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x};
function init(){
 const existing=document.querySelector('header.sitebar,header.top,header.bar');if(!existing||existing.dataset.crpUnified==='1')return;
 const header=el('header','sitebar crp-unified');header.dataset.crpUnified='1';
 const inner=el('div','sitebar-inner');
 const brand=el('a','site-brand');brand.href='/';brand.setAttribute('aria-label','Cryptódromo, inicio');
 const img=el('img');img.src='/assets/cryptodromo-logo.png';img.alt='Cryptódromo';brand.append(img);inner.append(brand);
 const nav=el('nav','site-nav crp-unified-nav');nav.setAttribute('aria-label','Navegación principal');
 const path=location.pathname.replace(/index\.html$/,'').replace(/\/$/,'/')||'/';
 const allMenus=[];
 function link(href,label){const a=el('a','crp-nav-link',label);a.href=href;if(href===path)a.setAttribute('aria-current','page');return a}
 for(const [href,label] of main)nav.append(link(href,label));
 for(let i=0;i<groups.length;i++){
 const group=groups[i],wrap=el('div','crp-nav-group'),btn=el('button','crp-nav-toggle',group.icon+' '+group.label+' ▾'),menu=el('div','crp-nav-menu');
 btn.type='button';btn.setAttribute('aria-haspopup','true');btn.setAttribute('aria-expanded','false');
 const id='crp-nav-menu-'+i;menu.id=id;btn.setAttribute('aria-controls',id);menu.hidden=true;
 for(const [href,label] of group.items){const a=link(href,label);menu.append(a);if(href===path)btn.classList.add('crp-nav-active')}
 wrap.append(btn,menu);nav.append(wrap);allMenus.push({btn,menu,wrap});
 }
 function close(except){for(const x of allMenus){if(x===except)continue;x.btn.setAttribute('aria-expanded','false');x.menu.hidden=true}}
 for(const x of allMenus){
 x.btn.addEventListener('click',()=>{const was=x.btn.getAttribute('aria-expanded')==='true';close();x.btn.setAttribute('aria-expanded',String(!was));x.menu.hidden=was});
 x.btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(x.menu.hidden)x.btn.click();x.menu.querySelector('a')?.focus()}});
 x.menu.addEventListener('keydown',e=>{if(e.key==='Escape'){close();x.btn.focus()}});
 }
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.crp-nav-group'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 inner.append(nav);
 const action=el('a','site-action','Ver carreras ↗');action.href='/stadiums/crypto/live/';inner.append(action);header.append(inner);
 existing.replaceWith(header);
 document.documentElement.classList.add('crp-navigation-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
