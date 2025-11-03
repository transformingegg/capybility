import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Pool } from 'pg';
import { generateBarabotsPairSignature } from '@/lib/barabots-sign';

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";
const BARABOTS_CONTRACT_ADDRESS = process.env.BARABOTS_CONTRACT!;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenId, transactionHash, userSignature } = await request.json();

    if (!walletAddress || !tokenId || !transactionHash || !userSignature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Verify the user signed the assembly request
    const assemblyMessage = `Assemble Barabot #${tokenId} with transaction ${transactionHash}`;
    let recoveredAddress: string;
    
    try {
      recoveredAddress = ethers.verifyMessage(assemblyMessage, userSignature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json({ 
          error: 'Signature verification failed. Please sign with the correct wallet.' 
        }, { status: 401 });
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json({ 
        error: 'Invalid signature format' 
      }, { status: 401 });
    }

    // Step 2: Verify ownership of the NFT on-chain
    const ownsToken = await verifyNFTOwnership(walletAddress, tokenId);
    if (!ownsToken) {
      return NextResponse.json({ 
        error: 'You do not own this Barabot' 
      }, { status: 403 });
    }

    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
      // Step 3: Verify the transaction exists and belongs to the user
      const txData = await verifyTransaction(walletAddress, transactionHash);
      if (!txData) {
        return NextResponse.json({ error: 'Invalid transaction or not owned by wallet' }, { status: 400 });
      }

      // Step 4: Get NFT category from metadata
      const nftCategory = await getNFTCategory(tokenId);
      if (!nftCategory) {
        return NextResponse.json({ error: 'Could not determine NFT category' }, { status: 400 });
      }

      // Step 5: Verify transaction contract matches NFT category
      const contractCategory = await getContractCategory(txData.contractAddress, pool);
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

      // Step 6: Check if this pairing already exists
      const existingPairing = await pool.query(`
        SELECT * FROM barabots_metadata_updates
        WHERE token_id = $1 AND transaction_hash = $2
      `, [tokenId, transactionHash]);

      if (existingPairing.rows.length > 0) {
        return NextResponse.json({ error: 'This transaction is already paired with this NFT' }, { status: 400 });
      }

      // Step 7: Generate backend signature for the pairing
      const backendSignature = await generateBarabotsPairSignature(walletAddress, tokenId, transactionHash);

      // Step 8: Store the pairing in database
      await pool.query(`
        INSERT INTO barabots_metadata_updates (token_id, wallet_address, transaction_hash, contract_address, category, signature, paired_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [tokenId, walletAddress.toLowerCase(), transactionHash, txData.contractAddress, nftCategory, backendSignature]);

      // Step 9: Create the evolved metadata
      let newImageUrl = '';
      try {
        const metadataResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-barabots-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            walletAddress,
            category: nftCategory,
            type: 'evolved'
          })
        });

        if (metadataResponse.ok) {
          const metadataResult = await metadataResponse.json();
          newImageUrl = metadataResult.image || `/barabotsmetadata/img/${tokenId}`;
        }
      } catch (metadataError) {
        console.error('Error creating evolved metadata:', metadataError);
        // Use default image path
        newImageUrl = `/barabotsmetadata/img/${tokenId}`;
      }

      // Step 10: Fetch the newly created metadata to get rarity
      let rarity = 'Barabot';
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const metadataFetchResponse = await fetch(`${baseUrl}/barabotsmetadata/${tokenId}?t=${Date.now()}`);
        
        if (metadataFetchResponse.ok) {
          const metadata = await metadataFetchResponse.json();
          const rarityAttr = metadata.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Rarity');
          if (rarityAttr) {
            rarity = rarityAttr.value;
          }
        }
      } catch (error) {
        console.error('Error fetching rarity:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Barabot assembled successfully!',
        signature: backendSignature,
        newImageUrl,
        rarity
      });

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error assembling Barabot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify that the wallet owns the NFT
async function verifyNFTOwnership(walletAddress: string, tokenId: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const barabotsContract = new ethers.Contract(
      BARABOTS_CONTRACT_ADDRESS,
      ["function ownerOf(uint256 tokenId) view returns (address)"],
      provider
    );

    const owner = await barabotsContract.ownerOf(tokenId);
    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    return false;
  }
}

async function verifyTransaction(walletAddress: string, transactionHash: string): Promise<{contractAddress: string} | null> {
  try {
    console.log('Verifying transaction:', transactionHash, 'for wallet:', walletAddress);
    
    // Try Blockscout API first
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

async function getContractCategory(contractAddress: string, pool: Pool): Promise<string | null> {
  try {
    const result = await pool.query(`
      SELECT category FROM barabots_contract_categories
      WHERE contract_address = $1
    `, [contractAddress.toLowerCase()]);

    return result.rows.length > 0 ? result.rows[0].category : null;
  } catch (error) {
    console.error('Error getting contract category:', error);
    return null;
  }
}
