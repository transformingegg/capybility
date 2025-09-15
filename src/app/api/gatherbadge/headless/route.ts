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
const DATA_BLOB_KEY = 'badgeGather/badge-gather.json';
const STATE_BLOB_KEY = 'badgeGather/badge-gather-state.json';
const BATCH_SIZE = 40;
const BLOCK_STEP = 100000;
const BLOB_BASE_URL = process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL;

async function getState() {
  try {
    const url = `${BLOB_BASE_URL}/${STATE_BLOB_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[BadgeGatherer] Failed to fetch state blob:', res.status, res.statusText);
      return { lastBlock: 0, lastLogIndex: 0 };
    }
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error('[BadgeGatherer] Error reading state blob:', e);
    return { lastBlock: 0, lastLogIndex: 0 };
  }
}

async function setState(state: GathererState) {
  try {
    await put(STATE_BLOB_KEY, JSON.stringify(state, null, 2), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
  } catch (e) {
    console.error('[BadgeGatherer] Error writing state blob:', e);
    throw e;
  }
}

async function getData() {
  try {
    const url = `${BLOB_BASE_URL}/${DATA_BLOB_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[BadgeGatherer] Failed to fetch data blob:', res.status, res.statusText);
      return [];
    }
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error('[BadgeGatherer] Error reading data blob:', e);
    return [];
  }
}

async function setData(data: unknown[]) {
  try {
    await put(DATA_BLOB_KEY, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
  } catch (e) {
    console.error('[BadgeGatherer] Error writing data blob:', e);
    throw e;
  }
}

type GathererState = { lastBlock: number; lastLogIndex: number };

export async function GET() {
  let added = 0;
  let total = 0;
  let done = false;
  let state: GathererState = { lastBlock: 0, lastLogIndex: 0 };
  try {
    state = await getState();
    console.log(`[BadgeGatherer] Starting gather: lastBlock=${state.lastBlock}, lastLogIndex=${state.lastLogIndex}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = state.lastBlock || 0;
    const toBlock = Math.min(fromBlock + BLOCK_STEP, latestBlock);
    console.log(`[BadgeGatherer] Block range: fromBlock=${fromBlock}, toBlock=${toBlock}, latestBlock=${latestBlock}`);
    let logs: ethers.EventLog[] = [];
    if (fromBlock >= latestBlock) {
      done = true;
      console.log('[BadgeGatherer] Already at latest block, nothing to do.');
    } else {
      logs = await contract.queryFilter('Transfer', fromBlock, toBlock) as ethers.EventLog[];
      console.log(`[BadgeGatherer] Found ${logs.length} logs in range.`);
    }
    const data = await getData();
    let lastLogIndex = state.lastLogIndex || 0;
    for (let i = 0; i < logs.length; i++) {
      if (fromBlock === state.lastBlock && i < lastLogIndex) continue;
      const log = logs[i];
      const tokenId = log.args?.tokenId?.toString();
      if (tokenId && !data.find((d: { tokenId: string }) => d.tokenId === tokenId)) {
        // Fetch metadata for this tokenId
  let metadata: Record<string, unknown> = {};
        try {
          const metaRes = await fetch(`https://metadata.vc.opencampus.xyz/metadata/ocbadge/${tokenId}`);
          if (metaRes.ok) {
            metadata = await metaRes.json();
          } else {
            console.warn(`[BadgeGatherer] Metadata fetch failed for tokenId=${tokenId}: ${metaRes.status}`);
          }
        } catch (err) {
          console.warn(`[BadgeGatherer] Metadata fetch error for tokenId=${tokenId}:`, err);
        }
        // Extract only required fields from metadata
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
        data.push({
          tokenId,
          to: log.args?.to,
          description,
          awardedDate,
          credentialSubjectId,
          credentialSubjectImage,
          credentialSubjectName
        });
        added++;
      }
      lastLogIndex = i + 1;
      if (added >= BATCH_SIZE) break;
    }
    try {
      await setData(data);
      console.log(`[BadgeGatherer] Successfully wrote data blob. Total records: ${data.length}`);
    } catch (e) {
      console.error('[BadgeGatherer] Error writing data blob:', e);
      return NextResponse.json({ error: 'Error writing data blob', details: (e as Error).message }, { status: 500 });
    }
    try {
      const intendedState = { lastBlock: toBlock, lastLogIndex: lastLogIndex };
      await setState(intendedState);
      console.log(`[BadgeGatherer] Successfully wrote state blob: lastBlock=${toBlock}, lastLogIndex=${lastLogIndex}`);
      // Verification step: fetch state again and compare
      let verifiedState = null;
      try {
        verifiedState = await getState();
        if (
          verifiedState.lastBlock !== intendedState.lastBlock ||
          verifiedState.lastLogIndex !== intendedState.lastLogIndex
        ) {
          console.warn('[BadgeGatherer] State verification failed! Intended:', intendedState, 'Fetched:', verifiedState);
        } else {
          console.log('[BadgeGatherer] State verification succeeded.');
        }
      } catch (verr) {
        console.warn('[BadgeGatherer] State verification error:', verr);
      }
    } catch (e) {
      console.error('[BadgeGatherer] Error writing state blob:', e);
      return NextResponse.json({ error: 'Error writing state blob', details: (e as Error).message }, { status: 500 });
    }
    total = data.length;
    if (toBlock >= latestBlock) done = true;
    console.log(`[BadgeGatherer] Batch complete. Added=${added}, Total=${total}, Done=${done}`);
    return NextResponse.json({ added, total, done });
  } catch (e) {
    console.error('[BadgeGatherer] Error in gatherer GET:', e);
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
