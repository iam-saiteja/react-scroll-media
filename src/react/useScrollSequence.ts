import { useRef, useEffect, useState } from 'react';
import type { ScrollSequenceProps } from '../types';
import { ScrollEngine } from '../core/scrollEngine';
import { ImageController } from '../controllers/imageController';
import { resolveSequence } from '../sequence/sequenceResolver';
import { clamp } from '../core/clamp';

interface UseScrollSequenceParams {
  source: ScrollSequenceProps['source'];
}

export function useScrollSequence({
  source,
}: UseScrollSequenceParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ScrollEngine | null>(null);
  const controllerRef = useRef<ImageController | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let currentEngine: ScrollEngine | null = null;
    let currentController: ImageController | null = null;
    let currentObserver: ResizeObserver | null = null;

    const init = async () => {
      setIsLoaded(false);
      setError(null);

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      try {
        // 1. Resolve Sequence
        const sequence = await resolveSequence(source);
        if (!active) return;

        if (sequence.frames.length === 0) {
          console.warn("ScrollSequence: No frames resolved.");
          return;
        }

        // 2. Setup Dimensions
        const updateCanvasSize = () => {
          // Canvas is always 100vh height and 100% width of the container
          // But technically it's inside the sticky wrapper which is 100vh
          const rect = container.getBoundingClientRect();
          // We want the CANVAS resolution to match visualization
          // Since it's sticky 100vh, we can just use window dimensions or the wrapper dimensions if we had ref
          // But we only have containerRef (the outer relative one).
          // Actually, we can assume the canvas fills the viewport width/height relative to the container width ?
          // The container width is valid. The container height is huge (scrollLength).
          // The canvas visual height is viewport height.
          
          canvas.width = rect.width;
          canvas.height = window.innerHeight; // Always 100vh visual
          currentController?.setCanvasSize(rect.width, window.innerHeight);
        };

        // 3. Initialize Controller
        currentController = new ImageController({
          canvas,
          frames: sequence.frames,
        });
        controllerRef.current = currentController;

        // 4. Initialize Engine
        currentEngine = new ScrollEngine(
          (p) => currentController?.update(clamp(p)),
          container
        );
        engineRef.current = currentEngine;

        // 5. Start & Observe
        updateCanvasSize(); // Initial size
        currentEngine.start();

        currentObserver = new ResizeObserver(updateCanvasSize);
        currentObserver.observe(container);
        resizeObserverRef.current = currentObserver;

        if (active) setIsLoaded(true);

      } catch (err) {
        if (active) {
          console.error("ScrollSequence init failed:", err);
          setError(err instanceof Error ? err : new Error('Unknown initialization error'));
        }
      }
    };

    init();

    return () => {
      active = false;
      currentEngine?.destroy();
      currentController?.destroy();
      currentObserver?.disconnect();
      engineRef.current = null;
      controllerRef.current = null;
      resizeObserverRef.current = null;
    };
  }, [source]);

  return {
    containerRef,
    canvasRef,
    isLoaded,
    error
  };
}
