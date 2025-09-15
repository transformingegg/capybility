"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function NewGather() {
  const [progress, setProgress] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<null | number>(null);
  const [added, setAdded] = useState<null | number>(null);
  const [done, setDone] = useState(false);
  const [lastBlock, setLastBlock] = useState<null | number>(null);

  const gather = async () => {
    setLoading(true);
    setProgress('Gathering...');
    setAdded(null);
    setTotal(null);
    setDone(false);
    try {
      const res = await fetch('/api/gatherbadge', { method: 'POST' });
      const data = await res.json();
      setAdded(data.added);
      setProgress(`Added: ${data.added}`);
      // Fetch last block processed from Blob Storage API
      const stateRes = await fetch('/api/gatherbadge/state');
      if (stateRes.ok) {
        const state = await stateRes.json();
        setLastBlock(state.lastBlock ?? null);
      }
    } catch {
      setProgress('Error gathering data.');
    }
    setLoading(false);
  };

  const [masterFileUrl, setMasterFileUrl] = useState<string | null>(null);
  const checkTotal = async () => {
    setProgress('Checking...');
    setMasterFileUrl(null);
    setAdded(null);
    setTotal(null);
    try {
      // Call the masterjoin endpoint to generate and get the latest master file
      const res = await fetch('/api/gatherbadge/masterjoin', { method: 'POST' });
      if (!res.ok) throw new Error('No data');
      const data = await res.json();
      setTotal(data.totalRecords);
      setProgress(`Total records: ${data.totalRecords}`);
      if (data.masterFile) {
        const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_PUBLIC_URL || '';
        setMasterFileUrl(`${BLOB_BASE_URL}/${data.masterFile}`);
      }
      // Fetch last block processed from Blob Storage API
      const stateRes = await fetch('/api/gatherbadge/state');
      if (stateRes.ok) {
        const state = await stateRes.json();
        setLastBlock(state.lastBlock ?? null);
      }
    } catch {
      setProgress('No badge data found yet.');
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-0 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between w-full mb-4 px-2 py-1 mt-4">
          <Image src="/img/bannerSmall.webp" alt="Capybility Banner" width={140} height={40} priority className="" />
          <Link href="https://capybility.xyz" target="_blank" rel="noopener noreferrer">
            <span className="font-bold text-base underline text-yellow-400 whitespace-nowrap">Go to Capybility.xyz</span>
          </Link>
        </div>
        <Card className="shadow rounded-xl border bg-white">
          <CardHeader className="flex flex-col items-center p-6">
            
            <CardTitle className="text-3xl font-bold text-primary text-center mt-6">Badge Gatherer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="flex gap-4 mb-4 w-full justify-center">
                <Button onClick={gather} disabled={loading} className="font-sans">
                  {loading ? 'Gathering...' : 'Gather Next Batch'}
                </Button>
                <Button onClick={checkTotal} disabled={loading} variant="secondary" className="font-sans">
                  Generate Master JSON
                </Button>
              </div>
              <div className="mb-2 min-h-[24px] text-center font-sans">{progress}</div>
              {added !== null && total === null && (
                <div className="font-sans">Last batch added: {added}</div>
              )}
              {total !== null && (
                <div className="font-sans">Total gathered: {total}</div>
              )}
              {done && <div className="text-green-600 font-sans">No more new transfers to gather.</div>}
              {lastBlock !== null && (
                <div className="font-sans text-sm text-gray-500 mt-2">Last block processed: {lastBlock}</div>
              )}
              {masterFileUrl && (
                <a href={masterFileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block font-bold underline text-yellow-400">
                  View gathered JSON
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
