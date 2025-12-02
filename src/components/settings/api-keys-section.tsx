'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-aegis-blue" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-aegis-blue hover:bg-aegis-blue/90">
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
                        <div className="flex-1 px-3 py-2 bg-aegis-bg-tertiary rounded-lg font-mono text-sm overflow-hidden">
                          {showCreatedKey ? createdKey : '•'.repeat(48)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCreatedKey(!showCreatedKey)}
                        >
                          {showCreatedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(createdKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-aegis-amber/10 border border-aegis-amber/30 rounded-lg">
                      <p className="text-sm text-aegis-text-secondary">
                        <strong>Important:</strong> Store this key securely. You won&apos;t be able to view it again after closing this dialog.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreateDialog}>
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
                      />
                      <p className="text-xs text-aegis-text-tertiary">
                        A friendly name to help you identify this key
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={createMutation.isPending}
                      className="bg-aegis-blue hover:bg-aegis-blue/90"
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
        <CardDescription>Manage API keys for SDK access to your vaults</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-aegis-blue" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-aegis-text-secondary">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Create your first API key to use the Aegis SDK</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 rounded-lg bg-aegis-bg-tertiary/50 hover:bg-aegis-bg-tertiary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-aegis-text-primary">{key.name}</div>
                    <Badge variant={key.isActive ? 'default' : 'outline'}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-aegis-text-tertiary">
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
      </CardContent>
    </Card>
  );
}
