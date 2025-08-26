"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
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
}

interface Completer {
  wallet_address: string;
}

export default function ArchivedQuizzes() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [completers, setCompleters] = useState<{[key: string]: Completer[]}>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`/api/get-quizzes?address=${address}`);
        const data = await response.json();
        if (data.success) {
          setQuizzes(data.quizzes);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchQuizzes();
    }
  }, [isConnected, address, router]);

  const handleCompletersClick = async (quizId: string) => {
    const newExpandedId = expandedQuizId === quizId ? null : quizId;
    setExpandedQuizId(newExpandedId);

    if (newExpandedId && !completers[quizId]) {
      try {
        const response = await fetch(`/api/get-completers?quizId=${quizId}`);
        const data = await response.json();
        
        if (data.success) {
          setCompleters(prev => ({
            ...prev,
            [quizId]: data.completers
          }));
        }
      } catch (error) {
        console.error("Error fetching completers:", error);
      }
    }
  };

  return (
    <PageLayout fullWidth={true}>
      <div 
        style={{
          backgroundImage: "url('/img/capyback.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: 'calc(100vh - 65px)',
        }}
      >
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Archived Quizzes</CardTitle>
                <Link href="/creator-dashboard">
                  <Button>BACK TO DASHBOARD</Button>
                </Link>
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p>Loading archived quizzes...</p>
              </CardContent>
            </Card>
          ) : quizzes.filter(quiz => quiz.is_archived && quiz.status === "minted").length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes
                      .filter(quiz => quiz.is_archived)
                      .map((quiz) => (
                        <>
                          <TableRow key={quiz.id}>
                            <TableCell>
                              {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                            </TableCell>
                            <TableCell>
                              {formatDate(quiz.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm"
                                onClick={() => handleCompletersClick(quiz.id)}
                                aria-expanded={expandedQuizId === quiz.id}
                              >
                                COMPLETERS
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedQuizId === quiz.id && (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <div className="p-4 bg-muted rounded-md">
                                  <h4 className="font-semibold mb-2">Completers:</h4>
                                  <div className="bg-background rounded-md p-2 h-[180px] overflow-y-auto text-sm font-mono border">
                                    {completers[quiz.id] ? (
                                      completers[quiz.id].length > 0 ? (
                                        completers[quiz.id].map((completer, index) => (
                                          <div key={index} className="mb-1">
                                            {completer.wallet_address}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-gray-500 text-center font-sans pt-4">No one has completed this quiz yet.</p>
                                      )
                                    ) : (
                                      <p className="text-gray-500 text-center font-sans pt-4">Loading completers...</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Archived Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">You don&apos;t have any archived quizzes.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}