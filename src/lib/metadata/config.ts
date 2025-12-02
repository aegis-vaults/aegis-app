/**
 * SEO and Social Sharing Metadata Configuration
 * Centralized metadata for consistent SEO across the application
 */

export const siteConfig = {
  name: 'Aegis',
  title: 'Aegis - On-Chain Operating System for AI Finance',
  description:
    'Aegis is a production-grade on-chain operating system that gives AI agents secure access to financial operations with customizable guardrails, spending limits, and human override controls on Solana.',
  tagline: 'Guard Your AI Agents With Programmable Safety',
  keywords: [
    'AI agents',
    'Solana',
    'DeFi',
    'Smart contracts',
    'AI finance',
    'On-chain security',
    'Programmable guardrails',
    'Crypto wallet',
    'Blockchain',
    'Web3',
    'Decentralized finance',
    'AI trading',
    'Smart vaults',
    'Transaction monitoring',
    'Spending limits',
  ],
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://aegis.fi',
  ogImage: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aegis.fi'}/og-image.png`,
  links: {
    twitter: 'https://twitter.com/aegisfi',
    github: 'https://github.com/aegis-protocol',
    docs: 'https://docs.aegis.fi',
    discord: 'https://discord.gg/aegis',
  },
  creator: {
    name: 'Aegis Team',
    twitter: '@aegisfi',
  },
};

export const pages = {
  home: {
    title: siteConfig.title,
    description: siteConfig.description,
    path: '/',
  },
  dashboard: {
    title: 'Dashboard - Aegis',
    description: 'Monitor and manage your AI agent vaults, track transactions, and control spending limits.',
    path: '/dashboard',
  },
  vaults: {
    title: 'Vaults - Aegis',
    description: 'Create and manage secure smart vaults for your AI agents with custom guardrails and policies.',
    path: '/vaults',
  },
  transactions: {
    title: 'Transactions - Aegis',
    description: 'View and monitor all transactions across your AI agent vaults in real-time.',
    path: '/transactions',
  },
  analytics: {
    title: 'Analytics - Aegis',
    description: 'Gain insights with spending trends, transaction analytics, and vault performance metrics.',
    path: '/analytics',
  },
  security: {
    title: 'Security - Aegis',
    description: 'Manage override requests, approve transactions, and configure security policies.',
    path: '/security',
  },
  settings: {
    title: 'Settings - Aegis',
    description: 'Configure your account settings, API keys, and notification preferences.',
    path: '/settings',
  },
};

export type PageKey = keyof typeof pages;

