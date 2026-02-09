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
/**
 * Resolves frame sequence from props.
 * Handles 'manual', 'pattern', and 'manifest' sources.
 */
export async function resolveSequence(source: ScrollSequenceProps['source']): Promise<ResolvedSequence> {
  switch (source.type) {
    case 'manual':
      return processManualFrames(source.frames);
    
    case 'pattern':
      return processPatternMode(source.url, source.start ?? 1, source.end, source.pad);
      
    case 'manifest':
      return processManifestMode(source.url);
      
    default:
      return { frames: [], frameCount: 0 };
  }
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
    return numA - numB;
  });

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

  return {
    frames,
    frameCount: frames.length
  };
}

/**
 * Mode C: Fetch and process manifest
 */
const manifestCache = new Map<string, Promise<ResolvedSequence>>();

async function processManifestMode(url: string): Promise<ResolvedSequence> {
  if (manifestCache.has(url)) {
    return manifestCache.get(url)!;
  }

  const promise = (async () => {
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
  
      return { frames: [], frameCount: 0 };
  
    } catch (err) {
      // Remove from cache on error so retry is possible
      manifestCache.delete(url);
      return { frames: [], frameCount: 0 };
    }
  })();

  manifestCache.set(url, promise);
  return promise;
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

