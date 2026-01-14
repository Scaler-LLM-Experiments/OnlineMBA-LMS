/**
 * Practice Exam Attempt Page - Apple Aesthetic Redesign
 * FIXED: Dark mode with solid background and visible question text
 * NOTE: This is for practice exams only - no proctoring features
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Save,
  Send,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  Home,
  XCircle
} from 'lucide-react';
import {
  getExamById,
  startExamAttempt,
  saveAnswer as saveAnswerAPI,
  submitExam as submitExamAPI,
  type Exam
} from '../services/examApi';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface Answer {
  questionId: string;
  answer: string;
  flagged: boolean;
  submitted: boolean;
}

const PracticeExamAttempt: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { student } = useAuth();

  // Exam State
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // UI State
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Exam
  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await getExamById(examId!);
      if (response.success && response.data) {
        const examData = response.data;
        const normalized = {
          ...examData,
          examId: examData['Exam ID'] || examData.examId,
          examTitle: examData['Exam Title'] || examData.examTitle,
          duration: examData['Duration (minutes)'] || examData.duration,
          questions: examData.questions || [],
          settings: examData.settings
        };
        setExam(normalized);
        setTimeRemaining((normalized.duration || 60) * 60);

        const initialAnswers = new Map<string, Answer>();
        (normalized.questions || []).forEach((q: any) => {
          initialAnswers.set(q.questionId || '', {
            questionId: q.questionId || '',
            answer: '',
            flagged: false,
            submitted: true // Practice exams don't need submit restrictions
          });
        });
        setAnswers(initialAnswers);

        const attemptResponse = await startExamAttempt(
          normalized.examId,
          student?.name || student?.email || 'Student'
        );

        if (attemptResponse.success) {
          const attemptIdValue = attemptResponse.data?.attemptId || attemptResponse.attemptId;
          if (!attemptIdValue) {
            throw new Error('No attempt ID returned from backend');
          }
          setAttemptId(attemptIdValue);
        } else {
          throw new Error(attemptResponse.message || 'Failed to start exam attempt');
        }
      }
    } catch (err) {
      console.error('Error loading exam:', err);
      alert('Failed to start exam. Please try again.');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (exam && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [exam, timeRemaining]);

  // Navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Answer Handling
  const handleAnswerChange = async (questionId: string, answer: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...existing!,
        answer
      });
      return newAnswers;
    });

    if (attemptId && examId) {
      try {
        await saveAnswerAPI(attemptId, examId, questionId, answer);
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }
  };

  const handleToggleFlag = (questionId: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...existing!,
        flagged: !existing!.flagged
      });
      return newAnswers;
    });
  };

  // Submit
  const handleAutoSubmit = () => {
    if (exam?.settings?.autoSubmitOnTimeUp) {
      handleSubmit(true);
    } else {
      alert('Time is up! Please submit your exam.');
    }
  };

  const handleSubmit = async (forced: boolean = false) => {
    if (!forced) {
      setShowSubmitConfirm(true);
      return;
    }

    if (!attemptId || !examId) {
      alert('Exam session error. Please try again.');
      return;
    }

    setSubmitting(true);

    try {
      const timeSpent = ((exam?.duration || 0) * 60) - timeRemaining;
      const answersArray = Array.from(answers.values());

      const response = await submitExamAPI(
        attemptId,
        examId,
        answersArray,
        [],
        timeSpent
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit exam');
      }

      if ((window as any).examScreenStream) {
        const stream = (window as any).examScreenStream as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      setTimeout(() => {
        navigate(`/exams/result/${attemptId}`);
      }, 1000);

    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColorClass = (): string => {
    if (timeRemaining < 300) return 'text-red-600 dark:text-red-400';
    if (timeRemaining < 600) return 'text-amber-600 dark:text-amber-400';
    return 'text-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted" />
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">Exam Not Available</h3>
          <p className="text-muted-foreground mb-8">This exam could not be loaded. Please try again or contact support.</p>
          <button
            onClick={() => navigate('/exams')}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-all shadow-sm font-medium inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex] as any;
  const currentAnswer = answers.get(currentQuestion.questionId || '');
  const answeredCount = Array.from(answers.values()).filter(a => a.answer).length;
  const flaggedCount = Array.from(answers.values()).filter(a => a.flagged).length;
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Top Bar - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Exam Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/exams')}
                className="p-2 rounded-xl hover:bg-muted/80 transition-all active:scale-95"
                title="Exit exam"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">{exam.examTitle}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
                  <span className="text-border">•</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
              </div>
            </div>

            {/* Center: Timer */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              timeRemaining < 300 
                ? 'bg-red-50/90 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/50' 
                : 'bg-card/90 border-border'
            }`}>
              <Clock className={`w-5 h-5 ${getTimeColorClass()}`} />
              <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight ${getTimeColorClass()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => {
                  const newMode = !isDarkMode;
                  setIsDarkMode(newMode);
                  if (newMode) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }}
                className="p-3 rounded-xl bg-muted/80 hover:bg-muted transition-all active:scale-95 border border-border"
                title="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>

              {/* Submit Button */}
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted/30">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[105px] flex h-screen">
        {/* Question Panel */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'mr-96' : 'mr-0'}`}>
          <div className="max-w-4xl mx-auto p-6 pb-24">
            {/* Floating Question Card - FIXED BACKGROUND */}
            <div className="bg-card backdrop-blur-sm rounded-3xl border border-border shadow-xl p-10 mb-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {currentQuestion.questionType?.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/10">
                      {currentQuestion.marks} marks
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFlag(currentQuestion.questionId)}
                  className={`p-3 rounded-2xl transition-all active:scale-95 border shadow-sm ${
                    currentAnswer?.flagged
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 shadow-amber-200/50 dark:shadow-amber-900/30'
                      : 'bg-muted text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 border-border hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <Flag className="w-5 h-5" fill={currentAnswer?.flagged ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Question Text - FIXED TO BE VISIBLE IN DARK MODE */}
              <div
                className="mb-8 text-lg leading-relaxed text-foreground"
                style={{
                  color: 'inherit',
                  // Force all child elements to inherit color
                }}
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questionText?.replace(
                    /<([^>]+)>/g,
                    (_match: string, p1: string) => {
                      // Remove any inline color styles from HTML
                      const cleaned = p1.replace(/color:\s*[^;]+;?/gi, '');
                      return `<${cleaned}>`;
                    }
                  ) || ''
                }}
              />

              {/* Question Image */}
              {currentQuestion.questionImageUrl && (
                <div className="mb-8">
                  <img
                    src={currentQuestion.questionImageUrl}
                    alt="Question"
                    className="max-w-2xl w-full rounded-2xl border border-border shadow-lg"
                  />
                </div>
              )}

              {/* Answer Options - MCQ */}
              {(currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'MCQ_IMAGE') && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((option) => {
                      const optionKey = `option${option}` as keyof typeof currentQuestion;
                      const optionValue = currentQuestion[optionKey];
                      if (!optionValue) return null;

                      const isSelected = currentAnswer?.answer === option;

                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswerChange(currentQuestion.questionId, option)}
                          className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                              : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary shadow-lg shadow-primary/20'
                                : 'border-muted-foreground/30 bg-background'
                            }`}>
                              {isSelected && (
                                <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                            <span className="font-semibold text-foreground text-base">{option}.</span>
                            <span className="text-foreground">{optionValue}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear Answer Button - Shows only when an answer is selected */}
                  {currentAnswer?.answer && (
                    <button
                      onClick={() => handleAnswerChange(currentQuestion.questionId, '')}
                      className="px-5 py-2.5 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/50 font-medium transition-all text-sm flex items-center gap-2 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear Answer
                    </button>
                  )}
                </div>
              )}

              {/* Answer Input - Short Answer */}
              {currentQuestion.questionType === 'SHORT_ANSWER' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-5 py-4 rounded-2xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base shadow-sm"
                  />
                </div>
              )}

              {/* Answer Textarea - Long Answer */}
              {currentQuestion.questionType === 'LONG_ANSWER' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Your Answer
                  </label>
                  <textarea
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                    placeholder="Type your detailed answer here..."
                    rows={10}
                    className="w-full px-5 py-4 rounded-2xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none outline-none text-base shadow-sm leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3.5 rounded-2xl bg-card backdrop-blur-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2.5 text-foreground shadow-sm font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={() => handleAnswerChange(currentQuestion.questionId, currentAnswer?.answer || '')}
                className="px-8 py-3.5 rounded-2xl bg-muted backdrop-blur-sm border border-border text-foreground hover:bg-muted/80 transition-all active:scale-95 flex items-center gap-2.5 shadow-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Answer
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="px-6 py-3.5 rounded-2xl bg-card backdrop-blur-sm border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2.5 text-foreground shadow-sm font-medium"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar - FIXED BACKGROUND */}
        {sidebarOpen && (
          <div className="fixed right-0 top-[105px] bottom-0 w-96 bg-background border-l border-border overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Overview</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all active:scale-95"
                  title="Hide sidebar"
                >
                  <PanelRightClose className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                  <p className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">Answered</p>
                  <p className="text-3xl font-bold text-primary">{answeredCount}</p>
                  <p className="text-xs text-primary/70 mt-1">of {exam.questions.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-2 uppercase tracking-wider">Flagged</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{flaggedCount}</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">for review</p>
                </div>
              </div>

              {/* Question Grid */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">All Questions</h3>
                <div className="grid grid-cols-6 gap-2">
                  {exam.questions.map((q: any, index: number) => {
                    const answer = answers.get(q.questionId || '');
                    const isAnswered = !!answer?.answer;
                    const isFlagged = answer?.flagged;
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={index}
                        onClick={() => handleJumpToQuestion(index)}
                        className={`aspect-square rounded-xl font-semibold text-sm transition-all active:scale-95 relative shadow-sm ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105 shadow-lg shadow-primary/30'
                            : isAnswered
                            ? 'bg-primary/15 text-primary border-2 border-primary/30 hover:bg-primary/25 hover:scale-105'
                            : 'bg-muted text-muted-foreground border-2 border-border hover:bg-muted/80 hover:scale-105'
                        }`}
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag
                            className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 drop-shadow-md"
                            fill="currentColor"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Toggle Button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 w-12 h-32 bg-primary text-primary-foreground shadow-2xl hover:shadow-primary/30 hover:w-16 transition-all z-40 flex items-center justify-center rounded-l-2xl group"
            title="Show sidebar"
          >
            <PanelRightOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Enhanced Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl max-w-md w-full p-8 border-2 border-border shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3 text-center">Submit Exam?</h3>
            <p className="text-muted-foreground mb-8 text-center leading-relaxed">
              You have answered <span className="font-semibold text-foreground">{answeredCount} out of {exam.questions.length}</span> questions. 
              {answeredCount < exam.questions.length && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 text-sm">
                  {exam.questions.length - answeredCount} question(s) remain unanswered.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-border bg-background hover:bg-muted transition-all text-foreground font-semibold active:scale-95"
              >
                Review Answers
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmit(true);
                }}
                className="flex-1 px-6 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-xl shadow-primary/30 active:scale-95"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeExamAttempt;