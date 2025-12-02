import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/metadata';

// Image metadata
export const alt = siteConfig.title;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0f1e',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
        }}
      >
        {/* Shield Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 8L48 20V36C48 44.8366 40.8366 52 32 52C23.1634 52 16 44.8366 16 36V20L32 8Z"
              fill="url(#gradient1)"
            />
            <path
              d="M32 16L42 24V36C42 41.5228 37.5228 46 32 46C26.4772 46 22 41.5228 22 36V24L32 16Z"
              fill="url(#gradient2)"
            />
            <defs>
              <linearGradient
                id="gradient1"
                x1="16"
                y1="8"
                x2="48"
                y2="52"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0ea5e9" />
                <stop offset="0.5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
              <linearGradient
                id="gradient2"
                x1="22"
                y1="16"
                x2="42"
                y2="46"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 900,
            background: 'linear-gradient(to right, #0ea5e9, #8b5cf6, #10b981)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          AEGIS
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#e2e8f0',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          On-Chain Operating System for AI Finance
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#94a3b8',
            maxWidth: '900px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Programmable Smart Vaults for AI Agents on Solana
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            marginTop: '48px',
            gap: '64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0ea5e9' }}>
              100%
            </div>
            <div style={{ fontSize: 18, color: '#64748b' }}>On-Chain</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#8b5cf6' }}>
              Real-Time
            </div>
            <div style={{ fontSize: 18, color: '#64748b' }}>Monitoring</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#10b981' }}>
              0.05%
            </div>
            <div style={{ fontSize: 18, color: '#64748b' }}>Protocol Fee</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

