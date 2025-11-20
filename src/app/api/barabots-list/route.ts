import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Pool } from 'pg';

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";
const BARABOTS_CONTRACT_ADDRESS = process.env.BARABOTS_CONTRACT!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const barabotsContract = new ethers.Contract(BARABOTS_CONTRACT_ADDRESS, [
        "function balanceOf(address owner) public view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
        "function ownerOf(uint256 tokenId) public view returns (address)"
      ], provider);

      // Get balance first
      const balance = await barabotsContract.balanceOf(walletAddress);
      console.log(`Wallet ${walletAddress} balance:`, balance.toString());

      // Get all owned tokens using tokenOfOwnerByIndex
      const ownedTokens: bigint[] = [];
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await barabotsContract.tokenOfOwnerByIndex(walletAddress, i);
          ownedTokens.push(tokenId);
        } catch (error) {
          console.log(`Skipping index ${i} - likely burned token or enumeration gap:`, error instanceof Error ? error.message : String(error));
          // Continue to next index - some contracts have gaps in enumeration
        }
      }

      console.log(`Wallet ${walletAddress} owns tokens via enumeration:`, ownedTokens.map((t: bigint) => t.toString()));

      // Double-check ownership by calling ownerOf for each token
      const verifiedTokens: bigint[] = [];
      for (const tokenId of ownedTokens) {
        try {
          const owner = await barabotsContract.ownerOf(tokenId);
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            verifiedTokens.push(tokenId);
          } else {
            console.log(`Token ${tokenId} is actually owned by ${owner}, not ${walletAddress}`);
          }
        } catch (error) {
          console.error(`Error checking ownership of token ${tokenId}:`, error);
        }
      }

      console.log(`Verified owned tokens:`, verifiedTokens.map((t: bigint) => t.toString()));
      const finalTokens = verifiedTokens;

      if (finalTokens.length === 0) {
        console.log('No verified tokens owned');
        return NextResponse.json({ barabots: [] });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Fetch metadata for all owned tokens
      const barabots = await Promise.all(
        finalTokens.map(async (tokenId: bigint) => {
          try {
            const metadataResponse = await fetch(`${baseUrl}/barabotsmetadata/${tokenId}`);
            
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              
              const categoryAttr = metadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Category');
              const stateAttr = metadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'State');
              const rarityAttr = metadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Rarity');
              
              return {
                tokenId: tokenId.toString(),
                category: categoryAttr?.value || 'Unknown',
                state: stateAttr?.value || 'Crate',
                rarity: rarityAttr?.value || null
              };
            }
            
            return {
              tokenId: tokenId.toString(),
              category: 'Unknown',
              state: 'Crate',
              rarity: null
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            return {
              tokenId: tokenId.toString(),
              category: 'Unknown',
              state: 'Crate',
              rarity: null
            };
          }
        })
      );

      return NextResponse.json({ barabots });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching Barabots list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
