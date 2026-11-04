/**
 * Stadium flight director. Purely visual: changes the visitor camera and target,
 * never fixture data, prices, race outcomes or the BTC horse model.
 */
export const travelEase=t=>{
 const x=Math.min(1,Math.max(0,Number.isFinite(t)?t:0));
 return x*x*(3-2*x);
};
export const isTravelClick=(from,to,threshold=7)=>
 !!from&&!!to&&Math.hypot(from.x-to.x,from.y-to.y)<=threshold;
export const clampTravelPoint=(x,z,extent=590)=>({
 x:Math.min(extent,Math.max(-extent,x)),
 z:Math.min(extent,Math.max(-extent,z))
});

export function initStadiumFlight({THREE,camera,controls,canvas,scene,toolbar,views,courseShots,onTrackFocus}){
 if(!THREE||!camera||!controls||!canvas||!toolbar)throw new TypeError('Flight controls missing');
 const raycaster=new THREE.Raycaster();
 const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const pointer=new THREE.Vector2(),hit=new THREE.Vector3();
 const startEye=new THREE.Vector3(),startTarget=new THREE.Vector3();
 const endEye=new THREE.Vector3(),endTarget=new THREE.Vector3();
 const temp=new THREE.Vector3(),forward=new THREE.Vector3(),side=new THREE.Vector3();
 const keyState=new Set();
 const buttonState=new Set();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const viewportHint=toolbar.querySelector('[data-flight-hint]');
 const speedSelect=toolbar.querySelector('[data-flight-speed]');
 const clickButton=toolbar.querySelector('[data-flight-action="click"]');
 const orbitButton=toolbar.querySelector('[data-flight-action="orbit"]');
 const speedSelect=toolbar.querySelector('[data-flight-speed]');
 let flyOn=true,autoOrbit=false,hovering=false,press=null,elapsed=0,tween=null,disposed=false;
 const clamp=n=>Math.min(650,Math.max(-650,n));
 const clampAltitude=y=>Math.min(520,Math.max(12,y));
 const setHint=text=>{if(viewportHint)viewportHint.textContent=text};
 canvas.tabIndex=0;
 canvas.setAttribute('aria-label','Estadio 3D. Arrastrá para mirar, clic para viajar. WASD para volar, Q/E para bajar o subir.');
 function stopTween(){tween=null;}
 function goTo(eye,target,duration=1.15){
  if(disposed)return;
  controls.autoRotate=false;autoOrbit=false;orbitButton?.setAttribute('aria-pressed','false');
  startEye.copy(camera.position);startTarget.copy(controls.target);
  endEye.set(...eye);endTarget.set(...target);
  endTarget.x=clamp(endTarget.x);endTarget.z=clamp(endTarget.z);
  endTarget.y=Math.max(-2,Math.min(240,endTarget.y));
  endEye.x=clamp(endEye.x);endEye.z=clamp(endEye.z);endEye.y=clampAltitude(endEye.y);
  const minimum=controls.minDistance||18;
  if(endEye.distanceTo(endTarget)<minimum){
   temp.subVectors(endEye,endTarget).normalize().multiplyScalar(minimum);
   if(!Number.isFinite(temp.x))temp.set(0,minimum,0);
   endEye.copy(endTarget).add(temp);
  }
  if(reduced||duration<=0){
   camera.position.copy(endEye);controls.target.copy(endTarget);controls.update();tween=null;
  }else tween={duration,elapsed:0};
 }
 function toPreset(name){
  const chosen=views[name]||courseShots[name];
  if(!chosen)return false;
  goTo(chosen.eye,chosen.target,1.2);
  setHint('Viajando a '+name.replace(/-/g,' ')+'…');
  return true;
 }
 function travelTo(point){
  const pt=clampTravelPoint(point.x,point.z);
  const dest=new THREE.Vector3(pt.x,Math.max(1,point.y||1),pt.z);
  temp.subVectors(camera.position,controls.target);
  // Close in to the target without diving through the ground or building.
  const currentLength=temp.length();
  temp.multiplyScalar(Math.min(1,160/Math.max(1,currentLength)));
  const newEye=dest.clone().add(temp);
  newEye.y=Math.max(18,newEye.y);
  goTo(newEye.toArray(),dest.toArray(),1.35);
  setHint('Sobrevolando destino · Arrastrá para reorientar');
 }
 function pointAtEvent(event){
  const rect=canvas.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return null;
  pointer.set((event.clientX-rect.left)/rect.width*2-1,
   -((event.clientY-rect.top)/rect.height*2-1));
  raycaster.setFromCamera(pointer,camera);
  if(!raycaster.ray.intersectPlane(plane,hit))return null;
  if(hit.distanceTo(camera.position)>1600)return null;
  return {x:hit.x,z:hit.z,y:1};
 }
 function onPointerDown(event){
  if(event.button!==0)return;
  canvas.focus({preventScroll:true});
  press={x:event.clientX,y:event.clientY,id:event.pointerId};
  stopTween();
 }
 function onPointerUp(event){
  if(!press||press.id!==event.pointerId)return;
  const moved=isTravelClick(press,{x:event.clientX,y:event.clientY});
  press=null;
  if(!flyOn||!moved||event.button!==0)return;
  const point=pointAtEvent(event);
  if(point)travelTo(point);
  else setHint('Apuntá al terreno y hacé clic para viajar');
 }
 function cancelPress(){press=null}
 function onWheel(){stopTween();}
 function onStartDrag(){stopTween();}
 const onEnter=()=>{hovering=true};
 const onLeave=()=>{hovering=false};
 canvas.addEventListener('pointerdown',onPointerDown);
 canvas.addEventListener('pointerup',onPointerUp);
 canvas.addEventListener('pointercancel',cancelPress);
 canvas.addEventListener('pointerleave',onLeave);
 canvas.addEventListener('pointerenter',onEnter);
 canvas.addEventListener('wheel',onWheel,{passive:true});
 controls.addEventListener('start',onStartDrag);

 const keyMap={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',
  KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',
  KeyQ:'down',PageDown:'down',KeyE:'up',PageUp:'up'};
 function onKeyDown(event){
  if(!hovering&&document.activeElement!==canvas)return;
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.target?.closest?.('input,select,textarea,button,[contenteditable]'))return;
  if(event.code==='ShiftLeft'||event.code==='ShiftRight'){keyState.add('boost');return;}
  const action=keyMap[event.code];
  if(!action)return;
  event.preventDefault();keyState.add(action);stopTween();
 }
 function onKeyUp(event){
  if(event.code==='ShiftLeft'||event.code==='ShiftRight')keyState.delete('boost');
  const action=keyMap[event.code];if(action)keyState.delete(action);
 }
 const onBlur=()=>keyState.clear();
 document.addEventListener('keydown',onKeyDown);
 document.addEventListener('keyup',onKeyUp);
 window.addEventListener('blur',onBlur);
 const buttons=[...toolbar.querySelectorAll('[data-flight-action]')];
 const stopButton=()=>buttonState.clear();
 function tapAction(name){
  if(name==='click'){
   flyOn=!flyOn;clickButton?.setAttribute('aria-pressed',String(flyOn));
   setHint(flyOn?'Clic en el terreno para volar hasta allí':'Viaje por clic desactivado');
  }else if(name==='orbit'){
   autoOrbit=!autoOrbit;stopTween();controls.autoRotate=autoOrbit;
   controls.autoRotateSpeed=.45;
   orbitButton?.setAttribute('aria-pressed',String(autoOrbit));
   setHint(autoOrbit?'Órbita automática activa':'Órbita automática detenida');
  }else if(name==='home')toPreset('aerial');
  else if(name==='reset'){toPreset('aerial');keyState.clear();}
  else if(name==='help')setHint('Arrastrar: girar · Clic: viajar · Rueda: zoom · WASD: volar · Q/E: altura · Shift: turbo');
 }
 for(const button of buttons){
  const action=button.dataset.flightAction;
  if(['forward','back','left','right','up','down'].includes(action)){
   button.addEventListener('pointerdown',event=>{event.preventDefault();buttonState.add(action);stopTween();button.setPointerCapture?.(event.pointerId)});
   button.addEventListener('pointerup',()=>buttonState.delete(action));
   button.addEventListener('pointercancel',()=>buttonState.delete(action));
   button.addEventListener('lostpointercapture',()=>buttonState.delete(action));
   // Keyboard activation must move the viewpoint even without pointer holding.
   button.addEventListener('click',()=>{nudge(action,12)});
  }else button.addEventListener('click',()=>tapAction(action));
 }
 for(const button of toolbar.querySelectorAll('[data-flight-view]')){
  button.addEventListener('click',()=>{
   toolbar.querySelectorAll('[data-flight-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
   button.setAttribute('aria-pressed','true');
   const name=button.dataset.flightView;
   if(courseShots[name])onTrackFocus?.(name);
   toPreset(name);
  });
 }
 const mapDirection=()=>{
  forward.subVectors(controls.target,camera.position);forward.y=0;
  if(forward.lengthSq()<.001)forward.set(0,0,-1);else forward.normalize();
  side.set(-forward.z,0,forward.x);
 };
 function nudge(action,amount){
  mapDirection();temp.set(0,0,0);
  if(action==='forward')temp.addScaledVector(forward,amount);
  else if(action==='back')temp.addScaledVector(forward,-amount);
  else if(action==='right')temp.addScaledVector(side,amount);
  else if(action==='left')temp.addScaledVector(side,-amount);
  else if(action==='up')temp.y+=amount;
  else if(action==='down')temp.y-=amount;
  // Keep the whole orbit rig moving, including the look-at point.
  const proposedY=clampAltitude(camera.position.y+temp.y);
  temp.y=proposedY-camera.position.y;
  if(Math.abs(controls.target.x+temp.x)>650||Math.abs(controls.target.z+temp.z)>650)return;
  camera.position.add(temp);controls.target.add(temp);
  controls.update();
 }
 function update(dt){
  if(disposed)return;
  const time=Math.max(0,Math.min(.05,dt||0));elapsed+=time;
  if(tween){
   tween.elapsed+=time;
   const t=travelEase(tween.elapsed/tween.duration);
   camera.position.copy(startEye).lerp(endEye,t);
   controls.target.copy(startTarget).lerp(endTarget,t);
   if(t>=1){tween=null;setHint('Destino alcanzado · Clic para elegir otro punto')}
  }
  const held=new Set([...buttonState,...keyState]);
  if(held.size){
   stopTween();
   let speed=Number(speedSelect?.value||1);
   if(!Number.isFinite(speed))speed=1;
   speed=Math.min(3,Math.max(.3,speed));
   const amount=time*65*speed*(held.has('boost')?3:1);
   for(const action of ['forward','back','left','right','up','down']){
    if(held.has(action))nudge(action,amount);
   }
  }
 }
 function dispose(){
  disposed=true;stopButton();keyState.clear();
  canvas.removeEventListener('pointerdown',onPointerDown);
  canvas.removeEventListener('pointerup',onPointerUp);
  canvas.removeEventListener('pointercancel',cancelPress);
  canvas.removeEventListener('pointerenter',onEnter);
  canvas.removeEventListener('pointerleave',onLeave);
  canvas.removeEventListener('wheel',onWheel);
  controls.removeEventListener('start',onStartDrag);
  document.removeEventListener('keydown',onKeyDown);
  document.removeEventListener('keyup',onKeyUp);
  window.removeEventListener('blur',onBlur);
 }
 return {goTo,toPreset,travelTo,update,dispose,
  get state(){return {flyOn,autoOrbit,traveling:!!tween,target:controls.target.toArray(),camera:camera.position.toArray()}},
  setEnabled(on){flyOn=!!on;clickButton?.setAttribute('aria-pressed',String(flyOn))}
 };
}
