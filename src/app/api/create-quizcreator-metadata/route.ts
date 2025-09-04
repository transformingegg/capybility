import { NextResponse } from "next/server";
import { put, head } from '@vercel/blob';
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
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "quizId", "type": "string" }
    ],
    "name": "QuizCreated",
    "type": "event"
  }
];

export async function POST(request: Request) {
  try {
    const { tokenId, quizId, walletAddress, txHash, contractAddress } = await request.json();

    if (!tokenId || !quizId || !walletAddress || !txHash || !contractAddress) {
      return NextResponse.json({ success: false, error: "Missing required fields: tokenId, quizId, walletAddress, txHash, contractAddress" }, { status: 400 });
    }

    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ success: false, error: "Invalid contract address" }, { status: 400 });
    }

    // On-chain verification
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contractInterface = new ethers.Interface(contractABI as any);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!tx || !receipt) {
      return NextResponse.json({ success: false, error: "Transaction not found on the blockchain." }, { status: 404 });
    }
    if (receipt.status !== 1) {
      return NextResponse.json({ success: false, error: "Transaction failed." }, { status: 400 });
    }
    const isToContract = tx.to?.toLowerCase() === contractAddress.toLowerCase();
    const isFromUser = tx.from.toLowerCase() === walletAddress.toLowerCase();
    if (!isToContract || !isFromUser) {
      return NextResponse.json({ success: false, error: "Transaction mismatch: 'to' or 'from' address is incorrect." }, { status: 403 });
    }
    // Decode transaction data to verify function and arguments
    console.log("Raw tx.data:", tx.data);
    let decodedTx = null;
    try {
      decodedTx = contractInterface.parseTransaction({ data: tx.data });
    } catch (err) {
      console.error("Failed to parse transaction data:", err);
    }
    const validFunction = decodedTx?.name === 'mint' || decodedTx?.name === 'mintWithDiscount';
    if (!validFunction || decodedTx?.args[0] !== quizId) {
      console.error("Decoded transaction:", decodedTx);
      return NextResponse.json({ success: false, error: "Transaction data mismatch: Incorrect function or quizId." }, { status: 403 });
    }
    // Parse logs for QuizCreated event and tokenId
    let foundTokenId: string | null = null;
    for (const log of receipt.logs) {
      try {
        const decodedLog = contractInterface.parseLog(log);
        if (decodedLog?.name === "QuizCreated" && decodedLog.args.creator.toLowerCase() === walletAddress.toLowerCase()) {
          foundTokenId = decodedLog.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // Ignore logs that don't match the ABI
      }
    }
    if (!foundTokenId || foundTokenId !== tokenId) {
      return NextResponse.json({ success: false, error: "Could not verify tokenId from transaction logs." }, { status: 403 });
    }

    // Check if metadata already exists
    const metadataPath = `quizcreatormetadata/${tokenId}.json`;
    let alreadyExists = false;
    let existingUrl = "";
    try {
      const headResult = await head(metadataPath);
      if (headResult && headResult.url) {
        alreadyExists = true;
        existingUrl = headResult.url;
      }
    } catch (e) {
      // Not found, proceed to create
    }
    if (alreadyExists) {
      return NextResponse.json({ success: true, metadataUrl: existingUrl, alreadyExists: true });
    }
    // Create metadata
    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quizcreatormetadata/img/static`;
    const metadata = {
      name: "Quiz Creator NFT",
      description: "This NFT represents ownership of a quiz created on CapybilIty",
      image: imageUrl,
      attributes: [
        { trait_type: "Creator", value: walletAddress },
        { trait_type: "Quiz ID", value: quizId },
        { trait_type: "Creation Date", value: new Date().toISOString() },
      ],
    };
    const metadataBlob = await put(
      metadataPath,
      JSON.stringify(metadata),
      { contentType: 'application/json', access: 'public' }
    );
    return NextResponse.json({ success: true, metadataUrl: metadataBlob.url });
  } catch (error) {
    console.error("[Metadata API] General error creating metadata:", error);
    return NextResponse.json({ success: false, error: "Failed to create metadata: " + (error as Error).message }, { status: 500 });
  }
}