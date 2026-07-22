# ORNAS — Brand Foundation

**Tagline:** Never Lose a Copy.

ORNAS is an open-source desktop clipboard manager built with Rust, Tauri, React, TypeScript, and SQLite. This document serves as the single source of truth for all brand identity, visual language, UI/UX, and marketing decisions.

---

## 1. Competitor Analysis & Brand Positioning

To establish a distinctive brand for ORNAS, we must analyze the visual language of leading developer and productivity tools.

### VS Code
- **Personality:** Utilitarian, highly technical, extensible.
- **Typography:** System UI fonts, Consolas/Menlo/Monaco for code.
- **Icon Philosophy:** Literal (infinity-like ribbon representing code flow). Flat, approachable.
- **Colors:** Deep blues, strict semantic highlighting.
- **Visual Hierarchy:** Dense, panel-driven, maximizes screen real estate for text.
- **Recognition Factor:** The bright blue ribbon icon and the ubiquitous dark-theme editor layout.

### Obsidian
- **Personality:** Knowledgeable, private, interconnected, slightly esoteric.
- **Typography:** Inter (default), highly customizable.
- **Icon Philosophy:** The purple crystal/obsidian stone. Represents multifaceted, durable knowledge.
- **Colors:** Deep purples and blacks.
- **Visual Hierarchy:** Document-first. Sidebars fade into the background.
- **Recognition Factor:** The distinct purple crystal icon and graph view.

### Docker Desktop
- **Personality:** Industrial, robust, infrastructure-focused.
- **Typography:** Proxima Nova / System fonts.
- **Icon Philosophy:** Moby Dock (the whale carrying containers). Playful yet represents heavy lifting.
- **Colors:** Signature Docker Blue (`#2496ED`).
- **Visual Hierarchy:** Clean dashboard, blocky components (representing containers).
- **Recognition Factor:** The iconic whale.

### Bitwarden
- **Personality:** Secure, open-source, no-nonsense.
- **Typography:** System fonts.
- **Icon Philosophy:** A shield with a keyhole. Extremely literal representation of security.
- **Colors:** Primary blue (`#175DDC`), clean white/gray backgrounds.
- **Visual Hierarchy:** List-heavy, high contrast for legibility.
- **Recognition Factor:** The blue shield. It feels safe but visually somewhat generic.

### Raycast
- **Personality:** Extremely fast, macOS-native, premium, keyboard-first.
- **Typography:** Inter / San Francisco.
- **Icon Philosophy:** Abstract, dynamic, radiating light/energy.
- **Colors:** Signature red/magenta gradients on deep macOS dark mode surfaces.
- **Visual Hierarchy:** Center-stage command palette. Everything else is obscured.
- **Recognition Factor:** The glowing red icon and the floating center-screen UI.

### Linear
- **Personality:** High-end, opinionated, exceptionally crafted, modern.
- **Typography:** Inter.
- **Icon Philosophy:** Abstract, sharp, directional (lines moving forward).
- **Colors:** Deep blacks, stark whites, subtle purple/indigo accents.
- **Visual Hierarchy:** Extreme minimalism. High use of negative space, 1px borders, subtle gradients.
- **Recognition Factor:** The dark mode UI with purplish glows and flawlessly smooth animations.

### Arc Browser
- **Personality:** Playful, personal, boundary-pushing.
- **Typography:** Custom sans-serifs, highly legible.
- **Icon Philosophy:** Transparent, dimensional, sweeping arcs.
- **Colors:** Pastel gradients, translucent materials (mica/acrylic).
- **Visual Hierarchy:** Sidebar-first, borderless web views.
- **Recognition Factor:** The transparent aesthetic and curved UI elements.

### Notion
- **Personality:** Minimalist, flexible, paper-like.
- **Typography:** Inter, standard serif options.
- **Icon Philosophy:** Black and white, sketch-like box with an 'N'.
- **Colors:** Monochromatic. Lots of white space, subtle gray borders.
- **Visual Hierarchy:** Canvas-first. Very low density UI chrome.
- **Recognition Factor:** The black-and-white sketch aesthetic and default emojis.

