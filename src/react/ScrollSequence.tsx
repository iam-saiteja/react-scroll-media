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
      debug = false,
    } = props;

    const debugRef = React.useRef<HTMLDivElement>(null);

    const { containerRef, canvasRef, isLoaded } = useScrollSequence({
      source,
      debugRef,
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
    
    const debugStyle: React.CSSProperties = {
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#00ff00',
      padding: '8px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      pointerEvents: 'none',
      whiteSpace: 'pre-wrap',
      zIndex: 9999,
    };

    return (
      <div
        ref={ref || containerRef}
        className={className}
        style={containerStyle}
      >
        <div style={stickyWrapperStyle}>
          <canvas ref={canvasRef} style={canvasStyle} />
          {debug && <div ref={debugRef} style={debugStyle}>Waiting for scroll...</div>}
        </div>
      </div>
    );
  }
);

ScrollSequence.displayName = 'ScrollSequence';


