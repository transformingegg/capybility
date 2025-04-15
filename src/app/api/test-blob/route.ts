import { NextResponse } from "next/server";
import { put, list } from '@vercel/blob';

export async function GET() {
  try {
    // Test writing to blob storage
    const testContent = JSON.stringify({
      test: 'data',
      timestamp: new Date().toISOString()
    });
    
    const testBlob = await put('test-file.json', testContent, {
      contentType: 'application/json',
      access: 'public',
    });
    
    // Test listing blobs
    const { blobs } = await list({
      prefix: 'test',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Blob storage is working',
      putUrl: testBlob.url,
      listResults: blobs.length
    });
  } catch (error) {
    console.error('Blob test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}