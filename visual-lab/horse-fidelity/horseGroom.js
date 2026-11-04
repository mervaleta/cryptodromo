/**
 * Alpha22 original geometric mane / forelock / tail. 3D crossed taper ribbons
 * in ONE mesh each, authored from deterministic seeds. No cards with PNG alpha.
 */
import {geometryBudget} from './horseGeometry.js';
const TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let s=(seed||1)>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function strandCount(style='sport',quality='balanced',part='mane'){
 const count=geometryBudget(quality).hair;
 const amount=style==='cropped'?.65:style==='flowing'?1.25:1;
 return Math.max(7,Math.round(count*amount*(part==='tail'?1.6:part==='forelock'?.28:1)));
}
export function makeHairGeometry(THREE,{part='mane',style='sport',quality='balanced',seed=1}={}){
 const rand=rng(seed+({mane:109,tail:347,forelock:991}[part]||1));
 const vertices=[],colors=[],indices=[],uvs=[];
 const count=strandCount(style,quality,part);
 const pivot=part==='mane'?[.73,2.32,0]:part==='tail'?[-1.01,1.82,0]:[1.18,2.60,0];
 const width=style==='cropped'?.008:.014;
 for(let i=0;i<count;i++){
  const r=rand(),a=rand(),f=(i+.5)/count;
  const strandLength=part==='tail'?
    (.70+rand()*.39)*(style==='sport'?.83:style==='flowing'?1.23:1):
    part==='mane'?(.21+rand()*.21)*(style==='cropped'?.55:style==='flowing'?1.32:1):
    (.18+rand()*.19)*(style==='cropped'?.52:1);
  const root=part==='mane'?
   [.53+f*.52,1.98+f*.55,(rand()-.5)*.21]:
   part==='tail'?[-.99-r*.13,1.83+(a-.5)*.12,(rand()-.5)*.19]:
   [1.12+r*.19,2.58+(a-.5)*.05,(rand()-.5)*.27];
  const rootRel=root.map((v,j)=>v-pivot[j]);
  const phi=TAU*rand(),sway=(rand()-.5)*.22;
  for(let plane=0;plane<2;plane++){
   const base=vertices.length/3;
   const numSegments=6;
   for(let k=0;k<=numSegments;k++){
    const t=k/numSegments,tipEase=t*t;
    let x=rootRel[0],y=rootRel[1],z=rootRel[2];
    if(part==='tail'){
     x-=strandLength*(.48*t+.16*tipEase);
     y-=strandLength*(.73*t+.23*tipEase);
     z+=sway*t+Math.sin(t*Math.PI*1.5+phi)*.028*tipEase;
    }else if(part==='forelock'){
     x+=strandLength*(.43*t+.27*tipEase);
     y-=strandLength*(.72*t+.10*tipEase);
     z+=sway*.35*t;
    }else{
     x-=strandLength*(.36*t+.13*tipEase);
     y-=strandLength*(.75*t+.1*tipEase);
     z+=sway*t*.32;
    }
    const w=width*(.8+.6*a)*(1-t)**1.1+.0003;
    for(const side of [-1,1]){
     const horizontal=plane===0?w*side:0,depth=plane===1?w*side:0;
     vertices.push(x+horizontal,y,z+depth);
     const light=.77+.22*r-.18*t;
     colors.push(light,light*.965,light*.91);
     uvs.push(t,side<0?0:1);
    }
   }
   for(let k=0;k<numSegments;k++){
    const a=base+k*2,b=a+1,c=a+2,d=a+3;
    indices.push(a,b,c,b,d,c);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 return {geometry,pivot,strands:count};
}
export function createProceduralGroom({THREE,parent,quality='balanced',
 seed=1,maneStyle='sport',tailStyle='natural',color='#251a19'}={}){
 const parts={};let wind=.4,clock=0,active=true;
 const material=new THREE.MeshStandardMaterial({
  color:new THREE.Color(color),vertexColors:true,side:THREE.DoubleSide,
  metalness:0,roughness:.78
 });
 function setup(part,style){
  const kit=makeHairGeometry(THREE,{part,style:style==='full'?'flowing':style==='natural'?'sport':style,
    quality,seed});
  const group=new THREE.Group();group.name='Procedural '+part+' pivot';
  group.position.set(...kit.pivot);
  const mesh=new THREE.Mesh(kit.geometry,material);
  mesh.name='Procedural '+part+' clumps';
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);parent.add(group);
  return {group,mesh,geometry:kit.geometry,strands:kit.strands};
 }
 function rebuild(){
  for(const record of Object.values(parts)){
   record.group.removeFromParent();record.geometry.dispose();
  }
  parts.mane=setup('mane',maneStyle);
  parts.forelock=setup('forelock',maneStyle);
  parts.tail=setup('tail',tailStyle);
 }
 rebuild();
 function update(delta,{phase=0,speed=0,windSpeed=wind,activeMotion=true}={}){
  if(!active||!activeMotion)return;
  const dt=Math.max(0,Math.min(.1,Number(delta)||0));
  clock+=dt;
  wind=Math.max(0,Math.min(2,windSpeed));
  const rate=Math.max(0,Math.min(3,speed));
  const bounce=Math.sin(TAU*phase);
  parts.mane.group.rotation.z=.019*bounce*rate+.014*Math.sin(clock*3.7+seed)*wind;
  parts.forelock.group.rotation.z=.026*bounce*rate+.014*Math.sin(clock*3.3+seed*.7);
  parts.tail.group.rotation.z=-.048*bounce*rate-.037*Math.sin(clock*2.6+seed*.11)*wind;
  parts.tail.group.rotation.x=.034*Math.sin(clock*1.9+seed);
 }
 function setAppearance({maneColor,style,tail}={}){
  if(maneColor)material.color.set(maneColor);
  let changed=false;
  if(style&&style!==maneStyle){maneStyle=style;changed=true;}
  if(tail&&tail!==tailStyle){tailStyle=tail;changed=true;}
  if(changed)rebuild();
 }
 function setQuality(next){if(next===quality)return;quality=next;rebuild();}
 function dispose(){
  active=false;
  for(const record of Object.values(parts)){record.group.removeFromParent();record.geometry.dispose();}
  material.dispose();
 }
 return {parts,update,setAppearance,setQuality,dispose,
  get strandTotal(){return Object.values(parts).reduce((sum,p)=>sum+p.strands,0);}};
}
