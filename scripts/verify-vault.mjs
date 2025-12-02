/**
 * Vault Verification Script
 * 
 * This script helps verify if a vault was actually created on the blockchain
 * Usage: node scripts/verify-vault.mjs <vault_address> <transaction_signature>
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Configuration
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID || 'ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ';

async function verifyVault(vaultAddress, txSignature) {
  console.log('🔍 Vault Verification Tool\n');
  console.log('Configuration:');
  console.log(`  RPC URL: ${RPC_URL}`);
  console.log(`  Program ID: ${PROGRAM_ID_STR}`);
  console.log(`  Vault Address: ${vaultAddress}\n`);

  const connection = new Connection(RPC_URL, 'confirmed');
  const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

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
    } catch (error) {
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
        console.log(`   Raw data (first 100 bytes): ${accountInfo.data.slice(0, 100).toString('hex')}`);
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
      console.log('   5. Program is not deployed on this network');
    }
  } catch (error) {
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
  } catch (error) {
    console.log(`❌ Error fetching signatures: ${error.message}`);
  }
  console.log();

  // 4. Check if program exists
  console.log('🔧 Checking program account...');
  try {
    const programInfo = await connection.getAccountInfo(PROGRAM_ID);
    if (programInfo) {
      console.log('✅ Program account EXISTS on this network');
      console.log(`   Executable: ${programInfo.executable}`);
      console.log(`   Data Length: ${programInfo.data.length} bytes`);
    } else {
      console.log('❌ Program account does NOT exist on this network!');
      console.log('   🚨 THIS IS LIKELY YOUR PROBLEM!');
      console.log('   The program needs to be deployed to devnet before you can create vaults.');
    }
  } catch (error) {
    console.log(`❌ Error checking program: ${error.message}`);
  }
  console.log();

  // 5. Summary
  console.log('📋 Summary:');
  console.log(`   Vault Explorer: https://explorer.solana.com/address/${vaultAddress}?cluster=devnet`);
  console.log(`   Program Explorer: https://explorer.solana.com/address/${PROGRAM_ID_STR}?cluster=devnet`);
  if (txSignature) {
    console.log(`   Transaction: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/verify-vault.mjs <vault_address> [transaction_signature]');
  console.error('\nExample:');
  console.error('  node scripts/verify-vault.mjs FPsn38AcsggkzYxrFj5WjH3VLjXKPkFte54XrVfN1qBd KV4i9V2xQtN3KWLimjm9o9fnbY73dARL6jkHsjPNGQnrP2kddDMN8CUhquD7zzrwTu4sp9skRKwtZWUGScK5rMw');
  process.exit(1);
}

const vaultAddress = args[0];
const txSignature = args[1];

verifyVault(vaultAddress, txSignature).catch(console.error);

