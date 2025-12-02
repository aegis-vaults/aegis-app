# Aegis Frontend: Claude Code Implementation Prompts

This document contains a series of prompts to use with Claude Code to build out the Aegis frontend systematically. Each prompt is designed to be used sequentially and integrates with the actual aegis-protocol and aegis-guardian implementations.

---

## Prerequisites

Before starting, ensure:
- [ ] aegis-protocol is deployed to devnet
- [ ] aegis-guardian is running locally or deployed
- [ ] You have the program ID from aegis-protocol
- [ ] PostgreSQL and Redis are running for aegis-guardian
- [ ] You've reviewed `/Users/ryankaelle/dev/Aegis/aegis-todos/aegis-frontend-vision.md`

---

## Phase 1: Foundation & Setup (Prompts 1-5)

### Prompt 1: Initialize Project Structure

```
I'm building the frontend for Aegis, an on-chain operating system for AI finance on Solana. I need you to set up a production-ready Next.js 14+ project in the aegis-app directory with the following:

TECHNICAL STACK:
- Next.js 14+ with App Router
- TypeScript (strict mode)
- TailwindCSS + shadcn/ui components
- Framer Motion for animations
- Zustand for client state
- React Query (@tanstack/react-query) for server state
- Recharts for data visualization
- Solana wallet adapter (multi-wallet support)

PROJECT STRUCTURE:
```
aegis-app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Protected dashboard
│   │   ├── (marketing)/       # Public pages
│   │   └── api/               # Minimal API routes
│   ├── components/
│   │   ├── ui/                # shadcn base components
│   │   ├── dashboard/         # Dashboard-specific
│   │   ├── vault/             # Vault components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── api/               # API clients
│   │   ├── hooks/             # Custom hooks
│   │   ├── stores/            # Zustand stores
│   │   ├── solana/            # Solana/wallet utils
│   │   ├── utils/             # Utilities
│   │   └── constants/         # Constants
│   ├── types/                 # TypeScript types
│   └── styles/                # Global styles
├── public/                    # Static assets
└── tests/                     # Test files
```

DESIGN SYSTEM (Cyberpunk Theme):
- Primary background: #0A0E27 (deep navy)
- Secondary: #151B3B (elevated surfaces)
- Tertiary: #1E2749 (cards/panels)
- Accent colors: Electric blue (#00D4FF), Neon purple (#B026FF), Emerald (#00FFA3)
- Typography: Inter for UI, JetBrains Mono for code/data
- Dark mode by default

ENVIRONMENT VARIABLES (.env.local):
- NEXT_PUBLIC_GUARDIAN_API_URL (aegis-guardian backend URL)
- NEXT_PUBLIC_SOLANA_RPC_URL
- NEXT_PUBLIC_SOLANA_NETWORK (devnet/mainnet-beta)
- NEXT_PUBLIC_PROGRAM_ID (from aegis-protocol deployment)

Initialize the project with:
1. Next.js 14+ setup with App Router
2. Install all dependencies
3. Configure TailwindCSS with custom theme colors
4. Install and configure shadcn/ui
5. Set up TypeScript with strict configuration
6. Create the folder structure above
7. Create a basic layout.tsx with the cyberpunk theme
8. Set up Solana wallet adapter with multi-wallet support
9. Create a root page.tsx as a placeholder
10. Add a README.md with setup instructions

Do NOT implement features yet—just the foundation.
```

---

### Prompt 2: Create API Client & Types

```
Now I need to create the API client layer that integrates with aegis-guardian backend.

CONTEXT:
The aegis-guardian backend is a Next.js API running at NEXT_PUBLIC_GUARDIAN_API_URL with these endpoints:

**Vaults:**
- GET /api/vaults (query: page, pageSize, owner, guardian, isActive)
- POST /api/vaults (body: vault data)
- GET /api/vaults/:id
- PATCH /api/vaults/:id (body: updates)
- DELETE /api/vaults/:id

**Transactions:**
- GET /api/transactions (query: vaultId, status, from, to, startDate, endDate, minAmount, maxAmount)
- GET /api/transactions/:id

**Overrides:**
- GET /api/overrides (query: vaultId, status, requestedBy, approvedBy)
- GET /api/overrides/:id
- POST /api/overrides/:id (approve override)
- DELETE /api/overrides/:id (cancel override)

**Analytics:**
- GET /api/analytics/global (requires auth)
- GET /api/analytics/[vault] (query: timeRange = 7d/30d/90d)
- GET /api/analytics/[vault]/spending-trend (query: days = 30)
- GET /api/analytics/fees

**Actions/Blinks:**
- GET /api/actions/[vault]/[nonce]
- POST /api/actions/[vault]/[nonce]

Response format:
```typescript
{
  success: boolean;
  data?: any;
  error?: { code: string; message: string; details?: any };
  pagination?: { total: number; page: number; pageSize: number; hasNext: boolean };
}
```

TASK:
1. Create `src/types/api.ts` with TypeScript interfaces for:
   - Vault (from Prisma schema: id, publicKey, owner, guardian, name, dailyLimit, dailySpent, whitelistEnabled, whitelist, etc.)
   - Transaction (id, signature, vaultId, from, to, amount, status, blockReason, etc.)
   - Override (id, vaultId, transactionId, nonce, status, requestedAmount, destination, etc.)
   - Analytics types (VaultAnalytics, SpendingTrend, FeeAnalytics)
   - API response wrappers (ApiResponse<T>, PaginatedResponse<T>)

2. Create `src/lib/api/client.ts` with:
   - Base fetch wrapper with error handling
   - Auto-retry logic (3 attempts with exponential backoff)
   - Request/response interceptors
   - Type-safe methods for all endpoints above
   - Handle BigInt conversion (backend sends as strings)

3. Create `src/lib/api/vaults.ts` with vault-specific API methods:
   - listVaults(params)
   - getVault(id)
   - createVault(data) - NOTE: This is called by event listener, not directly by frontend usually
   - updateVault(id, data)
   - deleteVault(id)

4. Create `src/lib/api/transactions.ts` with transaction API methods
5. Create `src/lib/api/overrides.ts` with override API methods
6. Create `src/lib/api/analytics.ts` with analytics API methods

Use React Query for data fetching in hooks (we'll create those next).
```

---

### Prompt 3: Set Up Solana Integration

```
Now I need Solana/wallet integration to interact with the aegis-protocol smart contract.

CONTEXT:
The aegis-protocol program (ID: stored in NEXT_PUBLIC_PROGRAM_ID) has these instructions:
- initialize_vault(agent_signer, daily_limit, name)
- execute_guarded(amount)
- create_override(destination, amount, reason)
- approve_override()
- execute_approved_override()
- update_daily_limit(new_daily_limit)
- add_to_whitelist(address)
- remove_from_whitelist(address)
- pause_vault()
- resume_vault()
- update_agent_signer(new_agent_signer)

PDAs:
- VaultConfig: ["vault", authority.key()]
- vault_authority: ["vault_authority", vault.key()]
- PendingOverride: ["override", vault.key(), nonce.to_le_bytes()]
- FeeTreasury: ["treasury"]

TASK:
1. Create `src/lib/solana/config.ts`:
   - Solana connection setup
   - Program ID constants
   - Network configuration
   - RPC endpoint helpers

2. Create `src/lib/solana/pdas.ts`:
   - Helper functions to derive PDAs (getVaultPDA, getVaultAuthorityPDA, getOverridePDA, getTreasuryPDA)
   - Use @project-serum/anchor or @coral-xyz/anchor

3. Create `src/lib/solana/instructions.ts`:
   - Type-safe wrappers for each program instruction
   - Build transaction helpers
   - Transaction simulation before sending
   - Example: `buildInitializeVaultTx(connection, wallet, agentSigner, dailyLimit, name)`

4. Create `src/lib/solana/program.ts`:
   - Load program IDL (you'll need to copy IDL from aegis-protocol/target/idl/)
   - Create program instance
   - Account fetchers (fetchVaultConfig, fetchPendingOverride)

5. Create `src/lib/solana/events.ts`:
   - Event listener setup (subscribe to program logs)
   - Event parsers for the 13 event types
   - TypeScript types for events

6. Set up Solana wallet adapter in `src/app/providers.tsx`:
   - WalletAdapterNetwork configuration
   - ConnectionProvider
   - WalletProvider with multiple wallets (Phantom, Solflare, Backpack, etc.)
   - WalletModalProvider

All BigInt values from Solana should be handled carefully (amounts are in lamports).
```

---

### Prompt 4: Create Zustand Stores

```
Create client state management with Zustand stores.

STORES NEEDED:

1. `src/lib/stores/auth.ts`:
   - Current user wallet address
   - User ID (from guardian backend)
   - Connected wallet
   - Disconnect/connect handlers
   - Auth token (future)

2. `src/lib/stores/vaults.ts`:
   - Selected vault
   - Vault filters (status, search)
   - View mode (grid/list)
   - Sort order

3. `src/lib/stores/ui.ts`:
   - Sidebar collapsed state
   - Theme (dark/light)
   - Notification preferences
   - Modal states
   - Loading states

4. `src/lib/stores/realtime.ts`:
   - WebSocket connection status (future)
   - Live transaction feed
   - Pending notifications

Each store should:
- Use Zustand with TypeScript
- Persist relevant data to localStorage
- Include devtools integration
- Have clear action methods

Example structure:
```typescript
interface AuthState {
  walletAddress: string | null;
  userId: string | null;
  setWallet: (address: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        walletAddress: null,
        userId: null,
        setWallet: (address) => set({ walletAddress: address }),
        clearAuth: () => set({ walletAddress: null, userId: null }),
      }),
      { name: 'aegis-auth' }
    )
  )
);
```
```

