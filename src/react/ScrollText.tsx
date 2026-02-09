import React, { useRef, useEffect } from 'react';
import { useScrollTimeline } from './useScrollTimeline';

export interface ScrollTextProps {
  children: React.ReactNode;
  /** Progress start (0-1) where ENTRANCE animation begins */
  start?: number;
  /** Progress end (0-1) where ENTRANCE animation ends */
  end?: number;
  
  /** Progress start (0-1) where EXIT animation begins. If omitted, element stays visible. */
  exitStart?: number;
  /** Progress end (0-1) where EXIT animation ends */
  exitEnd?: number;

  /** Initial opacity */
  initialOpacity?: number;
  /** Target opacity (when entered) */
  targetOpacity?: number;
  /** Final opacity (after exit) */
  finalOpacity?: number;

  /** Y-axis translation range in pixels (e.g., 50 means move down 50px) */
  translateY?: number;
  
  style?: React.CSSProperties;
  className?: string;
}

export function ScrollText({
  children,
  start = 0,
  end = 0.2,
  exitStart,
  exitEnd,
  initialOpacity = 0,
  targetOpacity = 1,
  finalOpacity = 0,
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

      let opacity = initialOpacity;
      let currentY = translateY;

      // 1. Entrance Phase
      if (globalProgress < start) {
         opacity = initialOpacity;
         currentY = translateY;
      } else if (globalProgress >= start && globalProgress <= end) {
         const local = (globalProgress - start) / (end - start);
         opacity = initialOpacity + (targetOpacity - initialOpacity) * local;
         currentY = translateY * (1 - local);
      } 
      // 2. Hold Phase
      else if (!exitStart || globalProgress < exitStart) {
         opacity = targetOpacity;
         currentY = 0;
      }
      // 3. Exit Phase
      else if (exitStart && exitEnd && globalProgress >= exitStart && globalProgress <= exitEnd) {
         const local = (globalProgress - exitStart) / (exitEnd - exitStart);
         opacity = targetOpacity + (finalOpacity - targetOpacity) * local;
         // Optional: move up on exit? Or just stay? 
         // Let's move UP by translateY (negative) for symmetry, or 0? 
         // User didn't specify, but "going out" usually implies movement.
         // Let's implement symmetry: Moves from translateY -> 0 during enter.
         // Moves from 0 -> -translateY during exit?
         currentY = -translateY * local; 
      }
      // 4. Final Phase
      else {
         opacity = finalOpacity;
         currentY = -translateY;
      }

      // Apply styles
      ref.current.style.opacity = opacity.toFixed(3);
      ref.current.style.transform = `translateY(${currentY}px)`;
    });

    return unsubscribe;
  }, [subscribe, start, end, exitStart, exitEnd, initialOpacity, targetOpacity, finalOpacity, translateY]);

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
