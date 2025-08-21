import { NextResponse } from "next/server";
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const { tokenId, walletAddress, promotionType } = await request.json();

    if (!tokenId || !walletAddress || !promotionType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let imageUrl: string;

    // Check the promotionType and set the image URL accordingly
    if (promotionType === 'Educhain Expert') {
      imageUrl = `${baseUrl}/img/EduchainExpertCapybilityPromo.png`;
    } else {
      // You can add more 'else if' blocks here for other promotion types
      // Or use a default fallback like the original regex
      imageUrl = `${baseUrl}/img/${promotionType.replace(/\s+/g, '')}.png`;
    }

    const metadata = {
      name: `${promotionType} Badge`,
      description: `Awarded for demonstrating expertise in ${promotionType} on Capybility.`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Promotion Type",
          value: promotionType,
        },
      ],
    };

    const metadataBlob = await put(
      `promotion-metadata/${tokenId}.json`,
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