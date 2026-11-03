/**
 * One common camerawork console for race broadcast and Parade.
 * Bind to native form inputs, not to the race clock, Three.js, or finance.
 * Compatible with drag/touch/keyboard controls and with both modes' presets.
 */
const finiteNumber=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
export function bindCameraPanel(root,{onChange=()=>{}}={}){
 if(!root)throw Error('Missing camera panel');
 const fields=new Map();
 for(const node of root.querySelectorAll('[data-camera-field]')){
  const key=node.dataset.cameraField;
  if(fields.has(key))throw Error('Duplicate camera control '+key);
  const output=node.closest('label')?.querySelector('output')||null;
  const unit=node.dataset.unit??'';
  const start=finiteNumber(node.dataset.default,node.valueAsNumber);
  fields.set(key,{node,output,unit,start});
 }
 function updateLabel(key){
  const field=fields.get(key);
  if(!field)return;
  const value=finiteNumber(field.node.value);
  const text=(field.node.dataset.format==='percent'?Math.round(value)+'%':
   field.node.dataset.format==='decimal'?value.toFixed(1):Math.round(value))+field.unit;
  if(field.output)field.output.textContent=text;
  field.node.setAttribute('aria-valuetext',text);
 }
 function get(key){
  const field=fields.get(key);
  if(!field)throw RangeError('Unknown camera field '+key);
  return finiteNumber(field.node.value);
 }
 function set(key,value,{notify=true}={}){
  const field=fields.get(key);
  if(!field)throw RangeError('Unknown camera field '+key);
  const {node}=field;
  const lower=finiteNumber(node.min,-Infinity),upper=finiteNumber(node.max,Infinity);
  const clamped=Math.min(upper,Math.max(lower,finiteNumber(value,get(key))));
  node.value=String(clamped);
  updateLabel(key);
  if(notify)onChange(key,get(key));
  return get(key);
 }
 function nudge(key,step){return set(key,get(key)+finiteNumber(step));}
 function restore(){
  for(const [key,field] of fields)set(key,field.start,{notify:false});
  onChange('reset',Object.fromEntries([...fields].map(([key])=>[key,get(key)])));
 }
 function sync(state){
  for(const [key,value] of Object.entries(state||{}))if(fields.has(key))set(key,value,{notify:false});
 }
 for(const [key,field] of fields){
  field.node.addEventListener('input',()=>{updateLabel(key);onChange(key,get(key));});
  field.node.addEventListener('change',()=>{updateLabel(key);onChange(key,get(key));});
  updateLabel(key);
 }
 for(const button of root.querySelectorAll('[data-camera-nudge]')){
  button.addEventListener('click',()=>{
   const [key,increment]=button.dataset.cameraNudge.split(':');
   if(fields.has(key))nudge(key,Number(increment));
  });
 }
 root.querySelector('[data-camera-reset]')?.addEventListener('click',restore);
 return Object.freeze({fields:[...fields.keys()],get,set,nudge,sync,restore});
}
