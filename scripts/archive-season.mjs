#!/usr/bin/env node
import {writeCompletedSeason} from '../sports/archiveWriter.mjs';
const [cycle,...args]=process.argv.slice(2);
const out=args.find(x=>x.startsWith('--out='))?.slice(6)||'temporadas/data';
if(!cycle||args.some(x=>!x.startsWith('--out='))){
 console.error('Uso: node scripts/archive-season.mjs YYYY-MM-DD [--out=temporadas/data]');
 process.exitCode=2;
}else{
 try{console.log(JSON.stringify(await writeCompletedSeason({start:cycle,outDir:out}),null,2));}
 catch(error){console.error('Archive refused:',error.message);process.exitCode=1;}
}
