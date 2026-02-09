import { ScrollTimeline, TimelineCallback } from '../core/scrollTimeline';
import { useTimelineContext } from './scrollTimelineContext';

export interface UseScrollTimelineResult {
  /** 
   * Manual subscription to the timeline. 
   * Useful for low-level DOM updates (refs) without re-rendering.
   */
  subscribe: (callback: TimelineCallback) => () => void;
  
  /** The raw timeline instance (for advanced usage) */
  timeline: ScrollTimeline | null; 
}

export function useScrollTimeline(): UseScrollTimelineResult {
  const { timeline } = useTimelineContext();

  const subscribe = (callback: TimelineCallback) => {
    if (!timeline) return () => {};
    return timeline.subscribe(callback);
  };

  return { subscribe, timeline };
}
