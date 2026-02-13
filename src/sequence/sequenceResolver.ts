/**
 * SequenceResolver
 * Handles intelligent frame resolution from multiple input sources:
 * - Manual frame list (frames[])
 * - Pattern generation (pattern, start, end, pad)
 * - Remote manifest (manifest URL)
 *
 * Security Features (v1.0.5+):
 * - HTTPS-only enforcement for manifest URLs
 * - Credential isolation (credentials: 'omit')
 * - Referrer policy (no-referrer)
 * - Response size limit (1MB)
 * - Frame URL whitelist validation (only http:/https:/relative paths allowed)
 * - Protocol-relative URL rejection (//evil.com blocked)
 * - Configurable frame count cap (default 2000, max 8000)
 * - Manifest cache size limit (50 entries)
 * - 10-second timeout protection
 * - Content-type and structure validation
 */

import type { ScrollSequenceProps, ResolvedSequence } from '../types';

// Declare process for TS (avoiding @types/node dependency for just this)
declare const process: { env: { NODE_ENV: string; REACT_SCROLL_MEDIA_MAX_FRAMES?: string } };

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
 * Allowed URL protocols for frame URLs (whitelist approach).
 * Only http: and https: are permitted. Relative paths are also safe.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Frame count limits.
 * DEFAULT_MAX_FRAMES: Safe default for most use cases.
 * ABSOLUTE_MAX_FRAMES: Hard ceiling that cannot be exceeded, even with env override.
 * Override via REACT_SCROLL_MEDIA_MAX_FRAMES environment variable.
 */
const DEFAULT_MAX_FRAMES = 2000;
const ABSOLUTE_MAX_FRAMES = 8000;

/**
 * Returns the effective max frame count.
 * Checks REACT_SCROLL_MEDIA_MAX_FRAMES env var for power-user override,
 * clamped to ABSOLUTE_MAX_FRAMES.
 */
function getMaxFrames(): number {
  try {
    const env = Number(process.env.REACT_SCROLL_MEDIA_MAX_FRAMES);
    if (Number.isInteger(env) && env > 0) {
      return Math.min(env, ABSOLUTE_MAX_FRAMES);
    }
  } catch {
    // process.env may not exist in all environments
  }
  return DEFAULT_MAX_FRAMES;
}

/**
 * Validates a frame URL is safe to load using a whitelist approach.
 * Only allows http:, https:, and relative paths (starting with / or alphanumeric).
 * Rejects protocol-relative URLs (//), javascript:, data:, blob:, etc.
 */
function validateFrameUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Security: Reject protocol-relative URLs (e.g. //evil.com/image.jpg)
  // These resolve to the current page's protocol and can point to arbitrary hosts
  if (trimmed.startsWith('//')) return false;

  try {
    // Parse URL — relative paths resolve against localhost base
    const parsed = new URL(trimmed, 'https://localhost');

    // Only allow http: and https: protocols
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false;

    // For absolute URLs, ensure the host isn't our dummy localhost base
    // (which would mean it was a relative path — those are fine)
    return true;
  } catch {
    // If URL parsing fails entirely, reject it
    return false;
  }
}

/**
 * Sanitize frame URLs, filtering out any with non-whitelisted protocols.
 * Logs a warning in development for rejected URLs.
 */
function sanitizeFrameUrls(frames: string[]): string[] {
  return frames.filter(url => {
    if (!validateFrameUrl(url)) {
      try { if (process.env.NODE_ENV !== 'production') console.warn(`[react-scroll-media] Blocked unsafe frame URL: ${url}`); } catch {}
      return false;
    }
    return true;
  });
}

/**
 * Mode A: Process manually provided frames
 */
