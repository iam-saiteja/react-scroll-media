import React from 'react';
import type { ScrollSequenceProps } from '../types';
import { useScrollSequence } from './useScrollSequence';

/**
 * ScrollSequence Component
 *
 * Renders an image sequence that progresses based on scroll position.
 * The canvas sticks to viewport (if `pin={true}`) while the container scrolls.
 *
 * @example
 * ```tsx
 * <ScrollSequence
 *   source={{ type: 'manual', frames: [...] }}
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
    props,
    ref
  ) => {
    const {
      source,
      scrollLength = '200vh',
      pin = true,
      className = '',
      fullscreen = true,
      lockScroll = false,
    } = props;

    const { containerRef, canvasRef, isLoaded } = useScrollSequence({
      source,
      scrollLength,
      fullscreen,
      lockScroll,
    });

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
      pointerEvents: lockScroll ? 'auto' : 'none',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.2s ease-in',
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


