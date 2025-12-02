'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Key, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SecurityPage() {
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
            <Badge className="bg-aegis-emerald/20 text-aegis-emerald border-aegis-emerald/30">
              Excellent
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-aegis-emerald/20 flex items-center justify-center">
                <span className="text-4xl font-bold text-aegis-emerald">92</span>
              </div>
              <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-aegis-emerald border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-aegis-blue" />
              <CardTitle>Active Protection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              All vaults are protected with on-chain guardrails and policy enforcement.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-aegis-purple" />
              <CardTitle>Wallet Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              Your wallet connection is secure and encrypted.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-aegis-emerald" />
              <CardTitle>API Keys</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              No API keys generated yet. Create one to integrate with external services.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-aegis-amber" />
              <CardTitle>Recent Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-aegis-text-secondary">
              No security alerts. Your system is secure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
