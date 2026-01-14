/**
 * Student Exams Page
 * Displays available exams with lock/unlock states
 * Apple-inspired sleek design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Timer,
  Award
} from 'lucide-react';
import { getAllExams, getStudentExamAttempts, getStudentExamStatus, isExamLive, isExamUpcoming, getTimeUntilStart, formatExamDateTime, type Exam } from '../services/examApi';
import { useActivityTracker } from '../../hooks/useActivityTracker';

const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'expired'>('all');
  const [attempts, setAttempts] = useState<Map<string, any>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, 'Completed' | 'Disqualified'>>(new Map());
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Exams');
  }, [trackPageView]);

  useEffect(() => {
    loadExams();
    loadAttempts();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await getAllExams({ status: 'ACTIVE' });
      if (response.success) {
        const examsData = response.data || [];
        setExams(examsData);

        // Load statuses for all exams
        await loadStatuses(examsData);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const response = await getStudentExamAttempts();
      if (response.success && response.data) {
        const attemptsMap = new Map();
        response.data.forEach((attempt: any) => {
          const examId = attempt['Exam ID'] || attempt.examId;
          const status = attempt.Status || attempt.status;
          if (status === 'COMPLETED') {
            attemptsMap.set(examId, attempt);
          }
        });
        setAttempts(attemptsMap);
      }
    } catch (error) {
      console.error('Failed to load attempts:', error);
    }
  };

  const loadStatuses = async (examsData: Exam[]) => {
    try {
      const statusesMap = new Map<string, 'Completed' | 'Disqualified'>();

      // Fetch status for each exam in parallel
      await Promise.all(
        examsData.map(async (exam) => {
          try {
            const examAny = exam as any;
            const examId = examAny['Exam ID'] || exam.examId;

            if (examId) {
              const response = await getStudentExamStatus(examId);
              if (response.success && response.data?.status) {
                statusesMap.set(examId, response.data.status);
              }
            }
          } catch (err) {
            // Silently fail for individual exams
            console.error('Failed to load status for exam:', err);
          }
        })
      );

      setStatuses(statusesMap);
    } catch (error) {
      console.error('Failed to load exam statuses:', error);
    }
  };

  const getExamStatus = (exam: Exam): 'upcoming' | 'live' | 'expired' => {
    if (isExamLive(exam)) return 'live';
    if (isExamUpcoming(exam)) return 'upcoming';
    return 'expired';
  };

  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true;
    return getExamStatus(exam) === filter;
  });

  const handleExamClick = (exam: Exam) => {
    const examId = (exam as any)['Exam ID'] || exam.examId;
    const status = getExamStatus(exam);
    const isPractice = (exam as any)?.['Is Practice'] === 'Yes' || (exam as any)?.isPractice === true;
    const studentStatus = statuses.get(examId);

    console.log('Card clicked:', {
      examId,
      status,
      isPractice,
      studentStatus,
      statusesMap: Array.from(statuses.entries())
    });

    // Don't allow access to upcoming exams
    if (status === 'upcoming') {
      console.log('Blocked: Upcoming exam');
      return;
    }

    // Don't allow access to expired exams
    if (status === 'expired') {
      console.log('Blocked: Expired exam');
      return;
    }

    // Block clicks for completed/disqualified exams (except practice exams which can be retaken)
    if (studentStatus && !isPractice) {
      console.log('Blocked: Exam completed/disqualified (not practice)');
      // Card is not clickable - user must use the "View Results" button if available
      return;
    }

    console.log('Navigating to exam...');

    // Get the full URL to force opening in browser instead of PWA
    const baseUrl = window.location.origin;
    const examUrl = isPractice
      ? `${baseUrl}/exams/${examId}/practice`
      : `${baseUrl}/exams/${examId}/verify`;

    // Create a temporary anchor element and programmatically click it
    // This approach bypasses PWA URL handlers and forces browser to open in new tab
    const anchor = document.createElement('a');
    anchor.href = examUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    // Add to DOM, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Exams
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and attempt your scheduled exams
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'all' as const, label: 'All Exams' },
          { id: 'live' as const, label: 'Live Now' },
          { id: 'upcoming' as const, label: 'Upcoming' },
          { id: 'expired' as const, label: 'Expired' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No exams found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all'
              ? 'There are no active exams at the moment'
              : `No ${filter} exams available`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const examAny = exam as any;
            const examId = examAny['Exam ID'] || exam.examId || '';
            const examTitle = examAny['Exam Title'] || exam.examTitle || '';
            const examType = examAny['Exam Type'] || exam.examType || '';
            const subject = examAny.Subject || exam.subject || '';
            const duration = examAny['Duration (minutes)'] || exam.duration || 0;
            const totalMarks = examAny['Total Marks'] || exam.totalMarks || 0;
            const totalQuestions = examAny['Total Questions'] || exam.totalQuestions || 0;
            const startDateTime = examAny['Start DateTime'] || exam.startDateTime || '';
            const endDateTime = examAny['End DateTime'] || exam.endDateTime || '';

            const status = getExamStatus(exam);
            const isLocked = status === 'upcoming';
            const isLive = status === 'live';
            const hasAttempt = attempts.has(examId);
            const attempt = attempts.get(examId);
            const isPractice = examAny?.['Is Practice'] === 'Yes' || examAny?.isPractice === true;
            const viewResult = examAny?.['View Result'] || examAny?.viewResult || '';
            const canViewResult = viewResult === 'Yes' || isPractice; // Practice exams always show results
            const studentStatus = statuses.get(examId); // "Completed" | "Disqualified" | undefined
            const isCardClickable = !isLocked && (!studentStatus || isPractice);

            return (
              <div
                key={examId}
                onClick={() => handleExamClick(exam)}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isLocked
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                    : isCardClickable && isLive
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]'
                    : isCardClickable
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02]'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-default'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                  {isPractice && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Practice</span>
                    </div>
                  )}
                  {!isPractice && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      <Award className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Exam</span>
                    </div>
                  )}
                  {/* Time-based status */}
                  {isLocked ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Upcoming</span>
                    </div>
                  ) : isLive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-xs font-medium">Live Now</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-400 dark:bg-gray-600 text-white">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Expired</span>
                    </div>
                  )}

                  {/* Student attempt status - only show if student has attempted */}
                  {studentStatus && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                      studentStatus === 'Completed'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {studentStatus === 'Completed' ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="text-xs font-medium">{studentStatus}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isLive
                      ? 'bg-green-500 shadow-lg shadow-green-500/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {isLocked ? (
                      <Lock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    ) : isLive ? (
                      <Play className="w-6 h-6 text-white" />
                    ) : (
                      <Award className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {examType}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {examTitle}
                  </h3>

                  {/* Subject */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {subject}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Questions</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalQuestions}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{duration}m</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <Award className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Marks</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalMarks}</p>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Starts: {formatExamDateTime(startDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5" />
                      <span>Ends: {formatExamDateTime(endDateTime)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  {isLocked ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Starts in {getTimeUntilStart(exam)}</span>
                    </div>
                  ) : studentStatus === 'Disqualified' ? (
                    <div className="space-y-2">
                      <div className="w-full py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold border-2 border-red-300 dark:border-red-800 flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Disqualified
                      </div>
                      {canViewResult && hasAttempt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const attemptId = attempt?.['Attempt ID'] || attempt?.attemptId;
                            if (attemptId) {
                              window.open(`/exams/result/${attemptId}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View Results
                        </button>
                      )}
                    </div>
                  ) : studentStatus === 'Completed' && !isPractice ? (
                    <div className="space-y-2">
                      {canViewResult && hasAttempt ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const attemptId = attempt?.['Attempt ID'] || attempt?.attemptId;
                            if (attemptId) {
                              window.open(`/exams/result/${attemptId}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View Results
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold transition-all flex items-center justify-center gap-2 cursor-not-allowed">
                          <CheckCircle className="w-4 h-4" />
                          Exam Completed
                        </div>
                      )}
                    </div>
                  ) : isLive ? (
                    <button className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
                      <Unlock className="w-4 h-4" />
                      Start Exam
                    </button>
                  ) : isPractice && hasAttempt ? (
                    <div className="space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const attemptId = attempt?.['Attempt ID'] || attempt?.attemptId;
                          if (attemptId) {
                            window.open(`/exams/result/${attemptId}`, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Result
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/exams/${examId}/practice`, '_blank', 'noopener,noreferrer');
                        }}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Practice Again
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Hover Glow Effect */}
                {!isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300 rounded-2xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Important Information
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li><strong>Practice Exams:</strong> No proctoring, password, or fullscreen required - just review questions freely</li>
              <li><strong>Regular Exams:</strong> Ensure stable internet connection before starting</li>
              <li>Allow webcam, microphone, and screen sharing permissions when prompted (for regular exams)</li>
              <li>Keep your exam window in fullscreen mode throughout the exam (for regular exams)</li>
              <li>Switching tabs or windows may be flagged as a violation (for regular exams)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exams;
