/** Cryptodromo Horse Master v1: vector layers traced from original BAT gallop poses.
 * Palette/lighting/dust are independent of motion and financial scoring.
 * No external PNG, shaders or model files needed. Renderer consumes pure SVG path data.
 */
export const MASTER_VERSION='horse-vector-1.0';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const rgba=(hex,a=1)=>{const c=hex.replace('#','');const n=parseInt(c.length===3?c.split('').map(x=>x+x).join(''):c,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;};
export function shade(hex,factor=1){const c=hex.replace('#','');const rgb=(c.length===3?c.split('').map(v=>parseInt(v+v,16)):Array.from({length:3},(_,i)=>parseInt(c.slice(i*2,i*2+2),16)));return '#'+rgb.map(v=>Math.round(clamp(v*factor,0,255)).toString(16).padStart(2,'0')).join('');}
const fromHex=(hex)=>{const c=hex.replace('#','');const s=c.length===3?c.split('').map(x=>x+x).join(''):c;return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255);};
const hsl=(hex)=>{const [r,g,b]=fromHex(hex),ma=Math.max(r,g,b),mi=Math.min(r,g,b),d=ma-mi;let h=0,s=0,l=(ma+mi)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(ma){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;}return [(h+360)%360,s,l];};
const toHexHSL=(h,s,l)=>{const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12,c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(c*255).toString(16).padStart(2,'0');};return '#'+f(0)+f(8)+f(4);};
export function paletteForToken(token={}){
 const accent=token.color||'#f7931a',coat=accent,[h,s]=hsl(accent);
 return {
   coat,
   shade:shade(coat,.65),
   legs:shade(coat,.83),
   mane:toHexHSL((h+295)%360,.68,.27),
   maneDark:toHexHSL((h+285)%360,.59,.14),
   tail:toHexHSL((h+295)%360,.68,.27),
   hoof:toHexHSL((h+295)%360,.48,.17),
   bridle:'#cfc9b9',
   outline:'#111016',
   accent,
 };
}
const pathsCache = new WeakMap();
function compiled(master){
 let result=pathsCache.get(master);
 if(result)return result;
 result=master.frames.map(f=>Object.fromEntries(Object.entries(f.paths).map(([key,v])=>[key,v?new Path2D(v):null])));
 pathsCache.set(master,result);return result;
}
function fill(ctx,path,style){if(!path)return;ctx.fillStyle=style;ctx.fill(path,'evenodd');}
function fillEllipse(ctx,x,y,rx,ry,color){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const grd=ctx.createRadialGradient(0,0,0,0,0,1);grd.addColorStop(0,color);grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
const hashString=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
const prng=(seed)=>{let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};};
function dust(ctx,phase,level,seed=0){
 if(level<=0)return;
 const random=prng(hashString('dust:'+seed));
 ctx.save();ctx.globalCompositeOperation='source-over';
 // Local ground-puff system: 3 lifecycles looping independently of the market clock.
 for(let p=0;p<18;p++){
  const born=p/18;const age=(phase+1-born)%1;
  const x=70-random()*20-age*(16+random()*17);
  const y=159+random()*7-age*(8+random()*9);
  const r=3.5+random()*7.0+age*5.0;
  const alpha=clamp((1-age)*.42*level)*clamp(age*15);
  fillEllipse(ctx,x,y,r,r*.46,`rgba(168,144,110,${alpha.toFixed(3)})`);
 }
 ctx.restore();
}
export function drawHorse(ctx,master,{frame=0,palette={},dustLevel=.5,shadowLevel=.75,scale=1,offsetX=0,offsetY=0,seed=0,detail=true}={}){
 if(!master||!master.frames||master.frames.length!==12)throw Error('Horse master should include exactly 12 frames');
 const idx=((Math.floor(frame)%12)+12)%12;
 const raw=master.frames[idx],layers=compiled(master)[idx];
 const c={...paletteForToken(),...palette};
 ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);
 // Contact/ambient shadows stay on the ground. They do not affect alpha silhouette.
 if(shadowLevel>0){fillEllipse(ctx,101,166,56,7.3,`rgba(8,12,10,${(.34*shadowLevel).toFixed(3)})`);
   fillEllipse(ctx,102,168,43,3.4,`rgba(8,12,10,${(.22*shadowLevel).toFixed(3)})`);}
 dust(ctx,idx/12,dustLevel,seed);
 // Unchanged artwork silhouettes, painted in parameterized colors.
 fill(ctx,layers.ink,c.outline);
 fill(ctx,layers.coat,c.coat);
 if(detail&&layers.coat){
   ctx.save();ctx.clip(layers.coat,'evenodd');
   fillEllipse(ctx,103,108,47,24,'rgba(255,248,220,.26)');
   fillEllipse(ctx,88,139,55,23,`rgba(30,20,26,${(.29*shadowLevel).toFixed(3)})`);
   fillEllipse(ctx,143,112,22,23,'rgba(255,255,255,.13)');
   ctx.restore();
 }
 fill(ctx,layers.shade,c.shade);
 if(layers.legs&&c.legs){fill(ctx,layers.legs,c.legs);}
 const maneGrad=ctx.createLinearGradient(70,80,130,125);
 maneGrad.addColorStop(0,shade(c.mane,1.16));maneGrad.addColorStop(.72,c.mane);maneGrad.addColorStop(1,shade(c.mane,.78));
 fill(ctx,layers.mane,maneGrad);
 fill(ctx,layers.maneDark,c.maneDark);
 // Tail occupies the leftmost part of the mane mask. Colorize its area independently.
 if(layers.mane){ctx.save();ctx.beginPath();ctx.rect(0,55,90,80);ctx.clip();fill(ctx,layers.mane,c.tail);ctx.restore();}
 fill(ctx,layers.hoof,c.hoof);
 fill(ctx,layers.gear,c.bridle);
 // Ink contours are deliberately redrawn last to preserve the 12 original key poses.
 // A small global alpha avoids over-thickening the lines at high zoom.
 ctx.globalAlpha=.88;
 fill(ctx,layers.ink,c.outline);
 ctx.globalAlpha=1;
 ctx.restore();
}
export function makeFrameCanvas(master,{width=680,height=680,...options}={}){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;
 drawHorse(ctx,master,{...options,scale:Math.min(width/170,height/170),offsetX:(width-Math.min(width,height))/2,offsetY:(height-Math.min(width,height))/2});return canvas;
}
// A single-frame CanvasTexture instance that can be reused by Three.js Sprite or Plane meshes.
export function createVectorHorseTexture(THREE,master,token,{size=512,fps=12,zoomToArt=true}={}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 let current=-1,lastPalette=paletteForToken(token),dustLevel=.5,shadowLevel=.75;
 function paint(frame){ctx.clearRect(0,0,size,size);const scale=zoomToArt?size/158:size/170;const offsetX=zoomToArt?-12*scale:0;const offsetY=zoomToArt?size*.5-124*scale:0;drawHorse(ctx,master,{frame,palette:lastPalette,scale,offsetX,offsetY,dustLevel,shadowLevel,seed:hashString(token?.symbol||'BTC')});texture.needsUpdate=true;}
 return {
  texture,canvas,
  update(seconds){const frame=Math.floor(seconds*fps)%12;if(frame!==current){current=frame;paint(frame);}},
  setStyle({palette,dust,shadow}={}){if(palette)lastPalette={...lastPalette,...palette};if(dust!==undefined)dustLevel=dust;if(shadow!==undefined)shadowLevel=shadow;current=-1;},
  dispose(){texture.dispose();}
 };
}