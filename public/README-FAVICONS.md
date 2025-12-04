# Favicon Generation

The SVG favicon has been created at `/public/favicon.svg`. To generate the required PNG favicon files, you have several options:

## Option 1: Using Online Tools (Easiest)

1. Go to https://realfavicongenerator.net/
2. Upload the `favicon.svg` file
3. Download the generated favicon package
4. Extract and place the files in `/public/`

## Option 2: Using Sharp (Node.js)

Install sharp:
```bash
npm install --save-dev sharp
```

Create a script `scripts/generate-favicons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 180, 192, 512];

sizes.forEach(size => {
  sharp('public/favicon.svg')
    .resize(size, size)
    .png()
    .toFile(`public/favicon-${size}x${size}.png`)
    .then(() => console.log(`Generated ${size}x${size}`))
    .catch(err => console.error(err));
});
```

Run: `node scripts/generate-favicons.js`

## Option 3: Using ImageMagick

```bash
# Install ImageMagick (Mac)
brew install imagemagick

# Generate favicons
convert public/favicon.svg -resize 16x16 public/favicon-16x16.png
convert public/favicon.svg -resize 32x32 public/favicon-32x32.png
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png
convert public/favicon.svg -resize 192x192 public/android-chrome-192x192.png
convert public/favicon.svg -resize 512x512 public/android-chrome-512x512.png
```

## Required Files

After generation, you should have these files:
- ✅ `favicon.svg` (already created)
- ⏳ `favicon-16x16.png`
- ⏳ `favicon-32x32.png`
- ⏳ `apple-touch-icon.png` (180x180)
- ⏳ `android-chrome-192x192.png`
- ⏳ `android-chrome-512x512.png`
- ✅ `site.webmanifest` (already created)
- ✅ `browserconfig.xml` (already created)


