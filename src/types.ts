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

  /** CSS height for the scroll container. Defines the total scroll distance. */
  scrollLength?: string;

  /** CSS class name for the container div. */
  className?: string;
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
