import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../resultados/priceTransparency.js', import.meta.url), 'utf8');
const {buildPublicPriceInputs} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const entries = Array.from({length:12}, (_,i) => {
  const start = 100 + i;
  const mid = start * 1.001;
  const finish = mid * 1.002;
  return {
    symbol:'T'+i,name:'Token '+i,priceAtStart:start,priceAtMid:mid,priceAtFinish:finish,
    input1:100*(mid/start-1),input2:100*(finish/mid-1),
    coefficients1:[-10,-5,1,5,10,15,20,25,30],coefficients2:[20,40,60]
  };
});
const race={day:1,number:7,entries};
const ranking=[...entries].reverse().map(entry=>({entry}));
const audit=buildPublicPriceInputs(race,ranking);
assert.equal(audit.rows.length,12);
assert.equal(audit.inputCount,24);
assert.equal(audit.priceCount,36);
assert.equal(audit.rows[0].symbol,'T11');
assert.equal(audit.rows[11].position,12);
assert.equal(audit.rows[0].prices[0],String(entries[11].priceAtStart));
assert.ok(!JSON.stringify(audit).includes('coefficients'));
assert.ok(!JSON.stringify(audit).includes('input1'));
assert.throws(()=>buildPublicPriceInputs({day:1,number:7,entries:entries.slice(1)},ranking),/doce/);
const damaged=entries.map((entry,i)=>i===0?{...entry,input1:44}:entry);
assert.throws(()=>buildPublicPriceInputs({...race,entries:damaged},ranking),/no coinciden/);
assert.throws(()=>buildPublicPriceInputs(race,[ranking[0],...ranking.slice(0,11)]),/Clasificación inválida/);
console.log('Transparencia CRP: 12 filas, 24 variaciones, 36 cotizaciones, sin datos privados OK');
