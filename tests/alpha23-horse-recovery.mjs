import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadHorsesWithRecovery,horseCreationOptions} from '../visual-lab/horseLoadRecovery.js';
const coats=Array.from({length:12},(_,i)=>'#'+String(111111+i).padStart(6,'0'));
const entries=Array.from({length:12},(_,i)=>({
 symbol:'TOKEN'+i,color:'#ccaa22',coat:coats[i]
}));
const newModel=i=>({root:{name:'Horse '+i},update(){},dispose(){newModel.disposed++}});
newModel.disposed=0;
test('recovery reuses official roster identity and never changes ranking source',()=>{
 const a=horseCreationOptions(entries[2],2,coats);
 assert.equal(a.stallNumber,3);assert.equal(a.symbol,'TOKEN2');
 assert.equal(a.coat,entries[2].coat);
 assert.equal(a.phase,.26);
 assert.equal(a.height,2.85);
 assert.ok(Object.is(entries[2].symbol,'TOKEN2'));
});
test('healthy load leaves twelve primary horses untouched',async()=>{
 const req=[];
 const result=await loadHorsesWithRecovery({entries,coats,requestedMode:'legacy',
  primary:async x=>(req.push(x),newModel(x.stallNumber)),
  procedural:()=>{throw Error('must not invoke fallback')}
 });
 assert.equal(result.models.length,12);
 assert.deepEqual(result.recovered,[]);
 assert.equal(req.length,12);
});
test('failed main horse engine recovers all twelve with full procedural animals',async()=>{
 const old=console.error;
 console.error=()=>{};
 try{
  const result=await loadHorsesWithRecovery({entries,coats,requestedMode:'legacy',
   primary:async()=>{throw Error('horse.glb.gz HTTP 404')},
   procedural:o=>({...newModel(o.stallNumber),generated:true})
  });
  assert.equal(result.models.length,12);
  assert.equal(result.recovered.length,12);
  assert.deepEqual(result.recovered.map(x=>x.lane),Array.from({length:12},(_,i)=>i+1));
  assert.ok(result.models.every(h=>h.generated===true));
  assert.equal(result.recovered[0].reason,'Error: horse.glb.gz HTTP 404');
 }finally{console.error=old;}
});
test('partial failure keeps successful models; does not create duplicate runners',async()=>{
 const old=console.error;console.error=()=>{};
 try{
  const result=await loadHorsesWithRecovery({entries,coats,
   primary:o=>o.stallNumber%2===0?Promise.reject(Error('failed')):newModel(o.stallNumber),
   procedural:o=>({...newModel(o.stallNumber),generated:true})
  });
  assert.equal(result.models.length,12);
  assert.equal(result.recovered.length,6);
  assert.equal(new Set(result.models.map(h=>h.root.name)).size,12);
 }finally{console.error=old;}
});
test('if both engines fail, dispose partial models and block dishonest box fallback',async()=>{
 newModel.disposed=0;const old=console.error;console.error=()=>{};
 try{
  await assert.rejects(loadHorsesWithRecovery({entries,coats,
   primary:o=>o.stallNumber===12?Promise.reject(Error('primary')):newModel(o.stallNumber),
   procedural:()=>{throw Error('GPU unsupported')}
  }),error=>error instanceof AggregateError&&/box-and-sphere placeholders/.test(error.message));
  assert.equal(newModel.disposed,11);
 }finally{console.error=old;}
});
test('LIVE source no longer renders fake oval-body, cube-neck, four-stick emergency horses',()=>{
 const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
 assert.match(scene,/loadHorsesWithRecovery/);
 assert.doesNotMatch(scene,/new THREE\.SphereGeometry\(\.95,12,9\)/);
 assert.doesNotMatch(scene,/box\(\.53,1\.15,\.54,\.84,1\.67,0/);
 assert.match(scene,/horse-engine-recovery-warning/);
 assert.match(scene,/unapprovedBoxHorses:0/);
});
