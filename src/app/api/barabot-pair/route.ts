import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Pool } from 'pg';
import { generateBarabotsPairSignature } from '@/lib/barabots-sign';

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenId, transactionHash } = await request.json();

    if (!walletAddress || !tokenId || !transactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Verify the transaction exists and belongs to the user
      const txData = await verifyTransaction(walletAddress, transactionHash);
      if (!txData) {
        return NextResponse.json({ error: 'Invalid transaction or not owned by wallet' }, { status: 400 });
      }

      // Get NFT category from metadata
      const nftCategory = await getNFTCategory(tokenId);
      if (!nftCategory) {
        return NextResponse.json({ error: 'Could not determine NFT category' }, { status: 400 });
      }

      // Verify transaction contract matches NFT category
      const contractCategory = await getContractCategory(txData.contractAddress);
      if (!contractCategory) {
        return NextResponse.json({
          error: 'This contract has not been categorized yet. Please contact an admin to categorize this contract.'
        }, { status: 400 });
      }

      if (contractCategory !== nftCategory) {
        return NextResponse.json({
          error: `Transaction contract category (${contractCategory}) does not match NFT category (${nftCategory})`
        }, { status: 400 });
      }

      // Check if this pairing already exists
      const existingPairing = await pool.query(`
        SELECT * FROM barabots_metadata_updates
        WHERE token_id = $1 AND transaction_hash = $2
      `, [tokenId, transactionHash]);

      if (existingPairing.rows.length > 0) {
        return NextResponse.json({ error: 'This transaction is already paired with this NFT' }, { status: 400 });
      }

      // Generate signature for the pairing
      const signature = await generateBarabotsPairSignature(walletAddress, tokenId, transactionHash);

      // Store the pairing in database
      await pool.query(`
        INSERT INTO barabots_metadata_updates (token_id, wallet_address, transaction_hash, contract_address, category, signature, paired_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [tokenId, walletAddress.toLowerCase(), transactionHash, txData.contractAddress, nftCategory, signature]);

      // Create the evolved metadata now that pairing is successful
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-barabots-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            walletAddress,
            category: nftCategory,
            type: 'evolved'
          })
        });
      } catch (metadataError) {
        console.error('Error creating evolved metadata:', metadataError);
        // Don't fail the pairing if metadata creation fails
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction paired successfully! Your Barabot has evolved.',
        signature
      });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error pairing transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function verifyTransaction(walletAddress: string, transactionHash: string): Promise<{contractAddress: string} | null> {
  try {
    console.log('Verifying transaction:', transactionHash, 'for wallet:', walletAddress);
    
    // Try Blockscout API first (same source as transaction list)
    try {
      const blockscoutUrl = `https://educhain.blockscout.com/api/v2/transactions/${transactionHash}`;
      const response = await fetch(blockscoutUrl);
      
      if (response.ok) {
        const txData = await response.json();
        console.log('Transaction data from Blockscout:', txData);
        
        const txFrom = txData.from?.hash?.toLowerCase();
        const txTo = txData.to?.hash?.toLowerCase();
        
        if (txFrom !== walletAddress.toLowerCase()) {
          console.log('Transaction sender does not match wallet. From:', txFrom, 'Expected:', walletAddress.toLowerCase());
          return null;
        }
        
        console.log('Contract address:', txTo);
        return {
          contractAddress: txTo || ''
        };
      }
    } catch (blockscoutError) {
      console.log('Blockscout lookup failed, trying RPC:', blockscoutError);
    }
    
    // Fallback to RPC provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tx = await provider.getTransaction(transactionHash);

    console.log('Transaction data from RPC:', tx);

    if (!tx) {
      console.log('Transaction not found in RPC');
      return null;
    }

    console.log('Transaction from:', tx.from, 'Expected:', walletAddress);

    // Check if the transaction is from the wallet address
    if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log('Transaction sender does not match wallet');
      return null;
    }

    const contractAddress = tx.to?.toLowerCase() || '';
    console.log('Contract address:', contractAddress);

    return {
      contractAddress: contractAddress
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return null;
  }
}

async function getNFTCategory(tokenId: string): Promise<string | null> {
  try {
    // Use our own metadata endpoint instead of tokenURI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const metadataResponse = await fetch(`${baseUrl}/barabotsmetadata/${tokenId}`);
    
    if (!metadataResponse.ok) {
      console.error('Metadata not found for token:', tokenId);
      return null;
    }
    
    const metadata = await metadataResponse.json();

    if (metadata?.attributes) {
      const categoryAttr = metadata.attributes.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Category');
      return categoryAttr?.value || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting NFT category:', error);
    return null;
  }
}

async function getContractCategory(contractAddress: string): Promise<string | null> {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(`
      SELECT category FROM barabots_contract_categories
      WHERE contract_address = $1
    `, [contractAddress.toLowerCase()]);

    return result.rows.length > 0 ? result.rows[0].category : null;
  } finally {
    await pool.end();
  }
}