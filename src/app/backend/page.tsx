"use client";
import { useAccount, useSignMessage } from "wagmi";
import React, { useEffect, useState, useRef, useCallback } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaFlag, FaSpinner } from "react-icons/fa";
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
  quiz_name: string;
  wallet_address: string;
  source_url?: string;
  is_active: boolean;
  is_flagged: boolean;
  is_featured: boolean;
  created_at: string;
  quiz_data: Record<string, unknown>;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

const BackendDashboard = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [showArchiveAlert, setShowArchiveAlert] = useState<{quizId: string, archive: boolean} | null>(null);
  const jsonDisplayRef = useRef<HTMLTableCellElement>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      if (data.isAuthenticated) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
  } catch {
      setAuthStatus('unauthenticated');
      setError("Session check failed.");
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      checkAuthStatus();
    } else {
      setAuthStatus('unauthenticated');
    }
  }, [isConnected, checkAuthStatus]);

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/get-all-quizzes");
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
            setAuthStatus('unauthenticated');
        }
        throw new Error(errorData.error || "Failed to fetch quizzes");
      }
      const data = await response.json();
      setQuizzes(data);
  } catch {
  setError("An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchQuizzes();
    }
  }, [authStatus, fetchQuizzes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jsonDisplayRef.current && !jsonDisplayRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('button') || !target.closest('button')?.textContent?.includes('JSON')) {
          setExpandedQuizId(null);
        }
      }
    };

    if (expandedQuizId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedQuizId]);

  const handleLogin = async () => {
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }
    setError(null);
    try {
        const message = `Log in to Capybility Admin Dashboard at ${new Date().toISOString()}`;
        const signature = await signMessageAsync({ message });

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature, message }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            setAuthStatus('authenticated');
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (err) {
        setError((err as Error).message);
    }
  };

  const handleLogout = async () => {
  setError(null);
  try {
    await fetch('/api/logout', { method: 'POST' });
    setAuthStatus('unauthenticated');
    setQuizzes([]);
  } catch {
    setError("Logout failed.");
  }
  };

  const handleArchive = async () => {
    if (!showArchiveAlert) return;
    const { quizId, archive } = showArchiveAlert;
    setError(null);
    try {
      const response = await fetch('/api/archive-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, archive }),
      });

      if (!response.ok) {
        const data = await response.json();
        if(response.status === 401) setAuthStatus('unauthenticated');
        throw new Error(data.error || 'Failed to update quiz status');
      }

      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, is_active: !archive } : q));
      setShowArchiveAlert(null);

    } catch (error) {
      console.error("Error archiving quiz:", error);
      setError((error as Error).message);
    }
  };

  const handleToggleStatus = async (quizId: string, field: 'is_flagged' | 'is_featured') => {
    setError(null);
    try {
      const response = await fetch('/api/toggle-quiz-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, field }),
      });

      const data = await response.json();
      if (!response.ok) {
        if(response.status === 401) setAuthStatus('unauthenticated');
        throw new Error(data.error || `Failed to toggle ${field}`);
      }

      setQuizzes(quizzes.map(q => 
        q.id === quizId ? { ...q, [field]: data.newValue } : q
      ));

    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
      setError((error as Error).message);
    }
  };

  const toggleExpand = (quizId: string) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
  };


  const hasEduchainExpertTags = (quiz: Quiz): boolean => {
    const tags = quiz.quiz_data?.tags;
    if (!tags) return false;

    const requiredTags = ['educhain', 'edu chain'];
    
    let tagArray: string[] = [];
    if (Array.isArray(tags)) {
      tagArray = tags.map(tag => String(tag).toLowerCase());
    } else if (typeof tags === 'string') {
      tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
    }

    return requiredTags.some(reqTag => tagArray.includes(reqTag));
  };

  const truncate = (str: string | null | undefined, length: number): string => {
    if (!str) return '';
    return str.length > length ? `${str.substring(0, length)}...` : str;
  }

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please connect your wallet to access the admin dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (authStatus === 'loading') {
    return (
        <MainLayout>
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-4xl" />
            </div>
        </MainLayout>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Admin Authentication</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p>Please log in with the admin wallet to manage quizzes.</p>
              <Button onClick={handleLogin}>Login with Wallet</Button>
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Authenticated View
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Backend Dashboard</h1>
          <Button onClick={handleLogout} variant="destructive">Logout</Button>
        </div>

        {error && (
             <Card className="bg-red-100 border-red-500 mb-4">
                <CardHeader>
                <CardTitle className="text-red-700">An Error Occurred</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-red-600">{error}</p>
                </CardContent>
            </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Quizzes ({quizzes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quizzes.map((quiz) => (
                      <React.Fragment key={quiz.id}>
                        <tr className={`${hasEduchainExpertTags(quiz) ? 'text-blue-600' : ''} ${quiz.is_featured ? 'bg-yellow-100' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/doquiz/${quiz.id}`} className="hover:underline" target="_blank">
                              {truncate(quiz.quiz_name, 40)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{truncate(quiz.wallet_address, 15)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {quiz.source_url ? (
                              <a href={quiz.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Link
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quiz.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {quiz.is_active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button onClick={() => toggleExpand(quiz.id)} size="sm" variant="outline">JSON</Button>
                            <Button onClick={() => setShowArchiveAlert({quizId: quiz.id, archive: quiz.is_active})} size="sm" variant={quiz.is_active ? 'destructive' : 'default'}>
                              {quiz.is_active ? 'Archive' : 'Unarchive'}
                            </Button>
                            <Button onClick={() => handleToggleStatus(quiz.id, 'is_flagged')} size="sm" variant="outline" className="p-2">
                              <FaFlag className={quiz.is_flagged ? 'text-red-500' : 'text-black'} />
                            </Button>
                             <Button onClick={() => handleToggleStatus(quiz.id, 'is_featured')} size="sm" variant={quiz.is_featured ? 'secondary' : 'outline'}>
                              {quiz.is_featured ? 'Unfeature' : 'Feature'}
                            </Button>
                          </td>
                        </tr>
                        {expandedQuizId === quiz.id && (
                          <tr>
                            <td colSpan={5} className="p-4 bg-gray-50" ref={jsonDisplayRef}>
                              <h4 className="font-bold mb-2">Quiz Data JSON</h4>
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-96">
                                {JSON.stringify(quiz.quiz_data, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {showArchiveAlert && (
          <AlertDialog open onOpenChange={() => setShowArchiveAlert(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will {showArchiveAlert.archive ? 'archive' : 'unarchive'} the quiz. 
                  {showArchiveAlert.archive ? ' Archived quizzes are not visible to users.' : ' Unarchived quizzes will become visible to users again.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </MainLayout>
  );
};

export default BackendDashboard;
