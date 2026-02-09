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
  private container: Element;

  /**
   * Create a new ScrollEngine instance.
   * @param callback - Function called with progress (0-1) on each frame
   * @param container - The container element to track (the one with height: scrollLength)
   */
  constructor(
    callback: ScrollEngineCallback, 
    container: Element
  ) {
    this.callback = callback;
    this.container = container;
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
   * Main animation loop. Calculates scroll progress based on container position.
   */
  private tick = (): void => {
    if (!this.isActive) return;

    const rect = this.container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Total distance the container can "scroll" while the sticky element is pinned
    // is (containerHeight - viewportHeight).
    // The sticky element is pinned for this duration.
    const scrollDist = rect.height - viewportHeight;

    let progress = 0;

    if (scrollDist > 0) {
      // rect.top is 0 when container starts entering viewport (top align)
      // As we scroll down, rect.top becomes negative.
      // Progress = 0 when rect.top = 0
      // Progress = 1 when rect.top = -scrollDist
      progress = -rect.top / scrollDist;
    } else {
      // Container fits or is smaller than viewport, always show end or start?
      // If height <= 100vh, there's no scrollable distance. Default to 1 (show full).
      progress = 1;
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
