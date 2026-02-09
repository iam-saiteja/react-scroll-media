/**
 * ImageController
 * Manages canvas rendering, image loading, and frame-by-frame drawing.
 * Handles preloading and caching to minimize redraws.
 */

export interface ImageControllerConfig {
  /** HTMLCanvasElement to draw on */
  canvas: HTMLCanvasElement;

  /** Array of sorted frame URLs */
  frames: string[];

  /** Memory management strategy */
  strategy?: 'eager' | 'lazy';
}

export class ImageController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: string[];
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private currentFrameIndex = -1;
  private strategy: 'eager' | 'lazy';

  /**
   * Create a new ImageController instance.
   *
   * @param config - Configuration object
   * @throws If canvas doesn't support 2D context
   */
  constructor(config: ImageControllerConfig) {
    this.canvas = config.canvas;
    this.frames = config.frames;
    this.strategy = config.strategy || 'eager';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    if (this.strategy === 'eager') {
      this.preloadAll();
    } else {
      // Lazy: Load first few frames initially
      this.ensureFrameWindow(0);
    }
  }

  /**
   * Preload all frames (Eager Mode)
   */
  private preloadAll(): void {
    this.frames.forEach((_, index) => this.preloadFrame(index));
  }

  /**
   * Ensure frames around the current index are loaded (Lazy Mode)
   * Keeps ±3 frames, unloads others.
   */
  private ensureFrameWindow(currentIndex: number): void {
    const radius = 3;
    const start = Math.max(0, currentIndex - radius);
    const end = Math.min(this.frames.length - 1, currentIndex + radius);
    
    const needed = new Set<string>();

    // 1. Identify needed frames
    for (let i = start; i <= end; i++) {
        needed.add(this.frames[i]);
    }

    // 2. Cleanup unused frames
    for (const [src] of this.imageCache) {
        if (!needed.has(src)) {
            // Also need to check if it's currently being awaited?
            // For simplicity, just delete from cache.
            this.imageCache.delete(src);
            this.loadingPromises.delete(src);
        }
    }

    // 3. Load needed frames
    for (let i = start; i <= end; i++) {
        void this.preloadFrame(i);
    }
  }

  /**
   * Preload an image frame asynchronously.
   * Caches the image and avoids duplicate loads.
   *
   * @param index - Frame index to preload
   */
  async preloadFrame(index: number): Promise<void> {
    if (index < 0 || index >= this.frames.length) return;

    const src = this.frames[index];

    // Already cached
    if (this.imageCache.has(src)) return;

    // Avoid duplicate loading promises
    if (!this.loadingPromises.has(src)) {
      this.loadingPromises.set(src, this.loadImage(src));
    }

    try {
      await this.loadingPromises.get(src);
    } catch (err) {
      console.error(`Failed to preload frame at index ${index}: ${src}`, err);
    }
  }

  /**
   * Load a single image and cache it.
   *
   * @param src - Image URL
   * @returns Promise that resolves with the loaded HTMLImageElement
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Use decode() to ensure image is ready for painting without jank
        img.decode()
          .then(() => {
            // In lazy mode, we might have scrolled away while loading.
            // But we'll cache it anyway for now, next sweep will clean it if needed.
            this.imageCache.set(src, img);
            resolve(img);
          })
          .catch((err) => {
             // Decode failed (rare), but load succeeded. Fallback to just resolving.
             console.warn(`ImageController: Decode failed for ${src}`, err);
             this.imageCache.set(src, img);
             resolve(img);
          });
      };

      img.onerror = () => {
        // Don't reject, just resolve so Promise.all doesn't fail?
        // Actually we trap errors in preloadFrame, so rejection is fine.
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  /**
   * Update the canvas with the frame corresponding to the given progress.
   * Only redraws if the frame index changes.
   *
   * @param progress - Progress value between 0 and 1
   */
  update(progress: number): void {
    if (this.frames.length === 0) return;

    // Calculate frame index (0 to frameCount - 1)
    const frameIndex = Math.floor(progress * (this.frames.length - 1));

    if (this.strategy === 'lazy') {
      this.ensureFrameWindow(frameIndex);
    } else {
        // Eager mode: maybe check next frame? logic was:
        // if (frameIndex + 1 < this.frames.length) void this.preloadFrame(frameIndex + 1);
        // But eager preloads all at start.
    }

    // Avoid redraw if frame hasn't changed
    if (frameIndex === this.currentFrameIndex) return;

    this.currentFrameIndex = frameIndex;
    this.drawFrame(frameIndex);
  }

  /**
   * Draw a frame to the canvas.
   * Centers the image and scales to fit the canvas while maintaining aspect ratio.
   *
   * @param index - Frame index to draw
   */
  private drawFrame(index: number): void {
    if (index < 0 || index >= this.frames.length) return;

    const src = this.frames[index];
    const img = this.imageCache.get(src);

    // Image not yet loaded?
    if (!img) {
      // If lazy, it might be loading.
      // If we are here, we really want to draw it.
      // Maybe we can check if there's a promise?
      const promise = this.loadingPromises.get(src);
      if (promise) {
          promise.then(() => {
              // If we are still on this frame, draw it
              if (this.currentFrameIndex === index) {
                  this.drawFrame(index);
              }
          });
      }
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate scale to fit image in canvas while maintaining aspect ratio
    const scale = Math.min(
      this.canvas.width / img.width,
      this.canvas.height / img.height
    );

    // Center the image
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (this.canvas.width - scaledWidth) / 2;
    const y = (this.canvas.height - scaledHeight) / 2;

    // Draw image
    this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }

  /**
   * Update canvas size and redraw current frame.
   * Call this when the container is resized.
   *
   * @param width - New canvas width
   * @param height - New canvas height
   */
  setCanvasSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    // Redraw current frame at new size
    if (this.currentFrameIndex >= 0) {
      this.drawFrame(this.currentFrameIndex);
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.imageCache.clear();
    this.loadingPromises.clear();
  }
}
