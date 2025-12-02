'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatAddress } from '@/lib/utils';
import { Wallet, Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { ApiKeysSection } from '@/components/settings/api-keys-section';
import { EmailSetup } from '@/components/settings/email-setup';
import { TelegramSetup } from '@/components/settings/telegram-setup';
import { DiscordSetup } from '@/components/settings/discord-setup';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();
  const { profile, loading: profileLoading, refresh } = useUserProfile();

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
          <CardDescription>
            Configure how and when you receive notifications about your vaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!connected ? (
            <div className="text-center py-8 text-aegis-text-tertiary">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Connect your wallet to manage notification settings</p>
            </div>
          ) : profileLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-aegis-blue" />
              <p className="text-sm text-aegis-text-tertiary mt-2">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="font-semibold text-aegis-text-primary mb-4">
                  Notification Channels
                </h3>
                <div className="space-y-6">
                  <EmailSetup user={profile} onUpdate={refresh} />
                  <div className="border-t border-aegis-border" />
                  <TelegramSetup user={profile} onUpdate={refresh} />
                  <div className="border-t border-aegis-border" />
                  <DiscordSetup user={profile} onUpdate={refresh} />
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border-t border-aegis-border pt-6">
                <h3 className="font-semibold text-aegis-text-primary mb-4">
                  Notification Preferences
                </h3>
                <p className="text-sm text-aegis-text-tertiary mb-4">
                  Choose which events trigger notifications across all your channels
                </p>
                <NotificationPreferences user={profile} onUpdate={refresh} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      {connected && publicKey && (
        <ApiKeysSection userId={publicKey.toString()} />
      )}

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

