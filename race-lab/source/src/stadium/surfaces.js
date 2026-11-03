/**
 * Deterministic, dependency-free procedural surfaces for the stadium family.
 * No remote images, texture downloads or animation-frame canvas work.
 * All textures are built once and disposed explicitly by the caller.
 */
export function createStadiumSurfaces({THREE,seed=1,resolution=128}={}){
  if(!THREE)throw new Error('THREE is required');
  if(!Number.isInteger(resolution)||resolution<32||resolution>512)throw new RangeError('resolution 32..512');
  let state=(seed>>>0)||1;
  const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  const textures=new Set();
  function make(kind,{repeatX=1,repeatY=1}={}){
    const size=resolution, data=new Uint8Array(size*size*4);
    const stones=Array.from({length:64},()=>rnd());
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4,grain=(rnd()-.5)*21;
      let r=128,g=128,b=128;
      if(kind==='stone'){
        const mortar=(x%Math.floor(size/8)<2)||(y%Math.floor(size/8)<2);
        const cell=(Math.floor(x/(size/8))+Math.floor(y/(size/8))*8)%64;
        const v=stones[cell]*20+grain;
        [r,g,b]=mortar?[101,99,88]:[183+v,174+v,155+v];
      }else if(kind==='roof'){
        const seam=x%Math.floor(size/10)<2||y%Math.floor(size/6)<2;
        const v=grain+(seam?-24:0);
        [r,g,b]=[64+v,75+v,78+v];
      }else if(kind==='gravel'){
        const v=grain*2.1+(rnd()>.93?40:0);
        [r,g,b]=[143+v,113+v,86+v];
      }else if(kind==='grass'){
        const v=grain*1.6+(Math.sin(x*.32)*Math.cos(y*.37))*7;
        [r,g,b]=[68+v,111+v,67+v];
      }else if(kind==='paving'){
        const seam=x%Math.floor(size/8)<2||y%Math.floor(size/8)<2;
        const v=grain+(seam?-28:0);
        [r,g,b]=[149+v,151+v,138+v];
      }else throw new Error('Unknown surface: '+kind);
      data[i]=Math.max(0,Math.min(255,r));
      data[i+1]=Math.max(0,Math.min(255,g));
      data[i+2]=Math.max(0,Math.min(255,b));data[i+3]=255;
    }
    const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;
    t.generateMipmaps=true;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;
    t.userData.stadiumSurface=kind;textures.add(t);return t;
  }
  function dispose(){for(const t of textures)t.dispose();textures.clear();}
  return {make,dispose,get count(){return textures.size;}};
}
