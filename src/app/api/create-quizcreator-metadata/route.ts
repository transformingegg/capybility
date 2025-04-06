import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
      name: "Quiz Creator NFT",
      description: "This NFT represents ownership of a quiz created on Pruv.it",
      image: `${BASE_URL}/quizcreatormetadata/img/NFT.png`,
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

    // Define file path and ensure directory exists
    const metadataDir = path.join(process.cwd(), "public", "quizcreatormetadata");
    const metadataPath = path.join(metadataDir, `${tokenId}.json`);

    console.log("Attempting to write metadata to:", metadataPath);
    console.log("Directory exists check:", fs.existsSync(metadataDir));

    // Create directory if it doesn't exist
    if (!fs.existsSync(metadataDir)) {
      console.log("Creating metadata directory...");
      fs.mkdirSync(metadataDir, { recursive: true });
    }

    // Save the metadata JSON file
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log("Successfully wrote metadata file");
    } catch (writeError) {
      console.error("Error writing metadata file:", writeError);
      throw writeError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create metadata: " + (error as Error).message 
    }, { status: 500 });
  }
}