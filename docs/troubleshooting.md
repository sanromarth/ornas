# Troubleshooting

## General Issues

### ORNAS is not capturing my clipboard
- Ensure ORNAS is running in the background. Check your system tray.
- If you just installed the application, try restarting it.
- On some Linux environments (like Wayland), clipboard access might require specific permissions or compositor support.

## Linux-Specific Issues

### AppImage won't open
If you double-click the `.AppImage` file and nothing happens, ensure that FUSE is installed on your system.
```bash
sudo apt install libfuse2
```
You also need to make the AppImage executable:
```bash
chmod +x ORNAS_*.AppImage
```

## Developer / CI Issues

### Headless CI tests fail with exit code 101
Tauri applications rely on a display server to initialize native GUI components (such as clipboard contexts). When running `cargo test` on a headless Linux CI server (like GitHub Actions), the process will panic. 
**Solution:** Run your tests using `xvfb-run` to simulate a virtual display:
```bash
xvfb-run cargo test
```
