import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, notes, adminAddress } = await request.json();

    if (!contractAddress || !adminAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Update the notes for the contract
      await pool.query(`
        UPDATE barabots_contract_categories
        SET notes = $1
        WHERE contract_address = $2
      `, [notes || null, contractAddress.toLowerCase()]);

      return NextResponse.json({ success: true });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error updating contract notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
