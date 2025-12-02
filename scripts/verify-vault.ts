/**
 * Vault Verification Script
 * 
 * This script helps verify if a vault was actually created on the blockchain
 * Usage: npx ts-node scripts/verify-vault.ts <vault_address> <transaction_signature>
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { promises as fs } from 'fs';
import path from 'path';

// Devnet RPC endpoint
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ');

async function verifyVault(vaultAddress: string, txSignature?: string) {
  console.log('🔍 Vault Verification Tool\n');
  console.log('Configuration:');
  console.log(`  RPC URL: ${RPC_URL}`);
  console.log(`  Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`  Vault Address: ${vaultAddress}\n`);

  const connection = new Connection(RPC_URL, 'confirmed');

  // 1. Check if transaction exists (if provided)
  if (txSignature) {
    console.log('📝 Checking transaction...');
    try {
      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (tx) {
        console.log('✅ Transaction found!');
        console.log(`   Slot: ${tx.slot}`);
        console.log(`   Block Time: ${tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : 'Unknown'}`);
        console.log(`   Success: ${tx.meta?.err ? '❌ FAILED' : '✅ SUCCESS'}`);
        
        if (tx.meta?.err) {
          console.log(`   Error: ${JSON.stringify(tx.meta.err)}`);
        }
        
        // Show logs
        if (tx.meta?.logMessages) {
          console.log('\n   Transaction Logs:');
          tx.meta.logMessages.forEach((log, i) => {
            console.log(`     ${i + 1}. ${log}`);
          });
        }
      } else {
        console.log('❌ Transaction NOT found on blockchain');
        console.log('   This means the transaction was never processed or has been pruned');
      }
    } catch (error: any) {
      console.log(`❌ Error fetching transaction: ${error.message}`);
    }
    console.log();
  }

  // 2. Check if vault account exists
  console.log('🏦 Checking vault account...');
  try {
    const vaultPubkey = new PublicKey(vaultAddress);
    const accountInfo = await connection.getAccountInfo(vaultPubkey);
    
    if (accountInfo) {
      console.log('✅ Vault account EXISTS!');
      console.log(`   Balance: ${accountInfo.lamports / 1e9} SOL`);
      console.log(`   Owner: ${accountInfo.owner.toBase58()}`);
      console.log(`   Data Length: ${accountInfo.data.length} bytes`);
      console.log(`   Executable: ${accountInfo.executable}`);
      
      // Try to decode vault data
      if (accountInfo.owner.equals(PROGRAM_ID)) {
        console.log('\n   ✅ Account is owned by Aegis program');
        
        try {
          // Load IDL
          const idlPath = path.join(process.cwd(), 'src', 'lib', 'solana', 'idl', 'aegis_core.json');
          const idlContent = await fs.readFile(idlPath, 'utf-8');
          const idl = JSON.parse(idlContent);
          
          // Decode account data
          console.log('\n   📊 Vault Data:');
          // Note: You'd need to properly decode this using the IDL
          console.log(`   Raw data (first 100 bytes): ${accountInfo.data.slice(0, 100).toString('hex')}`);
          
        } catch (decodeError: any) {
          console.log(`   ⚠️  Could not decode vault data: ${decodeError.message}`);
        }
      } else {
        console.log(`\n   ⚠️  WARNING: Account is NOT owned by Aegis program!`);
        console.log(`   Expected owner: ${PROGRAM_ID.toBase58()}`);
        console.log(`   Actual owner: ${accountInfo.owner.toBase58()}`);
      }
    } else {
      console.log('❌ Vault account does NOT exist on blockchain');
      console.log('   Possible reasons:');
      console.log('   1. Transaction was never sent');
      console.log('   2. Transaction failed during execution');
      console.log('   3. Wrong network (check if you\'re on correct cluster)');
      console.log('   4. Wrong vault address derivation');
    }
  } catch (error: any) {
    console.log(`❌ Error checking vault account: ${error.message}`);
  }
  console.log();

  // 3. Check recent transactions for the vault
  console.log('📜 Checking recent transactions for this address...');
  try {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(vaultAddress),
      { limit: 5 }
    );
    
    if (signatures.length > 0) {
      console.log(`✅ Found ${signatures.length} transaction(s):`);
      signatures.forEach((sig, i) => {
        console.log(`   ${i + 1}. ${sig.signature}`);
        console.log(`      Slot: ${sig.slot}`);
        console.log(`      Status: ${sig.err ? '❌ Failed' : '✅ Success'}`);
        console.log(`      Time: ${sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : 'Unknown'}`);
      });
    } else {
      console.log('❌ No transactions found for this address');
    }
  } catch (error: any) {
    console.log(`❌ Error fetching signatures: ${error.message}`);
  }
  console.log();

  // 4. Summary
  console.log('📋 Summary:');
  console.log(`   Solana Explorer: https://explorer.solana.com/address/${vaultAddress}?cluster=devnet`);
  if (txSignature) {
    console.log(`   Transaction: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx ts-node scripts/verify-vault.ts <vault_address> [transaction_signature]');
  console.error('\nExample:');
  console.error('  npx ts-node scripts/verify-vault.ts FPsn38AcsggkzYxrFj5WjH3VLjXKPkFte54XrVfN1qBd KV4i9V2xQtN3KWLimjm9o9fnbY73dARL6jkHsjPNGQnrP2kddDMN8CUhquD7zzrwTu4sp9skRKwtZWUGScK5rMw');
  process.exit(1);
}

const vaultAddress = args[0];
const txSignature = args[1];

verifyVault(vaultAddress, txSignature).catch(console.error);

