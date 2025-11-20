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
        "function getOwnedTokens(address owner) public view returns (uint256[])",
      ], provider);

      // Force fresh call by adding a dummy parameter to avoid any potential caching
      const ownedTokens = await barabotsContract.getOwnedTokens(walletAddress);
      console.log(`Wallet ${walletAddress} owns tokens:`, ownedTokens.map((t: bigint) => t.toString()));

      if (ownedTokens.length === 0) {
        console.log('No tokens owned');
        return NextResponse.json({ barabots: [] });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Fetch metadata for all owned tokens
      const barabots = await Promise.all(
        ownedTokens.map(async (tokenId: bigint) => {
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
