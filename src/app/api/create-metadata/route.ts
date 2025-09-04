import { NextResponse } from "next/server";
import { put, head } from '@vercel/blob';
import { ethers } from "ethers";
//import { uploadPatternToBlob } from "@/lib/generate-pattern";

// Function to randomly assign a rarity level or based on score
function assignRarity(score?: number): string {
  if (score !== undefined) {
    // If score is provided, assign rarity based on score
    if (score >= 0.9) return "Legendary";
    if (score >= 0.8) return "Epic";
    if (score >= 0.7) return "Rare";
    if (score >= 0.6) return "Uncommon";
    return "Common";
  } else {
    // Original random rarity assignment
    const rand = Math.random() * 100; 
    if (rand < 1) return "Legendary"; // 1% chance
    if (rand < 6) return "Epic"; // 5% chance
    if (rand < 16) return "Rare"; // 10% chance
    if (rand < 36) return "Uncommon"; // 20% chance
    return "Common"; // 64% chance
  }
}

export async function POST(request: Request) {
  try {
    const { tokenId, quizId, score, walletAddress, timestamp, txHash, contractAddress } = await request.json();
    if (!tokenId || !quizId || !walletAddress || !txHash || !contractAddress) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if metadata already exists
    const metadataPath = `metadata/${tokenId}.json`;
    let alreadyExists = false;
    let existingUrl = "";
    try {
      const headResult = await head(metadataPath);
      if (headResult && headResult.url) {
        alreadyExists = true;
        existingUrl = headResult.url;
      }
    } catch {
      // Not found, proceed to create
    }
    if (alreadyExists) {
      return NextResponse.json({ success: true, metadataUrl: existingUrl, alreadyExists: true });
    }

    // Verify mint transaction using ABI
    const ABI = [
      {
        "inputs": [
          { "internalType": "string", "name": "quizId", "type": "string" },
          { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "mint",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "quizId", "type": "string" },
          { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "mintWithDiscount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "quizId", "type": "string" },
          { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "mintWithToken",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    // Use hardcoded RPC URL
    const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.data) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 400 });
    }
    let decoded = null;
    for (const fn of ["mint", "mintWithDiscount", "mintWithToken"]) {
      try {
        decoded = contract.interface.decodeFunctionData(fn, tx.data);
        if (decoded) {
          break;
        }
      } catch {}
    }
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Transaction data mismatch: Incorrect function or quizId" }, { status: 400 });
    }
    // Optionally check quizId matches
    if (decoded.quizId !== quizId) {
      return NextResponse.json({ success: false, error: "quizId mismatch" }, { status: 400 });
    }

    // Determine rarity based on score if provided, otherwise randomly assign
    const rarity = assignRarity(score);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const imageUrl = `${baseUrl}/img/${rarity}V2.png`;
    const metadata = {
      name: score ? `Quiz Completion NFT - Score: ${Math.round((score || 0) * 100)}%` : "Quiz Completion NFT",
      description: "Capybility Quiz Completion - bestowed upon you by the great capy Dr. Q for completing a quiz.",
      image: imageUrl,
      attributes: [
        { trait_type: "Quiz ID", value: quizId },
        { trait_type: "Completion Date", value: timestamp || new Date().toISOString() },
        { trait_type: "Rarity", value: rarity },
      ],
    };
    if (score !== undefined) {
      metadata.attributes.push({ trait_type: "Score", value: `${Math.round(score * 100)}%` });
    }
    const metadataBlob = await put(
      metadataPath,
      JSON.stringify(metadata),
      { contentType: 'application/json', access: 'public' }
    );
    return NextResponse.json({ success: true, metadataUrl: metadataBlob.url, rarity });
  } catch (error) {
    console.error("Error creating metadata:", error);
    return NextResponse.json({ success: false, error: "Failed to create metadata: " + (error as Error).message }, { status: 500 });
  }
}