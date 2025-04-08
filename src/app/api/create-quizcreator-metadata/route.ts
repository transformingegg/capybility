import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(request: Request) {
  try {
    const { tokenId, quizId, walletAddress } = await request.json();
    console.log("Received metadata creation request:", { tokenId, quizId, walletAddress });

    if (!tokenId || !quizId || !walletAddress) {
      console.error("Missing required fields:", { tokenId, quizId, walletAddress });
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Generate the metadata
    const metadata = {
      name: "Capybility Quiz Creator NFT",
      description: "This NFT represents ownership of a quiz created on Capybility",
      image: `${process.env.NEXT_PUBLIC_APP_URL}/quizcreatormetadata/img/NFT.png`,
      attributes: [
        {
          trait_type: "Quiz ID",
          value: quizId
        },
        {
          trait_type: "Creator",
          value: walletAddress
        }
      ]
    };

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    await pool.query(
      'INSERT INTO nft_metadata (token_id, metadata_type, json_data) VALUES ($1, $2, $3)',
      [tokenId, 'quizcreator', metadata]
    );

    await pool.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create metadata: " + (error as Error).message 
    }, { status: 500 });
  }
}