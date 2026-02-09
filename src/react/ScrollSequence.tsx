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
    fallback?: React.ReactNode;
}

const InnerSequence: React.FC<InnerSequenceProps> = ({ 
    source, 
    debug, 
    memoryStrategy,
    lazyBuffer,
    accessibilityLabel = "Scroll sequence",
    fallback 
}) => {
    const debugRef = useRef<HTMLDivElement>(null);
    const { canvasRef, isLoaded } = useScrollSequence({
      source,
      debugRef,
      memoryStrategy,
      lazyBuffer
    });
    
    // Fallback logic could be handled here or by parent.
    // If we handle it here, we overlay it?
    // Actually, canvas opacity handles the fade-in.
    // Use fallback if provided and not loaded.

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
      accessibilityLabel,
    } = props;

    // ScrollSequence now acts as the convenient "Bundle"
    // It provides the Timeline context and renders the Canvas consumer.
    return (
      <div ref={ref} className={className} style={{ width: '100%' }}>
          <ScrollTimelineProvider scrollLength={scrollLength}>
             <InnerSequence 
                source={source} 
                debug={debug} 
                memoryStrategy={memoryStrategy}
                lazyBuffer={lazyBuffer} 
                fallback={fallback}
                accessibilityLabel={accessibilityLabel}
             />
             {props.children}
          </ScrollTimelineProvider>
      </div>
    );
  }
);
