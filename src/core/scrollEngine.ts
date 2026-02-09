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
    let viewportHeight = window.innerHeight;
    let offsetTop = 0;

    // Find closest scrollable parent
    const scrollParent = this.getScrollParent(this.container);
    if (scrollParent instanceof Element) {
      const parentRect = scrollParent.getBoundingClientRect();
      viewportHeight = parentRect.height;
      offsetTop = parentRect.top;
      // Also clip execution if parent is not consistent? No.
    }
    
    // Total distance the container can "scroll"
    const scrollDist = rect.height - viewportHeight;

    let progress = 0;

    if (scrollDist > 0) {
      // Calculate relative top position
      const relativeTop = rect.top - offsetTop;
      progress = -relativeTop / scrollDist;
    } else {
      progress = 1;
    }

    this.callback(progress);

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.tick);
  };
    
  /**
   * Find the nearest scrollable parent.
   */
  private getScrollParent(node: Element): Element | Window {
    let current = node.parentElement;
    while (current) {
      const style = getComputedStyle(current);
      if (['auto', 'scroll'].includes(style.overflowY)) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }
    
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stop();
  }
}
