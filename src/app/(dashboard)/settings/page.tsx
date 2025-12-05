'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatAddress } from '@/lib/utils';
import { Wallet, Bell, Loader2, Key } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto">
      {/* Hero Header with Halftone Pattern */}
      <div className="relative overflow-hidden rounded-caldera-xl bg-caldera-orange mb-6 p-6 md:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="halftone-dots-lg w-full h-full" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-white tracking-tighter mb-2">
            Settings
          </h1>
          <p className="text-white/90 text-base md:text-lg font-body font-medium">
            Configure your account, notifications, and security preferences
          </p>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-caldera-purple/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Two Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Account Settings */}
          <div className="superellipse-lg bg-white shadow-caldera overflow-hidden border-2 border-caldera-off-white/50">
            <div className="bg-gradient-to-br from-caldera-info via-caldera-purple to-caldera-info/80 p-5 relative overflow-hidden">
              <div className="halftone-dots-sm absolute inset-0 opacity-10" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-body font-bold text-white tracking-tight">Account</h2>
                  <p className="text-white/80 text-sm font-medium">Wallet connection</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <label className="text-xs font-semibold text-caldera-text-secondary uppercase tracking-wide mb-2 block">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-[200px] px-4 py-3 bg-caldera-light-gray rounded-2xl text-sm font-mono text-caldera-black font-semibold border-2 border-caldera-off-white">
                  {connected && publicKey ? formatAddress(publicKey.toString(), 8) : 'Not connected'}
                </code>
                <Badge
                  className={`${
                    connected
                      ? 'bg-caldera-success/15 text-caldera-success border-2 border-caldera-success/30'
                      : 'bg-caldera-medium-gray/10 text-caldera-medium-gray border-2 border-caldera-medium-gray/20'
                  } px-3 py-1.5 text-xs font-bold uppercase tracking-wide`}
                >
                  {connected ? '● Connected' : '○ Disconnected'}
                </Badge>
              </div>
            </div>
          </div>

          {/* API Keys - Moved to left column when connected */}
          {connected && publicKey && (
            <div className="superellipse-lg bg-white shadow-caldera overflow-hidden border-2 border-caldera-off-white/50">
              <div className="bg-gradient-to-br from-caldera-info via-blue-600 to-caldera-info/80 p-5 relative overflow-hidden">
                <div className="halftone-dots-sm absolute inset-0 opacity-10" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-body font-bold text-white tracking-tight">API Keys</h2>
                    <p className="text-white/80 text-sm font-medium">SDK integration</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <ApiKeysSection userId={publicKey.toString()} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Notification Settings */}
          <div className="superellipse-lg bg-white shadow-caldera overflow-hidden border-2 border-caldera-off-white/50">
            <div className="bg-gradient-to-br from-caldera-purple via-purple-600 to-caldera-purple/80 p-5 relative overflow-hidden">
              <div className="halftone-dots-sm absolute inset-0 opacity-10" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-body font-bold text-white tracking-tight">Notifications</h2>
                  <p className="text-white/80 text-sm font-medium">Channels & preferences</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {!connected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-3xl bg-caldera-light-gray flex items-center justify-center mx-auto mb-3 border-2 border-caldera-off-white">
                    <Wallet className="w-8 h-8 text-caldera-medium-gray" />
                  </div>
                  <p className="text-caldera-text-secondary font-semibold text-sm">Connect your wallet to manage notifications</p>
                </div>
              ) : profileLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-caldera-orange mb-2" />
                  <p className="text-sm text-caldera-text-muted font-medium">Loading settings...</p>
                </div>
              ) : (
                <Tabs defaultValue="channels" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-caldera-light-gray p-1 rounded-2xl">
                    <TabsTrigger
                      value="channels"
                      className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Channels
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Preferences
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="channels" className="space-y-4 mt-0">
                    <EmailSetup user={profile} onUpdate={refresh} />
                    <div className="border-t-2 border-caldera-off-white" />
                    <TelegramSetup user={profile} onUpdate={refresh} />
                    <div className="border-t-2 border-caldera-off-white" />
                    <DiscordSetup user={profile} onUpdate={refresh} />
                  </TabsContent>

                  <TabsContent value="preferences" className="mt-0">
                    <p className="text-xs text-caldera-text-muted mb-3 font-medium">
                      Choose which events trigger notifications
                    </p>
                    <NotificationPreferences user={profile} onUpdate={refresh} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