---

### Prompt 5: Create React Query Hooks

```
Create React Query hooks for data fetching from aegis-guardian API.

HOOKS TO CREATE:

**Vault Hooks** (`src/lib/hooks/useVaults.ts`):
- useVaults(filters) - List vaults with pagination
- useVault(id) - Get single vault with related data
- useCreateVault() - Mutation for creating vault (rarely used directly)
- useUpdateVault() - Mutation for updating vault config
- useDeleteVault() - Mutation for soft-deleting vault

**Transaction Hooks** (`src/lib/hooks/useTransactions.ts`):
- useTransactions(filters) - List transactions with filtering
- useTransaction(id) - Get transaction details
- useVaultTransactions(vaultId, filters) - Transactions for specific vault

**Override Hooks** (`src/lib/hooks/useOverrides.ts`):
- useOverrides(filters) - List override requests
- useOverride(id) - Get override details
- useApproveOverride() - Mutation to approve override
- useCancelOverride() - Mutation to cancel override

**Analytics Hooks** (`src/lib/hooks/useAnalytics.ts`):
- useVaultAnalytics(vaultId, timeRange) - Vault metrics
- useSpendingTrend(vaultId, days) - Daily spending chart data
- useFeeAnalytics() - System-wide fee data
- useGlobalAnalytics() - Global metrics (requires auth)

**Solana Hooks** (`src/lib/hooks/useSolana.ts`):
- useVaultAccount(vaultPda) - Fetch on-chain vault account
- usePendingOverride(vaultPda, nonce) - Fetch pending override account
- useVaultBalance(vaultAuthorityPda) - Get vault SOL balance
- useInitializeVault() - Mutation to initialize vault on-chain
- useExecuteGuarded() - Mutation to execute guarded transaction
- useApproveOverrideOnchain() - Mutation to approve override on-chain

CONFIGURATION:
- Default staleTime: 30 seconds
- Default cacheTime: 5 minutes
- Retry: 3 attempts
- Refetch on window focus: true for critical data (vaults, transactions)
- Optimistic updates for mutations
- Error handling with toast notifications

Use query keys pattern:
```typescript
const vaultKeys = {
  all: ['vaults'] as const,
  lists: () => [...vaultKeys.all, 'list'] as const,
  list: (filters: VaultFilters) => [...vaultKeys.lists(), filters] as const,
  details: () => [...vaultKeys.all, 'detail'] as const,
  detail: (id: string) => [...vaultKeys.details(), id] as const,
};
```

Invalidate caches appropriately on mutations.
```

---

## Phase 2: Core UI Components (Prompts 6-10)

### Prompt 6: Create Base UI Components

```
Install and customize shadcn/ui components for the Aegis cyberpunk theme.

COMPONENTS TO ADD:
Run these shadcn/ui commands:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add command
```

THEN CUSTOMIZE:

