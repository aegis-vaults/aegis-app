import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/metadata';

// Image metadata
export const alt = siteConfig.title;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Reuse the same image as OpenGraph
export { default } from './opengraph-image';


