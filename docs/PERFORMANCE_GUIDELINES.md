# Performance & Rendering Guidelines

To ensure ORNAS maintains its premium, native-feeling desktop experience, all contributors must adhere to the following performance and rendering guidelines. These rules have been established after rigorous optimization passes to prevent regressions in text rendering stability and UI responsiveness.

## 1. Text Rendering & Stability

*   **Never position text on fractional pixels:** Fractional positioning forces the browser compositor to interpolate subpixels, causing text to appear blurry. Always use `Math.round()` on calculated offsets (e.g., when virtualizing list rows).
*   **Avoid transforms on text-heavy containers:** Applying `transform`, `translate`, `scale`, or `will-change` to containers containing dense text forces them into their own GPU composite layers. This often disrupts native subpixel anti-aliasing (ClearType/CoreGraphics) and can cause text to shimmer or shake during repaints.
*   **Rely on Native Font Rendering:** Do not use CSS properties like `-webkit-font-smoothing: antialiased` or `-moz-osx-font-smoothing: grayscale` on standard text. Allow the OS to render text naturally.

## 2. UI Animations & Hover States

*   **Prefer compositing-safe transitions:** For hover effects, rely on `transition-colors`, `background-color`, and `opacity`. Avoid animating layout-changing properties (`width`, `height`, `margin`, `padding`) which trigger expensive reflows.
*   **Profile before introducing new animations:** Before merging new CSS animations or Framer Motion transitions, verify that they do not introduce paint storms or jitter when running at 60+ FPS.

## 3. React Rendering & Virtualization

*   **Memoize expensive list items:** Large lists (like the Clipboard history) must use `React.memo` on individual row components.
*   **Keep virtualization integer-aligned:** When using `@tanstack/react-virtual` or similar libraries, ensure that the absolute positioning values (`translateY`) are strictly snapped to integers.
*   **Stable Prop References:** Ensure that callback functions (`useCallback`) passed to memoized list items do not capture volatile state variables (like selection state) in their closure, as this will break memoization and cause the entire list to re-render on selection changes. Use `store.getState()` instead of reactive hooks inside these callbacks where appropriate.

## 4. Verification

*   **Test at multiple DPI scales:** Always test rendering changes at 100%, 125%, 150%, and 200% display scaling to ensure fractional device pixel ratios do not reintroduce blur.
*   **Verify scrolling performance:** Scroll heavily populated lists rapidly to check for dropped frames or layout thrashing.
