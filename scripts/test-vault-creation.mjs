/**
 * Test Vault Creation
 * 
 * Quick test to verify vault creation will work with correct program ID
 */

import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';
const CORRECT_PROGRAM_ID = 'ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ';

async function testVaultCreation() {
  console.log('🧪 Testing Vault Creation Setup\n');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  const programId = new PublicKey(CORRECT_PROGRAM_ID);
  
  // 1. Check program exists
  console.log('1️⃣ Checking program exists on devnet...');
  const programInfo = await connection.getAccountInfo(programId);
  
  if (!programInfo) {
    console.log('❌ FAILED: Program does not exist on devnet');
    console.log(`   Program ID: ${CORRECT_PROGRAM_ID}`);
    process.exit(1);
  }
  
  if (!programInfo.executable) {
    console.log('❌ FAILED: Program account exists but is not executable');
    process.exit(1);
  }
  
  console.log('✅ SUCCESS: Program exists and is executable');
  console.log(`   Data Length: ${programInfo.data.length} bytes`);
  console.log(`   Owner: ${programInfo.owner.toBase58()}\n`);
  
  // 2. Simulate vault PDA derivation
  console.log('2️⃣ Testing PDA derivation...');
  const testAuthority = new PublicKey('11111111111111111111111111111111'); // System program as test
  
  try {
    const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), testAuthority.toBuffer()],
      programId
    );
    
    console.log('✅ SUCCESS: PDA derivation works');
    console.log(`   Test Vault PDA: ${vaultPDA.toBase58()}`);
    console.log(`   Bump: ${vaultBump}\n`);
  } catch (error) {
    console.log('❌ FAILED: PDA derivation failed');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // 3. Check RPC endpoint
  console.log('3️⃣ Checking RPC endpoint...');
  try {
    const slot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(slot);
    
    console.log('✅ SUCCESS: RPC endpoint is healthy');
    console.log(`   Current Slot: ${slot}`);
    console.log(`   Block Time: ${blockTime ? new Date(blockTime * 1000).toISOString() : 'Unknown'}\n`);
  } catch (error) {
    console.log('❌ FAILED: RPC endpoint error');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // Summary
  console.log('📋 Summary:');
  console.log('✅ All checks passed! Vault creation should work.');
  console.log('\n🎯 Next Steps:');
  console.log('1. Restart your Next.js dev server (it will pick up the correct program ID)');
  console.log('2. Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+F5)');
  console.log('3. Try creating a vault again');
  console.log('\n🔗 Explorer Links:');
  console.log(`   Program: https://explorer.solana.com/address/${CORRECT_PROGRAM_ID}?cluster=devnet`);
}

testVaultCreation().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

