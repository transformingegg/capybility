import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Pool } from 'pg';

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";
const BARABOTS_CONTRACT_ADDRESS = process.env.BARABOTS_CONTRACT!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const requestedTokenId = searchParams.get('tokenId');

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

      // Get user's owned tokens
      const ownedTokens = await barabotsContract.getOwnedTokens(walletAddress);

      if (ownedTokens.length === 0) {
        return NextResponse.json({ error: 'No Barabots owned by this wallet' }, { status: 404 });
      }

      // Get the requested token ID or default to first one
      let tokenId;
      if (requestedTokenId) {
        // Check if user owns this token
        const ownsToken = ownedTokens.some((t: bigint) => t.toString() === requestedTokenId);
        if (!ownsToken) {
          return NextResponse.json({ error: 'You do not own this Barabot' }, { status: 403 });
        }
        tokenId = requestedTokenId;
      } else {
        tokenId = ownedTokens[0].toString();
      }

      // Fetch metadata from our own endpoint
      let metadata = null;
      let category = null;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const metadataResponse = await fetch(`${baseUrl}/barabotsmetadata/${tokenId}`);
        
        if (metadataResponse.ok) {
          metadata = await metadataResponse.json();

          // Extract category from metadata attributes
          if (metadata?.attributes) {
            const categoryAttr = metadata.attributes.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Category');
            category = categoryAttr?.value || null;
          }
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }

      const transactions = await getRecentTransactions(walletAddress, category, pool);

      return NextResponse.json({
        tokenId: tokenId.toString(),
        category,
        metadata,
        transactions
      });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching Barabot data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getRecentTransactions(walletAddress: string, nftCategory: string | null, pool: Pool) {
  try {
    // Using Blockscout API for EDU Chain mainnet
    const apiUrl = `https://educhain.blockscout.com/api/v2/addresses/${walletAddress}/transactions`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items) return [];

    // Get top 20 transactions
    const recentTransactions = data.items.slice(0, 20);

    // Process each transaction to determine if it's selectable
    const processedTransactions = await Promise.all(
      recentTransactions.map(async (tx: { hash: string; timestamp: string; from: { hash: string }; to?: { hash?: string; name?: string }; value: string }) => {
        const contractAddress = tx.to?.hash?.toLowerCase();
        
        if (!contractAddress) {
          return {
            hash: tx.hash,
            timestamp: tx.timestamp,
            from: tx.from.hash,
            to: tx.to?.hash || null,
            value: tx.value,
            contractAddress: contractAddress || null,
            category: null,
            notes: null,
            selectable: false,
            used: false
          };
        }

        // Check if contract is categorized
        const categoryResult = await pool.query(`
          SELECT category, notes FROM barabots_contract_categories
          WHERE contract_address = $1
        `, [contractAddress]);

        let category: string | null = null;
        let selectable = false;

        if (categoryResult.rows.length > 0) {
          category = categoryResult.rows[0].category;
          // Selectable if category matches NFT category and is not 'unknown'
          selectable = category !== 'unknown' && (!nftCategory || category === nftCategory);
        } else {
          // Contract not in database - add it as unassigned (NULL) with contract name from Blockscout
          try {
            const contractName = tx.to?.name || 'Unknown Contract';
            await pool.query(`
              INSERT INTO barabots_contract_categories (contract_address, category, notes)
              VALUES ($1, $2, $3)
              ON CONFLICT (contract_address) DO NOTHING
            `, [contractAddress, null, contractName]);
            category = null;
            selectable = false;
          } catch (insertError) {
            console.error('Error inserting unassigned contract:', insertError);
          }
        }

        // Check if transaction has been used for pairing
        const usedCheck = await pool.query(`
          SELECT id FROM barabots_metadata_updates
          WHERE transaction_hash = $1
        `, [tx.hash]);
        const used = usedCheck.rows.length > 0;

        return {
          hash: tx.hash,
          timestamp: tx.timestamp,
          from: tx.from.hash,
          to: contractAddress,
          value: tx.value,
          contractAddress: contractAddress,
          category: null, // No longer used for payment-based assembly
          notes: tx.to?.name || 'Unknown Contract',
          selectable: selectable && !used, // Selectable if exactly 1 EDU and not used
          used: used
        };
      })
    );

    // Filter to only return transactions that match the NFT category
    // This ensures the list only shows relevant transactions for pairing
    const filteredTransactions = processedTransactions.filter(tx => {
      // If NFT has no category yet, show all transactions (shouldn't happen but safe)
      if (!nftCategory) return true;

      // Only show transactions that exactly match the category
      return tx.category === nftCategory;
    });

    return filteredTransactions;

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}