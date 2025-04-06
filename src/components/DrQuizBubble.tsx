"use client";
import { useState } from 'react';
import Image from 'next/image';

interface DrQuizBubbleProps {
  text: string;
  collapsedText?: string;
}

export default function DrQuizBubble({ 
  text, 
  collapsedText = "Dr Quiz has something to say" 
}: DrQuizBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-6 relative">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Speech Bubble */}
        <div className={`
          flex-grow
          bg-red-50 border-2 border-red-500 rounded-xl p-4
          ${isExpanded ? 'min-h-[100px]' : 'min-h-[40px]'}
          transition-all duration-300 ease-in-out
          w-full
        `}>
          <div className="flex justify-between items-center">
            {!isExpanded && <span className="font-bold text-gray-700">{collapsedText}</span>}
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-red-500 hover:text-red-700 transition-colors ml-auto"
              aria-label={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>

          {isExpanded && (
            <div>
              <div className="font-bold mb-2 text-gray-700">DR Q :</div>
              <p className="text-gray-600">{text}</p>
            </div>
          )}
        </div>

        {/* Dr Quiz Image */}
        {isExpanded && (
          <div className="flex-shrink-0 w-full md:w-[140px] flex justify-center md:items-stretch">
            <div className="w-[75%] aspect-square md:w-full md:h-full relative">
              <Image
                src="/img/DrQuiz.png"
                alt="Dr Quiz"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}