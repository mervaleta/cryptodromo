/**
 * Three-course stadium layout proposal, independent of race mechanics.
 * All coordinates are in visual-lab XZ world units.
 * The racing engine keeps COURSE_LENGTH=780; venue geometry is decorative.
 *
 * Layout: exterior oval, interior S, diagonal straight.
 * Tracks remain physically separate; do not merge their meshes or clocks.
 */
export const STADIUM_COURSES=Object.freeze([
 Object.freeze({id:'muybridge',name:'Eadweard Muybridge',mode:'oval',offsetSeconds:0,visualLength:780}),
 Object.freeze({id:'genesis',name:'Genesis',mode:'straight',offsetSeconds:60,visualLength:780,
   // Rotate the interior straight to use the longest clear diagonal.
   orientationRadians:-0.20,position:{x:0,z:0}}),
 Object.freeze({id:'vint-cerf',name:'Vint Cerf',mode:'s-bend',offsetSeconds:120,visualLength:780})
]);
export const SLOT_SECONDS=180;
export const RACES_PER_DAY=1440;
export function courseAtMinute(minute){
 if(!Number.isInteger(minute)||minute<0||minute>=RACES_PER_DAY)throw new RangeError('minute 0..1439');
 const course=STADIUM_COURSES[minute%3];
 return Object.freeze({raceNumber:minute+1,courseId:course.id,announcementSecond:minute*60,
   startSecond:minute*60+30,courseSlot:Math.floor(minute/3)});
}
export function trackCycleSeconds(epochSeconds,offsetSeconds=0){
 return ((epochSeconds-offsetSeconds)%SLOT_SECONDS+SLOT_SECONDS)%SLOT_SECONDS;
}