### What ORNAS Must Do Differently
Unlike Raycast (macOS only) or Linear (cloud-first), ORNAS is cross-platform, open-source, and entirely offline. ORNAS must blend the **premium, high-craft feel of Linear** with the **utilitarian trust of VS Code and Bitwarden**. 
- It must avoid looking like a generic "utility" (like standard Windows tools).
- It must avoid overly playful consumer branding (like Arc).
- ORNAS should feel like a **professional developer instrument**. It should be darker, more technical, utilizing crisp borders and subtle glows, emphasizing its identity as a fast, local, Rust-powered vault.

---

## 2. Defining ORNAS

### What is ORNAS?
ORNAS is a high-performance, offline-first, cross-platform clipboard manager. It acts as an infallible, infinite memory bank for everything a user copies, powered by a heavily optimized SQLite + Rust backend and a snappy React frontend.

### What problem does it solve?
The clipboard is a volatile, single-slot memory space. Users constantly overwrite valuable data (code snippets, API keys, URLs, text blocks) by copying something new. ORNAS solves the anxiety of data loss by automatically retaining, deduplicating, and indexing clipboard history, making it instantly searchable.

### Why should users choose it?
- **Speed:** Instant search and retrieval, zero latency.
- **Privacy:** 100% offline. No cloud sync, no accounts, no telemetry.
- **Power:** Advanced features like FTS5 search, pinned items, favorites, and syntax highlighting.
- **Craft:** A UI that feels like a premium, paid tool, despite being free and open-source.

### What emotions should users feel?
- **Relief & Trust:** "It’s okay if I overwrote my clipboard; ORNAS has it."
- **Empowerment:** "I can find a command I copied three weeks ago instantly."
- **Delight:** "This app feels incredibly fast and well-made."

### How should ORNAS look?
- Technical but accessible.
- Dense enough for power users, but uncluttered.
- Sleek, employing dark mode as a first-class citizen with stark contrast.
- Precise, with clear visual boundaries (1px borders, subtle drop shadows).

### How should ORNAS NOT look?
- Playful, cartoonish, or overly colorful.
- Bloated, messy, or overwhelming.
- Like a cheap, generic system tray utility.
- Cloud-dependent or SaaS-like.

### Brand Personality Adjectives
- **Technical**
- **Trustworthy**
- **Fast**
- **Native**
- **Minimal**
- **Premium**

---

## 3. Visual Philosophy

### Visual Language
The visual language is "Precision Engineering." Every pixel must serve a purpose. The interface should feel like a high-end physical tool—like a precise pair of calipers or a mechanical keyboard.

### Shape Language & Geometry
- Strict rectangles with carefully controlled, modest corner radii (e.g., 6px to 8px). 
- Avoid overly rounded pill-shapes unless denoting status (e.g., badges).
- Sharp, distinct lines.

### Negative Space & Balance
- Use negative space to separate functional areas (sidebar vs. preview) rather than heavy background colors.
- Dense lists for quick scanning, offset by generous padding in the preview pane.

### Proportions
- Golden ratio where applicable in layout splits (e.g., 1:1.6 for list vs. preview panels).
- Typography strictly follows a modular scale.

### Icon Philosophy
Icons must be utilitarian, constructed on a strict 24x24 grid with a consistent 1.5px or 2px stroke width. No filled icons unless denoting an active state (like a filled Star for favorites). They should feel crisp and readable at 16px.

### Typography Philosophy
Typography must be incredibly legible for long strings of code, URLs, and dense text. It should lean modern-geometric for UI elements and strictly monospaced for clipboard data.

### Color Philosophy
Monochromatic foundations (grays/blacks) with a single, highly deliberate accent color used sparingly to direct the eye. Semantic colors (red, green, yellow) are reserved exclusively for states (delete, success, favorite).

### Animation Philosophy
- **Fast:** Max 150ms duration.
- **Snappy:** Use spring physics or ease-out curves. No slow, lingering ease-in-out animations.
- **Purposeful:** Animations should only confirm user actions (e.g., an item snapping to the top when pinned, a modal scaling in slightly).

---

## 4. Icon Philosophy & Exploration

