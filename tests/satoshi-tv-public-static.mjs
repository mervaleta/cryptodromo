const host=process.env.CRP_BASE_URL||'https://race.cryptodromo.com';
const resources=[
 ['/stadiums/crypto/live/',/id="tv-player"/],
 ['/stadiums/crypto/broadcast/index.html',/id="raceCanvas"/],
 ['/assets/crypto-venue.js',/findRacePlayerSource/],
 ['/assets/crypto-archive.js',/Ver repetición en TV/],
 ['/race-lab/source/src/data/raceFixture.js',/getContinuousFixturePrice/],
 ['/race-lab/source/src/data/tripleRaceFixture.js',/alpha19-triple-v2-continuous-week/]
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let bad=[];
for(let attempt=1;attempt<=5;attempt++){
 bad=[];
 console.log('PUBLIC HOSTINGER SOURCE CHECK',attempt);
 await Promise.all(resources.map(async([path,pattern])=>{
  let status=0,text='';
  try{
   const url=new URL(path,host);
   url.searchParams.set('verify','tv-public-source-20261104-'+attempt);
   const r=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'follow',
    headers:{'Cache-Control':'no-store'}});
   status=r.status;text=await r.text();
   if(status!==200||!pattern.test(text))bad.push(path+' returned '+status+' bytes='+text.length+' missing '+pattern);
   console.log(path,status,text.length,'marker',pattern.test(text));
  }catch(e){bad.push(path+' '+e.message);}
 }));
 if(!bad.length)break;
 console.log('MISSING:',bad.join(' | '));
 if(attempt<5)await sleep(9000);
}
if(bad.length)throw new Error('Hostinger source not deployed: '+bad.join('; '));
console.log('PASS: public website serves Satoshi TV, broadcast stage, archive, seven-day continuous fixture');
