/**
 * Clamps a value between a minimum and maximum.
 * Default range is [0, 1], suitable for progress values.
 *
 * @param value - The value to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns The clamped value
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
}