### Brainstorming 20 Concepts
1. A traditional clipboard with a digital grid.
2. An infinite loop (`∞`) made of paper clips.
3. A stack of paper layers glowing from beneath.
4. A vault door with a copy symbol (`⌘C`).
5. A timeline with distinct nodes representing past clips.
6. A stylized 'O' that looks like a magnetic tape reel.
7. Two overlapping squares (the universal copy icon) with a trailing motion blur.
8. A filing cabinet rendered in isometric minimalist lines.
9. A memory chip (RAM) with document lines on it.
10. A clock face where the hands form scissors and a paste brush.
11. A sleek hourglass where data flows downwards.
12. A chain of interlocking links forming an 'O'.
13. A geometric origami folded paper.
14. A minimalist ring (O) with a dot inside (focus/retention).
15. A clipboard with a rewind arrow symbol.
16. Overlapping glass panes.
17. A stylized fingerprint made of lines of code.
18. A radar screen scanning documents.
19. A simple, sharp chevron pulling data from a stack.
20. A geometric 'O' composed of cascading, repeating layers.

### Ranking the Top 5
1. **The Cascading 'O' (Concept 20):** Represents ORNAS, history, layers, and stacks simultaneously. Highly abstract and modern.
2. **The Infinite Copy (Concept 7):** Two overlapping squares with a trailing tail/echo. Visually implies "copying into the past/future".
3. **The Memory Ring (Concept 14):** A minimalist ring with a solid core. Represents a vault/retention perfectly, very clean.
4. **The Rewind Clipboard (Concept 15):** More literal, easy for mainstream users to understand, but perhaps a bit generic.
5. **The Digital Stack (Concept 3):** Glowing layers of paper. Great for conveying depth and history, but might look too much like a generic "database" icon.

### The Chosen Concept: The Cascading 'O'
**Concept:** A geometric letter 'O' constructed from three cascading, overlapping isometric layers that fade into the background.

**Why:**
- **Abstract & Premium:** It avoids the cliché of a literal clipboard, instantly elevating ORNAS above cheap utility apps. It aligns with the high-end branding of tools like Linear or Raycast.
- **Symbolic:** The cascading layers perfectly represent history, depth, retention, and the stack-like nature of a clipboard manager.
- **Brand Identity:** It forms an 'O' for ORNAS, creating a strong, recognizable brand mark.
- **Scalability:** The geometric simplicity ensures it looks sharp at 16x16px in a system tray, and stunning at 1024x1024px on a macOS dock.

---

## 5. Typography

All fonts chosen must be free, open-source (Google Fonts/OFL), and optimized for UI legibility.

- **Heading Font: `Outfit`**
  - *Why:* Outfit is a beautiful, modern geometric sans-serif. It has a slightly tech-forward, premium feel that works exceptionally well for application titles, modal headers, and empty states. It provides the "Linear-esque" high-craft aesthetic.
  
- **Body Font: `Inter`**
  - *Why:* Inter is the undisputed king of UI legibility. It handles dense data, lists, and small font sizes (12px-14px) perfectly. It is neutral, allowing the content to speak for itself.
  
- **Monospace Font: `JetBrains Mono`**
  - *Why:* Because ORNAS targets developers and engineers, a high-quality coding font is mandatory. JetBrains Mono is highly legible, has excellent character distinction (1 vs l vs I), and looks fantastic when rendering code snippets in the clipboard preview pane.

---

## 6. Color System

The color system is designed for a **Dark-Mode-First** premium application, with a high-contrast Light Mode counterpart. (Values below are optimized for the primary Dark theme).

