# SEO and Social Sharing Implementation

This document describes the comprehensive SEO and social sharing features implemented for Aegis.

## Features Implemented

### 1. Metadata Configuration (`src/lib/metadata/`)

**config.ts**
- Centralized site configuration
- SEO keywords and descriptions
- Social media links
- Page-specific metadata

**generator.ts**
- `generateMetadata()` - Creates comprehensive metadata
- `generatePageMetadata()` - Page-specific metadata
- `generateStructuredData()` - JSON-LD for rich snippets
- `generateOrganizationData()` - Organization schema

### 2. Root Layout (`src/app/layout.tsx`)

Enhanced with:
- Comprehensive metadata using Next.js 14 Metadata API
- Viewport configuration for responsive design
- Theme color for browser UI
- Structured data (JSON-LD) for:
  - Software Application schema
  - Organization schema
- Favicon links (all sizes)
- Web manifest
- Font preconnection for performance

### 3. Favicons and Icons

**Files Created:**
- `public/favicon.svg` - Modern SVG favicon with Aegis shield
- `public/site.webmanifest` - PWA manifest
- `public/browserconfig.xml` - IE/Edge tile configuration
- `public/robots.txt` - Search engine crawler rules

**Pending (See public/README-FAVICONS.md):**
- PNG favicons in various sizes (16x16, 32x32, 180x180, 192x192, 512x512)
- Generate using online tool or ImageMagick

### 4. Dynamic Open Graph Images

**Files:**
- `src/app/opengraph-image.tsx` - Auto-generated OG image
- `src/app/twitter-image.tsx` - Twitter card image

Features:
- Dynamic image generation using Next.js ImageResponse API
- Branded design with Aegis shield logo
- Gradient background
- Key stats and tagline

### 5. SEO Files

**Sitemap:**
- `src/app/sitemap.ts` - Auto-generated XML sitemap
- Automatically discovered by search engines at `/sitemap.xml`

**Robots.txt:**
- `public/robots.txt` - Crawler instructions
- Allows public pages, blocks admin/API routes

### 6. Social Sharing Component

**Component:** `src/components/shared/social-share.tsx`

Features:
- Native Web Share API support (mobile)
- Social media sharing:
  - Twitter/X
  - Facebook
  - LinkedIn
- Copy to clipboard functionality
- Toast notifications

Usage:
```tsx
import { SocialShare } from '@/components/shared/social-share';

<SocialShare 
  url="https://aegis.fi/vaults/123"
  title="Check out my AI Agent Vault"
  description="Secure smart vault on Solana"
/>
```

## Metadata Features

### Open Graph (Facebook, LinkedIn, etc.)
- ✅ og:title
- ✅ og:description
- ✅ og:image (1200x630)
- ✅ og:url
- ✅ og:type
- ✅ og:site_name
- ✅ og:locale

### Twitter Cards
- ✅ twitter:card (summary_large_image)
- ✅ twitter:site
- ✅ twitter:creator
- ✅ twitter:title
- ✅ twitter:description
- ✅ twitter:image

### Search Engine Optimization
- ✅ Meta title and description
- ✅ Keywords
- ✅ Canonical URLs
- ✅ Robots directives
- ✅ Author and publisher info
- ✅ Structured data (JSON-LD)

### Technical SEO
- ✅ XML Sitemap
- ✅ Robots.txt
- ✅ Mobile viewport
- ✅ Theme color
- ✅ PWA manifest
- ✅ Font optimization
- ✅ Preconnect hints

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://aegis.fi
```

For production deployment (Railway):
```env
NEXT_PUBLIC_APP_URL=https://aegis-app-production.up.railway.app
```

## Usage Examples

### Adding Metadata to a Page

**Server Component (Recommended):**
```tsx
import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata('vaults');

export default function VaultsPage() {
  // ... page content
}
```

**With Custom Overrides:**
```tsx
import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata('vaults', {
  title: 'My Custom Vault Title',
  image: '/custom-og-image.png',
});
```

**Custom Metadata:**
```tsx
import { generateMetadata } from '@/lib/metadata';

export const metadata = generateMetadata({
  title: 'Custom Page Title',
  description: 'Custom page description',
  path: '/custom-path',
});
```

### Adding Social Sharing to a Component

```tsx
'use client';

import { SocialShare } from '@/components/shared/social-share';
import { siteConfig } from '@/lib/metadata';

export function VaultDetails({ vault }) {
  const shareUrl = `${siteConfig.url}/vaults/${vault.id}`;
  
  return (
    <div>
      <h1>{vault.name}</h1>
      <SocialShare
        url={shareUrl}
        title={`Check out ${vault.name} on Aegis`}
        description="Secure AI agent vault on Solana"
      />
    </div>
  );
}
```

## Testing

### Test Metadata

1. **Development:**
   ```bash
   npm run dev
   ```
   Open browser DevTools > Network > Doc to see meta tags

2. **View Source:**
   Right-click page > View Page Source
   Look for `<meta>` tags in `<head>`

3. **Structured Data:**
   Visit: https://search.google.com/test/rich-results
   Test your production URL

### Test Open Graph

1. **Facebook Debugger:**
   https://developers.facebook.com/tools/debug/

2. **Twitter Card Validator:**
   https://cards-dev.twitter.com/validator

3. **LinkedIn Post Inspector:**
   https://www.linkedin.com/post-inspector/

### Test Mobile/PWA

1. **Lighthouse:**
   Chrome DevTools > Lighthouse > Run audit
   Check SEO, Best Practices, PWA scores

2. **Mobile-Friendly Test:**
   https://search.google.com/test/mobile-friendly

## Performance Considerations

- ✅ SVG favicon (small file size, scalable)
- ✅ Font preconnect for faster loading
- ✅ Optimized metadata (no duplicate tags)
- ✅ Lazy-loaded social sharing component
- ✅ Next.js automatic static optimization

## Next Steps

### Required Actions:

1. **Generate PNG Favicons:**
   ```bash
   # See public/README-FAVICONS.md for instructions
   ```

2. **Set Environment Variables:**
   - Add `NEXT_PUBLIC_APP_URL` to Railway
   - Update URLs in production

3. **Create Screenshot Assets:**
   - Take desktop screenshot (1280x720)
   - Take mobile screenshot (750x1334)
   - Add to `/public/` directory

### Optional Enhancements:

1. **Analytics:**
   - Add Google Analytics
   - Add privacy-friendly alternative (Plausible, Fathom)

2. **Social Proof:**
   - Add testimonials with schema markup
   - Add FAQ schema
   - Add BreadcrumbList schema

3. **Internationalization:**
   - Add `hreflang` tags
   - Support multiple languages

4. **Dynamic OG Images:**
   - Generate per-vault OG images
   - Add user stats to images

## Checklist

- ✅ Root layout metadata
- ✅ Favicon SVG
- ✅ Web manifest
- ✅ Robots.txt
- ✅ Sitemap.xml
- ✅ Structured data (JSON-LD)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Social sharing component
- ✅ Dynamic OG image generation
- ⏳ PNG favicons (pending generation)
- ⏳ Screenshot assets (pending)
- ⏳ Page-specific metadata (implement as needed)

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Web.dev SEO Guide](https://web.dev/lighthouse-seo/)


