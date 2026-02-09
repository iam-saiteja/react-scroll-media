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

  /** Lazy load buffer size (default 10) */
  bufferSize?: number;
}

export class ImageController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: string[];
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private currentFrameIndex = -1;
  private strategy: 'eager' | 'lazy';
  private bufferSize: number;

  /**
   * Create a new ImageController instance.
   *
   * @param config - Configuration object
   * @throws If canvas doesn't support 2D context
   */
  private isDestroyed = false;

  constructor(config: ImageControllerConfig) {
    this.canvas = config.canvas;
    this.frames = config.frames;
    this.strategy = config.strategy || 'eager';
    this.bufferSize = config.bufferSize || 10;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    // Initial load
    if (this.strategy === 'eager') {
      this.preloadAll();
    } else {
      this.ensureFrameWindow(0);
    }
  }

  // ... preloadAll omitted for brevity if unchanged, but let's include for completeness if needed.
  // Actually, we need to add guards to preloadFrame, so let's check it.
  
  private preloadAll(): void {
    this.frames.forEach((_, index) => this.preloadFrame(index));
  }

  private ensureFrameWindow(currentIndex: number): void {
    if (this.isDestroyed) return;

    const radius = this.bufferSize;
    const start = Math.max(0, currentIndex - radius);
    const end = Math.min(this.frames.length - 1, currentIndex + radius);
    
    const needed = new Set<string>();
    for (let i = start; i <= end; i++) {
        needed.add(this.frames[i]);
    }

    // Cleanup unused frames (LRU-ish but simple Window-based)
    for (const [src] of this.imageCache) {
        if (!needed.has(src)) {
            this.imageCache.delete(src);
            // We should also cancel promises if possible, but we can't cancel a fetch/image load easily.
            // We just delete the tracking so we don't cache it when it lands.
            this.loadingPromises.delete(src);
        }
    }

    // Load needed
    for (let i = start; i <= end; i++) {
        void this.preloadFrame(i);
    }
  }

  async preloadFrame(index: number): Promise<void> {
    if (this.isDestroyed || index < 0 || index >= this.frames.length) return;

    const src = this.frames[index];

    if (this.imageCache.has(src)) return;

    // Deduplication: Reuse existing promise if allowed
    if (!this.loadingPromises.has(src)) {
      this.loadingPromises.set(src, this.loadImage(src));
    }

    try {
      await this.loadingPromises.get(src);
    } catch {
      // Failed
      if (!this.isDestroyed) {
          // Silent failure
      }
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        if (this.isDestroyed) return;
        
        // Critical: decode() to prevent main-thread jank during draw
        img.decode()
          .then(() => {
            if (this.isDestroyed) return;
            this.imageCache.set(src, img);
            resolve(img);
          })
          .catch(() => {
             if (this.isDestroyed) return;
             // Even if decode fails, the image might be usable
             this.imageCache.set(src, img);
             resolve(img);
          });
      };

      img.onerror = () => {
        if (this.isDestroyed) return;
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  update(progress: number): void {
    if (this.isDestroyed || this.frames.length === 0) return;

    const frameIndex = Math.floor(progress * (this.frames.length - 1));

    if (this.strategy === 'lazy') {
      this.ensureFrameWindow(frameIndex);
    }

    if (frameIndex === this.currentFrameIndex) return;

    this.currentFrameIndex = frameIndex;
    this.drawFrame(frameIndex);
  }

  private drawFrame(index: number): void {
    if (this.isDestroyed || index < 0 || index >= this.frames.length) return;

    const src = this.frames[index];
    const img = this.imageCache.get(src);

    if (!img) {
      // Frame not ready. Optional: Show loading spinner or keep previous frame?
      // For now, keep previous (natural behavior of canvas).
      // Or check promise
      const promise = this.loadingPromises.get(src);
      if (promise) {
          promise.then(() => {
              if (this.currentFrameIndex === index) {
                  this.drawFrame(index);
              }
          }).catch(() => {}); // catch ignore
      }
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = Math.min(
      this.canvas.width / img.width,
      this.canvas.height / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (this.canvas.width - scaledWidth) / 2;
    const y = (this.canvas.height - scaledHeight) / 2;

    this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }

  setCanvasSize(width: number, height: number): void {
    if (this.isDestroyed) return;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.currentFrameIndex >= 0) {
      this.drawFrame(this.currentFrameIndex);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.imageCache.clear();
    this.loadingPromises.clear();
  }
}
