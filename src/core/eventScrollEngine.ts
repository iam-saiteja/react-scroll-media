/**
 * EventScrollEngine
 * 
 * Captures user scroll interactions (wheel, touch) and mimics scroll behavior 
 * without actually scrolling the page. Useful for "locked" scroll modes.
 */

import { clamp } from './clamp';

export class EventScrollEngine {
  private callback: (progress: number) => void;
  private currentScroll: number = 0;
  private totalScroll: number;
  private element: HTMLElement | Window;
  private isActive: boolean = false;
  private touchStartY: number = 0;
  private rafId: number | null = null;
  private isTicking: boolean = false;

  /**
   * Create a new EventScrollEngine instance.
   * @param callback - Function called with progress (0-1)
   * @param totalScroll - The total virtual scroll height in pixels
   * @param element - Element to attach listeners to (default: window)
   */
  constructor(
    callback: (progress: number) => void,
    totalScroll: number,
    element: HTMLElement | Window = window
  ) {
    this.callback = callback;
    this.totalScroll = totalScroll;
    this.element = element;
    
    // Bind methods to ensure correct 'this' context when used as event listeners
    this.onWheel = this.onWheel.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
  }

  /**
   * Start listening to events.
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    
    // Add event listeners with passive: false to allow preventDefault
    // Note: TypeScript might complain about passive option on some environments, 
    // but modern browsers support it.
    this.element.addEventListener('wheel', this.onWheel as EventListener, { passive: false });
    this.element.addEventListener('touchstart', this.onTouchStart as EventListener, { passive: false });
    this.element.addEventListener('touchmove', this.onTouchMove as EventListener, { passive: false });
    
    // Initial emit
    this.emit();
  }

  /**
   * Stop listening to events.
   */
  stop(): void {
    if (!this.isActive) return;
    this.isActive = false;

    this.element.removeEventListener('wheel', this.onWheel as EventListener);
    this.element.removeEventListener('touchstart', this.onTouchStart as EventListener);
    this.element.removeEventListener('touchmove', this.onTouchMove as EventListener);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Update the total virtual scroll height (e.g. on resize).
   */
  updateTotalScroll(newTotal: number): void {
    this.totalScroll = newTotal;
    // Re-clamp current scroll position to new bounds
    this.currentScroll = clamp(this.currentScroll, 0, this.totalScroll);
    this.emit();
  }

  /**
   * Reset current scroll position.
   */
  reset(): void {
    this.currentScroll = 0;
    this.emit();
  }

  /**
   * Internal wheel handler.
   */
  private onWheel(e: WheelEvent): void {
    // Only prevent default if we're active
    if (!this.isActive) return;

    e.preventDefault();
    this.currentScroll += e.deltaY;
    this.currentScroll = clamp(this.currentScroll, 0, this.totalScroll);
    this.emit();
  }

  /**
   * Internal touch start handler.
   */
  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY;
      // Don't prevent default on start, only on move if needed
    }
  }

  /**
   * Internal touch move handler.
   */
  private onTouchMove(e: TouchEvent): void {
    // Only prevent default if we're active
    if (!this.isActive) return;

    if (e.touches.length > 0) {
      e.preventDefault(); // Prevent page scroll
      const touchY = e.touches[0].clientY;
      const deltaY = this.touchStartY - touchY; // Drag up = positive scroll (content moves up, we scroll down)
      
      this.touchStartY = touchY; // Update for next move relative to previous position

      this.currentScroll += deltaY;
      this.currentScroll = clamp(this.currentScroll, 0, this.totalScroll);
      this.emit();
    }
  }

  /**
   * Schedule callback execution via requestAnimationFrame.
   */
  private emit(): void {
    if (!this.isActive) return;

    if (!this.isTicking) {
      this.isTicking = true;
      this.rafId = requestAnimationFrame(() => {
        const progress = this.totalScroll > 0 ? this.currentScroll / this.totalScroll : 0;
        this.callback(clamp(progress, 0, 1));
        this.isTicking = false;
        this.rafId = null;
      });
    }
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    this.stop();
  }
}
