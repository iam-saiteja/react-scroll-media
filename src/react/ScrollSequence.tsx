import React, { useRef } from 'react';
import type { ScrollSequenceProps } from '../types';
import { useScrollSequence } from './useScrollSequence';
import { ScrollTimelineProvider } from './ScrollTimelineProvider';

interface InnerSequenceProps {
    source: ScrollSequenceProps['source'];
    debug: boolean;
    memoryStrategy: ScrollSequenceProps['memoryStrategy'];
}

const InnerSequence: React.FC<InnerSequenceProps> = ({ source, debug, memoryStrategy }) => {
    const debugRef = useRef<HTMLDivElement>(null);
    const { canvasRef, isLoaded } = useScrollSequence({
      source,
      debugRef,
      memoryStrategy
    });
    
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
            <canvas ref={canvasRef} style={canvasStyle} />
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
    } = props;

    // ScrollSequence now acts as the convenient "Bundle"
    // It provides the Timeline context and renders the Canvas consumer.
    return (
      <div ref={ref} className={className} style={{ width: '100%' }}>
          <ScrollTimelineProvider scrollLength={scrollLength}>
             <InnerSequence source={source} debug={debug} memoryStrategy={memoryStrategy} />
             {props.children}
          </ScrollTimelineProvider>
      </div>
    );
  }
);
