import { createContext, useContext } from 'react';
import { ScrollTimeline } from '../core/scrollTimeline';

export interface ScrollTimelineContextValue {
  timeline: ScrollTimeline | null;
  // Expose current progress? No, that causes re-renders. Use subscription.
}

export const ScrollTimelineContext = createContext<ScrollTimelineContextValue>({
  timeline: null,
});

export function useTimelineContext() {
  return useContext(ScrollTimelineContext);
}
