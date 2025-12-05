/**
 * Generate high-resolution PNG logo from SVG favicon
 * 
 * Uses rsvg-convert (librsvg) for reliable SVG to PNG conversion
 * Install: brew install librsvg (macOS) or apt-get install librsvg2-bin (Linux)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');
const outputPath = path.join(__dirname, '../public/logo.png');

function generateLogo() {
  console.log('🎨 Generating high-resolution logo from favicon...\n');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ Error: favicon.svg not found at ${svgPath}`);
    process.exit(1);
  }

  // Check if rsvg-convert is available
  try {
    execSync('which rsvg-convert', { stdio: 'ignore' });
  } catch (err) {
    console.error('❌ Error: rsvg-convert is not installed');
    console.error('Please install: brew install librsvg (macOS) or apt-get install librsvg2-bin (Linux)');
    process.exit(1);
  }

  try {
    // Use rsvg-convert for reliable SVG to PNG conversion
    execSync(`rsvg-convert -w 2048 -h 2048 "${svgPath}" -o "${outputPath}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Successfully created high-res logo!');
    console.log(`   Location: ${outputPath}`);
    console.log(`   Size: 2048x2048 pixels\n`);
  } catch (error) {
    console.error('❌ Error generating logo:', error.message);
    process.exit(1);
  }
}

generateLogo();

