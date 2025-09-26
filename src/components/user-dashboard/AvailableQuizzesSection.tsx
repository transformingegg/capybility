"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  const [featuredQuizzes, setFeaturedQuizzes] = useState<Quiz[]>([]);
  const [searchQuizzes, setSearchQuizzes] = useState<Quiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState({ featured: true, search: false, all: false });
  const [activeTab, setActiveTab] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("Educhain, Edu Chain");
  const [currentPage, setCurrentPage] = useState({ featured: 1, search: 1, all: 1 });
  const quizzesPerPage = 10;

  // Fetch featured quizzes on component load
  useEffect(() => {
    const fetchFeaturedQuizzes = async () => {
      if (!address) return;

      try {
        const response = await fetch(`/api/get-featured-quizzes?address=${address}`);
        const data = await response.json();
        if (data.success) {
          setFeaturedQuizzes(data.quizzes);
        } else {
          console.error("Failed to fetch featured quizzes:", data.error);
        }
      } catch (error) {
        console.error("Error fetching featured quizzes:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, featured: false }));
      }
    };

    fetchFeaturedQuizzes();
  }, [address]);

  // Search quizzes when search term changes or search tab is activated
  useEffect(() => {
    const searchQuizzesAsync = async () => {
      if (!address || !searchTerm.trim()) {
        setSearchQuizzes([]);
        setIsLoading(prev => ({ ...prev, search: false }));
        return;
      }

      if (activeTab === "search") {
        setIsLoading(prev => ({ ...prev, search: true }));
        try {
          const response = await fetch(`/api/search-quizzes?address=${address}&search=${encodeURIComponent(searchTerm.trim())}`);
          const data = await response.json();
          if (data.success) {
            setSearchQuizzes(data.quizzes);
          } else {
            console.error("Failed to search quizzes:", data.error);
          }
        } catch (error) {
          console.error("Error searching quizzes:", error);
        } finally {
          setIsLoading(prev => ({ ...prev, search: false }));
        }
      }
    };

    const timeoutId = setTimeout(searchQuizzesAsync, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [address, searchTerm, activeTab]);

  // Fetch all quizzes when all tab is activated
  useEffect(() => {
    const fetchAllQuizzes = async () => {
      if (!address || activeTab !== "all" || allQuizzes.length > 0) return;

      setIsLoading(prev => ({ ...prev, all: true }));
      try {
        const response = await fetch(`/api/get-all-available-quizzes?address=${address}`);
        const data = await response.json();
        if (data.success) {
          setAllQuizzes(data.quizzes);
        } else {
          console.error("Failed to fetch all quizzes:", data.error);
        }
      } catch (error) {
        console.error("Error fetching all quizzes:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, all: false }));
      }
    };

    fetchAllQuizzes();
  }, [address, activeTab, allQuizzes.length]);

  // Get current quizzes and pagination for active tab
  const getCurrentQuizzesAndPagination = () => {
    let quizzes: Quiz[];
    let loading: boolean;
    let page: number;
    
    switch (activeTab) {
      case "search":
        quizzes = searchQuizzes;
        loading = isLoading.search;
        page = currentPage.search;
        break;
      case "all":
        quizzes = allQuizzes;
        loading = isLoading.all;
        page = currentPage.all;
        break;
      default: // featured
        quizzes = featuredQuizzes;
        loading = isLoading.featured;
        page = currentPage.featured;
    }

    const indexOfLastQuiz = page * quizzesPerPage;
    const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
    const currentQuizzes = quizzes.slice(indexOfFirstQuiz, indexOfLastQuiz);
    const totalPages = Math.ceil(quizzes.length / quizzesPerPage);

    return { currentQuizzes, totalPages, loading, page, totalQuizzes: quizzes.length };
  };

  const { currentQuizzes, totalPages, loading, page, totalQuizzes } = getCurrentQuizzesAndPagination();

  const paginate = (pageNumber: number) => {
    setCurrentPage(prev => ({ ...prev, [activeTab]: pageNumber }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="all">All Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-4">
            <div className="text-sm text-gray-600">
              Showing featured quizzes only
            </div>
            {renderQuizTable()}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by quiz name or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {renderQuizTable()}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="text-sm text-gray-600">
              All available quizzes ordered by most recent
            </div>
            {renderQuizTable()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderQuizTable() {
    if (loading) {
      return <p>Loading quizzes...</p>;
    }

    if (totalQuizzes === 0) {
      return (
        <p className="text-center py-8 text-gray-500">
          {activeTab === "search" && searchTerm.trim() 
            ? `No quizzes found matching "${searchTerm}"` 
            : "No quizzes available at the moment."}
        </p>
      );
    }

    return (
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
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {quiz.quiz_name || quiz.quiz_data.quizName || "Untitled Quiz"}
                    </span>
                    {quiz.quiz_data.tags && quiz.quiz_data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {quiz.quiz_data.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {quiz.quiz_data.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{quiz.quiz_data.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
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
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              onClick={() => paginate(page - 1)}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages} ({totalQuizzes} total quizzes)
            </span>
            <Button
              onClick={() => paginate(page + 1)}
              disabled={page === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </>
    );
  }
}