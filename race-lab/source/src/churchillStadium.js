/**
 * Estadio Satoshi Nakamoto / Pista Eadweard Muybridge.
 * Churchill Downs-inspired original procedural venue for Cryptodromo.
 * Three.js XY race coordinates: X forward, Y vertical, Z depth.
 * Does not change race result, price feed, fixture or horses.
 */
export function createChurchillStadium({THREE,scene,mode='race',quality='medium',enableParticles=false,title='ESTADIO SATOSHI NAKAMOTO'}={}){
  if(!THREE||!scene)throw new Error('THREE and scene required');
  if(!['race','overview'].includes(mode))throw new Error('Invalid stadium mode');
  const root=new THREE.Group();root.name='Estadio Satoshi Nakamoto';scene.add(root);
  const geometries=new Set(),materials=new Set(),textures=new Set();
  const ownGeo=g=>(geometries.add(g),g),ownMat=m=>(materials.add(m),m);
  const mat=(color,opts={})=>ownMat(new THREE.MeshStandardMaterial({color,roughness:.82,...opts}));
  const M={
    stone:mat(0xe4dbca),ivory:mat(0xf7f2e8),trim:mat(0xfdfaf1),roof:mat(0x263740),
    green:mat(0x0e523d),emerald:mat(0x087b58),bronze:mat(0xcaa872,{metalness:.16,roughness:.54}),
    glass:mat(0x1c383e,{metalness:.22,roughness:.36}),dark:mat(0x14251f),seat:mat(0x48574e),
    track:mat(0x926a44),grass:mat(0x547946),rail:mat(0xeceadd),concrete:mat(0x53645d)
  };
  const add=(parent,geometry,material,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(ownGeo(geometry),material);mesh.position.set(x,y,z);
    mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const box=(p,w,h,d,m,x=0,y=0,z=0)=>add(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cylinder=(p,top,bottom,height,m,x,y,z,sides=8)=>add(p,new THREE.CylinderGeometry(top,bottom,height,sides),m,x,y,z);
  const rng=n=>{let v=Math.imul((n+9719)|0,2654435761)>>>0;v^=v>>>16;return(v>>>0)/4294967296;};
  function makeSign(label,x,y,z,width=18,height=1.5,fontSize=50){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#09251b';ctx.fillRect(0,0,1024,160);
    ctx.fillStyle='#16d79a';ctx.fillRect(0,0,12,160);ctx.fillRect(1012,0,12,160);
    ctx.fillStyle='#f6f2e7';ctx.font='800 '+fontSize+'px Arial,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,512,82,982);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    const s=add(root,new THREE.PlaneGeometry(width,height),ownMat(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})),x,y,z);
    s.name=label;return s;
  }
  // Oval establishing shot only. In race mode the original lanes are kept unchanged.
  const HALF=29,R=18,WIDTH=8,LEN=HALF*4+2*Math.PI*R;
  function ovalPoint(u,lateral=0){
    const s=(((u%1)+1)%1)*LEN,r=R+lateral;
    if(s<2*HALF)return{x:-HALF+s,y:r};
    let v=s-2*HALF;
    if(v<Math.PI*R){const a=v/R;return{x:HALF+r*Math.sin(a),y:r*Math.cos(a)};}
    v-=Math.PI*R;
    if(v<2*HALF)return{x:HALF-v,y:-r};
    const a=(v-2*HALF)/R;return{x:-HALF-r*Math.sin(a),y:-r*Math.cos(a)};
  }
  let track=null;
  if(mode==='overview'){
    track=box(root,136,70,.3,M.grass,0,0,-.6);
    const points=[],indices=[];
    for(let i=0;i<=192;i++){
      const a=ovalPoint(i/192,-WIDTH/2),b=ovalPoint(i/192,WIDTH/2);
      points.push(a.x,a.y,.14,b.x,b.y,.14);
      if(i<192){const k=2*i;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    add(root,geometry,M.track);
    for(const offset of [-WIDTH/2-.2,WIDTH/2+.2]){
      const arr=[];for(let i=0;i<=200;i++){const p=ovalPoint(i/200,offset);arr.push(new THREE.Vector3(p.x,p.y,.44));}
      const curve=new THREE.CatmullRomCurve3(arr,true,'centripetal');
      add(root,new THREE.TubeGeometry(curve,220,.08,5,true),M.rail);
    }
    box(root,.7,WIDTH,.12,M.ivory,11,R,.35);
    box(root,46,1,.07,M.stone,0,0,.17);
    for(let i=0;i<12;i++)cylinder(root,.45,.48,.55,M.green,-26+i*4.5,(i%2?4:-4),.40);
    const stalls=new THREE.Group();stalls.name='Decorative starting stalls';root.add(stalls);
    for(let i=0;i<12;i++)box(stalls,1.2,1.5,.2,M.green,-18+i*1.3,-R-3,.3);
  }
  const stand=new THREE.Group();stand.name='Clubhouse and twin spires';root.add(stand);
  stand.position.set(0,mode==='overview'?R+11:7.05,mode==='overview'?-1.15:-13);
  box(stand,76,1.6,5,M.stone,0,.55,-3.4);
  box(stand,35,7.2,4,M.ivory,0,4,-3);
  box(stand,35.2,.25,4.6,M.green,0,7.7,-3);
  for(let i=-7;i<=7;i++){
    const x=i*2.17;
    box(stand,.18,5,.27,M.trim,x,3.75,-.90);
    for(const y of [2.45,5.05]){
      box(stand,1.26,1.5,.08,M.glass,x,y,-.81);
      box(stand,1.52,.14,.2,M.trim,x,y+.83,-.75);
      box(stand,1.52,.10,.2,M.trim,x,y-.83,-.75);
    }
  }
  box(stand,36,.27,1.8,M.stone,0,6.95,-.7);
  box(stand,35.4,.11,.16,M.green,0,7.86,.04);
  for(let i=0;i<58;i++)box(stand,.07,.88,.1,M.green,-17+i*.59,7.37,.04);
  box(stand,38,.3,4.9,M.roof,0,8.25,-3.2);
  for(const s of [-1,1]){const roof=box(stand,18,1,3,M.roof,s*8.7,9.03,-3.5);roof.rotation.z=s*.06;}
  const towers=[];
  for(const x of [-8.8,8.8]){
    const tower=new THREE.Group();tower.name='Twin Spire';tower.position.set(x,7.8,-.9);stand.add(tower);
    cylinder(tower,1.52,1.56,.26,M.stone,0,.2,0);
    cylinder(tower,1.34,1.4,3.4,M.ivory,0,2,0);
    for(let n=0;n<8;n++){
      const a=(n+.5)*Math.PI/4,vx=Math.sin(a)*1.19,vz=Math.cos(a)*1.19;
      const window=box(tower,.65,1.72,.1,M.glass,vx,2,vz);window.rotation.y=a;
      const lintel=box(tower,.8,.16,.12,M.trim,vx,3,vz);lintel.rotation.y=a;
    }
    cylinder(tower,1.58,1.55,.24,M.trim,0,3.78,0);
    cylinder(tower,1.67,1.6,.25,M.roof,0,4,0);
    const roof=cylinder(tower,0,1.65,5.65,M.roof,0,6.94,0);roof.castShadow=true;
    cylinder(tower,.17,.17,.8,M.bronze,0,10.15,0);
    cylinder(tower,0,.20,.5,M.bronze,0,10.81,0);
    towers.push(tower);
  }
  // Instanced public and repeating structural wings.
  const count=({low:192,medium:384,high:640})[quality]||384,rows=8;
  for(const side of [-1,1]){
    const center=side*27;
    box(stand,22,2,6,M.stone,center,1,-3.5);
    for(let i=0;i<rows;i++)box(stand,21.5,.32,1.04,i%2?M.concrete:M.seat,center,2+i*.52,-1.25-i*.25);
    box(stand,23,.42,7,M.roof,center,8,-3.9);
    box(stand,22.8,.18,.2,M.emerald,center,7.77,-.30);
    for(let i=0;i<5;i++)box(stand,.23,6.2,.2,M.green,center-10+i*5,5,-.08);
  }
  const heads=new THREE.InstancedMesh(ownGeo(new THREE.SphereGeometry(.135,6,5)),mat(0xffffff),count);
  const bodies=new THREE.InstancedMesh(ownGeo(new THREE.CylinderGeometry(.095,.12,.33,5)),mat(0xffffff),count);
  heads.name='Spectators heads';bodies.name='Spectators bodies';
  heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy=new THREE.Object3D(),crowd=[];
  const uniforms=[0xd6eadc,0xeaa97a,0xf3d2a0,0x7fc9ba,0x88a2d7,0xe88778,0xcbaa7f];
  for(let i=0;i<count;i++){
    const side=i%2?-1:1,slot=Math.floor(i/2),row=slot%rows,col=Math.floor(slot/rows);
    const columns=Math.ceil(count/(2*rows));
    const x=side*(17.2+col*19.3/Math.max(1,columns-1)),y=2.30+row*.52,z=-.60-row*.26;
    crowd.push({x,y,z,phase:rng(i+21)*6});
    dummy.position.set(x,y,z);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,y-.245,z);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);
    heads.setColorAt(i,new THREE.Color(0xe3bfa0));bodies.setColorAt(i,new THREE.Color(uniforms[Math.floor(rng(i+17)*uniforms.length)]));
  }
  heads.instanceMatrix.needsUpdate=true;bodies.instanceMatrix.needsUpdate=true;
  stand.add(heads,bodies);
  for(const x of [-6,-3,0,3,6])cylinder(stand,.23,.23,2.4,M.ivory,x,-.2,.6);
  box(stand,16,.3,2.3,M.roof,0,1,.6);
  makeSign(title,0,stand.position.y+6.1,stand.position.z+1.3,19,1.65,48);
  makeSign('PISTA EADWEARD MUYBRIDGE',0,stand.position.y+1.65,stand.position.z+2.3,18,1.55,47);
  const board=new THREE.Group();board.name='Race scoreboard';root.add(board);
  board.position.set(31.5,mode==='overview'?0:8.8,mode==='overview'?-.1:-11.3);
  box(board,9,5.4,.5,M.dark,0,0,0);
  box(board,9.3,.34,.8,M.emerald,0,2.85,0);
  for(const x of [-4,4])box(board,.23,3,.36,M.green,x,-4.1,-.2);
  const scoreCanvas=document.createElement('canvas');scoreCanvas.width=640;scoreCanvas.height=368;
  const ctx=scoreCanvas.getContext('2d'),texture=new THREE.CanvasTexture(scoreCanvas);
  texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
  add(board,new THREE.PlaneGeometry(8.4,4.85),ownMat(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})),0,.02,.3);
  let scoreInfo={raceNumber:'001',leader:'BTC',time:'00:00'};
  function drawBoard(){
    ctx.fillStyle='#0b1e18';ctx.fillRect(0,0,640,368);
    ctx.fillStyle='#17cb8f';ctx.fillRect(0,0,640,13);
    ctx.textAlign='center';ctx.fillStyle='#f4f0e0';
    ctx.font='bold 51px Arial';ctx.fillText('SATOSHI NAKAMOTO',320,84);
    ctx.fillStyle='#a8e3c4';ctx.font='bold 27px Arial';
    ctx.fillText('CARRERA '+scoreInfo.raceNumber+' · '+scoreInfo.time,320,146);
    ctx.fillStyle='#ebc47b';ctx.font='bold 67px Arial';ctx.fillText(scoreInfo.leader,320,248);
    ctx.fillStyle='#9fae9f';ctx.font='bold 24px Arial';ctx.fillText('DATOS SINTÉTICOS · DEMO',320,323);
    texture.needsUpdate=true;
  }
  drawBoard();
  const lights=[];
  for(const x of [-52,52]){
    const mast=new THREE.Group();mast.position.set(x,mode==='overview'?23:7.6,mode==='overview'?-1.2:-11);root.add(mast);
    box(mast,.36,7,.36,M.concrete,0,3.5,0);
    box(mast,3.5,.45,.45,M.roof,0,7.1,0);
    const lamps=[];
    for(let i=0;i<5;i++){
      const lm=mat(0xc4f9e5,{emissive:0x81ffcd,emissiveIntensity:0});
      box(mast,.49,.29,.2,lm,-1.4+i*.7,6.96,.3);lamps.push(lm);
    }
    const light=new THREE.SpotLight(0xcaffeb,0,48,Math.PI/3,.7,1.6);
    light.position.set(0,7,1.5);light.target.position.set(x<0?24:-24,-5,1);
    mast.add(light);root.add(light.target);lights.push({light,lamps});
  }
  const flags=[];
  for(const x of [-15,15]){
    const p=new THREE.Group();p.position.set(x,8.5,-3);stand.add(p);
    box(p,.055,3,.055,M.rail,0,1.4,0);
    flags.push(box(p,1.3,.65,.06,M.emerald,.69,2.24,.03));
  }
  let particles=null,particleSpeed=[];
  if(enableParticles){
    const n=quality==='low'?220:500,arr=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      arr[i*3]=(rng(i*5)-.5)*95;arr[i*3+1]=rng(i*9)*60-25;arr[i*3+2]=(rng(i*3)-.5)*19+5;
      particleSpeed.push(8+rng(i+99)*9);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
    particles=new THREE.Points(ownGeo(g),ownMat(new THREE.PointsMaterial({color:0xbcdfe6,size:.12,transparent:true,opacity:.55})));
    particles.frustumCulled=false;root.add(particles);
  }
  let environment={hour:17.5,type:'clear',wind:12,clouds:.32},elapsed=0,accumulator=0;
  function setEnvironment(next={}){
    environment={...environment,...next};
    const night=environment.hour<6||environment.hour>=19;
    for(const {light,lamps} of lights){
      light.intensity=night?2:environment.type==='storm'?.65:0;
      for(const lm of lamps)lm.emissiveIntensity=night?2.2:environment.type==='storm'?.6:0;
    }
    M.track.color.setHex(['storm','rain'].includes(environment.type)?0x775843:0x926a44);
    M.track.roughness=['storm','rain'].includes(environment.type)?.47:.94;
    if(particles){
      particles.visible=['storm','rain','snow'].includes(environment.type);
      particles.material.color.setHex(environment.type==='snow'?0xffffff:0xbcdfe6);
    }
  }
  setEnvironment();
  function update(dt,{running=false}={}){
    if(!root.visible)return;
    dt=Math.min(.1,Math.max(0,dt));elapsed+=dt;accumulator+=dt;
    if(accumulator>=(quality==='low'?.11:.06)){
      accumulator=0;
      for(let i=0;i<crowd.length;i++){
        const p=crowd[i],wave=Math.sin(elapsed*(running?7.5:1.9)+p.phase)*(running?.10:.018);
        dummy.position.set(p.x,p.y+wave,p.z);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);
        dummy.position.set(p.x,p.y-.245+wave*.65,p.z);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);
      }
      heads.instanceMatrix.needsUpdate=true;bodies.instanceMatrix.needsUpdate=true;
    }
    flags.forEach((f,i)=>{f.rotation.y=Math.sin(elapsed*2.2+i*2)*(.06+environment.wind*.004);});
    if(particles?.visible){
      const attr=particles.geometry.attributes.position;
      for(let i=0;i<particleSpeed.length;i++){
        let y=attr.getY(i)-(environment.type==='snow'?.5:2.2)*particleSpeed[i]*dt;
        if(y< -25)y=35;
        attr.setXY(i,attr.getX(i)-environment.wind*dt*.019,y);
        if(attr.getX(i)<-50)attr.setX(i,50);
      }
      attr.needsUpdate=true;
    }
  }
  function setScoreboard(next={}){
    scoreInfo={...scoreInfo,...next};
    scoreInfo.raceNumber=String(scoreInfo.raceNumber).slice(0,5);
    scoreInfo.leader=String(scoreInfo.leader).slice(0,14);
    drawBoard();
  }
  function getOvalPosition(progress,lane=0){
    const offset=Math.max(-5,Math.min(5,Number(lane)||0));
    const p=ovalPoint(progress,offset),n=ovalPoint(progress+.0001,offset);
    return{x:p.x,y:p.y,z:.65,angle:Math.atan2(n.y-p.y,n.x-p.x)};
  }
  function dispose(){
    root.removeFromParent();
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    root.clear();
  }
  return{root,stand,towers,scoreboard:board,track,ovalPoint,getOvalPosition,update,setEnvironment,setScoreboard,dispose,
    stats:{mode,crowdCount:count,identity:{stadium:'Satoshi Nakamoto',track:'Eadweard Muybridge'},
      features:['twin-spires','clubhouse','arcades','grandstand','crowd','lights','scoreboard','weather-hooks','oval-overview']}};
}
