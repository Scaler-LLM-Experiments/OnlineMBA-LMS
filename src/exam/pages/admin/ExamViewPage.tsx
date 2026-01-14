/**
 * Admin Exam View Page
 * Read-only preview of exam with all details, questions, settings, and password configuration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  Settings,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Shield
} from 'lucide-react';
import { getExamById, type Exam, formatExamDateTime } from '../../services/examApi';

const ExamViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'questions' | 'settings' | 'password'>('overview');

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
        // Normalize field names
        const normalized = {
          ...examData,
          examId: examData['Exam ID'] || examData.examId,
          examTitle: examData['Exam Title'] || examData.examTitle,
          examType: examData['Exam Type'] || examData.examType,
          batch: examData.Batch || examData.batch,
          term: examData.Term || examData.term,
          domain: examData.Domain || examData.domain,
          subject: examData.Subject || examData.subject,
          description: examData.Description || examData.description,
          duration: examData['Duration (minutes)'] || examData.duration,
          totalMarks: examData['Total Marks'] || examData.totalMarks,
          passingMarks: examData['Passing Marks'] || examData.passingMarks,
          startDateTime: examData['Start DateTime'] || examData.startDateTime,
          endDateTime: examData['End DateTime'] || examData.endDateTime,
          instructions: examData.Instructions || examData.instructions,
          status: examData.Status || examData.status,
          passwordType: examData['Password Type'] || examData.passwordType,
          masterPassword: examData['Master Password'] || examData.masterPassword,
          totalQuestions: examData['Total Questions'] || examData.totalQuestions,
          settings: examData.settings,
          questions: examData.questions || []
        };
        setExam(normalized);
      } else {
        setError('Failed to load exam');
      }
    } catch (err) {
      setError('Failed to load exam');
      console.error('Error loading exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    return classes[status as keyof typeof classes] || classes.DRAFT;
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Exam not found'}
          </h3>
          <button
            onClick={() => navigate('/admin/exams')}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/exams')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exam.examTitle}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(exam.status || 'DRAFT')}`}>
                    {exam.status}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {exam.examType} • {exam.subject}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/admin/exams/edit/${exam.examId}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Exam
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview' as const, label: 'Overview', icon: FileText },
              { id: 'questions' as const, label: 'Questions', icon: BookOpen },
              { id: 'settings' as const, label: 'Settings', icon: Settings },
              { id: 'password' as const, label: 'Password', icon: Lock }
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-6 py-3 font-medium text-sm relative transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                  {activeSection === section.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 dark:bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Basic Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Exam Type</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.examType}</p>
                </div>
                {exam.batch && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Batch</label>
                    <p className="text-gray-900 dark:text-white mt-1">{exam.batch}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Term</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.term}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.domain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {exam.duration} minutes
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Marks</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.totalMarks}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Passing Marks</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.passingMarks || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Questions</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.totalQuestions || exam.questions?.length || 0}</p>
                </div>
              </div>

              {exam.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white mt-1">{exam.description}</p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date & Time</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {exam.startDateTime ? formatExamDateTime(exam.startDateTime) : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">End Date & Time</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {exam.endDateTime ? formatExamDateTime(exam.endDateTime) : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {exam.instructions && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructions</h3>
                <div
                  className="prose dark:prose-invert max-w-none text-gray-900 dark:text-white"
                  dangerouslySetInnerHTML={{ __html: exam.instructions }}
                />
              </div>
            )}
          </div>
        )}

        {/* Questions Section */}
        {activeSection === 'questions' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Questions ({exam.questions?.length || 0})
                </h3>
              </div>

              {!exam.questions || exam.questions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No questions added yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exam.questions.map((question: any, index: number) => (
                    <div key={question.questionId || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            Q{question.questionNumber || index + 1}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {question.questionType}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                          </span>
                          {question.negativeMarks > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              -{question.negativeMarks} negative
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            question.difficulty === 'Easy'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : question.difficulty === 'Hard'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div
                        className="prose dark:prose-invert max-w-none mb-4 text-gray-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: question.questionText }}
                      />

                      {/* Question Image */}
                      {question.questionImageUrl && (
                        <div className="mb-4">
                          <img
                            src={question.questionImageUrl}
                            alt="Question"
                            className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* Options (for MCQ types) */}
                      {(question.questionType === 'MCQ' || question.questionType === 'MCQ_IMAGE') && (
                        <div className="space-y-2 mb-4">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((option) => {
                            const optionKey = `option${option}` as keyof typeof question;
                            const optionValue = question[optionKey];
                            if (!optionValue) return null;

                            const isCorrect = question.correctAnswer === option;

                            return (
                              <div
                                key={option}
                                className={`p-3 rounded-lg border ${
                                  isCorrect
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {option}.
                                  </span>
                                  <span className={isCorrect ? 'text-green-900 dark:text-green-300' : 'text-gray-900 dark:text-white'}>
                                    {optionValue}
                                  </span>
                                  {isCorrect && (
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Answer Type Indicator (for non-MCQ types) */}
                      {(question.questionType === 'SHORT_ANSWER' || question.questionType === 'LONG_ANSWER') && (
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Answer Type: </span>
                            {question.questionType === 'SHORT_ANSWER' ? 'Short Answer (Text)' : 'Long Answer (Descriptive)'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {question.questionType === 'SHORT_ANSWER'
                              ? 'Students will provide a brief text response'
                              : 'Students will provide a detailed written response'}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Explanation:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Randomize Questions</span>
                  {exam.settings?.randomizeQuestions ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Randomize Options</span>
                  {exam.settings?.randomizeOptions ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Enable Rough Space</span>
                  {exam.settings?.enableRoughSpace ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Enable Negative Marking</span>
                  {exam.settings?.enableNegativeMarking ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {exam.settings?.enableNegativeMarking && (
                  <div className="pl-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Negative marks: {exam.settings.negativeMarksValue}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Show Results Immediately</span>
                  {exam.settings?.showResultsImmediately ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Show Correct Answers</span>
                  {exam.settings?.showCorrectAnswers ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Auto Submit on Time Up</span>
                  {exam.settings?.autoSubmitOnTimeUp ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="py-2">
                  <span className="text-gray-900 dark:text-white">Grace Period: </span>
                  <span className="text-gray-600 dark:text-gray-400">{exam.settings?.gracePeriod || 0} seconds</span>
                </div>
              </div>
            </div>

            {/* Proctoring Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Proctoring & Security
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Webcam Required</span>
                  {exam.settings?.proctoring?.webcamRequired ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Enforce Screensharing</span>
                  {exam.settings?.proctoring?.enforceScreensharing ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Allow Window Switching</span>
                  {exam.settings?.proctoring?.allowWindowSwitching ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Allow Tab Switching</span>
                  {exam.settings?.proctoring?.allowTabSwitching ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Fullscreen Mandatory</span>
                  {exam.settings?.proctoring?.fullscreenMandatory ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Alerts on Violation</span>
                  {exam.settings?.proctoring?.alertsOnViolation ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Allow Copy/Paste</span>
                  {exam.settings?.proctoring?.allowCopyPaste ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Allow Right Click</span>
                  {exam.settings?.proctoring?.allowRightClick ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Single Session Login</span>
                  {exam.settings?.proctoring?.singleSessionLogin ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-900 dark:text-white">Disqualify on Violation</span>
                  {exam.settings?.proctoring?.disqualifyOnViolation ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="py-2">
                  <span className="text-gray-900 dark:text-white">Max Violations Before Action: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {exam.settings?.proctoring?.maxViolationsBeforeAction || 0}
                  </span>
                </div>
                {exam.settings?.proctoring?.ipRestrictionEnabled && (
                  <div className="py-2">
                    <span className="text-gray-900 dark:text-white">Allowed IPs: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {exam.settings?.proctoring?.allowedIPs?.join(', ') || 'None'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Section */}
        {activeSection === 'password' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Password Type</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {exam.passwordType === 'SAME' ? 'Same Password for All Students' : 'Unique Passwords per Student'}
                  </p>
                </div>

                {exam.passwordType === 'SAME' && exam.masterPassword && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Master Password</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <code className="text-gray-900 dark:text-white font-mono">
                          {showPassword ? exam.masterPassword : '••••••••'}
                        </code>
                      </div>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {exam.passwordType === 'UNIQUE' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Unique passwords have been generated for each student
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          Students can access their individual passwords from their dashboard or via email.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamViewPage;
