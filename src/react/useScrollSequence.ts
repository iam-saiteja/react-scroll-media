import { useRef, useEffect, useState } from 'react';
import type { ScrollSequenceProps } from '../types';
import { ImageController } from '../controllers/imageController';
import { resolveSequence } from '../sequence/sequenceResolver';
import { clamp } from '../core/clamp';
import { useScrollTimeline } from './useScrollTimeline';

interface UseScrollSequenceParams {
  source: ScrollSequenceProps['source'];
  debugRef?: React.MutableRefObject<HTMLDivElement | null>;
  memoryStrategy?: 'eager' | 'lazy';
  lazyBuffer?: number;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage image sequence in a timeline context.
 * MUST be used inside ScrollTimelineProvider.
 */
export function useScrollSequence({
  source,
  debugRef,
  memoryStrategy = 'eager',
  lazyBuffer = 10,
  onError,
}: UseScrollSequenceParams) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ImageController | null>(null);
  
  // Use the shared timeline
  const { subscribe } = useScrollTimeline();

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let currentController: ImageController | null = null;
    let unsubscribeTimeline: (() => void) | null = null;

    const init = async () => {
      setIsLoaded(false);
      setError(null);

      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // 1. Resolve Sequence
        // Guard: source change handled by effect dep, but verify environment?
        if (typeof window === 'undefined') return;

        const sequence = await resolveSequence(source);
        if (!active) return;

        if (sequence.frames.length === 0) {
          return;
        }

        // 2. Setup Dimensions (Initial)
        if (typeof window !== 'undefined') {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        // 3. Initialize Controller
        currentController = new ImageController({
          canvas,
          frames: sequence.frames,
          strategy: memoryStrategy,
          bufferSize: lazyBuffer
        });
        controllerRef.current = currentController;

        // 4. Subscribe to Timeline
        unsubscribeTimeline = subscribe((progress) => {
            if (!currentController) return;
            const clamped = clamp(progress);
            currentController.update(clamped);

            // Debug Overlay
            if (debugRef?.current) {
                const frameIndex = Math.floor(clamped * (sequence.frames.length - 1));
                debugRef.current.innerText = `Progress: ${clamped.toFixed(2)}\nFrame: ${frameIndex + 1} / ${sequence.frames.length}`;
            }
        });

        if (active) setIsLoaded(true);

      } catch (err) {
        if (active) {
          const e = err instanceof Error ? err : new Error('Unknown initialization error');
          setError(e);
          if (onError) onError(e);
        }
      }
    };

    init();

    return () => {
      active = false;
      currentController?.destroy();
      controllerRef.current = null;
      if (unsubscribeTimeline) unsubscribeTimeline();
    };
  }, [source, memoryStrategy, lazyBuffer, subscribe]); // Re-run if source or timeline changes

  return {
    canvasRef,
    isLoaded,
    error
  };
}
