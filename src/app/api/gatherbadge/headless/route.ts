type BadgeRecord = {
  tokenId: string;
  to: unknown;
  description: string;
  awardedDate: string;
  credentialSubjectId: string;
  credentialSubjectImage: string;
  credentialSubjectName: string;
  blockNumber: number;
  logIndex: number;
};
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { put } from '@vercel/blob';
import { Pool } from 'pg';

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
// Remove old monolithic blob keys
const BATCH_SIZE = 40;
const BLOCK_STEP = 100000;
// const BLOB_BASE_URL = process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL;

// Provider/contract reuse for warm serverless
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);


// Postgres pool and helpers (copied from main route)
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
async function getDbState() {
  const res = await pool.query('SELECT * FROM badge_gather_state ORDER BY id DESC LIMIT 1');
  if (res.rows.length === 0) {
    await pool.query('INSERT INTO badge_gather_state (last_block, last_log_index, master_version) VALUES ($1, $2, $3)', [0, 0, 1]);
    return { last_block: 0, last_log_index: 0, master_version: 1 };
  }
  return res.rows[0];
}
async function setDbState(last_block: number, last_log_index: number) {
  await pool.query('UPDATE badge_gather_state SET last_block = $1, last_log_index = $2, updated_at = NOW() WHERE id = (SELECT id FROM badge_gather_state ORDER BY id DESC LIMIT 1)', [last_block, last_log_index]);
}

type GathererState = { lastBlock: number; lastLogIndex: number };


export async function GET() {
  let added = 0;
  let total = 0;
  let done = false;
  const dbState = await getDbState();
  const state: GathererState = { lastBlock: dbState.last_block, lastLogIndex: dbState.last_log_index };
  try {
    const latestBlock = await provider.getBlockNumber();
    let fromBlock = Number(state.lastBlock) || 0;
    const fromLogIndex = Number(state.lastLogIndex) || 0;
    const toBlock = Math.min(Number(fromBlock) + BLOCK_STEP, Number(latestBlock));
    // ethers.js does not accept 0 as a valid blockTag, use 'earliest' if fromBlock is 0
    const fromBlockTag = fromBlock === 0 ? 'earliest' : Number(fromBlock);
    if (fromBlock > latestBlock) {
      done = true;
      return NextResponse.json({ added, total, done });
    }
    if (fromBlock === latestBlock) {
      done = true;
      // To avoid getting stuck at 0, increment lastBlock if still 0
      if (fromBlock === 0) {
        fromBlock = 1;
        await setDbState(fromBlock, 0);
      }
      return NextResponse.json({ added, total, done });
    }
    const logs: ethers.EventLog[] = await contract.queryFilter('Transfer', fromBlockTag, toBlock) as ethers.EventLog[];
    // Only process up to BATCH_SIZE logs after fromLogIndex, but we need to process more logs
    // to account for excluded "Tier I - Capy Splash" badges
    const logsToProcess: ethers.EventLog[] = [];
    
    for (let i = 0; i < logs.length; i++) {
      if (fromBlock === state.lastBlock && i < fromLogIndex) continue;
      logsToProcess.push(logs[i]);
      
      // We'll check for excluded badges after metadata fetch, so for now just process more logs
      // to ensure we get enough valid badges. We'll process up to 3x BATCH_SIZE to be safe.
      if (logsToProcess.length >= BATCH_SIZE * 3) break;
    }
    // Parallel metadata fetch
    const fetchMetaForLog = async (log: ethers.EventLog) => {
      const tokenId = log.args?.tokenId?.toString();
      if (!tokenId) return null;
      let metadata: Record<string, unknown> = {};
      const metaUrl = `https://metadata.vc.opencampus.xyz/metadata/ocbadge/${tokenId}`;
      try {
        const metaRes = await fetch(metaUrl);
        if (metaRes.ok) {
          metadata = await metaRes.json();
        }
      } catch {}
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
      return {
        tokenId,
        to: log.args?.to,
        description,
        awardedDate,
        credentialSubjectId,
        credentialSubjectImage,
        credentialSubjectName,
        blockNumber: log.blockNumber,
        logIndex: log.index
      };
    };
    const metaResults = await Promise.all(logsToProcess.map(fetchMetaForLog));
    
    // Filter out null results and exclude "Tier I - Capy Splash" badges
    const allValidRecords = metaResults.filter((r): r is BadgeRecord => 
      !!r && 
      typeof r === 'object' && 
      typeof (r as BadgeRecord).tokenId === 'string' && 
      typeof (r as BadgeRecord).blockNumber === 'number' && 
      typeof (r as BadgeRecord).logIndex === 'number' &&
      // Exclude "Tier I - Capy Splash" badges
      (r as BadgeRecord).credentialSubjectName !== "Tier I – Capy Splash"
    );
    
    // Limit to BATCH_SIZE valid badges to keep shard size manageable
    const shardRecords = allValidRecords.slice(0, BATCH_SIZE);
    const addedInShard = shardRecords.length;
    let lastProcessedBlock = fromBlock;
    let lastProcessedLog = fromLogIndex;
    if (addedInShard > 0) {
      // Find last processed block/log from the last record
      const last = shardRecords[shardRecords.length - 1];
      lastProcessedBlock = last.blockNumber;
      lastProcessedLog = last.logIndex;
      const shardFileName = `badgeGather/shard-${fromBlock}-${fromLogIndex}-to-${lastProcessedBlock}-${lastProcessedLog}.json`;
      await put(shardFileName, JSON.stringify(shardRecords.map(record => {
        const rest: Record<string, unknown> = { ...record };
        delete rest.blockNumber;
        delete rest.logIndex;
        return rest;
      }), null, 2), {
        contentType: 'application/json',
        access: 'public',
        allowOverwrite: true
      });
      // Only update DB if records were added
      if (addedInShard >= BATCH_SIZE) {
        await setDbState(lastProcessedBlock, lastProcessedLog);
      } else {
        await setDbState(toBlock, 0);
      }
      total = shardRecords.length;
      added = addedInShard;
    } else {
      await setDbState(toBlock, 0);
    }
    if (toBlock >= latestBlock) done = true;
    return NextResponse.json({ added, total, done });
  } catch (e) {
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
