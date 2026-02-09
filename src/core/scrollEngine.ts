/**
 * ScrollEngine
 * Continuously tracks scroll progress and invokes callbacks using requestAnimationFrame.
 * Provides SSR-safe scroll tracking without external dependencies.
 */

export type ScrollEngineCallback = (progress: number) => void;

export class ScrollEngine {
  private callback: ScrollEngineCallback;
  private rafId: number | null = null;
  private isActive = false;
  private scrollElement: Element | null;

  /**
   * Create a new ScrollEngine instance.
   * @param callback - Function called with progress (0-1) on each frame
   * @param scrollTarget - Element that IS SCROLLED (e.g., overflow container). If null, tracks window.
   * @param triggerElement - Element to track progress RELATIVE TO (e.g., the sticky container).
   */
  constructor(
    callback: ScrollEngineCallback, 
    scrollTarget: Element | null = null,
    triggerElement: Element | null = null
  ) {
    this.callback = callback;
    this.scrollElement = scrollTarget;
    this.triggerElement = triggerElement;
  }

  private triggerElement: Element | null;

  /**
   * Start the scroll tracking loop.
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.tick();
  }

  /**
   * Stop the scroll tracking loop.
   */
  stop(): void {
    this.isActive = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation loop. Calculates scroll progress and invokes callback.
   */
  private tick = (): void => {
    if (!this.isActive) return;

    let progress = 0;

    if (this.triggerElement) {
       // RELATIVE TRACKING: Progress based on element's position in viewport
       const rect = this.triggerElement.getBoundingClientRect();
       const visibleHeight = window.innerHeight;
       const scrollDist = rect.height - visibleHeight;

       if (scrollDist > 0) {
         // Progress = 0 when top aligns with viewport top (rect.top = 0)
         // Progress = 1 when bottom aligns with viewport bottom (rect.top = -scrollDist)
         // We invert rect.top because scrolling down makes it negative
         progress = -rect.top / scrollDist;
       } else {
         progress = 1; // Content shorter than viewport, show end? or 0? 1 usually safe.
       }
    } else if (this.scrollElement) {
      // Element-based scrolling for fullscreen mode (overflow container)
      const scrollTop = this.scrollElement.scrollTop;
      const scrollHeight = this.scrollElement.scrollHeight - this.scrollElement.clientHeight;
      progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    } else {
      // Window-based scrolling for regular mode (global page progress)
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    }

    this.callback(progress);

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick);
  };
    
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stop();
  }
}
