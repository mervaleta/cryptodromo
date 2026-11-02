import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js?v=coat-20261102';
import {getRaceFixture,RACES_PER_DAY,FIXTURE_DAYS} from '../race-lab/source/src/data/raceFixture.js?v=alpha03-coats-2';
import {createOfficialRace,officialRanking} from '../race-lab/source/src/data/officialRace.js?v=crp-20261102';

let cache;
export function buildRosterStats(){
 if(cache)return cache;
 const map=new Map(TOKEN_ROSTER.map(token=>[token.symbol,{
   symbol:token.symbol,name:token.name,tier:token.tier,color:token.color,coat:token.coat,
   starts:0,wins:0,podiums:0,totalFinish:0,bestPlace:12,totalChange:0
 }]));
 for(let day=0;day<FIXTURE_DAYS;day++)for(let index=0;index<RACES_PER_DAY;index++){
   const official=officialRanking(createOfficialRace(getRaceFixture(index,day).entries));
   official.forEach((p,position)=>{
     const st=map.get(p.entry.symbol);
     st.starts++;st.totalFinish+=position+1;
     st.bestPlace=Math.min(st.bestPlace,position+1);
     st.totalChange+=p.input1+p.input2;
     if(position===0)st.wins++;
     if(position<3)st.podiums++;
   });
 }
 for(const st of map.values()){
  st.winRatePct=st.starts?100*st.wins/st.starts:0;
  st.podiumPct=st.starts?100*st.podiums/st.starts:0;
  st.averagePlace=st.starts?st.totalFinish/st.starts:0;
  st.averagePriceMove=st.starts?st.totalChange/st.starts:0;
  Object.freeze(st);
 }
 cache=map;
 return map;
}
export function horseBiography(token,stats){
 const level=token.tier==='star'?'estrella del fixture':token.tier==='core'?'corredor de la categoría principal':'desafiante del campeonato';
 const appearance='Su pelaje '+token.coat.toUpperCase()+' y la identificación '+token.color.toUpperCase()+
   ' distinguen al caballo que representa a '+token.name+' ('+token.symbol+').';
 const history=stats?('En las siete jornadas sintéticas acumula '+stats.starts+' participaciones, '+
  stats.wins+' victorias y '+stats.podiums+' podios.'):'Sus estadísticas se calculan exclusivamente con las carreras sintéticas.';
 return 'Identidad ficticia de pista: '+token.symbol+' es '+level+'. '+appearance+' '+history+
   ' Su desempeño depende solamente de las variaciones de precio simuladas.';
}
