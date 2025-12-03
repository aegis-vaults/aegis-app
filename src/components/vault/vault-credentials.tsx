'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Eye, EyeOff, Code2, Book, Sparkles } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VaultCredentialsProps {
  vaultAddress: string;
  agentSigner: string;
  vaultName?: string;
}

export function VaultCredentials({ vaultAddress, agentSigner, vaultName }: VaultCredentialsProps) {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showFullAgent, setShowFullAgent] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const displayVaultAddress = showFullAddress ? vaultAddress : formatAddress(vaultAddress, 8);
  const displayAgentSigner = showFullAgent ? agentSigner : formatAddress(agentSigner, 8);

  return (
    <Card className="glass-card border-aegis-blue/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-aegis-blue" />
          <CardTitle>Vault Credentials & Integration</CardTitle>
        </div>
        <CardDescription>
          Use these credentials to integrate your AI agent with this vault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vault Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-aegis-text-secondary">Vault Address</span>
              <Badge variant="outline" className="text-xs">Required</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="h-7 text-xs"
            >
              {showFullAddress ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Show Full
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
            <code className="flex-1 text-sm font-mono text-aegis-emerald break-all">
              {displayVaultAddress}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(vaultAddress, 'Vault Address')}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {copiedField === 'Vault Address' ? (
                <Check className="w-4 h-4 text-aegis-emerald" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Agent Signer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-aegis-text-secondary">Agent Public Key</span>
              <Badge variant="outline" className="text-xs">Required</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAgent(!showFullAgent)}
              className="h-7 text-xs"
            >
              {showFullAgent ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Show Full
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
            <code className="flex-1 text-sm font-mono text-aegis-blue break-all">
              {displayAgentSigner}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(agentSigner, 'Agent Public Key')}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {copiedField === 'Agent Public Key' ? (
                <Check className="w-4 h-4 text-aegis-emerald" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-aegis-text-tertiary">
            This is the public key of the AI agent authorized to propose transactions for this vault.
          </p>
        </div>

        {/* Integration Tabs */}
        <div className="pt-4 border-t border-aegis-border">
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-aegis-bg-tertiary/50">
              <TabsTrigger value="quickstart">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="langchain">LangChain</TabsTrigger>
            </TabsList>

            {/* Quick Start */}
            <TabsContent value="quickstart" className="space-y-3 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-aegis-text-primary">1. Install the SDK</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-aegis-bg-primary border border-aegis-border overflow-x-auto">
                    <code className="text-xs font-mono text-aegis-text-primary">npm install @aegis-vaults/sdk</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('npm install @aegis-vaults/sdk', 'Command')}
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                  >
                    {copiedField === 'Command' ? (
                      <Check className="w-3 h-3 text-aegis-emerald" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-aegis-text-primary">2. Initialize the client</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-aegis-bg-primary border border-aegis-border overflow-x-auto">
                    <code className="text-xs font-mono text-aegis-text-primary whitespace-pre">{`import { AegisClient } from '@aegis-vaults/sdk';
import { Keypair } from '@solana/web3.js';

// Load your agent's keypair (securely!)
const agentKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.AGENT_SECRET_KEY))
);

const client = new AegisClient({
  cluster: 'devnet',
  programId: '${process.env.NEXT_PUBLIC_PROGRAM_ID || 'ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ'}',
});

client.setWallet(agentKeypair);`}</code>
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-aegis-text-primary">3. Execute transactions</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-aegis-bg-primary border border-aegis-border overflow-x-auto">
                    <code className="text-xs font-mono text-aegis-text-primary whitespace-pre">{`// Execute a guarded transaction
const signature = await client.executeGuarded({
  vault: '${vaultAddress}',
  destination: 'recipient_address_here',
  amount: '100000000', // 0.1 SOL in lamports
  purpose: 'Payment for service',
});

console.log('Transaction:', signature);`}</code>
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-aegis-blue/10 border border-aegis-blue/30">
                <p className="text-xs text-aegis-text-secondary">
                  <strong className="text-aegis-blue">Important:</strong> Store your agent's secret key securely in environment variables.
                  Never commit it to version control or expose it in client-side code.
                </p>
              </div>
            </TabsContent>

            {/* OpenAI */}
            <TabsContent value="openai" className="space-y-3 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-aegis-text-primary">OpenAI Function Calling Integration</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-aegis-bg-primary border border-aegis-border overflow-x-auto">
                    <code className="text-xs font-mono text-aegis-text-primary whitespace-pre">{`import OpenAI from 'openai';
import { AegisClient } from '@aegis-vaults/sdk';
import { Keypair } from '@solana/web3.js';

const openai = new OpenAI();
const aegisClient = new AegisClient({ cluster: 'devnet' });
const agentKeypair = Keypair.fromSecretKey(/* ... */);
aegisClient.setWallet(agentKeypair);

// Define Aegis tools
const tools = [
  {
    type: 'function',
    function: {
      name: 'aegis_transfer',
      description: 'Transfer SOL via Aegis vault with guardrails',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'Recipient address' },
          amount: { type: 'string', description: 'Amount in lamports' },
        },
        required: ['destination', 'amount'],
      },
    },
  },
];

// Use in conversation
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a financial assistant.' },
    { role: 'user', content: 'Send 0.1 SOL to Alice' },
  ],
  tools,
});

// Execute tool calls
if (response.choices[0].message.tool_calls) {
  for (const call of response.choices[0].message.tool_calls) {
    if (call.function.name === 'aegis_transfer') {
      const args = JSON.parse(call.function.arguments);
      await aegisClient.executeGuarded({
        vault: '${vaultAddress}',
        destination: args.destination,
        amount: args.amount,
      });
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>

            {/* LangChain */}
            <TabsContent value="langchain" className="space-y-3 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-aegis-text-primary">LangChain Tool Integration</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-aegis-bg-primary border border-aegis-border overflow-x-auto">
                    <code className="text-xs font-mono text-aegis-text-primary whitespace-pre">{`import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AegisClient } from '@aegis-vaults/sdk';

const aegisClient = new AegisClient({ cluster: 'devnet' });
aegisClient.setWallet(agentKeypair);

// Create Aegis transfer tool
const aegisTransferTool = new DynamicStructuredTool({
  name: 'aegis_transfer',
  description: 'Transfer SOL via Aegis vault with policy enforcement',
  schema: z.object({
    destination: z.string().describe('Recipient Solana address'),
    amount: z.string().describe('Amount to send in lamports'),
    purpose: z.string().optional().describe('Purpose of transfer'),
  }),
  func: async ({ destination, amount, purpose }) => {
    try {
      const signature = await aegisClient.executeGuarded({
        vault: '${vaultAddress}',
        destination,
        amount,
        purpose,
      });
      return \`Transfer successful. Signature: \${signature}\`;
    } catch (error) {
      if (error.message.includes('Daily limit exceeded')) {
        return 'Transfer blocked: Daily limit exceeded. Awaiting approval.';
      }
      return \`Transfer failed: \${error.message}\`;
    }
  },
});

// Use with LangChain agent
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';

const tools = [aegisTransferTool];
const model = new ChatOpenAI({ modelName: 'gpt-4' });
const agent = createToolCallingAgent({ llm: model, tools });
const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({
  input: 'Send 0.1 SOL to 7x8...',
});`}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Documentation Link */}
        <div className="flex items-center justify-between pt-4 border-t border-aegis-border">
          <div className="flex items-center gap-2 text-xs text-aegis-text-tertiary">
            <Book className="w-3 h-3" />
            <span>Need more help?</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/aegis/aegis-sdk/tree/main/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              View Full Documentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
