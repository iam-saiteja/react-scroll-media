/**
 * Public type definitions for react-scroll-media
 */

export interface ScrollSequenceProps {
  /** 
   * Array of image frame URLs. 
   * Manual mode: Provide explicit list of frames.
   */
  frames?: string[];

  /**
   * Pattern mode: path pattern for frames.
   * Example: "/frames/frame_{index}.webp"
   */
  pattern?: string;

  /**
   * Pattern/Manifest mode: Start index for frame sequence (default: 1).
   */
  start?: number;

  /**
   * Pattern/Manifest mode: End index for frame sequence (required for pattern mode).
   */
  end?: number;

  /**
   * Pattern/Manifest mode: Number of digits to zero-pad the index to.
   * Example: pad=4 -> 0001, 0002...
   */
  pad?: number;

  /**
   * Manifest mode: URL to a JSON manifest file defining the sequence.
   */
  manifest?: string;

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
