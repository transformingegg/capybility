export async function GET() {
  try {
    // 1. List all shard files
    const shardFiles = await listShardFiles();
    if (!shardFiles.length) {
      return new Response('No shard files found.', { status: 404 });
    }
    // 2. Fetch and join all records
    type BadgeRecord = {
      tokenId: string;
      to: string;
      description: string;
      awardedDate: string;
      credentialSubjectId: string;
      credentialSubjectImage: string;
      credentialSubjectName: string;
    };
    let allRecords: BadgeRecord[] = [];
    for (const file of shardFiles) {
      const records = await fetchShardFile(file.url);
      allRecords = allRecords.concat(records);
    }
    // 3. Get and increment master version
    const version = await getAndIncrementMasterVersion();
    const masterFileName = `${MASTER_PREFIX}${version}.json`;
    // 4. Write master file to blob storage
    await put(masterFileName, JSON.stringify(allRecords, null, 2), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
    return new Response(`Master file created: ${masterFileName} with ${allRecords.length} records.`, { status: 200 });
  } catch (e) {
    return new Response(`Error joining shards: ${(e as Error).message}`, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { put, list } from '@vercel/blob';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const MASTER_PREFIX = 'badgeGather/masterjson-';

// Helper to get all shard files from blob storage
async function listShardFiles() {
  const blobs = await list({ prefix: 'badgeGather/' });
  console.log('[MasterJoin] Full blobs object from @vercel/blob:', blobs);
  const shardFiles = blobs.blobs
    .filter(blob => blob.pathname.startsWith('badgeGather/shard-') && blob.pathname.endsWith('.json'))
    .map(blob => ({ url: blob.url, name: blob.pathname }));
  shardFiles.sort((a, b) => a.name.localeCompare(b.name));
  console.log('[MasterJoin] Shard files from @vercel/blob:', shardFiles);
  return shardFiles;
}

// Helper to fetch and parse a shard file
async function fetchShardFile(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch shard: ${url}`);
  return await res.json();
}

// Helper to get and increment master version
async function getAndIncrementMasterVersion() {
  const res = await pool.query('SELECT master_version FROM badge_gather_state ORDER BY id DESC LIMIT 1');
  let version = 1;
  if (res.rows.length) version = res.rows[0].master_version;
  await pool.query('UPDATE badge_gather_state SET master_version = $1, updated_at = NOW() WHERE id = (SELECT id FROM badge_gather_state ORDER BY id DESC LIMIT 1)', [version + 1]);
  return version;
}

export async function POST() {
  try {
    // 1. List all shard files
    const shardFiles = await listShardFiles();
    if (!shardFiles.length) {
      return NextResponse.json({ error: 'No shard files found.' }, { status: 404 });
    }
    // 2. Fetch and join all records
    type BadgeRecord = {
      tokenId: string;
      to: string;
      description: string;
      awardedDate: string;
      credentialSubjectId: string;
      credentialSubjectImage: string;
      credentialSubjectName: string;
    };
    let allRecords: BadgeRecord[] = [];
    for (const file of shardFiles) {
      const records = await fetchShardFile(file.url);
      allRecords = allRecords.concat(records);
    }
    // 3. Get and increment master version
    const version = await getAndIncrementMasterVersion();
    const masterFileName = `${MASTER_PREFIX}${version}.json`;
    // 4. Write master file to blob storage
    await put(masterFileName, JSON.stringify(allRecords, null, 2), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
    console.log(`[MasterJoin] Created master file: ${masterFileName} from shards:`, shardFiles.map(f => f.url));
    return NextResponse.json({ masterFile: masterFileName, totalRecords: allRecords.length, shards: shardFiles.map(f => f.url) });
  } catch (e) {
    console.error('[MasterJoin] Error:', e);
    return NextResponse.json({ error: 'Error joining shards', details: (e as Error).message }, { status: 500 });
  }
}
