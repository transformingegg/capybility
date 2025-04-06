"use client";
import { useState, useEffect } from "react";

// Define the props interface
interface TextDisplayProps {
  text: string;
  title: string;
  isEditable?: boolean;
  onTextChange?: (newText: string) => void;
}

export default function TextDisplay({
  text,
  title,
  isEditable = false, // Default to false
  onTextChange,
}: TextDisplayProps) {
  const [localText, setLocalText] = useState(text);

  // Sync localText with prop text when it changes (e.g., after scraping)
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    if (onTextChange) {
      onTextChange(e.target.value);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      {isEditable ? (
        <textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Paste or type your own text here..."
          className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y text-sm leading-relaxed"
        />
      ) : (
        <pre className="text-gray-600 whitespace-pre-wrap break-words border border-gray-200 p-3 rounded-md max-h-96 overflow-y-auto text-sm leading-relaxed">
          {localText}
        </pre>
      )}
    </div>
  );
}