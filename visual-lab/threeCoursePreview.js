import {trackPoint} from './trackMath.js';
import {STADIUM_COURSES} from './threeCourseLayout.js';

/**
 * Alpha19 physical three-track seed inside the Satoshi venue museum.
 * Rendering only. Live races use the same course modes, independently of
 * official finance ranking. All tracks remain visible at once in this museum.
 */
export const THREE_COURSE_POSITIONS=Object.freeze({
 muybridge:Object.freeze({mode:'oval',centerZ:0,scaleX:1,angle:0,color:0x936c45}),
 genesis:Object.freeze({mode:'straight',centerZ:186,scaleX:.76,angle:-.21,color:0xb69b77}),
 'vint-cerf':Object.freeze({mode:'s-bend',centerZ:-180,scaleX:.76,angle:0,color:0x6c8f65})
});
function world(id,p,lateral=0){
 const config=THREE_COURSE_POSITIONS[id];
 if(!config)throw new RangeError('Unknown course');
 const center=trackPoint(config.mode,p);
 const x=center.x*config.scaleX+lateral*center.sideX;
 const z=center.z+lateral*center.sideZ;
 const a=config.angle;
 return {x:x*Math.cos(a)-z*Math.sin(a),
         z:x*Math.sin(a)+z*Math.cos(a)+config.centerZ};
}
export function buildThreeCoursePreview({THREE,scene,quality='medium'}={}){
 if(!THREE||!scene)throw new TypeError('THREE and scene required');
 const root=new THREE.Group();root.name='SATOSHI_3_INDEPENDENT_COURSES';scene.add(root);
 const geometries=[],materials=[];
 const ownGeo=g=>(geometries.push(g),g),ownMat=m=>(materials.push(m),m);
 const railing=ownMat(new THREE.MeshStandardMaterial({color:0xecf0e4,roughness:.72,metalness:.08}));
 const edge=ownMat(new THREE.MeshStandardMaterial({color:0x334a38,roughness:.95}));
 const marker=ownMat(new THREE.LineBasicMaterial({color:0xe5c27c}));
 const detail=quality==='low'?90:quality==='high'?320:180;
 const makeRibbon=(id,material,halfWidth,y)=>{
   const points=[],idx=[];
   for(let i=0;i<=detail;i++){
     const p=i/detail,a=world(id,p,-halfWidth),b=world(id,p,halfWidth);
     points.push(a.x,y,a.z,b.x,y,b.z);
     if(i<detail){let n=2*i;idx.push(n,n+2,n+1,n+1,n+2,n+3);}
   }
   const geo=ownGeo(new THREE.BufferGeometry());
   geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
   geo.setIndex(idx);geo.computeVertexNormals();
   const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;mesh.material.side=THREE.DoubleSide;
   root.add(mesh);
 };
 for(const t of STADIUM_COURSES){
   const id=t.id,config=THREE_COURSE_POSITIONS[id],mat=ownMat(new THREE.MeshStandardMaterial({color:config.color,roughness:.92,side:THREE.DoubleSide}));
   makeRibbon(id,edge,20.5,.065);makeRibbon(id,mat,17,.09);
   for(const lateral of [-20,20]){
     const pts=[];
     for(let i=0;i<=detail;i++){
       const a=world(id,i/detail,lateral);pts.push(new THREE.Vector3(a.x,1.35,a.z));
     }
     const curve=new THREE.CatmullRomCurve3(pts,id==='muybridge','centripetal');
     const geo=ownGeo(new THREE.TubeGeometry(curve,detail,.14,5,id==='muybridge'));
     const rail=new THREE.Mesh(geo,railing);rail.castShadow=false;root.add(rail);
   }
   for(const p of [0,1]){
     if(id==='muybridge'&&p===1)continue;
     const a=world(id,p,-17),b=world(id,p,17);
     const verts=[a.x,.14,a.z,b.x,.14,b.z];
     const geo=ownGeo(new THREE.BufferGeometry());
     geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
     root.add(new THREE.Line(geo,marker));
   }
 }
 return {root,courses:STADIUM_COURSES.map(c=>c.id),dispose(){
   scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
   root.clear();
 }};
}
