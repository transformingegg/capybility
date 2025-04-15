import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await _context.params).tokenId;
    console.log(`Static image requested for token ID: ${tokenId}`);
    
    // For any token ID, we'll just serve the static image
    const imagePath = path.join(process.cwd(), "public", "quizcreatormetadata", "img", "NFT.png");
    
    if (!fs.existsSync(imagePath)) {
      console.error("Static quiz creator NFT image not found at:", imagePath);
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Return the image with appropriate headers
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
    
  } catch (error) {
    console.error("Error serving quiz creator NFT image:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}