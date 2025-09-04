import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { Pool } from "pg";
import { generateMintSignature } from "@/lib/sign";

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";

export async function POST(request: Request) {
  const { walletAddress, quizId, contractAddress } = await request.json();

  if (!walletAddress || !quizId || !contractAddress) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return NextResponse.json({ success: false, error: "Invalid contract address" }, { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const quizNFTContract = new ethers.Contract(contractAddress, [
    "function getNonce(address user) public view returns (uint256)",
  ], provider);

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Step 1: Verify quiz completion and eligibility
    const quizQuery = await pool.query("SELECT quiz_data FROM quizzes WHERE id = $1", [quizId]);
    if (quizQuery.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }
    const perfectScore = quizQuery.rows[0].quiz_data.quiz.length;

    const submissionQuery = await pool.query(
      "SELECT score, nft_minted FROM quiz_submissions WHERE quiz_id = $1 AND wallet_address = $2 AND score = $3 ORDER BY submitted_at DESC LIMIT 1",
      [quizId, walletAddress, perfectScore]
    );

    if (submissionQuery.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not eligible to mint: No submission found." }, { status: 403 });
    }

    const submission = submissionQuery.rows[0];
    if (submission.score !== perfectScore) {
      return NextResponse.json({ success: false, error: `Not eligible to mint: A perfect score of ${perfectScore} is required.` }, { status: 403 });
    }

    if (submission.nft_minted) {
      return NextResponse.json({ success: false, error: "You have already minted this NFT." }, { status: 409 });
    }

    // Step 2: If eligible, proceed with signature generation
    const nonce = await quizNFTContract.getNonce(walletAddress);
    const signResult = await generateMintSignature(walletAddress, quizId, nonce.toString(), contractAddress);
    
    if (!signResult.success) {
      return NextResponse.json({ success: false, error: "Failed to generate signature" }, { status: 500 });
    }

    return NextResponse.json({ success: true, signature: signResult.signature, nonce: nonce.toString() });
  } catch (error) {
    console.error("Error generating mint signature:", error);
    return NextResponse.json({ success: false, error: "Failed to generate mint signature" }, { status: 500 });
  } finally {
    await pool.end();
  }
}