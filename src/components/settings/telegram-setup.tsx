'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import { toast } from 'sonner';
import { Send, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

interface TelegramSetupProps {
  user: NotificationProfile | null;
  onUpdate?: () => void;
}

export function TelegramSetup({ user, onUpdate }: TelegramSetupProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      const result = await notificationApi.linkTelegram();

      if (result.success && result.data) {
        // Open Telegram deep link in new tab
        window.open(result.data.botLink, '_blank');
        toast.success('Opening Telegram... Send /start to link your account.', {
          duration: 6000,
        });

        // Poll for updates
        setTimeout(() => {
          onUpdate?.();
        }, 3000);
      } else {
        toast.error(result.error?.message || 'Failed to generate link');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink Telegram?')) return;

    setUnlinking(true);
    try {
      const result = await notificationApi.unlinkTelegram();

      if (result.success) {
        toast.success('Telegram unlinked successfully');
        onUpdate?.();
      } else {
        toast.error(result.error?.message || 'Failed to unlink');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlink');
    } finally {
      setUnlinking(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await notificationApi.testTelegram();

      if (result.success) {
        toast.success('Test message sent! Check your Telegram.');
      } else {
        toast.error(result.error?.message || 'Failed to send test');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-bold text-caldera-black flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-caldera-info" />
          Telegram
        </label>

        {user?.telegramChatId ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pl-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-caldera-success/10 rounded-xl border-2 border-caldera-success/20">
                <CheckCircle2 className="w-4 h-4 text-caldera-success" />
                <span className="text-sm text-caldera-success font-bold">
                  Connected{user.telegramUsername ? ` as @${user.telegramUsername}` : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pl-6 flex-wrap">
              <Button
                onClick={handleTest}
                variant="outline"
                size="sm"
                disabled={testing}
                className="rounded-xl border-2 border-caldera-off-white hover:bg-caldera-light-gray font-bold"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test'
                )}
              </Button>
              <Button
                onClick={handleUnlink}
                variant="outline"
                size="sm"
                disabled={unlinking}
                className="rounded-xl border-2 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold"
              >
                {unlinking ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  'Unlink'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              onClick={handleLink}
              disabled={loading}
              size="sm"
              className="ml-6 rounded-2xl font-bold bg-caldera-info hover:bg-caldera-info/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  Connect Telegram
                  <ExternalLink className="w-3 h-3 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-caldera-text-muted mt-2 pl-6 font-medium">
              You'll be redirected to Telegram. Send /start to complete the setup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
