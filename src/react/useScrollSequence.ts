import { useRef, useEffect, useState } from 'react';
import type { ScrollSequenceProps } from '../types';
import { ScrollEngine } from '../core/scrollEngine';
import { ImageController } from '../controllers/imageController';
import { resolveSequence } from '../sequence/sequenceResolver';
import { clamp } from '../core/clamp';

interface UseScrollSequenceParams {
  source: ScrollSequenceProps['source'];
  debugRef?: React.MutableRefObject<HTMLDivElement | null>;
  memoryStrategy?: 'eager' | 'lazy';
}

export function useScrollSequence({
  source,
  debugRef,
  memoryStrategy = 'eager',
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
          const rect = container.getBoundingClientRect();
          // Canvas matches container width and viewport height (sticky)
          canvas.width = rect.width;
          canvas.height = window.innerHeight; 
          currentController?.setCanvasSize(rect.width, window.innerHeight);
        };

        // 3. Initialize Controller
        currentController = new ImageController({
          canvas,
          frames: sequence.frames,
          strategy: memoryStrategy,
        });
        controllerRef.current = currentController;

        // 4. Initialize Engine
        currentEngine = new ScrollEngine(
          (p) => {
             const clamped = clamp(p);
             currentController?.update(clamped);

             // Update Debug Overlay (Direct DOM manipulation for perf)
             if (debugRef?.current) {
                const frameIndex = Math.floor(clamped * (sequence.frames.length - 1));
                debugRef.current.innerText = `Progress: ${clamped.toFixed(2)}\nFrame: ${frameIndex + 1} / ${sequence.frames.length}`;
             }
          },
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
  }, [source, memoryStrategy]);

  return {
    containerRef,
    canvasRef,
    isLoaded,
    error
  };
}
