import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'public', 'badge-gather.json');

export async function GET() {
  try {
    const file = await fs.readFile(DATA_PATH, 'utf-8');
    return new NextResponse(file, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
