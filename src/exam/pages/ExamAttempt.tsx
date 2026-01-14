/**
 * Exam Attempt Page - Apple Aesthetic Redesign
 * FIXED: Dark mode with solid background and visible question text
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  Send,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  Circle,
  CheckCircle,
  Video,
  Monitor,
  ShieldAlert,
  Shield,
  MoreVertical,
  Home,
  Maximize,
  Calculator,
  Table,
  Grid3X3,
  Pencil
} from 'lucide-react';
import {
  RichTextAnswerEditor,
  CalculatorPanel,
  ScientificCalculatorPanel,
  TableEditor,
  SpreadsheetPanel,
  DrawingPanel,
  RoughWorkPanel
} from '../components/answer-tools';
import {
  getExamById,
  startExamAttempt,
  saveAnswer as saveAnswerAPI,
  logViolation as logViolationAPI,
  uploadScreenshotDirect,
  requestMoreUploadUris,
  submitExam as submitExamAPI,
  isExamLive,
  validateExamSession,
  updateSessionActivity,
  type Exam,
  type Question,
  type ExamAttemptResponse
} from '../services/examApi';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getStoredSession, generateDeviceFingerprint } from '../utils/examSession';

interface Answer {
  questionId: string;
  answer: string;
  flagged: boolean;
  submitted: boolean; // Has the answer been submitted (not just saved)
  submittedAnswer?: string; // The last submitted answer value (to revert if not updated)
}

interface ProctoringLog {
  timestamp: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy' | 'paste' | 'right_click' | 'screenshot' | 'webcam_off' | 'microphone_off' | 'screen_share_off';
  details: string;
}

const ExamAttempt: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { student } = useAuth();

  // Exam State
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [examExpired, setExamExpired] = useState(false);
  const [examAlreadySubmitted, setExamAlreadySubmitted] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [sessionError, setSessionError] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Answer Saving State
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set()); // Track which questions have been saved
  const [savingAnswer, setSavingAnswer] = useState(false); // Show saving indicator
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Proctoring State
  const [violations, setViolations] = useState<ProctoringLog[]>([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [permissionError, setPermissionError] = useState<{show: boolean; message: string}>({show: false, message: ''});

  // UI State
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Answer Tools State (for all question types with tools enabled)
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScientificCalculator, setShowScientificCalculator] = useState(false);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showRoughWork, setShowRoughWork] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [spreadsheetData, setSpreadsheetData] = useState<(string | number | null)[][]>([]);
  const [drawingData, setDrawingData] = useState<string>('');

  // Fullscreen Grace Period State
  const [fullscreenWarningActive, setFullscreenWarningActive] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(15);
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [submissionStarted, setSubmissionStarted] = useState(false);

  // Proctoring Grace Period & Blocking State
  const [proctoringGracePeriod, setProctoringGracePeriod] = useState(true); // 60s grace period at start
  const [proctoringBlocked, setProctoringBlocked] = useState(false); // Block exam if webcam/screen share off
  const [proctoringBlockReason, setProctoringBlockReason] = useState<string>('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenShareScreenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const attemptIdRef = useRef<string | null>(null);
  const examIdRef = useRef<string | null>(null);
  const webcamActiveRef = useRef<boolean>(false);
  const screenShareActiveRef = useRef<boolean>(false);
  const proctoringGracePeriodRef = useRef<boolean>(true);
  const gracePeriodTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Batch Upload URIs for direct browser-to-Drive uploads
  // These URIs are pre-authorized and don't require authentication
  const webcamUploadUrisRef = useRef<string[]>([]);
  const screenUploadUrisRef = useRef<string[]>([]);
  const webcamUriIndexRef = useRef<number>(0);
  const screenUriIndexRef = useRef<number>(0);

  // Session activity update ref
  const sessionActivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storedSessionRef = useRef<any>(null);

  // Store original option order for each question (for shuffled options mapping)
  const shuffledOptionsMapRef = useRef<Map<string, Map<string, string>>>(new Map());

  /**
   * Fisher-Yates shuffle algorithm - creates a new shuffled array
   * Uses student email as seed for consistent shuffling per student
   */
  const shuffleArray = <T,>(array: T[], seed?: string): T[] => {
    const shuffled = [...array];
    // Create a seeded random number generator for consistent shuffling per student
    const seededRandom = (seedStr: string, index: number): number => {
      let hash = 0;
      const combinedSeed = seedStr + index.toString();
      for (let i = 0; i < combinedSeed.length; i++) {
        const char = combinedSeed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash) / 2147483647;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomValue = seed ? seededRandom(seed, i) : Math.random();
      const j = Math.floor(randomValue * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Shuffle MCQ options for a question and track the mapping
   * Returns the question with shuffled options and updates shuffledOptionsMapRef
   */
  const shuffleQuestionOptions = (question: Question, seed: string): Question => {
    if (question.questionType !== 'MCQ' && question.questionType !== 'MCQ_IMAGE') {
      return question;
    }

    // Get all non-empty options
    const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
    const options: { key: string; value: string }[] = [];

    optionKeys.forEach(key => {
      const optionKey = `option${key}` as keyof Question;
      const value = question[optionKey] as string;
      if (value && value.trim() !== '') {
        options.push({ key, value });
      }
    });

    // Shuffle the options
    const shuffledOptions = shuffleArray(options, seed + question.questionId);

    // Create mapping from new position to original key (for correct answer mapping)
    const optionMapping = new Map<string, string>();
    const reverseMapping = new Map<string, string>(); // original key -> new key

    // Build the shuffled question
    const shuffledQuestion = { ...question };

    shuffledOptions.forEach((opt, index) => {
      const newKey = optionKeys[index];
      const newOptionKey = `option${newKey}` as keyof Question;
      (shuffledQuestion as any)[newOptionKey] = opt.value;
      optionMapping.set(newKey, opt.key); // new key -> original key
      reverseMapping.set(opt.key, newKey); // original key -> new key
    });

    // Clear remaining options
    for (let i = shuffledOptions.length; i < optionKeys.length; i++) {
      const optionKey = `option${optionKeys[i]}` as keyof Question;
      (shuffledQuestion as any)[optionKey] = '';
    }

    // Update correct answer to new position
    if (question.correctAnswer) {
      const originalAnswers = question.correctAnswer.split(',').map(a => a.trim().toUpperCase());
      const newAnswers = originalAnswers.map(orig => reverseMapping.get(orig) || orig);
      shuffledQuestion.correctAnswer = newAnswers.join(',');
    }

    // Store the mapping for this question (to map student's answer back to original)
    shuffledOptionsMapRef.current.set(question.questionId || '', optionMapping);

    return shuffledQuestion;
  };

  // Validate Session and Load Exam
  useEffect(() => {
    if (examId) {
      validateSession();
    }

    return () => {
      // Clear session activity interval on unmount
      if (sessionActivityIntervalRef.current) {
        clearInterval(sessionActivityIntervalRef.current);
      }
    };
  }, [examId]);

  const validateSession = async () => {
    try {
      // Check if we have a stored session
      const storedSession = getStoredSession(examId!);

      if (!storedSession) {
        // No session found - redirect to password entry
        console.log('No session found, redirecting to verify page');
        navigate(`/exams/${examId}/verify`, { replace: true });
        return;
      }

      storedSessionRef.current = storedSession;

      // Validate session with backend
      const fingerprint = generateDeviceFingerprint();
      const response = await validateExamSession(
        examId!,
        storedSession.sessionToken,
        fingerprint.deviceHash
      );

      if (!response.success || !response.valid) {
        if (response.expired) {
          setSessionError('Your session has expired. Please verify with the exam password again.');
        } else if (response.invalidDevice) {
          setSessionError('This exam session was started on a different device. Please use the original device to continue.');
        } else if (response.sessionNotFound) {
          setSessionError('Session not found. Please verify with the exam password again.');
        } else {
          setSessionError(response.message || 'Invalid session. Please verify with the exam password again.');
        }
        setSessionInvalid(true);
        setLoading(false);
        return;
      }

      // Start session activity heartbeat (every 2 minutes)
      sessionActivityIntervalRef.current = setInterval(async () => {
        if (storedSessionRef.current) {
          try {
            await updateSessionActivity(examId!, storedSessionRef.current.sessionToken);
          } catch (err) {
            console.warn('Failed to update session activity:', err);
          }
        }
      }, 2 * 60 * 1000);

      // Session is valid, load exam data
      loadExam();
    } catch (err) {
      console.error('Session validation error:', err);
      // On error, redirect to password entry
      navigate(`/exams/${examId}/verify`, { replace: true });
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      console.log('🔄 [EXAM LOAD] Starting exam load for examId:', examId);
      console.log('🔄 [EXAM LOAD] Step 1: Fetching exam details...');
      const response = await getExamById(examId!);
      console.log('✅ [EXAM LOAD] Step 1 COMPLETE: Exam details fetched', response.success);
      if (response.success && response.data) {
        const examData = response.data;
        let questions = examData.questions || [];
        const settings = examData.settings || {};
        const studentSeed = student?.email || student?.name || 'default';

        // Apply shuffle if enabled in settings
        console.log('🔀 [SHUFFLE] Settings:', {
          randomizeQuestions: settings.randomizeQuestions,
          randomizeOptions: settings.randomizeOptions
        });

        // Shuffle questions if enabled
        if (settings.randomizeQuestions) {
          console.log('🔀 [SHUFFLE] Shuffling questions order...');
          questions = shuffleArray(questions, studentSeed + examData['Exam ID']);
          // Re-assign question numbers after shuffle
          questions = questions.map((q: Question, index: number) => ({
            ...q,
            questionNumber: index + 1
          }));
          console.log('✅ [SHUFFLE] Questions shuffled');
        }

        // Shuffle options for MCQ questions if enabled
        if (settings.randomizeOptions) {
          console.log('🔀 [SHUFFLE] Shuffling MCQ options...');
          questions = questions.map((q: Question) => shuffleQuestionOptions(q, studentSeed));
          console.log('✅ [SHUFFLE] Options shuffled');
        }

        const normalized = {
          ...examData,
          examId: examData['Exam ID'] || examData.examId,
          examTitle: examData['Exam Title'] || examData.examTitle,
          duration: examData['Duration (minutes)'] || examData.duration,
          questions: questions,
          settings: settings
        };
        setExam(normalized);

        // Check if exam has expired
        if (!isExamLive(normalized)) {
          setExamExpired(true);
          setLoading(false);
          return;
        }

        setTimeRemaining((normalized.duration || 60) * 60);
        setExamStartTime(new Date());

        console.log('🔄 [EXAM LOAD] Step 2: Starting exam attempt (this may take 30-60s for URI generation)...');
        console.time('startExamAttempt');
        const attemptResponse = await startExamAttempt(
          normalized.examId,
          student?.name || student?.email || 'Student'
        );
        console.timeEnd('startExamAttempt');
        console.log('✅ [EXAM LOAD] Step 2 COMPLETE: Attempt response received:', attemptResponse.success);
        console.log('📦 [EXAM LOAD] Attempt response data:', JSON.stringify(attemptResponse, null, 2));

        // Check if exam is already submitted
        if (attemptResponse.alreadySubmitted || (attemptResponse.success === false && attemptResponse.alreadySubmitted)) {
          setExamAlreadySubmitted(true);
          setLoading(false);
          return;
        }

        if (attemptResponse.success) {
          const attemptIdValue = attemptResponse.data?.attemptId || attemptResponse.attemptId;
          if (!attemptIdValue) {
            throw new Error('No attempt ID returned from backend');
          }

          // Check if this is a resumed attempt
          const isResumed = attemptResponse.resumed || attemptResponse.data?.resumed;
          const savedAnswersFromBackend = attemptResponse.savedAnswers || attemptResponse.data?.savedAnswers || [];

          if (isResumed) {
            console.log('📋 Resuming exam attempt:', attemptIdValue);
            console.log('📋 Loaded', savedAnswersFromBackend.length, 'saved answers');
          } else {
            console.log('✅ New attempt started:', attemptIdValue);
          }

          // Initialize answers - merge with saved answers from backend if resuming
          const initialAnswers = new Map<string, Answer>();
          (normalized.questions || []).forEach((q: any) => {
            const savedAnswer = savedAnswersFromBackend.find(
              (sa: any) => sa.questionId === q.questionId
            );
            initialAnswers.set(q.questionId || '', {
              questionId: q.questionId || '',
              answer: savedAnswer?.answer || '',
              flagged: false,
              submitted: savedAnswer?.submitted || false,
              submittedAnswer: savedAnswer?.submitted ? savedAnswer?.answer : undefined
            });
          });
          setAnswers(initialAnswers);

          // Track which questions have saved answers
          if (isResumed && savedAnswersFromBackend.length > 0) {
            const savedSet = new Set<string>(
              savedAnswersFromBackend.map((sa: any) => sa.questionId)
            );
            setSavedAnswers(savedSet);
          }

          console.log('✅ Attempt ID received:', attemptIdValue);
          setAttemptId(attemptIdValue);
          attemptIdRef.current = attemptIdValue;
          examIdRef.current = normalized.examId;

          // Store batch upload URIs for direct browser-to-Drive uploads
          const webcamUris = attemptResponse.webcamUploadUris || attemptResponse.data?.webcamUploadUris || [];
          const screenUris = attemptResponse.screenUploadUris || attemptResponse.data?.screenUploadUris || [];
          webcamUploadUrisRef.current = webcamUris;
          screenUploadUrisRef.current = screenUris;
          webcamUriIndexRef.current = 0;
          screenUriIndexRef.current = 0;
          console.log('📸 [BATCH URIS] Webcam URIs loaded:', webcamUris.length);
          console.log('📸 [BATCH URIS] Screen URIs loaded:', screenUris.length);
          if (webcamUris.length > 0) {
            console.log('📸 [BATCH URIS] First webcam URI (sample):', webcamUris[0].substring(0, 100) + '...');
          }
          if (screenUris.length > 0) {
            console.log('📸 [BATCH URIS] First screen URI (sample):', screenUris[0].substring(0, 100) + '...');
          }

          const isPractice = normalized['Is Practice'] === 'Yes' || normalized.isPractice === true;
          if (!isPractice) {
            // Validate that required proctoring permissions are still available
            const settings = normalized.settings?.proctoring;
            const missingPermissions: string[] = [];

            // Check webcam permission
            if (settings?.webcamRequired && !(window as any).examMediaStream) {
              missingPermissions.push('Webcam');
            }

            // Check screen share permission
            if (settings?.enforceScreensharing && !(window as any).examScreenStream) {
              missingPermissions.push('Screen Share');
            }

            // If any required permissions are missing, show error modal
            if (missingPermissions.length > 0) {
              setPermissionError({
                show: true,
                message: `Required permissions are missing: ${missingPermissions.join(', ')}.\n\nYou will be redirected to grant permissions again.`
              });
              return;
            }

            // Check fullscreen (if required)
            if (settings?.fullscreenMandatory !== false && !document.fullscreenElement) {
              setPermissionError({
                show: true,
                message: 'Fullscreen mode is required for this exam.\n\nYou will be redirected to grant permissions again.'
              });
              return;
            }

            startProctoring(normalized, attemptIdValue);
          }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all event listeners
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];

      // Clean up timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
      if (screenShareScreenshotIntervalRef.current) {
        clearInterval(screenShareScreenshotIntervalRef.current);
      }
      if (fullscreenTimerRef.current) {
        clearInterval(fullscreenTimerRef.current);
      }
      if (gracePeriodTimeoutRef.current) {
        clearTimeout(gracePeriodTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      // Clean up media streams ONLY if exam was submitted
      // Don't clean up on React StrictMode's initial unmount/remount cycle
      if (submissionStarted) {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        if ((window as any).examScreenStream) {
          const stream = (window as any).examScreenStream as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          (window as any).examScreenStream = null;
        }
      }
    };
  }, [submissionStarted]);

  // Proctoring Setup
  const startProctoring = (examData: Exam, currentAttemptId: string) => {
    console.log('🎯 startProctoring called with attemptId:', currentAttemptId);
    const settings = examData.settings?.proctoring;

    if (settings?.webcamRequired && (window as any).examMediaStream) {
      const stream = (window as any).examMediaStream;

      // Verify stream has video tracks (enabled tracks, regardless of readyState)
      const videoTracks = stream.getVideoTracks();
      const hasVideoTracks = videoTracks.length > 0;
      const hasEnabledVideo = videoTracks.some((track: MediaStreamTrack) => track.enabled);

      console.log('Webcam stream check:', {
        hasVideoTracks,
        hasEnabledVideo,
        trackCount: videoTracks.length,
        trackStates: videoTracks.map((t: MediaStreamTrack) => ({
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label
        }))
      });

      console.log('videoRef.current exists?', !!videoRef.current);

      if (videoRef.current) {
        console.log('Inside videoRef.current block - about to set srcObject');
        videoRef.current.srcObject = stream;

        // Set webcam active if we have enabled video tracks
        // Don't wait for 'live' state as it may take a moment
        if (hasEnabledVideo) {
          console.log('Setting webcam active immediately - enabled tracks detected');
          setWebcamActive(true);
          webcamActiveRef.current = true;
        }

        // Also set it when video starts playing
        const handleVideoPlay = () => {
          setWebcamActive(true);
          webcamActiveRef.current = true;
          console.log('Webcam video playing - status set to active');
        };

        videoRef.current.addEventListener('playing', handleVideoPlay);
        cleanupFunctionsRef.current.push(() => {
          videoRef.current?.removeEventListener('playing', handleVideoPlay);
        });

        // Explicitly start playing the video
        videoRef.current.play().then(() => {
          console.log('Webcam video started successfully');
          setWebcamActive(true);
          webcamActiveRef.current = true;
        }).catch(err => {
          console.error('Error starting webcam video:', err);
          // Even if autoplay fails, set active if we have tracks
          if (hasEnabledVideo) {
            setWebcamActive(true);
            webcamActiveRef.current = true;
          }
        });

        // Additional safety check after a short delay
        setTimeout(() => {
          const currentVideoTracks = stream.getVideoTracks();
          const isStillEnabled = currentVideoTracks.some((track: MediaStreamTrack) => track.enabled);
          if (isStillEnabled && videoRef.current?.srcObject) {
            console.log('Webcam verified active after delay');
            setWebcamActive(true);
            webcamActiveRef.current = true;
          }
        }, 1000);
      }

      // Monitor webcam stream health
      monitorMediaStreamHealth(stream, 'webcam');
    }

    if (settings?.enforceScreensharing && (window as any).examScreenStream) {
      const screenStream = (window as any).examScreenStream as MediaStream;

      // Check if screen stream is still valid
      const screenTracks = screenStream.getVideoTracks();
      console.log('🖥️ Screen share stream initial state:', {
        trackCount: screenTracks.length,
        trackState: screenTracks[0]?.readyState,
        trackLabel: screenTracks[0]?.label,
        trackEnabled: screenTracks[0]?.enabled
      });

      const isScreenStreamValid = screenTracks.length > 0 && screenTracks[0]?.readyState === 'live';

      if (!isScreenStreamValid) {
        console.error('❌ Screen share stream is not valid - track may have ended');
        setScreenShareActive(false);
        screenShareActiveRef.current = false;
        showViolationWarning('Screen sharing is no longer active. Please refresh and share your screen again.');
        // Don't set up screen share - but continue with other proctoring setup
      } else {
        // Set up screen share video element for screenshot capture
        if (screenShareVideoRef.current) {
          const screenVideo = screenShareVideoRef.current;
          screenVideo.srcObject = screenStream;

          // Wait for the video to load metadata and start playing
          const handleLoadedMetadata = () => {
            console.log('🖥️ Screen share video metadata loaded:', {
              videoWidth: screenVideo.videoWidth,
              videoHeight: screenVideo.videoHeight
            });
          };

          const handleCanPlay = () => {
            console.log('🖥️ Screen share video can play - starting playback');
            screenVideo.play().then(() => {
              console.log('✅ Screen share video started successfully for screenshot capture');
              setScreenShareActive(true);
              screenShareActiveRef.current = true;
            }).catch(err => {
              console.error('Error starting screen share video:', err);
              setScreenShareActive(true);
              screenShareActiveRef.current = true;
            });
          };

          screenVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
          screenVideo.addEventListener('canplay', handleCanPlay, { once: true });

          // Fallback: try to play immediately
          setTimeout(() => {
            if (screenVideo.paused) {
              console.log('⏰ Fallback: attempting to play screen share video');
              screenVideo.play().catch(err => console.log('Fallback play failed:', err));
              setScreenShareActive(true);
              screenShareActiveRef.current = true;
            }
          }, 1000);
        } else {
          setScreenShareActive(true);
          screenShareActiveRef.current = true;
        }

        // Monitor screen share stream health
        const screenTrack = screenTracks[0];
        console.log('🖥️ Screen share track info:', {
          enabled: screenTrack.enabled,
          readyState: screenTrack.readyState,
          label: screenTrack.label
        });

        const handleScreenShareEnded = () => {
          if (!submissionStarted) {
            console.log('⚠️ Screen share track ended');
            setScreenShareActive(false);
            screenShareActiveRef.current = false;
            logViolation('screen_share_off', 'Screen share was stopped');
            showViolationWarning('Screen sharing was stopped');
            // Block exam if grace period has ended
            if (!proctoringGracePeriodRef.current) {
              setProctoringBlocked(true);
              setProctoringBlockReason('Screen sharing was stopped. Please enable screen sharing to continue the exam.');
            }
          }
        };

        screenTrack.addEventListener('ended', handleScreenShareEnded);
        cleanupFunctionsRef.current.push(() => {
          screenTrack.removeEventListener('ended', handleScreenShareEnded);
        });

        // Capture screen share screenshots every 15 seconds with random jitter (0-4s)
        // Jitter prevents all students from uploading at the exact same time
        const screenJitter = Math.random() * 4000; // 0-4 seconds random offset
        console.log(`🎬 Starting screen share screenshot interval (15s + ${Math.round(screenJitter)}ms jitter)`);
        screenShareScreenshotIntervalRef.current = setInterval(() => {
          console.log('⏰ Screen share screenshot interval triggered');
          captureScreenShareScreenshot();
        }, 15000); // 15 seconds

        // Capture first screen share screenshot after 10 seconds + jitter
        setTimeout(() => {
          console.log('🚀 Capturing initial screen share screenshot');
          captureScreenShareScreenshot();
        }, 10000 + screenJitter);
      }
    }

    setupProctoringEventListeners(examData);

    if (settings?.webcamRequired) {
      // Capture screenshots every 60 seconds with random jitter (0-4s)
      // Jitter prevents all students from uploading at the exact same time
      const webcamJitter = Math.random() * 4000; // 0-4 seconds random offset
      console.log(`🎬 Starting webcam screenshot interval (60s + ${Math.round(webcamJitter)}ms jitter)`);
      screenshotIntervalRef.current = setInterval(() => {
        console.log('⏰ Webcam screenshot interval triggered');
        captureScreenshot();
      }, 60000);

      // Capture first screenshot after 5 seconds + jitter
      setTimeout(() => {
        console.log('🚀 Capturing initial webcam screenshot');
        captureScreenshot();
      }, 5000 + webcamJitter);
    }

    // Start 60-second grace period - after this, webcam/screen share must stay active
    console.log('⏳ Starting 60-second proctoring grace period');
    gracePeriodTimeoutRef.current = setTimeout(() => {
      // Don't block if exam was already submitted
      if (submissionStarted) {
        return;
      }

      console.log('✅ Proctoring grace period ended - enforcing webcam/screen share requirements');
      setProctoringGracePeriod(false);
      proctoringGracePeriodRef.current = false;

      // Check if webcam/screen share are still active after grace period
      if (settings?.webcamRequired && !webcamActiveRef.current) {
        setProctoringBlocked(true);
        setProctoringBlockReason('Webcam is not active. Please enable your webcam to continue the exam.');
      }
      if (settings?.enforceScreensharing && !screenShareActiveRef.current) {
        setProctoringBlocked(true);
        setProctoringBlockReason('Screen sharing is not active. Please enable screen sharing to continue the exam.');
      }
    }, 60000);
  };

  // Monitor Webcam and Microphone Stream Health
  const monitorMediaStreamHealth = (stream: MediaStream, type: 'webcam' | 'microphone') => {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    // Monitor video track (webcam)
    if (type === 'webcam' && videoTracks.length > 0) {
      const videoTrack = videoTracks[0];

      const handleVideoEnded = () => {
        if (!submissionStarted) {
          setWebcamActive(false);
          webcamActiveRef.current = false;
          logViolation('webcam_off', 'Webcam stream ended unexpectedly');
          showViolationWarning('Webcam was turned off');
          // Block exam if grace period has ended
          if (!proctoringGracePeriodRef.current) {
            setProctoringBlocked(true);
            setProctoringBlockReason('Webcam was turned off. Please enable your webcam to continue the exam.');
          }
        }
      };

      const handleVideoMute = () => {
        if (!submissionStarted) {
          setWebcamActive(false);
          webcamActiveRef.current = false;
          logViolation('webcam_off', 'Webcam was muted/disabled');
          showViolationWarning('Webcam was disabled');
          // Block exam if grace period has ended
          if (!proctoringGracePeriodRef.current) {
            setProctoringBlocked(true);
            setProctoringBlockReason('Webcam was disabled. Please enable your webcam to continue the exam.');
          }
        }
      };

      videoTrack.addEventListener('ended', handleVideoEnded);
      videoTrack.addEventListener('mute', handleVideoMute);

      // Store cleanup
      cleanupFunctionsRef.current.push(() => {
        videoTrack.removeEventListener('ended', handleVideoEnded);
        videoTrack.removeEventListener('mute', handleVideoMute);
      });
    }

    // Monitor audio track (microphone) - if required
    if (audioTracks.length > 0) {
      const audioTrack = audioTracks[0];

      const handleAudioEnded = () => {
        if (!submissionStarted) {
          logViolation('microphone_off', 'Microphone stream ended unexpectedly');
          showViolationWarning('Microphone was turned off');
        }
      };

      const handleAudioMute = () => {
        if (!submissionStarted) {
          logViolation('microphone_off', 'Microphone was muted/disabled');
          showViolationWarning('Microphone was disabled');
        }
      };

      audioTrack.addEventListener('ended', handleAudioEnded);
      audioTrack.addEventListener('mute', handleAudioMute);

      // Store cleanup
      cleanupFunctionsRef.current.push(() => {
        audioTrack.removeEventListener('ended', handleAudioEnded);
        audioTrack.removeEventListener('mute', handleAudioMute);
      });
    }
  };

  // Fullscreen Grace Period Logic
  const startFullscreenGracePeriod = () => {
    // Clear any existing timer
    if (fullscreenTimerRef.current) {
      clearInterval(fullscreenTimerRef.current);
    }

    setFullscreenWarningActive(true);
    setFullscreenCountdown(15);

    // Start countdown
    let countdown = 15;
    fullscreenTimerRef.current = setInterval(() => {
      countdown -= 1;
      setFullscreenCountdown(countdown);

      if (countdown <= 0) {
        handleFullscreenViolation();
      }
    }, 1000);
  };

  const cancelFullscreenGracePeriod = () => {
    if (fullscreenTimerRef.current) {
      clearInterval(fullscreenTimerRef.current);
      fullscreenTimerRef.current = null;
    }
    setFullscreenWarningActive(false);
    setFullscreenCountdown(15);
  };

  const handleFullscreenViolation = () => {
    // Clear the timer
    if (fullscreenTimerRef.current) {
      clearInterval(fullscreenTimerRef.current);
      fullscreenTimerRef.current = null;
    }

    // Log the violation
    logViolation('fullscreen_exit', 'Failed to return to fullscreen within grace period');

    // Keep the warning active until they return to fullscreen
    // Don't reset fullscreenWarningActive - it stays until they comply
  };

  const requestFullscreenAgain = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Failed to re-enter fullscreen:', err);
      });
    }
  };

  const setupProctoringEventListeners = (examData: Exam) => {
    const settings = examData.settings?.proctoring;

    // Fullscreen exit detection with grace period
    const handleFullscreenChange = () => {
      if (!submissionStarted && settings?.fullscreenMandatory) {
        if (!document.fullscreenElement) {
          // User exited fullscreen - start grace period
          startFullscreenGracePeriod();
        } else {
          // User returned to fullscreen - cancel grace period
          cancelFullscreenGracePeriod();
        }
      }
    };

    // Tab/Window switching detection
    const handleVisibilityChange = () => {
      if (!submissionStarted && document.hidden && !settings?.allowTabSwitching) {
        logViolation('tab_switch', 'User switched tabs or minimized window');
        showViolationWarning('Tab switching is not allowed during the exam');
      }
    };

    // Window blur detection
    const handleWindowBlur = () => {
      if (!submissionStarted && !settings?.allowWindowSwitching) {
        logViolation('window_blur', 'User switched windows');
        showViolationWarning('Window switching is not allowed');
      }
    };

    // Copy/Paste detection
    const handleCopy = (e: ClipboardEvent) => {
      if (!submissionStarted && !settings?.allowCopyPaste) {
        e.preventDefault();
        logViolation('copy', 'User attempted to copy content');
        showViolationWarning('Copying is not allowed during the exam');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!submissionStarted && !settings?.allowCopyPaste) {
        e.preventDefault();
        logViolation('paste', 'User attempted to paste content');
        showViolationWarning('Pasting is not allowed during the exam');
      }
    };

    // Right click detection
    const handleContextMenu = (e: MouseEvent) => {
      if (!submissionStarted && !settings?.allowRightClick) {
        e.preventDefault();
        logViolation('right_click', 'User attempted right click');
        showViolationWarning('Right click is disabled during the exam');
      }
    };

    // Screenshot and Screen Recording detection (keyboard shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submissionStarted) return;

      // Debug: Log all Cmd+Shift combinations to see what we're getting
      if (e.metaKey && e.shiftKey) {
        console.log('Key combo detected:', {
          key: e.key,
          code: e.code,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey
        });
      }

      // ===========================================
      // WINDOWS SCREENSHOT & RECORDING SHORTCUTS
      // ===========================================

      // PrintScreen (full screen)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('screenshot', 'Screenshot attempt detected (PrintScreen key)');
        showViolationWarning('⚠️ Screenshots are NOT allowed and are being monitored');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Alt + PrintScreen (active window)
      if (e.altKey && e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('screenshot', 'Screenshot attempt detected (Alt+PrintScreen)');
        showViolationWarning('⚠️ Screenshots are NOT allowed and are being monitored');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Win + PrintScreen (save to file)
      if (e.metaKey && e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('screenshot', 'Screenshot attempt detected (Win+PrintScreen)');
        showViolationWarning('⚠️ Screenshots are NOT allowed and are being monitored');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Win + Shift + S (Snipping Tool / Snip & Sketch)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        logViolation('screenshot', 'Screenshot tool attempt detected (Win+Shift+S)');
        showViolationWarning('⚠️ Screenshot tools are NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Win + G (Xbox Game Bar - includes screenshot & recording)
      if (e.metaKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        logViolation('screenshot', 'Xbox Game Bar attempt detected (Win+G)');
        showViolationWarning('⚠️ Screen recording tools are NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Win + Alt + R (Xbox Game Bar recording)
      if (e.metaKey && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        logViolation('screenshot', 'Screen recording attempt detected (Win+Alt+R)');
        showViolationWarning('⚠️ Screen recording is NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // Win + Alt + PrintScreen (Game window screenshot)
      if (e.metaKey && e.altKey && e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('screenshot', 'Screenshot attempt detected (Win+Alt+PrintScreen)');
        showViolationWarning('⚠️ Screenshots are NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
      }

      // ===========================================
      // MAC SCREENSHOT & RECORDING SHORTCUTS
      // ===========================================

      // Cmd + Shift + 3 (full screen screenshot) - Check both '3' and '#'
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '#' || e.code === 'Digit3')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logViolation('screenshot', 'Screenshot attempt detected (Cmd+Shift+3)');
        showViolationWarning('⚠️ Screenshots are NOT allowed and are being monitored');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
        console.log('🚫 Blocked Cmd+Shift+3 screenshot attempt');
      }

      // Cmd + Shift + 4 (selection screenshot) - Check both '4' and '$'
      if (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '$' || e.code === 'Digit4')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logViolation('screenshot', 'Screenshot attempt detected (Cmd+Shift+4)');
        showViolationWarning('⚠️ Screenshots are NOT allowed and are being monitored');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
        console.log('🚫 Blocked Cmd+Shift+4 screenshot attempt');
      }

      // Cmd + Shift + 5 (screenshot utility & screen recording) - Check both '5' and '%'
      if (e.metaKey && e.shiftKey && (e.key === '5' || e.key === '%' || e.code === 'Digit5')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logViolation('screenshot', 'Screenshot/Recording tool attempt detected (Cmd+Shift+5)');
        showViolationWarning('⚠️ Screenshots and screen recording are NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
        console.log('🚫 Blocked Cmd+Shift+5 screenshot attempt');
      }

      // Cmd + Shift + 6 (Touch Bar screenshot on MacBook Pro) - Check both '6' and '^'
      if (e.metaKey && e.shiftKey && (e.key === '6' || e.key === '^' || e.code === 'Digit6')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        logViolation('screenshot', 'Touch Bar screenshot attempt detected (Cmd+Shift+6)');
        showViolationWarning('⚠️ Screenshots are NOT allowed');
        if (exam?.settings?.proctoring?.beepAlerts) playBeepSound();
        console.log('🚫 Blocked Cmd+Shift+6 screenshot attempt');
      }

      // ===========================================
      // ADDITIONAL PREVENTION
      // ===========================================

      // Prevent F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        logViolation('screenshot', 'Developer Tools attempt detected (F12)');
        showViolationWarning('⚠️ Developer Tools are NOT allowed');
      }

      // Prevent Ctrl+Shift+I / Cmd+Option+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        logViolation('screenshot', 'Developer Tools attempt detected');
        showViolationWarning('⚠️ Developer Tools are NOT allowed');
      }

      // Prevent Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        logViolation('screenshot', 'Inspect Element attempt detected');
        showViolationWarning('⚠️ Developer Tools are NOT allowed');
      }
    };

    // Attach listeners (use capture phase for keydown to catch events early)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    window.addEventListener('keydown', handleKeyDown, true); // Also on window

    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);

      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }

      if (fullscreenTimerRef.current) {
        clearInterval(fullscreenTimerRef.current);
      }
    };

    cleanupFunctionsRef.current.push(cleanup);
  };

  const logViolation = async (type: ProctoringLog['type'], details: string) => {
    // Don't log violations during submission
    if (submissionStarted) return;

    const log: ProctoringLog = {
      timestamp: new Date().toISOString(),
      type,
      details
    };

    setViolations(prev => [...prev, log]);

    // Use functional update to avoid race condition
    setViolationCount(prev => {
      const newCount = prev + 1;
      const maxViolations = exam?.settings?.proctoring?.maxViolationsBeforeAction || 5;

      // Check threshold with correct count
      if (newCount >= maxViolations && exam?.settings?.proctoring?.disqualifyOnViolation) {
        // Delay to allow state update
        setTimeout(() => handleDisqualification(), 100);
      }

      return newCount;
    });

    // Log to backend
    if (attemptId && examId) {
      try {
        await logViolationAPI(attemptId, examId, type, details);
      } catch (err) {
        console.error('Failed to log violation:', err);
      }

      // Capture immediate screenshots on violation for evidence using direct upload
      // Capture webcam screenshot if available
      if (videoRef.current && webcamActive) {
        try {
          const video = videoRef.current;
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const screenshot = canvas.toDataURL('image/jpeg', 0.6);
              if (screenshot && screenshot.length > 1000) {
                // Use direct upload with pre-authorized URI
                const uriIndex = webcamUriIndexRef.current;
                if (uriIndex < webcamUploadUrisRef.current.length) {
                  const uploadUri = webcamUploadUrisRef.current[uriIndex];
                  webcamUriIndexRef.current = uriIndex + 1;
                  await uploadScreenshotDirect(uploadUri, screenshot);
                  console.log('📸 Violation webcam screenshot captured (direct upload)');
                }
              }
            }
            canvas.width = 0;
            canvas.height = 0;
          }
        } catch (err) {
          console.error('Failed to capture violation webcam screenshot:', err);
        }
      }

      // Capture screen share screenshot if available
      if (screenShareVideoRef.current && screenShareActive) {
        try {
          const video = screenShareVideoRef.current;
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const screenshot = canvas.toDataURL('image/jpeg', 0.7);
              if (screenshot && screenshot.length > 1000) {
                // Use direct upload with pre-authorized URI
                const uriIndex = screenUriIndexRef.current;
                if (uriIndex < screenUploadUrisRef.current.length) {
                  const uploadUri = screenUploadUrisRef.current[uriIndex];
                  screenUriIndexRef.current = uriIndex + 1;
                  await uploadScreenshotDirect(uploadUri, screenshot);
                  console.log('📸 Violation screen share screenshot captured (direct upload)');
                }
              }
            }
            canvas.width = 0;
            canvas.height = 0;
          }
        } catch (err) {
          console.error('Failed to capture violation screen share screenshot:', err);
        }
      }
    }
  };

  const showViolationWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);

    if (exam?.settings?.proctoring?.beepAlerts) {
      playBeepSound();
    }

    setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  };

  const playBeepSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKF0fPTgjMGHm7A7+OZUR4OVLDp66hVFApNpeDwvWwhBjeQ1vLNeSsF');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Beep audio error:', e));
  };

  const captureScreenshot = async () => {
    const currentAttemptId = attemptIdRef.current;
    const currentExamId = examIdRef.current;

    const isWebcamActive = webcamActiveRef.current;

    console.log('📸 captureScreenshot called', {
      hasVideoRef: !!videoRef.current,
      webcamActive,
      webcamActiveRef: isWebcamActive,
      attemptId: currentAttemptId,
      examId: currentExamId,
      submissionStarted
    });

    if (videoRef.current && isWebcamActive && currentAttemptId && currentExamId && !submissionStarted) {
      // Check if video is ready and has valid dimensions
      const video = videoRef.current;
      console.log('📸 Video state:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('❌ Video not ready for screenshot capture');
        return;
      }

      // Check if tab is visible (avoid blank screenshots)
      if (document.hidden) {
        console.log('Skipping screenshot - tab not visible');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          ctx.drawImage(video, 0, 0);
          // Aggressive compression: quality 0.5 for webcam (~100KB target)
          // Webcam images don't need high quality - just need to identify the person
          const screenshot = canvas.toDataURL('image/jpeg', 0.5);

          // Verify screenshot is not blank
          if (screenshot && screenshot.length > 1000) {
            const uploadStartTime = performance.now();

            // Use direct browser-to-Drive upload with pre-authorized URI
            const uriIndex = webcamUriIndexRef.current;
            if (uriIndex < webcamUploadUrisRef.current.length) {
              const uploadUri = webcamUploadUrisRef.current[uriIndex];
              webcamUriIndexRef.current = uriIndex + 1;

              const success = await uploadScreenshotDirect(uploadUri, screenshot, 'webcam');
              const uploadTime = performance.now() - uploadStartTime;

              if (success) {
                console.log(`📸 Webcam uploaded (${Math.round(screenshot.length / 1024)}KB, ${Math.round(uploadTime)}ms, URI ${uriIndex + 1}/${webcamUploadUrisRef.current.length})`);
              }

              // Request more URIs if running low (less than 5 remaining)
              const remaining = webcamUploadUrisRef.current.length - webcamUriIndexRef.current;
              if (remaining < 5 && currentExamId) {
                console.log(`📸 [REQUEST MORE URIS] Requesting more webcam URIs (${remaining} remaining)`);
                const moreUris = await requestMoreUploadUris(currentExamId, 'webcam', 30);
                if (moreUris.success && moreUris.uris) {
                  webcamUploadUrisRef.current = [...webcamUploadUrisRef.current, ...moreUris.uris];
                  console.log(`📸 Added ${moreUris.uris.length} more webcam URIs`);
                }
              }
            } else {
              console.warn('⚠️ No webcam upload URIs available - requesting more');
              if (currentExamId) {
                const moreUris = await requestMoreUploadUris(currentExamId, 'webcam', 50);
                if (moreUris.success && moreUris.uris && moreUris.uris.length > 0) {
                  webcamUploadUrisRef.current = [...webcamUploadUrisRef.current, ...moreUris.uris];
                  const newUri = moreUris.uris[0];
                  webcamUriIndexRef.current = webcamUploadUrisRef.current.length - moreUris.uris.length + 1;
                  await uploadScreenshotDirect(newUri, screenshot, 'webcam');
                }
              }
            }
          } else {
            console.log('Screenshot appears blank - skipping upload');
          }
        } catch (err) {
          console.error('Failed to capture/upload screenshot:', err);
          // Don't interrupt exam if screenshot upload fails
          // Continue capturing next screenshots
        } finally {
          // Clean up canvas to prevent memory leaks
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    }
  };

  const captureScreenShareScreenshot = async () => {
    const currentAttemptId = attemptIdRef.current;
    const currentExamId = examIdRef.current;

    const isScreenShareActive = screenShareActiveRef.current;

    console.log('🖥️ captureScreenShareScreenshot called', {
      hasScreenShareVideoRef: !!screenShareVideoRef.current,
      screenShareActive,
      screenShareActiveRef: isScreenShareActive,
      attemptId: currentAttemptId,
      examId: currentExamId,
      submissionStarted
    });

    if (screenShareVideoRef.current && isScreenShareActive && currentAttemptId && currentExamId && !submissionStarted) {
      // Check if the underlying stream is still active
      const screenStream = (window as any).examScreenStream as MediaStream | undefined;
      const tracks = screenStream?.getVideoTracks() || [];
      const trackState = tracks[0]?.readyState;

      if (!screenStream || tracks.length === 0 || trackState !== 'live') {
        console.log('❌ Screen share stream is no longer active', {
          hasStream: !!screenStream,
          trackCount: tracks.length,
          trackState: trackState || 'no track'
        });
        return;
      }

      // Check if video is ready and has valid dimensions
      const video = screenShareVideoRef.current;
      console.log('🖥️ Screen share video state:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime,
        paused: video.paused,
        trackState
      });

      // Wait for video to be fully ready (readyState 4 = HAVE_ENOUGH_DATA)
      // Also check for minimum dimensions - 2x2 or similar indicates stream ended/placeholder
      const MIN_DIMENSION = 100;
      if (video.readyState < 4 || video.videoWidth < MIN_DIMENSION || video.videoHeight < MIN_DIMENSION) {
        console.log('❌ Screen share video not ready for screenshot capture - will retry on next interval', {
          readyState: video.readyState,
          dimensions: `${video.videoWidth}x${video.videoHeight}`,
          minRequired: MIN_DIMENSION
        });
        return;
      }

      // Additional check: make sure video has played for at least a frame
      if (video.currentTime === 0) {
        console.log('❌ Screen share video has not started playing yet');
        return;
      }

      // Check if tab is visible (avoid blank screenshots)
      if (document.hidden) {
        console.log('Skipping screen share screenshot - tab not visible');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          ctx.drawImage(video, 0, 0);
          // Screen share quality 0.6 - balance between readability and file size (~150KB target)
          const screenshot = canvas.toDataURL('image/jpeg', 0.6);

          // Verify screenshot is not blank
          if (screenshot && screenshot.length > 1000) {
            const uploadStartTime = performance.now();

            // Use direct browser-to-Drive upload with pre-authorized URI
            const uriIndex = screenUriIndexRef.current;
            if (uriIndex < screenUploadUrisRef.current.length) {
              const uploadUri = screenUploadUrisRef.current[uriIndex];
              screenUriIndexRef.current = uriIndex + 1;

              const success = await uploadScreenshotDirect(uploadUri, screenshot, 'screen');
              const uploadTime = performance.now() - uploadStartTime;

              if (success) {
                console.log(`🖥️ Screen share uploaded (${Math.round(screenshot.length / 1024)}KB, ${Math.round(uploadTime)}ms, URI ${uriIndex + 1}/${screenUploadUrisRef.current.length})`);
              } else {
                console.error('❌ Direct screen share screenshot upload failed');
              }

              // Request more URIs if running low (less than 3 remaining)
              const remaining = screenUploadUrisRef.current.length - screenUriIndexRef.current;
              if (remaining < 3 && currentExamId) {
                console.log(`🖥️ [REQUEST MORE URIS] Requesting more screen URIs (${remaining} remaining)`);
                const moreUris = await requestMoreUploadUris(currentExamId, 'screen', 30);
                if (moreUris.success && moreUris.uris) {
                  screenUploadUrisRef.current = [...screenUploadUrisRef.current, ...moreUris.uris];
                  console.log(`🖥️ Added ${moreUris.uris.length} more screen URIs`);
                }
              }
            } else {
              console.warn('⚠️ No screen upload URIs available - requesting more');
              if (currentExamId) {
                const moreUris = await requestMoreUploadUris(currentExamId, 'screen', 30);
                if (moreUris.success && moreUris.uris && moreUris.uris.length > 0) {
                  screenUploadUrisRef.current = [...screenUploadUrisRef.current, ...moreUris.uris];
                  const newUri = moreUris.uris[0];
                  screenUriIndexRef.current = screenUploadUrisRef.current.length - moreUris.uris.length + 1;
                  await uploadScreenshotDirect(newUri, screenshot, 'screen');
                }
              }
            }
          } else {
            console.log('Screen share screenshot appears blank - skipping upload');
          }
        } catch (err) {
          console.error('Failed to capture/upload screen share screenshot:', err);
          // Don't interrupt exam if screenshot upload fails
        } finally {
          // Clean up canvas to prevent memory leaks
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    }
  };

  const handleDisqualification = () => {
    // Guard against multiple disqualifications
    if (isDisqualifying || submissionStarted) return;

    setIsDisqualifying(true);
    alert('You have been disqualified due to multiple violations.');
    handleSubmit(true);
  };

  // Revert answer to submitted value if changed but not updated
  const revertUnsavedChanges = () => {
    if (!exam?.questions) return;
    const currentQuestion = exam.questions[currentQuestionIndex] as any;
    if (!currentQuestion) return;

    const currentAnswer = answers.get(currentQuestion.questionId);
    if (currentAnswer?.submitted &&
        currentAnswer.submittedAnswer &&
        currentAnswer.answer !== currentAnswer.submittedAnswer) {
      // User changed answer but didn't submit/update - revert to submitted answer
      console.log(`↩️ Reverting unsaved changes for question ${currentQuestion.questionId}`);
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestion.questionId, {
          ...currentAnswer,
          answer: currentAnswer.submittedAnswer! // Revert to submitted answer
        });
        return newAnswers;
      });
    }
  };

  // Navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      revertUnsavedChanges(); // Revert before navigating
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (exam?.questions?.length || 0) - 1) {
      revertUnsavedChanges(); // Revert before navigating
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    revertUnsavedChanges(); // Revert before navigating
    setCurrentQuestionIndex(index);
  };

  // Answer Handling - Local state update only (for typing)
  const updateLocalAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...existing!,
        answer
      });
      return newAnswers;
    });

    // Reset inactivity timer on any activity
    setLastActivityTime(Date.now());
    resetInactivityTimer(questionId);
  };

  // Save answer to server (for save progress button - NOT submitted)
  const saveAnswerToServer = async (questionId: string) => {
    const answer = answers.get(questionId)?.answer || '';

    if (!attemptId || !examId) return;

    setSavingAnswer(true);
    try {
      await saveAnswerAPI(attemptId, examId, questionId, answer, false); // false = save progress only
      setSavedAnswers(prev => new Set(prev).add(questionId));
      console.log(`✅ Answer progress saved for question ${questionId}`);
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  // MCQ selection - save and submit immediately
  const handleMCQSelect = (questionId: string, answer: string, isMultiple: boolean = false) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(questionId);

      let finalAnswer = answer;

      // Handle multiple answer selection
      if (isMultiple && existing?.answer) {
        const currentAnswers = existing.answer.split(',').map(a => a.trim()).filter(a => a);
        if (currentAnswers.includes(answer)) {
          // Remove the answer if already selected
          finalAnswer = currentAnswers.filter(a => a !== answer).join(',');
        } else {
          // Add the answer
          finalAnswer = [...currentAnswers, answer].sort().join(',');
        }
      }

      newAnswers.set(questionId, {
        ...existing!,
        answer: finalAnswer,
        // Keep submitted status - don't reset it when user modifies answer
        submitted: existing?.submitted || false
      });
      return newAnswers;
    });

    // Auto-save progress (not submitted)
    resetInactivityTimer(questionId);
  };

  // Submit answer (final submission - different from save progress)
  const submitAnswer = async (questionId: string) => {
    const answer = answers.get(questionId)?.answer || '';

    if (!attemptId || !examId || !answer) return;

    setSavingAnswer(true);
    try {
      await saveAnswerAPI(attemptId, examId, questionId, answer, true); // true = submitted
      setSavedAnswers(prev => new Set(prev).add(questionId));

      // Mark as submitted in local state and save the submitted answer
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        const existing = newAnswers.get(questionId);
        newAnswers.set(questionId, {
          ...existing!,
          submitted: true,
          submittedAnswer: answer // Save the submitted answer
        });
        return newAnswers;
      });

      console.log(`✅ Answer submitted for question ${questionId}`);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Reset inactivity timer - auto-save after 30 seconds of no activity
  const resetInactivityTimer = (questionId: string) => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      const currentAnswer = answers.get(questionId)?.answer || '';
      if (currentAnswer && attemptId && examId) {
        console.log('⏰ Auto-saving due to 30 seconds of inactivity');
        saveAnswerToServer(questionId);
      }
    }, 30000); // 30 seconds
  };

  // Legacy function for backward compatibility (MCQ clicks)
  const handleAnswerChange = async (questionId: string, answer: string) => {
    handleMCQSelect(questionId, answer);
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
      showViolationWarning('Time is up! Please submit your exam.');
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

    // Set submission started flag to stop violation logging
    setSubmissionStarted(true);
    setSubmitting(true);

    // Cancel any active fullscreen grace period
    cancelFullscreenGracePeriod();

    try {
      const timeSpent = ((exam?.duration || 0) * 60) - timeRemaining;
      const answersArray = Array.from(answers.values());

      const response = await submitExamAPI(
        attemptId,
        examId,
        answersArray,
        violations,
        timeSpent
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit exam');
      }

      // Clean up media streams
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if ((window as any).examScreenStream) {
        const stream = (window as any).examScreenStream as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      // Navigate to results
      setTimeout(() => {
        navigate(`/exams/result/${attemptId}`);
      }, 1000);

    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to submit exam. Please try again.');
      setSubmissionStarted(false); // Reset flag on error
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

  // Session Invalid - Show Error Page
  if (sessionInvalid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">
                Session Invalid
              </h1>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                {sessionError}
              </p>

              <button
                onClick={() => navigate(`/exams/${examId}/verify`, { replace: true })}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all duration-300"
              >
                Verify Password
              </button>

              <button
                onClick={() => navigate('/exams')}
                className="w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  if (examAlreadySubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">Exam Already Submitted</h3>
          <p className="text-muted-foreground mb-8">You have already submitted this exam and cannot reattempt it.</p>
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

  if (examExpired && exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">Exam Has Ended</h3>
          <p className="text-muted-foreground mb-2">{exam.examTitle}</p>
          <p className="text-muted-foreground mb-8">This exam is no longer available. The exam period has ended and submissions are closed.</p>
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
    <div
      className="min-h-screen bg-background text-foreground select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => {
        if (!exam?.settings?.proctoring?.allowRightClick) {
          e.preventDefault();
        }
      }}
    >
      {/* Proctoring Blocked Overlay */}
      {proctoringBlocked && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-destructive/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Exam Paused</h2>
            <p className="text-muted-foreground mb-6">{proctoringBlockReason}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your exam timer is still running. Please fix the issue and click the button below to continue.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-amber-500 mb-6">
              <Clock className="w-4 h-4" />
              <span>Time Remaining: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Refresh & Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Top Bar - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo & Exam Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Logo */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/173/061/original/Copy_of_Logo-Color.png?1767809951"
                    alt="Exam Portal Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Exam Portal</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
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
              {/* Check if question should be hidden after submission */}
              {currentAnswer?.submitted && currentQuestion.allowSeeQuestionAfterSubmit === false ? (
                // Question is hidden after submission
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Answer Submitted</h3>
                  <p className="text-muted-foreground mb-4">
                    You have already submitted your answer for Question {currentQuestionIndex + 1}.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This question is no longer visible after submission.
                  </p>
                </div>
              ) : (
                <>
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
                    {currentAnswer?.submitted && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                        Submitted
                      </span>
                    )}
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
                className="mb-8 text-lg leading-relaxed text-foreground overflow-x-auto question-content"
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
              {/* Styles for question content tables */}
              <style>{`
                .question-content table {
                  max-width: 100%;
                  border-collapse: collapse;
                  margin: 1rem 0;
                }
                .question-content table td,
                .question-content table th {
                  border: 1px solid #e5e7eb;
                  padding: 0.5rem 0.75rem;
                  min-width: 60px;
                }
                .dark .question-content table td,
                .dark .question-content table th {
                  border-color: #374151;
                }
                .question-content table th {
                  background: #f3f4f6;
                  font-weight: 600;
                }
                .dark .question-content table th {
                  background: #1f2937;
                }
                .question-content img {
                  max-width: 100%;
                  height: auto;
                }
              `}</style>

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

              {/* Tools Section - Available for ALL question types */}
              {(currentQuestion.enableCalculator || currentQuestion.enableScientificCalculator || currentQuestion.enableTable || currentQuestion.enableSpreadsheet || currentQuestion.enableRoughSpace) && (
                <div className="mb-6 space-y-4">
                  {/* Tool Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-2">Tools:</span>
                    {/* Show Scientific Calculator if enabled (takes precedence over basic) */}
                    {currentQuestion.enableScientificCalculator && (
                      <button
                        onClick={() => setShowScientificCalculator(!showScientificCalculator)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                          showScientificCalculator
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                        }`}
                      >
                        <Calculator className="w-4 h-4" />
                        Scientific Calculator
                      </button>
                    )}
                    {/* Show Basic Calculator only if Scientific is not enabled */}
                    {currentQuestion.enableCalculator && !currentQuestion.enableScientificCalculator && (
                      <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                          showCalculator
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Calculator className="w-4 h-4" />
                        Calculator
                      </button>
                    )}
                    {currentQuestion.enableTable && (
                      <button
                        onClick={() => setShowTableEditor(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                      >
                        <Table className="w-4 h-4" />
                        Table
                      </button>
                    )}
                    {currentQuestion.enableSpreadsheet && (
                      <button
                        onClick={() => setShowSpreadsheet(!showSpreadsheet)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                          showSpreadsheet
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        Spreadsheet
                      </button>
                    )}
                    {/* Drawing Canvas Button - for diagram answers */}
                    {currentQuestion.enableSpreadsheet && (
                      <button
                        onClick={() => setShowDrawing(!showDrawing)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                          showDrawing
                            ? 'bg-sky-500 text-white'
                            : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50'
                        }`}
                      >
                        <Pencil className="w-4 h-4" />
                        Drawing
                      </button>
                    )}
                  </div>

                  {/* Inline Spreadsheet Panel */}
                  {currentQuestion.enableSpreadsheet && (
                    <SpreadsheetPanel
                      isOpen={showSpreadsheet}
                      onToggle={() => setShowSpreadsheet(!showSpreadsheet)}
                      initialData={spreadsheetData}
                      onDataChange={setSpreadsheetData}
                      onInsertIntoAnswer={(html) => {
                        const currentValue = answers.get(currentQuestion.questionId)?.answer || '';
                        updateLocalAnswer(currentQuestion.questionId, currentValue + html);
                      }}
                    />
                  )}

                  {/* Inline Drawing Panel - for diagram answers */}
                  {currentQuestion.enableSpreadsheet && (
                    <DrawingPanel
                      isOpen={showDrawing}
                      onToggle={() => setShowDrawing(!showDrawing)}
                      initialData={drawingData}
                      onDataChange={setDrawingData}
                      onInsertIntoAnswer={(html) => {
                        const currentValue = answers.get(currentQuestion.questionId)?.answer || '';
                        updateLocalAnswer(currentQuestion.questionId, currentValue + html);
                      }}
                    />
                  )}

                  {/* Rough Work Panel - scratch space (not part of answer) */}
                  {currentQuestion.enableRoughSpace && (
                    <RoughWorkPanel
                      isOpen={showRoughWork}
                      onToggle={() => setShowRoughWork(!showRoughWork)}
                    />
                  )}
                </div>
              )}

              {/* Answer Options - MCQ */}
              {(currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'MCQ_IMAGE') && (
                <div className="space-y-4">
                  {/* Multiple Answer Notice */}
                  {currentQuestion.hasMultipleAnswers && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                        📝 This question has multiple correct answers. Select all that apply.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((option) => {
                      const optionKey = `option${option}` as keyof typeof currentQuestion;
                      const optionValue = currentQuestion[optionKey];
                      if (!optionValue) return null;

                      const selectedAnswers = currentAnswer?.answer?.split(',').map(a => a.trim()) || [];
                      const isSelected = currentQuestion.hasMultipleAnswers
                        ? selectedAnswers.includes(option)
                        : currentAnswer?.answer === option;

                      return (
                        <button
                          key={option}
                          onClick={() => handleMCQSelect(currentQuestion.questionId, option, currentQuestion.hasMultipleAnswers)}
                          disabled={currentAnswer?.submitted && currentQuestion.allowUpdateAfterSubmit === false}
                          className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                              : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30 disabled:hover:border-border disabled:hover:bg-card'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {currentQuestion.hasMultipleAnswers ? (
                              // Checkbox style for multiple answers
                              <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary shadow-lg shadow-primary/20'
                                  : 'border-muted-foreground/30 bg-background'
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            ) : (
                              // Radio button style for single answer
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary shadow-lg shadow-primary/20'
                                  : 'border-muted-foreground/30 bg-background'
                              }`}>
                                {isSelected && (
                                  <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                                )}
                              </div>
                            )}
                            <span className="font-semibold text-foreground text-base">{option}.</span>
                            <span className="text-foreground">{optionValue}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submission Settings Info */}
                  <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {currentQuestion.allowUpdateAfterSubmit !== false ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-foreground">
                        {currentQuestion.allowUpdateAfterSubmit !== false
                          ? 'You can update your answer after submitting'
                          : 'You cannot update your answer after submitting'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {currentQuestion.allowSeeQuestionAfterSubmit !== false ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-foreground">
                        {currentQuestion.allowSeeQuestionAfterSubmit !== false
                          ? 'You can view this question after submitting'
                          : 'You cannot view this question after submitting'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-4">
                    {/* Clear Answer Button */}
                    {currentAnswer?.answer && !(currentAnswer?.submitted && currentQuestion.allowUpdateAfterSubmit === false) && (
                      <button
                        onClick={() => handleMCQSelect(currentQuestion.questionId, '', false)}
                        className="px-5 py-2.5 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/50 font-medium transition-all text-sm flex items-center gap-2 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Clear Answer
                      </button>
                    )}

                    {/* Submit Answer Button */}
                    {currentAnswer?.answer && (
                      currentAnswer.submitted && currentAnswer.answer === currentAnswer.submittedAnswer ? null : (
                        <button
                          onClick={() => submitAnswer(currentQuestion.questionId)}
                          disabled={savingAnswer || (currentAnswer?.submitted && currentQuestion.allowUpdateAfterSubmit === false)}
                          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all text-sm flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                          {savingAnswer ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              {currentAnswer?.submitted ? 'Updating...' : 'Submitting...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {currentAnswer?.submitted ? 'Update Answer' : 'Submit Answer'}
                            </>
                          )}
                        </button>
                      )
                    )}

                    {/* Submitted Badge */}
                    {currentAnswer?.submitted && currentAnswer.answer === currentAnswer.submittedAnswer && (
                      <div className="px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Answer Submitted
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Answer Input - Short Answer / Long Answer with Rich Text Editor */}
              {(currentQuestion.questionType === 'SHORT_ANSWER' || currentQuestion.questionType === 'LONG_ANSWER') && (
                <div className="space-y-4">
                  {/* Rich Text Answer Editor */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      Your Answer
                      {currentQuestion.wordLimit && (
                        <span className="font-normal text-muted-foreground ml-2">
                          (Max {currentQuestion.wordLimit} words)
                        </span>
                      )}
                    </label>
                    <RichTextAnswerEditor
                      value={currentAnswer?.answer || ''}
                      onChange={(value) => updateLocalAnswer(currentQuestion.questionId, value)}
                      wordLimit={currentQuestion.wordLimit || (currentQuestion.questionType === 'SHORT_ANSWER' ? 100 : 500)}
                      disabled={currentAnswer?.submitted && currentQuestion.allowUpdateAfterSubmit === false}
                      placeholder={currentQuestion.questionType === 'SHORT_ANSWER'
                        ? 'Type your answer here...'
                        : 'Type your detailed answer here...'}
                      minHeight={currentQuestion.questionType === 'SHORT_ANSWER' ? '120px' : '250px'}
                    />
                  </div>
                </div>
              )}
                </>
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

              {/* Save Progress & Submit Answer buttons - only for non-MCQ questions */}
              {currentQuestion.questionType !== 'MCQ' && currentQuestion.questionType !== 'MCQ_IMAGE' && (
                <>
                  {/* Show buttons only if update is allowed OR answer is not yet submitted */}
                  {!(currentAnswer?.submitted && currentAnswer.answer === currentAnswer.submittedAnswer) ? (
                    <>
                      {/* Save Progress Button */}
                      <button
                        onClick={() => saveAnswerToServer(currentQuestion.questionId)}
                        disabled={savingAnswer || !currentAnswer?.answer}
                        className={`px-6 py-3.5 rounded-2xl backdrop-blur-sm border transition-all active:scale-95 flex items-center gap-2.5 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          savedAnswers.has(currentQuestion.questionId) && !currentAnswer?.submitted
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                            : 'bg-muted border-border text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {savingAnswer ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Progress
                          </>
                        )}
                      </button>

                      {/* Submit Answer Button */}
                      <button
                        onClick={() => submitAnswer(currentQuestion.questionId)}
                        disabled={savingAnswer || !currentAnswer?.answer || (currentAnswer?.submitted && currentQuestion.allowUpdateAfterSubmit === false)}
                        className={`px-6 py-3.5 rounded-2xl backdrop-blur-sm border transition-all active:scale-95 flex items-center gap-2.5 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          currentAnswer?.submitted
                            ? 'bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20'
                            : 'bg-primary border-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        {savingAnswer
                          ? (currentAnswer?.submitted ? 'Updating...' : 'Submitting...')
                          : (currentAnswer?.submitted ? 'Update Answer' : 'Submit Answer')
                        }
                      </button>
                    </>
                  ) : (
                    /* Answer submitted and no changes made - show submitted badge */
                    <div className="px-6 py-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-600 flex items-center gap-2.5 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Answer Submitted
                    </div>
                  )}
                </>
              )}

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
        <div className={`fixed right-0 top-[105px] bottom-0 w-96 bg-background border-l border-border overflow-y-auto shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

              {/* Proctoring Status */}
              {exam && !((exam as any)['Is Practice'] === 'Yes' || (exam as any).isPractice === true) && (
                <>
                  <div className="p-5 rounded-2xl bg-card border-2 border-border shadow-lg">
                    <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Proctoring
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
                        <div className="flex items-center gap-3">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Webcam</span>
                        </div>
                        {webcamActive ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Screen Share</span>
                        </div>
                        {screenShareActive ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
                        <span className="text-sm font-medium text-foreground">Violations</span>
                        <span className={`font-bold text-xl px-3 py-1 rounded-lg ${
                          violationCount > 0 
                            ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30' 
                            : 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30'
                        }`}>
                          {violationCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Webcam Preview - Always render video element, hide when inactive */}
                  <div className={webcamActive ? '' : 'hidden'}>
                    <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Live Feed</h3>
                    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-border shadow-xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-auto"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-full bg-red-600 shadow-xl">
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        <span className="text-xs font-bold text-white tracking-wider">REC</span>
                      </div>
                    </div>
                  </div>

                  {/* Hidden Screen Share Video Element - For screenshot capture only */}
                  {/* Must be rendered (not display:none) for video stream to work properly */}
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      position: 'fixed',
                      top: '-9999px',
                      left: '-9999px',
                      opacity: 0,
                      pointerEvents: 'none',
                      zIndex: -1
                    }}
                  />
                </>
              )}
          </div>
        </div>

        {/* Sidebar Toggle Button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 w-12 h-32 bg-primary text-primary-foreground shadow-2xl hover:shadow-primary/30 hover:w-16 transition-all z-50 flex items-center justify-center rounded-l-2xl group"
            title="Show sidebar"
          >
            <PanelRightOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Toast Notification for Violations */}
      {showWarning && (
        <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md backdrop-blur-sm border border-red-500/30">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm leading-relaxed">{warningMessage}</p>
          </div>
        </div>
      )}

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

      {/* Fullscreen Warning Modal with Black Overlay */}
      {fullscreenWarningActive && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card rounded-3xl max-w-lg w-full p-10 border-4 border-red-500 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Pulsing Alert Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse"></div>
              <AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-foreground mb-4 text-center">Fullscreen Required</h3>

            {/* Countdown Display */}
            <div className="mb-6">
              <p className="text-muted-foreground text-center mb-4 leading-relaxed">
                Return to fullscreen within the time limit to avoid penalty
              </p>
              <div className="text-center">
                <div className="inline-block px-8 py-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30">
                  <span className="text-6xl font-bold text-red-500 tabular-nums font-mono">
                    {fullscreenCountdown}
                  </span>
                  <p className="text-sm text-red-400 mt-2 font-semibold uppercase tracking-wider">
                    Seconds Remaining
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 h-2 bg-red-950/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(fullscreenCountdown / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Warning Message */}
            {fullscreenCountdown <= 5 && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
                <p className="text-red-500 text-center font-semibold text-sm">
                  ⚠️ Violation will be logged if you don't return to fullscreen!
                </p>
              </div>
            )}

            {/* Return to Fullscreen Button */}
            <button
              onClick={requestFullscreenAgain}
              className="w-full px-8 py-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-all shadow-2xl shadow-red-500/50 active:scale-95 flex items-center justify-center gap-3"
            >
              <Maximize className="w-6 h-6" />
              Return to Fullscreen Now
            </button>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              This exam requires fullscreen mode for security purposes
            </p>
          </div>
        </div>
      )}

      {/* Permission Error Modal */}
      {permissionError.show && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card rounded-3xl max-w-lg w-full p-10 border-4 border-red-500 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Alert Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse"></div>
              <AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-foreground mb-4 text-center">Permissions Required</h3>

            {/* Message */}
            <div className="mb-8">
              <p className="text-muted-foreground text-center leading-relaxed whitespace-pre-line">
                {permissionError.message}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setPermissionError({show: false, message: ''});
                navigate(`/exams/${examId}/consent`);
              }}
              className="w-full px-8 py-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg transition-all shadow-2xl shadow-primary/50 active:scale-95 flex items-center justify-center gap-3"
            >
              <Shield className="w-6 h-6" />
              Grant Permissions
            </button>
          </div>
        </div>
      )}

      {/* Answer Tools - Side Panels */}
      <CalculatorPanel
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      <ScientificCalculatorPanel
        isOpen={showScientificCalculator}
        onClose={() => setShowScientificCalculator(false)}
      />

      <TableEditor
        isOpen={showTableEditor}
        onClose={() => setShowTableEditor(false)}
        initialData={tableData}
        onSave={(data) => {
          setTableData(data);
        }}
      />
    </div>
  );
};

export default ExamAttempt;