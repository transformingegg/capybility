import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

export async function POST(request: Request) {
  try {
    const { referer, referee } = await request.json();
    if (!referer || !referee) {
      return NextResponse.json({ success: false, error: "Missing referer or referee" }, { status: 400 });
    }
    if (referer === referee) {
      return NextResponse.json({ success: false, error: "Self-referral not allowed" }, { status: 400 });
    }
    // Check if referee already has a referrer
  const existing = await pool.query('SELECT * FROM referrals WHERE referee = $1', [referee]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: "Referee already referred" }, { status: 409 });
    }
    // Insert referral
  await pool.query('INSERT INTO referrals (referer, referee) VALUES ($1, $2)', [referer, referee]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral API error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
