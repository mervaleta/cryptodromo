/**
 * Original, locally synthesized racing ambience (no music, no copyrighted
 * recordings). Muted until the user explicitly enables it.
 */
export function createRaceAudio(){
 let ctx=null,enabled=false,hoofAt=0,crowd=null,wind=null,noiseSource=null,noiseGain=null;
 function start(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)return false;
  if(!ctx){
   ctx=new AudioContext();
   const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
   const d=buffer.getChannelData(0);
   let seed=52315;
   for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/2147483648-1);}
   noiseSource=ctx.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;
   const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=230;
   noiseGain=ctx.createGain();noiseGain.gain.value=.022;
   noiseSource.connect(low);low.connect(noiseGain);noiseGain.connect(ctx.destination);noiseSource.start();
  }
  ctx.resume();enabled=true;return true;
 }
 function soundImpact(){
  if(!enabled||!ctx)return;
  const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type='triangle';osc.frequency.setValueAtTime(86,now);osc.frequency.exponentialRampToValueAtTime(43,now+.085);
  filter.type='lowpass';filter.frequency.value=410;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.11,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.09);
  osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
  osc.start(now);osc.stop(now+.10);
 }
 function update(seconds,weather='golden',velocityRatio=1){
  if(!enabled||!ctx)return;
  const current=Math.max(0,seconds);
  noiseGain.gain.setTargetAtTime(weather==='rain'?.055:.025,ctx.currentTime,.1);
  const step=.29/Math.max(.65,Math.min(1.75,velocityRatio));
  if(current>=hoofAt){soundImpact();hoofAt=current+step;}
 }
 function stop(){enabled=false;if(noiseGain&&ctx)noiseGain.gain.setTargetAtTime(0,ctx.currentTime,.1);}
 return {start,stop,update,get enabled(){return enabled;}};
}
export function createNarration(){
 let active=false;
 function toggle(){
  active=!active;
  if(!active&&'speechSynthesis'in window)window.speechSynthesis.cancel();
  return active;
 }
 function say(message){
  if(!active||!('speechSynthesis'in window))return;
  // Short, deterministic original phrase fragments chained at race events.
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(message);
  utterance.lang='es-AR';utterance.rate=1.24;utterance.pitch=1.02;utterance.volume=.88;
  const voices=window.speechSynthesis.getVoices();
  const selected=voices.find(v=>v.lang.toLowerCase()==='es-ar')||voices.find(v=>v.lang.toLowerCase().startsWith('es'));
  if(selected)utterance.voice=selected;
  window.speechSynthesis.speak(utterance);
 }
 function stop(){active=false;if('speechSynthesis'in window)window.speechSynthesis.cancel();}
 return {say,toggle,stop,get active(){return active;}};
}
