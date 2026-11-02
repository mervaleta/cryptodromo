/** Visual-only TV shot selection, never influences race timing or results. */
export function tvShot(elapsed=0,{running=true}={}){
 if(!running)return 'paddock';
 const t=Math.max(0,Number(elapsed)||0);
 if(t>=57)return 'finish';
 if(t>=46)return 'chase';
 if(t>=38)return 'rail';
 if(t>=28)return 'drone';
 if(t>=18)return 'chase';
 if(t>=9)return 'rail';
 return 'chase';
}
export function cameraBlend(delta,sharpness=2.7){
 return 1-Math.exp(-Math.max(0,delta)*sharpness);
}
