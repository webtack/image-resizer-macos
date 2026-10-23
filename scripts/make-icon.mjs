// Generates build/icon.icns: a blurred-gradient tile with a sharp "photo" frame in the middle,
// echoing what the app does. Requires macOS `iconutil`. Usage: node scripts/make-icon.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a59"/><stop offset="1" stop-color="#5b4bdb"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="200" fill="url(#bg)"/>
  <rect x="232" y="312" width="560" height="400" rx="36" fill="url(#sky)" stroke="#fff" stroke-width="16"/>
  <circle cx="620" cy="440" r="52" fill="#fff6c8"/>
  <path d="M232 676 L420 500 L540 610 L640 530 L792 676 Z" fill="#2c7a5b"/>
</svg>`;

const dir = 'build/icon.iconset';
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const size of [16, 32, 128, 256, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${dir}/icon_${size}x${size}.png`);
  await sharp(Buffer.from(svg)).resize(size * 2, size * 2).png().toFile(`${dir}/icon_${size}x${size}@2x.png`);
}
execFileSync('iconutil', ['-c', 'icns', dir, '-o', 'build/icon.icns']);
rmSync(dir, { recursive: true, force: true });
