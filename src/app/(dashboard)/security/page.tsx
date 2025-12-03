'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, XCircle, Users, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVaults } from '@/lib/hooks/use-vaults';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  vaultId?: string;
}

export default function SecurityPage() {
  const { data: vaultsData, isLoading } = useVaults({ myVaults: true });
  const vaults = vaultsData?.data?.items || [];

  // Calculate security metrics
  const securityAnalysis = useMemo(() => {
    const checks: SecurityCheck[] = [];
    let score = 100;

    vaults.forEach((vault) => {
      // Check: Whitelist enabled
      if (!vault.whitelistEnabled && vault.whitelist?.length === 0) {
        checks.push({
          name: `Whitelist not configured`,
          status: 'warning',
          description: `${vault.name || 'Unnamed Vault'}: Consider adding a whitelist for extra security`,
          vaultId: vault.id,
        });
        score -= 5;
      } else if (vault.whitelist?.length > 0) {
        checks.push({
          name: `Whitelist active (${vault.whitelist.length} addresses)`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: Whitelist protection enabled`,
          vaultId: vault.id,
        });
      }

      // Check: Vault is active (not paused for too long is fine)
      if (vault.paused) {
        checks.push({
          name: `Vault is paused`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: Vault is in safe/paused state`,
          vaultId: vault.id,
        });
      }

      // Check: Daily limit is reasonable
      const dailyLimitSol = Number(vault.dailyLimit) / 1e9;
      if (dailyLimitSol > 100) {
        checks.push({
          name: `High daily limit`,
          status: 'warning',
          description: `${vault.name || 'Unnamed Vault'}: Daily limit is ${dailyLimitSol} SOL. Consider lowering for safety.`,
          vaultId: vault.id,
        });
        score -= 10;
      } else if (dailyLimitSol > 0) {
        checks.push({
          name: `Daily limit configured`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: ${dailyLimitSol} SOL daily limit`,
          vaultId: vault.id,
        });
      }

      // Check: Has agent signer
      if (vault.agentSigner) {
        checks.push({
          name: `Agent signer configured`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: AI agent key is set`,
          vaultId: vault.id,
        });
      }

      // Check: Override delay
      if (vault.overrideDelay >= 3600) {
        checks.push({
          name: `Override delay active`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: ${vault.overrideDelay / 3600}h delay for overrides`,
          vaultId: vault.id,
        });
      } else if (vault.overrideDelay < 3600 && vault.overrideDelay > 0) {
        checks.push({
          name: `Short override delay`,
          status: 'warning',
          description: `${vault.name || 'Unnamed Vault'}: Override delay is only ${vault.overrideDelay / 60} minutes`,
          vaultId: vault.id,
        });
        score -= 5;
      }
    });

    // Base checks if no vaults
    if (vaults.length === 0) {
      score = 0;
    }

    return {
      checks,
      score: Math.max(0, Math.min(100, score)),
      passCount: checks.filter((c) => c.status === 'pass').length,
      warningCount: checks.filter((c) => c.status === 'warning').length,
      failCount: checks.filter((c) => c.status === 'fail').length,
    };
  }, [vaults]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-aegis-emerald';
    if (score >= 60) return 'text-aegis-amber';
    return 'text-aegis-crimson';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', className: 'bg-aegis-emerald/20 text-aegis-emerald border-aegis-emerald/30' };
    if (score >= 60) return { text: 'Good', className: 'bg-aegis-amber/20 text-aegis-amber border-aegis-amber/30' };
    return { text: 'Needs Attention', className: 'bg-aegis-crimson/20 text-aegis-crimson border-aegis-crimson/30' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(securityAnalysis.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aegis-text-primary">Security Center</h1>
        <p className="text-aegis-text-secondary mt-1">Monitor and manage security settings</p>
      </div>

      {/* Security Score */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Security Score</CardTitle>
            <Badge className={scoreBadge.className}>
              {scoreBadge.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full border-8 ${
                securityAnalysis.score >= 80 
                  ? 'border-aegis-emerald/20' 
                  : securityAnalysis.score >= 60 
                    ? 'border-aegis-amber/20' 
                    : 'border-aegis-crimson/20'
              } flex items-center justify-center`}>
                <span className={`text-4xl font-bold ${getScoreColor(securityAnalysis.score)}`}>
                  {vaults.length === 0 ? '--' : securityAnalysis.score}
                </span>
              </div>
            </div>
          </div>
          {vaults.length === 0 && (
            <p className="text-center text-aegis-text-secondary">Create a vault to see your security score</p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aegis-blue/10">
                <Shield className="w-5 h-5 text-aegis-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-aegis-text-primary">{vaults.length}</p>
                <p className="text-xs text-aegis-text-tertiary">Protected Vaults</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aegis-emerald/10">
                <CheckCircle className="w-5 h-5 text-aegis-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold text-aegis-emerald">{securityAnalysis.passCount}</p>
                <p className="text-xs text-aegis-text-tertiary">Checks Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aegis-amber/10">
                <AlertTriangle className="w-5 h-5 text-aegis-amber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-aegis-amber">{securityAnalysis.warningCount}</p>
                <p className="text-xs text-aegis-text-tertiary">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aegis-crimson/10">
                <XCircle className="w-5 h-5 text-aegis-crimson" />
              </div>
              <div>
                <p className="text-2xl font-bold text-aegis-crimson">{securityAnalysis.failCount}</p>
                <p className="text-xs text-aegis-text-tertiary">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Checks */}
      {securityAnalysis.checks.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Security Checks
            </CardTitle>
            <CardDescription>Detailed analysis of your vault security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAnalysis.checks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    check.status === 'pass'
                      ? 'bg-aegis-emerald/5 border-aegis-emerald/20'
                      : check.status === 'warning'
                        ? 'bg-aegis-amber/5 border-aegis-amber/20'
                        : 'bg-aegis-crimson/5 border-aegis-crimson/20'
                  }`}
                >
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-aegis-emerald flex-shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-aegis-amber flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-aegis-crimson flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-aegis-text-primary">{check.name}</p>
                    <p className="text-xs text-aegis-text-secondary">{check.description}</p>
                  </div>
                  {check.vaultId && (
                    <Link href={`/vaults/${check.vaultId}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-aegis-blue" />
              <CardTitle>On-Chain Protection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              All vaults are protected with on-chain guardrails. Daily limits, whitelist restrictions, 
              and override delays are enforced by the Solana program—not just our backend.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-aegis-purple" />
              <CardTitle>Key Separation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              Your wallet remains the sole owner. Agent signers can propose transactions within limits, 
              but only you can approve overrides and modify policies.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-aegis-emerald" />
              <CardTitle>Agent Key Rotation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              Rotate agent signer keys anytime from vault settings. If your agent key is compromised, 
              update it immediately—the on-chain limits still protect your funds.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-aegis-amber" />
              <CardTitle>Team Access Control</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              Add team members with different roles. Owners have full control, Admins can modify settings, 
              Members can view activity, and Viewers have read-only access.
            </p>
          </CardContent>
        </Card>
      </div>

      {vaults.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-aegis-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-aegis-text-primary mb-2">No Vaults to Monitor</h3>
            <p className="text-aegis-text-secondary text-center max-w-md">
              Create your first vault to start monitoring security metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
