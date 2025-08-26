"use client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UrlFormProps {
  onUrlSubmit: (url: string, autoGather: boolean) => void;
  url: string;
  setUrl: (url: string) => void;
  autoGather: boolean;
  setAutoGather: (autoGather: boolean) => void;
}

export default function UrlForm({ onUrlSubmit, url, setUrl, autoGather, setAutoGather }: UrlFormProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url, autoGather);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/article"
        required
        className="w-full"
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-gather"
          checked={autoGather}
          onCheckedChange={(checked) => setAutoGather(checked as boolean)}
        />
        <Label htmlFor="auto-gather">
          Try to Automatically Gather Content from URL
        </Label>
      </div>
      <div className="flex justify-end">
        
      </div>
    </form>
  );
}