"use client";

import { useOCAuth } from '@opencampus/ocid-connect-js';
import { useState } from 'react';

export default function BadgeSubmissionSection() {
  const { isInitialized, authState, ocAuth } = useOCAuth();
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitialized || !authState.isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
        <p className="text-sm text-yellow-800">Please connect your OCID to claim your achievement badge.</p>
      </div>
    );
  }

  const handleClaimBadge = async () => {
    setIsSubmitting(true);
    setSubmissionStatus("Submitting your badge...");

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

      setSubmissionStatus("Success! Your achievement badge has been submitted.");
      alert('Success! Your achievement badge has been submitted.');

    } catch (error) {
      // Fix 1: Handle the error type safely.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("Badge submission error:", error);
      setSubmissionStatus(`Error: ${errorMessage}`);
      alert(`Error submitting badge: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Claim Your Open Campus Badge</h3>
      <p className="text-gray-600 mb-4 text-sm">
        {/* Fix 2: Replace the apostrophe with its HTML entity equivalent. */}
        You&apos;ve earned the on-chain NFT! Now, claim the corresponding achievement badge to display on your Open Campus profile.
      </p>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleClaimBadge}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Claim Badge'}
        </button>
      </div>

      {submissionStatus && (
        <p className="mt-4 text-sm text-gray-700">{submissionStatus}</p>
      )}
    </div>
  );
}