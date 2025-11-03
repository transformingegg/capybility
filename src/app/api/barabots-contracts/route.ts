import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Get all contracts from barabots_contract_categories with their info
      const contractsResult = await pool.query(`
        SELECT
          contract_address,
          category,
          notes,
          added_at,
          added_by
        FROM barabots_contract_categories
        ORDER BY 
          CASE WHEN category = 'unknown' THEN 0 ELSE 1 END,
          added_at DESC
      `);

      const contracts = contractsResult.rows.map(row => ({
        contract_address: row.contract_address,
        category: row.category,
        notes: row.notes,
        transaction_count: 0, // We don't track this per contract
        last_seen: row.added_at
      }));

      return NextResponse.json({ contracts });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching Barabots contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, category, adminAddress } = await request.json();

    if (!contractAddress || !category || !adminAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE', 'unknown'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Insert or update the contract category
      await pool.query(`
        INSERT INTO barabots_contract_categories (contract_address, category, added_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (contract_address)
        DO UPDATE SET
          category = EXCLUDED.category,
          added_by = EXCLUDED.added_by
      `, [contractAddress.toLowerCase(), category, adminAddress.toLowerCase()]);

      return NextResponse.json({ success: true });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error updating contract category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}