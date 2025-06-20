"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { sectionStyles } from "@/utils/styles";

interface Quiz {
  id: string;
  quiz_data: {
    quiz: Array<{
      question: string;
      choices: string[];
      correctAnswer: number;
    }>;
    quizName: string;
    tags: string[];
  };
  quiz_name: string;
  wallet_address: string;
  created_at: string;
  is_archived: boolean;
  status?: string;
  source_url?: string;
  has_attempted_today: boolean; // Add this field
}

export default function AvailableQuizzesSection() {
  const { address } = useAccount();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableQuizzes = async () => {
      if (!address) return;

      try {
        const response = await fetch(`/api/get-available-quizzes?address=${address}`);
        const data = await response.json();
        if (data.success) {
          setAvailableQuizzes(data.quizzes);
        } else {
          console.error("Failed to fetch available quizzes:", data.error);
        }
      } catch (error) {
        console.error("Error fetching available quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableQuizzes();
  }, [address]);

  const tableButtonStyles = "bg-gradient-to-r from-[#00c7df] to-[#ced661] text-white font-bold uppercase px-3 py-1 text-xs rounded-md hover:opacity-90 transition-opacity";

  return (
    <div className={sectionStyles}>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Available Quizzes</h2>
      {isLoading ? (
        <p>Loading available quizzes...</p>
      ) : availableQuizzes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 border-b-2 border-[#00c7df] text-sm">Quiz Name</th>
                <th className="text-right py-2 px-3 border-b-2 border-[#00c7df] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {availableQuizzes.map((quiz) => (
                <tr key={quiz.id} className="border-b border-[#00c7df] last:border-0">
                  <td className="py-2 px-3 text-sm">
                    {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-end gap-1">
                      {quiz.has_attempted_today ? (
                        <p className="text-red-500 text-xs">Already Attempted Today - Try Tomorrow</p>
                      ) : (
                        <>
                          {quiz.source_url && (
                            <a
                              href={quiz.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={tableButtonStyles}
                            >
                              Learn
                            </a>
                          )}
                          <Link
                            href={`/doquiz/${quiz.id}`}
                            className={tableButtonStyles}
                          >
                            Do Quiz
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No quizzes available at the moment.</p>
      )}
    </div>
  );
}