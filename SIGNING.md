# Code Signing and Platform Status

ORNAS is a privacy-first, open-source desktop application.

Windows and macOS releases are currently **unsigned**, which means:

- Windows may display Microsoft Defender SmartScreen or Smart App Control warnings.
- macOS may display Apple Gatekeeper warnings.

These warnings occur because the binaries have not yet been digitally signed or notarized by a trusted certificate authority. They do **not** indicate that ORNAS contains malware. The warnings are expected because the application is not yet digitally signed. Users should download releases only from the official ORNAS GitHub repository.

## Current Status

| Platform | Status |
|----------|--------|
| Linux | Fully supported |
| Windows | Supported, currently unsigned |
| macOS | Supported, currently unsigned and not notarized |

## Future Plan

ORNAS has applied to the **SignPath Foundation** to provide digitally signed Windows binaries for public releases. 

Once approved, Windows releases distributed through GitHub Releases will be signed automatically using GitHub Actions.

Project: https://signpath.org/

For macOS, we intend to implement Apple code signing and notarization as soon as practical to provide a smoother installation experience.

Until then, macOS users may need to manually allow the application through Gatekeeper.

## Why signing matters

Code signing is an important security mechanism that provides:
- **Authenticity**: Guarantees that the software was published by the claimed author (the ORNAS project).
- **Integrity**: Ensures the binary has not been tampered with or modified since it was published.
- **Trusted Publisher**: Allows operating systems to recognize the publisher, avoiding unknown publisher warnings.
- **Better Installation Experience**: Prevents security screens from blocking the initial launch of the application.
