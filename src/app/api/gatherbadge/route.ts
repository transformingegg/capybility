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
const BATCH_SIZE = 100;
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
  // For compatibility, just return the badge-gather.json file from Blob Storage
  try {
    const url = `${BLOB_BASE_URL}/${DATA_BLOB_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const file = await res.text();
    return new NextResponse(file, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST() {
  // This is the gather-badges logic
  let added = 0;
  let total = 0;
  let done = false;
  let state: GathererState = { lastBlock: 0, lastLogIndex: 0 };
  try {
    state = await getState();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = state.lastBlock || 0;
    const toBlock = Math.min(fromBlock + BLOCK_STEP, latestBlock);
    let logs: ethers.EventLog[] = [];
    if (fromBlock >= latestBlock) {
      done = true;
    } else {
      logs = await contract.queryFilter('Transfer', fromBlock, toBlock) as ethers.EventLog[];
    }
    const data = await getData();
    let lastLogIndex = state.lastLogIndex || 0;
    for (let i = 0; i < logs.length; i++) {
      if (fromBlock === state.lastBlock && i < lastLogIndex) continue;
      const log = logs[i];
      // Only add if tokenId is not already present
      const tokenId = log.args?.tokenId?.toString();
      if (tokenId && !data.find((d: { tokenId: string }) => d.tokenId === tokenId)) {
        data.push({
          from: log.args?.from,
          to: log.args?.to,
          tokenId,
          blockNumber: log.blockNumber,
        });
        added++;
      }
      lastLogIndex = i + 1;
      if (added >= BATCH_SIZE) break;
    }
    try {
      await setData(data);
    } catch (e) {
      return NextResponse.json({ error: 'Error writing data blob', details: (e as Error).message }, { status: 500 });
    }
    try {
      await setState({ lastBlock: toBlock, lastLogIndex: lastLogIndex });
    } catch (e) {
      return NextResponse.json({ error: 'Error writing state blob', details: (e as Error).message }, { status: 500 });
    }
    total = data.length;
    if (toBlock >= latestBlock) done = true;
    return NextResponse.json({ added, total, done });
  } catch (e) {
    console.error('[BadgeGatherer] Error in gatherer POST:', e);
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
