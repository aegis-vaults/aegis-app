/**
 * Vault Health Scoring System
 * Commercial feature: Risk assessment and health indicators
 */

export interface VaultHealthMetrics {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface VaultHealthInputs {
  // Balance metrics
  vaultBalance: number; // in SOL
  agentBalance: number; // in SOL
  dailyLimit: number; // in lamports
  dailySpent: number; // in lamports

  // Activity metrics
  isPaused: boolean;
  lastActivityTimestamp?: number; // Unix timestamp
  totalTransactions: number;
  successfulTransactions: number;
  blockedTransactions: number;

  // Configuration
  hasWhitelist: boolean;
  whitelistCount: number;
  hasAgentSigner: boolean;
}

/**
 * Calculate comprehensive health score for a vault
 */
export function calculateVaultHealth(inputs: VaultHealthInputs): VaultHealthMetrics {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100; // Start at perfect score

  // Factor 1: Vault Balance (20 points)
  if (inputs.vaultBalance === 0) {
    score -= 20;
    issues.push('Vault has zero balance');
    recommendations.push('Fund your vault to enable transactions');
  } else if (inputs.vaultBalance < 0.1) {
    score -= 10;
    warnings.push('Vault balance is low');
    recommendations.push('Consider adding more funds to avoid running out');
  }

  // Factor 2: Agent Balance (20 points)
  if (!inputs.hasAgentSigner) {
    score -= 15;
    issues.push('No agent signer configured');
  } else if (inputs.agentBalance < 0.005) {
    score -= 20;
    issues.push('Agent wallet critically low on gas');
    recommendations.push('Fund agent wallet immediately to avoid transaction failures');
  } else if (inputs.agentBalance < 0.01) {
    score -= 10;
    warnings.push('Agent wallet running low on gas');
    recommendations.push('Top up agent wallet soon');
  }

  // Factor 3: Activity Status (15 points)
  if (inputs.isPaused) {
    score -= 15;
    warnings.push('Vault is paused');
    recommendations.push('Resume vault to enable transactions');
  }

  // Factor 4: Recent Activity (15 points)
  if (inputs.lastActivityTimestamp) {
    const hoursSinceActivity = (Date.now() - inputs.lastActivityTimestamp) / (1000 * 60 * 60);
    if (hoursSinceActivity > 168) { // 1 week
      score -= 15;
      warnings.push('No activity in over a week');
    } else if (hoursSinceActivity > 72) { // 3 days
      score -= 5;
      warnings.push('No recent activity (3+ days)');
    }
  } else if (inputs.totalTransactions === 0) {
    score -= 10;
    warnings.push('No transactions yet');
    recommendations.push('Test your vault with a small transaction');
  }

  // Factor 5: Transaction Success Rate (15 points)
  if (inputs.totalTransactions > 0) {
    const successRate = inputs.successfulTransactions / inputs.totalTransactions;
    if (successRate < 0.5) {
      score -= 15;
      issues.push(`Low success rate (${(successRate * 100).toFixed(0)}%)`);
      recommendations.push('Review your daily limits and whitelist configuration');
    } else if (successRate < 0.7) {
      score -= 10;
      warnings.push(`Moderate success rate (${(successRate * 100).toFixed(0)}%)`);
    } else if (successRate < 0.9) {
      score -= 5;
      warnings.push(`Some blocked transactions (${(successRate * 100).toFixed(0)}% success)`);
    }
  }

  // Factor 6: Daily Limit Utilization (10 points)
  const dailyLimitSol = inputs.dailyLimit / 1e9;
  const dailySpentSol = inputs.dailySpent / 1e9;
  if (dailyLimitSol > 0) {
    const utilizationRate = dailySpentSol / dailyLimitSol;
    if (utilizationRate > 0.95) {
      score -= 10;
      warnings.push('Daily limit nearly exhausted');
      recommendations.push('Consider increasing daily limit or wait for reset');
    } else if (utilizationRate > 0.8) {
      score -= 5;
      warnings.push('Daily limit over 80% used');
    }
  }

  // Factor 7: Security Configuration (5 points)
  if (!inputs.hasWhitelist) {
    score -= 3;
    warnings.push('No whitelist configured (lower security)');
    recommendations.push('Enable whitelist for additional security');
  } else if (inputs.whitelistCount === 0) {
    score -= 2;
    warnings.push('Whitelist enabled but empty');
  }

  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine status based on score
  let status: VaultHealthMetrics['status'];
  if (score >= 90) {
    status = 'excellent';
  } else if (score >= 75) {
    status = 'good';
  } else if (score >= 50) {
    status = 'fair';
  } else if (score >= 25) {
    status = 'poor';
  } else {
    status = 'critical';
  }

  return {
    score,
    status,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Get color for health score
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 90) return 'text-caldera-success';
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 25) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color for health score
 */
export function getHealthScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-caldera-success/10';
  if (score >= 75) return 'bg-green-50';
  if (score >= 50) return 'bg-yellow-50';
  if (score >= 25) return 'bg-orange-50';
  return 'bg-red-50';
}

/**
 * Get status badge color
 */
export function getHealthStatusColor(status: VaultHealthMetrics['status']): string {
  switch (status) {
    case 'excellent':
      return 'bg-caldera-success/10 text-caldera-success border-caldera-success/20';
    case 'good':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'fair':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'poor':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

/**
 * Get gauge color for visual indicators
 */
export function getGaugeColor(percentage: number): string {
  if (percentage >= 90) return '#10b981'; // green-500
  if (percentage >= 75) return '#84cc16'; // lime-500
  if (percentage >= 50) return '#eab308'; // yellow-500
  if (percentage >= 25) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}
