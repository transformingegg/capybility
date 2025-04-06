import { NextResponse } from "next/server";
import { generatePatternImage } from "@lib/generate-pattern";
import fs from "fs";
import path from "path";

// Function to randomly assign a rarity level
function assignRarity(): string {
  const rand = Math.random() * 100; // Random number between 0 and 100
  if (rand < 1) return "Legendary"; // 1% chance
  if (rand < 6) return "Epic"; // 5% chance (1 + 5)
  if (rand < 16) return "Rare"; // 10% chance (6 + 10)
  if (rand < 36) return "Uncommon"; // 20% chance (16 + 20)
  return "Common"; // 64% chance (default)
}

// Base URL for your app (replace with your actual URL)
const BASE_URL = "https://your-app.com"; // Replace with your deployed URL

export async function POST(request: Request) {
  // Simple authentication (replace with a more secure method in production)
  const authHeader = request.headers.get("authorization");
  const SECRET_KEY = process.env.METADATA_SECRET_KEY || "your-secret-key";
  if (authHeader !== `Bearer ${SECRET_KEY}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { tokenId, quizId, walletAddress, timestamp } = await request.json();

  if (!tokenId || !quizId || !walletAddress || !timestamp) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Assign rarity
    const rarity = assignRarity();

    // Generate the metadata
    const metadata = {
      description: "CapyCred NFT - bestowed upon you by the great capy Dr. Q for completing a quiz.",
      image: `${BASE_URL}/metadata/img/${tokenId}`,
      name: "CapyCred Quiz NFT",
      attributes: [
        {
          trait_type: "Rarity",
          value: rarity,
        },
      ],
    };

    // Define file paths
    const metadataPath = path.join(process.cwd(), "public", "metadata", `${tokenId}.json`);
    const imagePath = path.join(process.cwd(), "public", "metadata", "img", `${tokenId}.png`);

    // Save the metadata JSON file
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Generate and save the image
    await generatePatternImage(quizId, walletAddress, timestamp, rarity, imagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ success: false, error: "Failed to create metadata" }, { status: 500 });
  }
}