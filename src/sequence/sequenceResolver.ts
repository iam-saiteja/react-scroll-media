/**
 * SequenceResolver
 * Parses and sorts frame filenames numerically.
 * Extracts numeric parts from filenames to determine order.
 */

import type { ResolvedSequence } from '../types';

/**
 * Resolve and sort frame array numerically by extracted numbers in filenames.
 *
 * @example
 * sequenceResolver(['frame-2.jpg', 'frame-1.jpg', 'frame-10.jpg'])
 * // Returns: { frames: ['frame-1.jpg', 'frame-2.jpg', 'frame-10.jpg'], frameCount: 3 }
 *
 * @param frames - Array of frame URLs
 * @returns Resolved sequence with sorted frames and count
 */
export function sequenceResolver(frames: string[]): ResolvedSequence {
  const sorted = [...frames].sort((a, b) => {
    const numA = extractNumber(a);
    const numB = extractNumber(b);
    return numA - numB;
  });

  return {
    frames: sorted,
    frameCount: sorted.length,
  };
}

/**
 * Extract the first number found in a filename.
 *
 * @param filename - The filename or URL to parse
 * @returns The extracted number, or 0 if no number found
 */
function extractNumber(filename: string): number {
  const match = filename.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}
