import { NextResponse } from "next/server";
import { ethers } from "ethers";

// Add these interfaces
interface MetadataAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  attributes: MetadataAttribute[];
}

const QUIZ_NFT_ADDRESS = "0x1B7088f19327AF194dC8e4668eF614733C4DF113" as `0x${string}`;
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

  console.log("Fetching NFTs for address:", address);
  console.log("Using base URL:", BASE_URL);

  if (!address) {
    return NextResponse.json({ success: false, error: "No address provided" }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider("https://rpc.open-campus-codex.gelato.digital");
    const contract = new ethers.Contract(QUIZ_NFT_ADDRESS, QUIZ_NFT_ABI, provider);
    
    
    // Efficiently fetch all token IDs owned by the address
    let ownedNFTs: number[] = [];
    try {
      const tokenIds: bigint[] = await contract.tokensOfOwner(address);
      ownedNFTs = tokenIds.map(id => Number(id));
    } catch (e) {
      console.error("Error fetching tokensOfOwner:", e);
    }
    console.log("Found owned NFTs:", ownedNFTs);

    const rarityDistribution: { [key: string]: number } = {};
    for (const tokenId of ownedNFTs) {
      try {
        const metadataUrl = `${BASE_URL}/metadata/${tokenId}.json`;
        console.log(`Fetching metadata from: ${metadataUrl}`);
        const response = await fetch(metadataUrl);
        const metadata = await response.json() as NFTMetadata;
        console.log(`Metadata for token ${tokenId}:`, metadata);
        
        const rarity = metadata.attributes.find(
          (attr: MetadataAttribute) => attr.trait_type === "Rarity"
        )?.value;
        
        if (rarity) {
          rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1;
        }
      } catch (e) {
        console.error(`Error fetching metadata for token ${tokenId}:`, e);
      }
    }

    console.log("Final rarity distribution:", rarityDistribution);

    return NextResponse.json({ 
      success: true, 
      rarityDistribution 
    });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch NFTs" }, { status: 500 });
  }
}