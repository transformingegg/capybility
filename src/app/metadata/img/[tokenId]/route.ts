import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;

    console.log(`Fetching image for token ID: ${tokenId}`);

    // Construct the metadata URL
    const metadataUrl = `${process.env.NEXT_PUBLIC_APP_URL}/metadata/${tokenId}`;

    try {
      // Fetch the metadata to get the rarity
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
      }
      const metadata = await metadataResponse.json();
      const rarity = metadata.attributes.find((attr: { trait_type: string; value: string }) => attr.trait_type === "Rarity")?.value;

      if (!rarity) {
        throw new Error("Rarity not found in metadata");
      }

      // Construct the image path based on the rarity
      const imagePath = path.join(process.cwd(), "public", "img", `${rarity}V2.png`);

      // Check if the image exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found for rarity: ${rarity}`);
      }

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      // Convert Buffer to ArrayBuffer
      const arrayBuffer = Uint8Array.from(imageBuffer).buffer as ArrayBuffer;

      // Return the image with proper content type
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    } catch (error) {
      console.error(`Error retrieving image for token ${tokenId}:`, error);
      return NextResponse.json({ error: "Failed to retrieve image" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in image endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}