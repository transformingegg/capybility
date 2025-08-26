"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomAlertDialog from "@/components/CustomAlertDialog";

interface QuizQuestion {
  question: string;
  choices: string[];
  correctAnswer: number;
}

interface QuizData {
  quizName: string;
  tags: string[];
  quiz: QuizQuestion[];
}

interface BuildQuizProps {
  quizJson: string;
  onQuizUpdated: (quiz: QuizQuestion[], quizName: string, tags: string[]) => void;
  isSubmittable: (isReady: boolean) => void;
}

const cardVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 200 : -200,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 200 : -200,
    transition: { duration: 0.3 },
  }),
};

export default function BuildQuiz({ quizJson, onQuizUpdated, isSubmittable }: BuildQuizProps) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizName, setQuizName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [buildStep, setBuildStep] = useState(0); // 0: Name, 1: Tags, 2-6: Questions, 7: Review
  const [direction, setDirection] = useState(1);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      setHeight(cardRef.current.offsetHeight);
    }
  }, [buildStep, quiz, quizName, tags]); // Re-measure on step and data changes

  useEffect(() => {
    try {
      const parsedData: QuizData = JSON.parse(quizJson);
      setQuiz(parsedData.quiz || []);
      setQuizName(parsedData.quizName || "");
      setTags(parsedData.tags || []);
    } catch (e) {
      console.error("Error parsing quiz JSON:", e);
    }
  }, [quizJson]);

  useEffect(() => {
    // A quiz is submittable only when it has 5 questions and the user is on the final review step.
    isSubmittable(quiz.length === 5 && buildStep === 7);
  }, [quiz.length, buildStep, isSubmittable]);

  const handleNext = () => {
    setDirection(1);
    setBuildStep((prev) => Math.min(prev + 1, 7));
  };

  const handlePrev = () => {
    setDirection(-1);
    setBuildStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGoToStep = (step: number) => {
    setDirection(step > buildStep ? 1 : -1);
    setBuildStep(step);
  };

  const handleQuizNameChange = (newName: string) => {
    setQuizName(newName);
    onQuizUpdated(quiz, newName, tags);
  }

  const handleQuestionTextChange = (qIndex: number, newText: string) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].question = newText;
    setQuiz(newQuiz);
    onQuizUpdated(newQuiz, quizName, tags);
  };

  const handleChoiceTextChange = (qIndex: number, cIndex: number, newText: string) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].choices[cIndex] = newText;
    setQuiz(newQuiz);
    onQuizUpdated(newQuiz, quizName, tags);
  };

  const handleCorrectAnswerChange = (qIndex: number, newCorrectAnswer: string) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].correctAnswer = parseInt(newCorrectAnswer, 10);
    setQuiz(newQuiz);
    onQuizUpdated(newQuiz, quizName, tags);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      onQuizUpdated(quiz, quizName, newTags);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags);
    onQuizUpdated(quiz, quizName, newTags);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestionToDelete(qIndex);
    setIsAlertOpen(true);
  };

  const confirmRemoveQuestion = () => {
    if (questionToDelete !== null) {
      const newQuiz = [...quiz];
      newQuiz[questionToDelete] = {
        question: "New Question",
        choices: ["Choice A", "Choice B", "Choice C", "Choice D"],
        correctAnswer: 0,
      };
      setQuiz(newQuiz);
      onQuizUpdated(newQuiz, quizName, tags);
      setQuestionToDelete(null);
    }
    setIsAlertOpen(false);
  };

  const totalSteps = 7; // Name, Tags, 5 Questions
  const progress = Math.round((buildStep / totalSteps) * 100);

  return (
    <div className="overflow-hidden relative">
      <div className="mb-4">
        <div className="relative h-2 bg-gray-200 rounded-full">
          <motion.div 
            className="absolute top-0 left-0 h-2 bg-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-center mt-1 text-gray-600">Step {buildStep + 1} of {totalSteps + 1}</p>
      </div>
      <motion.div 
        className="relative"
        animate={{ height }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={buildStep}
            ref={cardRef}
            custom={direction}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute w-full"
          >
            {/* Step 0: Quiz Name */}
            {buildStep === 0 && (
              <Card className="bg-slate-50 dark:bg-slate-900 border-yellow-400">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-yellow-400">Quiz Name</CardTitle>
                    <CardDescription>Give your quiz a catchy name.</CardDescription>
                  </div>
                  <Button variant="link" onClick={() => handleGoToStep(7)} className="text-yellow-400">Skip to Review</Button>
                </CardHeader>
                <CardContent>
                  <Input
                    value={quizName}
                    onChange={(e) => handleQuizNameChange(e.target.value)}
                    placeholder="e.g., 'The Wonders of the Cosmos'"
                    className="text-lg"
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleNext} className="bg-yellow-400 hover:bg-yellow-500 text-black">Next</Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 1: Tags */}
            {buildStep === 1 && (
              <Card className="bg-slate-50 dark:bg-slate-900 border-yellow-400">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-yellow-400">Tags</CardTitle>
                    <CardDescription>Add some tags to help others find your quiz.</CardDescription>
                  </div>
                  <Button variant="link" onClick={() => handleGoToStep(7)} className="text-yellow-400">Skip to Review</Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-2 font-bold hover:text-red-500">&times;</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    />
                    <Button onClick={handleAddTag} className="bg-yellow-400 hover:bg-yellow-500 text-black">Add</Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev} className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">Previous</Button>
                  <Button onClick={handleNext} className="bg-yellow-400 hover:bg-yellow-500 text-black">Next</Button>
                </CardFooter>
              </Card>
            )}

            {/* Steps 2-6: Questions */}
            {buildStep >= 2 && buildStep <= 6 && quiz[buildStep - 2] && (
              <Card className="bg-slate-50 dark:bg-slate-900 border-yellow-400">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                      <CardTitle className="text-yellow-400">Question {buildStep - 1}</CardTitle>
                      <CardDescription>Edit the question and choices below.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="link" onClick={() => handleGoToStep(7)} className="text-yellow-400">Skip to Review</Button>
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveQuestion(buildStep - 2)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${buildStep - 2}`}>Question Text</Label>
                    <Input
                      id={`question-${buildStep - 2}`}
                      value={quiz[buildStep - 2].question}
                      onChange={(e) => handleQuestionTextChange(buildStep - 2, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Choices</Label>
                    <div className="space-y-2">
                      {quiz[buildStep - 2].choices.map((choice, cIndex) => (
                        <div key={cIndex} className="flex items-center gap-2">
                          <Label htmlFor={`choice-${buildStep - 2}-${cIndex}`} className="w-6 text-right">{String.fromCharCode(65 + cIndex)}.</Label>
                          <Input
                            id={`choice-${buildStep - 2}-${cIndex}`}
                            value={choice}
                            onChange={(e) => handleChoiceTextChange(buildStep - 2, cIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`correct-answer-${buildStep - 2}`}>Correct Answer</Label>
                    <Select
                      value={quiz[buildStep - 2].correctAnswer.toString()}
                      onValueChange={(value) => handleCorrectAnswerChange(buildStep - 2, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {quiz[buildStep - 2].choices.map((_, cIndex) => (
                          <SelectItem key={cIndex} value={cIndex.toString()}>
                            {String.fromCharCode(65 + cIndex)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev} className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">Previous</Button>
                  <Button onClick={handleNext} className="bg-yellow-400 hover:bg-yellow-500 text-black">Next</Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 7: Final Review */}
            {buildStep === 7 && (
              <Card className="border-yellow-400">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Final Review</CardTitle>
                  <CardDescription>Review your quiz below. Go back to make changes or save to finish.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{quizName}</h3>
                    <Button variant="link" onClick={() => handleGoToStep(0)} className="text-yellow-400">Edit</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Tags</h4>
                      <Button variant="link" onClick={() => handleGoToStep(1)} className="text-yellow-400">Edit</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => <Badge key={index} variant="secondary">{tag}</Badge>)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {quiz.map((q, qIndex) => (
                      <div key={qIndex} className="p-3 border border-yellow-400 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{qIndex + 1}. {q.question}</p>
                            <ul className="list-none pl-5 mt-1">
                              {q.choices.map((c, cIndex) => (
                                <li key={cIndex} className={`text-sm ${cIndex === q.correctAnswer ? 'font-bold text-yellow-500' : ''}`}>
                                  {String.fromCharCode(65 + cIndex)}. {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Button variant="link" onClick={() => handleGoToStep(qIndex + 2)} className="text-yellow-400">Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev} className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">Previous</Button>
                  <p className="text-sm text-green-600">Ready to save!</p>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <CustomAlertDialog
        isOpen={isAlertOpen}
        onCancel={() => setIsAlertOpen(false)}
        onConfirm={confirmRemoveQuestion}
        title="Are you sure?"
        message="This will reset the question to a blank state. Your quiz must always have 5 questions. This action cannot be undone."
        confirmLabel="Reset Question"
        cancelLabel="Cancel"
        type="warning"
      />
    </div>
  );
}