#!/usr/bin/env node
/** Append-only local archive writer. No HTTP endpoint and no credentials. */
import {mkdir,readFile,writeFile,link,unlink,rename,open} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createCompletedSeason,assertSeasonSnapshot} from '../sports/seasonArchive.js';

const [cycle,...args]=process.argv.slice(2);
const getArg=key=>args.find(x=>x.startsWith(key+'='))?.slice(key.length+1);
if(!cycle||args.some(x=>!x.startsWith('--out='))){
 console.error('Uso: node scripts/archive-season.mjs YYYY-MM-DD [--out=temporadas/data]');
 process.exitCode=2;
}else{
 const folder=resolve(getArg('--out')||'temporadas/data');
 const lock=join(folder,'.archive.lock');
 let fd;
 try{
  const season=createCompletedSeason(cycle);
  assertSeasonSnapshot(season);
  await mkdir(folder,{recursive:true});
  fd=await open(lock,'wx'); // Serialize index writers, never silently overwrite a season.
  const file=cycle+'.json',dest=join(folder,file);
  const json=JSON.stringify(season,null,2)+'\n';
  const sha256=createHash('sha256').update(json).digest('hex');
  const temp=join(folder,'.'+file+'.'+randomUUID()+'.tmp');
  await writeFile(temp,json,{flag:'wx'});
  try{await link(temp,dest);}finally{await unlink(temp);}
  const indexPath=join(folder,'index.json');
  let index={contract:'cryptodromo.synthetic-season-index.v1',seasons:[]};
  try{index=JSON.parse(await readFile(indexPath,'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  if(index.contract!=='cryptodromo.synthetic-season-index.v1'||!Array.isArray(index.seasons))throw new Error('Invalid season index');
  if(index.seasons.some(x=>x.start===cycle))throw new Error('Season index already contains '+cycle);
  index.seasons.push({start:cycle,endExclusive:season.endExclusive,file,sha256,synthetic:true});
  index.seasons.sort((a,b)=>a.start.localeCompare(b.start));
  const tmpIndex=join(folder,'.index.'+randomUUID()+'.tmp');
  await writeFile(tmpIndex,JSON.stringify(index,null,2)+'\n',{flag:'wx'});
  try{await rename(tmpIndex,indexPath);}catch(error){await unlink(tmpIndex);throw error;}
  console.log(JSON.stringify({archived:cycle,file,sha256,events:season.events.length,synthetic:true}));
 }catch(error){console.error('Archive refused:',error.message);process.exitCode=1;}
 finally{if(fd){await fd.close();await unlink(lock).catch(()=>{});}}
}
