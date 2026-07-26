# ORNAS V2 — Wayland Decision Matrix

## 1. Objective
Compare clipboard architecture approaches for Wayland to determine the optimal balance of responsiveness, compatibility, and stability.

## 2. Options Evaluated

### Option A: Current GTK Polling (500ms)
- **Mechanism**: Sleep 500ms -> Run GTK API on Main Thread -> Diff Hashes.
- **Responsiveness**: Poor (up to 500ms latency).
- **CPU Usage**: Excellent (Idle ~0.5%).
- **Compatibility**: Universal (Works on GNOME, KDE, wlroots).
- **Stability**: High risk of freezing the UI during `wait_for_image()`.

### Option B: Pure Event-Driven (GTK `owner-change`)
- **Mechanism**: Connect to GTK's `owner-change` signal.
- **Responsiveness**: Instant (when it fires).
- **CPU Usage**: Excellent (Zero idle overhead).
- **Compatibility**: Very Poor (GNOME swallows events for background apps; wlroots support is patchy).
- **Stability**: High risk of completely missing copied clips when ORNAS is minimized.

### Option C: Pure Event-Driven (`wlr-data-control`)
- **Mechanism**: Native Wayland protocol for clipboard management.
- **Responsiveness**: Instant.
- **CPU Usage**: Excellent.
- **Compatibility**: Poor (Only works on Sway/Hyprland. Hard-blocked by GNOME and KDE).
- **Stability**: Extremely reliable on supported compositors.

### Option D: Hybrid Event + Polling
- **Mechanism**: Connect to `owner-change` for instant updates *when focused*, while maintaining a 1000ms fallback polling loop to catch missed background events.
- **Responsiveness**: Instant when active, slow when in background.
- **Complexity**: High. Managing race conditions between the signal and the poll is error-prone.

### Option E: Background Thread GTK Polling (Off-Main-Thread)
- **Mechanism**: Initialize a separate GTK context/event loop entirely on a background thread. Poll or listen on that thread.
- **Responsiveness**: Up to 500ms.
- **Compatibility**: Universal.
- **Stability**: Eliminates all UI blocking since `wait_for_image()` occurs off the Tauri main thread.

## 3. Decision Matrix

| Approach | Latency | CPU Overhead | Wayland Compatibility | UI Freezes | Implementation Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A: Current** | 500ms | Low | **Universal** | **Yes** | Zero (Done) |
| **B: GTK Events** | Instant | Low | Poor | Yes | Low |
| **C: wlroots API** | Instant | Low | Niche | No | High |
| **D: Hybrid** | Variable | Medium | Universal | Yes | High |
| **E: Background GTK** | 500ms | Low | **Universal** | **No** | Medium |

## 4. Conclusion
Option E (Background GTK Polling) provides the best engineering compromise. It preserves universal compatibility (unlike B and C) but solves the critical UI freezing defect of Option A.
