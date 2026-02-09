/**
 * react-scroll-media
 * Production-ready scroll-driven image sequence rendering component
 */

// Public exports
// Public exports
export { ScrollSequence } from './react/ScrollSequence';
export { useScrollSequence } from './react/useScrollSequence';
export { ScrollTimelineProvider } from './react/ScrollTimelineProvider';
export { ScrollText } from './react/ScrollText';
export { ScrollWordReveal } from './react/ScrollWordReveal';
export { useScrollTimeline } from './react/useScrollTimeline';

// Types
export type { ScrollSequenceProps, ResolvedSequence, ScrollProgress } from './types';

// Core utilities (advanced users)
export { ScrollTimeline } from './core/scrollTimeline';
export { clamp } from './core/clamp';

// Sequence utilities (advanced users)
export { resolveSequence } from './sequence/sequenceResolver';

// Controllers (advanced users)
export { ImageController } from './controllers/imageController';
export type { ImageControllerConfig } from './controllers/imageController';
