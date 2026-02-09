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
      scrollLength = '300vh',
      className = '',
    } = props;

    const { containerRef, canvasRef, isLoaded } = useScrollSequence({
      source,
    });

    const containerStyle: React.CSSProperties = {
      height: scrollLength,
      position: 'relative',
      width: '100%',
    };

    const stickyWrapperStyle: React.CSSProperties = {
      position: 'sticky',
      top: 0,
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
    };

    const canvasStyle: React.CSSProperties = {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.2s ease-in',
    };

    return (
      <div
        ref={ref || containerRef}
        className={className}
        style={containerStyle}
      >
        <div style={stickyWrapperStyle}>
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
      </div>
    );
  }
);

ScrollSequence.displayName = 'ScrollSequence';


