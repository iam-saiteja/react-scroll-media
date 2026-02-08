/**
 * Public type definitions for react-scroll-media
 */

export interface ScrollSequenceProps {
  /** Array of image frame URLs. Will be sorted numerically by filename. */
  frames: string[];

  /** CSS height for the scroll container. Determines scroll distance. */
  scrollLength?: string;

  /** If true, canvas sticks to viewport during scroll. */
  pin?: boolean;

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
