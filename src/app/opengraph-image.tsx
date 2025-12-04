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
          backgroundColor: '#f7f6f2',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(252, 80, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      >
        {/* Shield Icon with Orange background */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            width: '120px',
            height: '120px',
            borderRadius: '30px',
            backgroundColor: '#fc5000',
            boxShadow: '0 20px 40px rgba(252, 80, 0, 0.3)',
          }}
        >
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L20 6V12C20 17.5228 16.4183 22 12 22C7.58172 22 4 17.5228 4 12V6L12 2Z"
              fill="white"
              fillOpacity="0.3"
            />
            <path
              d="M12 4L18 7.5V12C18 16.4183 15.3137 20 12 20C8.68629 20 6 16.4183 6 12V7.5L12 4Z"
              fill="white"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="#fc5000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 900,
            color: '#151317',
            marginBottom: '16px',
            letterSpacing: '-0.03em',
          }}
        >
          AEGIS
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#151317',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          Guard Your AI Agents
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#6b6b6b',
            maxWidth: '900px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          On-Chain Operating System for AI Finance on Solana
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
            <div style={{ fontSize: 36, fontWeight: 700, color: '#fc5000' }}>
              100%
            </div>
            <div style={{ fontSize: 18, color: '#6b6b6b' }}>On-Chain</div>
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
            <div style={{ fontSize: 18, color: '#6b6b6b' }}>Monitoring</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#10b981' }}>
              Mainnet
            </div>
            <div style={{ fontSize: 18, color: '#6b6b6b' }}>Ready</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
