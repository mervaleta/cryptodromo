/**
 * Alpha22 four-hoof gallop path with a planar two-link solver.
 * Contact coordinates are display-only: never write the official horse root
 * position, financial distance, broadcast speed or finish ranking.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const fract=x=>((x%1)+1)%1;
export const EQUINE_CONTACTS=Object.freeze([
 Object.freeze({leg:'hind-trailing',index:2,contact:.03,stance:.48}),
 Object.freeze({leg:'hind-leading',index:3,contact:.14,stance:.48}),
 Object.freeze({leg:'fore-trailing',index:0,contact:.28,stance:.47}),
 Object.freeze({leg:'fore-leading',index:1,contact:.43,stance:.47})
]);
const legContact=index=>EQUINE_CONTACTS.find(c=>c.index===index);
export function hoofTrajectory(phase,index,{stride=.42,lift=.22}={}){
 const marker=legContact(index);
 if(!marker)throw RangeError('No hoof contact phase for index '+index);
 const p=fract(phase-marker.contact),span=marker.stance;
 const st=Math.max(.01,span),flight=Math.max(.01,1-st);
 if(p<=st){
  // Plant and push: hoof tracks backwards relative to the moving torso.
  const t=p/st;
  return {x:stride*(.5-t),lift:0,planted:true,localPhase:p};
 }
 const t=(p-st)/flight,arc=Math.sin(Math.PI*t);
 // Recover foot during swing. The arc is lifted, not dragged on the ground.
 const ease=t*t*(3-2*t);
 return {x:stride*(ease-.5),lift:lift*Math.max(0,arc),planted:false,localPhase:p};
}
export function twoBoneIK({x,y,upper=.61,lower=.65,hind=false,upperRest=0,lowerRest=0}={}){
 const L1=clamp(upper,.05,3),L2=clamp(lower,.05,3);
 const magnitude=Math.hypot(x,y)||.0001;
 const maxReach=L1+L2-.008,minReach=Math.abs(L1-L2)+.008;
 const reach=clamp(magnitude,minReach,maxReach);
 const s=reach/magnitude,dx=x*s,dy=y*s;
 const cosK=clamp((reach*reach-L1*L1-L2*L2)/(2*L1*L2),-1,1);
 const knee=(hind?-1:1)*Math.acos(cosK);
 // Angles use +X as forward and -Y as gravity, so positive means forward.
 const shoulder=Math.atan2(dx,-dy)-
   Math.atan2(L2*Math.sin(knee),L1+L2*Math.cos(knee));
 return {
  shoulder:shoulder-upperRest,
  knee:knee-(lowerRest-upperRest),
  footDirection:shoulder+knee,
  reachable:magnitude<=maxReach&&magnitude>=minReach,
  error:Math.abs(magnitude-reach)
 };
}
export function gallopLegPose(phase,index,{speed=1,legLength=1}={}){
 const hind=index>=2,rate=clamp(speed,.4,2.0);
 const path=hoofTrajectory(phase,index,{
  stride:(hind?.40:.44)*(.82+.12*rate),
  lift:(hind?.22:.25)*(.84+.12*rate)
 });
 const upper=hind?.604:.594,lower=hind?.696:.620;
 const anchorY=hind?1.42:1.36,ankleGround=hind?.24:.23;
 const upperRest=hind?Math.atan2(-.17,.58):Math.atan2(.07,.59);
 const lowerRest=hind?Math.atan2(.19,.67):Math.atan2(-.015,.62);
 const ik=twoBoneIK({
  x:(hind?-.025:.018)+path.x,
  y:ankleGround-anchorY+path.lift,
  upper:upper*legLength,lower:lower*legLength,
  hind,upperRest,lowerRest
 });
 return {...ik,planted:path.planted,lift:path.lift,
  phase:path.localPhase,x:path.x};
}
export function quadrupedSupport(phase){
 const support=EQUINE_CONTACTS.map(x=>hoofTrajectory(phase,x.index).planted);
 return {planted:support.filter(Boolean).length,support,
  airborne:support.every(v=>!v)};
}
