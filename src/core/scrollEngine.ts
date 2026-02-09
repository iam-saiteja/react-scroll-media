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
   * @param scrollElement - Optional element to track scroll on. If null, tracks window scroll.
   */
  constructor(callback: ScrollEngineCallback, scrollElement: Element | null = null) {
    this.callback = callback;
    this.scrollElement = scrollElement;
  }

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

    if (this.scrollElement) {
      // Element-based scrolling for fullscreen mode
      const scrollTop = this.scrollElement.scrollTop;
      const scrollHeight = this.scrollElement.scrollHeight - this.scrollElement.clientHeight;
      progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    } else {
      // Window-based scrolling for regular mode
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
