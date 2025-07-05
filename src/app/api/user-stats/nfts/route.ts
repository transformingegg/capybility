import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { Pool } from "pg";

// Add these interfaces
interface MetadataAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  image: string;
  attributes: MetadataAttribute[];
}

const QUIZ_NFT_ADDRESS = process.env.NEXT_PUBLIC_QUIZ_COMPLETION_NFT_ADDRESS as `0x${string}`;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Validate QUIZ_NFT_ADDRESS at runtime
if (!QUIZ_NFT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error("Invalid QUIZ_NFT_ADDRESS");
}

const QUIZ_NFT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "tokensOfOwner",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ success: false, error: "No address provided" }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider("https://rpc.edu-chain.raas.gelato.cloud/");
    const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);

    // 1. Get all token IDs owned by the user (on-chain)
    let ownedNFTs: number[] = [];
    try {
      const tokenIds: bigint[] = await contract.tokensOfOwner(address);
      ownedNFTs = tokenIds.map(id => Number(id));
    } catch (e) {
      console.error("Error fetching tokensOfOwner:", e);
    }

    // 2. Get all token IDs from the database for this user
    let dbTokenIds: number[] = [];
    try {
      const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
      const dbResult = await pool.query(
        `SELECT token_id FROM quiz_submissions WHERE wallet_address = $1 AND nft_minted = true AND token_id IS NOT NULL`,
        [address]
      );
      dbTokenIds = dbResult.rows.map(row => Number(row.token_id));
      await pool.end();
    } catch (e) {
      console.error("Error fetching DB token IDs:", e);
    }

    // 3. Only include NFTs present in both lists
    const crossCheckedTokenIds = ownedNFTs.filter(id => dbTokenIds.includes(id));

    // 4. Build rarity distribution as before
    const rarityDistribution: { [key: string]: number } = {};
    const nfts: { tokenId: number; image: string }[] = [];
for (const tokenId of crossCheckedTokenIds) {
  try {
    const metadataUrl = `${BASE_URL}/metadata/${tokenId}`;
    const response = await fetch(metadataUrl);
    if (!response.ok) continue;
    const metadata = await response.json() as NFTMetadata;
    if (!metadata || !Array.isArray(metadata.attributes)) continue;
    const rarity = metadata.attributes.find(
      (attr: MetadataAttribute) => attr.trait_type === "Rarity"
    )?.value;
    if (rarity) {
      rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1;
    }
    if (metadata.image) {
      nfts.push({ tokenId, image: metadata.image });
    }
  } catch (e) {
    console.error(`Error fetching metadata for token ${tokenId}:`, e);
  }
}

    return NextResponse.json({
      success: true,
      rarityDistribution,
      totalNFTs: crossCheckedTokenIds.length,
      nfts,
    });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch NFTs" }, { status: 500 });
  }
}