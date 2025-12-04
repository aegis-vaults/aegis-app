'use client';

import { useMemo } from 'react';
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
  const vaults = useMemo(() => vaultsData?.data?.items || [], [vaultsData?.data?.items]);

  const securityAnalysis = useMemo(() => {
    const checks: SecurityCheck[] = [];
    let score = 100;

    vaults.forEach((vault) => {
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

      if (vault.paused) {
        checks.push({
          name: `Vault is paused`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: Vault is in safe/paused state`,
          vaultId: vault.id,
        });
      }

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

      if (vault.agentSigner) {
        checks.push({
          name: `Agent signer configured`,
          status: 'pass',
          description: `${vault.name || 'Unnamed Vault'}: AI agent key is set`,
          vaultId: vault.id,
        });
      }

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
    if (score >= 80) return 'text-caldera-success';
    if (score >= 60) return 'text-caldera-yellow';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', className: 'bg-caldera-success/10 text-caldera-success border-caldera-success/20' };
    if (score >= 60) return { text: 'Good', className: 'bg-caldera-yellow/20 text-yellow-700 border-caldera-yellow/30' };
    return { text: 'Needs Attention', className: 'bg-red-100 text-red-600 border-red-200' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
      </div>
    );
  }

  const scoreBadge = getScoreBadge(securityAnalysis.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black text-caldera-black">Security Center</h1>
        <p className="text-caldera-text-secondary mt-1">Monitor and manage security settings</p>
      </div>

      {/* Security Score */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-caldera-purple" />
            </div>
            <h2 className="text-lg font-display font-bold text-caldera-black">Security Score</h2>
          </div>
          <Badge className={scoreBadge.className}>
            {scoreBadge.text}
          </Badge>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className={`w-32 h-32 rounded-full border-8 ${
              securityAnalysis.score >= 80 
                ? 'border-caldera-success/20' 
                : securityAnalysis.score >= 60 
                  ? 'border-caldera-yellow/20' 
                  : 'border-red-100'
            } flex items-center justify-center bg-white`}>
              <span className={`text-4xl font-display font-black ${getScoreColor(securityAnalysis.score)}`}>
                {vaults.length === 0 ? '--' : securityAnalysis.score}
              </span>
            </div>
          </div>
          {vaults.length === 0 && (
            <p className="text-center text-caldera-text-secondary">Create a vault to see your security score</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-caldera-info" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-caldera-black">{vaults.length}</p>
              <p className="text-xs text-caldera-text-muted">Protected Vaults</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-caldera-success" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-caldera-success">{securityAnalysis.passCount}</p>
              <p className="text-xs text-caldera-text-muted">Checks Passed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-caldera-orange" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-caldera-orange">{securityAnalysis.warningCount}</p>
              <p className="text-xs text-caldera-text-muted">Warnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-red-500">{securityAnalysis.failCount}</p>
              <p className="text-xs text-caldera-text-muted">Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Checks */}
      {securityAnalysis.checks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <List className="w-5 h-5 text-caldera-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">Security Checks</h2>
                <p className="text-sm text-caldera-text-muted">Detailed analysis of your vault security</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {securityAnalysis.checks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    check.status === 'pass'
                      ? 'bg-caldera-success/5 border border-caldera-success/10'
                      : check.status === 'warning'
                        ? 'bg-caldera-orange/5 border border-caldera-orange/10'
                        : 'bg-red-50 border border-red-100'
                  }`}
                >
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-caldera-success flex-shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-caldera-orange flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-caldera-black">{check.name}</p>
                    <p className="text-xs text-caldera-text-secondary mt-0.5">{check.description}</p>
                  </div>
                  {check.vaultId && (
                    <Link href={`/vaults/${check.vaultId}`}>
                      <Button variant="ghost" size="sm" className="text-xs rounded-lg">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-caldera-info" />
            </div>
            <h3 className="text-lg font-display font-bold text-caldera-black">On-Chain Protection</h3>
          </div>
          <p className="text-caldera-text-secondary text-sm leading-relaxed">
            All vaults are protected with on-chain guardrails. Daily limits, whitelist restrictions, 
            and override delays are enforced by the Solana program—not just our backend.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-caldera-purple" />
            </div>
            <h3 className="text-lg font-display font-bold text-caldera-black">Key Separation</h3>
          </div>
          <p className="text-caldera-text-secondary text-sm leading-relaxed">
            Your wallet remains the sole owner. Agent signers can propose transactions within limits, 
            but only you can approve overrides and modify policies.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-caldera-success" />
            </div>
            <h3 className="text-lg font-display font-bold text-caldera-black">Agent Key Rotation</h3>
          </div>
          <p className="text-caldera-text-secondary text-sm leading-relaxed">
            Rotate agent signer keys anytime from vault settings. If your agent key is compromised, 
            update it immediately—the on-chain limits still protect your funds.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-caldera-orange" />
            </div>
            <h3 className="text-lg font-display font-bold text-caldera-black">Team Access Control</h3>
          </div>
          <p className="text-caldera-text-secondary text-sm leading-relaxed">
            Add team members with different roles. Owners have full control, Admins can modify settings, 
            Members can view activity, and Viewers have read-only access.
          </p>
        </div>
      </div>

      {vaults.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-caldera-text-muted" />
            </div>
            <h3 className="text-xl font-display font-bold text-caldera-black mb-2">No Vaults to Monitor</h3>
            <p className="text-caldera-text-secondary max-w-md">
              Create your first vault to start monitoring security metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
