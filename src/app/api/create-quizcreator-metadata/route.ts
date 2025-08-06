import { NextResponse } from "next/server";
import { put } from '@vercel/blob';
//import fs from 'fs';
//import path from 'path';

export async function POST(request: Request) {
  try {
    const { tokenId, quizId, walletAddress } = await request.json();

    console.log("Received metadata creation request:", { tokenId, quizId, walletAddress });

    if (!tokenId || !quizId || !walletAddress) {
      console.error("Missing required fields:", { tokenId, quizId, walletAddress });
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    // Set the image URL to point to the static endpoint
    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quizcreatormetadata/img/static`;

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

    // Store metadata in Vercel Blob
    const metadataBlob = await put(
      `quizcreatormetadata/${tokenId}.json`, 
      JSON.stringify(metadata),
      { 
        contentType: 'application/json',
        access: 'public' 
      }
    );

    console.log("Metadata stored successfully at:", metadataBlob.url);

    return NextResponse.json({ 
      success: true, 
      metadataUrl: metadataBlob.url 
    });

  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create metadata: " + (error as Error).message 
    }, { status: 500 });
  }
}