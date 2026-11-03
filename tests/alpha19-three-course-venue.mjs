import assert from 'node:assert/strict';
import test from 'node:test';
import {STADIUM_COURSES,courseAtMinute,trackCycleSeconds,RACES_PER_DAY} from '../visual-lab/threeCourseLayout.js';
import {VENUE_PLAN,validateVenuePlan} from '../visual-lab/threeCourseVenue.js';
test('three unique courses are staggered one minute apart',()=>{
 assert.equal(STADIUM_COURSES.length,3);
 assert.deepEqual(STADIUM_COURSES.map(x=>x.offsetSeconds),[0,60,120]);
 for(let minute=0;minute<RACES_PER_DAY;minute++){
  const slot=courseAtMinute(minute);
  assert.equal(slot.announcementSecond,minute*60);
  assert.equal(slot.startSecond,minute*60+30);
  assert.equal(slot.courseSlot,Math.floor(minute/3));
  assert.equal(slot.courseId,STADIUM_COURSES[minute%3].id);
 }
 assert.equal(courseAtMinute(1439).courseId,'vint-cerf');
});
test('each course retains 180 second clock and diagonal straight',()=>{
 for(let i=0;i<3;i++)assert.equal(trackCycleSeconds(i*60,i*60),0);
 assert.ok(validateVenuePlan());
 assert.ok(VENUE_PLAN.genesis.angleRadians<0);
 assert.equal(STADIUM_COURSES[1].visualLength,780);
});
