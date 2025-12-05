'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferencesProps {
  user: NotificationProfile | null;
  onUpdate?: () => void;
}

export function NotificationPreferences({ user, onUpdate }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState({
    notifyOnBlocked: user?.notifyOnBlocked ?? true,
    notifyOnExecuted: user?.notifyOnExecuted ?? false,
    notifyOnOverride: user?.notifyOnOverride ?? true,
  });
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    // Optimistic update
    setPrefs({ ...prefs, [key]: value });
    setUpdating(key);

    try {
      const result = await notificationApi.updateProfile({ [key]: value });

      if (result.success) {
        toast.success('Preferences updated');
        onUpdate?.();
      } else {
        // Revert on error
        setPrefs(prefs);
        toast.error('Failed to update preferences');
      }
    } catch (error: any) {
      // Revert on error
      setPrefs(prefs);
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setUpdating(null);
    }
  };

  const preferenceItems = [
    {
      key: 'notifyOnBlocked' as const,
      icon: AlertCircle,
      title: 'Transaction Blocked',
      description: 'Get notified when transactions are blocked by policy',
      color: 'text-aegis-crimson',
    },
    {
      key: 'notifyOnExecuted' as const,
      icon: CheckCircle,
      title: 'Transaction Executed',
      description: 'Get notified for every executed transaction',
      color: 'text-aegis-emerald',
    },
    {
      key: 'notifyOnOverride' as const,
      icon: Bell,
      title: 'Override Requests',
      description: 'Get notified when override requests are created',
      color: 'text-aegis-amber',
    },
  ];

  return (
    <div className="space-y-4">
      {preferenceItems.map((item) => {
        const Icon = item.icon;
        const isUpdating = updating === item.key;
        
        return (
          <div 
            key={item.key} 
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
              <div className="flex-1">
                <div className="font-medium text-aegis-text-primary">{item.title}</div>
                <div className="text-sm text-aegis-text-tertiary mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
              disabled={isUpdating}
            />
          </div>
        );
      })}
    </div>
  );
}



