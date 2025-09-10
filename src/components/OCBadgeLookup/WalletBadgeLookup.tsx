"use client";
type BadgeRow = {
  to: string | object;
  credentialSubjectName?: string;
};
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WalletBadgeLookup() {
  const [address, setAddress] = useState('');
  const [badges, setBadges] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(false);
    setBadges([]);
    try {
      const res = await fetch('/api/gatherbadge/json');
      const data = await res.json();
      const found = (data as BadgeRow[]).filter((row) => {
        let wallet = row.to;
        if (typeof wallet === 'object') wallet = JSON.stringify(wallet);
        return wallet && typeof wallet === 'string' && wallet.toLowerCase() === address.trim().toLowerCase();
      });
      const badgeNames = Array.from(new Set(found.map((row) => String(row.credentialSubjectName)))) as string[];
  setBadges(badgeNames);
    } catch {
      setBadges([]);
    }
    setSearched(true);
    setLoading(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Find All Badges Awarded to a Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Enter wallet address..."
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !address.trim()}
          >
            {loading ? 'Searching...' : 'Get my Badges'}
          </Button>
        </div>
        {searched && (
          <div className="mb-4">
            {badges.length > 0 ? (
              <>
                <div className="mb-2 font-semibold">Badges awarded to {address}:</div>
                <ul className="list-disc pl-5">
                  {badges.map((name, i) => (
                    <li key={i} className="break-all">{name}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div>No badges found for this address.</div>
            )}
          </div>
        )}
        <hr className="my-4" />
        <div className="text-center">
          <a
            href="https://dashboard.educhain.xyz/badges"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 font-semibold no-underline hover:text-yellow-500"
          >
            View all your badges on the official Open Campus Badges Dashboard
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
