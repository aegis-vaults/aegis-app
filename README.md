# Aegis Frontend

> **Production-grade frontend for the Aegis on-chain operating system for AI finance on Solana**

A beautiful, cyberpunk-themed Next.js dashboard for managing AI agent vaults with programmable guardrails.

## 🚀 Features

### ✅ Implemented

- **🎨 Cyberpunk UI/UX** - Dark theme with electric blue, neon purple, and emerald accents
- **💼 Vault Management** - View all vaults, check balances, monitor daily spending limits
- **📊 Dashboard** - Real-time overview of vaults, transactions, and metrics
- **💸 Transaction Monitoring** - View all transactions with status, amounts, and timestamps
- **📈 Analytics** - Placeholder analytics dashboard (ready for charts integration)
- **🔒 Security Center** - Security monitoring and settings
- **⚙️ Settings** - Account, notification, and appearance settings
- **🔗 Solana Wallet Integration** - Multi-wallet support (Phantom, Solflare, Backpack)
- **⚡ Real-time Updates** - React Query for automatic data fetching and caching
- **📱 Responsive Design** - Mobile-first, works on all devices

### 🚧 Ready for SDK Integration

The frontend is **fully prepared** for SDK integration. Placeholder functions in `/src/lib/solana/instructions.ts` are ready for Anchor/IDL integration.

## 📦 Tech Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS + Custom Cyberpunk Theme
- Radix UI + shadcn/ui Components
- Zustand + React Query
- Solana Wallet Adapter
- Framer Motion + Sonner

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000

## 📖 Full Documentation

See complete setup instructions, architecture details, and integration guides in the full README.

**Built with ⚡ by the Aegis team**
