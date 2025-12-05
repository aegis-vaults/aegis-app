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
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-caldera-info" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">API Keys</h2>
              <p className="text-sm text-caldera-text-muted">Manage API keys for SDK access to your vaults</p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-caldera-info hover:bg-caldera-info/90 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Save this key securely. You won&apos;t be able to see it again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Your API Key</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 rounded-xl font-mono text-sm overflow-hidden text-caldera-black">
                          {showCreatedKey ? createdKey : '•'.repeat(48)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setShowCreatedKey(!showCreatedKey)}
                        >
                          {showCreatedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => copyToClipboard(createdKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-caldera-yellow/10 border border-caldera-yellow/30 rounded-xl">
                      <p className="text-sm text-caldera-text-secondary">
                        <strong>Important:</strong> Store this key securely. You won&apos;t be able to view it again after closing this dialog.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreateDialog} className="rounded-xl">
                      I&apos;ve saved my key
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key to access Aegis programmatically via the SDK.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="My Production Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        disabled={createMutation.isPending}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-caldera-text-muted">
                        A friendly name to help you identify this key
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={createMutation.isPending}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={createMutation.isPending}
                      className="bg-caldera-info hover:bg-caldera-info/90 rounded-xl"
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
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-caldera-orange" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-caldera-text-muted" />
            </div>
            <p className="text-caldera-text-secondary">No API keys yet</p>
            <p className="text-sm text-caldera-text-muted mt-1">Create your first API key to use the Aegis SDK</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-caldera-black">{key.name}</div>
                    <Badge 
                      className={key.isActive 
                        ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20' 
                        : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                      }
                    >
                      {key.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-caldera-text-muted">
                    <code className="font-mono">{key.prefix}...</code>
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
                    className="rounded-xl border-gray-200 hover:bg-gray-100"
                    onClick={() => {
                      if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                        revokeMutation.mutate(key.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
