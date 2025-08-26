"use client";
import { useState } from "react";
import WordCloud from "../WordCloud";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KnowledgeTag {
  tag: string;
  count: number;
}

export default function KnowledgePackSection({ address }: { address: `0x${string}` | undefined }) {
  const [knowledgePack, setKnowledgePack] = useState<KnowledgeTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);

  const handleGeneratePack = async () => {
    if (!address) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/user-stats/knowledge-pack?address=${address}`);
      const data = await response.json();
      setKnowledgePack(data.tags);
      setIsGenerated(true);
    } catch (error) {
      console.error("Error generating knowledge pack:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const wordCloudData = knowledgePack.map(tag => ({
    text: tag.tag,
    size: Math.max(12, Math.min(60, tag.count * 5)) // Scale size between 12 and 60
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Pack</CardTitle>
      </CardHeader>
      <CardContent>
        {!isGenerated ? (
          <Button
            onClick={handleGeneratePack}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Knowledge Pack"}
          </Button>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {knowledgePack.map((tag, index) => (
                    <TableRow key={index}>
                      <TableCell>{tag.tag}</TableCell>
                      <TableCell className="text-right">{tag.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              onClick={() => setShowWordCloud(!showWordCloud)}
            >
              {showWordCloud ? "Hide Word Cloud" : "Generate My Word Cloud"}
            </Button>

            {showWordCloud && (
              <div className="mt-6 bg-white rounded-lg shadow-inner p-4">
                <WordCloud words={wordCloudData} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}