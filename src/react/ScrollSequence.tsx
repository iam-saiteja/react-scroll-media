/**
 * ScrollSequence
 * Main React component for scroll-driven image sequence rendering.
 * SSR-safe, minimal re-renders, uses requestAnimationFrame.
 */

import React, { useRef, useEffect } from 'react';

import type { ScrollSequenceProps } from '../types';
import { ScrollEngine } from '../core/scrollEngine';
import { clamp } from '../core/clamp';
import { sequenceResolver } from '../sequence/sequenceResolver';
import { ImageController } from '../controllers/imageController';

/**
 * ScrollSequence Component
 *
 * Renders an image sequence that progresses based on scroll position.
 * The canvas sticks to viewport (if `pin={true}`) while the container scrolls.
 *
 * @example
 * ```tsx
 * <ScrollSequence
 *   frames={[
 *     '/frames/image-1.png',
 *     '/frames/image-2.png',
 *     '/frames/image-3.png',
 *   ]}
 *   scrollLength="200vh"
 *   pin={true}
 * />
 * ```
 */
export const ScrollSequence = React.forwardRef<
  HTMLDivElement,
  ScrollSequenceProps
>(
  (
    {
      frames,
      scrollLength = '200vh',
      pin = true,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ScrollEngine | null>(null);
    const controllerRef = useRef<ImageController | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (!container || !canvas) return;

      // Resolve and sort frames numerically
      const { frames: sortedFrames } = sequenceResolver(frames);

      /**
       * Update canvas size based on container dimensions.
       */
      const updateCanvasSize = (): void => {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };

      // Initial canvas size
      updateCanvasSize();

      // Initialize ImageController
      controllerRef.current = new ImageController({
        canvas,
        frames: sortedFrames,
      });

      // Initialize ScrollEngine with clamped progress callback
      engineRef.current = new ScrollEngine((progress) => {
        const clamped = clamp(progress);
        controllerRef.current?.update(clamped);
      });

      engineRef.current.start();

      // Handle container resize using ResizeObserver
      resizeObserverRef.current = new ResizeObserver(() => {
        updateCanvasSize();
        controllerRef.current?.setCanvasSize(canvas.width, canvas.height);
      });

      resizeObserverRef.current.observe(container);

      // Cleanup on unmount
      return () => {
        engineRef.current?.destroy();
        controllerRef.current?.destroy();
        resizeObserverRef.current?.disconnect();
      };
    }, [frames]);

    const containerStyle: React.CSSProperties = {
      height: scrollLength,
      position: pin ? 'relative' : undefined,
    };

    const canvasStyle: React.CSSProperties = {
      display: 'block',
      width: '100%',
      height: '100%',
      position: pin ? 'sticky' : 'relative',
      top: pin ? 0 : undefined,
    };

    return (
      <div
        ref={ref || containerRef}
        className={className}
        style={containerStyle}
      >
        <canvas ref={canvasRef} style={canvasStyle} />
      </div>
    );
  }
);

ScrollSequence.displayName = 'ScrollSequence';
