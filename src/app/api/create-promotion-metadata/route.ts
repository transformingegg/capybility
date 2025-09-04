import { NextResponse } from "next/server";
import { put, head } from '@vercel/blob';
import { ethers } from "ethers";

export async function POST(request: Request) {
  try {
    const { tokenId, walletAddress, promotionType, txHash, contractAddress } = await request.json();
    if (!tokenId || !walletAddress || !promotionType || !txHash || !contractAddress) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if metadata already exists
    const metadataPath = `promotion-metadata/${tokenId}.json`;
    let alreadyExists = false;
    let existingUrl = "";
    try {
      const headResult = await head(metadataPath);
      if (headResult && headResult.url) {
        alreadyExists = true;
        existingUrl = headResult.url;
      }
    } catch (e) {
      // Not found, proceed to create
    }
    if (alreadyExists) {
      return NextResponse.json({ success: true, metadataUrl: existingUrl, alreadyExists: true });
    }

    // Verify mint transaction using ABI
    const ABI = [
      {
        "inputs": [
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "string", "name": "promotionType", "type": "string" }
        ],
        "name": "mintPromotion",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
      }
    ];
    const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.data) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 400 });
    }
    let decoded = null;
    try {
      decoded = contract.interface.decodeFunctionData("mintPromotion", tx.data);
    } catch (e) {}
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Transaction data mismatch: Incorrect function or promotionType" }, { status: 400 });
    }
    // Optionally check promotionType matches
    if (decoded.promotionType !== promotionType) {
      return NextResponse.json({ success: false, error: "promotionType mismatch" }, { status: 400 });
    }

    // Set image URL based on promotionType
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let imageUrl: string;
    if (promotionType === 'Educhain Expert') {
      imageUrl = `${baseUrl}/img/EduchainExpertCapybilityPromo.png`;
    } else {
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
      metadataPath,
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