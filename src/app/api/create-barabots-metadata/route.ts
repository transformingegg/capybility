import { NextResponse } from "next/server";
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const { tokenId, walletAddress, category, type } = await request.json();

    console.log('Creating Barabots metadata:', { tokenId, walletAddress, category, type });

    if (!tokenId || !walletAddress || !category) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: tokenId, walletAddress, category" 
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE'];
    if (!validCategories.includes(category.toUpperCase())) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      }, { status: 400 });
    }

    const categoryLower = category.toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (type === 'evolved') {
      // Create evolved metadata (for when paired with transaction)
      // Randomly assign rarity: 65% base, 30% rare, 4.95% epic, 0.05% legendary
      const rand = Math.random();
      let rarity: string;
      if (rand < 0.65) rarity = 'base';
      else if (rand < 0.95) rarity = 'rare';
      else if (rand < 0.996) rarity = 'epic';
      else rarity = 'legendary';

      const evolvedMetadata = {
        name: `Assembled ${category.toUpperCase()} BaraBot`,
        description: `An Assembled BaraBot representing a ${category.toUpperCase()} transaction on EDUCHAIN.`,
        image: `${baseUrl}/barabotsmetadata/img/barabot-${categoryLower}-${rarity}.png`,
        attributes: [
          { trait_type: "Category", value: category.toUpperCase() },
          { trait_type: "Rarity", value: rarity.charAt(0).toUpperCase() + rarity.slice(1) },
          { trait_type: "State", value: "Barabot" }
        ]
      };

      const evolvedMetadataPath = `barabotsmetadata/${tokenId}-evolved.json`;

      const evolvedBlob = await put(
        evolvedMetadataPath,
        JSON.stringify(evolvedMetadata, null, 2),
        { contentType: 'application/json', access: 'public' }
      );

      return NextResponse.json({ 
        success: true, 
        evolvedMetadataUrl: evolvedBlob.url,
        rarity
      });
    }

    // Create crate metadata (initial state) - default
    const crateMetadata = {
      name: `${category.toUpperCase()} BaraBots Crate`,
      description: `A BaraBot crate. Visit https://capybility.xyz/barabots/ to assemble what is inside!`,
      image: `${baseUrl}/barabotsmetadata/img/crate-${categoryLower}.png`,
      attributes: [
        { trait_type: "Category", value: category.toUpperCase() },
        { trait_type: "State", value: "Crate" }
      ]
    };

    const crateMetadataPath = `barabotsmetadata/${tokenId}.json`;

    const crateBlob = await put(
      crateMetadataPath,
      JSON.stringify(crateMetadata, null, 2),
      { contentType: 'application/json', access: 'public' }
    );

    console.log('Crate metadata created successfully:', crateBlob.url);

    return NextResponse.json({ 
      success: true, 
      crateMetadataUrl: crateBlob.url
    });

  } catch (error) {
    console.error('Error creating Barabots metadata:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
