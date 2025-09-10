import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

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
const DATA_PATH = path.join(process.cwd(), 'public', 'badge-gather.json');
const STATE_PATH = path.join(process.cwd(), 'public', 'badge-gather-state.json');
const BATCH_SIZE = 100;
const BLOCK_STEP = 100000;

async function getState() {
  try {
    const file = await fs.readFile(STATE_PATH, 'utf-8');
    return JSON.parse(file);
  } catch {
    return { lastBlock: 0, lastLogIndex: 0 };
  }
}

async function setState(state: GathererState) {
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

async function getData() {
  try {
    const file = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(file);
  } catch {
    return [];
  }
}

async function setData(data: unknown[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

type GathererState = { lastBlock: number; lastLogIndex: number };

export async function GET() {
  // For compatibility, just return the badge-gather.json file
  try {
    const file = await fs.readFile(DATA_PATH, 'utf-8');
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
    await setData(data);
    await setState({ lastBlock: toBlock, lastLogIndex: lastLogIndex });
    total = data.length;
    if (toBlock >= latestBlock) done = true;
    return NextResponse.json({ added, total, done });
  } catch (e) {
    return NextResponse.json({ error: 'Error gathering badges', details: (e as Error).message }, { status: 500 });
  }
}
