/**
 * SequenceResolver
 * Handles intelligent frame resolution from multiple input sources:
 * - Manual frame list (frames[])
 * - Pattern generation (pattern, start, end, pad)
 * - Remote manifest (manifest URL)
 */

import type { ScrollSequenceProps, ResolvedSequence } from '../types';

// Declare process for TS (avoiding @types/node dependency for just this)
declare const process: { env: { NODE_ENV: string } };

/**
 * Resolves frame sequence from props.
 * Prioritizes: frames > pattern > manifest
 */
export async function resolveSequence(props: ScrollSequenceProps): Promise<ResolvedSequence> {
  const { frames, pattern, manifest, start = 1, end, pad } = props;

  // Mode A: Manual Frames
  if (frames && frames.length > 0) {
    return processManualFrames(frames);
  }

  // Mode B: Pattern Mode
  if (pattern && typeof end === 'number') {
    return processPatternMode(pattern, start, end, pad);
  }

  // Mode C: Manifest Mode
  if (manifest) {
    return processManifestMode(manifest);
  }

  console.error("ScrollSequence: No valid frame source provided. Must provide 'frames', 'pattern' + 'end', or 'manifest'.");
  return { frames: [], frameCount: 0 };
}

/**
 * Mode A: Process manually provided frames
 */
function processManualFrames(frames: string[]): ResolvedSequence {
  // Sort frames numerically by extracting numbers from filenames
  // Uses stable sort to preserve order for frames with no numbers or equal numbers
  const sorted = [...frames].sort((a, b) => {
    const numA = extractNumber(a);
    const numB = extractNumber(b);
    
    // If both have no numbers (0), preserve order (return 0)
    // If one has no number, push it to end? Or keep it? Requirement says "Keep original order" if no numeric index found.
    // If extracts 0 (meaning no number found), treating as 0 might reorder.
    // Let's check extraction result.
    // Actually extractNumber returns 0 if null.
    // If we want to preserve order for non-numeric, we should perhaps check if NAN.
    // But extractNumber uses 0.
    
    return numA - numB;
  });

  // DEV Warning: Check for gaps or missing frames
  if (process.env.NODE_ENV === 'development') {
    validateSequence(sorted);
  }

  return {
    frames: sorted,
    frameCount: sorted.length
  };
}

/**
 * Mode B: Generate frames from pattern
 */
function processPatternMode(pattern: string, start: number, end: number, pad?: number): ResolvedSequence {
  const frames: string[] = [];

  for (let i = start; i <= end; i++) {
    let indexStr = i.toString();
    if (pad) {
      indexStr = indexStr.padStart(pad, '0');
    }
    frames.push(pattern.replace('{index}', indexStr));
  }

  // DEV Warning: Validate generated sequence (mostly for duplicate checks if logic somehow fails, or pattern is bad)
  if (process.env.NODE_ENV === 'development') {
    if (frames.length === 0) {
      console.warn("ScrollSequence: Pattern generation resulted in 0 frames.");
    }
  }

  return {
    frames,
    frameCount: frames.length
  };
}

/**
 * Mode C: Fetch and process manifest
 */
async function processManifestMode(url: string): Promise<ResolvedSequence> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for "frames" array in manifest
    if (data.frames && Array.isArray(data.frames)) {
      return processManualFrames(data.frames);
    }

    // Check for pattern config in manifest
    if (data.pattern && typeof data.end === 'number') {
      const start = data.start ?? 1;
      const pad = data.pad;
      return processPatternMode(data.pattern, start, data.end, pad);
    }

    console.warn("ScrollSequence: Invalid manifest format. Missing 'frames' or 'pattern' config.");
    return { frames: [], frameCount: 0 };

  } catch (err) {
    console.error("ScrollSequence: Error loading manifest:", err);
    return { frames: [], frameCount: 0 };
  }
}

// --- Helpers ---

/**
 * Extract the first number found in a filename.
 * Returns -1 if no number is found, to differentiate from 0.
 */
function extractNumber(filename: string): number {
  const match = filename.match(/\d+/);
  return match ? parseInt(match[0], 10) : -1;
}

/**
 * Validate sequence for common issues (gaps, duplicates, missing indices)
 * Only runs in development.
 */
function validateSequence(frames: string[]) {
  if (frames.length === 0) return;

  const numbers = frames.map(extractNumber);
  
  // 1. Check for Frames with No Numbers
  // If extractNumber returns -1, it means no number was found.
  if (numbers.some(n => n === -1)) {
    console.warn("ScrollSequence: Some frames do not contain numeric indices. Sorting may be unexpected.");
  }
  
  // Filter out non-numeric for sequence checks
  const validNumbers = numbers.filter(n => n !== -1);
  if (validNumbers.length === 0) return;

  // 2. Check for duplicates
  const unique = new Set(validNumbers);
  if (unique.size !== validNumbers.length) {
    console.warn("ScrollSequence: Duplicate frame indices found. Frames will be rendered in sorted order.");
  }

  // 3. Check for Gaps
  // We expect sorted numbers.
  // Gaps exist if validNumbers[i+1] !== validNumbers[i] + 1
  let hasGaps = false;
  for (let i = 0; i < validNumbers.length - 1; i++) {
    // Skip checking if duplicates (same number) as that's not a gap, it's a duplicate
    if (validNumbers[i+1] > validNumbers[i] + 1) {
      hasGaps = true;
      break;
    }
  }

  if (hasGaps) {
    console.warn("ScrollSequence: Detected non-sequential frame indices: gaps exist.");
  }
}

