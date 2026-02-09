import { useRef, useEffect, useState } from 'react';
import type { ScrollSequenceProps } from '../types';
import { ScrollEngine } from '../core/scrollEngine';
import { EventScrollEngine } from '../core/eventScrollEngine';
import { ImageController } from '../controllers/imageController';
import { resolveSequence } from '../sequence/sequenceResolver';
import { clamp } from '../core/clamp';

interface UseScrollSequenceParams {
  source: ScrollSequenceProps['source'];
  scrollLength?: string;
  fullscreen?: boolean;
  lockScroll?: boolean;
}

export function useScrollSequence({
  source,
  scrollLength = '200vh',
  fullscreen = true,
  lockScroll = false,
}: UseScrollSequenceParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ScrollEngine | EventScrollEngine | null>(null);
  const controllerRef = useRef<ImageController | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let currentEngine: ScrollEngine | EventScrollEngine | null = null;
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
          canvas.width = rect.width;
          canvas.height = rect.height;
          currentController?.setCanvasSize(rect.width, rect.height);
          
          // Update virtual scroll calculation on resize
          if (lockScroll && currentEngine instanceof EventScrollEngine) {
             const vScroll = calculateVirtualScroll(scrollLength);
             currentEngine.updateTotalScroll(vScroll);
          }
        };

        // 3. Initialize Controller
        currentController = new ImageController({
          canvas,
          frames: sequence.frames,
        });
        controllerRef.current = currentController;

        // 4. Initialize Engine
        const scrollTarget = (fullscreen && !lockScroll)
          ? container.querySelector('[data-scroll-area]') as Element
          : null;

        if (lockScroll) {
          const vScroll = calculateVirtualScroll(scrollLength);
          currentEngine = new EventScrollEngine(
            (p) => currentController?.update(clamp(p)),
            vScroll,
            container
          );
        } else {
          // Pass container as the 'triggerElement' for relative progress calculation
          currentEngine = new ScrollEngine(
            (p) => currentController?.update(clamp(p)),
            scrollTarget,
            container // triggerElement
          );
        }
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
  }, [source, scrollLength, fullscreen, lockScroll]);

  return {
    containerRef,
    canvasRef,
    isLoaded,
    error
  };
}

function calculateVirtualScroll(scrollLength: string): number {
  if (scrollLength.endsWith('vh')) {
    return (parseFloat(scrollLength) / 100) * window.innerHeight;
  }
  if (scrollLength.endsWith('px')) {
    return parseFloat(scrollLength);
  }
  return parseFloat(scrollLength) || window.innerHeight * 2;
}
