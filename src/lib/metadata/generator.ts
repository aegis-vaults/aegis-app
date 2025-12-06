import { Metadata } from 'next';
import { siteConfig, pages, PageKey } from './config';

interface MetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
}

/**
 * Generate comprehensive metadata for SEO and social sharing
 */
export function generateMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title = siteConfig.title,
    description = siteConfig.description,
    image,
    path = '/',
    noIndex = false,
  } = options;

  const url = `${siteConfig.url}${path}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.creator.name }],
    creator: siteConfig.creator.name,
    publisher: siteConfig.creator.name,
    
    // Robots
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },

    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.creator.twitter,
      creator: siteConfig.creator.twitter,
      title,
      description,
      images: image ? [image] : undefined,
    },

    // Alternate URLs
    alternates: {
      canonical: url,
    },

    // Additional metadata
    other: {
      'msapplication-TileColor': '#fc5000',
      'theme-color': '#f7f6f2',
    },
  };
}

/**
 * Generate metadata for a specific page
 */
export function generatePageMetadata(pageKey: PageKey, overrides?: MetadataOptions): Metadata {
  const page = pages[pageKey];
  return generateMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    ...overrides,
  });
}

/**
 * Generate JSON-LD structured data for rich snippets
 */
export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: siteConfig.description,
    url: siteConfig.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
    author: {
      '@type': 'Organization',
      name: siteConfig.creator.name,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.creator.name,
      url: siteConfig.url,
    },
  };
}

/**
 * Generate organization structured data
 */
export function generateOrganizationData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
      siteConfig.links.discord,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      url: siteConfig.links.docs,
    },
  };
}


