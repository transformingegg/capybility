import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Pool } from 'pg';

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";
const BARABOTS_CONTRACT_ADDRESS = process.env.BARABOTS_CONTRACT!;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenId, transactionHash } = await request.json();

    if (!walletAddress || !tokenId || !transactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Verify ownership of the NFT on-chain
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
      // Step 2: Verify the assembly transaction (user paid assembly fee)
      const assemblyTx = await verifyAssemblyTransaction(walletAddress, tokenId, transactionHash);
      if (!assemblyTx) {
        return NextResponse.json({
          error: 'Invalid assembly transaction. Please ensure you paid the exact assembly fee to the contract.'
        }, { status: 400 });
      }

      // Step 3: Verify the token is now assembled on-chain
      const isAssembled = await verifyTokenAssembled(tokenId);
      if (!isAssembled) {
        return NextResponse.json({
          error: 'Token assembly not confirmed on-chain. Please wait for transaction confirmation.'
        }, { status: 400 });
      }

      // Step 4: Get NFT category from metadata
      const nftCategory = await getNFTCategory(tokenId);
      if (!nftCategory) {
        return NextResponse.json({ error: 'Could not determine NFT category' }, { status: 400 });
      }

      // Step 5: Check if this pairing already exists (prevent duplicate processing)
      const existingPairing = await pool.query(`
        SELECT * FROM barabots_metadata_updates
        WHERE token_id = $1
      `, [tokenId]);

      if (existingPairing.rows.length > 0) {
        return NextResponse.json({ error: 'This Barabot has already been assembled' }, { status: 400 });
      }

      // Step 6: Store the assembly in database (no signature needed)
      await pool.query(`
        INSERT INTO barabots_metadata_updates (token_id, wallet_address, transaction_hash, contract_address, category, paired_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [tokenId, walletAddress.toLowerCase(), transactionHash, BARABOTS_CONTRACT_ADDRESS, nftCategory]);

      // Step 7: Create the evolved metadata
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

      // Step 8: Fetch the newly created metadata to get rarity
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

async function verifyAssemblyTransaction(walletAddress: string, tokenId: string, transactionHash: string): Promise<boolean> {
  try {
    console.log('Verifying assembly transaction:', transactionHash, 'for wallet:', walletAddress, 'tokenId:', tokenId);
    
    // Try Blockscout API first
    try {
      const blockscoutUrl = `https://educhain.blockscout.com/api/v2/transactions/${transactionHash}`;
      const response = await fetch(blockscoutUrl);
      
      if (response.ok) {
        const txData = await response.json();
        console.log('Assembly transaction data from Blockscout:', txData);
        
        const txFrom = txData.from?.hash?.toLowerCase();
        const txTo = txData.to?.hash?.toLowerCase();
        const txValue = txData.value; // This is in wei as string
        
        // Verify transaction basics
        if (txFrom !== walletAddress.toLowerCase()) {
          console.log('Transaction sender does not match wallet');
          return false;
        }
        
        if (txTo !== BARABOTS_CONTRACT_ADDRESS.toLowerCase()) {
          console.log('Transaction not sent to Barabots contract');
          return false;
        }
        
        // Get the assembly price from contract
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(
          BARABOTS_CONTRACT_ADDRESS,
          ["function getAssemblyPrice() view returns (uint256)"],
          provider
        );
        
        const assemblyPrice = await contract.getAssemblyPrice();
        console.log('Required assembly price:', assemblyPrice.toString(), 'Transaction value:', txValue);
        
        // Verify exact payment amount
        if (txValue !== assemblyPrice.toString()) {
          console.log('Transaction value does not match assembly price');
          return false;
        }
        
        // Check transaction status
        if (txData.status !== 'ok') {
          console.log('Transaction failed');
          return false;
        }
        
        console.log('Assembly transaction verified successfully');
        return true;
      }
    } catch (blockscoutError) {
      console.log('Blockscout lookup failed, trying RPC:', blockscoutError);
    }
    
    // Fallback to RPC provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tx = await provider.getTransaction(transactionHash);
    const txReceipt = await provider.getTransactionReceipt(transactionHash);

    console.log('Assembly transaction data from RPC:', tx);
    console.log('Transaction receipt:', txReceipt);

    if (!tx || !txReceipt) {
      console.log('Transaction or receipt not found');
      return false;
    }

    // Verify transaction basics
    if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log('Transaction sender does not match wallet');
      return false;
    }
    
    if (tx.to?.toLowerCase() !== BARABOTS_CONTRACT_ADDRESS.toLowerCase()) {
      console.log('Transaction not sent to Barabots contract');
      return false;
    }
    
    // Get the assembly price from contract
    const contract = new ethers.Contract(
      BARABOTS_CONTRACT_ADDRESS,
      ["function getAssemblyPrice() view returns (uint256)"],
      provider
    );
    
    const assemblyPrice = await contract.getAssemblyPrice();
    console.log('Required assembly price:', assemblyPrice.toString(), 'Transaction value:', tx.value.toString());
    
    // Verify exact payment amount
    if (tx.value.toString() !== assemblyPrice.toString()) {
      console.log('Transaction value does not match assembly price');
      return false;
    }
    
    // Check transaction was successful
    if (txReceipt.status !== 1) {
      console.log('Transaction failed');
      return false;
    }

    console.log('Assembly transaction verified successfully via RPC');
    return true;
  } catch (error) {
    console.error('Error verifying assembly transaction:', error);
    return false;
  }
}

async function verifyTokenAssembled(tokenId: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      BARABOTS_CONTRACT_ADDRESS,
      ["function isAssembled(uint256 tokenId) view returns (bool)"],
      provider
    );

    const assembled = await contract.isAssembled(tokenId);
    console.log('Token', tokenId, 'assembled status:', assembled);
    
    return assembled;
  } catch (error) {
    console.error('Error checking assembly status:', error);
    return false;
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
