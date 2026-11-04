import test from 'node:test';
import assert from 'node:assert/strict';
import {TOKEN_ROSTER} from '../race-lab/source/src/data/tokenRoster.js';
import {resolveHorseProfile,toMasterHorseOptions,toCurrentMayaPreviewOptions,applyHorseProfileToRenderer} from '../race-lab/source/src/data/horseProfileAdapter.js';

const makeProfile=(token)=>({
 name:'Edited '+token.name,
 appearance:{
  raceColor:'#112233',coatColor:'#445566',muzzleColor:'#aabbcc',
  maneColor:'#765432',tailColor:'#987654',hoofColor:'#1a1b1c',
  eyeColor:'#111111',legsColor:'#eeeeee',bridleColor:'#333333',
  appearanceMode:'natural_coat',maneStyle:'short',tailStyle:'long',
  maneScale:1.1,tailScale:1.25
 }
});

test('Exactly 100 stable symbols resolve independently; untouched tokens keep their defaults',()=>{
 assert.equal(TOKEN_ROSTER.length,100);
 assert.equal(new Set(TOKEN_ROSTER.map(t=>t.symbol)).size,100);
 const sourceSnapshot=JSON.stringify(TOKEN_ROSTER);
 const profiles={BTC:makeProfile(TOKEN_ROSTER[0]),ETH:makeProfile(TOKEN_ROSTER[1])};
 const mapping=TOKEN_ROSTER.map(t=>resolveHorseProfile(t,profiles));
 assert.equal(mapping.length,100);
 assert.equal(mapping.filter(p=>p.edited).length,2);
 assert.equal(mapping.find(p=>p.symbol==='BTC').name,'Edited Bitcoin');
 assert.equal(mapping.find(p=>p.symbol==='SOL').edited,false);
 assert.equal(mapping.find(p=>p.symbol==='SOL').raceColor,TOKEN_ROSTER.find(x=>x.symbol==='SOL').color);
 assert.equal(JSON.stringify(TOKEN_ROSTER),sourceSnapshot,'Do not mutate the official roster');
 for(const p of mapping){assert.ok(['short','medium','long'].includes(p.maneStyle));assert.ok(['short','medium','long'].includes(p.tailStyle));}
});

test('Master contract preserves independent coat, groom and crypto-brand colors',()=>{
 const t=TOKEN_ROSTER.find(x=>x.symbol==='BTC');
 const profiles={BTC:makeProfile(t)};
 const opt=toMasterHorseOptions(t,profiles);
 assert.equal(opt.symbol,'BTC');
 assert.equal(opt.coat,'#445566');
 assert.equal(opt.accent,'#112233');
 assert.deepEqual(opt.materials,{
  coat:'#445566',muzzle:'#aabbcc',mane:'#765432',tail:'#987654',
  hoof:'#1a1b1c',eye:'#111111',legs:'#eeeeee',bridle:'#333333'
 });
 assert.deepEqual(opt.groom,{maneScale:1.1,tailScale:1.25,maneStyle:'short',tailStyle:'long'});
 const maya=toCurrentMayaPreviewOptions(t,profiles);
 assert.equal(maya.brandMode,'natural_coat');
 assert.equal(maya.brandAccent,'#112233');
 assert.equal(maya.coatColor,'#445566');
 assert.equal(maya.color,'#765432');
 assert.equal(maya.tailColor,'#987654');
 assert.equal(maya.hoofColor,'#1a1b1c');
 assert.equal(maya.eyeColor,'#111111');
 assert.ok(Math.abs(maya.maneSize-1.22*1.1*.77)<1e-9);
 assert.ok(Math.abs(maya.tailSize-1.16*1.25*1.28)<1e-9);
});

test('Optional renderer methods receive visual-only fields; no race data is written',()=>{
 const t=TOKEN_ROSTER.find(x=>x.symbol==='BTC');
 const original={...t};
 const calls=[];
 const horse={
  setAppearance:v=>calls.push(['appearance',v]),
  setMaterialColors:v=>calls.push(['materials',v]),
  setGroom:v=>calls.push(['groom',v])
 };
 const p={BTC:makeProfile(t)};
 const settings=applyHorseProfileToRenderer(horse,t,p);
 assert.equal(settings.symbol,'BTC');
 assert.deepEqual(calls.map(x=>x[0]),['appearance','materials','groom']);
 assert.equal(calls[2][1].tailStyle,'long');
 assert.deepEqual(t,original,'A visual edit must not alter tier/weight/race identity');
 const noHooks=applyHorseProfileToRenderer({},t,p);
 assert.equal(noHooks.symbol,'BTC');
});
