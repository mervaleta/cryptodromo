import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DENSITY_STANDS,DENSITY_PRESETS,TRACKSIDE_LAYOUT,HORSE_VISUAL_TUNING,densityPreset,
 safeHorseHeight,validateDensityLayout,createStadiumDensity} from '../visual-lab/stadiumDensity.js';
const source=readFileSync(new URL('../visual-lab/stadiumDensity.js',import.meta.url),'utf8');
test('stadium density is additive and separate from the race engine',()=>{
 assert.equal(validateDensityLayout(),true);
 assert.equal(DENSITY_STANDS.length,3);
 assert.ok(!/officialRace|broadcastPosition|createHorse|new PerspectiveCamera|setInterval/.test(source));
 assert.match(source,/InstancedMesh/);
 assert.match(source,/dispose\(\)/);
});
test('all presets fit resource budgets, eco lower than balanced and high',()=>{
 const eco=densityPreset('eco'),balanced=densityPreset('balanced'),high=densityPreset('high');
 for(const k of ['railSpacing','seatRows','crowdPerStand','flagsPerStand']){
  assert.ok(eco[k]>0&&balanced[k]>0&&high[k]>0);
 }
 assert.ok(eco.crowdPerStand<balanced.crowdPerStand);
 assert.ok(balanced.crowdPerStand<high.crowdPerStand);
 assert.deepEqual(densityPreset('high',true),DENSITY_PRESETS.eco);
 assert.deepEqual(densityPreset('unknown'),DENSITY_PRESETS.balanced);
});
test('horse scale policy keeps existing gate roof clearance',()=>{
 assert.equal(HORSE_VISUAL_TUNING.baselineHeight,2.85);
 assert.ok(HORSE_VISUAL_TUNING.recommendedHeight>2.85);
 assert.ok(HORSE_VISUAL_TUNING.gateRoofHeight-safeHorseHeight(9)>=.10);
 assert.equal(safeHorseHeight(NaN),2.85);
 assert.equal(safeHorseHeight(2.9),2.9);
 assert.ok(safeHorseHeight(4)<=HORSE_VISUAL_TUNING.maxWithoutGateRevision);
});
test('invalid THREE injection cannot mutate a scene',()=>{
 assert.throws(()=>createStadiumDensity({}),/THREE and scene/);
});

test('trackside spectators are close but outside safety setback',()=>{
 assert.equal(TRACKSIDE_LAYOUT.courseEdge,-20.2);
 assert.ok(TRACKSIDE_LAYOUT.courseEdge-TRACKSIDE_LAYOUT.safetyRail>=5);
 assert.ok(TRACKSIDE_LAYOUT.safetyRail-TRACKSIDE_LAYOUT.spectatorRail>=5);
 assert.ok(TRACKSIDE_LAYOUT.spectatorRail-TRACKSIDE_LAYOUT.frontRow>=4);
 assert.match(source,/for\(const z of \[-25\.5,-31\.5\]\)/);
 assert.match(source,/const z=-36\.5-row\*2\.2/);
 assert.doesNotMatch(source,/z=-91\.5-row/);
});
