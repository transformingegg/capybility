import { NextResponse } from "next/server";
import { list } from '@vercel/blob';
import path from "path";
import fs from "fs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const tokenId = (await context.params).tokenId;
    
    console.log(`Fetching image for token ID: ${tokenId}`);
    
    try {
      // Try to fetch from Vercel Blob by listing blobs with this prefix
      const { blobs } = await list({
        prefix: `metadata/img/${tokenId}.png`,
      });
      
      if (blobs.length === 0) {
        console.log(`Image not found in Blob for token ID: ${tokenId}, checking local filesystem...`);
        
        // Fallback to local filesystem for backward compatibility
        const imagePath = path.join(process.cwd(), "public", "metadata", "img", `${tokenId}.png`);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          return new Response(imageBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }
        
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      
      const blobUrl = blobs[0].url;
      
      // Fetch the actual content from the URL
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob content: ${response.status} ${response.statusText}`);
      }
      
      // Return the image with proper content type
      const contentType = response.headers.get('content-type') || 'image/png';
      const content = await response.arrayBuffer();
      
      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
      
    } catch (error) {
      console.error(`Error retrieving image for token ${tokenId}:`, error);
      
      // Try local filesystem as fallback
      try {
        const imagePath = path.join(process.cwd(), "public", "metadata", "img", `${tokenId}.png`);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          return new Response(imageBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }
      } catch (fsError) {
        console.error(`Filesystem fallback also failed:`, fsError);
      }
      
      return NextResponse.json({ error: "Failed to retrieve image" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in image endpoint:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}