"use client";
import { useState } from "react";
import { buttonStyles, sectionStyles } from "@/utils/styles";
import WordCloud from "../WordCloud";

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
    <div className={sectionStyles}>
      <h2 className="text-2xl font-bold mb-4">Knowledge Pack</h2>
      
      {!isGenerated ? (
        <button
          onClick={handleGeneratePack}
          disabled={isLoading}
          className={buttonStyles}
        >
          {isLoading ? "Generating..." : "Generate Knowledge Pack"}
        </button>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 border-b-2 border-[#00c7df] text-sm">Tag</th>
                  <th className="text-right py-2 px-3 border-b-2 border-[#00c7df] text-sm">Count</th>
                </tr>
              </thead>
              <tbody>
                {knowledgePack.map((tag, index) => (
                  <tr key={index} className="border-b border-[#00c7df] last:border-0">
                    <td className="py-2 px-3 text-sm">{tag.tag}</td>
                    <td className="py-2 px-3 text-sm text-right">{tag.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => setShowWordCloud(!showWordCloud)}
            className={buttonStyles}
          >
            {showWordCloud ? "Hide Word Cloud" : "Generate My Word Cloud"}
          </button>

          {showWordCloud && (
            <div className="mt-6 bg-white rounded-lg shadow-inner p-4">
              <WordCloud words={wordCloudData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}