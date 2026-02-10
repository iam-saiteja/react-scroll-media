<div align="center">

# 🎬 React Scroll Media

**Production-ready, cinematic scroll sequences for React.**

[![npm version](https://img.shields.io/npm/v/react-scroll-media.svg)](https://www.npmjs.com/package/react-scroll-media)
[![npm downloads](https://img.shields.io/npm/dm/react-scroll-media.svg)](https://www.npmjs.com/package/react-scroll-media)
[![package size](https://packagephobia.com/badge?p=react-scroll-media)](https://packagephobia.com/result?p=react-scroll-media)
[![license](https://img.shields.io/npm/l/react-scroll-media.svg)](https://github.com/yourusername/react-scroll-media/blob/main/LICENSE)

*Zero scroll-jacking • Pure sticky positioning • 60fps performance*

[Installation](#-installation) • [Usage](#-usage) • [API](#%EF%B8%8F-configuration) • [Examples](#-usage)

</div>

---

## 🌟 Overview

`react-scroll-media` is a lightweight library for creating Apple-style "scrollytelling" image sequences. It maps scroll progress to image frames deterministically, using standard CSS sticky positioning for a native, jank-free feel.

<br />

<div align="center">
  <img src="https://github.com/iam-saiteja/react-scroll-media/blob/master/demo.gif?raw=true" alt="React Scroll Media Demo" width="600" />
  <p><em><strong>Above:</strong> A 60fps scroll-driven sequence. The animation frame is tied 1:1 to the scroll position, allowing for instant scrubbing and pausing at any angle.</em></p>
</div>

<br />

## ✨ Features

### 🚀 **Native Performance**
- Uses `requestAnimationFrame` for buttery smooth 60fps rendering
- **No Scroll Jacking** — We never hijack the scrollbar. It works with native scrolling
- **CSS Sticky** — Uses relatively positioned containers with sticky inner content

### 🖼️ **Flexible Loading**
- **Manual** — Pass an array of image URLs
- **Pattern** — Generate sequences like `/img_{index}.jpg`
- **Manifest** — Load sequences from a JSON manifest

### 🧠 **Smart Memory Management**
- **Lazy Mode** — Keeps only ±3 frames in memory for huge sequences (800+ frames)
- **Eager Mode** — Preloads everything for maximum smoothness on smaller sequences
- **Decoding** — Uses `img.decode()` to prevent main-thread jank during painting

### 🛠️ **Developer Experience**
- **Debug Overlay** — Visualize progress and frame index in real-time
- **Hooks** — Exported `useScrollSequence` for custom UI implementations
- **TypeScript** — First-class type definitions
- **SSR Safe** — Works perfectly with Next.js / Remix / Gatsby
- **A11y** — Built-in support for `prefers-reduced-motion` and ARIA attributes
- **Robust** — Error boundaries and callbacks for image load failures

<br />

---

## 🤔 When to Use This vs Video?

<table>
<thead>
<tr>
<th>Feature</th>
<th>Video (<code>&lt;video&gt;</code>)</th>
<th>Scroll Sequence (<code>react-scroll-media</code>)</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Quality</strong></td>
<td>Compressed (artifacts)</td>
<td>✨ Lossless / Exact Frames (CRISP)</td>
</tr>
<tr>
<td><strong>Transparency</strong></td>
<td>Difficult (needs webm/hevc)</td>
<td>✨ Native PNG/WebP Transparency (Easy)</td>
</tr>
<tr>
<td><strong>Scrubbing</strong></td>
<td>Janky (keyframe dependency)</td>
<td>✨ 1:1 Instant Scrubbing</td>
</tr>
<tr>
<td><strong>Mobile</strong></td>
<td>Auto-play often blocked</td>
<td>✨ Works everywhere</td>
</tr>
<tr>
<td><strong>File Size</strong></td>
<td>✨ Small</td>
<td>Large (requires optimization/lazy loading)</td>
</tr>
</tbody>
</table>

**💡 Use Scroll Sequence** when you need perfect interaction, transparency, or crystal-clear product visuals (like Apple).

**💡 Use Video** for long, non-interactive backgrounds.

<br />

---

## 📦 Installation

```bash
npm install react-scroll-media
```

**or**

```bash
yarn add react-scroll-media
```

<br />

---

## 🚀 Usage

### 🎯 Basic Example

The simplest way to use it is with the `ScrollSequence` component.

```tsx
import { ScrollSequence } from 'react-scroll-media';

const frames = [
  '/images/frame_01.jpg',
  '/images/frame_02.jpg',
  // ...
];

export default function MyPage() {
  return (
    <div style={{ height: '200vh' }}>
      <h1>Scroll Down</h1>
      
      <ScrollSequence
        source={{ type: 'manual', frames }}
        scrollLength="300vh" // Determines how long the sequence plays
      />
      
      <h1>Continue Scrolling</h1>
    </div>
  );
}
```

<br />

### ✨ Scrollytelling & Composition

You can nest components inside `ScrollSequence`. They will be placed in the sticky container and can react to the timeline.

<br />

#### 📝 Animated Text (`ScrollText`)

Animate opacity and position based on scroll progress (0 to 1). Supports enter and exit phases.

```tsx
import { ScrollSequence, ScrollText } from 'react-scroll-media';

<ScrollSequence source={...} scrollLength="400vh">
  
  {/* Fade In (0.1-0.2) -> Hold -> Fade Out (0.8-0.9) */}
  <ScrollText 
    start={0.1} 
    end={0.2} 
    exitStart={0.8}
    exitEnd={0.9}
    translateY={50} 
    className="my-text-overlay"
  >
    Cinematic Experience
  </ScrollText>

</ScrollSequence>
```

<br />

#### 💬 Word Reveal (`ScrollWordReveal`)

Reveals text word-by-word as you scroll.

```tsx
import { ScrollWordReveal } from 'react-scroll-media';

<ScrollWordReveal 
  text="Experience the smooth cinematic scroll."
  start={0.4}
  end={0.6}
  style={{ fontSize: '2rem', color: 'white' }}
/>
```

<br />

### 🔧 Advanced: Custom Hooks

For full control over the specialized UI, use the headless hooks.

<br />

#### `useScrollSequence`

Manages the canvas image controller.

```tsx
import { useScrollSequence } from 'react-scroll-media';

const CustomScroller = () => {
  // ... setup refs
  const { containerRef, canvasRef, isLoaded } = useScrollSequence({ ... });
  // ... render custom structure
};
```

<br />

#### `useScrollTimeline`

Subscribe to the scroll timeline in any component.

```tsx
import { useScrollTimeline } from 'react-scroll-media';

const MyComponent = () => {
  const { subscribe } = useScrollTimeline();

  // Subscribe to progress (0-1)
  useEffect(() => subscribe((progress) => {
    console.log('Progress:', progress);
  }), [subscribe]);

  return <div>...</div>;
};
```

<br />

---

## ⚙️ Configuration

### `ScrollSequence` Props

<table>
<thead>
<tr>
<th>Prop</th>
<th>Type</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>source</code></td>
<td><code>SequenceSource</code></td>
<td><strong>Required</strong></td>
<td>Defines where images come from.</td>
</tr>
<tr>
<td><code>scrollLength</code></td>
<td><code>string</code></td>
<td><code>"300vh"</code></td>
<td>Height of the container (animation duration).</td>
</tr>
<tr>
<td><code>memoryStrategy</code></td>
<td><code>"eager" | "lazy"</code></td>
<td><code>"eager"</code></td>
<td>Optimization strategy.</td>
</tr>
<tr>
<td><code>lazyBuffer</code></td>
<td><code>number</code></td>
<td><code>10</code></td>
<td>Number of frames to keep loaded in lazy mode.</td>
</tr>
<tr>
<td><code>fallback</code></td>
<td><code>ReactNode</code></td>
<td><code>null</code></td>
<td>Loading state component.</td>
</tr>
<tr>
<td><code>accessibilityLabel</code></td>
<td><code>string</code></td>
<td><code>"Scroll sequence"</code></td>
<td>ARIA label for the canvas. Example: <code>"360 degree view of the product"</code>.</td>
</tr>
<tr>
<td><code>debug</code></td>
<td><code>boolean</code></td>
<td><code>false</code></td>
<td>Shows debug overlay.</td>
</tr>
<tr>
<td><code>onError</code></td>
<td><code>(error: Error) => void</code></td>
<td><code>undefined</code></td>
<td>Callback fired when an image fails to load or initialization errors occur.</td>
</tr>
</tbody>
</table>

<br />

---

## 📊 Performance & Compatibility

### 📦 Bundle Size

| Metric | Size |
|--------|------|
| **Minified** | ~22.0 kB |
| **Gzipped** | ~6.08 kB |

✨ **Zero dependencies** — Uses native Canvas API, no heavyweight libraries.

<br />

### 🌐 Browser Support

<table>
<thead>
<tr>
<th>Browser</th>
<th>Status</th>
<th>Note</th>
</tr>
</thead>
<tbody>
<tr>
<td>Chrome</td>
<td>✅</td>
<td>Full support (OffscreenCanvas enabled)</td>
</tr>
<tr>
<td>Firefox</td>
<td>✅</td>
<td>Full support</td>
</tr>
<tr>
<td>Safari</td>
<td>✅</td>
<td>Full support (Desktop & Mobile)</td>
</tr>
<tr>
<td>Edge</td>
<td>✅</td>
<td>Full support</td>
</tr>
<tr>
<td>IE11</td>
<td>❌</td>
<td>Not supported (Missing ES6/Canvas features)</td>
</tr>
</tbody>
</table>

<br />

### ♿ Accessibility (A11y)

- **🎹 Keyboard Navigation** — Users can scrub through the sequence using standard keyboard controls (Arrow Keys, Spacebar, Page Up/Down) because it relies on native scrolling.

- **🔊 Screen Readers** — Add `accessibilityLabel` to `ScrollSequence` to provide a description for the canvas. Canvas has `role="img"`.

- **🎭 Reduced Motion** — Automatically detects `prefers-reduced-motion: reduce`. If enabled, `ScrollSequence` will disable the scroll animation and display the `fallback` content (if provided) or simply freeze the first frame to prevent motion sickness.

<br />

### 💾 Memory Usage (Benchmarks)

*Tested on 1080p frames.*

<table>
<thead>
<tr>
<th>Frames</th>
<th>Strategy</th>
<th>Memory</th>
<th>Recommendation</th>
</tr>
</thead>
<tbody>
<tr>
<td>100</td>
<td><code>eager</code></td>
<td>30MB</td>
<td>Instant seeking, smooth.</td>
</tr>
<tr>
<td>500</td>
<td><code>eager</code></td>
<td>46MB</td>
<td>High RAM usage.</td>
</tr>
<tr>
<td>1000</td>
<td><code>eager</code></td>
<td>57MB</td>
<td>Very high RAM usage.</td>
</tr>
<tr>
<td>100</td>
<td><code>lazy</code></td>
<td>25MB</td>
<td>Low memory usage.</td>
</tr>
<tr>
<td>500</td>
<td><code>lazy</code></td>
<td>30MB</td>
<td>Low memory usage.</td>
</tr>
<tr>
<td>1000</td>
<td><code>lazy</code></td>
<td>45MB</td>
<td><strong>⭐ Recommended</strong>. Kept flat constant.</td>
</tr>
</tbody>
</table>

<br />

### 🛡️ Error Handling & Fallbacks

Network errors are handled gracefully. You can provide a fallback UI that displays while images are loading or if they fail.

```tsx
<ScrollSequence
  source={{ type: 'manifest', url: '/bad_url.json' }}
  fallback={<div className="error">Failed to load sequence</div>}
  onError={(e) => console.error("Sequence error:", e)}
/>
```

<br />

### 🚨 Error Boundaries

For robust production apps, wrap `ScrollSequence` in an Error Boundary to catch unexpected crashes:

```tsx
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode, children: React.ReactNode }, 
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <ScrollSequence source={...} /> 
</ErrorBoundary>
```

<br />

### 🔄 Multi-Instance & Nested Scroll

`react-scroll-media` automatically handles multiple instances on the same page. Each instance:

1. Registers with a shared `RAF` loop (singleton) for optimal performance.
2. Calculates its own progress independently.
3. Should have a unique `scrollLength` or container setup.

<br />

---

## 🏗️ Architecture

### 📂 `SequenceSource` Options

<br />

#### **1. Manual Mode** (Pass array directly)

```ts
{
  type: 'manual',
  frames: ['/img/1.jpg', '/img/2.jpg']
}
```

<br />

#### **2. Pattern Mode** (Generate URLs)

```ts
{
  type: 'pattern',
  url: '/assets/sequence_{index}.jpg', // {index} is replaced
  start: 1,    // Start index
  end: 100,    // End index
  pad: 4       // Zero padding (e.g. 1 -> 0001)
}
```

<br />

#### **3. Manifest Mode** (Fetch JSON)

```ts
{
  type: 'manifest',
  url: '/sequence.json' 
}

// JSON format: { "frames": ["url1", "url2"] } OR pattern config
```

> **💡 Note**: Manifests are cached in memory by URL. To force a refresh, append a query param (e.g. `?v=2`).

<br />

---

## 🎨 How it Works (The "Sticky" Technique)

Unlike libraries that use `position: fixed` or JS-based scroll locking (which breaks refreshing and feels unnatural), we use **CSS Sticky Positioning**.

<br />

<div align="center">
  <img src="https://github.com/iam-saiteja/react-scroll-media/blob/master/demo-213.gif?raw=true" alt="React Scroll Media Technical Demo" width="600" />
  <p><em><strong>Technical Demo:</strong> This visualization shows the direct correlation between the scrollbar position and the rendered frame. The component calculates the exact frame index based on the percentage of the container scrolled, ensuring perfect synchronization without "scroll jacking".</em></p>
</div>

<br />

### 🔧 Technical Breakdown

1. **Container (`relative`)** — This element has the height you specify (e.g., `300vh`). It occupies space in the document flow.

2. **Sticky Wrapper (`sticky`)** — Inside the container, we place a `div` that is `100vh` tall and `sticky` at `top: 0`.

3. **Canvas** — The `<canvas>` sits inside the sticky wrapper.

4. **Math** — As you scroll the container, the sticky wrapper stays pinned to the viewport. We calculate:

```ts
progress = -containerRect.top / (containerHeight - viewportHeight)
```

This gives a precise **0.0 to 1.0** value tied to the pixel position of the scrollbar. This value is then mapped to the corresponding frame index:

```ts
frameIndex = Math.floor(progress * (totalFrames - 1))
```

This approach ensures:
*   **Zero Jitter**: The canvas position is handled by the browser's compositor thread (CSS Sticky).
*   **Native Feel**: Momentum scrolling works perfectly on touchpads and mobile.
*   **Exact Sync**: The frame updates are synchronized with the scroll position in a `requestAnimationFrame` loop.

<br />

### 💡 Memory Strategy

- **"eager" (Default)** — Best for sequences < 200 frames. Preloads all images into `HTMLImageElement` instances. Instant seeking, smooth playback. High memory usage.

- **"lazy"** — Best for long sequences (500+ frames). Only keeps the current frame and its neighbors in memory. Saves RAM, prevents crashes.
  - Buffer size defaults to ±10 frames but can be customized via `lazyBuffer`.

<br />

---

## 🐛 Debugging

Enable the debug overlay to inspect your sequence in production:

```tsx
<ScrollSequence 
  source={...} 
  debug={true} 
/>
```

<br />

**Output:**

```
Progress: 0.45
Frame: 45 / 100
```

This overlay is updated directly via DOM manipulation (bypassing React renders) for **zero overhead**.

<br />

---

<div align="center">

## 📄 License

**MIT** © 2026 **Thanniru Sai Teja**

<br />

Made with ❤️ for the React community

[⬆ Back to Top](#-react-scroll-media)

</div>