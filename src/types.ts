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

  /** CSS height for the scroll container. Only used when fullscreen is false. */
  scrollLength?: string;

  /** If true, canvas sticks to viewport during scroll. */
  pin?: boolean;

  /** CSS class name for the container div. */
  className?: string;

  /** If true, blocks page scroll and only allows scroll within component (default: true). */
  fullscreen?: boolean;

  /** 
   * If true, prevents default scroll behavior and drives sequence via scroll events directly. 
   * The page scrollbar will not move. 
   */
  lockScroll?: boolean;
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
