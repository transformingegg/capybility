import React, { useEffect, useState } from "react";
import "./MintSuccessPopup.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MintBarabotPopupProps {
  open: boolean;
  status: 'minting' | 'creating-metadata' | 'success' | 'error';
  tokenId?: string;
  category?: string;
  errorMessage?: string;
  onClose: () => void;
  onViewBarabot: () => void;
}

const MintBarabotPopup: React.FC<MintBarabotPopupProps> = ({
  open,
  status,
  tokenId,
  category,
  errorMessage,
  onClose,
  onViewBarabot,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (status === 'success' && tokenId) {
      // Pre-load the crate image
      const img = new window.Image();
      img.onload = () => {
        setTimeout(() => setImageLoaded(true), 500); // Small delay for dramatic effect
      };
      img.src = `/barabotsmetadata/img/${tokenId}`;
    }
  }, [status, tokenId]);

  if (!open) return null;

  return (
    <div className="mint-success-overlay">
      <div className="mint-success-popup">
        {status === 'minting' && (
          // Minting state
          <>
            <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>
              Minting Your Barabot...
            </h2>
            <p className="text-gray-600 mb-6">
              Please confirm the transaction in your wallet
            </p>
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="text-sm text-gray-500">
              This may take a moment. Please don&apos;t close this window.
            </p>
          </>
        )}

        {status === 'creating-metadata' && (
          // Creating metadata state
          <>
            <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>
              Preparing Your Barabot...
            </h2>
            <p className="text-gray-600 mb-6">
              Creating your Barabot crate metadata
            </p>
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="text-sm text-gray-500">
              Almost there! Setting up your new crate...
            </p>
          </>
        )}

        {status === 'error' && (
          // Error state
          <>
            <h2 style={{ color: '#ef4444', fontWeight: 700 }}>
              Minting Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'An error occurred while minting your Barabot'}
            </p>
            <div className="flex justify-center items-center py-8">
              <div className="text-6xl">❌</div>
            </div>
            <Button
              variant="default"
              onClick={onClose}
              className="mt-4"
            >
              Close
            </Button>
          </>
        )}

        {status === 'success' && (
          // Success state
          <>
            <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>
              Congratulations!
            </h2>
            <p className="mb-4">
              You&apos;ve successfully minted a <strong>{category}</strong> Barabot crate!
            </p>
            
            {imageLoaded && tokenId ? (
              <div className="mint-success-image-stack">
                <Image
                  src="/img/YellowBack.png"
                  alt="Background"
                  width={300}
                  height={300}
                  className="mint-bg-img"
                  style={{ zIndex: 1 }}
                />
                <Image
                  src="/img/WhiteFront.png"
                  alt="Spinning Front"
                  className="mint-spin-img"
                  width={300}
                  height={300}
                  style={{ zIndex: 2 }}
                />
                <Image
                  src={`/barabotsmetadata/img/${tokenId}`}
                  alt="Barabot Crate"
                  width={300}
                  height={300}
                  className="mint-nft-img"
                  style={{ zIndex: 3 }}
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            )}

            <p className="text-gray-600 mb-2">
              <strong>Token ID: #{tokenId}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Your crate is ready to be assembled into a Barabot!
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={onViewBarabot}
              >
                View My Crate
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MintBarabotPopup;
