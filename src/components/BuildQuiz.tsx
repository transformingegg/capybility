"use client";
import { useState, useEffect } from "react";

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
}

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

export default function BuildQuiz({ quizJson, onQuizUpdated }: BuildQuizProps) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizName, setQuizName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{ [key: string]: boolean }>({});
  const [editingChoice, setEditingChoice] = useState<{ [key: string]: boolean }>({});
  const [editingAnswer, setEditingAnswer] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string }>({});
  const [editingName, setEditingName] = useState(false);
  const [editingTags, setEditingTags] = useState(false);

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

  const handleChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuiz = [...quiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setQuiz(newQuiz);
    onQuizUpdated(newQuiz, quizName, tags);
  };

  const handleNameChange = (newName: string) => {
    setQuizName(newName);
    onQuizUpdated(quiz, newName, tags);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    onQuizUpdated(quiz, quizName, newTags);
  };

  const toggleEdit = (questionIndex: number, choiceIndex?: number) => {
    const key = `${questionIndex}${choiceIndex !== undefined ? `-${choiceIndex}` : ''}`;
    if (choiceIndex !== undefined) {
      setEditingChoice(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    } else {
      setEditingQuestion(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const toggleEditAnswer = (questionIndex: number) => {
    const key = questionIndex.toString();
    setEditingAnswer(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChoiceEdit = (questionIndex: number, choiceIndex: number, value: string) => {
    const newQuiz = [...quiz];
    newQuiz[questionIndex].choices[choiceIndex] = value;
    setQuiz(newQuiz);
    onQuizUpdated(newQuiz, quizName, tags);
  };

  const validOptions = ['A', 'B', 'C', 'D'];

  const handleAnswerEdit = (questionIndex: number, value: string) => {
    const key = questionIndex.toString();
    const upperValue = value.toUpperCase();

    if (validOptions.includes(upperValue)) {
      const newIndex = validOptions.indexOf(upperValue);
      handleChange(questionIndex, "correctAnswer", newIndex);
      setEditingAnswer(prev => ({
        ...prev,
        [key]: false,
      }));
      setError(prev => ({ ...prev, [key]: "" }));
    } else {
      setError(prev => ({
        ...prev,
        [key]: "Please enter A, B, C, or D.",
      }));
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Build Quiz</h2>
      
      {/* Quiz Name Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-grow">
            <h3 className="text-lg font-semibold">Quiz Name:</h3>
            {editingName ? (
              <input
                type="text"
                value={quizName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                className="flex-1 ml-2 p-1 border rounded"
                autoFocus
              />
            ) : (
              <span className="ml-2">{quizName}</span>
            )}
          </div>
          <button
            onClick={() => setEditingName(true)}
            className="text-blue-500 hover:text-blue-700 ml-4"
            aria-label="Edit quiz name"
          >
            <EditIcon />
          </button>
        </div>
      </div>

      {/* Tags Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Tags:</h3>
          <button
            onClick={() => setEditingTags(!editingTags)}
            className="text-blue-500 hover:text-blue-700"
            aria-label="Edit tags"
          >
            {editingTags ? (
              <span>Done</span>
            ) : (
              <EditIcon />
            )}
          </button>
        </div>
        {editingTags ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => {
                    const newTags = [...tags];
                    newTags[index] = e.target.value;
                    handleTagsChange(newTags);
                  }}
                  className="p-1 border rounded"
                />
                <button
                  onClick={() => {
                    const newTags = tags.filter((_, i) => i !== index);
                    handleTagsChange(newTags);
                  }}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => handleTagsChange([...tags, ""])}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              + Add Tag
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Questions Section */}
      {quiz.map((question, qIndex) => {
        const editKey = qIndex.toString();

        return (
          <div key={qIndex} className="mb-6 p-4 border rounded">
            <div className="mb-4">
              {editingQuestion[editKey] ? (
                <textarea
                  value={question.question}
                  onChange={(e) => handleChange(qIndex, "question", e.target.value)}
                  onBlur={() => toggleEdit(qIndex)}
                  className="w-full p-2 border rounded"
                  autoFocus
                />
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{question.question}</h3>
                  <button
                    onClick={() => toggleEdit(qIndex)}
                    className="text-blue-500 hover:text-blue-700"
                    aria-label="Edit question"
                  >
                    <EditIcon />
                  </button>
                </div>
              )}
            </div>

            <div className="ml-4">
              {question.choices.map((choice, cIndex) => (
                <div key={cIndex} className="mb-2 flex items-center">
                  <span className="mr-2">{String.fromCharCode(65 + cIndex)}.</span>
                  {editingChoice[`${qIndex}-${cIndex}`] ? (
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => handleChoiceEdit(qIndex, cIndex, e.target.value)}
                      onBlur={() => toggleEdit(qIndex, cIndex)}
                      className="flex-1 p-1 border rounded"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center justify-between flex-1">
                      <span>{choice}</span>
                      <button
                        onClick={() => toggleEdit(qIndex, cIndex)}
                        className="text-blue-500 hover:text-blue-700"
                        aria-label="Edit choice"
                      >
                        <EditIcon />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p>Correct Answer:</p>
                  {editingAnswer[editKey] ? (
                    <div className="ml-2">
                      <input
                        type="text"
                        defaultValue={String.fromCharCode(65 + question.correctAnswer)}
                        onChange={(e) => handleAnswerEdit(qIndex, e.target.value)}
                        onBlur={() => setEditingAnswer(prev => ({ ...prev, [editKey]: false }))}
                        className="w-16 p-1 border rounded"
                        autoFocus
                      />
                      {error[editKey] && (
                        <p className="text-red-500 text-sm">{error[editKey]}</p>
                      )}
                    </div>
                  ) : (
                    <span className="ml-2">
                      {String.fromCharCode(65 + question.correctAnswer)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleEditAnswer(qIndex)}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label="Edit answer"
                >
                  <EditIcon />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}