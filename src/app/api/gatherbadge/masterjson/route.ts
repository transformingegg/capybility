import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const MASTER_PREFIX = 'badgeGather/masterjson-';
const BLOB_BASE_URL = process.env.BLOB_PUBLIC_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL;

export async function GET() {
  try {
    // Get the latest master_version from the DB
    const res = await pool.query('SELECT master_version FROM badge_gather_state ORDER BY id DESC LIMIT 1');
    if (!res.rows.length) throw new Error('No master_version in DB');
    const version = Number(res.rows[0].master_version) - 1;
    if (version < 1) throw new Error('No master file available');
    const masterFileName = `${MASTER_PREFIX}${version}.json`;
    const url = `${BLOB_BASE_URL}/${masterFileName}`;
    const blobRes = await fetch(url);
    if (!blobRes.ok) throw new Error('Master file not found');
    const file = await blobRes.text();
    return new NextResponse(file, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return NextResponse.json({ error: 'Not found', details: (e as Error).message }, { status: 404 });
  }
}
