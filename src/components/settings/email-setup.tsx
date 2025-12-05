'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import { toast } from 'sonner';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface EmailSetupProps {
  user: NotificationProfile | null;
  onUpdate?: () => void;
}

export function EmailSetup({ user, onUpdate }: EmailSetupProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleUpdateEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await notificationApi.updateProfile({ email });

      if (result.success) {
        toast.success('Email updated. Please verify your email.');
        // Auto-send verification
        await handleSendVerification();
        onUpdate?.();
      } else {
        toast.error(result.error?.message || 'Failed to update email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      const result = await notificationApi.sendEmailVerification();

      if (result.success) {
        toast.success('Verification email sent! Check your inbox.');
      } else {
        toast.error(result.error?.message || 'Failed to send verification');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleTest = async () => {
    setSendingTest(true);
    try {
      const result = await notificationApi.testEmail();

      if (result.success) {
        toast.success('Test email sent! Check your inbox.');
      } else {
        toast.error(result.error?.message || 'Failed to send test email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-bold text-caldera-black flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-caldera-info" />
          Email Address
        </label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            className="flex-1 rounded-2xl border-2 border-caldera-off-white font-medium"
          />
          <Button
            onClick={handleUpdateEmail}
            disabled={loading || !email || email === user?.email}
            size="sm"
            className="rounded-2xl font-bold bg-caldera-info hover:bg-caldera-info/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {user?.email && (
        <div className="flex items-center gap-3 pl-6 flex-wrap">
          {user.emailVerified ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-caldera-success/10 rounded-xl border-2 border-caldera-success/20">
                <CheckCircle2 className="w-4 h-4 text-caldera-success" />
                <span className="text-sm text-caldera-success font-bold">Verified</span>
              </div>
              <Button
                onClick={handleTest}
                variant="outline"
                size="sm"
                disabled={sendingTest}
                className="rounded-xl border-2 border-caldera-off-white hover:bg-caldera-light-gray font-bold"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-caldera-yellow/10 rounded-xl border-2 border-caldera-yellow/30">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-600 font-bold">Not verified</span>
              </div>
              <Button
                onClick={handleSendVerification}
                variant="outline"
                size="sm"
                disabled={sendingVerification}
                className="rounded-xl border-2 border-caldera-off-white hover:bg-caldera-light-gray font-bold"
              >
                {sendingVerification ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification'
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
