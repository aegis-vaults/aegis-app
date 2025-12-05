'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { CONFIG } from '@/lib/constants';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  vaultId?: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string;
  rateLimit: number;
  expiresAt?: string;
  createdAt: string;
}

export function ApiKeysSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(true);

  // Fetch API keys
  const { data, isLoading } = useQuery({
    queryKey: ['api-keys', userId],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.GUARDIAN_API_URL}/api/api-keys`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const json = await response.json();
      return json.data?.items || [];
    },
  });

  const apiKeys: ApiKey[] = data || [];

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch(`${CONFIG.GUARDIAN_API_URL}/api/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          name,
          permissions: ['vault:read', 'vault:write'],
        }),
      });
      if (!response.ok) throw new Error('Failed to create API key');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', userId] });
      setCreatedKey(data.data.key);
      setShowCreatedKey(true);
      toast.success('API key created successfully');
      setNewKeyName('');
    },
    onError: () => {
      toast.error('Failed to create API key');
    },
  });

  // Revoke API key mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `${CONFIG.GUARDIAN_API_URL}/api/api-keys/${id}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to revoke API key');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', userId] });
      toast.success('API key revoked successfully');
    },
    onError: () => {
      toast.error('Failed to revoke API key');
    },
  });

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    await createMutation.mutateAsync(newKeyName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreatedKey(null);
    setNewKeyName('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-caldera-text-muted font-medium">
          Manage API keys for SDK access to your vaults
        </p>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-caldera-info hover:bg-caldera-info/90 rounded-2xl font-bold border-2 border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-caldera-lg">
            {createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle className="font-body">API Key Created</DialogTitle>
                  <DialogDescription>
                    Save this key securely. You won&apos;t be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Your API Key</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-caldera-light-gray rounded-2xl font-mono text-sm overflow-hidden text-caldera-black border-2 border-caldera-off-white">
                        {showCreatedKey ? createdKey : '•'.repeat(48)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-2"
                        onClick={() => setShowCreatedKey(!showCreatedKey)}
                      >
                        {showCreatedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-2"
                        onClick={() => copyToClipboard(createdKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-caldera-yellow/10 border-2 border-caldera-yellow/30 rounded-2xl">
                    <p className="text-sm text-caldera-text-secondary font-medium">
                      <strong>Important:</strong> Store this key securely. You won&apos;t be able to view it again after closing this dialog.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog} className="rounded-2xl font-bold">
                    I&apos;ve saved my key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="font-body">Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key to access Aegis programmatically via the SDK.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="font-semibold">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="My Production Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      disabled={createMutation.isPending}
                      className="rounded-2xl border-2"
                    />
                    <p className="text-xs text-caldera-text-muted font-medium">
                      A friendly name to help you identify this key
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={createMutation.isPending}
                    className="rounded-2xl border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={createMutation.isPending}
                    className="bg-caldera-info hover:bg-caldera-info/90 rounded-2xl font-bold"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-caldera-orange" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-3xl bg-caldera-light-gray flex items-center justify-center mx-auto mb-4 border-2 border-caldera-off-white">
            <Plus className="w-10 h-10 text-caldera-medium-gray" />
          </div>
          <p className="text-caldera-text-secondary font-semibold mb-1">No API keys yet</p>
          <p className="text-sm text-caldera-text-muted font-medium">Create your first API key to use the Aegis SDK</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-caldera-light-gray border-2 border-caldera-off-white hover:border-caldera-info/30 hover:bg-white transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="font-bold text-caldera-black">{key.name}</div>
                  <Badge
                    className={`${
                      key.isActive
                        ? 'bg-caldera-success/15 text-caldera-success border-2 border-caldera-success/30'
                        : 'bg-caldera-medium-gray/10 text-caldera-medium-gray border-2 border-caldera-medium-gray/20'
                    } px-3 py-1 text-xs font-bold uppercase`}
                  >
                    {key.isActive ? '● Active' : '○ Revoked'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-caldera-text-muted font-medium">
                  <code className="font-mono font-semibold">{key.prefix}...</code>
                  <span>•</span>
                  <span>Created {formatRelativeTime(key.createdAt)}</span>
                  {key.lastUsedAt && (
                    <>
                      <span>•</span>
                      <span>Last used {formatRelativeTime(key.lastUsedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              {key.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-2 border-caldera-off-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 font-bold"
                  onClick={() => {
                    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                      revokeMutation.mutate(key.id);
                    }
                  }}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
