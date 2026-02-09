# React Scroll Media 🎬

> **Production-ready, cinematic scroll sequences for React.**  
> Zero scroll-jacking. Pure sticky positioning. 60fps performance.

`react-scroll-media` is a lightweight library for creating Apple-style "scrollytelling" image sequences. It maps scroll progress to image frames deterministically, using standard CSS sticky positioning for a native, jank-free feel.

## ✨ Features

-   **🚀 Native Performance**:
    -   Uses `requestAnimationFrame` for buttery smooth 60fps rendering.
    -   **No Scroll Jacking**: We never hijack the scrollbar. It works with native scrolling.
    -   **CSS Sticky**: Uses relatively positioned containers with sticky inner content.
-   **🖼️ Flexible Loading**:
    -   **Manual**: Pass an array of image URLs.
    -   **Pattern**: Generate sequences like `/img_{index}.jpg`.
    -   **Manifest**: Load sequences from a JSON manifest.
-   **🧠 Smart Memory Management**:
    -   **Lazy Mode**: Keeps only ±3 frames in memory for huge sequences (800+ frames).
    -   **Eager Mode**: Preloads everything for maximum smoothness on smaller sequences.
    -   **Decoding**: Uses `img.decode()` to prevent main-thread jank during painting.
-   **🛠️ Developer Experience**:
    -   **Debug Overlay**: Visualize progress and frame index in real-time.
    -   **Hooks**: Exported `useScrollSequence` for custom UI implementations.
    -   **TypeScript**: First-class type definitions.
    -   **SSR Safe**: Works perfectly with Next.js / Remix / Gatsby.
    -   **A11y**: Built-in support for `prefers-reduced-motion` and ARIA attributes.
    -   **Robust**: Error boundaries and callbacks for image load failures.

## 🤔 When to use this vs Video?

Feature

Video (`<video>`)

Scroll Sequence (`react-scroll-media`)

**Quality**

Compressed (artifacts)

Lossless / Exact Frames (CRISP)

**Transparency**

Difficult (needs webm/hevc)

Native PNG/WebP Transparency (Easy)

**Scrubbing**

Janky (keyframe dependency)

1:1 Instant Scrubbing

**Mobile**

Auto-play often blocked

Works everywhere

**File Size**

Small

Large (requires optimization/lazy loading)

Use **Scroll Sequence** when you need perfect interaction, transparency, or crystal-clear product visuals (like Apple). Use **Video** for long, non-interactive backgrounds.

---

## 📦 Installation

```bash
npm install react-scroll-media# oryarn add react-scroll-media
```

---

## 🚀 Usage

### Basic Example

The simplest way to use it is with the `ScrollSequence` component.

```tsx
import { ScrollSequence } from 'react-scroll-media';const frames = [  '/images/frame_01.jpg',  '/images/frame_02.jpg',  // ...];export default function MyPage() {  return (    <div style={{ height: '200vh' }}>      <h1>Scroll Down</h1>            <ScrollSequence        source={{ type: 'manual', frames }}        scrollLength="300vh" // Determines how long the sequence plays      />            <h1>Continue Scrolling</h1>    </div>  );}
```

### ✨ Scrollytelling & Composition

You can nest components inside `ScrollSequence`. They will be placed in the sticky container and can react to the timeline.

#### Animated Text (`ScrollText`)

Animate opacity and position based on scroll progress (0 to 1). Supports enter and exit phases.

```tsx
import { ScrollSequence, ScrollText } from 'react-scroll-media';<ScrollSequence source={...} scrollLength="400vh">    {/* Fade In (0.1-0.2) -> Hold -> Fade Out (0.8-0.9) */}  <ScrollText     start={0.1}     end={0.2}     exitStart={0.8}    exitEnd={0.9}    translateY={50}     className="my-text-overlay"  >    Cinematic Experience  </ScrollText></ScrollSequence>
```

#### Word Reveal (`ScrollWordReveal`)

Reveals text word-by-word as you scroll.

```tsx
import { ScrollWordReveal } from 'react-scroll-media';<ScrollWordReveal     text="Experience the smooth cinematic scroll."    start={0.4}    end={0.6}    style={{ fontSize: '2rem', color: 'white' }}/>
```

### Advanced: Custom Hooks

For full control over the specialized UI, use the headless hooks.

#### `useScrollSequence`

Manages the canvas image controller.

```tsx
import { useScrollSequence } from 'react-scroll-media';const CustomScroller = () => {    // ... setup refs    const { containerRef, canvasRef, isLoaded } = useScrollSequence({ ... });    // ... render custom structure};
```

#### `useScrollTimeline`

Subscribe to the scroll timeline in any component.

```tsx
import { useScrollTimeline } from 'react-scroll-media';const MyComponent = () => {  const { subscribe } = useScrollTimeline();  // Subscribe to progress (0-1)  useEffect(() => subscribe((progress) => {      console.log('Progress:', progress);  }), [subscribe]);  return <div>...</div>;};
```

