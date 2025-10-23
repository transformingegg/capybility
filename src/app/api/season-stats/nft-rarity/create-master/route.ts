import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { list, put } from '@vercel/blob';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const SHARD_PREFIX = 'user_rarity_counts/nft-shard-';
const MASTER_PREFIX = 'user_rarity_counts/master-';

async function incrementMasterVersion(): Promise<number> {
  const res = await pool.query('SELECT master_version FROM nft_rarity_shard_state ORDER BY id DESC LIMIT 1');
  let currentVersion = 0;
  if (res.rows.length > 0) {
    currentVersion = res.rows[0].master_version || 0;
  }
  
  const newVersion = currentVersion + 1;
  await pool.query(
    'UPDATE nft_rarity_shard_state SET master_version = $1, updated_at = NOW() WHERE id = (SELECT id FROM nft_rarity_shard_state ORDER BY id DESC LIMIT 1)',
    [newVersion]
  );
  
  return newVersion;
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // List NFT shards (raw NFT data)
    const blobs = await list({ prefix: 'user_rarity_counts/' });
    const shardFiles = blobs.blobs
      .filter(b => b.pathname.startsWith(SHARD_PREFIX) && b.pathname.endsWith('.json'))
      .map(b => ({ url: b.url, name: b.pathname }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (shardFiles.length === 0) {
      return NextResponse.json({ error: 'No NFT shards found' }, { status: 404 });
    }

    // Aggregate raw NFT data by wallet address
    const walletRarityMap = new Map<string, { 
      common: number; 
      uncommon: number; 
      rare: number; 
      epic: number; 
      legendary: number; 
      total: number; 
    }>();

    let totalNFTsProcessed = 0;

    for (const shard of shardFiles) {
      try {
        const res = await fetch(shard.url);
        if (!res.ok) {
          console.warn(`Failed to fetch shard: ${shard.name}`);
          continue;
        }
        
        const nftRecords = await res.json();
        
        for (const nft of nftRecords) {
          const wallet = nft.owner.toLowerCase();
          const rarity = nft.rarity;
          
          if (!walletRarityMap.has(wallet)) {
            walletRarityMap.set(wallet, { 
              common: 0, 
              uncommon: 0, 
              rare: 0, 
              epic: 0, 
              legendary: 0, 
              total: 0 
            });
          }
          
          const walletStats = walletRarityMap.get(wallet)!;
          walletStats.total++;
          totalNFTsProcessed++;
          
          // Increment the specific rarity count
          switch (rarity) {
            case 'Common':
              walletStats.common++;
              break;
            case 'Uncommon':
              walletStats.uncommon++;
              break;
            case 'Rare':
              walletStats.rare++;
              break;
            case 'Epic':
              walletStats.epic++;
              break;
            case 'Legendary':
              walletStats.legendary++;
              break;
            default:
              console.warn(`Unknown rarity: ${rarity} for NFT ${nft.tokenId}`);
          }
        }
      } catch (e) {
        console.warn('Skipping shard due to processing error', shard.name, e);
      }
    }

    if (walletRarityMap.size === 0) {
      return NextResponse.json({ error: 'No wallet data aggregated from shards' }, { status: 500 });
    }

    // Convert to array format for frontend consumption (counts only)
    const masterArray = Array.from(walletRarityMap.entries())
      .map(([wallet_address, stats]) => ({
        wallet_address,
        common_count: stats.common,
        uncommon_count: stats.uncommon,
        rare_count: stats.rare,
        epic_count: stats.epic,
        legendary_count: stats.legendary,
        total_nfts: stats.total
      }))
      .sort((a, b) => b.total_nfts - a.total_nfts); // Sort by total NFTs descending

    // Increment master version and create master file
    const version = await incrementMasterVersion();
    const masterFile = `${MASTER_PREFIX}${version}.json`;
    
    await put(masterFile, JSON.stringify(masterArray, null, 2), { 
      contentType: 'application/json', 
      access: 'public', 
      allowOverwrite: true 
    });

    return NextResponse.json({ 
      masterFile, 
      version,
      totalHolders: masterArray.length,
      totalNFTs: totalNFTsProcessed,
      shardsProcessed: shardFiles.length,
      shards: shardFiles.map(s => s.name) 
    });
    
  } catch (e) {
    console.error('create-master error', e);
    return NextResponse.json({ error: 'create-master failed', details: (e as Error).message }, { status: 500 });
  }
}
