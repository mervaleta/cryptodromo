#!/usr/bin/env node
// Export exactly the same deterministic synthetic-v1 prices as the current
// browser fixture. NO network access; run once to seed staging MySQL.
import { readFileSync, createWriteStream, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const source=readFileSync(resolve(root,'race-lab/source/src/data/tokenRoster.js'),'utf8');
const {TOKEN_ROSTER}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
if(TOKEN_ROSTER.length!==100||new Set(TOKEN_ROSTER.map(t=>t.symbol)).size!==100)throw Error('Expected 100 unique tokens');
const anchor=process.argv[2]||'2026-11-02';
if(!/^\d{4}-\d{2}-\d{2}$/.test(anchor)||Number.isNaN(Date.parse(anchor+'T00:00:00Z'))||
 new Date(anchor+'T00:00:00Z').toISOString().slice(0,10)!==anchor)throw Error('Expected YYYY-MM-DD UTC');
const dir=resolve(process.argv[3]||resolve(root,'backend/demo-data'));
mkdirSync(dir,{recursive:true});
const csvPath=resolve(dir,`prices-${anchor}-synthetic-v1.csv`);
const manifestPath=resolve(dir,`prices-${anchor}-synthetic-v1.json`);
const file=createWriteStream(csvPath,{encoding:'utf8',flags:'w'});
const sha=createHash('sha256');
const write=async s=>{sha.update(s);if(!file.write(s))await once(file,'drain')};
const hashText=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
function rng(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const gaussianish=r=>r()+r()+r()+r()-2;
const count=7*1440,startMs=Date.parse(anchor+'T00:00:00Z');
const timestamps=Array.from({length:count+1},(_,i)=>new Date(startMs+i*60000).toISOString().slice(0,19).replace('T',' '));
let rows=0;
await write('symbol,timestamp,price\n');
for(const token of TOKEN_ROSTER){
 const random=rng(hashText(`cryptodromo-synthetic-v1:${token.symbol}`));
 const volatility=token.tier==='star'?.055:token.tier==='core'?.078:.11;
 let price=.25+(hashText(token.symbol)%90000)/100;
 let block=`${token.symbol},${timestamps[0]},${Math.fround(price).toFixed(12)}\n`;rows++;
 for(let minute=0;minute<count;minute++){
  const wave=Math.sin((minute%1440)/1440*Math.PI*2+hashText(token.symbol)%31)*.009;
  const common=Math.sin(minute*.031)*.012+Math.sin(minute*.0067)*.009;
  let change=common+wave+gaussianish(random)*volatility;
  if(random()>(token.tier==='challenger'?.998:.9995))change+=gaussianish(random)*volatility*4;
  change=Math.max(-.72,Math.min(.72,change));
  price*=1+change/100;
  if(!Number.isFinite(price)||price<=0)throw Error('Invalid price '+token.symbol);
  block+=`${token.symbol},${timestamps[minute+1]},${Math.fround(price).toFixed(12)}\n`;rows++;
  if(block.length>65536){await write(block);block=''}
 }
 if(block)await write(block);
}
file.end();await once(file,'finish');
const manifest={
 code:'synthetic-v1',kind:'synthetic',live_connection:false,
 warning:'DATOS SINTÉTICOS - NO SON COTIZACIONES ACTUALES',
 anchor_utc:anchor,last_timestamp_utc:timestamps[count],
 days:7,minutes_per_day:1440,symbols:TOKEN_ROSTER.length,
 price_points_per_symbol:count+1,total_rows:rows,
 csv_file:basename(csvPath),csv_bytes:statSync(csvPath).size,csv_sha256:sha.digest('hex')
};
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({csvPath,manifestPath,...manifest},null,2));
