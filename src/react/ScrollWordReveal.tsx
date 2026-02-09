import React, { useRef, useEffect } from 'react';
import { useScrollTimeline } from './useScrollTimeline';

export interface ScrollWordRevealProps {
    text: string;
    /** Progress start (0-1) */
    start?: number;
    /** Progress end (0-1) */
    end?: number;
    className?: string;
    style?: React.CSSProperties;
    /** Stagger delay factor (not used in pure scroll map, simpler logic: map word index to sub-progress) */
}

export function ScrollWordReveal({
    text,
    start = 0,
    end = 1,
    className,
    style
}: ScrollWordRevealProps) {
    // We cannot create refs in loop dynamically in top level easily without array.
    // Better to have one parent ref and querySelectorAll children, OR use callback refs.
    const containerRef = useRef<HTMLDivElement>(null);
    const { subscribe } = useScrollTimeline();

    // Split words
    const words = text.split(/\s+/);

    useEffect(() => {
        const unsubscribe = subscribe((globalProgress) => {
            if (!containerRef.current) return;
            const spans = containerRef.current.children;
            
            // Map global progress to local range [start, end]
            let localProgress = 0;
            if (globalProgress <= start) localProgress = 0;
            else if (globalProgress >= end) localProgress = 1;
            else localProgress = (globalProgress - start) / (end - start);

            // Calculate which word should be visible
            const totalWords = spans.length;
            const progressPerWord = 1 / totalWords;

            for (let i = 0; i < totalWords; i++) {
                 const span = spans[i] as HTMLElement;
                 
                 // Each word fades in during its "slot"
                 // Word 0: 0 -> 0.1
                 // Word 1: 0.1 -> 0.2
                 const wordStart = i * progressPerWord;
                 const wordEnd = (i + 1) * progressPerWord;
                 
                 let wordOpacity = 0;
                 if (localProgress >= wordEnd) {
                     wordOpacity = 1;
                 } else if (localProgress <= wordStart) {
                     wordOpacity = 0.1; // faint visibility initially? or 0
                 } else {
                     // Interpolate
                     wordOpacity = 0.1 + 0.9 * ((localProgress - wordStart) / (wordEnd - wordStart));
                 }
                 
                 span.style.opacity = wordOpacity.toFixed(2);
                 // Optional: translate Y too?
                 const translate = (1 - wordOpacity) * 10;
                 span.style.transform = `translateY(${translate}px)`;
            }
        });

        return unsubscribe;
    }, [subscribe, start, end]);

    return (
        <div ref={containerRef} className={className} style={{ ...style, display: 'flex', flexWrap: 'wrap', gap: '0.25em' }}>
            {words.map((word, i) => (
                <span 
                    key={i} 
                    style={{ 
                        opacity: 0.1, 
                        transform: 'translateY(10px)',
                        transition: 'none',
                        willChange: 'opacity, transform'
                    }}
                >
                    {word}
                </span>
            ))}
        </div>
    );
}
