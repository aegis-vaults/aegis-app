'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from '@/components/shared/wallet-button';
import {
  Shield,
  Zap,
  Lock,
  Bot,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Globe,
  Github,
  BookOpen,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const { connected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-aegis-bg-primary via-aegis-bg-secondary to-aegis-bg-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-aegis-blue" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-aegis-blue to-aegis-purple bg-clip-text text-transparent">
                AEGIS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors">
                How It Works
              </Link>
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors" title="Documentation">
                <BookOpen className="w-5 h-5" />
              </Link>
              <Link href="https://github.com/aegis-vaults" target="_blank" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors" title="GitHub">
                <Github className="w-5 h-5" />
              </Link>
              {connected ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <WalletButton />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-aegis-text-secondary hover:text-aegis-text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-white/5 mt-3 space-y-3">
              <Link 
                href="#features" 
                className="block py-2 text-aegis-text-secondary hover:text-aegis-text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="block py-2 text-aegis-text-secondary hover:text-aegis-text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="https://docs.aegis-vaults.xyz/" 
                target="_blank" 
                className="flex items-center gap-2 py-2 text-aegis-text-secondary hover:text-aegis-text-primary transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Docs
              </Link>
              <Link 
                href="https://github.com/aegis-vaults" 
                target="_blank" 
                className="flex items-center gap-2 py-2 text-aegis-text-secondary hover:text-aegis-text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
                GitHub
              </Link>
              <div className="pt-2">
                {connected ? (
                  <Link href="/dashboard">
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <WalletButton className="w-full" />
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-5 sm:space-y-8">
            <Badge className="bg-aegis-blue/10 text-aegis-blue border-aegis-blue/20 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
              On-Chain Operating System for AI Finance
            </Badge>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight px-2">
              <span className="bg-gradient-to-r from-aegis-blue via-aegis-purple to-aegis-emerald bg-clip-text text-transparent">
                Guard Your AI Agents
              </span>
              <br />
              <span className="text-aegis-text-primary">
                With Programmable Safety
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-aegis-text-secondary max-w-3xl mx-auto leading-relaxed px-2">
              Aegis is a production-grade on-chain operating system that gives AI agents secure access to financial operations with customizable guardrails, spending limits, and human override controls.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 px-4">
              {connected ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-aegis-blue hover:bg-aegis-blue/80 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <WalletButton className="w-full sm:w-auto !bg-aegis-blue !text-white !px-6 sm:!px-8 !py-4 sm:!py-6 !text-base sm:!text-lg !h-auto !rounded-lg hover:!bg-aegis-blue/80 transition-all !font-medium" />
                  <Link href="#how-it-works" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto border-aegis-blue/30 hover:border-aegis-blue">
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto pt-8 sm:pt-12 px-4">
              <div className="text-center p-4 sm:p-0 rounded-lg sm:rounded-none bg-aegis-bg-secondary/50 sm:bg-transparent">
                <div className="text-2xl sm:text-4xl font-bold text-aegis-blue">100%</div>
                <div className="text-xs sm:text-sm text-aegis-text-tertiary mt-1">On-Chain</div>
              </div>
              <div className="text-center p-4 sm:p-0 rounded-lg sm:rounded-none bg-aegis-bg-secondary/50 sm:bg-transparent">
                <div className="text-2xl sm:text-4xl font-bold text-aegis-purple">Real-Time</div>
                <div className="text-xs sm:text-sm text-aegis-text-tertiary mt-1">Monitoring</div>
              </div>
              <div className="text-center p-4 sm:p-0 rounded-lg sm:rounded-none bg-aegis-bg-secondary/50 sm:bg-transparent">
                <div className="text-2xl sm:text-4xl font-bold text-aegis-emerald">0.05%</div>
                <div className="text-xs sm:text-sm text-aegis-text-tertiary mt-1">Protocol Fee</div>
              </div>
            </div>
          </div>

          {/* Hero Visual - Hidden on very small screens */}
          <div className="mt-12 sm:mt-20 relative hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-r from-aegis-blue/20 via-aegis-purple/20 to-aegis-emerald/20 blur-3xl -z-10"></div>
            <Card className="glass-card border-aegis-blue/20 overflow-hidden">
              <CardContent className="p-4 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="h-3 bg-aegis-blue/30 rounded animate-pulse"></div>
                    <div className="h-3 bg-aegis-blue/20 rounded animate-pulse delay-75"></div>
                    <div className="h-3 bg-aegis-blue/10 rounded animate-pulse delay-150"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-aegis-purple/30 rounded animate-pulse delay-300"></div>
                    <div className="h-3 bg-aegis-purple/20 rounded animate-pulse delay-100"></div>
                    <div className="h-3 bg-aegis-purple/10 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-aegis-emerald/30 rounded animate-pulse"></div>
                    <div className="h-3 bg-aegis-emerald/20 rounded animate-pulse delay-200"></div>
                    <div className="h-3 bg-aegis-emerald/10 rounded animate-pulse delay-100"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-aegis-text-primary mb-3 sm:mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-aegis-text-secondary text-sm sm:text-lg px-4">
              Built on Solana for speed, security, and scalability
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <Card className="glass-card border-aegis-blue/20 hover:border-aegis-blue/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-blue/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-blue" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Programmable Guardrails</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Define custom spending limits, whitelists, and transaction policies for each AI agent vault.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="glass-card border-aegis-purple/20 hover:border-aegis-purple/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-purple/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-purple" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Human Override</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Maintain control with human approval workflows for transactions that exceed policy limits.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="glass-card border-aegis-emerald/20 hover:border-aegis-emerald/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-emerald/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-emerald" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Real-Time Monitoring</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Track every transaction with instant notifications and comprehensive analytics dashboards.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="glass-card border-aegis-amber/20 hover:border-aegis-amber/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-amber/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-amber" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Battle-Tested Security</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Audited smart contracts with overflow protection, reentrancy guards, and comprehensive validation.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="glass-card border-aegis-cyan/20 hover:border-aegis-cyan/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-cyan/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-cyan" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Advanced Analytics</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Gain insights with spending trends, transaction history, and vault performance metrics.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="glass-card border-aegis-crimson/20 hover:border-aegis-crimson/50 transition-all sm:hover:scale-105">
              <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-aegis-crimson/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-aegis-crimson" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-aegis-text-primary">Blink Integration</h3>
                <p className="text-aegis-text-secondary text-sm sm:text-base">
                  Approve override requests directly from social media with shareable Solana Blinks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 bg-aegis-bg-secondary/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-aegis-text-primary mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-aegis-text-secondary text-sm sm:text-lg">
              Three simple steps to secure your AI agents
            </p>
          </div>

          <div className="space-y-4 sm:space-y-8">
            {[
              {
                step: '01',
                title: 'Create a Vault',
                description: 'Set up an AI agent vault with custom spending limits, whitelisted addresses, and policy rules.',
                color: 'aegis-blue'
              },
              {
                step: '02',
                title: 'Configure Guardrails',
                description: 'Define daily spending limits, transaction restrictions, and approval workflows for your agent.',
                color: 'aegis-purple'
              },
              {
                step: '03',
                title: 'Monitor & Control',
                description: 'Track transactions in real-time, approve override requests, and adjust policies as needed.',
                color: 'aegis-emerald'
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start">
                <div className="flex items-center gap-3 sm:block">
                  <div className={`text-3xl sm:text-6xl font-bold text-${item.color}/30 sm:min-w-[80px]`}>
                    {item.step}
                  </div>
                  <CheckCircle2 className={`w-6 h-6 sm:hidden text-${item.color}`} />
                </div>
                <Card className="glass-card flex-1 border-white/10 w-full">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-2xl font-semibold text-aegis-text-primary mb-1.5 sm:mb-2">
                      {item.title}
                    </h3>
                    <p className="text-aegis-text-secondary text-sm sm:text-lg">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
                <CheckCircle2 className={`hidden sm:block w-8 h-8 text-${item.color} mt-6`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="glass-card border-aegis-blue/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-aegis-blue/10 via-aegis-purple/10 to-aegis-emerald/10"></div>
            <CardContent className="p-6 sm:p-12 text-center relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-aegis-text-primary mb-3 sm:mb-4">
                Ready to Secure Your AI Agents?
              </h2>
              <p className="text-aegis-text-secondary text-sm sm:text-lg mb-6 sm:mb-8 px-2">
                Connect your wallet and start building with Aegis today.
              </p>
              {connected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto bg-aegis-blue hover:bg-aegis-blue/80 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <WalletButton className="w-full sm:w-auto !bg-aegis-blue !text-white !px-6 sm:!px-8 !py-4 sm:!py-6 !text-base sm:!text-lg !h-auto !rounded-lg hover:!bg-aegis-blue/80 transition-all !font-medium" />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-aegis-blue" />
                <span className="font-bold text-aegis-text-primary">AEGIS</span>
              </div>
              <span className="text-aegis-text-tertiary text-xs sm:text-sm sm:ml-2">
                © 2024 Aegis. Built on Solana.
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="https://docs.aegis-vaults.xyz/" target="_blank" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors text-sm">
                Docs
              </Link>
              <Link href="https://github.com/aegis-vaults" target="_blank" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors text-sm">
                GitHub
              </Link>
              <Link href="https://twitter.com" target="_blank" className="text-aegis-text-secondary hover:text-aegis-text-primary transition-colors text-sm">
                Twitter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
