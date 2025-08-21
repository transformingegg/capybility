"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function BadgeSubmissionSection() {
  const { isInitialized, authState, ocAuth } = useOCAuth();
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimedUserOcId, setClaimedUserOcId] = useState<string | null>(null);

  if (!isInitialized || !authState.isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
        <p className="text-sm text-yellow-800">Now it&apos;s time to make it official with an OpenCampus Badge! Please connect your OCID at the top of the dashboard to claim your Open Campus Badge.</p>
      </div>
    );
  }

  const handleClaimBadge = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("Claiming your badge...");

    const authData = ocAuth.getAuthState();
    const holderAddress = authData?.ethAddress;
    const holderOcId = authData?.OCId;

    if (!holderAddress || !holderOcId) {
      setSubmissionStatus("Error: Could not get your wallet address or OCID. Please try reconnecting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/issue-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holderAddress, holderOcId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      setSubmissionStatus("Success! Your achievement badge has been claimed!");
      setIsClaimed(true);
      setClaimedUserOcId(holderOcId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("Badge submission error:", error);
      setSubmissionStatus(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Claim Your Open Campus Badge</h3>
      <p className="text-gray-600 mb-4 text-sm">
        You&apos;ve earned the on-chain NFT! Now, claim the corresponding achievement badge to display on your Open Campus profile.
      </p>
      
      <div className="flex flex-col items-center gap-4">
        {isClaimed ? (
          // --- SUCCESS STATE ---
          <div className="text-center">
            <Image
              src="/img/OCBClaimed.png"
              alt="Open Campus Badge Claimed"
              width={200}
              height={50}
            />
          </div>
        ) : (
          // --- INITIAL STATE ---
          <button
            onClick={handleClaimBadge}
            disabled={isSubmitting}
            className="disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          >
            <Image
              src="/img/ClaimOCB.png"
              alt="Claim Open Campus Badge"
              width={200}
              height={50}
            />
          </button>
        )}
      </div>

      {submissionStatus && (
        <p className="mt-4 text-sm text-gray-700 text-center">{submissionStatus}</p>
      )}

      {/* The link is now here, below the status message, and will only appear when claimed */}
      {isClaimed && claimedUserOcId && (
        <div className="text-center mt-2">
          <Link href={`https://id.opencampus.xyz/public/credentials?username=${claimedUserOcId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View Your OC Achievements Now
          </Link>
        </div>
      )}
    </div>
  );
}