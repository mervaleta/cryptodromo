import {getStadiumPreset} from './presets.js';

/**
 * Scenic-only, deterministic stadium generator. X=course, Y=up, Z=width.
 * Safe contract: no edits to fixture, race engine, horses or price-derived results.
 * Venue is independently disposable, with shared geometries and instanced crowds.
 */
export function createStadiumVenue({THREE,scene,stadiumId='satoshi',quality='medium',weatherParticles=true}={}){
  if(!THREE||!scene)throw new Error('Three.js and a scene are required');
  const preset=getStadiumPreset(stadiumId), P=preset.palette;
  const level=quality==='low'?0:quality==='high'?2:1;
  let seed=preset.seed>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const root=new THREE.Group();root.name='CRYPTODROMO_VENUE_'+stadiumId;scene.add(root);
  const geometry=new Set(),materials=new Set(),textures=new Set();
  const ownGeo=g=>(geometry.add(g),g),ownMat=m=>(materials.add(m),m),ownTex=t=>(textures.add(t),t);
  const cube=ownGeo(new THREE.BoxGeometry(1,1,1)),column=ownGeo(new THREE.CylinderGeometry(1,1,1,10)),
    cone=ownGeo(new THREE.ConeGeometry(1,1,9)),orb=ownGeo(new THREE.IcosahedronGeometry(1,1));
  const material=(color,options={})=>ownMat(new THREE.MeshStandardMaterial({color,roughness:.84,...options}));
  const M={wall:material(P.wall),trim:material(P.trim),roof:material(P.roof),metal:material(P.metal,{metalness:.32,roughness:.46}),
    accent:material(P.accent),grass:material(P.grass),track:material(P.track),trees:material(P.trees),
    paving:material(0x87958b),stone:material(0x53645c),glass:material(0x294950,{metalness:.22,roughness:.30}),
    bark:material(0x655744),lights:material(0xffecc7,{emissive:0xffcb74,emissiveIntensity:0}),
    jersey:material(0xffffff),skin:material(0xc59a79),white:material(0xf4efdf),
    led:material(P.accent,{emissive:P.accent,emissiveIntensity:.25})};
  const areas={terrain:new THREE.Group(),track:new THREE.Group(),architecture:new THREE.Group(),services:new THREE.Group(),
    vegetation:new THREE.Group(),crowd:new THREE.Group(),weather:new THREE.Group()};
  for(const [name,group] of Object.entries(areas)){group.name=name;root.add(group);}
  const add=(parent,geo,mat,name)=>{
    const m=new THREE.Mesh(geo,mat);if(name)m.name=name;parent.add(m);return m;
  };
  const box=(parent,x,y,z,w,h,d,mat,name)=>{
    const m=add(parent,cube,mat,name);m.position.set(x,y,z);m.scale.set(w,h,d);return m;
  };
  const pole=(parent,x,y,z,r,h,mat)=>{
    const m=add(parent,column,mat);m.position.set(x,y,z);m.scale.set(r,h,r);return m;
  };
  function instanced(parent,geo,mat,name,placements){
    const mesh=new THREE.InstancedMesh(geo,mat,placements.length),o=new THREE.Object3D();
    mesh.name=name;
    placements.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.scale.set(p.w||1,p.h||1,p.d||1);
      o.rotation.set(0,p.ry||0,0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);
      if(p.color!==undefined)mesh.setColorAt(i,new THREE.Color(p.color));});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
  }
  function sign(parent,text,x,y,z,w=18,h=2.5,rotationY=0){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=180;
    const ctx=canvas.getContext('2d'),accent='#'+P.accent.toString(16).padStart(6,'0');
    ctx.fillStyle='#09241d';ctx.fillRect(0,0,1024,180);
    ctx.fillStyle=accent;ctx.fillRect(0,0,1024,11);ctx.fillRect(0,169,1024,11);
    ctx.fillStyle='#f6f1e5';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 63px Arial';
    ctx.fillText(String(text).slice(0,52),512,93,970);
    const tx=ownTex(new THREE.CanvasTexture(canvas));tx.colorSpace=THREE.SRGBColorSpace;
    const mesh=add(parent,ownGeo(new THREE.PlaneGeometry(w,h)),ownMat(new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide})));
    mesh.position.set(x,y,z);mesh.rotation.y=rotationY;return mesh;
  }
  const turf=add(areas.terrain,ownGeo(new THREE.PlaneGeometry(950,670)),M.grass,'Parque y terrenos');turf.rotation.x=-Math.PI/2;turf.position.y=-.7;
  box(areas.terrain,0,-.42,0,605,.55,235,M.grass,'Meseta del hipódromo');
  box(areas.terrain,0,-.3,-248,410,.22,38,M.paving,'Plaza del público');
  box(areas.terrain,-326,-.32,-84,22,.2,190,M.paving,'Acceso caballerizas');
  box(areas.terrain,355,-.32,-46,19,.2,190,M.paving,'Vía técnica');
  box(areas.terrain,0,-.3,144,650,.18,11,M.paving,'Circuito de servicio');
  // Course geometry precisely matches the alpha14 oval centreline dimensions.
  const HALF=250,R=72,LANE_WIDTH=28,LENGTH=4*HALF+2*Math.PI*R;
  function ovalPoint(progress,lateral=0){
    const s=((progress%1+1)%1)*LENGTH,r=R+lateral;
    if(s<2*HALF)return{x:-HALF+s,z:r};
    let v=s-2*HALF;
    if(v<Math.PI*R){const a=Math.PI/2-v/R;return{x:HALF+r*Math.cos(a),z:r*Math.sin(a)};}
    v-=Math.PI*R;
    if(v<2*HALF)return{x:HALF-v,z:-r};
    const a=-Math.PI/2-(v-2*HALF)/R;
    return{x:-HALF+r*Math.cos(a),z:r*Math.sin(a)};
  }
  function getLanePosition(progress,lane=0){
    const offset=-LANE_WIDTH/2+(Math.max(0,Math.min(11,lane))+.5)*LANE_WIDTH/12;
    const a=ovalPoint(progress,offset),b=ovalPoint(progress+.00001,offset);
    return{x:a.x,y:.22,z:a.z,heading:Math.atan2(-(b.z-a.z),b.x-a.x)};
  }
  function ovalRibbon(inner,outer,mat,height=.04){
    const vertices=[],triangles=[],steps=300;
    for(let i=0;i<=steps;i++){
      const a=ovalPoint(i/steps,inner),b=ovalPoint(i/steps,outer);
      vertices.push(a.x,height,a.z,b.x,height,b.z);
      if(i<steps){const t=i*2;triangles.push(t,t+2,t+1,t+1,t+2,t+3);}
    }
    const g=ownGeo(new THREE.BufferGeometry());
    g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(triangles);g.computeVertexNormals();
    const m=add(areas.track,g,mat,'Óvalo procedural');m.material.side=THREE.DoubleSide;m.receiveShadow=true;return m;
  }
  ovalRibbon(-LANE_WIDTH/2-.8,LANE_WIDTH/2+.8,M.stone,.01);
  ovalRibbon(-LANE_WIDTH/2,LANE_WIDTH/2,M.track,.04);
  for(let i=1;i<12;i++){const o=-LANE_WIDTH/2+i*LANE_WIDTH/12;ovalRibbon(o-.015,o+.015,M.white,.06);}
  for(const o of [-LANE_WIDTH/2-1,LANE_WIDTH/2+1]){
    const points=[],posts=[];
    for(let i=0;i<=260;i++){
      const pt=ovalPoint(i/260,o);points.push(new THREE.Vector3(pt.x,.88,pt.z));
      if(i%5===0)posts.push({x:pt.x,y:.45,z:pt.z,w:.11,h:.9,d:.11});
    }
    add(areas.track,ownGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),260,.065,5,true)),M.white,'Baranda');
    instanced(areas.track,cube,M.white,'Postes',posts);
  }
  box(areas.track,105,.09,72,.42,.08,LANE_WIDTH,M.white,'Meta');
  for(const z of [R-LANE_WIDTH/2-2,R+LANE_WIDTH/2+2])pole(areas.services,105,4,z,.25,8,M.trim);
  box(areas.services,105,8,72,3,.7,LANE_WIDTH+5,M.roof,'Puente de meta');
  sign(areas.services,'META',105,8.9,R+LANE_WIDTH/2+2,5,1.2,Math.PI/2);
  // Central landscape and monumental sculpture.
  box(areas.terrain,0,-.12,0,300,.1,65,M.trees,'Jardín central');
  for(let i=-5;i<=5;i++){box(areas.terrain,i*25,.01,0,9,.08,1.3,M.paving);}
  pole(areas.services,0,2.1,0,2.3,4,M.metal);
  const globe=add(areas.services,orb,M.metal,'Esfera de mercados');globe.scale.setScalar(5);globe.position.set(0,8,0);
  // Main grandstand: stepped seating, canopy and clubhouse.
  const main=areas.architecture;
  box(main,0,1,-130,550,2,54,M.wall,'Gradería principal');
  for(let i=0;i<11;i++){
    box(main,0,1.7+i*1.18,-101-i*3,535,.5,2.9,i%2?M.stone:M.paving,'Escalón de tribuna');
  }
  box(main,0,19.7,-130,554,1.2,67,M.roof,'Cubierta principal');
  box(main,0,19,-108,548,.4,.5,M.led,'Franja publicitaria');
  const beams=[];
  for(let x=-262;x<=262;x+=17)beams.push({x,y:10,z:-159,w:.35,h:20,d:.40});
  instanced(main,cube,M.metal,'Columnas estructurales',beams);
  box(main,0,12,-189,260,22,35,M.wall,'Clubhouse');
  box(main,0,24,-190,268,1.7,37,M.roof,'Techo clubhouse');
  const windows=[];
  for(let floor=0;floor<3;floor++)for(let i=0;i<33;i++)
    windows.push({x:-121+i*7.55,y:5.2+floor*6,z:-171.3,w:4.9,h:3.9,d:.14});
  instanced(main,cube,M.glass,'Ventanas clubhouse',windows);
  sign(main,preset.signs.club,0,26,-169,94,6);
  if(preset.features.spires){
    for(const x of [-87,87]){
      pole(main,x,30,-190,9.5,12,M.trim);
      const spire=add(main,cone,M.roof,'Torre histórica');spire.scale.set(10,23,10);spire.position.set(x,47,-190);
      pole(main,x,60,-190,.45,5,M.metal);
    }
    for(const x of [-175,175]){box(main,x,12,-187,80,18,29,M.wall);box(main,x,22,-190,82,1.8,38,M.roof);}
  }else if(preset.features.artDeco){
    for(const x of [-92,92]){
      box(main,x,38,-189,30,46,33,M.trim,'Torre art déco');
      box(main,x,64,-189,22,9,28,M.wall);
      box(main,x,72,-189,11,8,21,M.metal);
    }
    for(const x of [-205,205])box(main,x,23,-191,48,24,34,M.wall);
  }else{
    for(const x of [-90,90]){
      pole(main,x,39,-188,12,50,M.wall);
      const cap=add(main,cone,M.roof,'Silo de materias primas');cap.scale.set(13,11,13);cap.position.set(x,68,-188);
    }
    for(let i=0;i<12;i++){const roof=box(main,-135+i*23,27,-191,21,3,38,M.metal);roof.rotation.z=.15;}
  }
  // Side bleachers / secondary facilities, deliberately separate from the original in-race scenery.
  for(const x of [-350,350]){
    box(areas.architecture,x,2,0,50,3,90,M.wall,'Grada lateral');
    for(let i=0;i<7;i++)box(areas.architecture,x,3+i*1.3,-36+i*12,48,1,10,M.stone);
    box(areas.architecture,x,14,0,53,1.4,92,M.roof);
  }
  const people=level===0?240:level===1?540:970,heads=[],bodies=[],shirtColors=[P.accent,0xd4b084,0x92bbbd,0x637c9a,0xe8dbbd,0xa86858];
  for(let i=0;i<people;i++){
    const row=i%10,col=Math.floor(i/10),cols=Math.ceil(people/10);
    const x=-260+(col+.5)*520/cols+(random()-.5)*1.5;
    const y=2.7+row*1.18,z=-102-row*3;
    heads.push({x,y:y+1.1,z,w:.55,h:.55,d:.55,color:0xcda57d});
    bodies.push({x,y:y+.37,z,w:.70,h:1.1,d:.58,color:shirtColors[i%shirtColors.length]});
  }
  instanced(areas.crowd,orb,M.skin,'Cabezas de público',heads);
  instanced(areas.crowd,column,M.jersey,'Público con camisetas',bodies);
  // Civic entrance, ticket offices, promenades and cafes.
  box(areas.architecture,0,0,-255,240,.2,56,M.paving,'Explanada de entrada');
  for(const x of [-100,100]){
    box(areas.architecture,x,5,-237,42,10,27,M.wall,'Boletería e información');
    box(areas.architecture,x,11,-237,44,1.2,29,M.roof);
    sign(areas.architecture,x<0?'BOLETERÍA':'INFORMACIÓN',x,7,-222.5,32,3);
  }
  for(const x of [-65,65])pole(areas.architecture,x,10,-275,2.5,20,M.trim);
  box(areas.architecture,0,20,-275,148,3.8,8,M.roof,'Portón principal');
  sign(areas.architecture,preset.signs.gate,0,22,-270,85,5);
  for(let i=0;i<6;i++){
    const x=-160+i*64;
    box(areas.services,x,4,-297,30,8,22,M.wall,'Pabellón comercial');
    box(areas.services,x,9,-297,32,1.2,24,i%2?M.roof:M.accent);
    sign(areas.services,['CAFÉ','FAN SHOP','CLUB','SNACKS','MUSEO','SERVICIOS'][i],x,5.8,-285,25,2.8);
  }
  // Separate paddock, stables, broadcast center, maintenance.
  const paddock=add(areas.terrain,ownGeo(new THREE.RingGeometry(35,36.5,72)),M.paving,'Paddock');
  paddock.rotation.x=-Math.PI/2;paddock.position.set(-335,.06,-95);
  const rails=[];for(let i=0;i<48;i++){const a=i*Math.PI/24;rails.push({x:-335+36*Math.cos(a),y:.65,z:-95+36*Math.sin(a),w:.22,h:1.3,d:.22});}
  instanced(areas.services,cube,M.white,'Cerca paddock',rails);
  sign(areas.services,preset.signs.paddock,-335,9,-140,64,4);
  for(const z of [-173,-30,110]){
    box(areas.services,-390,6,z,52,12,31,M.wall,'Caballeriza');
    box(areas.services,-390,13,z,54,1.4,34,M.roof);
    for(let i=0;i<5;i++)box(areas.services,-361,5,z-12+i*6,1,6,4,M.glass);
  }
  box(areas.services,394,12,-183,50,24,35,M.wall,'Centro de transmisión');
  box(areas.services,394,25,-183,54,1.7,39,M.roof);
  sign(areas.services,'BROADCAST',394,18,-164,43,4);
  for(const z of [-110,-28,56,126]){
    box(areas.services,402,5,z,34,10,18,M.wall,'Servicios');
    box(areas.services,402,11,z,35,1.4,20,M.roof);
  }
  // Live scoreboard: demo sample only. Can accept official readonly score payload.
  box(areas.services,303,14,-116,1,28,1,M.stone);
  box(areas.services,303,31,-116,35,22,1.6,M.roof,'Marcador');
  const board=sign(areas.services,'EXHIBICIÓN · DEMO',303,30,-114.8,31,12);
  let score={raceNumber:'001',leader:'-',time:'00:00',status:'DEMO / DATOS SINTÉTICOS'};
  function setScoreboard(next={}){
    score={...score,...next};
    if(board.material.map){const c=board.material.map.image,ctx=c.getContext('2d');
      ctx.fillStyle='#09251f';ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle='#e7f3e9';ctx.textAlign='center';ctx.font='bold 60px Arial';
      ctx.fillText('CARRERA '+String(score.raceNumber).slice(0,8),512,55,950);
      ctx.font='bold 46px Arial';ctx.fillText(String(score.time).slice(0,15)+'  '+String(score.leader).slice(0,15),512,110,950);
      ctx.font='30px Arial';ctx.fillText(String(score.status).slice(0,44),512,155,950);
      board.material.map.needsUpdate=true;}
  }
  setScoreboard();
  // Deterministic landscaping, distant perimeter trees and street furniture.
  const trunks=[],crowns=[],hedges=[],trees=level===0?56:level===1?104:170;
  for(let i=0;i<trees;i++){
    let x,z,tries=0;
    do{x=(random()-.5)*920;z=(random()-.5)*630;tries++;}
    while(tries<65 && ((Math.abs(x)<325&&Math.abs(z)<165)||(Math.abs(x)<225&&z<-335)||(x<-300&&z>-220&&z<150)));
    const height=6+random()*9;
    trunks.push({x,y:height/2,z,w:.8,h:height,d:.8});
    crowns.push({x,y:height+3,z,w:5+random()*3,h:7+random()*3,d:5+random()*3,
      color:i%3===0?P.trees:i%3===1?0x4a8560:0x385e48});
  }
  for(let i=0;i<70;i++)hedges.push({x:-276+i*8,y:1,z:163+(i%3)*1.2,w:2.7,h:2,d:2.8,color:P.trees});
  instanced(areas.vegetation,column,M.bark,'Troncos instanciados',trunks);
  instanced(areas.vegetation,orb,M.jersey,'Copas instanciadas',crowns);
  instanced(areas.vegetation,orb,M.jersey,'Setos',hedges);
  for(const z of [-281,-220,148])for(let x=-220;x<=220;x+=45){
    box(areas.services,x,.7,z,7,.45,2,M.stone,'Banco público');
    pole(areas.services,x,4,z-7,.22,8,M.metal);
    const lamp=add(areas.services,orb,M.lights);lamp.scale.setScalar(1);lamp.position.set(x,8.4,z-7);
  }
  const floods=[];
  for(const x of [-305,305])for(const z of [-110,118]){
    pole(areas.services,x,20,z,.65,40,M.stone);
    box(areas.services,x,40,z,17,1.5,2,M.roof);
    if(level===2){const light=new THREE.PointLight(0xffe3bd,0,105,2);
      light.position.set(x,40,z);areas.services.add(light);floods.push(light);}
  }
  const flags=[];
  for(let i=0;i<9;i++){const x=-155+i*39;
    pole(areas.services,x,9,-336,.16,18,M.trim);
    const flag=box(areas.services,x+2.5,15,-336,5,2.3,.1,i%2?M.metal:M.accent,'Bandera');
    flags.push({mesh:flag,phase:i*.7});
  }
  let particles=null,velocities=[];
  if(weatherParticles){
    const n=level===0?180:level===1?450:800,coords=new Float32Array(n*3);
    for(let i=0;i<n;i++){coords[3*i]=(random()-.5)*420;coords[3*i+1]=random()*48;
      coords[3*i+2]=(random()-.5)*340;velocities.push(18+random()*17);}
    const g=ownGeo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(coords,3));
    particles=new THREE.Points(g,ownMat(new THREE.PointsMaterial({color:0xc7e7ec,size:.28,transparent:true,opacity:.55,depthWrite:false})));
    particles.frustumCulled=false;areas.weather.add(particles);
  }
  let environment={hour:17.5,type:'clear',wind:8,clouds:.3},elapsed=0;
  function setEnvironment(next={}){
    environment={...environment,...next};
    const night=environment.hour<6||environment.hour>=19;
    M.lights.emissiveIntensity=night?2:.1;M.led.emissiveIntensity=night?1.5:.35;
    M.track.roughness=['rain','storm'].includes(environment.type)?.52:.92;
    floods.forEach(light=>light.intensity=night?15:environment.type==='storm'?4:0);
    if(particles){particles.visible=['rain','storm','snow'].includes(environment.type);
      particles.material.color.setHex(environment.type==='snow'?0xffffff:0xc7e7ec);}
  }
  function update(delta){
    const dt=Math.min(.07,Math.max(0,Number(delta)||0));elapsed+=dt;
    flags.forEach(f=>{f.mesh.rotation.y=Math.sin(elapsed*1.7+f.phase)*(.06+Math.min(25,environment.wind)*.006);});
    globe.rotation.y+=dt*.08;
    if(particles&&particles.visible){
      const a=particles.geometry.attributes.position;
      for(let i=0;i<velocities.length;i++){
        const speed=environment.type==='snow'?.24:1;
        let y=a.getY(i)-velocities[i]*speed*dt;if(y<0)y=47;
        let x=a.getX(i)+environment.wind*dt*.12;if(x>210)x=-210;
        a.setXYZ(i,x,y,a.getZ(i));
      }
      a.needsUpdate=true;
    }
  }
  setEnvironment();
  function dispose(){
    root.removeFromParent();
    root.clear();
    geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }
  return {root,preset,areas,update,setEnvironment,setScoreboard,getLanePosition,dispose,
    getStats:()=>({stadiumId,quality,crowdCount:people,treeCount:trees,geometryCount:geometry.size,
      materialCount:materials.size,textureCount:textures.size}),
    constants:{axes:'X-forward Y-up Z-width',radius:R,halfStraight:HALF,trackWidth:LANE_WIDTH,
      trackLength:LENGTH,lanes:12}};
}
