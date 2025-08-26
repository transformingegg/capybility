"use client";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLayout from "./PageLayout";
import DrQuizBubble from './DrQuizBubble';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function Dashboard() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [completers, setCompleters] = useState<{[key: string]: Completer[]}>({});
  const [showArchiveAlert, setShowArchiveAlert] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      // Give wagmi a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isConnected) {
        router.push('/?auth_required=true');
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
    };

    checkConnection();
  }, [isConnected, address, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  const handleArchiveQuiz = (quizId: string) => {
    setShowArchiveAlert(quizId);
  };

  const confirmArchive = async () => {
    if (!showArchiveAlert) return;
    
    try {
      const response = await fetch(`/api/archive-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId: showArchiveAlert, archived: true })
      });

      if (response.ok) {
        const updatedQuizzes = quizzes.filter(quiz => quiz.id !== showArchiveAlert);
        setQuizzes(updatedQuizzes);
      }
    } catch (error) {
      console.error('Error archiving quiz:', error);
    } finally {
      setShowArchiveAlert(null);
    }
  };

  const handleCompletersClick = async (quizId: string) => {
    // Toggle the expanded view
    const newExpandedId = expandedQuizId === quizId ? null : quizId;
    setExpandedQuizId(newExpandedId);

    // Fetch data only if it's being opened and not already loaded
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

  if (!isConnected) {
    return (
      <PageLayout>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Capybility</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please connect your wallet to access the dashboard and create quizzes.</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth={true}>
      <div 
        style={{
          backgroundImage: "url('/img/capyback.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: 'calc(100vh - 65px)', // Adjust 65px based on header height
        }}
      >
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Creator Dashboard</CardTitle>
                <Link href="/create">
                  <Button>CREATE NEW QUIZ</Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
          <DrQuizBubble 
            text="So you want to run some CAPYBILITY Quizzes do you? Well DrQuiz can help you with that. Click 'Create New Quiz' below or manage your existing quizes by clicking COMPLETERS to see the wallet addresses that completed it, or ARCHIVE if you are finished with the quiz."
            collapsedText="Dr Quiz wants to help you with quizzes"
          />
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p>Loading your quizzes...</p>
              </CardContent>
            </Card>
          ) : quizzes.filter(quiz => !quiz.is_archived && quiz.status === "minted").length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
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
                        .filter(quiz => !quiz.is_archived && quiz.status === "minted")
                        .map((quiz) => (
                          <React.Fragment key={quiz.id}>
                            <TableRow>
                              <TableCell>
                                {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                              </TableCell>
                              <TableCell>
                                {formatDate(quiz.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Link href={`/doquiz/${quiz.id}`} passHref>
                                    <Button variant="outline" size="sm">DO QUIZ</Button>
                                  </Link>
                                  <Button variant="destructive" size="sm" onClick={() => handleArchiveQuiz(quiz.id)}>
                                    ARCHIVE
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCompletersClick(quiz.id)}
                                    aria-expanded={expandedQuizId === quiz.id}
                                  >
                                    COMPLETERS
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedQuizId === quiz.id && (
                              <TableRow key={`${quiz.id}-completers`}>
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
                          </React.Fragment>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="flex justify-end pt-4">
                <Link href="/archived-quizzes">
                    <Button>GO TO ARCHIVED QUIZZES</Button>
                </Link>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                  <CardTitle>No Quizzes Yet!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">You haven&apos;t created any quizzes yet.</p>
              </CardContent>
              <CardFooter>
                  <Link href="/create">
                      <Button>CREATE YOUR FIRST QUIZ</Button>
                  </Link>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      <AlertDialog open={!!showArchiveAlert} onOpenChange={(open) => !open && setShowArchiveAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will mean people will no longer be able to complete your quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowArchiveAlert(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>YES, ARCHIVE</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}