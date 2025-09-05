import { NextResponse } from "next/server";
import { Pool } from "pg";
import { ethers } from "ethers";

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";

const contractABI = [
  // Mint functions
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
    "inputs": [
      { "internalType": "string", "name": "quizId", "type": "string" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "mintWithDiscount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "quizId", "type": "string" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "mintWithToken",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Transfer event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  // QuizCompleted event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "quizId", "type": "string" }
    ],
    "name": "QuizCompleted",
    "type": "event"
  }
];

export async function POST(request: Request) {
  const { quizId, walletAddress, txHash, contractAddress } = await request.json();

  console.log("[record-mint] Incoming payload:", { quizId, walletAddress, txHash, contractAddress });

  if (!quizId || !walletAddress || !txHash || !contractAddress) {
    console.error("[record-mint] Missing required fields", { quizId, walletAddress, txHash, contractAddress });
    return NextResponse.json({ success: false, error: "Missing required fields: quizId, walletAddress, txHash and contractAddress are required." }, { status: 400 });
  }

  if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error("[record-mint] Invalid contract address:", contractAddress);
    return NextResponse.json({ success: false, error: "Invalid contract address" }, { status: 400 });
  }

  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contractInterface = new ethers.Interface(contractABI);

  try {
    // 1. Fetch transaction details from the blockchain
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log("[record-mint] Blockchain tx:", tx);
    console.log("[record-mint] Blockchain receipt:", receipt);

    if (!tx || !receipt) {
      console.error("[record-mint] Transaction not found on the blockchain.", { tx, receipt });
      return NextResponse.json({ success: false, error: "Transaction not found on the blockchain." }, { status: 404 });
    }
    if (receipt.status !== 1) {
      console.error("[record-mint] Transaction failed. Receipt:", receipt);
      return NextResponse.json({ success: false, error: "Transaction failed." }, { status: 400 });
    }

    // 2. Verify the transaction details
    const isToContract = tx.to?.toLowerCase() === contractAddress.toLowerCase();
    const isFromUser = tx.from.toLowerCase() === walletAddress.toLowerCase();
    console.log("[record-mint] isToContract:", isToContract, "isFromUser:", isFromUser);
    if (!isToContract || !isFromUser) {
      console.error("[record-mint] Transaction mismatch: 'to' or 'from' address is incorrect.", { txTo: tx.to, contractAddress, txFrom: tx.from, walletAddress });
      return NextResponse.json({ success: false, error: "Transaction mismatch: 'to' or 'from' address is incorrect." }, { status: 403 });
    }

    // 3. Decode transaction data to verify function and arguments
    let decodedTx = null;
    for (const fn of ["mint", "mintWithDiscount", "mintWithToken"]) {
      try {
        decodedTx = contractInterface.decodeFunctionData(fn, tx.data);
        if (decodedTx) {
          break;
        }
      } catch {
        // ignore
      }
    }
    console.log("[record-mint] Decoded tx:", decodedTx);
    if (!decodedTx || decodedTx.quizId !== quizId) {
      console.error("[record-mint] Transaction data mismatch: Incorrect function or quizId.", { decodedTx, quizId });
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
      } catch {
        // Ignore logs that don't match the ABI
      }
    }
    console.log("[record-mint] Extracted tokenId:", tokenId);

    if (!tokenId) {
      console.error("[record-mint] Could not determine tokenId from transaction logs.");
      return NextResponse.json({ success: false, error: "Could not determine tokenId from transaction logs." }, { status: 500 });
    }
    
    const block = await provider.getBlock(receipt.blockNumber);
    console.log("[record-mint] Block:", block);
    if (!block) {
        console.error("[record-mint] Could not retrieve block data for the transaction.");
        return NextResponse.json({ success: false, error: "Could not retrieve block data for the transaction." }, { status: 500 });
    }
    const mintTimestamp = new Date(block.timestamp * 1000);
    console.log("[record-mint] Mint timestamp:", mintTimestamp);

    // 5. Update the database
    const dbResult = await pool.query(
      `UPDATE quiz_submissions 
       SET nft_minted = true, mint_timestamp = $1, token_id = $2
       WHERE quiz_id = $3 AND wallet_address = $4`,
      [mintTimestamp, tokenId, quizId, walletAddress]
    );
    console.log("[record-mint] DB update result:", dbResult);

    return NextResponse.json({ success: true, message: "NFT mint recorded successfully." });

  } catch (error) {
    console.error("[record-mint] Error recording mint:", error);
    return NextResponse.json({ success: false, error: "Failed to process request.", details: error instanceof Error ? error.message : error }, { status: 500 });
  } finally {
    await pool.end();
  }
}