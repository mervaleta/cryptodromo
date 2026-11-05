/**
 * Articulated remote-grandstand silhouettes, using predictable GPU instancing.
 * Replaces the two primitive torso/head meshes without moving spectators,
 * changing the finish celebration, or modifying any live-race state.
 */
export const GRANDSTAND_FIGURE_VERSION='satoshi-grandstand-people-20261105-v1';
const coatSet=['#d2c1ab','#346d62','#9a5048','#e0d0b1','#4a6178','#786d52','#6e5369','#d3a070'];
const hairSet=['#292d30','#574432','#9c7c5a','#b4a38a','#3f312a'];
const pantsSet=['#3a4851','#42463e','#695647','#262e37','#625a4e'];
export function createSatoshiGrandstandCrowd({THREE,parent,people=[]}={}){
 if(!THREE||!parent)throw new TypeError('THREE and grandstand parent required');
 const root=new THREE.Group();root.name='Gradas históricas · siluetas humanas instanciadas';
 const geometries=[],materials=[],groups=[];
 const geom=g=>(geometries.push(g),g),mat=m=>(materials.push(m),m);
 const torso=geom(new THREE.CylinderGeometry(.245,.285,.72,7));
 const skull=geom(new THREE.SphereGeometry(.215,8,7));
 const hair=geom(new THREE.SphereGeometry(.221,8,5,0,Math.PI*2,0,Math.PI*.51));
 const limb=geom(new THREE.CylinderGeometry(.075,.097,1,6));
 const cube=geom(new THREE.BoxGeometry(1,1,1));
 const cloth=mat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}));
 const skin=mat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98}));
 const neutral=mat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96}));
 const dummy=new THREE.Object3D();
 const entries={
  torsos:[],heads:[],hair:[],sleeves:[],hands:[],legs:[],shoes:[],hats:[]
 };
 const add=(name,i,xyz,scale,color,rotation=[0,0,0])=>{
  entries[name].push({i,xyz,scale,color,rotation});
 };
 people.forEach((p,i)=>{
  if(![p.x,p.y,p.z].every(Number.isFinite)||p.z>-35||Math.abs(p.x)>400)
   throw new RangeError('Remote grandstand spectator must stay off every race lane');
  const seed=(Math.imul(i+1,2654435761)+1709)>>>0;
  const coat=p.coat||coatSet[(seed>>>3)%coatSet.length];
  const complexion=p.skin||'#c9a184';
  const ink=hairSet[(seed>>>5)%hairSet.length];
  const trouser=pantsSet[(seed>>>9)%pantsSet.length];
  const standing=(seed%6===0),cheering=seed%17===0;
  const yaw=Number.isFinite(p.yaw)?p.yaw:((seed%13)-6)*.025;
  const {x,y,z}=p;
  add('torsos',i,[x,y+.06,z],[.99,1,.90],coat,[0,yaw,0]);
  add('heads',i,[x,y+.59,z+.015],[1,1,1],complexion);
  add('hair',i,[x,y+.59,z+.015],[1,1,1],ink);
  for(const side of [-1,1]){
   const raised=cheering&&(side>0||seed%3===0);
   add('sleeves',i,[x+side*.305,y+(raised?.35:-.06),z+.03],
     [.92,raised?.61:.50,.88],coat,[0,0,side*(raised?.52:.13)]);
   add('hands',i,[x+side*(raised?.50:.35),y+(raised?.65:-.30),z+.04],
     [.34,.34,.34],complexion);
   add('legs',i,[x+side*.15,y-(standing?.55:.43),z+(standing?0:.15)],
     [.92,standing?.69:.48,.92],trouser,[standing?0:-.36,0,0]);
   add('shoes',i,[x+side*.15,y-(standing?.93:.69),z+(standing?.09:.37)],
     [.24,.12,.35],'#302c2a');
  }
  if(seed%9===0)add('hats',i,[x,y+.85,z+.015],[.48,.12,.47],coat);
 });
 const specs=[
  ['torsos',torso,cloth],['heads',skull,skin],['hair',hair,neutral],
  ['sleeves',limb,cloth],['hands',skull,skin],['legs',limb,neutral],
  ['shoes',cube,neutral],['hats',cube,cloth]
 ];
 for(const [name,geometry,material] of specs){
  const poses=entries[name];
  if(!poses.length)continue;
  const mesh=new THREE.InstancedMesh(geometry,material,poses.length);
  mesh.name='Remote grandstand · '+name;
  mesh.castShadow=false;mesh.receiveShadow=false;
  poses.forEach((pose,j)=>{
   dummy.position.set(...pose.xyz);
   dummy.rotation.set(...pose.rotation);
   dummy.scale.set(...pose.scale);
   dummy.updateMatrix();
   mesh.setMatrixAt(j,dummy.matrix);
   mesh.setColorAt(j,new THREE.Color(pose.color));
  });
  mesh.instanceMatrix.needsUpdate=true;
  mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();
  root.add(mesh);
  groups.push({name,mesh,indices:poses.map(p=>p.i),capacity:poses.length});
 }
 parent.add(root);
 let visibleCount=people.length;
 function setPopulation(n){
  visibleCount=Math.max(0,Math.min(people.length,Math.floor(Number(n)||0)));
  for(const {mesh,indices} of groups){
   // Items are ordered by person index; preserve complete silhouettes when
   // the graphics governor reduces distant-audience population.
   let low=0,high=indices.length;
   while(low<high){const m=(low+high)>>>1;
    if(indices[m]<visibleCount)low=m+1;else high=m;
   }
   mesh.count=low;
  }
 }
 function dispose(){
  root.removeFromParent();root.clear();
  for(const {mesh} of groups)mesh.dispose?.();
  geometries.forEach(g=>g.dispose());
  materials.forEach(m=>m.dispose());
 }
 return {
  root,meshes:groups.map(g=>g.mesh),setPopulation,dispose,
  stats:Object.freeze({
   version:GRANDSTAND_FIGURE_VERSION,people:people.length,
   parts:groups.length,batched:true,trackModified:false,
   originalCoordinatesRetained:true
  }),
  get visibleCount(){return visibleCount;}
 };
}
