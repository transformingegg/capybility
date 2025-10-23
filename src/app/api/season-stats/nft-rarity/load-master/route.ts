import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { list } from '@vercel/blob';

const MASTER_PREFIX = 'user_rarity_counts/master-';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // List master files and find the latest one
    const blobs = await list({ prefix: 'user_rarity_counts/' });
    const masterFiles = blobs.blobs
      .filter(b => b.pathname.startsWith(MASTER_PREFIX) && b.pathname.endsWith('.json'))
      .map(b => ({ 
        url: b.url, 
        name: b.pathname,
        // Extract version number from filename (master-123.json -> 123)
        version: parseInt(b.pathname.replace(MASTER_PREFIX, '').replace('.json', '')) || 0
      }))
      .sort((a, b) => b.version - a.version); // Sort by version descending

    if (masterFiles.length === 0) {
      return NextResponse.json({ error: 'No master files found' }, { status: 404 });
    }

    const latestMaster = masterFiles[0];
    
    // Fetch the latest master file
    const response = await fetch(latestMaster.url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch master file' }, { status: 500 });
    }

    const masterData = await response.json();

    return NextResponse.json({
      success: true,
      data: masterData,
      masterFile: latestMaster.name,
      version: latestMaster.version,
      totalFiles: masterFiles.length
    });

  } catch (e) {
    console.error('load-master error', e);
    return NextResponse.json({ error: 'load-master failed', details: (e as Error).message }, { status: 500 });
  }
}