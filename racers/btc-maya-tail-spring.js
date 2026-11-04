/** Native-Gallop-driven but damped secondary tail motion.
 * Does not rotate bones or edit AnimationMixer; operates on hair-tip shader
 * uniforms, with the dock pinned at u=0 and loose ends carrying the inertia.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
export function createBTCTailSpring(){
 let sway=0,swayV=0,lift=0,liftV=0,flutter=0,t=0,energy=0;
 return {
  update(dt,{phase=0,wind=0,speed=1,running=true}={}){
   const step=clamp(dt,0,.05);
   t+=step;
   const drive=running?1:0;
   energy+= (drive-energy)*Math.min(1,step*5);
   const cycle=((Number(phase)||0)%1+1)%1*2*Math.PI;
   const targetSway=drive*(.77*Math.sin(cycle-.90)+.18*Math.sin(cycle*2-1.65))+
    Math.min(2,Math.max(0,wind))*.12*energy;
   const targetLift=drive*(.38+.55*Math.sin(cycle-1.1)+.13*Math.sin(cycle*2+.3));
   const freq=drive?72:24,damping=drive?14:12.5;
   swayV+=(freq*(targetSway-sway)-damping*swayV)*step;
   sway+=swayV*step;
   liftV+=(freq*(targetLift-lift)-damping*liftV)*step;
   lift+=liftV*step;
   flutter=drive*Math.sin(t*(8.5+clamp(speed,.3,2)*2.2)-.67)*.34;
   return {sway:clamp(sway,-1.8,1.8),lift:clamp(lift,-1.5,1.5),
    flutter,energy:clamp(energy,0,1)};
  },
  reset(){sway=swayV=lift=liftV=flutter=t=energy=0;},
  get state(){return {sway,lift,flutter,energy};}
 };
}
