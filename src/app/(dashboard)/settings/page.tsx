'use client';

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
        <h1 className="text-3xl font-display font-black text-caldera-black">Settings</h1>
        <p className="text-caldera-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-caldera-info" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Account</h2>
              <p className="text-sm text-caldera-text-muted">Your wallet and account information</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div>
            <label className="text-sm font-medium text-caldera-text-secondary">Wallet Address</label>
            <div className="mt-2 flex items-center gap-3">
              <code className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm font-mono text-caldera-black">
                {connected && publicKey ? formatAddress(publicKey.toString(), 8) : 'Not connected'}
              </code>
              <Badge 
                className={connected 
                  ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20' 
                  : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                }
              >
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-caldera-purple" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Notifications</h2>
              <p className="text-sm text-caldera-text-muted">
                Configure how and when you receive notifications about your vaults
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {!connected ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-caldera-text-muted" />
              </div>
              <p className="text-caldera-text-secondary">Connect your wallet to manage notification settings</p>
            </div>
          ) : profileLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-caldera-orange" />
              <p className="text-sm text-caldera-text-muted mt-3">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="font-semibold text-caldera-black mb-4">
                  Notification Channels
                </h3>
                <div className="space-y-6">
                  <EmailSetup user={profile} onUpdate={refresh} />
                  <div className="border-t border-gray-100" />
                  <TelegramSetup user={profile} onUpdate={refresh} />
                  <div className="border-t border-gray-100" />
                  <DiscordSetup user={profile} onUpdate={refresh} />
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-caldera-black mb-4">
                  Notification Preferences
                </h3>
                <p className="text-sm text-caldera-text-muted mb-4">
                  Choose which events trigger notifications across all your channels
                </p>
                <NotificationPreferences user={profile} onUpdate={refresh} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
      {connected && publicKey && (
        <ApiKeysSection userId={publicKey.toString()} />
      )}

      {/* Security Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-caldera-success" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Security</h2>
              <p className="text-sm text-caldera-text-muted">Security and privacy settings</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-caldera-black">Two-Factor Authentication</p>
              <p className="text-sm text-caldera-text-muted mt-0.5">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 hover:bg-gray-100">
              Setup
            </Button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-caldera-orange" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Appearance</h2>
              <p className="text-sm text-caldera-text-muted">Customize how Aegis looks</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div>
            <label className="text-sm font-medium text-caldera-text-secondary">Theme</label>
            <div className="mt-2">
              <Badge className="bg-caldera-orange/10 text-caldera-orange border-caldera-orange/20">
                Light (Default)
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
