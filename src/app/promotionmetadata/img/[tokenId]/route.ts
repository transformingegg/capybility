import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;

    console.log(`Fetching image for promotion token ID: ${tokenId}`);

    // Fetch metadata to get promotion type
    const metadataUrl = `${process.env.NEXT_PUBLIC_APP_URL}/promotionmetadata/${tokenId}`;
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
    }
    const metadata = await metadataResponse.json();
    const promotionType = metadata.attributes.find((attr: { trait_type: string; value: string }) => attr.trait_type === "Promotion Type")?.value;

    if (!promotionType) {
      throw new Error("Promotion type not found in metadata");
    }

    const imageName = promotionType.replace(/\s+/g, '') + "Promo"; // Remove spaces and add "Promo"
    const imagePath = path.join(process.cwd(), "public", "img", `${imageName}.png`);

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found for promotion type: ${promotionType}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error("Error retrieving image:", error);
    return NextResponse.json({ error: "Failed to retrieve image" }, { status: 500 });
  }
}