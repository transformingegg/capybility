import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { Pool } from "pg";
import { generateBarabotsMintSignature } from "@/lib/barabots-sign";

const RPC_URL = "https://rpc.edu-chain.raas.gelato.cloud/";
const BARABOTS_CONTRACT_ADDRESS = process.env.BARABOTS_CONTRACT!;

export async function POST(request: Request) {
  const { walletAddress, mintType, category } = await request.json();

  if (!walletAddress || !mintType) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!["free", "discount", "full"].includes(mintType)) {
    return NextResponse.json({ success: false, error: "Invalid mint type" }, { status: 400 });
  }

  // For free/discount mints, category is required
  if ((mintType === "free" || mintType === "discount") && !category) {
    return NextResponse.json({ success: false, error: "Category required for whitelist mints" }, { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const barabotsContract = new ethers.Contract(BARABOTS_CONTRACT_ADDRESS, [
    "function getNonce(address user) public view returns (uint256)",
  ], provider);

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    // Get nonce from contract
    const nonce = await barabotsContract.getNonce(walletAddress);

    // Check whitelist status based on mint type
    if (mintType === "free") {
      const wlQuery = await pool.query(
        "SELECT id FROM barabots_free_wl WHERE wallet_address = $1 AND used = FALSE AND (category = $2 OR category IS NULL)",
        [walletAddress.toLowerCase(), category]
      );

      if (wlQuery.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Wallet not eligible for free mint with this category"
        }, { status: 403 });
      }
    }

    if (mintType === "discount") {
      const wlQuery = await pool.query(
        "SELECT id FROM barabots_discount_wl WHERE wallet_address = $1 AND used = FALSE AND (category = $2 OR category IS NULL)",
        [walletAddress.toLowerCase(), category]
      );

      if (wlQuery.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Wallet not eligible for discount mint with this category"
        }, { status: 403 });
      }
    }

    // Generate signature for minting
    const signResult = await generateBarabotsMintSignature(
      walletAddress,
      mintType.toUpperCase() + "_MINT",
      nonce.toString(),
      BARABOTS_CONTRACT_ADDRESS
    );

    if (!signResult.success) {
      return NextResponse.json({
        success: false,
        error: "Failed to generate signature"
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signature: signResult.signature,
      contractAddress: BARABOTS_CONTRACT_ADDRESS,
      mintType,
      nonce: nonce.toString()
    });

  } catch (error) {
    console.error('Error in barabots mint:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}