# Privacy Policy

**ORNAS** ("we", "us", or "our") is built on a core philosophy: **Never Lose a Copy**. We believe that your clipboard history is inherently personal and sensitive. Therefore, ORNAS is designed from the ground up to be privacy-first, offline-first, and local-first.

This Privacy Policy explains what data ORNAS stores, how it is secured, and how you have complete control over it.

## Our Philosophy

- **No User Account Required:** You can use ORNAS without registering, logging in, or providing an email address.
- **No Telemetry:** We do not track how you use the app.
- **No Analytics:** We do not monitor feature usage or crash frequency.
- **No Advertising:** ORNAS does not display ads and does not share your data with advertisers.
- **No Cloud Synchronization:** Your data stays on your device. We do not sync it to any external servers.

## Information We Collect

### Information We Do NOT Collect
ORNAS **never** collects, transmits, or uploads any of the following to our servers or any third-party servers:
- Your clipboard history (text, images, files, rich text, code snippets).
- Your search queries.
- Your tags, collections, or favorites.
- Your usage patterns or application analytics.
- Your IP address, location, or device identifiers.
- Crash logs (unless you manually copy and email them to us).

### Local Data Storage
ORNAS stores all data **locally** on your machine. This data is necessary for the application to function:
- **Clipboard History:** Text, rich text/HTML, and file paths.
- **Application State:** Your settings, theme preferences, and window positions.
- **Metadata:** Your collections, tags, and favorite status for clips.

## Clipboard Data

When you copy text, images, or files, ORNAS detects this activity via your operating system's clipboard APIs and saves a copy to a local SQLite database. This database is stored securely within your operating system's standard application data directory (e.g., `%APPDATA%` on Windows, `~/.local/share` on Linux, `~/Library/Application Support` on macOS).

## Images and Files

- **Images:** Screenshots or images copied to your clipboard are saved locally as image files (e.g., PNG/JPEG) inside the ORNAS application data directory. A smaller thumbnail is also cached locally to ensure fast performance.
- **Files:** When you copy a file from your file manager, ORNAS does **not** duplicate the file. It merely stores the file path and basic metadata (size, name, extension) so you can reference it later.

## Encryption

ORNAS includes an **Encrypted Vault** feature to protect sensitive clips.
- When you enable the Vault, your selected clips are encrypted locally using authenticated encryption (ChaCha20Poly1305 / Argon2).
- The encryption keys are derived from a master password that you set, and these keys remain strictly on your machine.
- **Important:** Because everything is local and we have no servers, **we cannot recover your data if you lose your master password**. 

## Import & Export

You may choose to export your ORNAS database (including images, tags, and settings) for backup or migration purposes.
- Exports are generated locally on your machine as a ZIP archive.
- The export process never transmits data over the network.
- When importing, the data is unpacked and read directly into your local database.

## Backups

ORNAS performs automated local backups of your database to prevent data loss in case of corruption. These backups are stored in your local application data directory alongside your primary database and are never uploaded to any cloud service.

## Crash Reports

ORNAS does not automatically send crash reports. If the application crashes, logs are written to a local file. If you wish to report a bug, you must manually locate these logs and provide them to us via our public issue tracker or email.

## Third-Party Services

Because ORNAS is 100% offline-first, we do not integrate with third-party tracking, analytics, or advertising services. 

Our application is built using open-source libraries (such as React, Tauri, Rust, and SQLite). These libraries run entirely on your local machine and do not "phone home" or report data back to their creators.

## Open Source Transparency

ORNAS is an open-source project. This means our source code is publicly available for anyone to inspect, audit, and verify. We encourage security researchers and users to review our codebase to confirm that our privacy promises match our implementation.

## User Control

You have complete control over your data.
- **Pause Monitoring:** You can pause clipboard monitoring at any time from the system tray or application settings.
- **Selective Retention:** You can configure ORNAS to automatically prune data older than a certain timeframe (e.g., 30 days). *(Note: Auto-pruning is actively being enhanced in future updates)*.
- **Search and Delete:** You can easily search for and delete specific clips.

## Data Deletion

You can permanently delete your entire clipboard history and all local data by either:
1. Using the "Clear All Data" option within the ORNAS settings menu.
2. Manually deleting the ORNAS folder in your operating system's application data directory.

Once deleted, the data cannot be recovered.

## Security

We employ industry-standard practices to ensure your local data is secure:
- The database is isolated to your user profile using standard operating system permissions.
- We restrict the Tauri framework's file-system access solely to the ORNAS application data directory to prevent unauthorized file access.
- We continuously run static analysis, dependency audits, and code reviews before releases.

## Children's Privacy

Because ORNAS is a locally installed application that does not collect or transmit personal information, it is safe for users of all ages. We do not knowingly collect personal data from anyone, including children under the age of 13.

## Changes to this Policy

As ORNAS grows, we may update this Privacy Policy. If we introduce features that require network access (such as optional opt-in peer-to-peer syncing in future roadmaps), this policy will be updated to clearly explain how those features work. However, our core philosophy will never change: **ORNAS will always be local-first, and you will always own your data.**

## Contact

If you have questions, concerns, or wish to report a vulnerability regarding this Privacy Policy or the security of ORNAS, please reach out:

- **Security Concerns:** Email us at `security@ornas.io`
- **General Inquiries:** Open a discussion on our [GitHub repository](https://github.com/sanromarth/ornas)

---
*Last Updated: July 2026 (v0.9.0-beta)*
