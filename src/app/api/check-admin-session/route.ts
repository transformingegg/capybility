import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    const isAuthenticated = !!(session && session.isAdmin);
    
    return NextResponse.json({
      isAuthenticated
    });
  } catch (error) {
    console.error('Error checking admin session:', error);
    return NextResponse.json({
      isAuthenticated: false
    });
  }
}