| Token | Hex Value | Purpose & Reasoning |
| :--- | :--- | :--- |
| **Background** | `#09090B` | Deep, almost-black. Provides a stark, modern canvas (zinc-950). Reduces eye strain compared to pure `#000000`. |
| **Surface** | `#18181B` | Slightly lighter than background (zinc-900). Used for sidebars, cards, and list items to create subtle elevation. |
| **Border** | `#27272A` | Low-contrast border (zinc-800). Defines structure without shouting. |
| **Primary (Accent)** | `#6366F1` | Indigo. A technical, calm, and modern accent color. Used for active tabs, primary buttons, and focus states. It feels "developer-native" but premium. |
| **Secondary** | `#27272A` | Matches the border. Used for secondary buttons or badges that shouldn't distract from the primary action. |
| **Text Primary** | `#FAFAFA` | Off-white (zinc-50). Ensures maximum readability without the harshness of pure `#FFFFFF`. |
| **Text Secondary** | `#A1A1AA` | Muted gray (zinc-400). Used for timestamps, metadata, and empty states to establish visual hierarchy. |
| **Muted** | `#27272A` | Background for disabled inputs or subtle UI chrome. |
| **Hover** | `#27272A` (or `rgba(255,255,255,0.05)`) | Very subtle lightening of the surface to indicate interactivity without visual noise. |
| **Selection** | `#3730A3` | Deep indigo background for the actively selected clipboard item in the list. |
| **Focus Ring** | `#818CF8` | A lighter indigo for accessibility focus rings, ensuring keyboard navigation is highly visible. |
| **Success** | `#10B981` | Emerald green. Used for success toasts or "Copied!" feedback. |
| **Warning** | `#F59E0B` | Amber. Used for warning states (e.g., approaching database limits). |
| **Danger** | `#EF4444` | Red. Used exclusively for destructive actions like "Delete Clip" or "Clear History". |
| **Info** | `#3B82F6` | Blue. Used for informational badges or updates. |

---

## 7. Spacing System

ORNAS uses a strict **8px baseline grid** for layout, with a **4px sub-grid** for micro-adjustments.

- **Desktop Density:** High density. Users want to see maximum information with minimal scrolling, but without feeling cluttered.
- **Micro Spacing (4px):** Used between icons and text (e.g., `[Icon] 4px [Label]`).
- **Standard Spacing (8px):** Used between items in a list, or gaps in a flex layout.
- **Component Spacing (16px):** Used for padding inside cards, modals, or separating major sections.
- **Layout Spacing (24px - 32px):** Used for margins around the main application window or modal padding.
- **Corner Radius (Border Radius):** 
  - Outer containers/Modals: `12px`
  - Cards/Inputs/Buttons: `6px` (sharp, technical, modern)
- **Stroke Thickness:** `1px` universally for borders. No heavy borders.
- **Shadow Philosophy:** 
  - Flat by default. 
  - Use shadows exclusively to indicate Z-axis elevation (e.g., Modals get a massive, diffuse shadow like `0 25px 50px -12px rgba(0,0,0,0.5)`, while standard UI panes rely only on 1px borders).

---

## 8. Design Principles

Every future screen, component, or feature built for ORNAS must adhere to these 15 principles:

1. **Content is King:** The user's clipboard data is the most important thing on the screen. UI chrome must never overpower the content.
2. **Keyboard First:** Every single action, screen, and modal must be fully navigable and executable without touching a mouse.
3. **Instantaneous Feedback:** If a user clicks, presses, or copies, the UI must react in under 16ms. Use optimistic updates universally.
4. **No Destructive Surprises:** Deleting data must always require confirmation or provide a clearly visible rollback mechanism.
5. **Respect the Theme:** Always respect the OS-level light/dark mode preference, but ensure the custom theme toggle overrides it flawlessly.
6. **Borders over Backgrounds:** Prefer 1px borders to separate structural areas rather than high-contrast background colors, maintaining a clean, technical aesthetic.
7. **Monospace for Data:** User-copied text should always be rendered in monospace to preserve formatting, indents, and code structure.
8. **Subtle States:** Hover, active, and selected states should be undeniable but subtle. Never use jarring color shifts for standard interactions.
9. **Zero Clutter:** If a feature isn't used by 80% of users, hide it in settings or a context menu. Keep the main view immaculate.
10. **Aria by Default:** Accessibility is not an afterthought. Every button must have an `aria-label`, every modal a focus trap.
11. **Graceful Degradation:** If an image clip cannot be loaded or a file path is broken, show a beautiful error state, never a broken image icon or a crashed app.
12. **Native Feel:** The app should feel like it belongs on the OS (frameless windows, appropriate window controls) while maintaining its unique brand.
13. **Semantic Color Usage:** Never use Red, Green, or Yellow for decoration. They are strictly reserved for Danger, Success, and Warning.
14. **Predictable Layouts:** Don't move things around. Search is always top. List is always left. Detail is always right. Predictability builds muscle memory.
15. **Earn Complexity:** Start with the simplest possible interface. Only add UI complexity if a feature absolutely demands it and provides massive user value.
