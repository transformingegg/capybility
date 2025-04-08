import { NextResponse } from "next/server";
//import { generatePatternImage } from "@lib/generate-pattern";
//import fs from "fs";
//import path from "path";
import { Pool } from "pg";

// Function to randomly assign a rarity level
function assignRarity(): string {
  const rand = Math.random() * 100; // Random number between 0 and 100
  if (rand < 1) return "Legendary"; // 1% chance
  if (rand < 6) return "Epic"; // 5% chance (1 + 5)
  if (rand < 16) return "Rare"; // 10% chance (6 + 10)
  if (rand < 36) return "Uncommon"; // 20% chance (16 + 20)
  return "Common"; // 64% chance (default)
}

export async function POST(request: Request) {
  // Simple authentication (replace with a more secure method in production)
  const authHeader = request.headers.get("authorization");
  const SECRET_KEY = process.env.METADATA_SECRET_KEY || "your-secret-key";
  if (authHeader !== `Bearer ${SECRET_KEY}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tokenId, quizId, walletAddress, timestamp } = await request.json();

    if (!tokenId || !quizId || !walletAddress || !timestamp) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Generate metadata
    const rarity = assignRarity();
    const metadata = {
      description: "Capybility Quiz Completion - bestowed upon you by the great capy Dr. Q for completing a quiz.",
      image: `${process.env.NEXT_PUBLIC_APP_URL}/metadata/img/${tokenId}`,
      name: "Capybility Quiz NFT",
      attributes: [{ trait_type: "Rarity", value: rarity }]
    };

    // Save to database
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    await pool.query(
      'INSERT INTO nft_metadata (token_id, metadata_type, json_data) VALUES ($1, $2, $3)',
      [tokenId, 'quiz', metadata]
    );

    await pool.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ success: false, error: "Failed to create metadata" }, { status: 500 });
  }
}