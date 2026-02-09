/**
 * ScrollLoopManager
 * 
 * Singleton class to manage a single requestAnimationFrame loop
 * for all ScrollTimeline instances. This prevents multiple RAF
 * callbacks from piling up and degrading performance.
 */

type LoopCallback = () => void;

export class ScrollLoopManager {
  private static instance: ScrollLoopManager;
  private callbacks = new Set<LoopCallback>();
  private rafId: number | null = null;
  private isActive = false;

  private constructor() {}

  public static getInstance(): ScrollLoopManager {
    if (!ScrollLoopManager.instance) {
      ScrollLoopManager.instance = new ScrollLoopManager();
    }
    return ScrollLoopManager.instance;
  }

  /**
   * Register a callback to be called on every animation frame.
   */
  public register(callback: LoopCallback): void {
    if (this.callbacks.has(callback)) return;
    
    this.callbacks.add(callback);
    
    // Start loop if this is the first subscriber
    if (this.callbacks.size === 1) {
      this.start();
    }
  }

  /**
   * Unregister a callback.
   */
  public unregister(callback: LoopCallback): void {
    this.callbacks.delete(callback);

    // Stop loop if no subscribers left
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    if (this.isActive) return;
    this.isActive = true;
    
    // Ensure we are in a browser environment
    if (typeof window !== 'undefined') {
      this.tick();
    }
  }

  private stop(): void {
    this.isActive = false;
    if (this.rafId !== null && typeof window !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.isActive) return;

    // Execute all registered callbacks
    this.callbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        // Silent catch to prevent loop crash
      }
    });

    this.rafId = requestAnimationFrame(this.tick);
  };
}
