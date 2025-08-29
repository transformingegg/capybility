import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// Check if user has completed at least one quiz
async function hasCompletedQuiz(address: string): Promise<boolean> {
  const result = await pool.query('SELECT COUNT(*) as count FROM quiz_submissions WHERE wallet_address = $1', [address]);
  return parseInt(result.rows[0].count) > 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referer = searchParams.get('referer');
    if (!referer) {
      return NextResponse.json({ referrals: [] });
    }
    const rows = await pool.query('SELECT referee FROM referrals WHERE referer = $1', [referer]);
    const referrals = await Promise.all(rows.rows.map(async (row: { referee: string }) => ({
      referee: row.referee,
      hasCompletedQuiz: await hasCompletedQuiz(row.referee)
    })));
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Referral-list API error:', error);
    return NextResponse.json({ referrals: [], error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
