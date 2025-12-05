'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/shared/wallet-button';
import {
  Shield,
  Lock,
  ArrowRight,
  TrendingUp,
  Globe,
  Menu,
  X,
  MessageCircle,
  AlertCircle,
  Eye,
  Zap,
  Code,
  Bell,
  CheckCircle,
  BarChart3,
  Clock,
  Users,
  Database,
  Sparkles,
  Terminal,
  Bot,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Github, Twitter } from 'lucide-react';

/* ===== REUSABLE VISUAL COMPONENTS ===== */

function HalftoneBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="absolute inset-0 halftone-dots opacity-100" />
    </div>
  );
}

function HeroBlob() {
  return (
    <>
      <div className="hero-blob gentle-float" />
      <div className="hero-dots-overlay" />
    </>
  );
}

function PillCard({
  children,
  className = '',
  variant = 'white',
  animate = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'orange';
  animate?: boolean;
}) {
  const baseClass = variant === 'orange' ? 'pill-card-orange' : 'pill-card';
  const animateClass = animate ? 'animate-reveal animate-reveal-stagger shimmer-border' : '';
  return <div className={`${baseClass} ${animateClass} group ${className}`}>{children}</div>;
}

function StatCardConnected({
  label,
  value,
  isFirst,
  isLast,
  delay = 0,
}: {
  label: string;
  value: string;
  isFirst?: boolean;
  isLast?: boolean;
  delay?: number;
}) {
  let roundedClass = '';
  if (isFirst) roundedClass = 'rounded-l-[32px] lg:rounded-l-[32px]';
  if (isLast) roundedClass = 'rounded-r-[32px] lg:rounded-r-[32px]';

  return (
    <div
      className={`bg-caldera-orange flex-1 min-w-[180px] p-8 lg:p-10 ${roundedClass} ${
        !isLast ? 'lg:border-r lg:border-white/20' : ''
      } rounded-[24px] lg:rounded-none group hover:bg-caldera-orange-secondary transition-colors duration-300`}
    >
      <div className="text-sm uppercase tracking-wider text-white/70 mb-2 font-bold">
        {label}
      </div>
      <div 
        className="text-5xl lg:text-6xl font-display font-black text-white stat-value"
        style={{ animationDelay: `${delay}ms` }}
      >
        {value}
      </div>
    </div>
  );
}

function NewsCard({
  title,
  category,
  date,
}: {
  title: string;
  category: string;
  date: string;
}) {
  return (
    <div className="news-card group cursor-pointer">
      <div className="card-halftone-thumb h-48 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Shield className="w-16 h-16 text-white/80 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
        </div>
      </div>
      <div className="p-6 space-y-3">
        <span className="inline-block px-3 py-1 text-xs font-bold uppercase bg-caldera-yellow text-caldera-black rounded-full transition-transform duration-300 group-hover:scale-105">
          {category}
        </span>
        <h4 className="text-xl font-display font-bold text-caldera-black leading-tight group-hover:text-caldera-orange transition-colors duration-300">
          {title}
        </h4>
        <p className="text-sm text-caldera-text-muted">{date}</p>
      </div>
    </div>
  );
}

function CommunityCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="community-card animate-reveal animate-reveal-stagger group">
      <div className={`community-icon ${color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="text-5xl lg:text-6xl font-display font-black text-caldera-black mb-2 stat-value">
        {value}
      </div>
      <div className="text-lg text-caldera-text-secondary font-medium">{label}</div>
    </div>
  );
}

function PartnerLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-12 px-6 opacity-50 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer">
      <span className="text-lg font-display font-bold text-caldera-black tracking-wider uppercase">
        {name}
      </span>
    </div>
  );
}

/* ===== MAIN LANDING PAGE ===== */

// Custom hook for scroll-triggered animations
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const elements = document.querySelectorAll('.animate-reveal, .animate-reveal-stagger, .animate-scale-in, .text-reveal, .stat-value');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  const { connected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Initialize scroll reveal animations
  useScrollReveal();

  const ecosystemStats = [
    { label: 'Vaults Secured', value: '25+' },
    { label: 'Transactions Protected', value: '125+' },
    { label: 'Total SDK Downloads', value: '355' },
    { label: 'Protocols Integrated', value: '25+' },
  ];

  const partnerNames = [
    'Solana Labs',
    'Helius',
    'Dialect',
    'Jupiter',
    'Marinade',
    'Tensor',
  ];

  const features = [
    {
      icon: Shield,
      title: 'Programmable Guardrails',
      description:
        'Define custom spending limits, address whitelists, and transaction policies. All enforcement happens on-chain with zero trust assumptions.',
      color: 'bg-caldera-orange/10',
      iconColor: 'text-caldera-orange',
      details: ['Daily spending limits', 'Address whitelisting', 'Transaction validation', 'On-chain enforcement'],
    },
    {
      icon: AlertCircle,
      title: 'Human Override System',
      description:
        'When transactions exceed limits, vault owners receive instant notifications and can approve via Solana Blinks - all in one transaction.',
      color: 'bg-caldera-purple/10',
      iconColor: 'text-caldera-purple',
      details: ['One-click approvals', 'Blink integration', 'Multi-channel alerts', 'Override history'],
    },
    {
      icon: Eye,
      title: 'Real-Time Monitoring',
      description:
        'Track every transaction with instant notifications, comprehensive analytics dashboards, and full audit trails of all vault activity.',
      color: 'bg-caldera-success/10',
      iconColor: 'text-caldera-success',
      details: ['Live transaction feed', 'Spending analytics', 'Event history', 'Audit logs'],
    },
    {
      icon: Lock,
      title: 'Battle-Tested Security',
      description:
        'Audited Anchor smart contracts with overflow protection, reentrancy guards, PDA validation, and comprehensive security checks.',
      color: 'bg-caldera-info/10',
      iconColor: 'text-caldera-info',
      details: ['Audited contracts', 'Overflow protection', 'Reentrancy guards', 'Secure PDAs'],
    },
    {
      icon: Bot,
      title: 'AI Framework Integration',
      description:
        'Drop-in tools for OpenAI function calling, LangChain, and Anthropic Claude. Give AI agents financial autonomy with safety controls.',
      color: 'bg-caldera-orange/10',
      iconColor: 'text-caldera-orange',
      details: ['OpenAI tools', 'LangChain integration', 'Claude support', 'Custom agents'],
    },
    {
      icon: Globe,
      title: 'Blink-Powered Approvals',
      description:
        'Share override requests on Twitter, Discord, or any platform. Vault owners approve directly from social media with Solana Actions.',
      color: 'bg-caldera-purple/10',
      iconColor: 'text-caldera-purple',
      details: ['Social sharing', 'One-tx approvals', 'Platform agnostic', 'Mobile friendly'],
    },
  ];

  const useCases = [
    {
      icon: Bot,
      title: 'Autonomous AI Trading Bots',
      description: 'Let your AI agent execute trades automatically while maintaining human oversight for large positions.',
      example: 'Daily limit: 10 SOL, Whitelist: DEX programs',
    },
    {
      icon: Sparkles,
      title: 'AI Customer Service Agents',
      description: 'Enable AI to process refunds and payments autonomously within preset limits and approved merchant lists.',
      example: 'Daily limit: 5 SOL, Whitelist: Customer wallets',
    },
    {
      icon: Terminal,
      title: 'Treasury Management',
      description: 'Grant AI agents controlled access to organizational funds for automated payments and operational expenses.',
      example: 'Daily limit: 100 SOL, Whitelist: Vendor addresses',
    },
    {
      icon: Users,
      title: 'DAO Operations',
      description: 'Automate DAO treasury operations with AI agents that execute approved transactions within governance-set parameters.',
      example: 'Daily limit: 50 SOL, Whitelist: Grant recipients',
    },
  ];

  const technicalSpecs = [
    { label: 'Blockchain', value: 'Solana', icon: Layers },
    { label: 'Smart Contract', value: 'Anchor 0.30.1', icon: Code },
    { label: 'Backend', value: 'Next.js 14 + Prisma', icon: Database },
    { label: 'Cache Layer', value: 'Redis 7+', icon: Zap },
    { label: 'Database', value: 'PostgreSQL 15+', icon: Database },
    { label: 'SDK', value: 'TypeScript', icon: Terminal },
    { label: 'Protocol Fee', value: '0.05% (5 bps)', icon: TrendingUp },
    { label: 'Override Expiry', value: '1 hour default', icon: Clock },
  ];

  const integrations = [
    {
      name: 'OpenAI',
      description: 'Function calling tools for GPT-4 and ChatGPT',
      code: `import { createOpenAITools } from '@aegis-vaults/sdk/agents';
const tools = createOpenAITools(aegisClient);`,
    },
    {
      name: 'LangChain',
      description: 'Dynamic structured tools for agent chains',
      code: `import { createLangChainTools } from '@aegis-vaults/sdk/agents';
const tools = createLangChainTools(aegisClient);`,
    },
    {
      name: 'Anthropic Claude',
      description: 'Tool use for Claude models',
      code: `import { createAnthropicTools } from '@aegis-vaults/sdk/agents';
const tools = createAnthropicTools(aegisClient);`,
    },
  ];

  const newsItems = [
    { title: 'Aegis v0.3 – Blink Approvals Now Live', category: 'Release', date: 'Dec 1, 2025' },
    { title: 'Multi-Chain Support Coming Q1 2025', category: 'Update', date: 'Nov 28, 2025' },
    { title: 'Partnership with Major DEX Aggregator', category: 'Customer', date: 'Nov 20, 2025' },
    { title: 'Security Audit Completed by OtterSec', category: 'Security', date: 'Nov 15, 2025' },
  ];

  return (
    <div className="min-h-screen bg-caldera-light-gray overflow-x-hidden">
      {/* ===== NAVIGATION ===== */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="flex items-center justify-between h-20">
            <div className="flex-1 lg:flex-initial flex items-center justify-center lg:justify-start">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-caldera-orange flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <Shield className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-display font-black text-caldera-black uppercase transition-colors duration-300 group-hover:text-caldera-orange">AEGIS</span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <Link href="#features" className="px-5 py-2 rounded-full text-caldera-text-secondary hover:text-caldera-text-primary hover:bg-gray-100 transition-all duration-300 font-medium link-underline">
                Features
              </Link>
              <Link href="#use-cases" className="px-5 py-2 rounded-full text-caldera-text-secondary hover:text-caldera-text-primary hover:bg-gray-100 transition-all duration-300 font-medium link-underline">
                Use Cases
              </Link>
              <Link href="#integrations" className="px-5 py-2 rounded-full text-caldera-text-secondary hover:text-caldera-text-primary hover:bg-gray-100 transition-all duration-300 font-medium link-underline">
                Integrations
              </Link>
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank" className="px-5 py-2 rounded-full text-caldera-text-secondary hover:text-caldera-text-primary hover:bg-gray-100 transition-all duration-300 font-medium link-underline">
                Docs
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link href="https://github.com/aegis-vaults" target="_blank" className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110 group">
                <Github className="w-5 h-5 text-caldera-text-secondary transition-colors duration-300 group-hover:text-caldera-black" />
              </Link>
              <Link href="https://twitter.com" target="_blank" className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110 group">
                <Twitter className="w-5 h-5 text-caldera-text-secondary transition-colors duration-300 group-hover:text-caldera-black" />
              </Link>
              <Link href="https://discord.com" target="_blank" className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110 group">
                <MessageCircle className="w-5 h-5 text-caldera-text-secondary transition-colors duration-300 group-hover:text-caldera-black" />
              </Link>
              <div className="ml-2">
                {connected ? (
                  <Link href="/dashboard">
                    <Button className="rounded-full px-8 py-6 bg-caldera-orange hover:bg-caldera-orange-secondary font-semibold text-base">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <WalletButton className="!rounded-full !px-8 !py-6 !bg-caldera-orange hover:!bg-caldera-orange-secondary !font-semibold !text-base" />
                )}
              </div>
            </div>

            <button className="lg:hidden p-2 absolute right-6" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-200 space-y-4">
              <Link href="#features" className="block py-2 text-caldera-text-secondary hover:text-caldera-text-primary">Features</Link>
              <Link href="#use-cases" className="block py-2 text-caldera-text-secondary hover:text-caldera-text-primary">Use Cases</Link>
              <Link href="#integrations" className="block py-2 text-caldera-text-secondary hover:text-caldera-text-primary">Integrations</Link>
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank" className="block py-2 text-caldera-text-secondary hover:text-caldera-text-primary">Docs</Link>
              <div className="flex items-center gap-4 pt-2">
                <Link href="https://github.com/aegis-vaults" target="_blank"><Github className="w-5 h-5 text-caldera-text-secondary" /></Link>
                <Link href="https://twitter.com" target="_blank"><Twitter className="w-5 h-5 text-caldera-text-secondary" /></Link>
                <Link href="https://discord.com" target="_blank"><MessageCircle className="w-5 h-5 text-caldera-text-secondary" /></Link>
              </div>
              <div className="pt-4">
                {connected ? (
                  <Link href="/dashboard"><Button className="w-full rounded-full bg-caldera-orange hover:bg-caldera-orange-secondary">Dashboard</Button></Link>
                ) : (
                  <WalletButton className="w-full !rounded-full !bg-caldera-orange hover:!bg-caldera-orange-secondary" />
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION WITH HALFTONE BLOB ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-12 pb-24 overflow-hidden">
        <HeroBlob />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-caldera-black/10 shadow-sm animate-fade-up">
              <Cpu className="w-4 h-4 text-caldera-orange" />
              <span className="text-sm font-mono text-caldera-black font-semibold">On-Chain Operating System for AI Finance</span>
            </div>

            <h1 className="font-display font-black text-6xl md:text-8xl lg:text-[140px] tracking-tighter leading-[0.9] uppercase">
              <span className="block animate-slide-in-left stagger-1">Guard Your</span>
              <span className="block text-caldera-orange animate-slide-in-right stagger-2">AI Agents</span>
            </h1>

            <p className="text-xl md:text-2xl text-caldera-text-secondary max-w-3xl mx-auto leading-relaxed font-body animate-fade-up stagger-2">
              Give AI agents secure access to Solana funds with programmable guardrails, human-in-the-loop overrides, and real-time monitoring. Built on Anchor with enterprise-grade infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-up stagger-3">
              {connected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full px-10 h-14 bg-caldera-orange hover:bg-caldera-orange-secondary text-lg font-semibold shadow-lg shadow-caldera-orange/30 btn-ripple group">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 arrow-slide" />
                  </Button>
                </Link>
              ) : (
                <WalletButton variant="hero" />
              )}
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank">
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-semibold border-2 border-caldera-black text-caldera-black hover:bg-caldera-black hover:text-white transition-all duration-300">
                  View Documentation
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm font-mono animate-fade-up stagger-4">
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle className="w-4 h-4 text-caldera-success transition-transform duration-300 group-hover:scale-125" />
                <span className="text-caldera-text-muted transition-colors duration-300 group-hover:text-caldera-success">Mainnet Ready</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle className="w-4 h-4 text-caldera-success transition-transform duration-300 group-hover:scale-125" />
                <span className="text-caldera-text-muted transition-colors duration-300 group-hover:text-caldera-success">Open Source</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle className="w-4 h-4 text-caldera-success transition-transform duration-300 group-hover:scale-125" />
                <span className="text-caldera-text-muted transition-colors duration-300 group-hover:text-caldera-success">Audited Contracts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ECOSYSTEM STATS - Connected Orange Cards ===== */}
      <section className="px-6 py-4 -mt-16 relative z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
            {ecosystemStats.map((stat, index) => (
              <StatCardConnected
                key={index}
                label={stat.label}
                value={stat.value}
                isFirst={index === 0}
                isLast={index === ecosystemStats.length - 1}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARTNER LOGO STRIP ===== */}
      <section className="px-6 py-8">
        <div className="container mx-auto max-w-6xl">
          <PillCard className="py-6 px-8">
            <div className="partner-strip-container flex items-center justify-between gap-8 overflow-x-auto">
              {partnerNames.map((name, index) => (
                <PartnerLogo key={index} name={name} />
              ))}
            </div>
          </PillCard>
        </div>
      </section>

      {/* ===== TRUSTED BY / BACKED BY SECTION ===== */}
      <section className="relative px-6 py-32 overflow-hidden">
        <HalftoneBackground />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              Trusted By Leading Teams
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              Enterprise teams and innovative protocols trust Aegis to secure their AI-powered financial operations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {['DeFi Protocol', 'Trading Firm', 'DAO Treasury', 'AI Startup', 'Venture Fund', 'Gaming Studio', 'Payment Network', 'Infrastructure Co'].map((name, index) => (
              <PillCard key={index} className="p-8 flex items-center justify-center min-h-[120px] animate-reveal animate-reveal-stagger hover:scale-[1.02] transition-transform duration-300">
                <span className="text-lg font-display font-bold text-caldera-black/60 text-center group-hover:text-caldera-black/80 transition-colors duration-300">{name}</span>
              </PillCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION - Enterprise-Grade Security ===== */}
      <section id="features" className="px-6 py-32 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              Built on Solana for speed, security, and scalability. Every feature designed for production AI finance operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <PillCard key={index} className="p-8 space-y-4" animate>
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center icon-lift`}>
                    <Icon className={`w-8 h-8 ${feature.iconColor}`} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-caldera-black">{feature.title}</h3>
                  <p className="text-base text-caldera-text-secondary leading-relaxed font-body">{feature.description}</p>
                  <ul className="space-y-2 pt-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-caldera-text-secondary">
                        <CheckCircle className={`w-4 h-4 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </PillCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== USE CASES - Built For AI Agents ===== */}
      <section id="use-cases" className="relative px-6 py-32 overflow-hidden">
        <HalftoneBackground />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              Built For AI Agents
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              From autonomous trading bots to treasury management - Aegis enables safe AI-powered financial operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <PillCard key={index} className="p-10 space-y-4" animate>
                  <Icon className="w-12 h-12 text-caldera-orange icon-lift transition-all duration-300" />
                  <h3 className="text-3xl font-display font-bold text-caldera-black">{useCase.title}</h3>
                  <p className="text-lg text-caldera-text-secondary leading-relaxed font-body">{useCase.description}</p>
                  <div className="pt-4 p-4 bg-caldera-light-gray rounded-2xl transition-all duration-300 group-hover:bg-caldera-orange/5">
                    <p className="text-sm font-mono text-caldera-text-secondary">
                      <span className="text-caldera-orange font-bold">Example:</span> {useCase.example}
                    </p>
                  </div>
                </PillCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TECHNICAL STACK ===== */}
      <section className="px-6 py-32 bg-caldera-black text-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              Technical Stack
            </h2>
            <p className="text-xl text-white/70 font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              Production-grade architecture built with modern blockchain and backend technologies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalSpecs.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-3 backdrop-blur-sm hover:bg-white/10 hover:border-caldera-orange/30 transition-all duration-300 animate-reveal animate-reveal-stagger group"
                >
                  <Icon className="w-8 h-8 text-caldera-orange transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <div className="text-sm uppercase tracking-wider text-white/60 font-bold font-mono">{spec.label}</div>
                  <div className="text-xl font-display font-bold text-white">{spec.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== AI FRAMEWORK INTEGRATIONS ===== */}
      <section id="integrations" className="px-6 py-32 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              AI Framework Ready
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              Drop-in tools for popular AI frameworks. Get started in minutes with our TypeScript SDK.
            </p>
          </div>

          <div className="space-y-8">
            {integrations.map((integration, index) => (
              <PillCard key={index} className="p-10 animate-reveal" animate>
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Code className="w-6 h-6 text-caldera-orange icon-lift" />
                      <h3 className="text-3xl font-display font-bold text-caldera-black">{integration.name}</h3>
                    </div>
                    <p className="text-lg text-caldera-text-secondary font-body">{integration.description}</p>
                  </div>
                  <div className="flex-1 w-full">
                    <pre className="bg-caldera-black text-emerald-400 p-6 rounded-2xl overflow-x-auto font-mono text-sm code-glow transition-all duration-300">
                      {integration.code}
                    </pre>
                  </div>
                </div>
              </PillCard>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="https://docs.aegis-vaults.xyz/" target="_blank">
              <Button size="lg" className="rounded-full px-10 py-7 bg-caldera-orange hover:bg-caldera-orange-secondary text-lg font-semibold shadow-lg shadow-caldera-orange/30">
                View Full SDK Documentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative px-6 py-32 overflow-hidden">
        <HalftoneBackground />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              How It Works
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body animate-reveal" style={{ animationDelay: '100ms' }}>Three simple steps to secure your AI agents</p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Create a Vault',
                description:
                  'Initialize a vault on-chain with your desired daily spending limit and authorized AI agent public key. Fund the vault deposit address with SOL.',
                code: 'const { vaultAddress, depositAddress, nonce } = await client.createVault({\n  name: \'My AI Treasury\',\n  agentSigner: agentPublicKey,\n  dailyLimit: 1_000_000_000 // 1 SOL in lamports\n});',
              },
              {
                step: '02',
                title: 'Configure Policies',
                description:
                  'Add whitelisted addresses for approved recipients, set daily limits, configure multi-channel notifications, and customize override expiration times.',
                code: 'await client.addToWhitelist(vaultAddress, nonce, recipientAddress);',
              },
              {
                step: '03',
                title: 'Execute & Monitor',
                description:
                  'Your AI agent executes transactions autonomously. If a transaction exceeds limits, you receive instant notifications with Blink approval links. Track everything in real-time.',
                code: 'const sig = await client.executeAgent({\n  vault: vaultAddress,\n  vaultNonce: nonce,\n  destination: recipientAddress,\n  amount: 100_000_000 // 0.1 SOL\n});',
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 items-start animate-reveal" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="text-8xl font-display font-black text-caldera-orange/20 min-w-[120px] transition-all duration-500 hover:text-caldera-orange/40">{item.step}</div>
                <PillCard className="flex-1 p-8 space-y-4" animate>
                  <h3 className="text-3xl font-display font-bold text-caldera-black mb-3">{item.title}</h3>
                  <p className="text-lg text-caldera-text-secondary leading-relaxed font-body">{item.description}</p>
                  <pre className="bg-caldera-black text-emerald-400 p-4 rounded-2xl overflow-x-auto font-mono text-sm mt-4 code-glow">
                    {item.code}
                  </pre>
                </PillCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST UPDATES / NEWS CARDS ===== */}
      <section className="px-6 py-32 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display font-black text-5xl md:text-6xl tracking-tight uppercase">Latest Updates</h2>
            <div className="hidden md:flex items-center gap-2">
              <button className="btn-dashed text-caldera-black p-3 rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="btn-dashed text-caldera-black p-3 rounded-full">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="news-scroll-container">
            {newsItems.map((item, index) => (
              <NewsCard key={index} title={item.title} category={item.category} date={item.date} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY SECTION ===== */}
      <section className="relative px-6 py-32 overflow-hidden">
        <HalftoneBackground />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 tracking-tight uppercase animate-reveal">
              Join The Aegis Community
            </h2>
            <p className="text-xl text-caldera-text-secondary font-body max-w-3xl mx-auto animate-reveal" style={{ animationDelay: '100ms' }}>
              Connect with builders, developers, and teams using Aegis to secure AI-powered finance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CommunityCard icon={Twitter} value="15K" label="Followers on X" color="bg-caldera-black" />
            <CommunityCard icon={MessageCircle} value="8.5K" label="Discord Members" color="bg-caldera-purple" />
            <CommunityCard icon={Users} value="500+" label="Active Builders" color="bg-caldera-orange" />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA WITH HALFTONE BLOB ===== */}
      <section className="px-6 py-32">
        <div className="container mx-auto max-w-5xl">
          <div className="relative halftone-blob superellipse-lg overflow-hidden">
            <div className="relative z-10 p-16 text-center">
              <h2 className="font-display font-black text-4xl md:text-6xl text-white mb-6 uppercase">
                Ready to Secure Your AI Agents?
              </h2>
              <p className="text-xl text-white mb-10 font-body max-w-2xl mx-auto">
                Connect your wallet and start building with Aegis today. Enterprise-grade security for AI finance on Solana.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {connected ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="rounded-full px-10 py-7 bg-white text-caldera-orange hover:bg-gray-100 text-lg font-bold shadow-lg btn-ripple group transition-transform duration-300 hover:scale-105">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2 arrow-slide" />
                    </Button>
                  </Link>
                ) : (
                  <WalletButton variant="hero" />
                )}
                <Link href="https://github.com/aegis-vaults" target="_blank">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-7 bg-white text-caldera-orange hover:bg-gray-100 hover:text-caldera-orange text-lg font-bold shadow-lg transition-transform duration-300 hover:scale-105 group">
                    <Github className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                    View on GitHub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="px-6 py-16 border-t border-gray-200 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-caldera-orange flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-display font-black text-caldera-black uppercase">AEGIS</span>
              </div>
              <span className="text-caldera-text-muted text-sm">© 2025 Aegis. Built on Solana.</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank" className="text-caldera-text-secondary hover:text-caldera-text-primary transition-colors font-medium">
                Docs
              </Link>
              <Link href="https://github.com/aegis-vaults" target="_blank" className="text-caldera-text-secondary hover:text-caldera-text-primary transition-colors font-medium">
                GitHub
              </Link>
              <Link href="https://twitter.com" target="_blank" className="text-caldera-text-secondary hover:text-caldera-text-primary transition-colors font-medium">
                Twitter
              </Link>
              <Link href="https://discord.com" target="_blank" className="text-caldera-text-secondary hover:text-caldera-text-primary transition-colors font-medium">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
