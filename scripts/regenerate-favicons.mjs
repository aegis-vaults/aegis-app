/**
 * Regenerate all favicon PNGs from the source SVG
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG source
const svgPath = join(publicDir, 'favicon.svg');
const svgBuffer = readFileSync(svgPath);

// Define all the sizes we need to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'mstile-150x150.png', size: 150 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'aegis-logo-1024.png', size: 1024 },  // Extra high-res for marketing
];

async function generateFavicons() {
  console.log('Regenerating favicons from SVG source...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  console.log('\n✅ All favicons regenerated successfully!');
}

generateFavicons().catch(console.error);

