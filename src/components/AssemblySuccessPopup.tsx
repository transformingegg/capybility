import React, { useEffect, useState } from "react";
import "./MintSuccessPopup.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AssemblySuccessPopupProps {
  open: boolean;
  status: 'assembling' | 'success';
  tokenId: string;
  newImageUrl?: string;
  rarity?: string;
  onClose: () => void;
  onViewBarabot: () => void;
}

const AssemblySuccessPopup: React.FC<AssemblySuccessPopupProps> = ({
  open,
  status,
  tokenId,
  newImageUrl,
  rarity,
  onClose,
  onViewBarabot,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (status === 'success' && newImageUrl) {
      // Pre-load the new image
      const img = new window.Image();
      img.onload = () => {
        setTimeout(() => setImageLoaded(true), 500); // Small delay for dramatic effect
      };
      img.src = newImageUrl;
    }
  }, [status, newImageUrl]);

  if (!open) return null;

  return (
    <div className="mint-success-overlay">
      <div className="mint-success-popup">
        {status === 'assembling' ? (
          // Assembling state
          <>
            <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>
              Assembling Your Barabot...
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign the transaction with your wallet and wait while we assemble your Barabot!
            </p>
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="text-sm text-gray-500">
              This may take a moment. Please don&apos;t close this window.
            </p>
          </>
        ) : (
          // Success state
          <>
            <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>
              Congratulations!
            </h2>
            <p className="mb-4">
              Your Barabot has been assembled{rarity ? <> as a <strong>{rarity}</strong></> : ''}!
            </p>
            
            {imageLoaded && newImageUrl ? (
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
                  src={newImageUrl}
                  alt="Assembled Barabot"
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

            <p className="text-gray-600 mb-6">
              Your Barabot #{tokenId} is now fully assembled!
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
                View My Barabot
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssemblySuccessPopup;
