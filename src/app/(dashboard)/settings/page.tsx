'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatAddress } from '@/lib/utils';
import { Wallet, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-aegis-text-primary">Settings</h1>
        <p className="text-aegis-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-aegis-blue" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>Your wallet and account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-aegis-text-secondary">Wallet Address</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-aegis-bg-tertiary rounded-lg text-sm font-mono">
                {connected && publicKey ? formatAddress(publicKey.toString(), 8) : 'Not connected'}
              </code>
              <Badge variant={connected ? 'default' : 'outline'}>
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-aegis-purple" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-aegis-text-primary">Transaction Alerts</div>
              <div className="text-sm text-aegis-text-tertiary">Get notified about new transactions</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-aegis-text-primary">Override Requests</div>
              <div className="text-sm text-aegis-text-tertiary">Get notified about override requests</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-aegis-emerald" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Security and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-aegis-text-primary">Two-Factor Authentication</div>
              <div className="text-sm text-aegis-text-tertiary">Add an extra layer of security</div>
            </div>
            <Button variant="outline" size="sm">Setup</Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-aegis-amber" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how Aegis looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-aegis-text-secondary">Theme</label>
            <div className="mt-2">
              <Badge>Dark (Default)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
