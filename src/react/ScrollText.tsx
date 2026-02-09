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

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // If reduced motion is preferred, disable translation (keep opacity fade)
      const effectiveTranslateY = prefersReducedMotion ? 0 : translateY;

      let opacity = initialOpacity;
      let currentY = effectiveTranslateY;

      // 1. Entrance Phase
      if (globalProgress < start) {
         opacity = initialOpacity;
         currentY = effectiveTranslateY;
      } else if (globalProgress >= start && globalProgress <= end) {
         const local = (globalProgress - start) / (end - start);
         opacity = initialOpacity + (targetOpacity - initialOpacity) * local;
         currentY = effectiveTranslateY * (1 - local);
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
         // Move from 0 -> -translateY (or 0 if reduced motion)
         currentY = -effectiveTranslateY * local; 
      }
      // 4. Final Phase
      else {
         opacity = finalOpacity;
         currentY = -effectiveTranslateY;
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
