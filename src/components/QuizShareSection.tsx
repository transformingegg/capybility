"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from 'lucide-react';

interface QuizShareSectionProps {
  quizId: string;
}

export default function QuizShareSection({ quizId }: QuizShareSectionProps) {
  const [copySuccess, setCopySuccess] = useState<string>('');
  const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/doquiz/${quizId}`;
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/img/capyrep.png`;

  const embedCode = `<a href="${quizUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="Take this quiz on Capybility" style="max-width: 300px; border-radius: 8px;" /></a>`;

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
      {copySuccess && (
        <div className="text-center text-green-600 font-semibold p-2 bg-green-100 rounded-md">
          {copySuccess}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Share the Link</CardTitle>
          <CardDescription>Copy this link and share it anywhere.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input readOnly value={quizUrl} className="flex-grow font-mono text-sm" />
            <Button size="icon" variant="outline" onClick={() => handleCopy(quizUrl, 'URL')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grab an Image</CardTitle>
          <CardDescription>Right-click and save an image to use with your link.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="text-center">
            <p className="font-semibold mb-2">Generic</p>
            <Image
              src="/img/capyrep.png"
              alt="Take this quiz on Capybility"
              width={300}
              height={100}
              className="rounded-lg mx-auto border"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold mb-2">With Reward</p>
            <Image
              src="/img/capyreward.png"
              alt="Take this quiz and earn a reward"
              width={300}
              height={100}
              className="rounded-lg mx-auto border"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTML Embed Code</CardTitle>
          <CardDescription>Use this code to embed the quiz button directly on your website.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
              <code className="text-sm">{embedCode}</code>
            </pre>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopy(embedCode, 'HTML')}
              className="absolute top-2 right-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}