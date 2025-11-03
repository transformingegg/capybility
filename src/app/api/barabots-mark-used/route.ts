import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, mintType, category } = await request.json();

    if (!walletAddress || !mintType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['free', 'discount'].includes(mintType)) {
      return NextResponse.json({ error: 'Invalid mint type' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    const tableName = mintType === 'free' ? 'barabots_free_wl' : 'barabots_discount_wl';

    // Mark whitelist entry as used - match by category if specified
    let query;
    let params;

    if (category && category !== 'random-free' && category !== 'random-discount') {
      // Specific category - mark one entry
      query = `
        UPDATE ${tableName}
        SET used = true, used_at = NOW()
        WHERE id = (
          SELECT id FROM ${tableName}
          WHERE wallet_address = $1 AND category = $2 AND used = false
          LIMIT 1
        )
        RETURNING *
      `;
      params = [walletAddress.toLowerCase(), category];
    } else {
      // Random category (category is NULL) - mark only ONE entry
      query = `
        UPDATE ${tableName}
        SET used = true, used_at = NOW()
        WHERE id = (
          SELECT id FROM ${tableName}
          WHERE wallet_address = $1 AND category IS NULL AND used = false
          LIMIT 1
        )
        RETURNING *
      `;
      params = [walletAddress.toLowerCase()];
    }

    const result = await pool.query(query, params);

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No eligible whitelist entry found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Whitelist marked as used' });

  } catch (error) {
    console.error('Error marking whitelist as used:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}