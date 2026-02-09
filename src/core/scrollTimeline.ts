export type TimelineCallback = (progress: number) => void;

export class ScrollTimeline {
  private container: Element;
  private subscribers = new Set<TimelineCallback>();
  private rafId: number | null = null;
  private isActive = false;
  private currentProgress = 0;

  constructor(container: Element) {
    this.container = container;
  }

  /**
   * Subscribe to progress updates.
   * Returns an unsubscribe function.
   */
  subscribe(callback: TimelineCallback): () => void {
    this.subscribers.add(callback);
    // Immediately call with current progress? No, wait for next tick or manually call if needed.
    // Actually, calling immediately is safer for initialization.
    try {
        callback(this.currentProgress);
    } catch (e) {
        console.error("ScrollTimeline: Error in subscriber", e);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  unsubscribe(callback: TimelineCallback): void {
    this.subscribers.delete(callback);
  }

  /**
   * Start the loop
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.tick();
  }

  /**
   * Stop the loop
   */
  stop(): void {
    this.isActive = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.isActive) return;

    // Calculate Progress
    const progress = this.calculateProgress();

    // Notify if changed significantly
    if (Math.abs(progress - this.currentProgress) > 0.0001) {
      this.currentProgress = progress;
      this.notify();
    }
    // Eagerly notify? The sticky jitter might need per-frame updates even if scroll didn't change?
    // No, scroll position drives everything. If scroll didn't change, we don't need to update.
    // BUT we need to check every frame because scroll CAN change.
    
    // NOTE: If we only notify on change, we must ensure calculateProgress is accurate.
    // Since we check every frame, it's fine.

    // Force notify? 
    // this.notify(); 

    this.rafId = requestAnimationFrame(this.tick);
  };

  private notify() {
    this.subscribers.forEach((cb) => {
        try {
            cb(this.currentProgress);
        } catch (e) {
            console.error("ScrollTimeline: Error in subscriber", e);
        }
    });
  }

  private calculateProgress(): number {
    const rect = this.container.getBoundingClientRect();
    let viewportHeight = window.innerHeight;
    let offsetTop = 0;

    // Nested scroll support
    const scrollParent = this.getScrollParent(this.container);
    if (scrollParent instanceof Element) {
      const parentRect = scrollParent.getBoundingClientRect();
      viewportHeight = parentRect.height;
      offsetTop = parentRect.top;
    }

    const scrollDist = rect.height - viewportHeight;

    if (scrollDist <= 0) return 1;

    const relativeTop = rect.top - offsetTop;
    return Math.min(Math.max(-relativeTop / scrollDist, 0), 1);
  }

  private getScrollParent(node: Element): Element | Window {
    let current = node.parentElement;
    while (current) {
      const style = getComputedStyle(current);
      // 'auto' or 'scroll' determines scroll container
      if (['auto', 'scroll'].includes(style.overflowY)) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }

  destroy() {
    this.stop();
    this.subscribers.clear();
  }
}
