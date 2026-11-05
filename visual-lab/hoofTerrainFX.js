import * as THREE from 'three';
import {createHoofContactSolver,HOOF_LAYOUT,SURFACES,normalizedSurface,hoofWorldPoint} from './hoofContactSolver.js?v=hoof-fx-1';

/**
 * Independent terrain response: four world-space sole contact channels per horse,
 * instanced compressed hoofprints and a single GPU-drawn particle buffer.
 * Never reads or mutates timing, coefficients, prices, rank or official distance.
 */
function imprintTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d');
  c.clearRect(0,0,128,128);c.save();c.translate(64,64);
  const g=c.createRadialGradient(0,-3,7,0,0,57);
  g.addColorStop(0,'rgba(255,255,255,.88)');
  g.addColorStop(.59,'rgba(255,255,255,.70)');
  g.addColorStop(.76,'rgba(255,255,255,.33)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.beginPath();c.ellipse(0,0,42,49,0,0,Math.PI*2);c.fill();
  // Toe and two heel bulbs give a recognisable equine print, not a round disk.
  c.lineWidth=8;c.strokeStyle='rgba(255,255,255,.54)';
  c.beginPath();c.ellipse(0,-3,31,40,0,.17*Math.PI,.83*Math.PI,true);c.stroke();
  for(const x of [-15,15]){
    c.beginPath();c.ellipse(x,32,13,10,0,0,Math.PI*2);
    c.fillStyle='rgba(255,255,255,.65)';c.fill();
  }
  c.restore();
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;return map;
}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const QUALITY={eco:{particles:160,rate:.22,imprints:450},balanced:{particles:480,rate:.46,imprints:950},
  cinematic:{particles:760,rate:.58,imprints:1700}};
