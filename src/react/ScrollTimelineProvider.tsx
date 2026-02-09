import React, { useRef, useState } from 'react';
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

  // Use layout effect to ensure timeline exists before children effects run
  // SSR safe fallback: use useEffect on server
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    // Future-proof: factory could be passed via props
    const instance = new ScrollTimeline(containerRef.current);
    
    // We do NOT call start() anymore, it starts on subscription
    // instance.start(); 
    
    setTimeline(instance);

    return () => {
      instance.destroy();
      setTimeline(null);
    };
  }, []); // Dependencies? strict empty for one-time setup

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

  // Memoize context value to prevent unnecessary re-renders of consumers
  // when Parent component renders but timeline instance hasn't changed.
  const contextValue = React.useMemo(() => ({ timeline }), [timeline]);

  return (
    <ScrollTimelineContext.Provider value={contextValue}>
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
