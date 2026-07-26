# Frequently Asked Questions (FAQ)

## Is ORNAS safe?
ORNAS is built with a privacy-first, offline-first, local-first philosophy. There are no cloud services, no telemetry, no tracking, and no user accounts. All of your clipboard data remains locally on your device. The application is open-source, allowing anyone to inspect the source code.

## Why does Windows say ORNAS is from an unknown publisher?
Windows releases are currently unsigned. This triggers Microsoft Defender SmartScreen or Smart App Control to display a warning. The warnings are expected because the application is not yet digitally signed. Users should download releases only from the official ORNAS GitHub repository. We are actively working with the SignPath Foundation to provide digitally signed binaries in the future.

## Why does macOS warn that ORNAS cannot be verified?
macOS builds are currently unsigned and not notarized by Apple. Apple Gatekeeper displays a warning when launching applications that haven't been notarized. We plan to implement Apple code signing and notarization as soon as practical to prevent these warnings.

## When will signed releases be available?
For Windows, we have applied to the SignPath Foundation. Once approved, Windows releases will be signed automatically using GitHub Actions. For macOS, code signing and notarization are planned for a future release. For more details on the current status, please see [SIGNING.md](../SIGNING.md).
