/**
 * Alpha20 gate placards with optional local cryptocurrency logos.
 * Presentation only: lane = fixture entries[index], never changes race results.
 * 12 reusable CanvasTextures; images are shared and asynchronous repainting
 * is guarded against a fixture change while a logo is loading.
 */
const LOCAL_LOGOS=new Set(('1INCH AAVE ADA ALGO ATOM AVAX BAT BCH BNB BTC CHZ COMP CRV DASH DOGE DOT ENJ ETC ETH FIL GNO GRT ICP KCS KSM LINK LPT LTC MANA NEO QNT RAY SAND SNX SOL STX SUSHI THETA TRX UNI VET XLM XMR XRP XTZ ZEC ZIL').split(' '));
export function localGateLogoUrl(symbol){
 const clean=typeof symbol==='string'?symbol.trim().toUpperCase():'';
 return LOCAL_LOGOS.has(clean)?'/assets/crypto-logos/'+clean.toLowerCase()+'.svg':null;
}
export function gateLogoCandidates(symbol){
 const clean=typeof symbol==='string'?symbol.trim().toUpperCase():'';
 if(!/^[A-Z0-9]{2,12}$/.test(clean))return [];
 // Prefer local files. Published horse logos can cover other tokens.
 return [localGateLogoUrl(clean),'/api/horse-logo.php?symbol='+encodeURIComponent(clean)].filter(Boolean);
}
export function attachGateNumbers({THREE,root,entries,startX=-390}){
 if(!THREE?.CanvasTexture||typeof document==='undefined')throw new Error('Browser + THREE.CanvasTexture required');
 if(!root||!Array.isArray(entries)||entries.length!==12)throw new Error('12 entries and a gate root are required');
 const group=new THREE.Group();group.name='Alpha20 numbered and branded stall signs';root.add(group);
 const mats=[],textures=[],geometries=[],planes=[],canvases=[],contexts=[];
 const imageCache=new Map();
 let generation=0,disposed=false;
 function imageAt(url){
  if(!imageCache.has(url)){
   imageCache.set(url,new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.decoding='async';
    img.src=url;
   }));
  }
  return imageCache.get(url);
 }
 async function loadLogo(symbol){
  for(const url of gateLogoCandidates(symbol)){
   const img=await imageAt(url);
   if(img)return img;
  }
  return null;
 }
 function draw(i,entry,logo){
  const ctx=contexts[i],canvas=canvases[i],texture=textures[i];
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const color=typeof entry.color==='string'&&/^#[0-9a-f]{3,8}$/i.test(entry.color)?entry.color:'#2cd9a3';
  const symbol=typeof entry.symbol==='string'?entry.symbol.slice(0,12).toUpperCase():'?';
  ctx.fillStyle='#0c1815';ctx.fillRect(0,0,512,256);
  ctx.fillStyle=color;ctx.fillRect(8,8,496,240);
  ctx.fillStyle='#111a16';ctx.fillRect(24,24,464,208);
  ctx.fillStyle=color;ctx.fillRect(33,33,446,190);
  if(logo){
   // Dark backing gives white and pale token marks consistent contrast.
   ctx.fillStyle='#101c1b';ctx.beginPath();ctx.roundRect(44,65,118,118,15);ctx.fill();
   try{
    const iw=logo.naturalWidth||logo.width,ih=logo.naturalHeight||logo.height;
    const scale=Math.min(100/iw,100/ih);
    ctx.drawImage(logo,103-iw*scale/2,124-ih*scale/2,iw*scale,ih*scale);
   }catch{logo=null;}
  }
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=logo?'900 148px Arial,sans-serif':'900 155px Arial,sans-serif';
  ctx.strokeStyle='#07110c';ctx.lineWidth=10;
  const x=logo?327:256;
  ctx.strokeText(String(i+1),x,119);ctx.fillText(String(i+1),x,119);
  ctx.font='bold 40px Arial,sans-serif';
  ctx.strokeText(symbol,logo?310:256,216);ctx.fillText(symbol,logo?310:256,216);
  texture.needsUpdate=true;
 }
 for(let i=0;i<12;i++){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  canvases.push(canvas);contexts.push(canvas.getContext('2d'));
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  textures.push(texture);
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,map:texture});mats.push(material);
  const geometry=new THREE.PlaneGeometry(1.54,.65);geometries.push(geometry);
  const plane=new THREE.Mesh(geometry,material);plane.rotation.y=Math.PI/2;
  plane.position.set(startX-3.6+2.37,3.41,(i-5.5)*2.55);
  group.add(plane);planes.push(plane);
 }
 function setEntries(next){
  if(!Array.isArray(next)||next.length!==12)throw new Error('12 entries required');
  const version=++generation;
  next.forEach((entry,i)=>{
   draw(i,entry,null); // Fast first paint, no missing/broken signage.
   if(!gateLogoCandidates(entry.symbol).length)return;
   loadLogo(entry.symbol).then(img=>{
    if(!disposed&&generation===version&&img)draw(i,entry,img);
   });
  });
 }
 function dispose(){
  disposed=true;generation++;
  group.parent?.remove(group);
  textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
  imageCache.clear();
 }
 setEntries(entries);
 return {root:group,setEntries,dispose};
}
