"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLayout from "./PageLayout";
import { buttonStyles, sectionStyles } from "@/utils/styles";
import CustomAlertDialog from "./CustomAlertDialog";
import DrQuizBubble from './DrQuizBubble';

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
  quiz_name: string; // Added this field to match database
  wallet_address: string;
  created_at: string;
  is_archived: boolean;
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
    try {
      if (expandedQuizId === quizId) {
        setExpandedQuizId(null);
        return;
      }

      setExpandedQuizId(quizId);
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
      alert("Failed to load completers");
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className={sectionStyles}>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Pruv.it</h2>
          <p className="text-gray-600 mb-4">
            Please connect your wallet to access the dashboard and create quizzes.
          </p>
        </div>
      </PageLayout>
    );
  }

  const tableButtonStyles = "bg-gradient-to-r from-[#00c7df] to-[#ced661] text-white font-bold uppercase px-3 py-1 text-xs rounded-md hover:opacity-90 transition-opacity";
  const redButtonStyles = "bg-red-600 text-white font-bold uppercase px-3 py-1 text-xs rounded-md hover:opacity-90 transition-opacity";

  return (
    <PageLayout>
      <div className="space-y-6">
        <DrQuizBubble 
          text="So you want to run some CAPYBILITY Quizzes do you? Well DrQuiz can help you with that. Click 'Create New Quiz' below or manage your existing quizes below."
          collapsedText="Dr Quiz wants to help you with quizzes" // optional
        />
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">YOUR QUIZZES</h1>
          <Link
            href="/create"
            className={buttonStyles}
          >
            CREATE NEW QUIZ
          </Link>
        </div>

        {isLoading ? (
          <div className={sectionStyles}>
            <p>Loading your quizzes...</p>
          </div>
        ) : quizzes.filter(quiz => !quiz.is_archived).length > 0 ? (
          <>
            <div className={`overflow-x-auto ${sectionStyles}`}>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 border-b-2 border-[#00c7df] text-sm">Quiz Name</th>
                    <th className="text-left py-2 px-3 border-b-2 border-[#00c7df] text-sm">Created</th>
                    <th className="text-right py-2 px-3 border-b-2 border-[#00c7df] text-sm">Actions</th>
                  </tr>
                </thead>
                {quizzes
                  .filter(quiz => !quiz.is_archived)
                  .map((quiz) => (
                    <tbody key={quiz.id}>
                      <tr className="border-b border-[#00c7df] last:border-0">
                        <td className="py-2 px-3 text-sm">
                          {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {formatDate(quiz.created_at)}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/doquiz/${quiz.id}`}
                              className={tableButtonStyles}
                            >
                              DO QUIZ
                            </Link>
                            <button
                              onClick={() => handleArchiveQuiz(quiz.id)}
                              className={redButtonStyles}
                            >
                              ARCHIVE
                            </button>
                            <button
                              onClick={() => handleCompletersClick(quiz.id)}
                              className={`${redButtonStyles} ${expandedQuizId === quiz.id ? 'bg-opacity-50' : ''}`}
                            >
                              COMPLETERS
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedQuizId === quiz.id && (
                        <tr>
                          <td colSpan={3} className="border-b border-[#00c7df]">
                            <div className="p-4">
                              <div className="bg-gray-50 rounded-md p-2 h-[180px] overflow-y-auto text-sm font-mono">
                                {completers[quiz.id] ? (
                                  completers[quiz.id].length > 0 ? (
                                    completers[quiz.id].map((completer, index) => (
                                      <div key={index} className="mb-1">
                                        {completer.wallet_address}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 text-center font-sans">No one has completed this quiz yet.</p>
                                  )
                                ) : (
                                  <p className="text-gray-500 text-center font-sans">Loading completers...</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  ))}
              </table>
            </div>
            <div className="flex justify-end">
              <Link href="/archived-quizzes" className={buttonStyles}>
                GO TO ARCHIVED QUIZZES
              </Link>
            </div>
          </>
        ) : (
          <div className={sectionStyles}>
            <p className="text-gray-600 mb-4">You haven&apos;t created any quizzes yet.</p>
            <Link
              href="/create"
              className={buttonStyles}
            >
              CREATE YOUR FIRST QUIZ
            </Link>
          </div>
        )}
      </div>
      <CustomAlertDialog
        isOpen={!!showArchiveAlert}
        title="Archive Quiz"
        message="Are you sure? This will mean people will no longer be able to complete your quiz."
        confirmLabel="YES, ARCHIVE"
        cancelLabel="CANCEL"
        onConfirm={confirmArchive}
        onCancel={() => setShowArchiveAlert(null)}
        type="warning"
      />
    </PageLayout>
  );
}