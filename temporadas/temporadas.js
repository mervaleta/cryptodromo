import {assertSeasonSnapshot,historicalPalmares,currentSeasonStart} from '../sports/seasonArchive.js';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('es-AR');
$('season-cycle').textContent=currentSeasonStart();
async function verifyChecksum(body,expected){
 if(typeof expected!=='string'||! /^[a-f0-9]{64}$/.test(expected))throw new Error('Checksum inválido');
 if(!globalThis.crypto?.subtle)throw new Error('Este navegador no permite validar SHA-256');
 const data=new TextEncoder().encode(body);
 const digest=await crypto.subtle.digest('SHA-256',data);
 const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw new Error('El archivo fue modificado: checksum diferente');
}
async function readArchives(){
 const response=await fetch('./data/index.json',{cache:'no-store'});
 if(!response.ok)throw new Error('No se pudo leer el índice');
 const index=await response.json();
 if(index.contract!=='cryptodromo.synthetic-season-index.v1'||!Array.isArray(index.seasons)||index.seasons.length>200)
  throw new Error('Índice de temporadas inválido');
 const files=[];
 for(const entry of index.seasons){
  if(! /^\d{4}-\d{2}-\d{2}\.json$/.test(entry.file||'')||entry.start+'.json'!==entry.file)
   throw new Error('Ruta de temporada inválida');
  const r=await fetch('./data/'+entry.file,{cache:'no-store'});
  if(!r.ok)throw new Error('Falta temporada: '+entry.start);
  const text=await r.text();
  await verifyChecksum(text,entry.sha256);
  const snapshot=JSON.parse(text);
  assertSeasonSnapshot(snapshot);
  if(snapshot.start!==entry.start||snapshot.endExclusive!==entry.endExclusive)
   throw new Error('Fecha de temporada incompatible');
  files.push(snapshot);
 }
 return files;
}
const rows=(profiles)=>{
 const tbody=$('season-ranks');tbody.replaceChildren();
 for(const [i,p] of profiles.slice(0,50).entries()){
  if(!p.trophies&&!p.points)continue;
  const tr=document.createElement('tr');
  const values=[String(i+1),p.symbol,String(p.seasons),String(p.trophies),String(p.wins),fmt(p.points)];
  values.forEach((value,j)=>{
   const td=document.createElement('td');
   if(j===1){const a=document.createElement('a');a.href='/racers/#'+encodeURIComponent(p.symbol);a.textContent=value;td.append(a);}
   else td.textContent=value;
   tr.append(td);
  });
  tbody.append(tr);
 }
};
function showSnapshots(snapshots){
 const target=$('season-list');
 target.replaceChildren();
 if(!snapshots.length){
  target.textContent='Todavía no existe una semana cerrada y archivada. El primer ciclo comenzó el 2 de noviembre de 2026. El registro no inventa resultados históricos.';
  $('season-status').textContent='Índice correcto · 0 temporadas verificadas';
  return;
 }
 const palmares=historicalPalmares(snapshots);
 const trophies=palmares.reduce((sum,p)=>sum+p.trophies,0);
 $('season-count').textContent=String(snapshots.length);
 $('trophy-count').textContent=fmt(trophies);
 $('season-status').textContent=snapshots.length+' semanas verificadas con checksum y contrato deportivo reproducible.';
 for(const s of [...snapshots].reverse()){
  const box=document.createElement('div');box.className='data-row';
  const title=document.createElement('strong');title.textContent=s.start+' al '+s.endExclusive+' (fin excluido)';
  const desc=document.createElement('p');desc.className='muted';
  desc.textContent='28 Grandes Premios · campeón de la simulación '+s.standings[0].symbol+' · '+s.fixtureVersion+' · ciclo predeterminado';
  const a=document.createElement('a');a.href='./data/'+s.start+'.json';a.textContent='Consultar acta JSON';
  box.append(title,desc,a);target.append(box);
 }
 rows(palmares);
}
readArchives().then(showSnapshots).catch(error=>{
 $('season-status').textContent='Archivo sin verificar: '+error.message;
 $('season-count').textContent='—';
 $('trophy-count').textContent='—';
 $('season-list').textContent='Por seguridad, los archivos dañados o incompletos no se muestran como palmarés certificado.';
 console.error('Cryptódromo synthetic-season archive:',error);
});
