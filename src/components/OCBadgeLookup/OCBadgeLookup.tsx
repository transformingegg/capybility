"use client";
import { useEffect, useState } from 'react';

// Define the expected structure for badge results
type BadgeResult = { to: string | object; credentialSubjectName?: string };

export default function OCBadgeLookup() {
  const [badgeOptions, setBadgeOptions] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [results, setResults] = useState<BadgeResult[]>([]);
  const [badgeName, setBadgeName] = useState('');
  // Removed unused loading state
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchOptions() {
  const res = await fetch('/api/gatherbadge/masterjson');
      const data = await res.json();
      // Get unique badge names
      const seen: Record<string, boolean> = {};
      const options: string[] = [];
      for (const row of data) {
        if (row.credentialSubjectName && !seen[row.credentialSubjectName]) {
          seen[row.credentialSubjectName] = true;
          options.push(row.credentialSubjectName);
        }
      }
      setBadgeOptions(options);
    }
    fetchOptions();
  }, []);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
  setSelectedId(name);
  setResults([]);
    setBadgeName('');
    setSearched(false);
    try {
  const res = await fetch('/api/gatherbadge/masterjson');
      const data = await res.json();
      // Group by badge name
      const grouped: Record<string, BadgeResult[]> = {};
      for (const row of data) {
        if (row.credentialSubjectName === name) {
          if (!grouped[row.credentialSubjectName]) grouped[row.credentialSubjectName] = [];
          grouped[row.credentialSubjectName].push(row);
        }
      }
      setResults(grouped[name] || []);
      setSearched(true);
      setBadgeName(name);
    } catch {
      setResults([]);
      setBadgeName('');
      setSearched(true);
    }
    // Removed setLoading(false) since loading is unused
  };

  return (
    <div className="flex flex-col items-center font-sans var(--font-geist-sans)">
      <div className="mb-4 w-full max-w-md">
  <select value={selectedId} onChange={handleSelect} className="w-full p-2 border rounded font-sans var(--font-geist-sans)">
          <option value="">Select a badge...</option>
          {badgeOptions.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      {searched && (
  <div className="w-full max-w-md font-sans var(--font-geist-sans)">
          <div>
            {results.length > 0 ? (
              <>
                <div><b>Badge Name:</b> {badgeName}</div>
                <div><b>Total minted:</b> {results.length}</div>
                <div className="mt-2"><b>Wallets:</b></div>
                <ul className="list-disc pl-5">
                  {results.map((row, i) => {
                    let wallet = row.to;
                    if (typeof wallet === 'object') {
                      wallet = JSON.stringify(wallet);
                    }
                    return (
                      <li key={i} className="break-all font-sans var(--font-geist-sans)">{wallet}</li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div>No records found for this badge name.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
