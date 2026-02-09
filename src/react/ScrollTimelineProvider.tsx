import React, { useRef, useEffect, useState } from 'react';
import { ScrollTimeline } from '../core/scrollTimeline';
import { ScrollTimelineContext } from './scrollTimelineContext';

export interface ScrollTimelineProviderProps {
  children: React.ReactNode;
  
  /** CSS height for the scroll container (e.g., "300vh"). */
  scrollLength?: string;
  
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollTimelineProvider({
  children,
  scrollLength = '300vh',
  className = '',
  style = {},
}: ScrollTimelineProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeline, setTimeline] = useState<ScrollTimeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new ScrollTimeline(containerRef.current);
    instance.start();
    setTimeline(instance);

    return () => {
      instance.destroy();
      setTimeline(null);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    height: scrollLength,
    position: 'relative',
    width: '100%',
    ...style,
  };

  const stickyWrapperStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
  };

  return (
    <ScrollTimelineContext.Provider value={{ timeline }}>
      <div 
        ref={containerRef} 
        className={className} 
        style={containerStyle}
      >
        <div style={stickyWrapperStyle}>
          {children}
        </div>
      </div>
    </ScrollTimelineContext.Provider>
  );
}
