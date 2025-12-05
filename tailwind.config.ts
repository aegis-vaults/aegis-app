import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "24px",
        sm: "40px",
        lg: "80px",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        // Bold, Distinctive Typography - Terminal/Cyber Aesthetic
        sans: ['Chakra Petch', 'sans-serif'],
        heading: ['Orbitron', 'sans-serif'],
        body: ['Chakra Petch', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        tight: '-0.01em',
      },
      colors: {
        // Original shadcn colors for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Caldera Design System Colors
        caldera: {
          // Primary
          orange: {
            DEFAULT: '#fc5000',
            secondary: '#eb4a00',
            accent: '#e21b00',
          },
          // Neutrals
          black: '#151317',
          'dark-gray': '#1f1e1f',
          'medium-gray': '#4f4e4e',
          'light-gray': '#f7f6f2',
          'off-white': '#dfdedb',
          white: '#FFFFFF',
          // Semantic
          success: '#177c5e',
          info: '#1358df',
          purple: '#524ae9',
          yellow: '#f5f28e',
          // Text
          text: {
            primary: '#000000',
            secondary: '#333333',
            muted: '#4f4e4e',
          },
        },
        // Aegis Dashboard Colors - Cyber/Dark Theme
        aegis: {
          // Background layers
          bg: {
            primary: '#0A0E27',
            secondary: '#1E2749',
            tertiary: '#2A3456',
          },
          // Text colors
          text: {
            primary: '#FFFFFF',
            secondary: '#B8C5D0',
            tertiary: '#7A8B9C',
          },
          // Accent colors
          blue: '#00D4FF',
          purple: '#B026FF',
          emerald: '#00FFA3',
          amber: '#FFB800',
          crimson: '#FF006E',
        },
      },
      backgroundImage: {
        'grid-white': 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        'caldera-gradient': 'linear-gradient(135deg, #4D3FFF 0%, #fc5000 100%)',
        'halftone-gradient': 'linear-gradient(135deg, #524ae9 0%, #fc5000 100%)',
        'dot-pattern': 'radial-gradient(circle, #151317 2px, transparent 2px)',
      },
      backgroundSize: {
        'grid': '64px 64px',
        'dot-pattern': '20px 20px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'caldera': '24px',
        'caldera-lg': '32px',
        'caldera-xl': '40px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      fontSize: {
        'hero': ['120px', { lineHeight: '1.0', letterSpacing: '-0.02em', fontWeight: '900' }],
        'hero-md': ['100px', { lineHeight: '1.0', letterSpacing: '-0.02em', fontWeight: '900' }],
        'hero-sm': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'display': ['80px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '900' }],
        'headline': ['52px', { lineHeight: '1.0', letterSpacing: '-0.01em', fontWeight: '800' }],
      },
      boxShadow: {
        'caldera': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'caldera-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.03)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
        "scale-in": "scale-in 0.3s ease-in-out",
      },
      transitionTimingFunction: {
        'caldera': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config




