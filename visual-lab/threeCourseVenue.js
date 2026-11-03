/**
 * Alpha19 non-invasive stadium masterplan. Decorative only: NO race engine changes.
 * World XZ plan. Main LIVE currently swaps layouts; this plan is staged for
 * integration after concurrent work is merged. All three courses must stay visible.
 */
import {STADIUM_COURSES,courseAtMinute} from './threeCourseLayout.js';

export const VENUE_PLAN=Object.freeze({
  boundary:{halfWidth:580,halfDepth:285},
  mainGrandstand:{x:0,z:-245,width:370,depth:55},
  woodland:{outerX:680,outerZ:390,innerX:575,innerZ:285},
  // Diagonal Genesis uses the central clearance; its path is not parallel to oval straight.
  genesis:{centerX:0,centerZ:0,angleRadians:-0.20,length:780,width:40},
  // Architectural only. Exact paths and cross-track clearances require 3D validation.
  courses:STADIUM_COURSES
});
export function validateVenuePlan(plan=VENUE_PLAN){
 const g=plan.genesis;
 if(g.length<=0||g.width<=0||!Number.isFinite(g.angleRadians))throw new Error('Invalid Genesis geometry');
 if(Math.abs(g.angleRadians)<0.05)throw new Error('Genesis must be diagonal');
 if(plan.courses.length!==3||new Set(plan.courses.map(c=>c.id)).size!==3)throw new Error('Expected three independent courses');
 return true;
}
export function buildVenueForest({THREE,scene,quality='balanced',seed=1024}={}){
 if(!THREE||!scene)throw new TypeError('THREE and scene required');
 const root=new THREE.Group();root.name='Alpha19 · bosque perimetral';scene.add(root);
 const count=quality==='eco'?160:quality==='high'?900:420;
 const trunkGeometry=new THREE.CylinderGeometry(.65,1.1,7,5);
 const crownGeometry=new THREE.ConeGeometry(4.3,14,6);
 const trunks=new THREE.InstancedMesh(trunkGeometry,new THREE.MeshLambertMaterial({color:0x65503c}),count);
 const crowns=new THREE.InstancedMesh(crownGeometry,new THREE.MeshLambertMaterial({color:0x24543a}),count);
 const dummy=new THREE.Object3D();let state=seed>>>0;
 const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296};
 for(let i=0;i<count;i++){
   const side=Math.floor(random()*4),t=random()*2-1,depth=10+random()*105;
   const x=side<2?t*670:(side===2?-1:1)*(VENUE_PLAN.woodland.innerX+depth);
   const z=side>=2?t*370:(side===0?-1:1)*(VENUE_PLAN.woodland.innerZ+depth);
   const scale=.55+random()*.85;
   dummy.position.set(x,3.5*scale-.3,z);dummy.scale.setScalar(scale);dummy.rotation.y=random()*6.283;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.y=12.5*scale-.3;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
 }
 trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
 root.add(trunks,crowns);
 return {root,count,dispose(){scene.remove(root);trunkGeometry.dispose();crownGeometry.dispose();trunks.material.dispose();crowns.material.dispose();}};
}
export function getStadiumSchedule(minute){return courseAtMinute(minute);}
