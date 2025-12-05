'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import { toast } from 'sonner';
import { MessageSquare, ExternalLink, Loader2, Trash2 } from 'lucide-react';

interface DiscordSetupProps {
  user: NotificationProfile | null;
  onUpdate?: () => void;
}

export function DiscordSetup({ user, onUpdate }: DiscordSetupProps) {
  const [webhookUrl, setWebhookUrl] = useState(user?.discordWebhook || '');
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isValidWebhookUrl = (url: string) => {
    return url.startsWith('https://discord.com/api/webhooks/') || 
           url.startsWith('https://discordapp.com/api/webhooks/');
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (!isValidWebhookUrl(webhookUrl)) {
      toast.error('Invalid Discord webhook URL');
      return;
    }

    setTesting(true);
    try {
      const result = await notificationApi.testDiscord(webhookUrl);

      if (result.success) {
        toast.success('Test message sent! Check your Discord channel.');
        // Auto-save on successful test
        await handleSave();
      } else {
        toast.error(result.error?.message || 'Failed to send test message');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test message');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = await notificationApi.updateProfile({ 
        discordWebhook: webhookUrl || null 
      });

      if (result.success) {
        toast.success('Discord webhook saved');
        onUpdate?.();
      } else {
        toast.error('Failed to save webhook');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save webhook');
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this Discord webhook?')) return;

    setRemoving(true);
    try {
      const result = await notificationApi.updateProfile({ discordWebhook: null });

      if (result.success) {
        setWebhookUrl('');
        toast.success('Discord webhook removed');
        onUpdate?.();
      } else {
        toast.error('Failed to remove webhook');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove webhook');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-aegis-text-primary flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Discord Webhook URL
        </label>
        <div className="flex gap-2 mt-2">
          <Input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            disabled={testing}
            className="flex-1 font-mono text-sm"
          />
          <Button 
            onClick={handleTest} 
            disabled={testing || !webhookUrl}
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test & Save'
            )}
          </Button>
        </div>
        
        {user?.discordWebhook && (
          <Button 
            onClick={handleRemove} 
            variant="destructive" 
            size="sm" 
            className="mt-2 ml-6"
            disabled={removing}
          >
            {removing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </>
            )}
          </Button>
        )}
        
        <div className="text-xs text-aegis-text-tertiary mt-2 pl-6 flex items-center gap-1">
          <a
            href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-aegis-text-secondary flex items-center gap-1"
          >
            How to create a Discord webhook
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}



