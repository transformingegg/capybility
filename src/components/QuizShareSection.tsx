"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buttonStyles } from "@/utils/styles";

interface QuizShareSectionProps {
  quizId: string;
}

export default function QuizShareSection({ quizId }: QuizShareSectionProps) {
  const [copySuccess, setCopySuccess] = useState<string>('');
  const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/doquiz/${quizId}`;
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/img/button.png`;

  const embedCode = `<a href="${quizUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${imageUrl}" alt="Take this quiz" style="max-width: 300px;" />
</a>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopySuccess('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Have a go at your Quiz</h3>
        <Link href={`/doquiz/${quizId}`} className={buttonStyles}>
          DO QUIZ NOW
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">
          This is a link to your quiz. Copy it and put it anywhere you think people will find it. 
          Even on the URL where the info is!
        </h3>
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
          <span className="flex-grow font-mono text-sm break-all">{quizUrl}</span>
          <button
            onClick={() => handleCopy(quizUrl, 'URL')}
            className="text-blue-500 hover:text-blue-700 p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">
          Here is a button you can save and use to draw attention to your link
        </h3>
        <div className="relative w-[300px] h-[100px]">
          <Image
            src="/img/button.png"
            alt="Quiz button"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">
          Here is some HTML embed code you can use to include a link to your quiz
        </h3>
        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            <code className="text-sm">{embedCode}</code>
          </pre>
          <button
            onClick={() => handleCopy(embedCode, 'HTML')}
            className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {copySuccess}
        </div>
      )}
    </div>
  );
}