'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Eye, EyeOff, Code2, Book, Sparkles, Wallet, AlertCircle } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/lib/solana/config';

interface VaultCredentialsProps {
  vaultAddress: string;
  agentSigner: string;
  vaultName?: string;
  vaultNonce?: string;
}

export function VaultCredentials({ vaultAddress, agentSigner, vaultName, vaultNonce = '0' }: VaultCredentialsProps) {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showFullAgent, setShowFullAgent] = useState(false);
  const [showFullDeposit, setShowFullDeposit] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');

  useEffect(() => {
    try {
      const vaultPubkey = new PublicKey(vaultAddress);
      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault_authority'), vaultPubkey.toBuffer()],
        PROGRAM_ID
      );
      setDepositAddress(vaultAuthority.toBase58());
    } catch (e) {
      console.error('Error calculating deposit address:', e);
    }
  }, [vaultAddress]);

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
  const displayDepositAddress = showFullDeposit ? depositAddress : formatAddress(depositAddress, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-caldera-orange" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-caldera-black">Vault Credentials & Integration</h3>
            <p className="text-sm text-caldera-text-muted">Use these credentials to integrate your AI agent with this vault</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* DEPOSIT ADDRESS - Most Important */}
        {depositAddress && (
          <div className="p-4 rounded-xl bg-caldera-success/5 border border-caldera-success/20 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-caldera-success" />
              <span className="text-sm font-bold text-caldera-success">Deposit Address</span>
              <Badge className="bg-caldera-success text-white text-xs rounded-full px-2">Send SOL Here</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-caldera-success/20">
              <code className="flex-1 text-sm font-mono text-caldera-success break-all">
                {displayDepositAddress}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDeposit(!showFullDeposit)}
                className="h-8 w-8 p-0 flex-shrink-0 rounded-lg"
              >
                {showFullDeposit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(depositAddress, 'Deposit Address')}
                className="h-8 w-8 p-0 flex-shrink-0 rounded-lg"
              >
                {copiedField === 'Deposit Address' ? (
                  <Check className="w-4 h-4 text-caldera-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-caldera-text-muted">
              <AlertCircle className="w-4 h-4 text-caldera-yellow flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-caldera-black">Important:</strong> Send SOL to this address to fund your vault. 
                Do NOT send to the Vault Address below—that&apos;s for configuration only.
              </span>
            </div>
          </div>
        )}

        {/* Vault Address (Config) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-caldera-text-secondary">Vault Config Address</span>
              <Badge variant="outline" className="text-xs rounded-full border-gray-200">For SDK</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAddress(!showFullAddress)}
              className="h-7 text-xs rounded-lg"
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <code className="flex-1 text-sm font-mono text-caldera-black break-all">
              {displayVaultAddress}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(vaultAddress, 'Vault Address')}
              className="h-8 w-8 p-0 flex-shrink-0 rounded-lg"
            >
              {copiedField === 'Vault Address' ? (
                <Check className="w-4 h-4 text-caldera-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-caldera-text-muted">
            Used by the SDK to reference your vault. Do not send funds here.
          </p>
        </div>

        {/* Agent Signer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-caldera-text-secondary">Agent Public Key</span>
              <Badge variant="outline" className="text-xs rounded-full border-gray-200">Required</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAgent(!showFullAgent)}
              className="h-7 text-xs rounded-lg"
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <code className="flex-1 text-sm font-mono text-caldera-orange break-all">
              {displayAgentSigner}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(agentSigner, 'Agent Public Key')}
              className="h-8 w-8 p-0 flex-shrink-0 rounded-lg"
            >
              {copiedField === 'Agent Public Key' ? (
                <Check className="w-4 h-4 text-caldera-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-caldera-text-muted">
            This is the public key of the AI agent authorized to propose transactions for this vault.
          </p>
        </div>

        {/* Integration Tabs */}
        <div className="pt-4 border-t border-gray-100">
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="quickstart" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="openai" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">OpenAI</TabsTrigger>
              <TabsTrigger value="langchain" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">LangChain</TabsTrigger>
            </TabsList>

            {/* Quick Start */}
            <TabsContent value="quickstart" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-caldera-black">1. Install the SDK</h4>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-caldera-black border border-gray-800 overflow-x-auto">
                    <code className="text-xs font-mono text-green-400">npm install @aegis-vaults/sdk @solana/web3.js @coral-xyz/anchor bn.js</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('npm install @aegis-vaults/sdk @solana/web3.js @coral-xyz/anchor bn.js', 'Command')}
                    className="absolute top-2 right-2 h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    {copiedField === 'Command' ? (
                      <Check className="w-3 h-3 text-caldera-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-caldera-black">2. Initialize the client</h4>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-caldera-black border border-gray-800 overflow-x-auto">
                    <code className="text-xs font-mono text-gray-300 whitespace-pre">{`import { AegisClient } from '@aegis-vaults/sdk';
import { Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

// Load your agent's keypair from environment
const agentKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.AGENT_SECRET_KEY!))
);

const client = new AegisClient({
  cluster: 'devnet',
  guardianApiUrl: 'https://aegis-guardian-production.up.railway.app',
});

// Wrap keypair in Wallet (required by SDK)
const wallet = new Wallet(agentKeypair);
client.setWallet(wallet);`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`import { AegisClient } from '@aegis-vaults/sdk';
import { Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

const agentKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.AGENT_SECRET_KEY!))
);

const client = new AegisClient({
  cluster: 'devnet',
  guardianApiUrl: 'https://aegis-guardian-production.up.railway.app',
});

const wallet = new Wallet(agentKeypair);
client.setWallet(wallet);`, 'Code')}
                    className="absolute top-2 right-2 h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    {copiedField === 'Code' ? (
                      <Check className="w-3 h-3 text-caldera-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="p-3 rounded-xl bg-caldera-info/5 border border-caldera-info/20">
                  <p className="text-xs text-caldera-text-secondary">
                    <strong className="text-caldera-info">Note:</strong> <code className="bg-white px-1 py-0.5 rounded">setWallet</code> expects a <code className="bg-white px-1 py-0.5 rounded">Wallet</code> from <code className="bg-white px-1 py-0.5 rounded">@coral-xyz/anchor</code>, not a <code className="bg-white px-1 py-0.5 rounded">Keypair</code>. Wrap your keypair using <code className="bg-white px-1 py-0.5 rounded">new Wallet(agentKeypair)</code>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-caldera-black">3. Execute agent transactions</h4>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-caldera-black border border-gray-800 overflow-x-auto">
                    <code className="text-xs font-mono text-gray-300 whitespace-pre">{`// Check vault balance first
const balance = await client.getVaultBalance('${vaultAddress}');
console.log('Balance:', balance / 1e9, 'SOL');

// Execute an agent transaction (destination must be whitelisted)
try {
  const signature = await client.executeAgent({
    vault: '${vaultAddress}',
    vaultNonce: ${vaultNonce},
    destination: 'RECIPIENT_ADDRESS', // Must be whitelisted!
    amount: 100000000, // 0.1 SOL in lamports
    purpose: 'Payment for service',
  });
  console.log('Success:', signature);
} catch (error) {
  if (error.overrideRequested) {
    console.log('Blocked. Blink URL:', error.blinkUrl);
  } else {
    console.error('Failed:', error.message);
  }
}`}</code>
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-caldera-success/5 border border-caldera-success/20">
                <p className="text-xs text-caldera-text-secondary">
                  <strong className="text-caldera-success">Deposit Address:</strong> Send SOL to <code className="bg-white px-1 py-0.5 rounded text-caldera-success">{depositAddress ? formatAddress(depositAddress, 8) : '...'}</code> to fund this vault.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-caldera-info/5 border border-caldera-info/20">
                <p className="text-xs text-caldera-text-secondary">
                  <strong className="text-caldera-info">Security:</strong> Store your agent&apos;s secret key in environment variables.
                  Never commit it to version control or expose it in client-side code.
                </p>
              </div>
            </TabsContent>

            {/* OpenAI */}
            <TabsContent value="openai" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-caldera-black">OpenAI Function Calling Integration</h4>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-caldera-black border border-gray-800 overflow-x-auto max-h-[400px]">
                    <code className="text-xs font-mono text-gray-300 whitespace-pre">{`import OpenAI from 'openai';
import { AegisClient } from '@aegis-vaults/sdk';
import { Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

const openai = new OpenAI();
const aegisClient = new AegisClient({ cluster: 'devnet' });
const agentKeypair = Keypair.fromSecretKey(/* ... */);
const wallet = new Wallet(agentKeypair);
aegisClient.setWallet(wallet);

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
      await aegisClient.executeAgent({
        vault: '${vaultAddress}',
        vaultNonce: ${vaultNonce},
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
            <TabsContent value="langchain" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-caldera-black">LangChain Tool Integration</h4>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-caldera-black border border-gray-800 overflow-x-auto max-h-[400px]">
                    <code className="text-xs font-mono text-gray-300 whitespace-pre">{`import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AegisClient } from '@aegis-vaults/sdk';
import { Wallet } from '@coral-xyz/anchor';

const aegisClient = new AegisClient({ cluster: 'devnet' });
const wallet = new Wallet(agentKeypair);
aegisClient.setWallet(wallet);

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
      const signature = await aegisClient.executeAgent({
        vault: '${vaultAddress}',
        vaultNonce: ${vaultNonce},
        destination,
        amount,
        purpose,
      });
      return \`Transfer successful. Signature: \${signature}\`;
    } catch (error) {
      if (error.overrideRequested) {
        return \`Transfer blocked. Awaiting approval. Blink: \${error.blinkUrl}\`;
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-caldera-text-muted">
            <Book className="w-3 h-3" />
            <span>Need more help?</span>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200" asChild>
            <a
              href="https://docs.aegis-vaults.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              View Full Documentation
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
