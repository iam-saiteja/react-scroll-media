import { ScrollLoopManager } from './loopManager';
import { SCROLL_THRESHOLD } from '../constants';

export type TimelineCallback = (progress: number) => void;

export class ScrollTimeline {
  private container: Element;
  private subscribers = new Set<TimelineCallback>();
  private currentProgress = 0;
  
  // Caching for performance
  private cachedRect: DOMRect | null = null;
  private cachedScrollParent: Element | Window | null = null;
  private cachedScrollParentRect: DOMRect | null = null;
  private cachedViewportHeight = 0;
  private cachedOffsetTop = 0;
  private isLayoutDirty = true;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: Element) {
    this.container = container;
    
    if (typeof window !== 'undefined') {
      // Invalidate cache on resize
      this.resizeObserver = new ResizeObserver(() => {
        this.isLayoutDirty = true;
      });
      this.resizeObserver.observe(this.container);
      
      // Also listen to global resize
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  private onWindowResize = () => {
    this.isLayoutDirty = true;
  };

  /**
   * Subscribe to progress updates.
   * Returns an unsubscribe function.
   */
  subscribe(callback: TimelineCallback): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current progress for initialization
    try {
        callback(this.currentProgress);
    } catch (e) {
        // Silent
    }

    // Register with unique LoopManager if we have subscribers
    if (this.subscribers.size === 1) {
      ScrollLoopManager.getInstance().register(this.tick);
    }
    
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        ScrollLoopManager.getInstance().unregister(this.tick);
      }
    };
  }

  unsubscribe(callback: TimelineCallback): void {
    this.subscribers.delete(callback);
    if (this.subscribers.size === 0) {
      ScrollLoopManager.getInstance().unregister(this.tick);
    }
  }

  /**
   * Start is now handled by LoopManager via subscriptions
   * Deprecated but kept for API stability if needed.
   */
  start(): void {
    // No-op, managed by subscriptions
  }

  stop(): void {
    ScrollLoopManager.getInstance().unregister(this.tick);
  }

  private tick = (): void => {
    // Calculate Progress
    const progress = this.calculateProgress();

    // Notify if changed significantly (using threshold constant)
    if (Math.abs(progress - this.currentProgress) > SCROLL_THRESHOLD) {
      this.currentProgress = progress;
      this.notify();
    }
  };

  private notify() {
    this.subscribers.forEach((cb) => {
        try {
            cb(this.currentProgress);
        } catch (e) {
            // Silent
        }
    });
  }

  private updateCache() {
    if (!this.isLayoutDirty && this.cachedRect) return;

    this.cachedRect = this.container.getBoundingClientRect();
    
    if (!this.cachedScrollParent) {
        this.cachedScrollParent = this.getScrollParent(this.container);
    }

    if (this.cachedScrollParent instanceof Element) {
      this.cachedScrollParentRect = this.cachedScrollParent.getBoundingClientRect();
      this.cachedViewportHeight = this.cachedScrollParentRect.height;
      this.cachedOffsetTop = this.cachedScrollParentRect.top;
    } else if (typeof window !== 'undefined') {
      this.cachedViewportHeight = window.innerHeight;
      this.cachedOffsetTop = 0;
    }

    this.isLayoutDirty = false;
  }

  private calculateProgress(): number {
    if (this.isLayoutDirty || !this.cachedRect) {
         this.updateCache();
    }

    const currentRect = this.container.getBoundingClientRect();
    const scrollDist = (this.cachedRect?.height || currentRect.height) - this.cachedViewportHeight;

    // Guard: Zero Height / Division by Zero
    if (scrollDist <= 0) return 1;

    const relativeTop = currentRect.top - this.cachedOffsetTop;
    const rawProgress = -relativeTop / scrollDist;
    
    const clamped = Math.min(Math.max(rawProgress, 0), 1);
    
    // Round to 6 decimals to prevent micro-drift
    return Math.round(clamped * 1000000) / 1000000;
  }

  private getScrollParent(node: Element): Element | Window {
    if (typeof window === 'undefined') return node; 

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

  destroy() {
    this.subscribers.clear();
    ScrollLoopManager.getInstance().unregister(this.tick);
    
    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
    }
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.onWindowResize);
    }
  }
}
