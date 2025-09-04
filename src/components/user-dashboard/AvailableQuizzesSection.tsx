"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
  has_attempted_today: boolean;
  is_featured: boolean;
  is_flagged: boolean;
}

export default function AvailableQuizzesSection() {
  const { address } = useAccount();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const quizzesPerPage = 10;

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

  // Pagination logic
  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = availableQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz);
  const totalPages = Math.ceil(availableQuizzes.length / quizzesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading available quizzes...</p>
        ) : availableQuizzes.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentQuizzes.map((quiz) => (
                  <TableRow key={quiz.id} className={quiz.is_featured ? 'bg-yellow-100' : ''}>
                    <TableCell>
                      {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {quiz.has_attempted_today ? (
                          <p className="text-red-500 text-xs self-center">Already Attempted Today</p>
                        ) : (
                          <>
                            {quiz.source_url && (
                              <a
                                href={quiz.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">Learn</Button>
                              </a>
                            )}
                            <Link href={`/doquiz/${quiz.id}`}>
                              <Button size="sm">Do Quiz</Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p>No quizzes available at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}