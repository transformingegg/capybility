import { NextResponse } from "next/server";
import { put } from '@vercel/blob';
//import { uploadPatternToBlob } from "@/lib/generate-pattern";

// Function to randomly assign a rarity level or based on score
function assignRarity(score?: number): string {
  if (score !== undefined) {
    // If score is provided, assign rarity based on score
    if (score >= 0.9) return "Legendary";
    if (score >= 0.8) return "Epic";
    if (score >= 0.7) return "Rare";
    if (score >= 0.6) return "Uncommon";
    return "Common";
  } else {
    // Original random rarity assignment
    const rand = Math.random() * 100; 
    if (rand < 1) return "Legendary"; // 1% chance
    if (rand < 6) return "Epic"; // 5% chance
    if (rand < 16) return "Rare"; // 10% chance
    if (rand < 36) return "Uncommon"; // 20% chance
    return "Common"; // 64% chance
  }
}

export async function POST(request: Request) {
  try {
    const { tokenId, quizId, score, walletAddress, timestamp } = await request.json();
    
    if (!tokenId || !quizId || !walletAddress) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    // Determine rarity based on score if provided, otherwise randomly assign
    const rarity = assignRarity(score);
    
    // Construct the image URL based on the rarity
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // Fallback to localhost if not set
    const imageUrl = `${baseUrl}/img/${rarity}V2.png`; // Construct the full image URL
    
    // Create metadata
    const metadata = {
      name: score ? `Quiz Completion NFT - Score: ${Math.round((score || 0) * 100)}%` : "Quiz Completion NFT",
      description: "Capybility Quiz Completion - bestowed upon you by the great capy Dr. Q for completing a quiz.",
      image: imageUrl, // This uses the static image URL based on rarity
      attributes: [
        {
          trait_type: "Quiz ID",
          value: quizId,
        },
        {
          trait_type: "Completion Date",
          value: timestamp || new Date().toISOString(),
        },
        {
          trait_type: "Rarity",
          value: rarity,
        }
      ],
    };
    
    // If score is provided, add it to attributes
    if (score !== undefined) {
      metadata.attributes.push({
        trait_type: "Score",
        value: `${Math.round(score * 100)}%`,
      });
    }
    
    // Store metadata in Vercel Blob
    const metadataBlob = await put(
      `metadata/${tokenId}.json`, 
      JSON.stringify(metadata),
      { 
        contentType: 'application/json',
        access: 'public' 
      }
    );
    
    console.log("Metadata stored successfully at:", metadataBlob.url);

    return NextResponse.json({
      success: true,
      metadataUrl: metadataBlob.url,
      rarity: rarity
    });
    
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create metadata: " + (error as Error).message 
    }, { status: 500 });
  }
}