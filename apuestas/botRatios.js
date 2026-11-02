/**
 * Illustrative bot consensus for the synthetic paddock ONLY.
 * Uses aggregate synthetic form from the complete repeatable fixture.
 * It is not a forward-looking model, a betting market, or an offered price.
 */
export const BOTS=Object.freeze([
 {id:'form',name:'El Estadístico',description:'Pondera triunfos por participación, suavizados para evitar extremos.'},
 {id:'regularity',name:'La Regularidad',description:'Pondera podios y posición media, evitando un favorito por una sola victoria.'},
 {id:'story',name:'El Cronista',description:'Prefiere categorías con más presencia y pequeños caballos revelación.'}
]);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function illustrativeRatios(entries,stats){
 if(!Array.isArray(entries)||entries.length!==12)throw Error('Se requieren doce corredores');
 const formulas={
  form:(runner,st)=>.015+(st.wins+2)/(st.starts+30),
  regularity:(runner,st)=>.035+(st.podiums+3)/(st.starts+18)*clamp((13-st.averagePlace)/7,.25,1.7),
  story:(runner,st)=>(runner.tier==='star'?1.35:runner.tier==='core'?1.08:.92)*
    (.28+(st.podiums+3)/(st.starts+18))*
    (runner.tier==='challenger'?1.07:1)
 };
 const details=BOTS.map(bot=>{
  const weight=entries.map(entry=>{
   const st=stats.get(entry.symbol);
   if(!st)throw Error('Sin estadísticas para '+entry.symbol);
   return clamp(formulas[bot.id](entry,st),.0001,100);
  });
  const sum=weight.reduce((a,b)=>a+b,0);
  return {bot,...entries.map((entry,i)=>({symbol:entry.symbol,probability:weight[i]/sum}))};
 });
 const results=entries.map((entry,i)=>{
  const p=details.reduce((sum,bot)=>sum+bot[i].probability,0)/details.length;
  return {symbol:entry.symbol,name:entry.name,color:entry.color,tier:entry.tier,
   probability:p,percent:p*100,fairRatio:1/p};
 }).sort((a,b)=>b.probability-a.probability||a.symbol.localeCompare(b.symbol));
 return {results,bots:details.map(({bot,...positions})=>({
  bot,ranking:Object.values(positions).sort((a,b)=>b.probability-a.probability).slice(0,3)
 }))};
}
