/**
 * Satoshi static scenery instancing: same racecourse / forest coordinates,
 * fewer draw calls. Geometry ownership is local; supplied materials are NOT disposed.
 * All geometry is decorative; no effect on race timing, collision or positions.
 */
export const SATOSHI_STATIC_BATCH_VERSION='satoshi-static-batches-v1';

function batch(THREE,parent,name,geometry,material,placements){
  const mesh=new THREE.InstancedMesh(geometry,material,placements.length);
  mesh.name=name;
  mesh.castShadow=false; // distant scenery never needs per-object shadow passes
  mesh.receiveShadow=true;
  const dummy=new THREE.Object3D();
  placements.forEach(([x,y,z,sx=1,sy=1,sz=1],i)=>{
    dummy.position.set(x,y,z);
    dummy.rotation.set(0,0,0);
    dummy.scale.set(sx,sy,sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;
  mesh.computeBoundingSphere();
  parent.add(mesh);
  return mesh;
}

/**
 * 404 safety-rail posts, 100 back-fence posts and 78 distance slabs. 
 * The original long beams and the track surface remain untouched.
 */
export function createStraightCourseBatches({THREE,parent,railMaterial,steelMaterial}={}){
  if(!THREE||!parent||!railMaterial||!steelMaterial)
    throw new TypeError('THREE, parent, railMaterial and steelMaterial required');
  const root=new THREE.Group();root.name='Satoshi · instanced straight-course furniture';
  const postGeo=new THREE.CylinderGeometry(.055,.065,1.36,12);
  const cubeGeo=new THREE.BoxGeometry(1,1,1);
  const slabMaterial=new THREE.MeshStandardMaterial({color:'#efe4c6',roughness:.99});
  const railPosts=[],fencePosts=[],slabs=[];
  for(const z of [-20.2,20.2])
    for(let x=-402;x<=402;x+=4)railPosts.push([x,.60,z,1,1,1]);
  for(let x=-399;x<=399;x+=8)
    fencePosts.push([x,.65,53,.09,1.4,.10]);
  for(let x=-380;x<=380;x+=20)
    for(const z of [-17,17])slabs.push([x,.025,z,.34,.017,1.3]);
  const meshes=[
    batch(THREE,root,'Track · safety-rail uprights',postGeo,railMaterial,railPosts),
    batch(THREE,root,'Track · outer-fence uprights',cubeGeo,steelMaterial,fencePosts),
    batch(THREE,root,'Track · distance plaques',cubeGeo,slabMaterial,slabs)
  ];
  parent.add(root);
  return {root,meshes,stats:Object.freeze({
    version:SATOSHI_STATIC_BATCH_VERSION,
    railPosts:railPosts.length,fencePosts:fencePosts.length,markingSlabs:slabs.length,
    previousObjectCount:railPosts.length+fencePosts.length+slabs.length,
    instancedDrawGroups:meshes.length,
    racingSurfaceModified:false
  }),dispose(){
    root.removeFromParent();root.clear();
    postGeo.dispose();cubeGeo.dispose();slabMaterial.dispose();
    meshes.forEach(m=>m.dispose?.());
  }};
}

/** 3 individual meshes per tree become <=3 batched meshes per entire forest. */
export function createForestBatches({THREE,parent,trees=[],trunkMaterial,needleMaterial,lightMaterial}={}){
  if(!THREE||!parent||!trunkMaterial||!needleMaterial||!lightMaterial)
    throw new TypeError('THREE, parent and forest materials required');
  const root=new THREE.Group();root.name='Satoshi · instanced distant woodland';
  const trunkGeo=new THREE.CylinderGeometry(.22,.4,1,6);
  const coneGeo=new THREE.ConeGeometry(1,1,7);
  const trunks=[],lowerNeedles=[],lowerLight=[],upperNeedles=[];
  for(const tree of trees){
    const {x,z,h,light}=tree;
    if(![x,z,h].every(Number.isFinite)||h<=0||Math.abs(x)>500||Math.abs(z)<120)
      throw new RangeError('Distant woodland outside visual safety envelope');
    trunks.push([x,h*.21,z,1,h*.45,1]);
    const lower=[x,h*.57,z,h*.22,h*.64,h*.22];
    (light?lowerLight:lowerNeedles).push(lower);
    upperNeedles.push([x,h*.82,z,h*.16,h*.53,h*.16]);
  }
  const meshes=[];
  const maybe=(label,geo,material,items)=>{
    if(items.length)meshes.push(batch(THREE,root,label,geo,material,items));
  };
  maybe('Woodland · trunks',trunkGeo,trunkMaterial,trunks);
  maybe('Woodland · dark foliage',coneGeo,needleMaterial,lowerNeedles);
  maybe('Woodland · lighter foliage',coneGeo,lightMaterial,lowerLight);
  maybe('Woodland · canopy tips',coneGeo,needleMaterial,upperNeedles);
  parent.add(root);
  return {root,meshes,stats:Object.freeze({
    version:SATOSHI_STATIC_BATCH_VERSION,
    trees:trees.length,previousObjectCount:trees.length*3,
    instancedDrawGroups:meshes.length,
    courseModified:false
  }),dispose(){
    root.removeFromParent();root.clear();
    trunkGeo.dispose();coneGeo.dispose();meshes.forEach(m=>m.dispose?.());
  }};
}
