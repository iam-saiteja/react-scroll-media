/**
 * ScrollSequence
 * Main React component for scroll-driven image sequence rendering.
 * SSR-safe, minimal re-renders, uses requestAnimationFrame.
 */

import React, { useRef, useEffect } from 'react';

import type { ScrollSequenceProps } from '../types';
import { ScrollEngine } from '../core/scrollEngine';
import { EventScrollEngine } from '../core/eventScrollEngine';
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
      fullscreen = true,
      lockScroll = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ScrollEngine | EventScrollEngine | null>(null);
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

      // For fullscreen mode, find the scrollable inner container
      const scrollTarget = (fullscreen && !lockScroll)
        ? container.querySelector('[data-scroll-area]') as Element
        : null;

      // Initialize appropriate engine
      if (lockScroll) {
        // Calculate total virtual scroll distance in pixels
        let virtualScroll = 2000; // default fallout
        if (scrollLength.endsWith('vh')) {
          virtualScroll = (parseFloat(scrollLength) / 100) * window.innerHeight;
        } else if (scrollLength.endsWith('px')) {
          virtualScroll = parseFloat(scrollLength);
        } else {
          virtualScroll = parseFloat(scrollLength) || window.innerHeight * 2;
        }

        // Use EventScrollEngine for locked scrolling
        engineRef.current = new EventScrollEngine(
          (progress) => {
            const clamped = clamp(progress);
            controllerRef.current?.update(clamped);
          },
          virtualScroll,
          container // Listen on container (or window if needed, but container is safer if it covers screen)
        );
        
        // If container doesn't cover screen, might need window listener. 
        // But assuming generic container for now.
        // Actually, if fullscreen, container is 100vh.
      } else {
        // Use standard ScrollEngine
        engineRef.current = new ScrollEngine(
          (progress) => {
            const clamped = clamp(progress);
            controllerRef.current?.update(clamped);
          },
          scrollTarget
        );
      }

      engineRef.current.start();

      // Handle container resize using ResizeObserver
      resizeObserverRef.current = new ResizeObserver(() => {
        updateCanvasSize();
        controllerRef.current?.setCanvasSize(canvas.width, canvas.height);
        
        if (lockScroll && engineRef.current instanceof EventScrollEngine) {
           let virtualScroll = 2000; 
           if (scrollLength.endsWith('vh')) {
             virtualScroll = (parseFloat(scrollLength) / 100) * window.innerHeight;
           } else if (scrollLength.endsWith('px')) {
             virtualScroll = parseFloat(scrollLength);
           } else {
             virtualScroll = parseFloat(scrollLength) || window.innerHeight * 2;
           }
           engineRef.current.updateTotalScroll(virtualScroll);
        }
      });

      resizeObserverRef.current.observe(container);

      // Cleanup on unmount
      return () => {
        engineRef.current?.destroy();
        controllerRef.current?.destroy();
        resizeObserverRef.current?.disconnect();
      };
    }, [frames, fullscreen, lockScroll, scrollLength]);

    const containerStyle: React.CSSProperties = {
      height: fullscreen ? '100vh' : scrollLength,
      position: 'relative',
      overflow: fullscreen ? 'hidden' : 'auto',
    };

    const scrollAreaStyle: React.CSSProperties = fullscreen ? {
      height: scrollLength,
      overflow: 'auto',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
    } : {};

    const canvasStyle: React.CSSProperties = {
      display: 'block',
      width: '100%',
      height: '100%',
      position: fullscreen ? 'absolute' : pin ? 'sticky' : 'relative',
      top: fullscreen ? 0 : pin ? 0 : undefined,
      left: fullscreen ? 0 : undefined,
      pointerEvents: lockScroll ? 'auto' : 'none', // Allow events if locked, otherwise pass through
    };

    return (
      <div
        ref={ref || containerRef}
        className={className}
        style={containerStyle}
      >
        {fullscreen ? (
          <>
            {!lockScroll && (
              <div
                data-scroll-area
                style={scrollAreaStyle}
              >
                <div style={{ height: '100%' }} />
              </div>
            )}
            <canvas ref={canvasRef} style={canvasStyle} />
          </>
        ) : (
          <canvas ref={canvasRef} style={canvasStyle} />
        )}
      </div>
    );
  }
);

ScrollSequence.displayName = 'ScrollSequence';
