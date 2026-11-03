/* Pure, deterministic quadruped helpers. Never inspect or alter financial inputs. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
export function hashHorseSeed(symbol){
 let h=2166136261;
 for(const ch of String(symbol)){h=Math.imul(h^ch.charCodeAt(0),16777619);}
 return h>>>0;
}
export function solveLegIK(hip,foot,upper=.70,lower=.73,bend=1){
 const dx=foot.x-hip.x,dy=foot.y-hip.y;
 const raw=Math.hypot(dx,dy)||1,d=clamp(raw,.001,upper+lower-.001);
 const along=(upper*upper+d*d-lower*lower)/(2*d);
 const high=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {x:hip.x+dx/raw*along-dy/raw*high*bend,
         y:hip.y+dy/raw*along+dx/raw*high*bend,z:hip.z};
}
