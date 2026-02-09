/**
 * Public type definitions for react-scroll-media
 */

export type SequenceSource = 
  | { type: 'manual'; frames: string[] }
  | { type: 'pattern'; url: string; start?: number; end: number; pad?: number }
  | { type: 'manifest'; url: string };

export interface ScrollSequenceProps {
  /**
   * Source configuration for the image sequence.
   * Can be 'manual', 'pattern', or 'manifest'.
   */
  source: SequenceSource;

  /** If true, shows a debug overlay with progress and frame info. */
  debug?: boolean;

  /** 
   * Memory management strategy. 
   * 'eager' (default): Preloads all images on mount. Smooth playback, higher memory.
   * 'lazy': Loads images only when needed (curren frame ±3). Saves memory, may stutter on slow networks.
   */
  memoryStrategy?: 'eager' | 'lazy';

  /** 
   * Buffer size for lazy loading (default 10).
   * Number of frames to keep loaded around the current frame.
   */
  lazyBuffer?: number;

  /** CSS height for the scroll container. Defines the total scroll distance. */
  scrollLength?: string;

  /** CSS class name for the container div. */
  className?: string;

  /** Optional children to render inside the sticky container (e.g. ScrollText). */
  children?: React.ReactNode;

  /** Component to render while the sequence is loading. */
  fallback?: React.ReactNode;

  /** Accessibility label for the canvas (role="img"). Defaults to "Scroll sequence". */
  accessibilityLabel?: string;

  /** Callback fired when an error occurs (e.g. image load failure). */
  onError?: (error: Error) => void;
}

export interface ResolvedSequence {
  /** Sorted array of frame URLs (sorted numerically by filename). */
  frames: string[];

  /** Total number of frames. */
  frameCount: number;
}

export interface ScrollProgress {
  /** Progress value between 0 and 1. */
  progress: number;

  /** Current scroll position in pixels. */
  scrollTop: number;

  /** Total scrollable height in pixels. */
  scrollHeight: number;

  /** Viewport height in pixels. */
  viewportHeight: number;
}
