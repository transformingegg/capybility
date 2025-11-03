import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Get available categories for free mint
      const freeCategoriesResult = await pool.query(`
        SELECT DISTINCT category FROM barabots_free_wl
        WHERE wallet_address = $1 AND used = FALSE AND category IS NOT NULL
      `, [walletAddress.toLowerCase()]);

      const freeCategories = freeCategoriesResult.rows.map(row => row.category);
      const hasFreeRandom = (await pool.query(`
        SELECT 1 FROM barabots_free_wl
        WHERE wallet_address = $1 AND used = FALSE AND category IS NULL
        LIMIT 1
      `, [walletAddress.toLowerCase()])).rows.length > 0;

      // Get available categories for discount mint
      const discountCategoriesResult = await pool.query(`
        SELECT DISTINCT category FROM barabots_discount_wl
        WHERE wallet_address = $1 AND used = FALSE AND category IS NOT NULL
      `, [walletAddress.toLowerCase()]);

      const discountCategories = discountCategoriesResult.rows.map(row => row.category);
      const hasDiscountRandom = (await pool.query(`
        SELECT 1 FROM barabots_discount_wl
        WHERE wallet_address = $1 AND used = FALSE AND category IS NULL
        LIMIT 1
      `, [walletAddress.toLowerCase()])).rows.length > 0;

      return NextResponse.json({
        free: {
          eligible: freeCategories.length > 0 || hasFreeRandom,
          categories: freeCategories,
          hasRandom: hasFreeRandom
        },
        discount: {
          eligible: discountCategories.length > 0 || hasDiscountRandom,
          categories: discountCategories,
          hasRandom: hasDiscountRandom
        }
      });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error checking Barabots eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}