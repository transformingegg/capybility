import { NextResponse } from "next/server";
import { ethers } from "ethers";

const QUIZ_NFT_ADDRESS = "0x33B66e43f6f3CCd8C433c2F9D4159bdB3ce49d77" as `0x${string}`;
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
    
    const totalSupply = await contract.totalSupply();
    console.log("Total NFT supply:", totalSupply.toString());
    
    const ownedNFTs = [];
    
    for (let i = 1; i <= totalSupply; i++) {
      try {
        const owner = await contract.ownerOf(i);
        console.log(`Checking token ${i} - Owner: ${owner}`);
        if (owner.toLowerCase() === address.toLowerCase()) {
          ownedNFTs.push(i);
        }
      } catch (e) {
        console.log(`Error checking token ${i}:`, e);
        continue;
      }
    }

    console.log("Found owned NFTs:", ownedNFTs);

    const rarityDistribution: { [key: string]: number } = {};
    for (const tokenId of ownedNFTs) {
      try {
        const metadataUrl = `${BASE_URL}/metadata/${tokenId}.json`;
        console.log(`Fetching metadata from: ${metadataUrl}`);
        const response = await fetch(metadataUrl);
        const metadata = await response.json();
        console.log(`Metadata for token ${tokenId}:`, metadata);
        
        const rarity = metadata.attributes.find((attr: any) => attr.trait_type === "Rarity")?.value;
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