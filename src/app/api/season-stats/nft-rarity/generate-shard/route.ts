import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ethers } from 'ethers';
import { put } from '@vercel/blob';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const QUIZ_NFT_ADDRESS = process.env.NEXT_PUBLIC_QUIZ_COMPLETION_NFT_ADDRESS as `0x${string}`;

// Hardcoded for testing with live metadata
// const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SHARD_PREFIX = 'user_rarity_counts/nft-shard-';

if (!QUIZ_NFT_ADDRESS?.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error('Invalid QUIZ_NFT_ADDRESS');
}

const QUIZ_NFT_ABI = [
  { inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'ownerOf', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

async function getShardState() {
  const res = await pool.query('SELECT * FROM nft_rarity_shard_state ORDER BY id DESC LIMIT 1');
  if (res.rows.length === 0) {
    // Initialize if no state exists
    await pool.query('INSERT INTO nft_rarity_shard_state (last_token_processed, total_supply, master_version) VALUES (0, 0, 0)');
    return { last_token_processed: 0, total_supply: 0, master_version: 0 };
  }
  return res.rows[0];
}

async function updateShardState(lastTokenProcessed: number, totalSupply: number) {
  await pool.query(
    'UPDATE nft_rarity_shard_state SET last_token_processed = $1, total_supply = $2, updated_at = NOW() WHERE id = (SELECT id FROM nft_rarity_shard_state ORDER BY id DESC LIMIT 1)',
    [lastTokenProcessed, totalSupply]
  );
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const MAX_NFTS_PER_SHARD = 500; // Target shard size
    const MAX_CONSECUTIVE_FAILURES = 10; // Stop after this many consecutive failed tokens

    const provider = new ethers.JsonRpcProvider('https://rpc.edu-chain.raas.gelato.cloud/');
    const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);
    
    // Get current state - we'll discover totalSupply as we go
    const state = await getShardState();
    const startToken = state.last_token_processed + 1;

    console.log(`[NFT Shard] Starting from token ${startToken}`);

    const nftRecords: Array<{
      tokenId: number;
      owner: string;
      rarity: string;
      processedAt: string;
    }> = [];

    let processedCount = 0;
    let lastTokenProcessed = state.last_token_processed;
    let consecutiveFailures = 0;
    let currentTokenId = startToken;
    let discoveredTotalSupply = state.total_supply || 0;

    while (processedCount < MAX_NFTS_PER_SHARD && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
      try {
        // Try to get owner - this will fail if token doesn't exist
        const owner = (await contract.ownerOf(currentTokenId)).toLowerCase();
        
        // Reset consecutive failures since we found a valid token
        consecutiveFailures = 0;
        
        // Update our discovered total supply
        if (currentTokenId > discoveredTotalSupply) {
          discoveredTotalSupply = currentTokenId;
        }
        
        // Fetch metadata
        const metadataUrl = `https://capybility.xyz/metadata/${currentTokenId}`;
        const metadataResponse = await fetch(metadataUrl);
        
        if (!metadataResponse.ok) {
          console.warn(`Failed to fetch metadata for token ${currentTokenId}`);
          lastTokenProcessed = currentTokenId;
          currentTokenId++;
          continue;
        }

        const metadata: NFTMetadata = await metadataResponse.json();
        
        // Extract rarity directly from metadata
        const rarityAttribute = metadata.attributes.find(attr => attr.trait_type === "Rarity");
        if (!rarityAttribute) {
          console.warn(`No rarity attribute found for token ${currentTokenId}`);
          lastTokenProcessed = currentTokenId;
          currentTokenId++;
          continue;
        }

        const rarity = rarityAttribute.value;

        nftRecords.push({
          tokenId: currentTokenId,
          owner,
          rarity,
          processedAt: new Date().toISOString()
        });

        processedCount++;
        lastTokenProcessed = currentTokenId;
        console.log(`[NFT Shard] Processed token ${currentTokenId}: ${rarity}`);

      } catch (error: unknown) {
        // Token doesn't exist or other error
        const err = error as { code?: string; message?: string };
        if (err.code === 'CALL_EXCEPTION') {
          consecutiveFailures++;
          console.log(`[NFT Shard] Token ${currentTokenId} doesn't exist (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} consecutive failures)`);
        } else {
          console.warn(`[NFT Shard] Error processing token ${currentTokenId}:`, error);
          consecutiveFailures++;
        }
        
        // Still mark as processed to advance
        lastTokenProcessed = currentTokenId;
      }
      
      currentTokenId++;
    }

    // Update state with our progress and discovered total supply
    await updateShardState(lastTokenProcessed, discoveredTotalSupply);

    if (nftRecords.length === 0) {
      const isComplete = consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;
      return NextResponse.json({ 
        error: 'No valid NFT data found in this range', 
        startToken, 
        lastTokenProcessed,
        consecutiveFailures,
        isComplete,
        message: isComplete ? 'Reached end of token range - all tokens processed' : 'No valid tokens in this batch'
      }, { status: isComplete ? 200 : 500 });
    }

    // Save shard to blob storage
    const shardFileName = `${SHARD_PREFIX}${startToken}-to-${lastTokenProcessed}.json`;
    await put(shardFileName, JSON.stringify(nftRecords, null, 2), { 
      contentType: 'application/json', 
      access: 'public', 
      allowOverwrite: true 
    });

    const isComplete = consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;

    console.log(`[NFT Shard] Created shard: ${shardFileName} with ${nftRecords.length} NFTs`);

    return NextResponse.json({ 
      shardFile: shardFileName, 
      nftCount: nftRecords.length,
      startToken,
      lastTokenProcessed, 
      discoveredTotalSupply,
      consecutiveFailures,
      isComplete,
      nextStartToken: isComplete ? null : lastTokenProcessed + 1
    });

  } catch (e) {
    console.error('generate-shard error', e);
    return NextResponse.json({ error: 'generate-shard failed', details: (e as Error).message }, { status: 500 });
  }
}
