/**
 * Exam Result Page
 * Displays student's exam results with score, answers, and violations
 * Apple-inspired sleek design with comprehensive result breakdown
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  TrendingUp,
  FileText,
  Eye,
  ArrowLeft,
  Trophy,
  Loader,
  Flag,
  Play
} from 'lucide-react';
import { getExamResult, getExamById, type Exam } from '../services/examApi';

interface Answer {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType?: string;
  answer: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  marks: number;
  marksAwarded: number;
  flagged: boolean;
}

interface Violation {
  timestamp: string;
  type: string;
  details: string;
  severity: string;
}

interface ExamResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  isPractice?: boolean;
  studentEmail: string;
  studentName: string;
  status: string;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  timeSpent: number;
  startTime: string;
  endTime: string;
  violationCount: number;
  answers: Answer[];
  violations: Violation[];
}

const ExamResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const response = await getExamResult(attemptId!);

      if (response.success && response.data) {
        console.log('Exam Result Data:', response.data);
        console.log('Answers:', response.data.answers);
        setResult(response.data);

        // Auto-expand answers for practice exams
        if (response.data.isPractice) {
          setShowAnswers(true);
        }

        // Load exam details
        const examResponse = await getExamById(response.data.examId);
        if (examResponse.success && examResponse.data) {
          const examData = examResponse.data;
          const normalized = {
            ...examData,
            examId: examData['Exam ID'] || examData.examId,
            examTitle: examData['Exam Title'] || examData.examTitle,
            settings: examData.settings
          };
          setExam(normalized);
        }
      }
    } catch (err) {
      console.error('Error loading result:', err);
      alert('Failed to load exam result');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Result not found
          </h3>
          <button
            onClick={() => navigate('/exams')}
            className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const canViewAnswers = result?.isPractice || exam?.settings?.showCorrectAnswers !== false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/exams')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Exams</span>
          </button>

          {result?.isPractice && (
            <button
              onClick={() => window.open(`/exams/${result.examId}/practice`, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg shadow-purple-600/30"
            >
              <Play className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          )}
        </div>

        {/* Result Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Header Banner */}
          <div className={`p-8 text-white ${
            result.isPassed
              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
              : 'bg-gradient-to-r from-red-600 to-orange-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {result.isPassed ? (
                    <Trophy className="w-8 h-8" />
                  ) : (
                    <AlertTriangle className="w-8 h-8" />
                  )}
                  <h1 className="text-3xl font-bold">
                    {result.isPassed ? 'Congratulations!' : 'Keep Trying!'}
                  </h1>
                </div>
                <p className="text-xl opacity-90">{result.examTitle}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold mb-1">{result.percentage.toFixed(1)}%</div>
                <div className="text-lg opacity-90">Grade: {getGrade(result.percentage)}</div>
              </div>
            </div>
          </div>

          {/* Score Overview */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Score</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {result.score}/{result.totalMarks}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Correct</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {result.correctAnswers}/{result.totalQuestions}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Wrong</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {result.wrongAnswers}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {formatTime(result.timeSpent)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Started At</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(result.startTime)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed At</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(result.endTime)}</p>
              </div>
            </div>

            {/* Violations Warning */}
            {result.violationCount > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      {result.violationCount} Violation{result.violationCount > 1 ? 's' : ''} Detected
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Proctoring violations were recorded during your exam. These will be reviewed by your instructor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View Answers Button */}
            {canViewAnswers && (
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showAnswers ? 'Hide Answers' : 'View Detailed Answers'}
              </button>
            )}
          </div>
        </div>

        {/* Answer Breakdown */}
        {showAnswers && canViewAnswers && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Answer Breakdown
              </h2>

              {!result.answers || result.answers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No answer data available.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please check the Exam_Answers sheet in your backend.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className={`p-6 rounded-xl border-2 ${
                      answer.isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : answer.answer
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Question {answer.questionNumber}
                        </span>
                        {answer.flagged && (
                          <Flag className="w-4 h-4 text-orange-500" fill="currentColor" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {answer.marks} marks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : answer.answer ? (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <div className="text-sm font-medium text-gray-500">Not Attempted</div>
                        )}
                      </div>
                    </div>

                    <div
                      className="prose prose-sm dark:prose-invert max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: answer.questionText }}
                    />

                    {answer.answer && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Your Answer:
                        </p>
                        <p className={`font-medium ${
                          answer.isCorrect
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {answer.answer}
                        </p>
                      </div>
                    )}

                    {(result?.isPractice || !answer.isCorrect) && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Correct Answer:
                        </p>
                        {answer.questionType === 'LONG_ANSWER' || answer.questionType === 'SHORT_ANSWER' ? (
                          <p className="font-medium text-gray-600 dark:text-gray-400 italic">
                            (Answers not available for descriptive questions)
                          </p>
                        ) : (
                          <p className="font-medium text-green-700 dark:text-green-300">
                            {answer.correctAnswer || 'N/A'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Marks Awarded: </span>
                        <span className={`font-semibold ${
                          answer.marksAwarded > 0
                            ? 'text-green-600 dark:text-green-400'
                            : answer.marksAwarded < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {answer.marksAwarded > 0 ? '+' : ''}{answer.marksAwarded} / {answer.marks}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* Violations List */}
        {result.violations && result.violations.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                Proctoring Violations
              </h2>

              <div className="space-y-3">
                {result.violations.map((violation, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            violation.severity === 'HIGH'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : violation.severity === 'MEDIUM'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {violation.severity}
                          </span>
                          <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                            {violation.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          {violation.details}
                        </p>
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {formatDateTime(violation.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResultPage;
