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

// Provider/contract reuse for warm serverless
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

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
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = state.lastBlock || 0;
    const toBlock = Math.min(fromBlock + BLOCK_STEP, latestBlock);
    if (fromBlock >= latestBlock) {
      done = true;
      return NextResponse.json({ added, total, done });
    }
    const logs: ethers.EventLog[] = await contract.queryFilter('Transfer', fromBlock, toBlock) as ethers.EventLog[];
    // Only process up to BATCH_SIZE logs after lastLogIndex
    const logsToProcess: ethers.EventLog[] = [];
    for (let i = 0; i < logs.length; i++) {
      if (fromBlock === state.lastBlock && i < (state.lastLogIndex || 0)) continue;
      logsToProcess.push(logs[i]);
      if (logsToProcess.length >= BATCH_SIZE) break;
    }
    const data = await getData();
  const tokenIdSet = new Set((data as BadgeRecord[]).map(d => d.tokenId));
    // Parallel metadata fetch
    const fetchMetaForLog = async (log: ethers.EventLog): Promise<BadgeRecord | null> => {
      const tokenId = log.args?.tokenId?.toString();
      if (!tokenId || tokenIdSet.has(tokenId)) return null;
      let metadata: Record<string, unknown> = {};
      let description = '';
      let awardedDate = '';
      let credentialSubjectId = '';
      let credentialSubjectImage = '';
      let credentialSubjectName = '';
      try {
        const metaRes = await fetch(`https://metadata.vc.opencampus.xyz/metadata/ocbadge/${tokenId}`);
        if (metaRes.ok) {
          metadata = await metaRes.json();
        }
      } catch {}
      const meta = (metadata && typeof metadata === 'object' && 'metadata' in metadata)
        ? (metadata as Record<string, unknown>).metadata as Record<string, unknown>
        : {};
      if (typeof meta?.description === 'string') description = meta.description;
      if (typeof meta?.awardedDate === 'string') awardedDate = meta.awardedDate;
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
        tokenId: tokenId,
        to: log.args?.to,
        description: description,
        awardedDate: awardedDate,
        credentialSubjectId: credentialSubjectId,
        credentialSubjectImage: credentialSubjectImage,
        credentialSubjectName: credentialSubjectName,
        blockNumber: log.blockNumber,
        logIndex: log.index
      };
    };
    const metaResults = await Promise.all(logsToProcess.map(fetchMetaForLog));
  const newRecords = metaResults.filter((r): r is BadgeRecord => !!r && typeof r === 'object' && typeof (r as BadgeRecord).tokenId === 'string' && typeof (r as BadgeRecord).blockNumber === 'number' && typeof (r as BadgeRecord).logIndex === 'number');
    added = newRecords.length;
  const lastLogIndex = state.lastLogIndex || 0;
    if (added > 0) {
      // Only write if new records
      await setData([...data, ...newRecords.map(record => {
        // Remove blockNumber and logIndex before saving
  const rest: Record<string, unknown> = { ...record };
  delete rest.blockNumber;
  delete rest.logIndex;
  return rest;
      })]);
      // Only update state if records were added
      const intendedState = { lastBlock: toBlock, lastLogIndex };
      await setState(intendedState);
    } else {
      // No new records, just advance state
      const intendedState = { lastBlock: toBlock, lastLogIndex };
      await setState(intendedState);
    }
    total = (await getData()).length;
    if (toBlock >= latestBlock) done = true;
    return NextResponse.json({ added, total, done });
  } catch (e) {
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