---

## ⚙️ Configuration

### `ScrollSequence` Props

Prop

Type

Default

Description

`source`

`SequenceSource`

**Required**

Defines where images come from.

`scrollLength`

`string`

`"300vh"`

Height of the container (animation duration).

`memoryStrategy`

`"eager" | "lazy"`

`"eager"`

Optimization strategy.

`lazyBuffer`

`number`

`10`

Number of frames to keep loaded in lazy mode.

`fallback`

`ReactNode`

`null`

Loading state component.

`accessibilityLabel`

`string`

`"Scroll sequence"`

ARIA label for the canvas.

`debug`

`boolean`

`false`

Shows debug overlay.

`onError`

`(error: Error) => void`

`undefined`

Callback fired when an image fails to load or initialization errors occur.

## 📊 Performance & compatibility

### Bundle Size

-   **Minified**: ~22.0 kB
-   **Gzipped**: ~6.08 kB
-   Zero dependencies (uses native Canvas API, no heavyweight libraries).

### Browser Support

Browser

Status

Note

Chrome

✅

Full support (OffscreenCanvas enabled)

Firefox

✅

Full support

Safari

✅

Full support (Desktop & Mobile)

Edge

✅

Full support

IE11

❌

Not supported (Missing ES6/Canvas features)

### Accessibility (A11y)

-   **Keyboard Navigation**: Users can scrub through the sequence using standard keyboard controls (Arrow Keys, Spacebar, Page Up/Down) because it relies on native scrolling.
-   **Screen Readers**: Add `accessibilityLabel` to `ScrollSequence` to provide a description for the canvas. Canvas has `role="img"`.
-   **Reduced Motion**: Automatically detects `prefers-reduced-motion: reduce`. If enabled, `ScrollSequence` will disable the scroll animation and display the `fallback` content (if provided) or simply freeze the first frame to prevent motion sickness.

### Memory Usage (Benchmarks)

Tested on 1080p frames.

Frames

Strategy

Memory

Recommendation

100

`eager`

~50MB

Instant seeking, smooth.

500

`eager`

~250MB

High RAM usage.

500+

`lazy`

~20MB

**Recommended**. Kept flat constant.

### Error Handling & Fallbacks

Network errors are handled gracefully. You can provide a fallback UI that displays while images are loading or if they fail.

```tsx
<ScrollSequence  source={{ type: 'manifest', url: '/bad_url.json' }}  fallback={<div className="error">Failed to load sequence</div>}/>
```

---

## 🏗️ Architecture

### `SequenceSource` Options

**1. Manual Mode** (Pass array directly)

```ts
{  type: 'manual',  frames: ['/img/1.jpg', '/img/2.jpg']}
```

**2. Pattern Mode** (Generate URLs)

```ts
{  type: 'pattern',  url: '/assets/sequence_{index}.jpg', // {index} is replaced  start: 1, // Start index  end: 100, // End index  pad: 4    // Zero padding (e.g. 1 -> 0001)}
```

**3. Manifest Mode** (Fetch JSON)

```ts
{  type: 'manifest',  url: '/sequence.json' }// JSON format: { "frames": ["url1", "url2"] } OR pattern config
```

---

## 🏗️ Architecture

### How it Works (The "Sticky" Technique)

Unlike libraries that use `position: fixed` or JS-based scroll locking (which breaks refreshing and feels unnatural), we use **CSS Sticky Positioning**.

1.  **Container (`relative`)**: This element has the height you specify (e.g., `300vh`). It occupies space in the document flow.
2.  **Sticky Wrapper (`sticky`)**: Inside the container, we place a `div` that is `100vh` tall and `sticky` at `top: 0`.
3.  **Canvas**: The `<canvas>` sits inside the sticky wrapper.
4.  **Math**: As you scroll the container, the sticky wrapper stays pinned to the viewport. We calculate:
    
    ```ts
    progress = -containerRect.top / (containerHeight - viewportHeight)
    ```
    
    This gives a precise 0.0 to 1.0 value tied to the pixel position of the scrollbar.

### Memory Strategy

-   **"eager" (Default)**: Best for sequences < 200 frames. Preloads all images into `HTMLImageElement` instances. Instant seeking, smooth playback. High memory usage.
-   **"lazy"**: Best for long sequences (500+ frames). Only keeps the current frame and its neighbors in memory. Saves RAM, prevents crashes.
    -   Buffer size defaults to ±10 frames but can be customized via `lazyBuffer`.

---

## 🐛 Debugging

Enable the debug overlay to inspect your sequence in production:

```tsx
<ScrollSequence   source={...}   debug={true} />
```

**Output:**

```
Progress: 0.45Frame: 45 / 100
```

This overlay is updated directly via DOM manipulation (bypassing React renders) for zero overhead.

---

MIT © 2026 Thanniru Sai Teja