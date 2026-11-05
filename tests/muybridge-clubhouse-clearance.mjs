import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PAVILION_OFFSET_Z,PAVILION_BASE_BOUNDS,PAVILION_FORECOURT_BOUNDS,
 PAVILION_FOUNDATION_Y,PAVILION_UPPER_ROOF_Y,PAVILION_GRANDSTAND_CAMERA_Z,
 pavilionPlacementAudit,clubhouseCourseClearance
} from '../visual-lab/pavilionPlacement.js';
import {trackPoint} from '../visual-lab/trackMath.js';

const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
const baselineFile=readFileSync(new URL('../race-lab/source/src/data/officialRace.js',import.meta.url),'utf8');

test('Muybridge clubhouse must be behind spectator structures, not across the back straight',()=>{
 const audit=pavilionPlacementAudit();
 assert.equal(PAVILION_OFFSET_Z,-67);
 assert.equal(PAVILION_BASE_BOUNDS.minZ,-158.5);
 assert.equal(PAVILION_BASE_BOUNDS.maxZ,-131.5);
 assert.equal(PAVILION_FORECOURT_BOUNDS.maxZ,-129.5);
 assert.ok(audit.standGap>=4,'leave walking space behind grandstand roof');
 assert.ok(Math.abs(audit.ovalClearance-36.5)<.15,
   'oval clearance must use the TRUE 72m backstraight and its -93m outer lane');
 assert.ok(audit.straightClearance>25);
 assert.ok(audit.sBendClearance>25);
 assert.equal(audit.trackSignWorldZ,-103);
 assert.equal(PAVILION_GRANDSTAND_CAMERA_Z,-119);
 assert.ok(PAVILION_GRANDSTAND_CAMERA_Z<-104,'camera must be behind rail and spectator bank');
 assert.match(scene,/goal\.set\(0,27,PAVILION_GRANDSTAND_CAMERA_Z\)/);
 assert.doesNotMatch(scene,/goal\.set\(0,27,-68\)/);
 // An extra dense sample protects against track math refinement later.
 for(const layout of ['oval','straight','s-bend'])
   assert.ok(clubhouseCourseClearance(layout,1000)>25,layout+' intersects the pavilion');
 assert.ok(Math.abs(clubhouseCourseClearance('oval',1000)-36.5)<.15);
 const midway=trackPoint('oval',.625,5.5);
 assert.ok(Math.abs(midway.z+72)<.001,'back straight must be where expected');
});

test('building, forecourt and signs all move together, finish line stays independent',()=>{
 assert.match(scene,/pavilion\.position\.z=PAVILION_OFFSET_Z/);
 assert.match(scene,/box\(93,1\.35,27,0,PAVILION_FOUNDATION_Y,-78,C\.concrete,pavilion\)/);
 assert.match(scene,/box\(105,\.35,11,0,1\.15,-68,C\.stone,pavilion\)/);
 assert.match(scene,/vip\.position\.set\(0,0,-78\);pavilion\.add\(vip\)/);
 assert.match(scene,/sign\('CRYPTÓDROMO · SATOSHI NAKAMOTO',0,18\.2,-72,64,4\.7,pavilion\)/);
 assert.match(scene,/sign\('PISTA EADWEARD MUYBRIDGE',0,3\.1,-36,52,3\.0,pavilion\)/);
 assert.match(scene,/const finishSign=sign\('META · FINISH',VISUAL_FINISH_X,13\.0,-3,18,2\.5\)/);
 assert.match(scene,/finishSign\.visible=mode==='straight'/);
 assert.doesNotMatch(scene,/box\(93,1\.35,27,0,\.65,-78,C\.concrete,venue\)/);
});

test('roof tiers and foundation meet instead of floating in daylight cameras',()=>{
 // Prior upper roof y=20.1 had a visible 1.025m air gap above slab 1.
 const firstSlabTop=18+.65/2;
 const upperSlabBottom=PAVILION_UPPER_ROOF_Y-1.5/2;
 assert.ok(Math.abs(upperSlabBottom-firstSlabTop)<.05);
 // Ground main top = -.33 +.35/2 = -.155; platform bottom -.135
 const existingGrassTop=-.33+.35/2;
 const foundationBottom=PAVILION_FOUNDATION_Y-1.35/2;
 assert.ok(Math.abs(foundationBottom-existingGrassTop)<.05);
 assert.equal(baselineFile.includes('export function officialRanking'),true);
 assert.doesNotMatch(scene,/PAVILION_OFFSET_Z.*officialRanking/);
});
