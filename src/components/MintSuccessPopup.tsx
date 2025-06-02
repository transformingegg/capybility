import React from "react";
import "./MintSuccessPopup.css";
import { buttonStyles } from "@/utils/styles";
import Image from "next/image";

interface MintSuccessPopupProps {
  open: boolean;
  rarity: string;
  nftImageUrl: string;
  onGoToDashboard: () => void;
}

const MintSuccessPopup: React.FC<MintSuccessPopupProps> = ({
  open,
  rarity,
  nftImageUrl,
  onGoToDashboard,
}) => {
  if (!open) return null;

  return (
    <div className="mint-success-overlay">
      <div className="mint-success-popup">
        <h2>Congratulations!</h2>
        <p>
          You completed the quiz and just got a <b>{rarity}</b> completion token!
        </p>
        <div className="mint-success-image-stack">
          <Image
            src="/img/YellowBack.png"
            alt="Background"
            className="mint-bg-img"
            style={{ zIndex: 1 }}
          />
          <Image
            src="/img/WhiteFront.png"
            alt="Spinning Front"
            className="mint-spin-img"
            style={{ zIndex: 2 }}
          />
          <Image
            src={nftImageUrl}
            alt="NFT"
            className="mint-nft-img"
            style={{ zIndex: 3 }}
          />
        </div>
        <p>
          Head to your dashboard to check your stats and find more quizzes now!
        </p>
        <button className={buttonStyles} onClick={onGoToDashboard}>
            Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MintSuccessPopup;