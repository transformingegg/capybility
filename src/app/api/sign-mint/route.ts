import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { generateMintSignature } from "@lib/sign";

const QUIZ_NFT_ADDRESS = "0x33B66e43f6f3CCd8C433c2F9D4159bdB3ce49d77" as `0x${string}`;

// Validate QUIZ_NFT_ADDRESS at runtime
if (!QUIZ_NFT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error("Invalid QUIZ_NFT_ADDRESS");
}

const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
const quizNFTContract = new ethers.Contract(QUIZ_NFT_ADDRESS, [
  "function getNonce(address user) public view returns (uint256)",
], provider);

export async function POST(request: Request) {
  const { walletAddress, quizId } = await request.json();

  if (!walletAddress || !quizId) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Fetch the user's nonce
    const nonce = await quizNFTContract.getNonce(walletAddress);

    // Generate the signature
    const signResult = await generateMintSignature(walletAddress, quizId, nonce.toString(), QUIZ_NFT_ADDRESS);
    if (!signResult.success) {
      return NextResponse.json({ success: false, error: "Failed to generate signature" }, { status: 500 });
    }

    return NextResponse.json({ success: true, signature: signResult.signature, nonce: nonce.toString() });
  } catch (error) {
    console.error("Error generating mint signature:", error);
    return NextResponse.json({ success: false, error: "Failed to generate mint signature" }, { status: 500 });
  }
}