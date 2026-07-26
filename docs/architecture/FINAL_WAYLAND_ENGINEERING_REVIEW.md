# ORNAS V2 — Final Wayland Engineering Review

This document serves as the executive summary of the Wayland clipboard architecture investigation for ORNAS V2.

## Overall Assessment
The current implementation (`wayland.rs`) provides the most reliable cross-compositor clipboard monitoring possible under current Wayland constraints. By avoiding volatile and compositor-specific protocols (like `wlr-data-control` or unreliable `owner-change` GTK signals), ORNAS ensures consistent functionality across GNOME, KDE, and wlroots environments. 

However, a critical performance flaw exists in the thread model: the polling closure executes synchronous IPC requests (`wait_for_image()`) on the Tauri main thread, risking severe UI freezes during large clipboard transfers.

---

## 1. Findings Summary

### 1.1 Compatibility (Strength)
Polling via GTK is universally supported across Wayland desktop environments. GNOME's strict security model actively defeats background event-driven approaches, making polling the only viable fallback for a background clipboard manager.

### 1.2 Responsiveness (Weakness)
The 500ms polling interval acts as a natural debounce, keeping idle CPU usage near 0%. However, this introduces an unavoidable average capture latency of 250ms.

### 1.3 UI Blocking (Critical Defect)
Because GTK APIs must be called on the main thread, the background thread uses `run_on_main_thread` to execute the poll. Retrieving a large image via Wayland pipes blocks the GTK main loop. This freezes the entire application UI for hundreds of milliseconds.

---

## 2. Architectural Recommendation

**DO NOT REWRITE THE ARCHITECTURE.** 

Do not switch to `wlr-data-control` (breaks GNOME). Do not switch to GTK `owner-change` signals (unreliable in background).

**DO FIX THE THREADING DEFECT.**

The only necessary change is to decouple GTK from the Tauri main thread.
- **Solution**: Spawn a dedicated background thread specifically for GTK context initialization and polling. This ensures that when `wait_for_image()` blocks on the Wayland pipe, it only blocks the dedicated clipboard thread, leaving the Tauri UI thread 100% responsive.

## 3. Conclusion
The ORNAS Wayland architecture is fundamentally sound in its strategy but flawed in its specific thread execution. Resolving the main-thread blocking issue will upgrade the Wayland support to production-grade reliability, requiring minimal code changes while maintaining maximum compositor compatibility.
