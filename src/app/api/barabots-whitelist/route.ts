import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mintType, bulkData, adminAddress } = await request.json();

    if (!mintType || !bulkData || !adminAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['free', 'discount'].includes(mintType)) {
      return NextResponse.json({ error: 'Invalid mint type' }, { status: 400 });
    }

    // Parse and validate the bulk data
    const lines = bulkData.trim().split('\n');
    const entries: { wallet: string; category: string | null }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const parts = line.split(',');
      if (parts.length !== 2) {
        return NextResponse.json({
          error: `Invalid format on line ${i + 1}. Expected: wallet,category`
        }, { status: 400 });
      }

      const [wallet, categoryStr] = parts.map((p: string) => p.trim().toLowerCase());

      // Validate wallet address format
      if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
        return NextResponse.json({
          error: `Invalid wallet address on line ${i + 1}: ${wallet}`
        }, { status: 400 });
      }

      // Validate category
      let category: string | null = null;
      if (categoryStr && categoryStr !== 'random') {
        const validCategories = ['build', 'work', 'defi', 'learn', 'culture'];
        if (!validCategories.includes(categoryStr)) {
          return NextResponse.json({
            error: `Invalid category on line ${i + 1}: ${categoryStr}. Valid categories: build, work, defi, learn, culture, random`
          }, { status: 400 });
        }
        category = categoryStr.toUpperCase();
      }

      entries.push({ wallet, category });
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No valid entries found' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      const tableName = mintType === 'free' ? 'barabots_free_wl' : 'barabots_discount_wl';

      // Insert entries (no constraints, so duplicates are allowed)
      const inserted: number[] = [];

      for (const entry of entries) {
        try {
          const result = await pool.query(`
            INSERT INTO ${tableName} (wallet_address, category, added_by, used)
            VALUES ($1, $2, $3, false)
          `, [entry.wallet, entry.category, adminAddress.toLowerCase()]);

          if (result.rowCount && result.rowCount > 0) {
            inserted.push(result.rows[0]?.id || 0);
          }
        } catch (error) {
          console.error(`Error inserting ${entry.wallet}:`, error);
          // Continue with other entries
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${entries.length} entries`,
        inserted: inserted.length,
        details: {
          inserted: inserted.map(id => `Entry ID: ${id}`)
        }
      });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error in barabots whitelist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}