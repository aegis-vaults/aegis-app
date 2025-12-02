/**
 * Generate PNG favicons from SVG source
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Run: node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('❌ Error: sharp is not installed');
  console.error('Please run: npm install --save-dev sharp');
  process.exit(1);
}

const svgPath = path.join(__dirname, '../public/favicon.svg');
const publicDir = path.join(__dirname, '../public');

// Favicon sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 },
];

async function generateFavicons() {
  console.log('🎨 Generating favicons from SVG...\n');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ Error: favicon.svg not found at ${svgPath}`);
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to generate ${name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} succeeded, ${errorCount} failed`);
  
  if (successCount === sizes.length) {
    console.log('✨ All favicons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify favicons in /public directory');
    console.log('2. Test in browser (clear cache if needed)');
    console.log('3. Deploy and test with social media debuggers');
  }
}

generateFavicons().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

