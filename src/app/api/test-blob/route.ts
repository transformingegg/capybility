import { NextResponse } from "next/server";
import { put, list } from '@vercel/blob';

export const runtime = 'edge';

export async function GET() {
  try {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-file-${timestamp}.json`;
    
    // Test writing to blob storage
    const testContent = JSON.stringify({
      test: 'data',
      timestamp: timestamp,
      environment: process.env.VERCEL_ENV || 'local'
    });
    
    const testBlob = await put(filename, testContent, {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
    
    // Test listing blobs
    const { blobs } = await list({
      prefix: 'test',
      limit: 10
    });
    
    // Check token presence (safely)
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    // Use optional chaining and nullish coalescing to safely access the token
    const tokenPrefix = hasToken && process.env.BLOB_READ_WRITE_TOKEN 
      ? `${process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 3)}...` 
      : 'not found';
    
    return NextResponse.json({ 
      success: true, 
      message: 'Blob storage is working',
      filename: filename,
      putUrl: testBlob.url,
      listResults: blobs.length,
      hasToken: hasToken,
      tokenPrefix: tokenPrefix,
      environment: process.env.VERCEL_ENV || 'local'
    });
  } catch (error) {
    console.error('Blob test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      environment: process.env.VERCEL_ENV || 'local' 
    }, { status: 500 });
  }
}