export function createHoofTerrainFX(scene,{lanes=12,quality='balanced',surface='dirt',seed=12585,imprintScale=1,imprintLimit=null}={}){
  const solver=createHoofContactSolver({lanes,soleThreshold:.07,releaseThreshold:.18});
  // Original Quaternius GLB contains four animated lower-leg end bones.
  // Track the rig endpoints until the BTC master publishes true sole markers.
  // The .22 sole offset is calibrated at the current race horse height (2.85m).
  // It is a provisional contact approximation, not collision-mesh physics.
  const sensorCache=new WeakMap(),soleNames=[
    'BackLowerLegL_end','BackLowerLegR_end',
    'FrontLowerLegL_end','FrontLowerLegR_end'
  ];
  function readAnimatedSoles(model){
    let entry=sensorCache.get(model);
    if(entry===undefined){
      const bones=soleNames.map(n=>model.root?.getObjectByName(n));
      entry=bones.every(b=>b?.isObject3D)?{
        bones,vectors:bones.map(()=>new THREE.Vector3()),
        soles:bones.map(()=>({x:0,y:0,z:0}))
      }:null;
      sensorCache.set(model,entry);
    }
    if(!entry)return null;
    for(let i=0;i<4;i++){
      const v=entry.bones[i].getWorldPosition(entry.vectors[i]);
      const p=entry.soles[i];
      p.x=v.x;p.y=v.y-.22*(Number(model.root.scale.y)||1);p.z=v.z;
    }
    return entry.soles;
  }
  const maxMarks=1700,maxParticles=1350;
  // A single-horse showroom should not display stadium-sized footprints.
  const printScale=clamp(Number(imprintScale),.15,2);
  const effectiveMarks=Number.isInteger(imprintLimit)?Math.max(4,Math.min(1700,imprintLimit)):null;
  const markCapacity=()=>effectiveMarks===null?QUALITY[preset].imprints:Math.min(effectiveMarks,QUALITY[preset].imprints);
  const texture=imprintTexture();
  const printGeometry=new THREE.PlaneGeometry(.69,.77);
  printGeometry.rotateX(-Math.PI/2);
  const printMaterial=new THREE.MeshBasicMaterial({
    color:0x493224,map:texture,transparent:true,opacity:.49,
    depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1
  });
  const marks=new THREE.InstancedMesh(printGeometry,printMaterial,maxMarks);
  marks.name='Hoof FX · compressed terrain impressions';
  marks.count=0;marks.frustumCulled=false;marks.renderOrder=5;
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(marks);
  const shadowGeometry=new THREE.CircleGeometry(1,14);
  shadowGeometry.rotateX(-Math.PI/2);
  const shadowMaterial=new THREE.MeshBasicMaterial({
    color:0x142013,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide
  });
  const shadows=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,lanes*4);
  shadows.name='Hoof FX · four per-hoof contact shadows';
  shadows.count=0;shadows.frustumCulled=false;shadows.renderOrder=4;
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(shadows);

  const xyz=new Float32Array(maxParticles*3),rgb=new Float32Array(maxParticles*3);
  const sizes=new Float32Array(maxParticles),alpha=new Float32Array(maxParticles),kinds=new Float32Array(maxParticles);
  const baseSize=new Float32Array(maxParticles),baseAlpha=new Float32Array(maxParticles);
  const velocities=new Float32Array(maxParticles*3),gravity=new Float32Array(maxParticles);
  const ages=new Float32Array(maxParticles),lifetimes=new Float32Array(maxParticles);
  const particleGeometry=new THREE.BufferGeometry();
  particleGeometry.setAttribute('position',new THREE.BufferAttribute(xyz,3).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute('color',new THREE.BufferAttribute(rgb,3).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute('aAlpha',new THREE.BufferAttribute(alpha,1).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute('aKind',new THREE.BufferAttribute(kinds,1).setUsage(THREE.DynamicDrawUsage));
  const particleMaterial=new THREE.ShaderMaterial({
    transparent:true,depthTest:true,depthWrite:false,blending:THREE.NormalBlending,
    uniforms:{uDpr:{value:1}},
    vertexShader:`attribute float aSize;attribute float aAlpha;attribute float aKind;
      varying vec3 vColor;varying float vAlpha;varying float vKind;uniform float uDpr;
      void main(){vColor=color;vAlpha=aAlpha;vKind=aKind;
        vec4 eye=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*eye;
        gl_PointSize=min(66.,max(1.,aSize*uDpr*370./max(2.,-eye.z)));
      }`,
    fragmentShader:`varying vec3 vColor;varying float vAlpha;varying float vKind;
      void main(){
        float d=length(gl_PointCoord-vec2(.5))*2.;
        float edge=vKind>.5?1.-smoothstep(.70,.98,d):1.-smoothstep(.08,1.,d);
        gl_FragColor=vec4(vColor,edge*vAlpha);
      }`,
    vertexColors:true
  });
  const cloud=new THREE.Points(particleGeometry,particleMaterial);
  cloud.name='Hoof FX · impact grains and dust';cloud.frustumCulled=false;
  cloud.renderOrder=7;scene.add(cloud);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  let surfaceName=normalizedSurface(surface),preset=QUALITY[quality]?quality:'balanced';
  let wetness=0,layout='straight',groundY=.06,markCursor=0,particleCursor=0;
  let active=0,impacts=0,spawns=0,rng=seed>>>0,contactSource='phase';
  const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  const profile=()=>SURFACES[surfaceName];
  const maxLive=()=>QUALITY[preset].particles;
  function clearParticles(){
    ages.fill(0);lifetimes.fill(0);alpha.fill(0);sizes.fill(0);
    for(let i=0;i<maxParticles;i++)xyz[i*3+1]=-10000;
    active=0;particleCursor=0;
    particleGeometry.attributes.position.needsUpdate=true;
    particleGeometry.attributes.aAlpha.needsUpdate=true;
  }
  function reset(){
    solver.reset();marks.count=0;shadows.count=0;markCursor=0;impacts=0;spawns=0;
    clearParticles();
  }
  function setLayout(next='straight'){
    layout=next;groundY=layout==='straight'?.065:.136;reset();
  }
  function setSurface(next='dirt'){
    const name=normalizedSurface(next);
    if(name===surfaceName)return;
    surfaceName=name;
    printMaterial.color.set(profile().imprint);
    reset();
  }
  function setQuality(next='balanced'){
    preset=QUALITY[next]?next:'balanced';
    particleGeometry.setDrawRange(0,maxLive());
    // Do not rescale existing official positioning on a quality switch.
    if(particleCursor>=maxLive())particleCursor=0;
    markCursor%=markCapacity();
    marks.count=Math.min(marks.count,markCapacity());
  }
  function setWetness(n){
    wetness=clamp(n,0,1);
    printMaterial.opacity=(surfaceName==='grass'?.28:.53)*(1+wetness*.22);
    shadowMaterial.opacity=.15+wetness*.08;
  }
  function renderPrint(event){
    dummy.position.set(event.x,groundY+.017,event.z);
    dummy.rotation.set(0,event.heading,0);
    const scale=profile().markScale*(.87+.17*event.pressure);
    dummy.scale.set(.70*scale*printScale,1,.80*scale*printScale);
    dummy.updateMatrix();
    marks.setMatrixAt(markCursor,dummy.matrix);
    markCursor=(markCursor+1)%markCapacity();
    marks.count=Math.min(markCapacity(),marks.count+1);
    marks.instanceMatrix.needsUpdate=true;
  }
  function emit(x,y,z,vx,vy,vz,kind){
    const n=maxLive(),i=particleCursor;
    particleCursor=(particleCursor+1)%n;
    if(!lifetimes[i])active++;
    const p=i*3;
    xyz[p]=x;xyz[p+1]=y;xyz[p+2]=z;
    velocities[p]=vx;velocities[p+1]=vy;velocities[p+2]=vz;
    ages[i]=.00001;
    const isGrain=kind==='grain',isWet=kind==='wet',isGrass=kind==='grass';
    lifetimes[i]=isGrain?.29+random()*.36:isWet?.22+random()*.28:isGrass?.35+random()*.28:.37+random()*.37;
    gravity[i]=isGrain?8.0:isWet?9.2:isGrass?5.2:.36;
    baseSize[i]=isGrain?.12+random()*.11:isWet?.12+random()*.17:isGrass?.11+random()*.10:.26+random()*.34;
    baseAlpha[i]=isGrain?.58:isWet?.55:isGrass?.57:.10+random()*.10;
    sizes[i]=baseSize[i];alpha[i]=baseAlpha[i];kinds[i]=(isGrain||isWet||isGrass)?1:0;
    if(isWet)color.set('#94a9a2');
    else color.set(profile().pigment);
    const shade=.76+random()*.45;
    rgb[p]=color.r*shade;rgb[p+1]=color.g*shade;rgb[p+2]=color.b*shade;
    spawns++;
  }
  function impact(event,heading=0){
    impacts++;renderPrint(event);
    const cfg=profile(),wetScale=Math.max(.08,1-wetness*.86);
    const units=Math.max(0,Math.min(9,Math.round(cfg.dust*QUALITY[preset].rate*event.pressure*wetScale)));
    const fx=Math.cos(heading),fz=-Math.sin(heading),sx=-fz,sz=fx;
    for(let j=0;j<units;j++){
      const lateral=(random()-.5)*cfg.spread,back=.10+random()*.62;
      const x=event.x-fx*back+sx*lateral,z=event.z-fz*back+sz*lateral;
      const kind=surfaceName==='grass'?'grass':j%3===0?'grain':'dust';
      const kick=.30+random()*cfg.rise;
      emit(x,groundY+.055,z,-fx*(.25+random()*1.4)+sx*lateral*2,
        kick,-fz*(.25+random()*1.4)+sz*lateral*2,kind);
    }
    if(wetness>.22){
      const splashN=Math.round(3*QUALITY[preset].rate*wetness);
      for(let i=0;i<splashN;i++){
        const v=(random()-.5)*2.5;
        emit(event.x,groundY+.07,event.z,-fx*.6+sx*v,.38+random()*.9,-fz*.6+sz*v,'wet');
      }
    }
  }
  /**
   * Run after model.update(): it reads rendered pose only.
   * master.getHoofContactPoints() -> [{x,y,z}, ...] enables real sole collisions.
   * Legacy models have hoofPhase; otherwise the solver's own gait clock is used.
   */
  function stepHorse(lane,{model,dt=0,speed=1,running=false}={}){
    const root=model?.root;
    if(!root||!Number.isInteger(lane)||lane<0||lane>=lanes)return;
    const heading=root.rotation.y||0,x=root.position.x,z=root.position.z;
    const rawPhase=model.hoofPhase;
    const phase=Number.isFinite(rawPhase)?rawPhase:null;
    // The final master's world-space sole API has priority over GLB bone tips.
    const trueSoles=typeof model.getHoofContactPoints==='function'?model.getHoofContactPoints():null;
    const explicit=Array.isArray(trueSoles)&&trueSoles.length===4;
    const skeleton=explicit?null:readAnimatedSoles(model);
    const soles=explicit?trueSoles:skeleton;
    contactSource=explicit?'master':skeleton?'skeleton':phase!==null?'phase':'clock';
    const events=solver.sample({lane,x,z,heading,phase,dt,speed,enabled:running,soles,groundY});
    if(running)for(const e of events)impact(e,e.heading);
    if(!running){for(let i=0;i<4;i++){const idx=lane*4+i;dummy.position.set(0,-99,0);dummy.scale.setScalar(.001);dummy.updateMatrix();shadows.setMatrixAt(idx,dummy.matrix);}shadows.count=lanes*4;shadows.instanceMatrix.needsUpdate=true;return;}
    for(let i=0;i<4;i++){
      const idx=lane*4+i,sole=Array.isArray(soles)?soles[i]:null;
      const p=sole&&Number.isFinite(sole.x)?sole:hoofWorldPoint({x,z,heading,hoof:i});
      const offset=Number.isFinite(phase)?Math.abs((((phase-HOOF_LAYOUT[i].beat)+1.5)%1)-.5):.07;
      const weight=sole?.y!==undefined?clamp(1-(sole.y-groundY)/.35,0,1):
        clamp(1-offset/.20,.10,1);
      dummy.position.set(p.x,weight<.055?-80:groundY+.008,p.z);
      dummy.rotation.set(0,heading,0);
      dummy.scale.set(.035+.23*weight,1,.05+.28*weight);
      dummy.updateMatrix();
      shadows.setMatrixAt(idx,dummy.matrix);
    }
    shadows.count=lanes*4;shadows.instanceMatrix.needsUpdate=true;
  }
  function update(dt,{wind=0,pixelRatio=1,scrollSpeed=0}={}){
    const step=clamp(dt,0,.08),n=maxLive();
    particleMaterial.uniforms.uDpr.value=clamp(pixelRatio,.6,2);
    // Preview-only running-belt illusion. The stadium passes zero and retains
    // every mark in immutable world coordinates; the BTC stationary card can
    // scroll the turf behind its animated planted hoof without moving the horse.
    if(scrollSpeed>0&&marks.count){
      const matrix=marks.instanceMatrix.array,dx=clamp(scrollSpeed,0,6)*step;
      for(let i=0;i<marks.count;i++){
        const at=i*16+12;
        matrix[at]-=dx;
        if(matrix[at]<-4.6)matrix[at+1]=-80;
      }
      marks.instanceMatrix.needsUpdate=true;
    }
    for(let i=0;i<n;i++){
      if(!lifetimes[i])continue;
      const p=i*3,age=ages[i]+step,duration=lifetimes[i];
      if(age>=duration){
        lifetimes[i]=0;ages[i]=0;alpha[i]=0;xyz[p+1]=-10000;active=Math.max(0,active-1);continue;
      }
      ages[i]=age;const t=age/duration;
      velocities[p]*=Math.max(0,1-step*.9);
      velocities[p+2]*=Math.max(0,1-step*.9);
      velocities[p+1]-=gravity[i]*step;
      xyz[p]+=step*(velocities[p]+wind*.14);
      xyz[p+1]=Math.max(groundY+.01,xyz[p+1]+velocities[p+1]*step);
      xyz[p+2]+=step*velocities[p+2];
      sizes[i]=baseSize[i]*(1+t*.28);
      alpha[i]=baseAlpha[i]*Math.pow(1-t,2.6);
    }
    for(const key of ['position','aSize','aAlpha','aKind'])particleGeometry.attributes[key].needsUpdate=true;
    // Colors change on contact only; one upload per render is inexpensive.
    particleGeometry.attributes.color.needsUpdate=true;
  }
  setQuality(preset);printMaterial.color.set(profile().imprint);clearParticles();
  return {stepHorse,update,reset,setSurface,setLayout,setWetness,setQuality,dispose(){
    marks.removeFromParent();shadows.removeFromParent();cloud.removeFromParent();
    texture.dispose();printGeometry.dispose();printMaterial.dispose();
    shadowGeometry.dispose();shadowMaterial.dispose();
    particleGeometry.dispose();particleMaterial.dispose();
  },get stats(){return {surface:surfaceName,quality:preset,impacts,particles:active,
    spawned:spawns,imprints:marks.count,wetness,contactSource};},marks,shadows,cloud};
}
