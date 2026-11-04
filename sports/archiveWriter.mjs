/** Node-only append-only archive writer, never exposed as an HTTP API. */
import {mkdir,readFile,writeFile,link,unlink,rename,open} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createCompletedSeason,assertSeasonSnapshot} from './seasonArchive.js';

const INDEX_CONTRACT='cryptodromo.synthetic-season-index.v1';
export async function writeCompletedSeason({start,outDir='temporadas/data',now=new Date()}={}){
 const snapshot=createCompletedSeason(start,{now});
 assertSeasonSnapshot(snapshot);
 const folder=resolve(outDir),file=start+'.json',dest=join(folder,file),indexPath=join(folder,'index.json');
 const json=JSON.stringify(snapshot,null,2)+'\n';
 const sha256=createHash('sha256').update(json).digest('hex');
 await mkdir(folder,{recursive:true});
 const lock=join(folder,'.archive.lock');
 const fd=await open(lock,'wx'); // Serialize writers.
 try{
  let index={contract:INDEX_CONTRACT,seasons:[]};
  try{index=JSON.parse(await readFile(indexPath,'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  if(index.contract!==INDEX_CONTRACT||!Array.isArray(index.seasons))throw new Error('Invalid archive index');
  const earlier=index.seasons.find(e=>e.start===start);
  if(earlier){
   if(earlier.sha256!==sha256||earlier.file!==file)throw new Error('Archived season hash mismatch');
   if(await readFile(dest,'utf8')!==json)throw new Error('Archived file changed');
   return {start,file,sha256,alreadyArchived:true,count:snapshot.events.length};
  }
  let exists=false;
  try{exists=(await readFile(dest,'utf8'))===json;}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!exists){
   const temp=join(folder,'.'+file+'.'+randomUUID()+'.tmp');
   await writeFile(temp,json,{flag:'wx'});
   try{
    try{await link(temp,dest);}
    catch(error){
     if(error.code!=='EEXIST')throw error;
     if(await readFile(dest,'utf8')!==json)throw new Error('Existing archive differs. Refusing to overwrite');
    }
   }finally{await unlink(temp).catch(()=>{});}
  }
  index.seasons.push({start,endExclusive:snapshot.endExclusive,file,sha256,synthetic:true});
  index.seasons.sort((a,b)=>a.start.localeCompare(b.start));
  const tmpIndex=join(folder,'.index.'+randomUUID()+'.tmp');
  await writeFile(tmpIndex,JSON.stringify(index,null,2)+'\n',{flag:'wx'});
  try{await rename(tmpIndex,indexPath);}
  catch(error){await unlink(tmpIndex).catch(()=>{});throw error;}
  return {start,file,sha256,alreadyArchived:false,count:snapshot.events.length};
 }finally{await fd.close();await unlink(lock).catch(()=>{});}
}
