# React Scroll Media 🎬

> **Production-ready, cinematic scroll sequences for React.**  
> Zero scroll-jacking. Pure sticky positioning. 60fps performance.

`react-scroll-media` is a lightweight library for creating Apple-style "scrollytelling" image sequences. It maps scroll progress to image frames deterministically, using standard CSS sticky positioning for a native, jank-free feel.

## ✨ Features

- **🚀 Native Performance**: 
  - Uses `requestAnimationFrame` for buttery smooth 60fps rendering.
  - **No Scroll Jacking**: We never hijack the scrollbar. It works with native scrolling.
  - **CSS Sticky**: Uses relatively positioned containers with sticky inner content.
- **🖼️ Flexible Loading**:
  - **Manual**: Pass an array of image URLs.
  - **Pattern**: Generate sequences like `/img_{index}.jpg`.
  - **Manifest**: Load sequences from a JSON manifest.
- **🧠 Smart Memory Management**:
  - **Lazy Mode**: Keeps only ±3 frames in memory for huge sequences (800+ frames).
  - **Eager Mode**: Preloads everything for maximum smoothness on smaller sequences.
  - **Decoding**: Uses `img.decode()` to prevent main-thread jank during painting.
- **🛠️ Developer Experience**:
  - **Debug Overlay**: Visualize progress and frame index in real-time.
  - **Hooks**: Exported `useScrollSequence` for custom UI implementations.
  - **TypeScript**: First-class type definitions.
  - **SSR Safe**: Works perfectly with Next.js / Remix.

---

## 📦 Installation

```bash
npm install react-scroll-media
# or
yarn add react-scroll-media
```

---

## 🚀 Usage

### Basic Example

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

### Advanced: Custom Hook (`useScrollSequence`)

For full control over the specialized UI, use the headless hook.

```tsx
import { useScrollSequence } from 'react-scroll-media';

const CustomScroller = () => {
    const debugRef = useRef<HTMLDivElement>(null);
    
    const { containerRef, canvasRef, isLoaded } = useScrollSequence({
        source: { type: 'pattern', url: '/img_{index}.jpg', start: 1, end: 100 },
        memoryStrategy: 'lazy',
        debugRef
    });

    return (
        <div ref={containerRef} style={{ height: '400vh', position: 'relative' }}>
            <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                <div ref={debugRef} style={{ position: 'absolute', top: 10 }}></div>
            </div>
        </div>
    );
};
```

---

## ⚙️ Configuration

### `ScrollSequence` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `SequenceSource` | **Required** | Defines where images come from (see below). |
| `scrollLength` | `string` | `"300vh"` | CSS height of the track. Taller = slower playback. |
| `memoryStrategy` | `"eager" \| "lazy"` | `"eager"` | "eager" preloads all. "lazy" loads ±3 frames on demand. |
| `debug` | `boolean` | `false` | Shows a live debug overlay (Progress/Frame). |
| `className` | `string` | `""` | Class for the outer container. |

### `SequenceSource` Options

**1. Manual Mode** (Pass array directly)
```ts
{
  type: 'manual',
  frames: ['/img/1.jpg', '/img/2.jpg']
}
```

**2. Pattern Mode** (Generate URLs)
```ts
{
  type: 'pattern',
  url: '/assets/sequence_{index}.jpg', // {index} is replaced
  start: 1, // Start index
  end: 100, // End index
  pad: 4    // Zero padding (e.g. 1 -> 0001)
}
```

**3. Manifest Mode** (Fetch JSON)
```ts
{
  type: 'manifest',
  url: '/sequence.json' 
}
// JSON format: { "frames": ["url1", "url2"] } OR pattern config
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
-   **"lazy"**: Best for long sequences (500+ frames). Only keeps the current frame and its neighbors (±3) in memory. Aggressively garbage collects others. Prevents browser crashes.

---

## 🐛 Debugging

Enable the debug overlay to inspect your sequence in production:

```tsx
<ScrollSequence 
  source={...} 
  debug={true} 
/>
```
**Output:**
```
Progress: 0.45
Frame: 45 / 100
```
This overlay is updated directly via DOM manipulation (bypassing React renders) for zero overhead.

---

## 📄 License

MIT © 2024
