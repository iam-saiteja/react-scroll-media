import React, { useRef, useEffect } from 'react';
import { useScrollTimeline } from './useScrollTimeline';

export interface ScrollTextProps {
  children: React.ReactNode;
  /** Progress start (0-1) where animation begins */
  start?: number;
  /** Progress end (0-1) where animation ends */
  end?: number;
  /** Initial opacity */
  initialOpacity?: number;
  /** Target opacity */
  targetOpacity?: number;
  /** Y-axis translation range in pixels (e.g., 50 means move down 50px) */
  translateY?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function ScrollText({
  children,
  start = 0,
  end = 1,
  initialOpacity = 0,
  targetOpacity = 1,
  translateY = 50,
  style,
  className,
}: ScrollTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { subscribe } = useScrollTimeline();

  useEffect(() => {
    // Sub to timeline
    const unsubscribe = subscribe((globalProgress) => {
      if (!ref.current) return;

      // 1. Calculate local progress within [start, end]
      let localProgress = 0;
      if (globalProgress <= start) localProgress = 0;
      else if (globalProgress >= end) localProgress = 1;
      else localProgress = (globalProgress - start) / (end - start);

      // 2. Interpolate
      const opacity = initialOpacity + (targetOpacity - initialOpacity) * localProgress;
      const currentY = translateY * (1 - localProgress); // e.g. start at 50, end at 0

      // 3. Apply styles directly
      ref.current.style.opacity = opacity.toFixed(3);
      ref.current.style.transform = `translateY(${currentY}px)`;
    });

    return unsubscribe;
  }, [subscribe, start, end, initialOpacity, targetOpacity, translateY]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{
        opacity: initialOpacity, 
        transform: `translateY(${translateY}px)`,
        transition: 'none', // Critical: no CSS transition fighting JS
        willChange: 'opacity, transform',
        ...style
      }}
    >
      {children}
    </div>
  );
}
