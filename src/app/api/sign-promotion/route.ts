import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { generatePromotionMintSignature } from "@lib/signForPromo"; // Import the new function

const PROMOTION_NFT_ADDRESS = process.env.NEXT_PUBLIC_PROMOTION_NFT_ADDRESS as `0x${string}`;

if (!PROMOTION_NFT_ADDRESS || !PROMOTION_NFT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error("Invalid PROMOTION_NFT_ADDRESS");
}

const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
const promotionNFTContract = new ethers.Contract(PROMOTION_NFT_ADDRESS, [
  "function getNonce(address user) public view returns (uint256)",
], provider);

export async function POST(request: Request) {
  const { walletAddress, promotionType } = await request.json();

  if (!walletAddress || !promotionType) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Fetch the user's nonce
    console.log("Calling contract with:", { walletAddress, promotionType });
    const nonce = await promotionNFTContract.getNonce(walletAddress);

    // Generate the signature
    const signResult = await generatePromotionMintSignature( // Use the new function
      walletAddress,
      promotionType,
      nonce.toString(),
      PROMOTION_NFT_ADDRESS
    );
    if (!signResult.success) {
      return NextResponse.json({ success: false, error: "Failed to generate signature" }, { status: 500 });
    }

    return NextResponse.json({ success: true, signature: signResult.signature, nonce: nonce.toString() });
  } catch (error) {
    console.error("Error generating mint signature:", error);
    return NextResponse.json({ success: false, error: "Failed to generate mint signature" }, { status: 500 });
  }
}