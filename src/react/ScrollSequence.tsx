import React, { useRef } from 'react';
import type { ScrollSequenceProps } from '../types';
import { useScrollSequence } from './useScrollSequence';
import { ScrollTimelineProvider } from './ScrollTimelineProvider';


interface InnerSequenceProps {
  source: ScrollSequenceProps['source'];
  debug: boolean;
  memoryStrategy: ScrollSequenceProps['memoryStrategy'];
  lazyBuffer?: number;
  accessibilityLabel?: string;
  fit?: React.CSSProperties['objectFit']; // Add fit prop here
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

const InnerSequence: React.FC<InnerSequenceProps> = ({
  source,
  debug,
  memoryStrategy,
  lazyBuffer,
  accessibilityLabel = "Scroll sequence",
  fit = 'cover', // Default to cover
  fallback,
  onError
}) => {
  const debugRef = useRef<HTMLDivElement>(null);
  const { canvasRef, isLoaded } = useScrollSequence({
    source,
    debugRef,
    memoryStrategy,
    lazyBuffer,
    onError
  });

  // Fallback logic could be handled here or by parent.
  // If we handle it here, we overlay it?
  // Actually, canvas opacity handles the fade-in.
  // Use fallback if provided and not loaded.

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: fit, // Use the prop
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
    <>
      {/* Render fallback behind canvas, or replace? 
                If replace, we might loose the canvas ref init?
                Better to render both and cross-fade or just hide fallback when loaded.
            */}
      {!isLoaded && fallback && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {fallback}
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={canvasStyle}
        role="img"
        aria-label={accessibilityLabel}
      />
      {debug && <div ref={debugRef} style={debugStyle}>Waiting for scroll...</div>}
    </>
  );
};

export const ScrollSequence = React.forwardRef<HTMLDivElement, ScrollSequenceProps>(
  (props, ref) => {
    const {
      source,
      scrollLength = '300vh',
      className = '',
      debug = false,
      memoryStrategy = 'eager',
      lazyBuffer = 10,
      fallback,
      fit = 'cover', // Default here too
      accessibilityLabel,
      onError,
      children // Extract children
    } = props;

    // Check for reduced motion
    // ... logic for reduced motion could be here or inside hook

    return (
      <ScrollTimelineProvider
        scrollLength={scrollLength}
        className={className}
        style={{ position: 'relative' }} // Ensure container is relative
        containerRef={ref as React.RefObject<HTMLDivElement>}
      >
        <InnerSequence
          source={source}
          debug={debug}
          memoryStrategy={memoryStrategy}
          lazyBuffer={lazyBuffer}
          fallback={fallback}
          accessibilityLabel={accessibilityLabel}
          onError={onError}
          fit={fit as any} // Pass fit prop
        />
        {/* Render children ON TOP of canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          {children}
        </div>
      </ScrollTimelineProvider>
    );
  }
);
