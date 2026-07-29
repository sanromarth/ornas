# ORNAS — Wayland Compatibility Matrix

## 1. Objective
Evaluate cross-compositor compatibility for clipboard operations under Wayland, documenting limitations, protocol support, and portal requirements.

## 2. Protocol Analysis

### 2.1 `wlr-data-control`
- **Supported By**: wlroots-based compositors (Sway, Hyprland).
- **Status**: Widely adopted in the wlroots ecosystem. Unofficial standard.
- **Reliability**: Excellent. Allows background applications to monitor clipboard changes without relying on active window focus.
- **Limitations**: GNOME and KDE strictly refuse to implement it, citing security concerns.

### 2.2 Native KDE Wayland Protocols
- **Supported By**: KWin (KDE Plasma).
- **Status**: KDE implements its own clipboard management protocols internally, accessible mostly through Qt abstractions rather than raw Wayland protocols for third parties.

### 2.3 GNOME / Mutter
- **Supported By**: GNOME.
- **Status**: GNOME explicitly isolates clipboard access. Applications running natively in Wayland can only access the clipboard when they have focus or through GTK/GDK abstractions that communicate via Mutter.
- **Reliability**: Polling via GTK works because Mutter allows the active GTK process to request the selection. Event-driven (`owner-change`) signals are often delayed or swallowed if the app lacks focus.

### 2.4 XDG-Desktop-Portal
- **Status**: Currently lacking a robust, universally adopted `Secret` or `Clipboard` portal specification that provides continuous background monitoring capabilities for clipboard managers.

## 3. Compatibility Matrix

| Compositor | Polling (GTK) | `owner-change` (GTK) | `wlr-data-control` | Image Clipboard | File URIs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GNOME (Mutter)** | Reliable | Unreliable (focus req) | Unsupported | Supported | Supported |
| **KDE (KWin)** | Reliable | Moderate | Unsupported | Supported | Supported |
| **Sway (wlroots)** | Reliable | Moderate | Fully Supported | Supported | Supported |
| **Hyprland** | Reliable | Moderate | Fully Supported | Supported | Supported |
| **COSMIC** | TBD | TBD | TBD | TBD | TBD |

## 4. Conclusion
A unified, event-driven Wayland API does not exist for Linux. Relying on `wlr-data-control` alienates 70% of the userbase (GNOME/KDE). Relying on GTK `owner-change` signals results in dropped clips when ORNAS is minimized. **Active polling (via GTK abstractions) remains the only universally compatible method for background clipboard monitoring across all major Wayland compositors.**
