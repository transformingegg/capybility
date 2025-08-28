import { NextResponse } from "next/server";
import { put } from '@vercel/blob';
//import fs from 'fs';
//import path from 'path';

export async function POST(request: Request) {
  try {
    console.log("[Metadata API] Incoming request at", new Date().toISOString());
    const { tokenId, quizId, walletAddress } = await request.json();
    console.log("[Metadata API] Parsed body:", { tokenId, quizId, walletAddress });

    if (!tokenId || !quizId || !walletAddress) {
      console.error("[Metadata API] Missing required fields:", { tokenId, quizId, walletAddress });
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Log environment variables used
    console.log("[Metadata API] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);

    // Set the image URL to point to the static endpoint
    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quizcreatormetadata/img/static`;
    console.log("[Metadata API] Image URL:", imageUrl);

    // Create the metadata JSON object with the static image URL
    const metadata = {
      name: "Quiz Creator NFT",
      description: "This NFT represents ownership of a quiz created on CapybilIty",
      image: imageUrl,
      attributes: [
        {
          trait_type: "Creator",
          value: walletAddress,
        },
        {
          trait_type: "Quiz ID",
          value: quizId,
        },
        {
          trait_type: "Creation Date",
          value: new Date().toISOString(),
        }
      ],
    };
    console.log("[Metadata API] Metadata object:", metadata);

    // Store metadata in Vercel Blob
    let metadataBlob;
    try {
      metadataBlob = await put(
        `quizcreatormetadata/${tokenId}.json`, 
        JSON.stringify(metadata),
        { 
          contentType: 'application/json',
          access: 'public' 
        }
      );
      console.log("[Metadata API] Metadata stored successfully at:", metadataBlob.url);
    } catch (blobError) {
      console.error("[Metadata API] Error storing metadata in Vercel Blob:", blobError);
      return NextResponse.json({ success: false, error: "Failed to store metadata blob" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      metadataUrl: metadataBlob.url 
    });

  } catch (error) {
    console.error("[Metadata API] General error creating metadata:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create metadata: " + (error as Error).message 
    }, { status: 500 });
  }
}