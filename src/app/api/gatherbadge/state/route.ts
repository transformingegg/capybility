import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function GET() {
  try {
    const res = await pool.query('SELECT last_block, last_log_index FROM badge_gather_state ORDER BY id DESC LIMIT 1');
    if (res.rows.length === 0) {
      return NextResponse.json({ lastBlock: 0, lastLogIndex: 0 });
    }
    return NextResponse.json({ lastBlock: res.rows[0].last_block, lastLogIndex: res.rows[0].last_log_index });
  } catch (e) {
    return NextResponse.json({ error: 'DB error', details: (e as Error).message }, { status: 500 });
  }
}