1. Update `tailwind.config.ts` with Aegis cyberpunk colors:
   - Map primary to electric blue (#00D4FF)
   - Map secondary to neon purple (#B026FF)
   - Map success to emerald (#00FFA3)
   - Map destructive to crimson (#FF3366)
   - Background layers using deep navy shades

2. Create custom components in `src/components/ui/`:
   - `glassmorphic-card.tsx` - Card with blur and gradient border
   - `animated-counter.tsx` - Animated number counter (using Framer Motion)
   - `status-badge.tsx` - Colored badge with pulse animation for status
   - `data-table.tsx` - Enhanced table with sorting, filtering, pagination
   - `chart-card.tsx` - Card wrapper for Recharts visualizations
   - `loading-spinner.tsx` - Cyberpunk-themed loader
   - `empty-state.tsx` - Beautiful empty state illustrations
   - `command-palette.tsx` - Cmd+K search modal (using cmdk)

3. Create animation presets in `src/lib/utils/animations.ts`:
   - Fade in/out
   - Slide in from directions
   - Scale up/down
   - Data flow particles
   - Pulse glow effect
   - Number cascade (Matrix-style)

4. Update `src/styles/globals.css` with:
   - CSS custom properties for theme colors
   - Gradient utilities
   - Glow effect utilities
   - Scrollbar styling
   - Font imports (Inter, JetBrains Mono)

All components should have dark mode by default and match the cyberpunk aesthetic with subtle glows and gradients.
```

---

### Prompt 7: Create Layout & Navigation

```
Create the main application layout with navigation.

LAYOUT STRUCTURE:

1. `src/app/(dashboard)/layout.tsx`:
   - Top navigation bar (sticky)
   - Collapsible sidebar
   - Main content area
   - Notification bell (shows count)
   - Global command palette trigger (Cmd+K)

2. `src/components/shared/header.tsx`:
   - Logo and branding (left)
   - Global search trigger (center)
   - Network indicator (devnet/mainnet with colored dot)
   - Wallet connection button (right) - shows address when connected, truncated
   - User menu dropdown:
     - Settings
     - Support
     - Documentation link
     - Sign out (disconnect wallet)

3. `src/components/shared/sidebar.tsx`:
   - Navigation links with icons (from lucide-react):
     - Dashboard (LayoutDashboard icon)
     - Vaults (Vault icon)
     - Transactions (ArrowRightLeft icon)
     - Analytics (BarChart3 icon)
     - Team (Users icon)
     - Settings (Settings icon)
   - Active link highlighting with gradient border
   - Collapse/expand button (hamburger)
   - Collapsed state shows only icons with tooltips
   - Show vault count badge on Vaults link

4. `src/components/shared/command-palette.tsx`:
   - Cmd+K to open
   - Search across:
     - Vaults (by name, address)
     - Transactions (by signature, address)
     - Quick actions (Create vault, View analytics, etc.)
     - Documentation pages
   - Recent searches
   - Keyboard navigation
   - Group results by type

5. `src/components/shared/notification-center.tsx`:
   - Bell icon with unread count badge
   - Dropdown panel showing recent notifications:
     - Transaction executed
     - Transaction blocked
     - Override requested
     - Override approved
     - Policy updated
   - Click notification to navigate to relevant page
   - Mark as read/unread
   - Clear all button

MOBILE RESPONSIVENESS:
- Bottom navigation on mobile
- Slide-out drawer for sidebar
- Touch-friendly tap targets (min 44px)

Use Framer Motion for smooth animations when expanding/collapsing sidebar.
```

---

### Prompt 8: Create Vault Card Component

```
Create the core vault card component (Privacy.com inspired).

FILE: `src/components/vault/vault-card.tsx`

DESIGN:
- Glassmorphic card with blur effect
- Gradient border (changes color based on vault status)
- Size: ~300px width, responsive height
- Hover: Lift effect, show quick actions

CONTENT LAYOUT:
```
┌─────────────────────────────┐
│ [Icon]  Vault Name      [...│  <- Header (3-dot menu)
│                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━┓     │  <- Balance (large, animated counter)
│ ┃ $1,234.56 SOL       ┃     │
│ ┗━━━━━━━━━━━━━━━━━━━━━┛     │
│                             │
│ Spent today: $123 / $500    │  <- Progress bar
│ [=========>----------]      │
│                             │
│ Status: [Active ●]          │  <- Status badge with pulse
│ Agent: Connected ✓          │  <- Agent status
│                             │
│ [Pause] [Fund] [Settings]   │  <- Quick actions (show on hover)
└─────────────────────────────┘
```

PROPS:
```typescript
interface VaultCardProps {
  vault: Vault; // From API types
  onClick?: () => void;
  onPause?: (vaultId: string) => void;
  onFund?: (vaultId: string) => void;
  onSettings?: (vaultId: string) => void;
}
```

FEATURES:
- Animated counter for balance (using AnimatedCounter component)
- Progress bar for daily spend (with color gradient based on percentage):
  - 0-50%: Emerald (#00FFA3)
  - 51-80%: Amber (#FFB800)
  - 81-100%: Crimson (#FF3366)
- Status badge with pulse animation when active
- Fetch real-time balance from vault_authority PDA using useVaultBalance
- Show mini transaction history (last 3 transactions, just amount and arrow)
- Skeleton loader while data loading
- Error state if vault data fetch fails
- Click card to navigate to vault detail page
- Drag handle for reordering (use @dnd-kit/sortable)

VARIANTS:
- Default: Full card
- Compact: Smaller version for lists
- Create: Special card with + icon to create new vault

Use Framer Motion for hover effects and animations.
```

---

### Prompt 9: Create Transaction List & Detail

```
Create components for displaying and managing transactions.

COMPONENTS:

1. `src/components/dashboard/transaction-list.tsx`:
   - Table view with columns:
     - Status icon (✓ green for EXECUTED, ✗ red for BLOCKED, ⏳ amber for PENDING)
     - Time (relative, e.g., "2 minutes ago")
     - From → To (truncated addresses with copy button)
     - Amount (formatted with currency, e.g., "0.5 SOL")
     - Vault name (link to vault)
     - Actions (View details, Solscan link)
   - Pagination (use shadcn/ui table)
   - Loading skeleton
   - Empty state ("No transactions yet")
   - Real-time updates (optimistic updates when new tx occurs)

2. `src/components/dashboard/transaction-filters.tsx`:
   - Filter controls:
     - Status select (All, Executed, Blocked, Failed)
     - Vault select (multi-select)
     - Date range picker
     - Amount range (min/max inputs)
     - From/To address inputs
   - Apply/Reset buttons
   - Show active filter count badge

3. `src/components/dashboard/transaction-detail-modal.tsx`:
   - Dialog/modal showing full transaction details:
     - Header: Status, timestamp, signature (copy button)
     - Sections:
       - Transaction Info: From, To, Amount, Fee
       - Vault Info: Name, link to vault page
       - Agent Reasoning (if available from metadata)
       - Policy Check Results (which rules passed/failed)
       - Block Reason (if blocked)
       - Override Info (if override exists, link to override)
       - Blink (if generated, shareable link)
     - Explorer Links: Solscan, Solana Explorer (buttons with external link icon)
     - Actions: Request Override (if blocked), Export JSON
   - Beautiful JSON viewer for raw transaction data (expandable)
   - Close button

4. `src/components/dashboard/transaction-feed.tsx`:
   - Real-time feed (live updates)
   - Shows last 10 transactions across all vaults
   - Animated entry (slide in from top)
   - Click to expand to full details
   - Auto-scroll to newest (with pause on hover)
   - Filter button to show only certain types

INTEGRATION:
- Use useTransactions hook with filters
- Use React Query's automatic refetch
- Show toast notification when new transaction appears
- Link to vault detail pages
- Copy address functionality with toast confirmation

STYLING:
- Glassmorphic table rows with hover effect
- Color-coded status indicators
- Monospace font for addresses and signatures
- Animated counters for amounts
```

---

### Prompt 10: Create Override Management UI

```
Create components for override request workflow.

COMPONENTS:

1. `src/components/vault/override-request-modal.tsx`:
   - Modal triggered when transaction is blocked
   - Shows blocked transaction details
   - Form to request override with:
     - Destination (pre-filled, readonly)
     - Amount (pre-filled, readonly)
     - Reason (textarea, required, user explains why override needed)
   - Preview: Shows what will happen if approved
   - Submit button: "Request Override"
   - On submit:
     - Calls create_override instruction on-chain
     - Shows success toast with Blink link
     - Closes modal

2. `src/components/vault/override-card.tsx`:
   - Card showing pending override request
   - Layout:
     ```
     ┌─────────────────────────────┐
     │ Override Request #1234      │
     │ Status: [PENDING]           │
     │                             │
     │ Amount: 1.5 SOL             │
     │ Destination: abc...xyz      │
     │ Requested: 5 min ago        │
     │ Expires: in 55 minutes      │
     │                             │
     │ [Approve] [Reject] [Share]  │
     └─────────────────────────────┘
     ```
   - Color-coded by status (PENDING = amber, APPROVED = green, EXPIRED = gray)
   - Countdown timer until expiration
   - Actions:
     - Approve: Opens confirmation dialog, then calls approve_override on-chain
     - Reject: Calls cancel override via guardian API
     - Share: Copies Blink URL

3. `src/components/vault/override-approval-dialog.tsx`:
   - Confirmation dialog before approving override
   - Shows risk assessment:
     - Amount vs. daily limit
     - Destination address (check if known/safe)
     - Time since request
   - Checkbox: "I understand this will execute immediately after approval"
   - Approve button (connects wallet, signs transaction)
   - Uses useApproveOverrideOnchain hook

4. `src/components/vault/override-list.tsx`:
   - List of all overrides for a vault
   - Tabs: All, Pending, Approved, Expired, Cancelled
   - Shows OverrideCard for each
   - Pagination
   - Filter by date range, status, requester

5. `src/components/shared/blink-share-button.tsx`:
   - Button that generates shareable Blink URL
   - Click to copy URL
   - Shows preview of how Blink will appear in wallet
   - Social share options (Twitter, Telegram, Discord)

INTEGRATION:
- Use useOverrides hook
- Real-time status updates (refetch on interval for pending overrides)
- Toast notifications for status changes
- Navigate to transaction detail after override executed
- Handle expired overrides gracefully (show expired state, disable actions)

FEATURES:
- Auto-refresh pending overrides every 10 seconds
- Notification when override expires
- Confetti animation when override approved (using canvas-confetti)
```

---

## Phase 3: Dashboard & Analytics (Prompts 11-15)

### Prompt 11: Create Dashboard Home Page

```
Create the main dashboard landing page at `src/app/(dashboard)/dashboard/page.tsx`.

LAYOUT:
```
┌────────────────────────────────────────────────────────┐
│ [Hero Metrics Panel]                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Total    │ │ Active   │ │ 24h Vol  │ │ Fees     │  │
│ │ Assets   │ │ Agents   │ │ $12.3K   │ │ Earned   │  │
│ │ $45.6K   │ │ 12 ✓     │ │ ↑ 12%    │ │ $23.45   │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├────────────────────────────────────────────────────────┤
│ Quick Actions:                                          │
│ [+ Create Vault] [View All Analytics] [Documentation]  │
├─────────────────────────────┬──────────────────────────┤
│ Your Vaults                 │ Live Activity Feed       │
│ [Grid/List Toggle] [Search]│ [Filter ▼]               │
│                             │                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ │ 🟢 Tx approved (2m ago) │
│ │ V1   │ │ V2   │ │ V3   │ │ 🔴 Tx blocked (5m ago)  │
│ └──────┘ └──────┘ └──────┘ │ 🟢 Tx executed (8m ago) │
│ ┌──────┐ ┌──────┐ ┌──────┐ │ ⚠️  Override req (12m)  │
│ │ V4   │ │ V5   │ │ [+]  │ │ 🟢 Tx executed (15m)    │
│ └──────┘ └──────┘ └──────┘ │ [View All]              │
└─────────────────────────────┴──────────────────────────┘
```

SECTIONS:

1. **Hero Metrics Panel:**
   - 4 stat cards in a row (responsive: 2x2 on mobile)
   - Each card shows:
     - Icon (relevant Lucide icon)
     - Label
     - Large animated counter for value
     - Small trend indicator (↑ 12% or ↓ 5%)
     - 7-day sparkline chart
   - Metrics:
     - Total Assets: Sum of all vault balances
     - Active Agents: Count of connected agents with health status
     - 24h Volume: Total transaction volume last 24h
     - Fees Earned: Total protocol fees collected
   - Data from useGlobalAnalytics hook
   - Skeleton loaders while loading

2. **Quick Actions Bar:**
   - 3-4 large, prominent buttons:
     - Create New Vault (opens wizard modal)
     - View All Analytics (navigate to /analytics)
     - Run Diagnostics (run health check on all vaults)
     - Documentation (external link)
   - Icon + label

3. **Vault Grid/List:**
   - Toggle between grid and list view (saved in UI store)
   - Grid: VaultCard components in responsive grid (3 cols desktop, 2 tablet, 1 mobile)
   - List: Compact table view
   - Search bar (filters by vault name or address)
   - Sort dropdown (by balance, name, activity, created date)
   - Special card for "+ Create Vault" (always visible)
   - Drag-to-reorder with visual feedback (save order to localStorage)
   - Empty state if no vaults: Beautiful illustration + CTA to create first vault
   - Uses useVaults hook with filters from vault store

4. **Live Activity Feed (Right Sidebar):**
   - Real-time transaction feed (last 20 across all vaults)
   - Each item shows:
     - Status emoji (✓, ✗, ⏳, ⚠️)
     - Transaction type (Approved, Blocked, Executed, Override)
     - Relative time
     - Click to open transaction detail modal
   - Auto-scroll with pause-on-hover
   - Filter button (show only certain types)
   - "View All" button navigates to /transactions
   - Uses useTransactions with auto-refetch
   - Animated entry (slide in from top)

INTEGRATIONS:
- Fetch vaults with useVaults()
- Fetch analytics with useGlobalAnalytics()
- Real-time balance updates using Solana account subscriptions
- Toast notifications for new activity

ANIMATIONS:
- Counters animate on mount
- Cards fade in with stagger effect
- Feed items slide in from top
- Hover effects on interactive elements

EMPTY STATES:
- No vaults: Show illustration + "Create your first vault" CTA
- No activity: Show "No recent activity" message
```

---

### Prompt 12: Create Vault Detail Page

```
Create the comprehensive vault detail page at `src/app/(dashboard)/vaults/[id]/page.tsx`.

URL: `/vaults/:vaultId`

LAYOUT:
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Vaults                                          │
│                                                           │
│ [Vault Icon] Vault Name                    [Edit] [●●●]  │
│ Owner: abc...xyz | Guardian: def...uvw                   │
├───────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ Balance      │ │ Daily Spend  │ │ Transactions │      │
│ │ 5.234 SOL    │ │ $123 / $500  │ │ 1,234 total  │      │
│ └──────────────┘ └──────────────┘ └──────────────┘      │
├───────────────────────────────────────────────────────────┤
│ [Overview] [Transactions] [Policy] [Overrides] [Team]    │  <- Tabs
│                                                           │
│ (Tab content)                                             │
└───────────────────────────────────────────────────────────┘
```

SECTIONS:

1. **Page Header:**
   - Breadcrumb: Dashboard > Vaults > [Vault Name]
   - Vault name (editable inline)
   - Owner and Guardian addresses (with copy buttons)
   - Status badge (Active/Paused) with toggle to pause/resume
   - Edit button (opens settings modal)
   - 3-dot menu:
     - Fund Vault
     - Export Data
     - Clone Vault
     - Delete Vault

2. **Quick Stats Cards (Row of 4):**
   - Balance: Current vault_authority balance
   - Daily Spend: Progress bar showing spent/limit
   - Total Transactions: Count (EXECUTED, BLOCKED, FAILED)
   - Active Overrides: Count of PENDING overrides

3. **Tabs:**

   **Tab 1: Overview**
   - Spending chart (last 30 days, line chart)
   - Recent transactions (last 10, mini table)
   - Agent status card:
     - Connection status (Connected/Disconnected)
     - Last seen timestamp
     - Health score
     - Performance metrics
   - Quick actions:
     - Execute Test Transaction
     - View All Transactions
     - Manage Policy

   **Tab 2: Transactions**
   - Full TransactionList component
   - Advanced filters (TransactionFilters component)
   - Export button (CSV/JSON)
   - Pagination
   - Real-time updates

   **Tab 3: Policy**
   - Policy editor interface:
     - Daily Limit: Input with SOL/USDC selector + Update button
     - Whitelist Management:
       - List of whitelisted addresses (max 20)
       - Each with remove button
       - Add new address input + Add button
       - Shows count: "12/20 addresses"
     - Override Settings:
       - Override delay slider
       - Auto-approve rules (future)
     - Agent Signer:
       - Current signer address
       - Rotate Agent Key button
   - Policy History: Table showing all policy updates with timestamp and changed fields
   - Save/Cancel buttons
   - Uses useUpdateVault mutation

   **Tab 4: Overrides**
   - OverrideList component
   - Shows all override requests for this vault
   - Tabs: All, Pending, Approved, Expired, Cancelled
   - Request Override button (opens modal)
   - Approve/Reject actions

   **Tab 5: Team** (future feature, placeholder for now)
   - Team member list
   - Invite member form
   - Role management
   - Activity log per member

INTEGRATIONS:
- useVault(vaultId) for vault data
- useVaultTransactions(vaultId) for transactions
- useOverrides({ vaultId }) for overrides
- useVaultAccount(vaultPda) for on-chain balance
- useUpdateVault() for policy updates

FEATURES:
- Real-time balance updates (poll every 10s or use WebSocket)
- Optimistic updates when editing policy
- Confirmation dialogs for destructive actions (delete, pause)
- Toast notifications for all actions
- Skeleton loaders for each section
- Error boundaries for failed data fetches

ANIMATIONS:
- Tab transitions (smooth fade)
- Chart animations
- Counter animations for stats
```

---

### Prompt 13: Create Analytics Dashboard

```
Create comprehensive analytics page at `src/app/(dashboard)/analytics/page.tsx`.

LAYOUT:
```
┌──────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                       │
│ [Global] [By Vault ▼]           Time Range: [30 days ▼]  │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ Spending Trend     │ │ Volume Breakdown   │           │
│ │ (Line Chart)       │ │ (Donut Chart)      │           │
│ │                    │ │ - Executed: 80%    │           │
│ │                    │ │ - Blocked: 15%     │           │
│ │                    │ │ - Failed: 5%       │           │
│ └────────────────────┘ └────────────────────┘           │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ Top Destinations   │ │ Block Reasons      │           │
│ │ (Bar Chart)        │ │ (Bar Chart)        │           │
│ └────────────────────┘ └────────────────────┘           │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ Fee Collection     │ │ Agent Performance  │           │
│ │ (Area Chart)       │ │ (Table)            │           │
│ └────────────────────┘ └────────────────────┘           │
└──────────────────────────────────────────────────────────┘
```

SECTIONS:

1. **Page Header:**
   - Title: "Analytics Dashboard"
   - View selector: Global (all vaults) or specific vault dropdown
   - Time range selector: 7d, 30d, 90d, Custom (date picker)
   - Export button: Download report (PDF or CSV)

2. **Spending Trend Chart:**
   - Line chart showing daily spending over time period
   - Uses Recharts <LineChart>
   - X-axis: Dates
   - Y-axis: Amount (formatted currency)
   - Multiple lines if comparing vaults
   - Tooltip shows exact amount + date
   - Gradient fill under line
   - Data from useSpendingTrend hook

3. **Volume Breakdown:**
   - Donut chart showing transaction types
   - Segments: EXECUTED, BLOCKED, FAILED
   - Color-coded (green, red, gray)
   - Center shows total volume
   - Legend with percentages
   - Uses Recharts <PieChart>

4. **Top Destinations:**
   - Horizontal bar chart
   - Shows top 10 destination addresses by total volume
   - Addresses truncated with tooltips showing full address
   - Click bar to filter transactions by that destination
   - Uses Recharts <BarChart>

5. **Block Reasons:**
   - Horizontal bar chart
   - Shows distribution of block reasons:
     - Not Whitelisted
     - Daily Limit Exceeded
     - Insufficient Funds
   - Count of blocks per reason
   - Color-coded

6. **Fee Collection:**
   - Area chart showing daily fees collected
   - Cumulative line overlay showing total fees over time
   - Uses Recharts <AreaChart>
   - Data from useFeeAnalytics hook

7. **Agent Performance Table:**
   - Table comparing all agents (if multiple vaults)
   - Columns:
     - Agent Name/ID
     - Success Rate (%)
     - Total Volume
     - Average Tx Size
     - Blocked Count
     - Cost Efficiency (fees/volume)
   - Sort by any column
   - Click row to view agent details

FEATURES:
- All charts responsive (scale on mobile)
- Interactive: Click chart elements to drill down
- Export charts as PNG
- Date range comparison (e.g., this month vs last month)
- Tooltips on all data points
- Loading skeletons for each chart
- Empty state if no data in selected range
- Auto-refresh every 60 seconds

INTEGRATIONS:
- useVaultAnalytics(vaultId, timeRange) if specific vault
- useGlobalAnalytics() if global view
- useSpendingTrend(vaultId, days)
- useFeeAnalytics()

STYLING:
- ChartCard component wrapper for each chart
- Glassmorphic card backgrounds
- Neon accent colors for chart lines/bars
- Grid layout responsive (2 cols desktop, 1 col mobile)
```

---

### Prompt 14: Create Vault Creation Wizard

```
Create a multi-step wizard for creating new vaults at `src/components/vault/vault-creation-wizard.tsx`.

TRIGGER: "+ Create Vault" button from dashboard

MODAL/DIALOG with STEPS:

**Step 1: Choose Template**
- 3 pre-configured templates (cards with hover effect):
  - **Trading Bot:**
    - Icon: TrendingUp
    - Description: "Automated trading with daily limits"
    - Default config: $1000/day limit, whitelisted to Jupiter, Raydium
  - **DeFi Automation:**
    - Icon: Workflow
    - Description: "Yield farming and liquidity management"
    - Default config: $5000/day limit, whitelisted to Orca, Raydium, Marinade
  - **Payment Agent:**
    - Icon: Wallet
    - Description: "Recurring payments and subscriptions"
    - Default config: $100/day limit, custom whitelist
  - **Custom:**
    - Icon: Settings
    - Description: "Configure from scratch"
- Select one, then "Next"

**Step 2: Basic Configuration**
- Form fields:
  - Vault Name (input, required, max 50 chars)
  - Daily Spending Limit (number input with SOL/USDC selector)
  - Agent Signer Public Key (input, validates base58, required)
    - Help text: "This is your AI agent's signing key"
    - Button: "Generate New Keypair" (for testing)
  - Vault Icon (optional, emoji or image picker)
- Preview card on right side showing how vault will look
- Validation errors inline
- "Back" and "Next" buttons

**Step 3: Policy Rules**
- Whitelist configuration:
  - Toggle: "Enable Whitelist" (if off, skip whitelist section)
  - If enabled:
    - Add address input + "Add" button
    - List of added addresses (max 20) with remove buttons
    - Pre-populate from template if selected
- Override settings:
  - Override delay (slider, 0-3600 seconds, default 3600)
  - Help text explaining what override delay means
- Preview policy summary on right

**Step 4: Funding**
- Show vault address (will be derived PDA, show before creation)
- Funding options:
  - **Option 1: Fund Now**
    - Amount input (SOL)
    - "Fund Vault" button (executes transfer to vault_authority PDA)
  - **Option 2: Fund Later**
    - Shows vault address to copy
    - Note: "You can fund this vault anytime"
- Minimum balance warning (need ~0.01 SOL for rent)

**Step 5: Review & Create**
- Summary of all settings:
  - Vault name
  - Daily limit
  - Agent signer
  - Whitelist (collapsed list, expandable)
  - Override delay
  - Funding amount
- "Edit" links to go back to specific steps
- Large "Create Vault" button
- Terms checkbox: "I understand I am responsible for securing my vault"

**On Submit:**
1. Build and sign initialize_vault transaction (useInitializeVault hook)
2. Show loading state with steps:
   - "Creating vault account..."
   - "Initializing configuration..."
   - "Funding vault..." (if selected)
   - "Finalizing..."
3. On success:
   - Confetti animation 🎉
   - Success message with vault link
   - "View Vault" and "Create Another" buttons
   - Blink generated for sharing
4. On error:
   - Show error message
   - "Retry" button
   - Option to save draft (to localStorage)

FEATURES:
- Multi-step progress indicator at top (1/5, 2/5, etc.)
- Can navigate back to edit previous steps
- Form state persisted to localStorage (draft)
- Resume draft if page refreshed
- Keyboard shortcuts (Enter to next, Esc to close)
- Mobile responsive (full screen on mobile)

VALIDATIONS:
- Vault name: Required, 1-50 chars
- Daily limit: Must be > 0
- Agent signer: Valid base58 address
- Whitelist addresses: Valid base58, max 20, no duplicates

INTEGRATIONS:
- useInitializeVault() for on-chain creation
- After creation, invalidate vault cache to show new vault immediately
```

---

### Prompt 15: Create Transaction Execution Interface

```
Create interface for executing transactions at `src/components/vault/execute-transaction-form.tsx`.

USAGE: Embedded in vault detail page or standalone modal

FORM LAYOUT:
```
┌────────────────────────────────────────┐
│ Execute Transaction                     │
├────────────────────────────────────────┤
│ Vault: [Select Vault ▼]                │
│                                         │
│ Destination Address:                    │
│ [____________________________]          │
│ ✓ Whitelisted | ✗ Not Whitelisted      │
│                                         │
│ Amount:                                 │
│ [________] [SOL ▼] [Max]                │
│ Available: 5.234 SOL                    │
│                                         │
│ Daily Limit Check:                      │
│ [=====>----------] 45% used             │
│ This tx will use: 0.5 SOL (10%)         │
│ After tx: [========>--------] 55%       │
│                                         │
│ Policy Simulation:                      │
│ ✓ Destination whitelisted               │
│ ✓ Within daily limit                    │
│ ✓ Sufficient funds                      │
│ ✓ Vault not paused                      │
│                                         │
│ Fee: 0.0025 SOL (0.05%)                 │
│ Total: 0.5025 SOL                       │
│                                         │
│ [Simulate] [Execute Transaction]        │
└────────────────────────────────────────┘
```

FEATURES:

1. **Vault Selector:**
   - Dropdown of user's vaults
   - Shows vault name + balance
   - Auto-select if coming from vault detail page

2. **Destination Input:**
   - Text input for address
   - Validate base58 format
   - Check against whitelist in real-time
   - Show status: ✓ Whitelisted (green) or ✗ Not Whitelisted (red)
   - If not whitelisted, show warning: "This transaction will be blocked. You'll need to request an override."

3. **Amount Input:**
   - Number input
   - Currency selector (SOL/USDC)
   - "Max" button to fill with available balance minus fee
   - Show available balance below input
   - Convert to lamports internally

4. **Daily Limit Visualization:**
   - Progress bar showing current daily spend
   - Calculate new percentage after this transaction
   - Preview bar showing "after transaction" state
   - Warnings if will exceed limit

5. **Policy Simulation:**
   - Run checks before submitting:
     - Is destination whitelisted?
     - Will it exceed daily limit?
     - Does vault have sufficient funds?
     - Is vault paused?
   - Show ✓ or ✗ for each check
   - If any fail, explain what will happen (override needed)

6. **Fee Display:**
   - Calculate protocol fee (0.05% of amount)
   - Show fee + total cost
   - Warning if fee significant

7. **Action Buttons:**
   - **Simulate:** Dry-run the transaction (calls Solana's simulateTransaction)
     - Shows simulation result in expandable section
     - Logs output, compute units used
     - Helpful for debugging
   - **Execute Transaction:**
     - If all checks pass: Calls execute_guarded on-chain
     - If will be blocked: Shows warning and offers "Request Override" instead
     - Loading state during submission
     - Success: Show success message + transaction signature + Solscan link
     - Error: Show error message with retry option

8. **Override Flow Integration:**
   - If transaction will be blocked, transform button to "Request Override"
   - Click opens OverrideRequestModal with pre-filled data

VALIDATIONS:
- Destination: Required, valid base58
- Amount: Must be > 0, must be ≤ available balance (minus fee)
- Vault: Must be selected

INTEGRATIONS:
- useVault(vaultId) to get vault config
- useVaultBalance(vaultAuthorityPda) for available balance
- useExecuteGuarded() mutation for transaction submission
- useCreateOverride() if blocked

REAL-TIME FEEDBACK:
- As user types destination, check whitelist
- As user types amount, update daily limit preview
- As user changes any field, re-run policy simulation

ERROR HANDLING:
- Network errors: Retry button
- Insufficient funds: Suggest funding vault
- Blocked transaction: Explain and offer override
- Signature rejected: Clear message

STYLING:
- Policy checks use green/red/amber indicators
- Progress bars with gradient based on percentage
- Glassmorphic card background
- Disabled state when checks fail (unless requesting override)
```

---

## Phase 4: Advanced Features (Prompts 16-20)

### Prompt 16: Create Agent Observatory Dashboard

```
Create the Agent Observatory feature at `src/app/(dashboard)/agents/page.tsx`.

PURPOSE: Real-time monitoring and debugging of AI agents.

LAYOUT:
```
┌───────────────────────────────────────────────────────┐
│ Agent Observatory                                      │
│ [All Agents] [By Vault ▼]      [Auto-refresh: ON ●]   │
├───────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Agent1│ │Agent2│ │Agent3│ │Agent4│                  │
│ │✓ 98% │ │⚠ 75% │ │✓100% │ │✗ 0%  │  <- Health cards│
│ └──────┘ └──────┘ └──────┘ └──────┘                  │
├───────────────────────────────────────────────────────┤
│ [Selected: Agent 1 - Trading Bot]                     │
│                                                       │
│ [Heartbeat] [Decisions] [Performance] [Errors]        │ <- Tabs
│                                                       │
│ (Tab content)                                         │
└───────────────────────────────────────────────────────┘
```

COMPONENTS:

1. **Agent Health Cards:**
   - One card per agent (agent = vault with connected AI)
   - Shows:
     - Agent name (vault name)
     - Health score (0-100)
     - Status: Active (green), Idle (amber), Error (red), Disconnected (gray)
     - Last seen timestamp
     - Uptime percentage (last 24h)
   - Click to select agent for detailed view
   - Color-coded border based on health
   - Pulse animation for active agents

2. **Selected Agent Tabs:**

   **Tab 1: Heartbeat Monitor**
   - Real-time activity graph (last 1 hour)
   - Line chart showing:
     - Transaction attempts per minute
     - Success rate (%)
     - Average latency (ms)
   - Shows live "ping" indicator
   - Data points: Transaction count, timestamp
   - Auto-refreshes every 10 seconds
   - Empty state if no activity

   **Tab 2: Decision Log**
   - Real-time stream of agent decisions
   - Each log entry shows:
     - Timestamp
     - Input: What the agent was trying to do (e.g., "Swap 50 USDC for SOL")
     - Decision: What it decided (e.g., "Execute transaction")
     - Policy Check Results: ✓/✗ for each policy rule
     - Outcome: Success/Blocked/Failed
     - Reason (if blocked)
   - Expandable entries with full JSON data
   - Syntax highlighting for structured data
   - Filter by: All, Approved, Blocked, Failed
   - Search functionality
   - Export log (CSV/JSON)
   - Uses transaction data with enriched metadata
   - Color-coded by outcome
   - Terminal-style display with monospace font

   **Tab 3: Performance Metrics**
   - Cards showing:
     - Total Transactions (count, chart)
     - Success Rate (%, donut chart)
     - Average Latency (ms, line chart over time)
     - Total Volume (SOL/USDC, counter)
     - Cost per Transaction (protocol fees + RPC costs)
     - Daily Cost (total fees)
   - Comparison to other agents (percentile rank)
   - Time range selector: 24h, 7d, 30d
   - Benchmark against "similar agents" (if data available)
   - Suggested optimizations (if success rate low or costs high)

   **Tab 4: Error Console**
   - Terminal-style error log
   - Each error shows:
     - Timestamp
     - Error type (e.g., "PolicyViolation", "InsufficientFunds")
     - Transaction signature (if available)
     - Stack trace (if available)
     - How to fix (suggested action)
   - Filter by severity: All, Critical, Warning, Info
   - Search functionality
   - "Resolve" button to mark as acknowledged
   - Integration with Sentry for detailed error tracking
   - Link to transaction detail if error was during tx

FEATURES:
- Auto-refresh toggle (on by default, refreshes every 10s)
- Real-time updates using WebSocket (future) or polling
- Select multiple agents to compare (side-by-side view)
- Export all data (reports, logs)
- Agent health scoring algorithm:
  - Success rate: 40%
  - Uptime: 30%
  - Latency: 20%
  - Policy compliance: 10%
- Notification when agent goes offline or error rate spikes
- Quick actions:
  - Restart agent (if self-hosted)
  - Update configuration
  - View vault settings

INTEGRATIONS:
- useVaults() to get all vaults (each vault = one agent)
- useVaultTransactions(vaultId) for decision log
- useVaultAnalytics(vaultId) for performance metrics
- Custom hook: useAgentHealth(vaultId) (calculate health score from transaction data)

DATA SOURCES:
- Agent "decisions" = transactions (use transaction metadata and status)
- Agent "heartbeat" = transaction frequency over time
- Agent "errors" = failed transactions and block reasons

STYLING:
- NASA mission control inspired
- Dark background with bright accent colors
- Health cards with status-colored borders and glows
- Terminal-style logs with monospace font
- Line charts with neon accent colors
- Responsive: Stack cards vertically on mobile
```

---

### Prompt 17: Create Automation Studio (Visual Workflow Builder)

```
Create a visual workflow automation builder at `src/app/(dashboard)/automation/page.tsx`.

PURPOSE: Zapier-style automation for multi-vault orchestration and event-driven actions.

LIBRARIES:
- Install @xyflow/react (React Flow) for node-based editor
- Lucide React for icons
- Zod for workflow validation

LAYOUT:
```
┌────────────────────────────────────────────────────────┐
│ [< Back]  Automation Studio                  [+ New]   │
│ [Your Workflows ▼] | [Templates] | [History]           │
├────────────────────────────────────────────────────────┤
│ [Toolbar: Nodes] [Test] [Save] [Deploy]                │
├────────────────────────────────────────────────────────┤
│                                                        │
│    ┌──────────┐        ┌──────────┐                   │
│    │ Trigger  │───────▶│Condition │                   │
│    │ On Block │        │ Amount >│                   │
│    └──────────┘        └──────────┘                   │
│                             │                         │
│                             ▼                         │
│                        ┌──────────┐                   │
│                        │ Action   │                   │
│                        │ Notify  │                   │
│                        └──────────┘                   │
│                                                        │
│ [Node Palette]                                         │
│ [Triggers] [Conditions] [Actions] [Transforms]         │
└────────────────────────────────────────────────────────┘
```

FEATURES:

1. **Node-Based Editor:**
   - Canvas with zoom and pan (React Flow)
   - Drag nodes from palette onto canvas
   - Connect nodes with lines (edges)
   - Delete nodes/edges (Delete key)
   - Undo/redo (Cmd+Z, Cmd+Shift+Z)
   - Mini-map in corner

2. **Node Types:**

   **Trigger Nodes (Start of workflow):**
   - Transaction Executed
   - Transaction Blocked
   - Override Requested
   - Override Approved
   - Vault Balance Threshold (e.g., balance < 1 SOL)
   - Time-based (cron schedule, e.g., daily at 9am)
   - Webhook Received
   - Policy Updated

   **Condition Nodes:**
   - If/Then/Else logic
   - Amount Comparison (>, <, ==, !=)
   - Address Check (is whitelisted? matches address?)
   - Time Check (is business hours? is weekend?)
   - Vault Check (vault ID matches? vault tier?)
   - Boolean Logic (AND, OR, NOT)
   - JavaScript Expression (advanced users)

   **Action Nodes:**
   - Send Notification (email, Telegram, Discord, webhook)
   - Execute Transaction (from specific vault)
   - Update Vault Policy (change daily limit, whitelist)
   - Pause Vault
   - Resume Vault
   - Log to Database
   - Call Webhook (POST request)
   - Wait (delay for X seconds)
   - Generate Report

   **Transform Nodes:**
   - Map Data (transform fields)
   - Filter (filter array)
   - Aggregate (sum, count, average)
   - Format (format currency, date, etc.)

3. **Node Configuration:**
   - Click node to open config panel (right sidebar)
   - Each node type has specific fields:
     - Trigger: Select vault, event type
     - Condition: Configure logic and comparison
     - Action: Configure action parameters (e.g., notification message)
   - Validation errors shown inline
   - Preview output data

4. **Workflow Templates:**
   - Pre-built workflows:
     - "Auto-approve small transactions"
     - "Daily spend summary email"
     - "Alert on suspicious activity"
     - "Pause agent if error rate > 10%"
     - "Weekly team digest"
   - One-click to load template
   - Customizable after loading

5. **Testing & Debugging:**
   - "Test Run" button with sample data
   - Step-through debugger (execute one node at a time)
   - View data at each node
   - Execution logs panel (bottom)
   - Error highlighting on failed nodes
   - Performance metrics per node (execution time)

6. **Deployment:**
   - Save workflow (to database)
   - Enable/Disable toggle
   - View execution history
   - Logs of past runs (with timestamp, status, output)

7. **Multi-Vault Orchestration:**
   - Nodes can specify vault ID or "All Vaults"
   - Conditional routing based on vault properties
   - Aggregate actions across vaults (e.g., total daily spend across all vaults)

WORKFLOW MODEL:
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  lastRun: Date | null;
  runCount: number;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'transform';
  data: {
    label: string;
    config: Record<string, any>; // Node-specific configuration
  };
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label?: string; // For conditional edges (e.g., "true", "false")
}
```

INTEGRATIONS:
- Store workflows in database (new Prisma model: Workflow)
- Backend API endpoints:
  - POST /api/workflows (create)
  - GET /api/workflows (list)
  - GET /api/workflows/:id (get)
  - PATCH /api/workflows/:id (update)
  - DELETE /api/workflows/:id (delete)
  - POST /api/workflows/:id/test (test run)
  - POST /api/workflows/:id/deploy (enable)
- Backend service to execute workflows (event-driven, triggered by events from event listener)
- Use Bull/BullMQ for background job processing

STYLING:
- Nodes have rounded corners, icon, label
- Color-coded by type (triggers = blue, conditions = amber, actions = green)
- Animated data flow (particles moving along edges)
- Glassmorphic config panel
- Terminal-style logs panel

VALIDATION:
- Workflow must start with trigger node
- All nodes must be connected (no orphans)
- No circular dependencies
- Required fields must be filled
- Valid cron syntax for time-based triggers
```

---

### Prompt 18: Create Marketplace & Template Gallery

```
Create a marketplace for agent templates, policy rules, and integrations at `src/app/(dashboard)/marketplace/page.tsx`.

PURPOSE: App Store for Aegis ecosystem - discover, share, and monetize templates.

LAYOUT:
```
┌──────────────────────────────────────────────────────────┐
│ Marketplace                                   [Search]   │
│ [Agent Templates] [Policies] [Integrations] [Dashboards] │
├───────────────┬──────────────────────────────────────────┤
│ [Filters]     │  [Hero Banner: Featured Template]        │
│               ├──────────────────────────────────────────┤
│ Category:     │  [Sort: Most Popular ▼]                  │
│ □ Trading     │                                          │
│ □ DeFi        │  ┌────────┐ ┌────────┐ ┌────────┐       │
│ □ Payments    │  │ Trade  │ │ DeFi   │ │ Payment│       │
│ □ NFTs        │  │ Bot    │ │ Auto   │ │ Agent  │       │
│               │  │ ⭐4.8  │ │ ⭐4.9  │ │ ⭐4.7  │       │
│ Price:        │  └────────┘ └────────┘ └────────┘       │
│ ● Free        │                                          │
│ ○ Paid        │  ┌────────┐ ┌────────┐ ┌────────┐       │
│               │  │ Yield  │ │ NFT    │ │ Arb    │       │
│ Rating:       │  │ Farm   │ │ Sniper │ │ Bot    │       │
│ ⭐⭐⭐⭐⭐+     │  │ ⭐4.6  │ │ ⭐4.8  │ │ ⭐4.5  │       │
│               │  └────────┘ └────────┘ └────────┘       │
│ [Creator ▼]   │                                          │
└───────────────┴──────────────────────────────────────────┘
```

SECTIONS:

1. **Hero Banner (Featured Template):**
   - Large card showcasing "Template of the Week"
   - High-quality image/icon
   - Title, description, rating, usage count
   - "Use Template" CTA button
   - Rotates weekly

2. **Category Tabs:**
   - Agent Templates: Pre-built agents ready to deploy
   - Policy Rules: Pre-configured policy rule sets
   - Integrations: One-click integrations to external services
   - Dashboards: Pre-built analytics dashboard layouts

3. **Filters Sidebar:**
   - Category checkboxes (Trading, DeFi, Payments, NFTs, Social, Gaming, etc.)
   - Price: Free, Paid, Subscription
   - Rating: 4+ stars, 3+ stars
   - Creator: Verified creators, Community, Official
   - Sort: Most Popular, Newest, Top Rated, Most Used

4. **Template Cards (Grid):**
   - Glassmorphic cards
   - Layout:
     ```
     ┌─────────────────┐
     │ [Icon/Image]    │
     │                 │
     │ Template Name   │
     │ Short desc...   │
     │                 │
     │ ⭐4.8 (123)    │
     │ 1.2K uses       │
     │                 │
     │ [View] [Use]    │
     └─────────────────┘
     ```
   - Hover: Lift effect, show quick preview
   - Click card: Open detail modal

5. **Template Detail Modal:**
   - Full template information:
     - Name, description, icon
     - Creator profile (avatar, name, verified badge)
     - Rating and review count
     - Usage count ("1,234 vaults using this")
     - Screenshots/demo video
     - Features list
     - Configuration parameters
     - Pricing (free or $X)
     - Installation instructions
   - Reviews section (stars, text, timestamp)
   - Related templates
   - Actions:
     - "Use Template" button (if free)
     - "Purchase" button (if paid)
     - "Preview" button (opens live demo)
     - "Clone & Edit" button
     - "Report" button

6. **Template Types:**

   **Agent Templates:**
   - Pre-configured vault settings + agent code (if applicable)
   - One-click deploy
   - Configuration wizard (customize before deploying)
   - Examples:
     - Trading Bot (Momentum Strategy)
     - DeFi Yield Optimizer
     - NFT Sniper Bot
     - Payment Scheduler
     - Arbitrage Bot
   - Each includes:
     - Vault config (daily limit, whitelist)
     - Agent code (GitHub repo link or embedded)
     - Documentation
     - Video tutorial

   **Policy Templates:**
   - Pre-defined policy rule sets
   - Import to existing vault
   - Examples:
     - Conservative (low limits, strict whitelist)
     - Moderate (balanced)
     - Aggressive (high limits, looser rules)
     - Enterprise (compliance-focused)
     - Geographic Restrictions (block certain countries)
   - Show policy rules in readable format

   **Integration Templates:**
   - One-click integrations to external services
   - OAuth flow or API key setup
   - Examples:
     - Telegram Bot (notifications)
     - Discord Webhook
     - LangChain (AI framework)
     - AutoGPT
     - Jupiter (DEX)
     - Raydium (DEX)
     - Birdeye (price data)
   - Installation wizard
   - Health monitoring

   **Dashboard Templates:**
   - Pre-built analytics dashboard layouts
   - Drag-and-drop widgets
   - Export/import configurations
   - Examples:
     - Trading Dashboard
     - DeFi Dashboard
     - Security Dashboard
     - Team Dashboard

7. **Community Features:**
   - Submit your own template (opens form)
   - Upvote/downvote templates
   - Reviews and ratings
   - Creator profiles
   - Leaderboards (top creators, most used templates)
   - Featured community picks

8. **Monetization (future):**
   - Creators can charge for templates
   - Revenue share (70% creator, 30% Aegis)
   - Payment via Solana (SOL/USDC)
   - Free templates to build reputation

DATA MODEL:
```typescript
interface Template {
  id: string;
  type: 'agent' | 'policy' | 'integration' | 'dashboard';
  name: string;
  description: string;
  iconUrl: string;
  screenshotUrls: string[];
  demoVideoUrl?: string;
  category: string[];
  price: number; // 0 for free
  rating: number; // 0-5
  reviewCount: number;
  useCount: number;
  creatorId: string;
  creator: {
    name: string;
    avatarUrl: string;
    verified: boolean;
  };
  config: Record<string, any>; // Template-specific configuration
  instructions: string; // Markdown
  repoUrl?: string; // GitHub repo
  createdAt: Date;
  updatedAt: Date;
}
```

INTEGRATIONS:
- Backend API:
  - GET /api/templates (list with filters)
  - GET /api/templates/:id (get detail)
  - POST /api/templates (submit new template)
  - POST /api/templates/:id/use (increment use count)
  - POST /api/templates/:id/reviews (submit review)
- Use templates to pre-populate vault creation wizard
- Track which templates user has used

FEATURES:
- Search with debounced input
- Infinite scroll or pagination
- Skeleton loaders
- Empty states for no results
- "Coming Soon" badges for templates in development
- Share template link (social media integration)
```

---

### Prompt 19: Create Security Command Center

```
Create a security monitoring and audit dashboard at `src/app/(dashboard)/security/page.tsx`.

PURPOSE: Comprehensive security monitoring, threat detection, audit logs, compliance reporting.

LAYOUT:
```
┌──────────────────────────────────────────────────────────┐
│ Security Command Center                                   │
│ [Security Score: 92/100 🟢]     [Threat Level: LOW]      │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ Active Threats (0) │ │ Recent Events (12) │           │
│ │ No active threats  │ │ 1. Policy updated  │           │
│ │                    │ │ 2. Member added    │           │
│ │ Recommendations:   │ │ 3. API key gen     │           │
│ │ • Enable 2FA       │ │ 4. Withdrawal OK   │           │
│ │ • Rotate API keys  │ │ ...                │           │
│ └────────────────────┘ └────────────────────┘           │
├──────────────────────────────────────────────────────────┤
│ [Audit Log] [Compliance] [Access Control] [Penetration]  │ <- Tabs
│                                                           │
│ (Tab content)                                             │
└──────────────────────────────────────────────────────────┘
```

SECTIONS:

1. **Security Score Dashboard (Top):**
   - Large animated circular progress gauge (0-100)
   - Color-coded: 90-100 green, 70-89 amber, <70 red
   - Score breakdown:
     - Account Security: 25 points
     - Vault Configuration: 25 points
     - Activity Monitoring: 25 points
     - Compliance: 25 points
   - Click to see detailed breakdown
   - Historical trend (line chart, last 30 days)
   - Comparison to industry benchmark
   - **Scoring algorithm:**
     - 2FA enabled: +10
     - API keys rotated recently: +5
     - No recent security incidents: +10
     - Whitelist enabled on all vaults: +10
     - Override delay > 1 hour: +5
     - Audit log reviewed weekly: +5
     - Compliance reports generated: +10
     - Team members have appropriate roles: +10
     - No overrides to suspicious addresses: +10
     - Regular vault activity (not idle): +5
     - Wallet secured (hardware wallet detected): +10
     - Etc. (customize scoring)

2. **Threat Level Indicator:**
   - Current threat level: Low/Medium/High/Critical
   - Color-coded badge with icon
   - Based on:
     - Recent failed transactions
     - Unusual access patterns
     - Brute force attempts
     - Suspicious override requests
     - Unknown addresses in transaction attempts

3. **Active Threats Panel:**
   - List of current threats (if any)
   - Each threat shows:
     - Type (e.g., "Unusual activity", "Brute force detected")
     - Severity (Critical, High, Medium, Low)
     - Description
     - Affected vault(s)
     - Recommended action
     - Dismiss button (if false positive)
   - Empty state: "No active threats detected 🛡️"

4. **Recent Security Events:**
   - Timeline of last 10-20 security-relevant events:
     - Policy updated
     - Team member added/removed
     - API key generated/revoked
     - Vault paused/resumed
     - Override approved
     - Withdrawal executed
     - 2FA enabled/disabled
     - Wallet changed
   - Each event: Icon, description, timestamp
   - Click to view full details

5. **Recommendations:**
   - AI-generated security recommendations
   - Examples:
     - "Enable 2FA for all team members"
     - "Rotate API keys (due in 5 days)"
     - "Review whitelist for Vault XYZ (hasn't been updated in 6 months)"
     - "Increase override delay to 1 hour"
     - "Enable email notifications for all vaults"
   - Each recommendation: Action button to implement

6. **Tabs:**

   **Tab 1: Audit Log**
   - Comprehensive, searchable, immutable log of all actions
   - Table with columns:
     - Timestamp
     - Event Type (VaultCreated, TransactionExecuted, PolicyUpdated, etc.)
     - Actor (who performed action, wallet address)
     - Vault (if applicable)
     - Details (expandable JSON)
     - IP Address (if available)
   - Advanced filtering:
     - Date range picker
     - Event type multi-select
     - Actor filter (by wallet or user ID)
     - Vault filter
     - Search (keyword search in details)
   - Export (CSV, JSON) with date range
   - Retention policy indicator ("Logs retained for 90 days")
   - Cryptographic signatures for tamper-proof logs (future)

   **Tab 2: Compliance Dashboard**
   - Pre-built compliance reports:
     - SOC 2 controls checklist
     - GDPR data processing records
     - Transaction logs (for audits)
     - User access logs
     - Policy change history
   - Generate report:
     - Select report type
     - Select date range
     - Click "Generate"
     - Download PDF or CSV
   - Scheduled reports (daily, weekly, monthly via email)
   - Compliance score per framework
   - Data residency: Show where data is stored (US, EU, etc.)

   **Tab 3: Access Control**
   - Role-based permissions matrix
   - Table showing users, roles, and permissions:
     - User (wallet address or email)
     - Role (Owner, Admin, Member, Viewer)
     - Permissions (list of granted permissions)
     - Vaults (which vaults they have access to)
     - Last active (timestamp)
     - Actions (Edit role, Remove user)
   - Add new user button (opens form)
   - Custom roles builder (future):
     - Create custom role
     - Granular permissions (can view transactions, can approve overrides, etc.)
   - Session management:
     - Active sessions list (device, location, IP, last active)
     - Revoke session button
   - 2FA management:
     - Enable/disable 2FA per user
     - Show who has 2FA enabled
     - Enforce 2FA policy toggle
   - IP whitelisting:
     - Add allowed IP ranges
     - Block all other IPs
     - Log access attempts from non-whitelisted IPs

   **Tab 4: Penetration Testing** (Advanced feature)
   - Simulate attacks on your vaults
   - Test scenarios:
     - Prompt injection attack (try to make agent send unauthorized transaction)
     - Brute force attempt (simulate attacker trying to guess agent key)
     - Replay attack (try to re-submit old transaction)
     - Whitelist bypass attempt
   - Run test button
   - Results:
     - Pass/Fail for each scenario
     - Detailed report of vulnerabilities found
     - Recommendations for hardening
     - Risk score
   - Schedule regular tests (weekly, monthly)
   - Integration with external penetration testing services (future)

FEATURES:
- Real-time updates (auto-refresh every 30s)
- Notification when threat detected (toast + email)
- Audit log is append-only (immutable)
- Export all data for external audits
- Compliance report generation with customizable templates
- Access control enforcement (frontend checks + backend validation)

INTEGRATIONS:
- Backend API:
  - GET /api/security/score (calculate security score)
  - GET /api/security/threats (list active threats)
  - GET /api/security/events (recent security events)
  - GET /api/security/audit-log (paginated audit log with filters)
  - POST /api/security/reports (generate compliance report)
  - GET /api/security/access-control (list users and roles)
  - PATCH /api/security/access-control/:userId (update user role)
- All security-relevant events logged to audit log via event listener
- Threat detection ML model (future, uses transaction patterns to detect anomalies)

STYLING:
- Cybersecurity SOC dashboard aesthetic
- Dark theme with red/amber/green threat indicators
- Animated security score gauge
- Terminal-style audit log
- Glassmorphic cards
- Pulsing red border when threats detected
```

---

### Prompt 20: Create AI Co-pilot (Cmd+K Interface)

```
Create a global AI co-pilot interface that overlays the entire app.

PURPOSE: Natural language interface for all operations, smart search, contextual help.

IMPLEMENTATION:

1. **Global Command Palette (`src/components/shared/command-palette.tsx`):**
   - Trigger: Press Cmd+K (or Ctrl+K on Windows)
   - Modal overlay (full screen dim background)
   - Centered search dialog
   - Uses `cmdk` library (https://cmdk.paco.me/)

LAYOUT:
```
┌─────────────────────────────────────────┐
│ 🔍 Search or type a command...          │
├─────────────────────────────────────────┤
│ QUICK ACTIONS                           │
│ ⚡ Create new vault                     │
│ 📊 View analytics                       │
│ 🔐 Approve pending overrides            │
│                                         │
│ VAULTS (2)                              │
│ 💼 Trading Bot                          │
│ 💼 DeFi Automation                      │
│                                         │
│ TRANSACTIONS (5)                        │
│ ✓ 0.5 SOL to abc...xyz (2m ago)        │
│ ✗ 1.2 SOL to def...uvw (5m ago)        │
│                                         │
│ DOCUMENTATION                           │
│ 📖 How to create a vault                │
│ 📖 Override approval workflow           │
└─────────────────────────────────────────┘
```

FEATURES:

2. **Smart Search:**
   - Search across:
     - Vaults (by name or public key)
     - Transactions (by signature, from/to address, amount)
     - Overrides (by nonce, vault)
     - Documentation pages
     - Settings
   - Fuzzy matching (use fuse.js)
   - Keyboard navigation (arrow keys, Enter to select)
   - Group results by type
   - Show result count per group
   - Recent searches (stored in localStorage, max 10)

3. **Quick Actions:**
   - Predefined commands:
     - "Create new vault" → Opens vault creation wizard
     - "View analytics" → Navigate to /analytics
     - "Approve pending overrides" → Navigate to overrides page with PENDING filter
     - "Run diagnostics" → Run health check on all vaults
     - "Export data" → Open export dialog
     - "Documentation" → External link to docs
     - "Settings" → Navigate to settings
     - "Sign out" → Disconnect wallet
   - Show icon + label
   - Execute on Enter or click

4. **Natural Language Commands (AI-powered):**
   - Parse natural language queries:
     - "Show me all blocked transactions today"
     - "Create a new vault for my trading bot"
     - "How much did I spend this week?"
     - "Approve override for vault Trading Bot"
     - "Show transactions over 1 SOL"
   - Use simple regex or keyword matching initially
   - Future: Integrate with OpenAI API to parse complex queries
   - Show AI response with formatted results
   - Actions embedded in results (e.g., "View full list →")

5. **Contextual Suggestions:**
   - Show suggestions based on:
     - Current page (e.g., on vault detail page, suggest "Edit policy", "Execute transaction")
     - Recent actions (e.g., if just created vault, suggest "Fund vault", "Configure agent")
     - Pending tasks (e.g., "You have 2 pending overrides")
   - Highlighted with different style

6. **Keyboard Shortcuts:**
   - Show keyboard shortcut hints next to actions
   - Examples:
     - Cmd+N: Create new vault
     - Cmd+T: Go to transactions
     - Cmd+A: Go to analytics
     - Cmd+S: Go to settings
     - Cmd+/: Show keyboard shortcuts help

7. **Recent Items:**
   - Show recently viewed vaults, transactions, etc.
   - Limit to last 5 items
   - Clear history button

8. **Chat Interface (Advanced - Phase 2):**
   - Toggle between search mode and chat mode (tabs)
   - Chat mode:
     - Conversational AI assistant (uses OpenAI API)
     - Ask questions: "What's my total balance?", "Why was this transaction blocked?"
     - Get insights: "Show me spending trends", "Analyze my agent performance"
     - Execute actions via chat: "Create a vault with $100 daily limit"
     - Show responses with formatted data (tables, charts embedded)
     - Voice input button (use Web Speech API)

COMPONENT STRUCTURE:

```typescript
// src/components/shared/command-palette.tsx
import { Command } from 'cmdk';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Listen for Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search logic
  const { data: vaults } = useVaults({ search: query });
  const { data: transactions } = useTransactions({ search: query });
  // ... etc.

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input
        placeholder="Search or type a command..."
        value={query}
        onValueChange={setQuery}
      />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Quick Actions">
          <Command.Item onSelect={() => { /* action */ }}>
            Create new vault
          </Command.Item>
          {/* ... more actions */}
        </Command.Group>

        <Command.Group heading="Vaults">
          {vaults?.data?.items.map((vault) => (
            <Command.Item
              key={vault.id}
              onSelect={() => router.push(`/vaults/${vault.id}`)}
            >
              {vault.name}
            </Command.Item>
          ))}
        </Command.Group>

        {/* ... more groups */}
      </Command.List>
    </Command.Dialog>
  );
}
```

INTEGRATIONS:
- Uses all existing hooks (useVaults, useTransactions, etc.)
- Optionally integrate OpenAI API for NLP:
  - Parse query with GPT-3.5
  - Determine intent (search, action, question)
  - Execute appropriate action or return answer
- Voice input: Use Web Speech API (browser support)
- Keyboard shortcuts: Use react-hotkeys-hook library

STYLING:
- Glassmorphic dialog with blur backdrop
- Dark theme with subtle gradients
- Grouped results with section headers
- Icons for each result type (Lucide icons)
- Hover state with gradient border
- Smooth animations (enter/exit)
- Mobile responsive (full screen on mobile)

ACCESSIBILITY:
- Keyboard navigation (arrow keys, tab)
- Screen reader support (proper ARIA labels)
- Focus management
- Esc to close
```

---

## Phase 5: Polish & Production (Prompts 21-25)

### Prompt 21: Create Settings & Preferences

```
Create comprehensive settings page at `src/app/(dashboard)/settings/page.tsx`.

(Detailed implementation prompt...)
```

### Prompt 22: Mobile Responsiveness & PWA

```
Make the entire app mobile-responsive and convert to PWA.

(Detailed implementation prompt...)
```

### Prompt 23: Performance Optimization

```
Optimize app performance for production.

(Detailed implementation prompt...)
```

### Prompt 24: Testing & Error Handling

```
Add comprehensive testing and error boundaries.

(Detailed implementation prompt...)
```

### Prompt 25: Documentation & Launch Prep

```
Generate documentation and prepare for launch.

(Detailed implementation prompt...)
```

---

## IMPORTANT NOTES

**Sequential Execution:**
- These prompts build on each other
- Complete each phase before moving to the next
- Test each feature as you build it

**Integration Points:**
- Always refer to actual API endpoints from aegis-guardian
- Use actual PDAs and instructions from aegis-protocol
- Test against devnet with real transactions

**Data Handling:**
- Remember BigInt conversion (backend sends as strings)
- Handle lamports ↔ SOL conversion (1 SOL = 1e9 lamports)
- Validate all addresses (base58 format, 32-44 chars)

**Error Handling:**
- Show user-friendly error messages
- Log errors to Sentry
- Retry logic for network failures
- Graceful degradation when services unavailable

**Real-time Updates:**
- Use React Query's auto-refetch
- Consider WebSocket for true real-time (future enhancement)
- Optimistic updates for mutations

**Security:**
- Never expose private keys
- Validate all inputs
- Use prepared statements for database queries (backend)
- CSRF protection
- Rate limiting

---

This document provides a complete roadmap to building the Aegis frontend. Use each prompt with Claude Code sequentially, test thoroughly, and iterate based on feedback.