function processManualFrames(frames: string[]): ResolvedSequence {
  // Security: Sanitize frame URLs
  const safe = sanitizeFrameUrls(frames);

  // Security: Enforce max frame count
  const maxFrames = getMaxFrames();
  if (safe.length > maxFrames) {
    throw new Error(`[react-scroll-media] Too many frames: ${safe.length} (max ${maxFrames}). Override with REACT_SCROLL_MEDIA_MAX_FRAMES env var (ceiling: ${ABSOLUTE_MAX_FRAMES}).`);
  }

  // Sort frames numerically by extracting numbers from filenames
  const sorted = [...safe].sort((a, b) => {
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
  // Security: Validate the pattern URL template itself
  if (!validateFrameUrl(pattern)) {
    throw new Error('[react-scroll-media] Pattern URL uses a disallowed protocol');
  }

  // Security: Enforce max frame count
  const frameCount = end - start + 1;
  const maxFrames = getMaxFrames();
  if (frameCount > maxFrames) {
    throw new Error(`[react-scroll-media] Too many frames: ${frameCount} (max ${maxFrames}). Override with REACT_SCROLL_MEDIA_MAX_FRAMES env var (ceiling: ${ABSOLUTE_MAX_FRAMES}).`);
  }

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
 * 
 * Security Features:
 * - HTTPS enforcement (no HTTP allowed)
 * - 10-second timeout protection
 * - User-Agent header identification
 * - Response structure validation
 */
const manifestCache = new Map<string, Promise<ResolvedSequence>>();
const MANIFEST_FETCH_TIMEOUT_MS = 10000; // 10 seconds
const MANIFEST_MAX_SIZE_BYTES = 1_048_576; // 1MB response size limit
const MANIFEST_CACHE_MAX_ENTRIES = 50; // Prevent unbounded cache growth
declare const __PKG_VERSION__: string;
const USER_AGENT = `react-scroll-media/${__PKG_VERSION__}`;

async function processManifestMode(url: string): Promise<ResolvedSequence> {
  if (manifestCache.has(url)) {
    return manifestCache.get(url)!;
  }

  const promise = (async () => {
    try {
      // Security: HTTPS validation
      if (!url.startsWith('https://')) {
        throw new Error('[react-scroll-media] Manifest URL must use HTTPS for security. Received: ' + url);
      }

      // Security: Abort controller for timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);

      try {
        // Security: Fetch with credential isolation and referrer protection
        const res = await fetch(url, {
          signal: controller.signal,
          credentials: 'omit',           // Never send cookies/auth tokens
          referrerPolicy: 'no-referrer', // Don't leak page URL
          headers: {
            'Accept': 'application/json',
            'User-Agent': USER_AGENT
          }
        });

        if (!res.ok) {
          throw new Error(`[react-scroll-media] Failed to fetch manifest: ${res.statusText}`);
        }

        // Security: Validate content-type header
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('[react-scroll-media] Invalid manifest response: expected application/json');
        }

        // Security: Enforce response size limit to prevent memory DoS
        const text = await res.text();
        if (text.length > MANIFEST_MAX_SIZE_BYTES) {
          throw new Error(`[react-scroll-media] Manifest response too large: ${text.length} bytes (max ${MANIFEST_MAX_SIZE_BYTES})`);
        }

        const data = JSON.parse(text);

        // Security: Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('[react-scroll-media] Invalid manifest: expected JSON object');
        }

        // Check for "frames" array in manifest
        if (data.frames && Array.isArray(data.frames)) {
          if (data.frames.some((f: unknown) => typeof f !== 'string')) {
            throw new Error('[react-scroll-media] Invalid manifest: frames must be array of strings');
          }
          return processManualFrames(data.frames);
        }

        // Check for pattern config in manifest
        if (data.pattern && typeof data.end === 'number') {
          if (typeof data.pattern !== 'string') {
            throw new Error('[react-scroll-media] Invalid manifest: pattern must be string');
          }
          if (!Number.isInteger(data.end) || data.end < 1) {
            throw new Error('[react-scroll-media] Invalid manifest: end must be positive integer');
          }
          const start = data.start ?? 1;
          if (!Number.isInteger(start) || start < 1) {
            throw new Error('[react-scroll-media] Invalid manifest: start must be positive integer');
          }
          const pad = data.pad;
          if (pad !== undefined && (!Number.isInteger(pad) || pad < 1)) {
            throw new Error('[react-scroll-media] Invalid manifest: pad must be positive integer');
          }
          return processPatternMode(data.pattern, start, data.end, pad);
        }

        throw new Error('[react-scroll-media] Invalid manifest: missing frames or pattern configuration');

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (err) {
      // Remove from cache on error so retry is possible
      manifestCache.delete(url);
      
      // Handle abort errors (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`[react-scroll-media] Manifest fetch timeout: request took longer than ${MANIFEST_FETCH_TIMEOUT_MS}ms`);
      }
      
      throw err;
    }
  })();

  // Security: Enforce cache size limit to prevent memory DoS
  if (manifestCache.size >= MANIFEST_CACHE_MAX_ENTRIES) {
    // Evict the oldest entry (first key in Map insertion order)
    const oldestKey = manifestCache.keys().next().value;
    if (oldestKey) manifestCache.delete(oldestKey);
  }

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

