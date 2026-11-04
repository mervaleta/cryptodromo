const base=process.env.CRP_BASE_URL||'https://race.cryptodromo.com';
const checks=[
 ['/stadiums/crypto/live/index.html',[/id="tv-env-deck"/,/data-tv-weather="rain"/,/data-tv-hour="1050"/,/data-tv-light="power"/,/winner-slowmo-env-20261104-v1/]],
 ['/stadiums/crypto/broadcast/index.html',[/id="winner-replay"/,/winner-replay-env-20261104-v1/]],
 ['/visual-lab/index.html',[/id="winner-replay"/,/winner-replay-env-20261104-v1/]],
 ['/visual-lab/scene.js',[/createWinnerSlowMotion/,/startWinnerReplay\(/,/winnerReplay\.advance\(realSeconds\)/]],
 ['/visual-lab/winnerSlowMotion.js',[/WINNER_REPLAY_DURATION=7\.2/,/sourceSpan=WINNER_REPLAY_SOURCE_SPAN/]],
 ['/assets/satoshi-tv-environment.js',[/createTvEnvironmentDeck/,/change\(doc,'light-power'/,/change\(doc,'daytime-auto'/]],
 ['/assets/crypto-venue.js',[/createTvEnvironmentDeck/,/environmentDeck\.apply\(\)/]]
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=[];
for(let attempt=1;attempt<=8;attempt++){
 failed=[];
 console.log('HOSTINGER REPLAY+ENV DEPLOY',attempt);
 await Promise.all(checks.map(async([path,patterns])=>{
  try{
   const u=new URL(path,base);u.searchParams.set('build','winner-slowmo-env-20261104-v1-'+attempt);
   const response=await fetch(u,{signal:AbortSignal.timeout(20000),
    headers:{'Cache-Control':'no-store'},redirect:'follow'});
   const text=await response.text();
   const missing=patterns.filter(re=>!re.test(text));
   if(response.status!==200||missing.length||/id="stadium-broadcast"/.test(text)&&path.includes('/broadcast/'))
    failed.push(path+' HTTP '+response.status+' missing '+missing.map(String).join(' ')+' bytes '+text.length);
   else console.log('PASS',path,response.status,text.length);
  }catch(e){failed.push(path+': '+String(e));}
 }));
 if(!failed.length)break;
 console.log('PENDING',failed.join(' | ').slice(0,1900));
 if(attempt<8)await sleep(16000);
}
if(failed.length)throw new Error('Latest replay/environment build not serving: '+failed.join('; '));
console.log('PASS Hostinger delivers updated winner slow-mo and real stadium director control modules');
