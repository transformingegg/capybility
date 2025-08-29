import React from "react";
import "./MintSuccessPopup.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface MintSuccessPopupProps {
  open: boolean;
  rarity: string;
  nftImageUrl: string;
  onGoToDashboard: () => void;
  quizName?: string;
  quizId?: string;
  walletAddress?: string;
  hashtags?: string;
}

const MintSuccessPopup: React.FC<MintSuccessPopupProps> = ({
  open,
  rarity,
  nftImageUrl,
  onGoToDashboard,
  quizName,
  quizId,
  walletAddress,
  hashtags,
}) => {
  if (!open) return null;

  // Build referral link for sharing
  const referralLink = quizId && walletAddress
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/doquiz/${quizId}?ref=${walletAddress}`
    : '';

  // Build tweet intent URL using official parameters
  // See: https://developer.x.com/en/docs/x-for-websites/tweet-button/guides/web-intent
  // Format hashtags: remove #, trim, and join with commas
  const formattedHashtags = hashtags
    ? hashtags.split(',').map(tag => tag.replace(/#/g, '').trim()).filter(Boolean).join(',')
    : '';

  // Tweet text (no link in text, link is passed as url param)
  const tweetText = `I just added to my learner reputation on @capybility AND minted a rewarding NFT by doing this quiz -> ${quizName || ''}. You can do it here too.`;
  const tweetParams = new URLSearchParams({
    text: tweetText,
    url: referralLink,
    hashtags: formattedHashtags
  });
  const tweetUrl = `https://x.com/intent/tweet?${tweetParams.toString()}`;

  return (
    <div className="mint-success-overlay">
      <div className="mint-success-popup">
  <h2 style={{ color: 'hsl(var(--primary, 210, 100%, 56%))', fontWeight: 700 }}>Congratulations!</h2>
        <p>
          {rarity
            ? <>You completed the quiz and just got a <b>{rarity}</b> completion token!</>
            : <>You just earned a badge!</>
          }
        </p>
        <div className="mint-success-image-stack">
          <Image
            src="/img/YellowBack.png"
            alt="Background"
            width={300} // Replace with the actual width of WhiteFront.png
            height={300} // Replace with the actual height of WhiteFront.png
            className="mint-bg-img"
            style={{ zIndex: 1 }}
          />
          <Image
            src="/img/WhiteFront.png"
            alt="Spinning Front"
            className="mint-spin-img"
            width={300} // Replace with the actual width of WhiteFront.png
            height={300} // Replace with the actual height of WhiteFront.png
            style={{ zIndex: 2 }}
          />
          <Image
            src={nftImageUrl}
            alt="NFT"
            width={300} // Replace with the actual width of WhiteFront.png
            height={300} // Replace with the actual height of WhiteFront.png
            className="mint-nft-img"
            style={{ zIndex: 3 }}
          />
        </div>
        <p>
          Brag about your achievement! Share your success on X and invite friends to build their reputation and earn NFTs too.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', margin: '24px 0' }}>
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', height: '96px' }}>
            <Image src="/img/shareOnX.png" alt="Share on X" width={140} height={48} style={{ objectFit: 'contain' }} />
          </a>
          <Button
            variant="default"
            size="default"
            style={{ height: '48px', minWidth: '140px', fontSize: '1rem' }}
            onClick={onGoToDashboard}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MintSuccessPopup;