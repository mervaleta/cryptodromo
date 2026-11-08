/**
 * Satoshi rail-camera gate clearance (visual-only).
 *
 * At the start of a straight/s-bend race, the standard rail shot is only
 * 14m beside the starting line. Its sightline passes through the Alpha20
 * start-gate roof (32m wide at z = -16..+16) and support pillars. Move only
 * the rail camera outside that envelope during launch, then ease back.
 *
 * No changes to horses, gates, official positions, race timings or TV director.
 */
export const RAIL_CAMERA_BASE_SIDE = 14;
export const RAIL_CAMERA_START_SIDE = 32;
export const RAIL_CAMERA_CLEARANCE_METERS = 36;
const STRAIGHT_LENGTH = 780;

export function railCameraSideOffset(progress, layout = 'straight') {
  // The Alpha20 gate kit is only rendered on the straight course.
  // Preserve existing camera framing on s-bend and oval.
  if (layout !== 'straight') return RAIL_CAMERA_BASE_SIDE;
  const p = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  const blend = Math.min(1, p * STRAIGHT_LENGTH / RAIL_CAMERA_CLEARANCE_METERS);
  const eased = blend * blend * (3 - 2 * blend);
  return RAIL_CAMERA_START_SIDE + (RAIL_CAMERA_BASE_SIDE - RAIL_CAMERA_START_SIDE) * eased;
}
