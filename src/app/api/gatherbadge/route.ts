import { Pool } from 'pg';
// Local Postgres pool for DB state
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// DB helpers for badge_gather_state
async function getDbState() {
  const res = await pool.query('SELECT * FROM badge_gather_state ORDER BY id DESC LIMIT 1');
  if (res.rows.length === 0) {
    // Initialize if not present
    await pool.query('INSERT INTO badge_gather_state (last_block, last_log_index, master_version) VALUES ($1, $2, $3)', [0, 0, 1]);
    return { last_block: 0, last_log_index: 0, master_version: 1 };
  }
  return res.rows[0];
}

async function setDbState(last_block: number, last_log_index: number) {
  await pool.query('UPDATE badge_gather_state SET last_block = $1, last_log_index = $2, updated_at = NOW() WHERE id = (SELECT id FROM badge_gather_state ORDER BY id DESC LIMIT 1)', [last_block, last_log_index]);
}

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { put } from '@vercel/blob';

const CONTRACT_ADDRESS = '0x81aC4267630ED2FD48542A2fAD8D9f5A02BdA5D8';
const RPC_URL = 'https://rpc.edu-chain.raas.gelato.cloud/';
const ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
];
//const STATE_BLOB_KEY = 'badgeGather/badge-gather-state.json';
const BATCH_SIZE = 50;
const BLOCK_STEP = 100000;
//const BLOB_BASE_URL = process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL;


type GathererState = { lastBlock: number; lastLogIndex: number };

export async function GET() {
  // This endpoint no longer serves a master file. Use the master join endpoint instead.
  return NextResponse.json({ error: 'Not found. Use the master join endpoint.' }, { status: 404 });
}

