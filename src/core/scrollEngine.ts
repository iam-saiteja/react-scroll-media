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

  /**
   * Create a new ScrollEngine instance.
   * @param callback - Function called with progress (0-1) on each frame
   */
  constructor(callback: ScrollEngineCallback) {
    this.callback = callback;
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

    // Calculate progress: scrollTop / (scrollHeight - viewportHeight)
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

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
