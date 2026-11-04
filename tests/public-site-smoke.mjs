/**
 * Production smoke for the Hostinger mirror.
 * Independent from horse model, shaders, cameras and official race results.
 * Intentionally issues only safe GET requests and one unauthorized POST.
 */
const origin=process.env.CRP_BASE_URL || 'https://race.cryptodromo.com';
const base=new URL(origin);
if(!['https:'].includes(base.protocol))throw new Error('CRP_BASE_URL must use HTTPS');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(path,options={}){
 const response=await fetch(new URL(path,base),{
  redirect:'follow',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000),...options
 });
 const body=await response.text();
 return {status:response.status,body,url:response.url};
}
const pages=['/','/racers/','/fixture/','/resultados/','/estadisticas/','/grandes-premios/','/institucional/','/como-funciona.html','/juego-responsable.html'];
async function inspect(){
 const problems=[];
 for(const page of pages){
  try{
   const response=await request(page+'?verify=site-20261104');
   if(response.status!==200||!/<title[^>]*>/i.test(response.body)||!/crypt[oó]dromo/i.test(response.body))
    problems.push(page+' returned '+response.status+' or invalid HTML');
   else console.log('OK',page,response.status,response.body.length+' bytes');
  }catch(error){problems.push(page+': '+error.message);}
 }
 for(const [path,pattern] of [['/robots.txt',/Disallow: \/admin\//],['/sitemap.xml',/https:\/\/race\.cryptodromo\.com\/racers\//]]){
  try{const r=await request(path+'?verify=site-20261104');if(r.status!==200||!pattern.test(r.body))problems.push(path+' unavailable or old ('+r.status+')');else console.log('OK',path);}
  catch(error){problems.push(path+': '+error.message)}
 }
 // Fail closed: public deployment endpoints should never accept requests.
 try{const r=await request('/deploy.php?verify=site-20261104');if(r.status!==410)problems.push('/deploy.php expected 410, got '+r.status);else console.log('OK retired deploy endpoint');}
 catch(error){problems.push('/deploy.php: '+error.message)}
 // Sending an identity assertion without a signed Google ID token must never create a user.
 try{
  const r=await request('/api/auth.php?action=login_google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'fake@example.invalid',google_id:'not-a-google-token'})});
  if(r.status===200 && /"status"\s*:\s*"success"/i.test(r.body))problems.push('CRITICAL: unauthenticated login was accepted');
  else console.log('OK spoofed login denied',r.status);
 }catch(error){problems.push('/api/auth.php spoofed login check: '+error.message)}
 return problems;
}
let errors=[];
for(let attempt=1;attempt<=3;attempt++){
 console.log('Public site attempt',attempt);
 errors=await inspect();
 if(errors.length===0)break;
 if(attempt<3)await sleep(12000);
}
if(errors.length){console.error('Production needs deployment verification:\n'+errors.join('\n'));process.exitCode=1;}
else console.log('PASS: all public web routes, site metadata, and blocked legacy endpoints');
