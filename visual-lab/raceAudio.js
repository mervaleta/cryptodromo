/**
 * Original synthesized stadium soundstage. WebAudio starts only after a real
 * click (browser autoplay policy), with a useful audible default mix.
 * 4-beat hooves on a distance-synchronised cadence, three surfaces and weather.
 * No copyrighted recordings and no network audio requests.
 */
export function createRaceAudio(){
 let ctx,master,crowdGain,noise,bedBuffer,playing=false,manualMute=false;
 let volume=.9,nextHoof=0,beat=0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function init(){
  if(ctx)return true;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)return false;
  ctx=new AudioCtor();master=ctx.createGain();master.gain.value=volume;
  master.connect(ctx.destination);
  const seconds=2,buffer=ctx.createBuffer(1,ctx.sampleRate*seconds,ctx.sampleRate);
  const samples=buffer.getChannelData(0);let seed=732923;
  for(let i=0;i<samples.length;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   samples[i]=seed/2147483648-1;
  }
  bedBuffer=buffer;
  noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=480;
  crowdGain=ctx.createGain();crowdGain.gain.value=.075;
  noise.connect(low);low.connect(crowdGain);crowdGain.connect(master);noise.start();
  return true;
 }
 function start(){
  if(!init())return false;
  playing=true;manualMute=false;
  ctx.resume();
  master.gain.setTargetAtTime(volume,ctx.currentTime,.04);
  return true;
 }
 function stop(){
  playing=false;manualMute=true;
  if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.05);
 }
 function setVolume(value){
  volume=clamp(Number(value),0,1);
  if(ctx)master.gain.setTargetAtTime(playing?volume:0,ctx.currentTime,.025);
 }
 function thump(surface,wet,accent){
  if(!playing||!ctx||ctx.state!=='running')return;
  const now=ctx.currentTime;
  const amp=surface==='synthetic'?.27:surface==='grass'?.23:.34;
  const fundamental=surface==='synthetic'?119:surface==='grass'?88:72;
  // Low impact body (horse weight); the transient is a band-passed noise snap.
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='triangle';
  osc.frequency.setValueAtTime(fundamental*(accent?1.14:1),now);
  osc.frequency.exponentialRampToValueAtTime(fundamental*.52,now+.095);
  gain.gain.setValueAtTime(.001,now);
  gain.gain.exponentialRampToValueAtTime(amp*(accent?1.12:.8),now+.003);
  gain.gain.exponentialRampToValueAtTime(.001,now+.155);
  osc.connect(gain).connect(master);osc.start(now);osc.stop(now+.17);
  const click=ctx.createBufferSource();click.buffer=bedBuffer;
  const filter=ctx.createBiquadFilter();filter.type='bandpass';
  filter.frequency.value=wet?1050:surface==='grass'?770:1750;filter.Q.value=.8;
  const snap=ctx.createGain();snap.gain.setValueAtTime(.001,now);
  snap.gain.exponentialRampToValueAtTime(wet?.12:.19,now+.002);
  snap.gain.exponentialRampToValueAtTime(.001,now+.060);
  click.connect(filter).connect(snap).connect(master);
  click.start(now,Math.random()*.9,.085);click.stop(now+.09);
 }
 function update(time,weather='golden',pace=1,surface='dirt'){
  if(!ctx||!playing)return;
  const now=ctx.currentTime,wet=weather==='rain';
  crowdGain.gain.setTargetAtTime(wet?.115:.082,now,.1);
  // Athletic gallop: 2.2–3.0 strides/sec, four separately audible hoof contacts.
  // To prevent a wall of clicks, broadcast a prominent 4-beat leading horse.
  const cycles=clamp(2.15+Math.max(0,pace-1)*.38,2.1,3.05);
  const interval=1/(cycles*4);
  if(time+2<nextHoof)nextHoof=time;
  if(time>=nextHoof){
   thump(surface,wet,beat===3);
   beat=(beat+1)%4;
   nextHoof=time+interval;
  }
 }
 return {start,stop,update,setVolume,get enabled(){return playing},get volume(){return volume}};
}
export function createNarration(){
 let enabled=false,lastMessage='',lastAt=0;
 function toggle(){enabled=!enabled;if(!enabled&&'speechSynthesis'in window)window.speechSynthesis.cancel();return enabled;}
 function say(message,{urgent=false}={}){
  if(!enabled||!('speechSynthesis'in window)||!message)return false;
  const now=Date.now();
  if(!urgent&&now-lastAt<1800)return false;
  if(message===lastMessage&&now-lastAt<6500)return false;
  if(window.speechSynthesis.speaking&&urgent)window.speechSynthesis.cancel();
  else if(window.speechSynthesis.pending)return false;
  const utterance=new SpeechSynthesisUtterance(message);
  utterance.lang='es-AR';utterance.rate=1.19;utterance.pitch=.96;utterance.volume=1;
  const voices=window.speechSynthesis.getVoices();
  const selected=voices.find(v=>v.lang.toLowerCase()==='es-ar')||voices.find(v=>v.lang.toLowerCase().startsWith('es'));
  if(selected)utterance.voice=selected;
  window.speechSynthesis.speak(utterance);lastMessage=message;lastAt=now;
  return true;
 }
 function stop(){enabled=false;if('speechSynthesis'in window)window.speechSynthesis.cancel();}
 return {toggle,say,stop,get active(){return enabled}};
}
