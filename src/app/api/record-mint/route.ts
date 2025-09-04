import { NextResponse } from "next/server";
import { Pool } from "pg";
import { ethers } from "ethers";

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";

const contractABI = [
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
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
];

export async function POST(request: Request) {
  const { quizId, walletAddress, txHash, contractAddress } = await request.json();

  if (!quizId || !walletAddress || !txHash || !contractAddress) {
    return NextResponse.json({ success: false, error: "Missing required fields: quizId, walletAddress, txHash and contractAddress are required." }, { status: 400 });
  }

  if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return NextResponse.json({ success: false, error: "Invalid contract address" }, { status: 400 });
  }

  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contractInterface = new ethers.Interface(contractABI as any);

  try {
    // 1. Fetch transaction details from the blockchain
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return NextResponse.json({ success: false, error: "Transaction not found on the blockchain." }, { status: 404 });
    }
    if (receipt.status !== 1) {
      return NextResponse.json({ success: false, error: "Transaction failed." }, { status: 400 });
    }

    // 2. Verify the transaction details
    const isToContract = tx.to?.toLowerCase() === contractAddress.toLowerCase();
    const isFromUser = tx.from.toLowerCase() === walletAddress.toLowerCase();

    if (!isToContract || !isFromUser) {
      return NextResponse.json({ success: false, error: "Transaction mismatch: 'to' or 'from' address is incorrect." }, { status: 403 });
    }

    // 3. Decode transaction data to verify function and arguments
    const decodedTx = contractInterface.parseTransaction({ data: tx.data });
    if (decodedTx?.name !== 'mint' || decodedTx?.args[0] !== quizId) {
      return NextResponse.json({ success: false, error: "Transaction data mismatch: Incorrect function or quizId." }, { status: 403 });
    }

    // 4. Extract tokenId and timestamp from the receipt
    let tokenId: string | null = null;
    for (const log of receipt.logs) {
      try {
        const decodedLog = contractInterface.parseLog(log);
        if (decodedLog?.name === "Transfer" && decodedLog.args.to.toLowerCase() === walletAddress.toLowerCase()) {
          tokenId = decodedLog.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Ignore logs that don't match the ABI
      }
    }

    if (!tokenId) {
      return NextResponse.json({ success: false, error: "Could not determine tokenId from transaction logs." }, { status: 500 });
    }
    
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
        return NextResponse.json({ success: false, error: "Could not retrieve block data for the transaction." }, { status: 500 });
    }
    const mintTimestamp = new Date(block.timestamp * 1000);

    // 5. Update the database
    await pool.query(
      `UPDATE quiz_submissions 
       SET nft_minted = true, mint_timestamp = $1, token_id = $2, tx_hash = $3
       WHERE quiz_id = $4 AND wallet_address = $5`,
      [mintTimestamp, tokenId, txHash, quizId, walletAddress]
    );

    return NextResponse.json({ success: true, message: "NFT mint recorded successfully." });

  } catch (error) {
    console.error("Error recording mint:", error);
    return NextResponse.json({ success: false, error: "Failed to process request." }, { status: 500 });
  } finally {
    await pool.end();
  }
}