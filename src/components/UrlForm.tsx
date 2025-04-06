"use client";
import { useState } from "react";
import { buttonStyles } from "@/utils/styles";

interface UrlFormProps {
  onUrlSubmitted: (url: string) => void;
  onSourceTypeSelected: (type: 'scrape' | 'manual') => void;
  onSkipUrl: () => void;
  isLoading: boolean;
  isUrlSubmitted: boolean;
}

export default function UrlForm({ 
  onUrlSubmitted, 
  onSourceTypeSelected, 
  onSkipUrl,
  isLoading,
  isUrlSubmitted 
}: UrlFormProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmitted(url);
    }
  };

  const handleSkip = () => {
    onSkipUrl();
    onSourceTypeSelected('manual');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL containing quiz content"
            className="flex-1 p-2 border rounded-md"
            disabled={isUrlSubmitted}
            required
          />
          <button
            type="submit"
            disabled={!url.trim() || isUrlSubmitted}
            className={buttonStyles + (!url.trim() || isUrlSubmitted ? " opacity-50 cursor-not-allowed" : "")}
          >
            SUBMIT URL
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isUrlSubmitted}
            className={buttonStyles + (isUrlSubmitted ? " opacity-50 cursor-not-allowed" : "")}
          >
            CREATE WITHOUT URL
          </button>
        </div>
      </form>

      {isUrlSubmitted && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-4">How would you like to provide the content?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => onSourceTypeSelected('scrape')}
              disabled={isLoading}
              className={buttonStyles + (isLoading ? " opacity-50 cursor-not-allowed" : "")}
            >
              GATHER FROM URL
            </button>
            <button
              onClick={() => onSourceTypeSelected('manual')}
              disabled={isLoading}
              className={buttonStyles + (isLoading ? " opacity-50 cursor-not-allowed" : "")}
            >
              ENTER MY OWN TEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}