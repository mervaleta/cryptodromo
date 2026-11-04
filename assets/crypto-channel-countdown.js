/**
 * Presentation-only projection of the three independent Satoshi LIVE clocks.
 * A full course slot lasts 180s and each course starts 60s apart.
 * Show time until the NEXT START, not time until the current 60s phase ends:
 * phase-ending timers repeat identically on all three cards.
 * This never mutates the fixture or scoring engine.
 */
export function projectChannelCountdown(data){
 if(!data?.next || !Number.isFinite(data.slotSeconds) ||
    !Number.isFinite(data.secondsToNext) || !Number.isInteger(data.next.slot) ||
    typeof data.next.label!=='string')throw new TypeError('Invalid LIVE channel snapshot');
 const phase=data.slotSeconds<60?'race':data.slotSeconds<120?'results':'presentation';
 return Object.freeze({
  phase,
  secondsToNext:data.secondsToNext,
  nextRaceNumber:data.next.slot+1,
  nextStart:data.next.label,
  nextDayIndex:data.next.dayIndex,
  label:'Próxima carrera '+String(data.next.slot+1).padStart(3,'0')+
    ' / 480 · largada '+data.next.label+' UTC−3'
 });
}
