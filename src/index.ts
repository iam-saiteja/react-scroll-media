/**
 * react-scroll-sequence
 * Production-ready scroll-driven image sequence rendering component
 */

// Public exports
export { ScrollSequence } from './react/ScrollSequence';

// Types
export type { ScrollSequenceProps, ResolvedSequence, ScrollProgress } from './types';

// Core utilities (advanced users)
export { ScrollEngine } from './core/scrollEngine';
export { clamp } from './core/clamp';

// Sequence utilities (advanced users)
export { sequenceResolver } from './sequence/sequenceResolver';

// Controllers (advanced users)
export { ImageController } from './controllers/imageController';
export type { ImageControllerConfig } from './controllers/imageController';
