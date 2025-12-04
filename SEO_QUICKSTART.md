# SEO & Social Sharing - Quick Start Guide

## ✅ What's Been Implemented

### 1. Comprehensive Metadata System
- **Location:** `src/lib/metadata/`
- **Features:**
  - Centralized site configuration
  - Metadata generator utilities
  - Page-specific metadata helpers
  - Structured data (JSON-LD) for rich snippets

### 2. Favicons & Icons
- **SVG Favicon:** `public/favicon.svg` ✅
- **Web Manifest:** `public/site.webmanifest` ✅
- **Browser Config:** `public/browserconfig.xml` ✅
- **PNG Favicons:** Need to be generated (see below)

### 3. SEO Files
- **Robots.txt:** `public/robots.txt` ✅
- **Sitemap:** `src/app/sitemap.ts` ✅
- **Open Graph Image:** `src/app/opengraph-image.tsx` ✅
- **Twitter Image:** `src/app/twitter-image.tsx` ✅

### 4. Social Sharing Component
- **Location:** `src/components/shared/social-share.tsx` ✅
- **Features:** Twitter, Facebook, LinkedIn, Native share, Copy link

## 🚀 Getting Started

### Step 1: Generate PNG Favicons

**Option A: Automatic (Recommended)**
```bash
# Install sharp (if not already installed)
npm install --save-dev sharp

# Generate all favicon sizes
npm run generate:favicons
```

**Option B: Online Tool**
1. Go to https://realfavicongenerator.net/
2. Upload `public/favicon.svg`
3. Download and extract to `public/`

**Option C: Manual (ImageMagick)**
```bash
brew install imagemagick
convert public/favicon.svg -resize 16x16 public/favicon-16x16.png
convert public/favicon.svg -resize 32x32 public/favicon-32x32.png
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png
convert public/favicon.svg -resize 192x192 public/android-chrome-192x192.png
convert public/favicon.svg -resize 512x512 public/android-chrome-512x512.png
```

### Step 2: Set Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (Railway):
```env
NEXT_PUBLIC_APP_URL=https://your-production-url.com
```

### Step 3: Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and:
1. View page source - check `<meta>` tags
2. Look for favicon in browser tab
3. Check browser console for errors

## 📝 Usage Examples

### Add Metadata to a Page

```tsx
// src/app/my-page/page.tsx
import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata('home');

export default function MyPage() {
  return <div>My Page</div>;
}
```

### Custom Metadata

```tsx
import { generateMetadata } from '@/lib/metadata';

export const metadata = generateMetadata({
  title: 'Custom Page Title - Aegis',
  description: 'Custom description for this page',
  path: '/my-custom-page',
});
```

### Add Social Sharing

```tsx
'use client';

import { SocialShare } from '@/components/shared/social-share';

export function MyComponent() {
  return (
    <SocialShare
      url="https://aegis.fi/vaults/123"
      title="Check out my AI Vault!"
      description="Secure smart vault on Solana"
    />
  );
}
```

## 🧪 Testing

### Local Testing

1. **View Source**
   - Right-click page → View Page Source
   - Look for `<meta>` tags in `<head>`

2. **DevTools**
   - F12 → Network → Doc
   - Check response headers and meta tags

3. **Lighthouse**
   - DevTools → Lighthouse
   - Run SEO audit

### Production Testing

1. **Open Graph (Facebook)**
   - https://developers.facebook.com/tools/debug/
   - Enter your URL
   - Click "Scrape Again" to refresh

2. **Twitter Cards**
   - https://cards-dev.twitter.com/validator
   - Enter your URL
   - Check preview

3. **LinkedIn**
   - https://www.linkedin.com/post-inspector/
   - Enter your URL

4. **Rich Results (Google)**
   - https://search.google.com/test/rich-results
   - Test structured data

5. **Mobile-Friendly**
   - https://search.google.com/test/mobile-friendly

## 📊 What Gets Indexed

### Allowed (Public Pages)
- ✅ `/` - Home page
- ✅ Future marketing pages

### Blocked (Private Pages)
- ❌ `/api/*` - API routes
- ❌ `/dashboard/*` - User dashboard
- ❌ `/settings/*` - User settings

See `public/robots.txt` for details.

## 🎯 Key Features

### Open Graph Tags
- Title, description, image
- URL, site name, type
- Locale

### Twitter Cards
- Large image card
- Site and creator handles
- Title, description, image

### Structured Data
- Software Application schema
- Organization schema
- Rich snippet support

### Technical SEO
- Canonical URLs
- Mobile viewport
- Theme colors
- PWA manifest
- XML sitemap
- Robots.txt

## 🔧 Customization

### Update Site Info

Edit `src/lib/metadata/config.ts`:

```typescript
export const siteConfig = {
  name: 'Aegis',
  title: 'Your Custom Title',
  description: 'Your custom description',
  url: 'https://your-url.com',
  // ... more config
};
```

### Add New Page Metadata

Edit `src/lib/metadata/config.ts`:

```typescript
export const pages = {
  // ... existing pages
  myNewPage: {
    title: 'My New Page - Aegis',
    description: 'Description for my new page',
    path: '/my-new-page',
  },
};
```

Then use in your page:

```tsx
export const metadata = generatePageMetadata('myNewPage');
```

### Customize OG Image

Edit `src/app/opengraph-image.tsx` to change:
- Colors
- Layout
- Text
- Graphics

## 📱 Mobile & PWA

The app is PWA-ready with:
- ✅ Web manifest
- ✅ Mobile viewport
- ✅ Touch icons
- ✅ Theme colors
- ✅ Responsive design

## 🚨 Troubleshooting

### Favicon not showing
- Clear browser cache
- Hard refresh (Cmd/Ctrl + Shift + R)
- Check browser console for 404 errors
- Verify files exist in `public/`

### OG image not updating
- Clear social media cache:
  - Facebook: Use debugger tool
  - Twitter: Wait 7 days or use validator
  - LinkedIn: Use post inspector

### Metadata not appearing
- Check if page is client component (`'use client'`)
- Metadata only works in Server Components
- Move metadata to layout if needed

### Build errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📚 Resources

- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

## ✅ Checklist

Before deploying to production:

- [ ] Generate PNG favicons
- [ ] Set `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Update social media links in config
- [ ] Test Open Graph with Facebook debugger
- [ ] Test Twitter Card with validator
- [ ] Run Lighthouse SEO audit
- [ ] Verify sitemap.xml is accessible
- [ ] Check robots.txt is correct
- [ ] Test on mobile devices
- [ ] Verify structured data with Google tool

## 🎉 You're Done!

Your app now has:
- ✅ Comprehensive SEO metadata
- ✅ Social sharing capabilities
- ✅ Beautiful favicons
- ✅ Open Graph images
- ✅ Structured data
- ✅ PWA support

For more details, see `SEO_IMPLEMENTATION.md`.


