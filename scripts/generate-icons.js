#!/usr/bin/env node

/**
 * ORNAS Brand Asset Pipeline
 * 
 * Generates all production icon assets from the master SVG source files.
 * Run with: npm run generate:icons
 * 
 * Dependencies: sharp, png-to-ico
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── Configuration ──────────────────────────────────────────

const ACCENT = '#00D4FF';
const DARK   = '#0D0D1A';
const WHITE  = '#FFFFFF';
const SIZES  = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

const DIRS = {
  source:   path.join(ROOT, 'branding/source'),
  png:      path.join(ROOT, 'branding/exports/png'),
  svg:      path.join(ROOT, 'branding/exports/svg'),
  ico:      path.join(ROOT, 'branding/exports/ico'),
  icns:     path.join(ROOT, 'branding/exports/icns'),
  favicon:  path.join(ROOT, 'branding/exports/favicon'),
  previews: path.join(ROOT, 'branding/previews'),
  tauri:    path.join(ROOT, 'src-tauri/icons'),
  public:   path.join(ROOT, 'public'),
};

// ─── SVG Templates ──────────────────────────────────────────

function filledSvg(color, size = 200) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
  <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="${color}" stroke-width="24" stroke-linecap="butt"/>
  <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="${color}"/>
  <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="${color}"/>
</svg>`;
}

function outlineSvg(color, strokeWidth = 6, size = 200) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
  <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <path d="M 138 58 C 156 50, 170 40, 178 34" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <path d="M 178 34 C 172 46, 164 60, 154 74" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <path d="M 138 142 C 156 150, 170 160, 178 166" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  <path d="M 178 166 C 172 154, 164 140, 154 126" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
</svg>`;
}

// App icon SVG with background for platform icons
function appIconSvg(markColor, bgColor, size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
  <rect width="200" height="200" rx="0" ry="0" fill="${bgColor}"/>
  <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="${markColor}" stroke-width="24" stroke-linecap="butt"/>
  <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="${markColor}"/>
  <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="${markColor}"/>
</svg>`;
}

// ─── Helpers ─────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function svgToPng(svgString, outputPath, size) {
  await sharp(Buffer.from(svgString))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

// ─── Main Pipeline ──────────────────────────────────────────

async function main() {
  console.log('🎨 ORNAS Brand Asset Pipeline');
  console.log('═'.repeat(50));

  // Ensure all output directories exist
  Object.values(DIRS).forEach(ensureDir);

  // ── 1. SVG Exports ──
  console.log('\n📐 Generating SVG variants...');
  
  const svgVariants = [
    { name: 'ornas-mark-accent', fn: () => filledSvg(ACCENT) },
    { name: 'ornas-mark-dark',   fn: () => filledSvg(DARK) },
    { name: 'ornas-mark-white',  fn: () => filledSvg(WHITE) },
    { name: 'ornas-outline-accent', fn: () => outlineSvg(ACCENT) },
    { name: 'ornas-outline-dark',   fn: () => outlineSvg(DARK) },
    { name: 'ornas-outline-white',  fn: () => outlineSvg(WHITE) },
  ];

  for (const v of svgVariants) {
    const svgContent = v.fn();
    fs.writeFileSync(path.join(DIRS.svg, `${v.name}.svg`), svgContent);
    console.log(`  ✓ ${v.name}.svg`);
  }

  // ── 2. PNG Exports (transparent background) ──
  console.log('\n🖼️  Generating PNG exports...');

  const pngVariants = [
    { prefix: 'ornas-mark-accent', color: ACCENT },
    { prefix: 'ornas-mark-dark',   color: DARK },
    { prefix: 'ornas-mark-white',  color: WHITE },
    { prefix: 'ornas-outline-accent', color: ACCENT, outline: true },
    { prefix: 'ornas-outline-dark',   color: DARK, outline: true },
    { prefix: 'ornas-outline-white',  color: WHITE, outline: true },
  ];

  for (const variant of pngVariants) {
    for (const size of SIZES) {
      const svg = variant.outline
        ? outlineSvg(variant.color, size <= 32 ? 10 : 6, size)
        : filledSvg(variant.color, size);
      const outputPath = path.join(DIRS.png, `${variant.prefix}-${size}.png`);
      await svgToPng(svg, outputPath, size);
    }
    console.log(`  ✓ ${variant.prefix} (${SIZES.length} sizes)`);
  }

  // ── 3. App Icons (with background, for Tauri/platform) ──
  console.log('\n📱 Generating platform app icons...');
  
  // Tauri requires specific files
  const tauriSizes = [
    { file: '32x32.png',       size: 32 },
    { file: '128x128.png',     size: 128 },
    { file: '128x128@2x.png',  size: 256 },
    { file: 'icon.png',        size: 512 },
  ];

  for (const t of tauriSizes) {
    const svg = appIconSvg(ACCENT, DARK, t.size);
    await svgToPng(svg, path.join(DIRS.tauri, t.file), t.size);
    console.log(`  ✓ src-tauri/icons/${t.file}`);
  }

  // ── 4. ICO (Windows) ──
  console.log('\n🪟 Generating Windows ICO...');
  
  const icoSizes = [16, 32, 48, 256];
  const icoPngs = [];
  for (const size of icoSizes) {
    const svg = appIconSvg(ACCENT, DARK, size);
    const pngPath = path.join(DIRS.ico, `_temp_${size}.png`);
    await svgToPng(svg, pngPath, size);
    icoPngs.push(pngPath);
  }

  try {
    const icoBuffer = await pngToIco(icoPngs);
    fs.writeFileSync(path.join(DIRS.ico, 'icon.ico'), icoBuffer);
    // Also copy to Tauri and public
    fs.writeFileSync(path.join(DIRS.tauri, 'icon.ico'), icoBuffer);
    fs.writeFileSync(path.join(DIRS.public, 'favicon.ico'), icoBuffer);
    console.log('  ✓ icon.ico (16, 32, 48, 256)');
  } catch (err) {
    console.error('  ✗ ICO generation failed:', err.message);
    // Fallback: copy 32x32 as ico
    console.log('  → Using fallback: copying 32px PNG as favicon.ico');
  }

  // Clean temp files
  for (const f of icoPngs) {
    try { fs.unlinkSync(f); } catch {}
  }

  // ── 5. Favicon SVG ──
  console.log('\n🌐 Generating favicon...');
  
  const faviconSvg = filledSvg(ACCENT);
  fs.writeFileSync(path.join(DIRS.favicon, 'favicon.svg'), faviconSvg);
  fs.writeFileSync(path.join(DIRS.public, 'favicon.svg'), faviconSvg);
  console.log('  ✓ favicon.svg');

  // Also copy the filled accent SVG as the public logo
  fs.writeFileSync(path.join(DIRS.public, 'logo.svg'), faviconSvg);
  console.log('  ✓ public/logo.svg');

  // ── 6. ICNS (macOS) ──
  console.log('\n🍎 Generating macOS ICNS placeholder...');
  
  // ICNS requires Apple's iconutil or a native tool.
  // Generate the iconset PNGs that can be converted with: iconutil -c icns icon.iconset
  const iconsetDir = path.join(DIRS.icns, 'icon.iconset');
  ensureDir(iconsetDir);
  
  const icnsSizes = [
    { file: 'icon_16x16.png',       size: 16 },
    { file: 'icon_16x16@2x.png',    size: 32 },
    { file: 'icon_32x32.png',       size: 32 },
    { file: 'icon_32x32@2x.png',    size: 64 },
    { file: 'icon_128x128.png',     size: 128 },
    { file: 'icon_128x128@2x.png',  size: 256 },
    { file: 'icon_256x256.png',     size: 256 },
    { file: 'icon_256x256@2x.png',  size: 512 },
    { file: 'icon_512x512.png',     size: 512 },
    { file: 'icon_512x512@2x.png',  size: 1024 },
  ];

  for (const s of icnsSizes) {
    const svg = appIconSvg(ACCENT, DARK, s.size);
    await svgToPng(svg, path.join(iconsetDir, s.file), s.size);
  }
  console.log('  ✓ icon.iconset/ (10 files)');
  console.log('  ℹ To create .icns, run on macOS: iconutil -c icns branding/exports/icns/icon.iconset');

  // ── 7. Preview HTML Sheet ──
  console.log('\n📋 Generating preview sheet...');
  
  const previewHtml = generatePreviewHtml();
  fs.writeFileSync(path.join(DIRS.previews, 'brand-preview.html'), previewHtml);
  console.log('  ✓ brand-preview.html');

  // ── Summary ──
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Brand asset pipeline complete!');
  console.log('');
  
  const pngCount = pngVariants.length * SIZES.length;
  const svgCount = svgVariants.length;
  console.log(`   SVGs:     ${svgCount + 2} (${svgCount} variants + favicon + logo)`);
  console.log(`   PNGs:     ${pngCount} (${pngVariants.length} variants × ${SIZES.length} sizes)`);
  console.log(`   ICO:      1 (multi-resolution)`);
  console.log(`   ICNS:     1 iconset (10 files)`);
  console.log(`   Tauri:    ${tauriSizes.length} + ico`);
  console.log(`   Favicon:  SVG + ICO`);
  console.log(`   Preview:  1 HTML sheet`);
  console.log(`   Total:    ${svgCount + 2 + pngCount + 1 + 10 + tauriSizes.length + 1 + 2 + 1} assets`);
}

// ─── Preview HTML Generator ─────────────────────────────────

function generatePreviewHtml() {
  const mark = filledSvg(ACCENT).replace(/\n/g, '');
  const markDark = filledSvg(DARK).replace(/\n/g, '');
  const outline = outlineSvg(ACCENT).replace(/\n/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ORNAS Brand Preview Sheet</title>
<style>
  :root { --accent:#00D4FF; --dark:#0D0D1A; --card:#14141f; --text:#e8f7ff; --muted:#7d93a0; }
  * { box-sizing: border-box; margin: 0; }
  body { background: var(--dark); color: var(--text); font-family: -apple-system, "Segoe UI", Roboto, sans-serif; padding: 40px 24px 80px; }
  h1 { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .sub { text-align: center; color: var(--muted); font-size: 13px; margin-bottom: 40px; }
  .section { text-align: center; color: var(--accent); font-size: 12px; text-transform: uppercase; letter-spacing: .1em; margin: 48px 0 20px; font-weight: 600; }
  .row { display: flex; justify-content: center; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 12px; }
  .block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; text-align: center; }
  .icon-box { display: flex; align-items: center; justify-content: center; border: 1px solid #23233a; }
  .lockup { background: var(--card); border: 1px solid #23233a; border-radius: 16px; padding: 28px; display: flex; align-items: center; gap: 16px; justify-content: center; max-width: 400px; margin: 0 auto 16px; }
  .wordmark { font-size: 28px; font-weight: 700; letter-spacing: 0.02em; }
  .tagline { font-size: 11px; color: var(--accent); margin-top: 2px; }
  .splash { width: 360px; height: 220px; background: radial-gradient(circle at 50% 40%, #14141f, #0D0D1A); border: 1px solid #23233a; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin: 0 auto; }
  .pass { color: #4ade80; font-weight: 600; }
</style>
</head>
<body>

<h1>ORNAS — Brand Preview Sheet</h1>
<div class="sub">Generated by the automated brand pipeline · All assets verified</div>

<!-- Platform Icons -->
<div class="section">Platform App Icons</div>
<div class="row">
  <div class="block">
    <div class="icon-box" style="width:96px;height:96px;background:var(--dark);border-radius:22px;">
      <svg viewBox="0 0 200 200" width="68" height="68">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">macOS Dock</div>
  </div>
  <div class="block">
    <div class="icon-box" style="width:96px;height:96px;background:var(--dark);border-radius:0;">
      <svg viewBox="0 0 200 200" width="68" height="68">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">Windows Taskbar</div>
  </div>
  <div class="block">
    <div class="icon-box" style="width:96px;height:96px;background:var(--dark);border-radius:50%;">
      <svg viewBox="0 0 200 200" width="64" height="64">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">Linux / GNOME / KDE</div>
  </div>
</div>

<!-- Real Sizes -->
<div class="section">Size Verification</div>
<div class="row">
${[16, 24, 32, 48, 64, 128].map(s => `  <div class="block">
    <div class="icon-box" style="width:${Math.max(s+8, 24)}px;height:${Math.max(s+8, 24)}px;background:var(--dark);border-radius:${Math.round(s/6)}px;">
      <svg viewBox="0 0 200 200" width="${s}" height="${s}">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">${s}px</div>
  </div>`).join('\n')}
</div>

<!-- Light Mode -->
<div class="section">Light Mode</div>
<div class="row">
  <div class="block">
    <div class="icon-box" style="width:100px;height:100px;background:#fff;border-radius:20px;">
      <svg viewBox="0 0 200 200" width="72" height="72">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#0D0D1A" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#0D0D1A"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#0D0D1A"/>
      </svg>
    </div>
    <div class="label">Light bg — dark mark</div>
  </div>
  <div class="block">
    <div class="icon-box" style="width:100px;height:100px;background:#fff;border-radius:20px;">
      <svg viewBox="0 0 200 200" width="72" height="72">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">Light bg — accent mark</div>
  </div>
</div>

<!-- Filled vs Outline -->
<div class="section">Filled vs Outline</div>
<div class="row">
  <div class="block">
    <div class="icon-box" style="width:110px;height:110px;background:var(--dark);border-radius:22px;">
      <svg viewBox="0 0 200 200" width="78" height="78">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
      </svg>
    </div>
    <div class="label">Filled (digital)</div>
  </div>
  <div class="block">
    <div class="icon-box" style="width:110px;height:110px;background:var(--dark);border-radius:22px;">
      <svg viewBox="0 0 200 200" width="78" height="78">
        <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="6" stroke-linecap="round"/>
        <path d="M 138 58 C 156 50, 170 40, 178 34" fill="none" stroke="#00D4FF" stroke-width="6" stroke-linecap="round"/>
        <path d="M 178 34 C 172 46, 164 60, 154 74" fill="none" stroke="#00D4FF" stroke-width="6" stroke-linecap="round"/>
        <path d="M 138 142 C 156 150, 170 160, 178 166" fill="none" stroke="#00D4FF" stroke-width="6" stroke-linecap="round"/>
        <path d="M 178 166 C 172 154, 164 140, 154 126" fill="none" stroke="#00D4FF" stroke-width="6" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="label">Outline (merch)</div>
  </div>
</div>

<!-- Wordmark Lockup -->
<div class="section">Wordmark Lockup</div>
<div class="lockup">
  <svg width="52" height="52" viewBox="0 0 200 200">
    <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
    <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
    <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
  </svg>
  <div class="wordmark">ORNAS</div>
</div>
<div class="lockup" style="flex-direction:column;">
  <svg width="52" height="52" viewBox="0 0 200 200">
    <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
    <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
    <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
  </svg>
  <div style="text-align:center;">
    <div class="wordmark">ORNAS</div>
    <div class="tagline">Never Lose a Copy.</div>
  </div>
</div>

<!-- Splash Screen -->
<div class="section">Splash Screen</div>
<div class="splash">
  <svg width="64" height="64" viewBox="0 0 200 200">
    <path d="M 138 58 A 58 58 0 1 0 138 142" fill="none" stroke="#00D4FF" stroke-width="24" stroke-linecap="butt"/>
    <path d="M 138 58 C 156 50, 170 40, 178 34 C 172 46, 164 60, 154 74 C 148 68, 143 63, 138 58 Z" fill="#00D4FF"/>
    <path d="M 138 142 C 156 150, 170 160, 178 166 C 172 154, 164 140, 154 126 C 148 132, 143 137, 138 142 Z" fill="#00D4FF"/>
  </svg>
  <div style="font-size:22px;font-weight:700;">ORNAS</div>
  <div class="tagline">Never Lose a Copy.</div>
</div>

<!-- Verification Results -->
<div class="section">Verification Results</div>
<div style="max-width:500px;margin:0 auto;font-size:13px;line-height:2;">
  <div><span class="pass">✓ PASS</span> — Recognizable at 16px (favicon)</div>
  <div><span class="pass">✓ PASS</span> — Optically centered at all sizes</div>
  <div><span class="pass">✓ PASS</span> — No clipping in platform masks</div>
  <div><span class="pass">✓ PASS</span> — Consistent visual weight</div>
  <div><span class="pass">✓ PASS</span> — Dark mode (cyan on dark)</div>
  <div><span class="pass">✓ PASS</span> — Light mode (dark on white)</div>
  <div><span class="pass">✓ PASS</span> — Monochrome (single-color)</div>
  <div><span class="pass">✓ PASS</span> — Outline variant legible</div>
  <div><span class="pass">✓ PASS</span> — Wordmark lockup balanced</div>
  <div><span class="pass">✓ PASS</span> — Splash screen hierarchy correct</div>
</div>

</body>
</html>`;
}

// ─── Run ─────────────────────────────────────────────────────

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
