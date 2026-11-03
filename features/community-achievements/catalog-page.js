import {renderBadgeAlbum} from '/features/community-achievements/album.js';
const RAW=[["founder","Primer casco","Creaste tu identidad en el hipódromo.","bienvenida","common","horseshoe",1],["first_visit","Puertas abiertas","Tu primera visita registrada.","bienvenida","common","ticket",1],["first_race","En la tribuna","Presenciaste una carrera completa.","aficion","common","grandstand",1],["grandstand_5","Habitual de tribuna","Presenciaste cinco carreras diferentes.","aficion","uncommon","grandstand",5],["grandstand_25","Abonado de pista","Presenciaste 25 carreras diferentes.","aficion","rare","grandstand",25],["photo_finish","Ojo de halcón","Viste una llegada hasta el resultado.","aficion","common","finish",1],["replay_5","Archivo de carrera","Revisaste cinco carreras diferentes.","aficion","uncommon","film",5],["explorer_5","Conocedor del paddock","Exploraste cinco corredores distintos.","exploracion","common","horse",5],["explorer_25","Cronista del paddock","Exploraste 25 corredores distintos.","exploracion","rare","horse",25],["token_historian","Memoria del estadio","Leíste la historia del Cryptódromo.","exploracion","common","book",1],["weather_watcher","Cazador de nubes","Viste carreras con tres climas diferentes.","exploracion","uncommon","cloud",3],["profile_complete","Identidad de pista","Completaste tu perfil comunitario.","comunidad","common","profile",1],["first_favorite","Un favorito","Elegiste tu primer corredor favorito.","comunidad","common","heart",1],["collector_5","Coleccionista de corredores","Guardaste cinco corredores distintos.","comunidad","uncommon","heart",5],["curator","Vitrina personal","Exhibiste tres insignias desbloqueadas.","comunidad","uncommon","gallery",1],["first_post","Voz de tribuna","Publicaste tu primer aporte aprobado.","comunidad","common","megaphone",1],["opening_day","Día inaugural","Recuerdo especial de inauguración.","especial","legendary","star",1],["seven_days","Siete jornadas","Participaste en siete fechas distintas, no consecutivas.","especial","rare","calendar",7]];
const badges=RAW.map(([code,title,description,category,rarity,icon_key,target_count])=>({code,title,description,category,rarity,icon_key,target_count,unlocked:false,progress:0,showcase_slot:null}));
const root=document.querySelector('#badge-album');
const filters=document.querySelector('#badge-filters');
const demoButton=document.querySelector('#demo-album');
const note=document.querySelector('#album-note');
let category='todos',preview=false;
const labels={todos:'Todas',bienvenida:'Bienvenida',aficion:'Afición',exploracion:'Exploración',comunidad:'Comunidad',especial:'Especiales'};
for(const [key,label] of Object.entries(labels)){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.category=key;b.setAttribute('aria-pressed',String(key===category));
 b.addEventListener('click',()=>{category=key;for(const child of filters.children)child.setAttribute('aria-pressed',String(child.dataset.category===key));render();});
 filters.append(b);
}
function render(){
 const chosen=badges.filter(b=>category==='todos'||b.category===category).map(b=>({...b}));
 if(preview){
  for(const b of chosen){if(['founder','first_visit','first_race','explorer_5','photo_finish'].includes(b.code)){b.unlocked=true;b.progress=b.target_count;}}
  for(const b of chosen){const slot=['founder','first_race','photo_finish'].indexOf(b.code);if(slot!==-1)b.showcase_slot=slot+1;}
 }
 renderBadgeAlbum(root,{badges:chosen});
 note.textContent=preview?'VISTA DE EJEMPLO: insignias ficticias, no asociadas a una cuenta.':'Catálogo público: los logros se desbloquearán al habilitar perfiles y sesiones verificadas.';
 demoButton.textContent=preview?'Volver al catálogo':'Ver ejemplo de colección';
 demoButton.setAttribute('aria-pressed',String(preview));
}
demoButton.addEventListener('click',()=>{preview=!preview;render();});
render();