export async function POST() {
  let added = 0;
  let total = 0;
  let done = false;
  const dbState = await getDbState();
  const state: GathererState = { lastBlock: dbState.last_block, lastLogIndex: dbState.last_log_index };
  try {
    console.log(`[BadgeGatherer] Starting gather: lastBlock=${state.lastBlock}, lastLogIndex=${state.lastLogIndex}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const latestBlock = await provider.getBlockNumber();
  let fromBlock = Number(state.lastBlock) || 0;
  const fromLogIndex = Number(state.lastLogIndex) || 0;
  const toBlock = Math.min(Number(fromBlock) + BLOCK_STEP, Number(latestBlock));
    let logs: ethers.EventLog[] = [];
    // ethers.js does not accept 0 as a valid blockTag, use 'earliest' if fromBlock is 0
  const fromBlockTag = fromBlock === 0 ? 'earliest' : Number(fromBlock);
    console.log(`[BadgeGatherer] Debug: fromBlock=${fromBlock}, toBlock=${toBlock}, latestBlock=${latestBlock}`);
    if (fromBlock > latestBlock) {
      done = true;
      console.log('[BadgeGatherer] fromBlock is greater than latest block, nothing to do.');
      return NextResponse.json({ added, total, done });
    }
    if (fromBlock === latestBlock) {
      done = true;
      console.log('[BadgeGatherer] Already at latest block, nothing to do.');
      // To avoid getting stuck at 0, increment lastBlock if still 0
      if (fromBlock === 0) {
        fromBlock = 1;
        await setDbState(fromBlock, 0);
      }
      return NextResponse.json({ added, total, done });
    }
    logs = await contract.queryFilter('Transfer', fromBlockTag, toBlock) as ethers.EventLog[];
    console.log(`[BadgeGatherer] Found ${logs.length} logs in range.`);
    // Shard logic: collect up to BATCH_SIZE new records, track actual end block/log
    const shardRecords = [];
    let addedInShard = 0;
    let lastProcessedBlock = fromBlock;
    let lastProcessedLog = fromLogIndex;
    for (let i = 0; i < logs.length; i++) {
      if (fromBlock === state.lastBlock && i < fromLogIndex) continue;
      const log = logs[i];
      const tokenId = log.args?.tokenId?.toString();
      if (tokenId) {
        let metadata: Record<string, unknown> = {};
        const metaUrl = `https://metadata.vc.opencampus.xyz/metadata/ocbadge/${tokenId}`;
        console.log(`[BadgeGatherer] Fetching metadata for tokenId=${tokenId} at ${metaUrl}`);
        try {
          const metaRes = await fetch(metaUrl);
          if (metaRes.ok) {
            metadata = await metaRes.json();
            if (!metadata || Object.keys(metadata).length === 0) {
              console.log(`[BadgeGatherer] Metadata empty for tokenId=${tokenId} at ${metaUrl}`);
            } else {
              console.log(`[BadgeGatherer] Metadata received for tokenId=${tokenId}:`, metadata);
            }
          } else {
            console.log(`[BadgeGatherer] Metadata fetch failed for tokenId=${tokenId} at ${metaUrl}: ${metaRes.status} ${metaRes.statusText}`);
          }
        } catch (err) {
          console.log(`[BadgeGatherer] Metadata fetch error for tokenId=${tokenId} at ${metaUrl}:`, err);
        }
        const meta = (metadata && typeof metadata === 'object' && 'metadata' in metadata)
          ? (metadata as Record<string, unknown>).metadata as Record<string, unknown>
          : {};
        const description = typeof meta?.description === 'string' ? meta.description : '';
        const awardedDate = typeof meta?.awardedDate === 'string' ? meta.awardedDate : '';
        let credentialSubjectId = '';
        let credentialSubjectImage = '';
        let credentialSubjectName = '';
        if (meta && typeof meta.credentialSubject === 'object' && meta.credentialSubject !== null) {
          const cs = meta.credentialSubject as Record<string, unknown>;
          if (cs.achievement && typeof cs.achievement === 'object' && cs.achievement !== null) {
            const ach = cs.achievement as Record<string, unknown>;
            if (typeof ach.identifier === 'string') credentialSubjectId = ach.identifier;
            if (typeof ach.name === 'string') credentialSubjectName = ach.name;
          }
          if (typeof cs.image === 'string') credentialSubjectImage = cs.image;
        }
        shardRecords.push({
          tokenId,
          to: log.args?.to,
          description,
          awardedDate,
          credentialSubjectId,
          credentialSubjectImage,
          credentialSubjectName
        });
        addedInShard++;
        lastProcessedBlock = log.blockNumber;
        lastProcessedLog = i;
        if (addedInShard >= BATCH_SIZE) break;
      }
    }
    // Write shard file if any records
    if (shardRecords.length > 0) {
      const shardFileName = `badgeGather/shard-${fromBlock}-${fromLogIndex}-to-${lastProcessedBlock}-${lastProcessedLog}.json`;
      await put(shardFileName, JSON.stringify(shardRecords, null, 2), {
        contentType: 'application/json',
        access: 'public',
        allowOverwrite: true
      });
      console.log(`[BadgeGatherer] Wrote shard file: ${shardFileName} with ${shardRecords.length} records.`);
      // If we hit the batch size, advance to the last processed log (next scan starts after this event)
      if (addedInShard >= BATCH_SIZE) {
        await setDbState(lastProcessedBlock, lastProcessedLog);
      } else {
        // If we scanned the full range, advance to the end of the range (avoid rescans)
        await setDbState(toBlock, 0);
      }
      total = shardRecords.length;
      added = addedInShard;
    } else {
      // No records found, advance to end of range to avoid rescans
      await setDbState(toBlock, 0);
      console.log('[BadgeGatherer] No new records to write in this batch.');
    }
    if (toBlock >= latestBlock) done = true;
    console.log(`[BadgeGatherer] Batch complete. Added=${added}, Total=${total}, Done=${done}`);
    return NextResponse.json({ added, total, done });
  } catch (e) {
    console.error('[BadgeGatherer] Error in gatherer POST:', e);
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
