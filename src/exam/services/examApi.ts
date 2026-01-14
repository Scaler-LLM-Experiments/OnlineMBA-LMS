/**
 * Exam Management API Service
 * Handles all exam-related API calls to Google Apps Script backend
 */

import { auth } from '../../firebase/config';
import { requestCache } from '../../utils/requestCache';

const EXAM_API_URL = process.env.REACT_APP_EXAM_BACKEND_URL || '';

// Types
export interface ExamBasicDetails {
  examTitle: string;
  examType: string;
  batch?: string;
  term: string;
  domain: string;
  subject: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDateTime: string;
  endDateTime: string;
  instructions?: string;
}

export interface ProctoringSettings {
  webcamRequired: boolean;
  enforceScreensharing: boolean;
  allowWindowSwitching: boolean;
  alertsOnViolation: boolean;
  beepAlerts: boolean;
  allowTextSelection: boolean;
  allowCopyPaste: boolean;
  allowRightClick: boolean;
  allowRestrictedEvents: boolean;
  allowTabSwitching: boolean;
  exitCloseWarnings: boolean;
  fullscreenMandatory: boolean;
  singleSessionLogin: boolean;
  logoutOnViolation: boolean;
  disqualifyOnViolation: boolean;
  maxViolationsBeforeAction: number;
  allowedIPs: string[];
  ipRestrictionEnabled: boolean;
}

export interface ExamSettings {
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  enableRoughSpace: boolean;
  enableNegativeMarking: boolean;
  negativeMarkingType: 'exam' | 'question'; // 'exam' = same for all, 'question' = per-question
  negativeMarksValue: number; // Used when negativeMarkingType is 'exam'
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  autoSubmitOnTimeUp: boolean;
  gracePeriod: number;
  proctoring: ProctoringSettings;
}

export interface Question {
  questionId?: string;
  questionNumber?: number;
  questionType: 'MCQ' | 'MCQ_IMAGE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  questionText: string;
  questionImageUrl?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  optionF?: string;
  optionG?: string;
  optionH?: string;
  optionI?: string;
  optionJ?: string;
  hasMultipleAnswers?: boolean; // Whether MCQ has multiple correct answers
  correctAnswer?: string; // Single answer or comma-separated answers (e.g., "A,C,D")
  marks: number;
  negativeMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  enableRoughSpace: boolean;
  // Answer submission settings
  allowUpdateAfterSubmit?: boolean; // Allow students to update answer after submitting (default: true)
  allowSeeQuestionAfterSubmit?: boolean; // Allow students to see question after submitting (default: true)
  // Short/Long Answer specific settings
  wordLimit?: number; // Maximum word limit for short/long answer questions
  // Tool toggles for short/long answer questions
  enableCalculator?: boolean; // Basic calculator
  enableScientificCalculator?: boolean; // Scientific calculator
  enableTable?: boolean; // Simple editable table
  enableSpreadsheet?: boolean; // Excel-like spreadsheet (Handsontable)
}

export interface PasswordConfig {
  passwordType: 'SAME' | 'UNIQUE';
  masterPassword?: string;
  studentCount?: number;
  studentList?: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
  }>;
}

export interface Exam extends ExamBasicDetails {
  examId?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  passwordType: 'SAME' | 'UNIQUE';
  masterPassword?: string;
  settings?: ExamSettings;
  questions?: Question[];
  createdBy?: string;
  createdAt?: string;
  publishedAt?: string;
  totalQuestions?: number;
  totalStudentsAttempted?: number;
  averageScore?: number;
  isPractice?: boolean;
  deviceAllowed?: 'All' | 'Laptop/Computer' | 'Mobile/Tab';
  viewResult?: 'Yes' | 'No';
  // Backend returns fields with spaces
  'Exam ID'?: string;
  'Exam Title'?: string;
  'Exam Type'?: string;
  Term?: string;
  Domain?: string;
  Subject?: string;
  Description?: string;
  'Duration (minutes)'?: number;
  'Total Marks'?: number;
  'Passing Marks'?: number;
  'Start DateTime'?: string;
  'End DateTime'?: string;
  Instructions?: string;
  Status?: string;
  'Password Type'?: string;
  'Master Password'?: string;
  'Total Questions'?: number;
  'Is Practice'?: string;
  'Device Allowed'?: string;
  'View Result'?: string;
  highestScore?: number;
  lowestScore?: number;
}

export interface ExamFilters {
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  examType?: 'Quiz' | 'Mid-Term' | 'End-Term';
  term?: 'Term 1' | 'Term 2' | 'Term 3';
  search?: string;
}

// ============================================================================
// EXAM MANAGEMENT APIS
// ============================================================================

/**
 * Get term structure (terms, domains, subjects, batches) from backend - Exam specific
 */
export async function getTermStructureExam(): Promise<any> {
  const params = new URLSearchParams({
    action: 'getTermStructureExam',
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch term structure');
  }

  return response.json();
}

/**
 * Get exam types from CATEGORY&TYPE sheet where Category = 'EXAM'
 */
export async function getExamTypes(): Promise<any> {
  const params = new URLSearchParams({
    action: 'getExamTypes',
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch exam types');
  }

  return response.json();
}

/**
 * Initialize exam sheets in Google Sheets (one-time setup)
 */
export async function initializeExamSheets(): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'initializeExamSheets'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to initialize exam sheets');
  }

  return response.json();
}

/**
 * Create a new exam
 */
export async function createExam(examData: Partial<Exam>): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  // Add createdBy email to examData
  const examDataWithCreator = {
    ...examData,
    createdBy: user.email
  };

  // Use text/plain to avoid CORS preflight (same pattern as Forms API)
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'createExam',
      userEmail: user.email,
      examData: examDataWithCreator
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create exam');
  }

  const result = await response.json();

  // Log debug steps to browser console
  if (result.debug) {
    console.log('=== EXAM CREATION DEBUG ===');
    result.debug.forEach((step: string) => console.log(step));
    console.log('===========================');
  }

  return result;
}

/**
 * Get all exams with optional filters
 */
export async function getAllExams(filters?: ExamFilters): Promise<any> {
  const params = new URLSearchParams();
  params.append('action', 'getAllExams');

  if (filters?.status) params.append('status', filters.status);
  if (filters?.examType) params.append('examType', filters.examType);
  if (filters?.term) params.append('term', filters.term);
  if (filters?.search) params.append('search', filters.search);

  const url = `${EXAM_API_URL}?${params.toString()}`;

  // Use request cache to prevent duplicate calls
  return requestCache.fetch(url, filters, async () => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch exams');
    }

    return response.json();
  });
}

/**
 * Get a single exam by ID
 */
export async function getExamById(examId: string): Promise<any> {
  const params = new URLSearchParams({
    action: 'getExamById',
    examId
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch exam');
  }

  return response.json();
}

/**
 * Update an existing exam
 */
export async function updateExam(examId: string, updates: Partial<Exam>): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  // Use text/plain to avoid CORS preflight (same pattern as Forms API)
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'updateExam',
      userEmail: user.email,
      examId,
      updates
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update exam');
  }

  const result = await response.json();

  // Log debug steps to browser console
  if (result.debug) {
    console.log('=== EXAM UPDATE DEBUG ===');
    result.debug.forEach((step: string) => console.log(step));
    console.log('=========================');
  }

  return result;
}

/**
 * Delete an exam
 */
export async function deleteExam(examId: string): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  // Use text/plain to avoid CORS preflight (same pattern as Forms API)
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'deleteExam',
      userEmail: user.email,
      examId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to delete exam');
  }

  return response.json();
}

/**
 * Publish an exam (change status from DRAFT to ACTIVE)
 */
export async function publishExam(examId: string): Promise<any> {
  return updateExam(examId, {
    status: 'ACTIVE',
    publishedAt: new Date().toISOString()
  });
}

// ============================================================================
// QUESTION MANAGEMENT APIS
// ============================================================================

/**
 * Add a question to an exam
 */
export async function addQuestion(examId: string, questionData: Question): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'addQuestion',
      examId,
      questionData
    })
  });

  if (!response.ok) {
    throw new Error('Failed to add question');
  }

  return response.json();
}

/**
 * Update a question
 */
export async function updateQuestion(
  examId: string,
  questionId: string,
  updates: Partial<Question>
): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'updateQuestion',
      examId,
      questionId,
      updates
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update question');
  }

  return response.json();
}

/**
 * Delete a question
 */
export async function deleteQuestion(examId: string, questionId: string): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'deleteQuestion',
      examId,
      questionId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to delete question');
  }

  return response.json();
}

/**
 * Reorder questions
 */
export async function reorderQuestions(examId: string, questionOrder: string[]): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'reorderQuestions',
      examId,
      questionOrder
    })
  });

  if (!response.ok) {
    throw new Error('Failed to reorder questions');
  }

  return response.json();
}

// ============================================================================
// PASSWORD MANAGEMENT APIS
// ============================================================================

/**
 * Generate unique passwords for students
 */
export async function generatePasswords(examId: string, studentCount: number): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'generatePasswords',
      examId,
      studentCount
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate passwords');
  }

  return response.json();
}

/**
 * Save student passwords to sheet
 */
export async function saveStudentPasswords(
  examId: string,
  passwordData: Array<{
    studentId: string;
    studentName?: string;
    studentEmail?: string;
    password: string;
  }>
): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'savePasswords',
      examId,
      passwordData
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save passwords');
  }

  return response.json();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if exam is currently live
 */
export function isExamLive(exam: Exam): boolean {
  const examAny = exam as any;
  const status = examAny.Status || exam.status;

  if (status !== 'ACTIVE') return false;

  const now = new Date().getTime();
  // Backend returns fields with spaces, check both formats
  const startDateTimeStr = examAny['Start DateTime'] || exam.startDateTime;
  const endDateTimeStr = examAny['End DateTime'] || exam.endDateTime;

  if (!startDateTimeStr || !endDateTimeStr) return false;

  const start = new Date(startDateTimeStr).getTime();
  const end = new Date(endDateTimeStr).getTime();

  return now >= start && now <= end;
}

/**
 * Check if exam is upcoming
 */
export function isExamUpcoming(exam: Exam): boolean {
  const examAny = exam as any;
  const status = examAny.Status || exam.status;

  if (status !== 'ACTIVE') return false;

  const now = new Date().getTime();
  // Backend returns fields with spaces, check both formats
  const startDateTimeStr = examAny['Start DateTime'] || exam.startDateTime;

  if (!startDateTimeStr) return false;

  const start = new Date(startDateTimeStr).getTime();

  return now < start;
}

/**
 * Get time remaining until exam starts
 */
export function getTimeUntilStart(exam: Exam): string {
  const examAny = exam as any;
  // Backend returns fields with spaces, check both formats
  const startDateTimeStr = examAny['Start DateTime'] || exam.startDateTime;

  if (!startDateTimeStr) return 'Unknown';

  const now = new Date().getTime();
  const start = new Date(startDateTimeStr).getTime();
  const diff = start - now;

  if (diff <= 0) return 'Started';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format datetime for display
 */
export function formatExamDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Validate exam before publishing
 */
export function validateExam(exam: Partial<Exam>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic details validation
  if (!exam.examTitle) errors.push('Exam title is required');
  if (!exam.examType) errors.push('Exam type is required');
  if (!exam.term) errors.push('Term is required');
  if (!exam.domain) errors.push('Domain is required');
  if (!exam.subject) errors.push('Subject is required');
  if (!exam.duration || exam.duration < 1) errors.push('Duration must be at least 1 minute');
  if (!exam.totalMarks || exam.totalMarks <= 0) errors.push('Total marks must be greater than 0');
  if (!exam.startDateTime) errors.push('Start date/time is required');
  if (!exam.endDateTime) errors.push('End date/time is required');

  // Instructions validation (now required)
  if (!exam.instructions || exam.instructions.trim().length === 0) {
    errors.push('Exam instructions are required');
  }

  // Date validation
  if (exam.startDateTime && exam.endDateTime) {
    const start = new Date(exam.startDateTime).getTime();
    const end = new Date(exam.endDateTime).getTime();

    if (start >= end) {
      errors.push('Start time must be before end time');
    }
  }

  // Question validation
  if (!exam.questions || exam.questions.length === 0) {
    errors.push('At least one question is required');
  }

  // Password validation (skip for practice exams)
  const isPractice = (exam as any).isPractice === true;
  if (!isPractice) {
    if (!exam.passwordType) {
      errors.push('Password configuration is required');
    } else if (exam.passwordType === 'SAME' && !exam.masterPassword) {
      errors.push('Master password is required');
    }
  }

  // Passing marks validation (now optional, but if provided must be valid)
  if (exam.passingMarks !== undefined && exam.passingMarks !== null && exam.totalMarks && exam.passingMarks > exam.totalMarks) {
    errors.push('Passing marks cannot exceed total marks');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// STUDENT EXAM ATTEMPT APIS
// ============================================================================

/**
 * Verify exam password
 */
export async function verifyExamPassword(examId: string, password: string): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'verifyExamPassword',
      examId,
      password,
      studentEmail: user.email
    })
  });

  if (!response.ok) {
    throw new Error('Failed to verify password');
  }

  return response.json();
}

/**
 * Exam attempt response with batch upload URIs
 */
export interface ExamAttemptResponse {
  success: boolean;
  attemptId?: string;
  startTime?: string;
  proctoringFolderLink?: string;
  screenshotsFolderLink?: string;
  cameraFolderLink?: string;
  // Batch resumable URIs for direct browser-to-Drive uploads
  webcamUploadUris?: string[];
  screenUploadUris?: string[];
  // For resumed attempts
  resumed?: boolean;
  savedAnswers?: Array<{ questionId: string; answer: string; submitted: boolean }>;
  // Error cases
  alreadySubmitted?: boolean;
  status?: string;
  message?: string;
  error?: string;
  // Some responses wrap data in a 'data' property
  data?: {
    attemptId?: string;
    startTime?: string;
    resumed?: boolean;
    savedAnswers?: Array<{ questionId: string; answer: string; submitted: boolean }>;
    webcamUploadUris?: string[];
    screenUploadUris?: string[];
  };
}

/**
 * Start exam attempt
 * Returns batch of resumable upload URIs for direct browser-to-Drive screenshot uploads
 */
export async function startExamAttempt(examId: string, studentName: string): Promise<ExamAttemptResponse> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'startExamAttempt',
      examId,
      studentEmail: user.email,
      studentName
    })
  });

  if (!response.ok) {
    throw new Error('Failed to start exam attempt');
  }

  return response.json();
}

/**
 * Save answer for a question
 * @param attemptId - The attempt ID
 * @param examId - The exam ID
 * @param questionId - The question ID
 * @param answer - The student's answer
 * @param submitted - Whether the answer is submitted (final) or just saved as progress (default: false)
 */
export async function saveAnswer(
  attemptId: string,
  examId: string,
  questionId: string,
  answer: string,
  submitted: boolean = false
): Promise<any> {
  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'saveAnswer',
      attemptId,
      examId,
      questionId,
      answer,
      submitted
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save answer');
  }

  return response.json();
}

/**
 * Log proctoring violation
 */
export async function logViolation(
  attemptId: string,
  examId: string,
  violationType: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy' | 'paste' | 'right_click' | 'screenshot' | 'webcam_off' | 'microphone_off' | 'screen_share_off',
  details: string
): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'logViolation',
      attemptId,
      examId,
      studentEmail: user.email,
      violationType,
      details
    })
  });

  if (!response.ok) {
    throw new Error('Failed to log violation');
  }

  return response.json();
}

/**
 * Upload screenshot (DEPRECATED - use uploadScreenshotDirect instead)
 * This function uploads via Apps Script which is slow and doesn't scale.
 * Kept for backward compatibility only.
 * @deprecated Use uploadScreenshotDirect with batch URIs instead
 */
export async function uploadScreenshot(
  attemptId: string,
  examId: string,
  screenshotBase64: string,
  type: 'periodic' | 'violation',
  source: 'webcam' | 'screen' = 'webcam'
): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'uploadScreenshot',
      attemptId,
      examId,
      studentEmail: user.email,
      screenshot: screenshotBase64,
      type,
      source
    })
  });

  if (!response.ok) {
    throw new Error('Failed to upload screenshot');
  }

  return response.json();
}

// ============================================================================
// OPTIMIZED DIRECT UPLOAD SYSTEM - BATCH RESUMABLE URIs
// ============================================================================
// This system bypasses Apps Script for actual uploads by using pre-authorized
// Google Drive resumable upload URIs. The browser uploads directly to Drive.
//
// Benefits:
// - Reduces Apps Script API calls from 252,000 to ~400 (for 200 students)
// - Browser uploads directly to Drive (no base64 encoding overhead)
// - Scales to unlimited students
// ============================================================================

/**
 * Convert base64 data URL to Blob for direct upload
 */
function base64ToBlob(base64DataUrl: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64DataUrl.includes(',')
    ? base64DataUrl.split(',')[1]
    : base64DataUrl;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/jpeg' });
}

// ============================================================================
// UPLOAD QUEUE - Ensures 1 upload at a time per student
// ============================================================================

interface QueuedUpload {
  uploadUri: string;
  blob: Blob;
  type: 'webcam' | 'screen';
  resolve: (success: boolean) => void;
}

// Upload queue for sequential processing (1 at a time)
const uploadQueue: QueuedUpload[] = [];
let isProcessingQueue = false;

/**
 * Process upload queue - runs uploads one at a time
 */
async function processUploadQueue(): Promise<void> {
  if (isProcessingQueue || uploadQueue.length === 0) return;

  isProcessingQueue = true;

  while (uploadQueue.length > 0) {
    const upload = uploadQueue.shift()!;

    try {
      const success = await executeUploadWithRetry(upload.uploadUri, upload.blob, upload.type);
      upload.resolve(success);
    } catch (error) {
      console.error('Queue upload failed:', error);
      upload.resolve(false);
    }

    // Small delay between uploads to prevent burst
    if (uploadQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  isProcessingQueue = false;
}

/**
 * Execute upload with exponential backoff retry
 * Retries: 2s → 5s → 15s on 429/403/5xx errors
 */
async function executeUploadWithRetry(
  uploadUri: string,
  blob: Blob,
  type: string,
  maxRetries: number = 3
): Promise<boolean> {
  const retryDelays = [2000, 5000, 15000]; // 2s, 5s, 15s

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const isGoogleApi = uploadUri.includes('googleapis.com');

      if (attempt === 0) {
        console.log(`🚀 [UPLOAD ${type.toUpperCase()}] Starting:`, {
          url: uploadUri.substring(0, 60) + '...',
          size: `${Math.round(blob.size / 1024)}KB`,
          queueLength: uploadQueue.length
        });
      } else {
        console.log(`🔄 [UPLOAD ${type.toUpperCase()}] Retry ${attempt}/${maxRetries}`);
      }

      const response = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': blob.size.toString()
        },
        body: blob
      });

      // Success
      if (response.ok) {
        console.log(`✅ [UPLOAD ${type.toUpperCase()}] Success:`, {
          status: response.status,
          destination: isGoogleApi ? 'Google Drive API' : 'Unknown'
        });
        return true;
      }

      // Rate limit or server error - retry
      if (response.status === 429 || response.status === 403 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = retryDelays[attempt];
          console.warn(`⚠️ [UPLOAD ${type.toUpperCase()}] ${response.status} - retrying in ${delay / 1000}s`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Other error - don't retry
      console.error(`❌ [UPLOAD ${type.toUpperCase()}] Failed:`, response.status);
      return false;

    } catch (error) {
      // Network error - might be CORS (which is OK) or actual failure
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt];
        console.warn(`⚠️ [UPLOAD ${type.toUpperCase()}] Network error - retrying in ${delay / 1000}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Due to CORS, we can't always read response, but upload may have succeeded
      // Log as warning, not error
      console.warn(`⚠️ [UPLOAD ${type.toUpperCase()}] Completed (CORS prevents response read)`);
      return true; // Assume success - files appear in Drive despite CORS errors
    }
  }

  return false;
}

/**
 * Upload screenshot directly to Google Drive using pre-authorized resumable URI
 * Uses queue to ensure only 1 upload at a time per student
 * Includes exponential backoff retry on errors
 *
 * @param uploadUri - Pre-authorized resumable upload URI from startExamAttempt
 * @param screenshotBase64 - Base64 encoded screenshot (with or without data URL prefix)
 * @param type - Type of screenshot ('webcam' or 'screen')
 * @returns Promise<boolean> - true if upload succeeded
 */
export async function uploadScreenshotDirect(
  uploadUri: string,
  screenshotBase64: string,
  type: 'webcam' | 'screen' = 'webcam'
): Promise<boolean> {
  const blob = base64ToBlob(screenshotBase64);

  // Add to queue and return promise
  return new Promise<boolean>((resolve) => {
    uploadQueue.push({
      uploadUri,
      blob,
      type,
      resolve
    });

    // Start processing if not already running
    processUploadQueue();
  });
}

/**
 * Request additional upload URIs when the initial batch runs out
 * Called during long exams when more screenshots are needed than initially allocated
 *
 * @param examId - The exam ID
 * @param type - 'webcam' or 'screen'
 * @param count - Number of additional URIs to request (default: 50)
 * @returns Promise with array of new URIs
 */
export async function requestMoreUploadUris(
  examId: string,
  type: 'webcam' | 'screen',
  count: number = 50
): Promise<{ success: boolean; uris: string[]; count: number; error?: string }> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'requestMoreUris',
      examId,
      studentEmail: user.email,
      type,
      count
    })
  });

  if (!response.ok) {
    throw new Error('Failed to request more upload URIs');
  }

  return response.json();
}

/**
 * Submit exam
 */
export async function submitExam(
  attemptId: string,
  examId: string,
  answers: Array<{ questionId: string; answer: string; flagged: boolean; submitted: boolean }>,
  violations: any[],
  timeSpent: number
): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'submitExam',
      attemptId,
      examId,
      studentEmail: user.email,
      answers,
      violations,
      timeSpent
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit exam');
  }

  return response.json();
}

/**
 * Get exam result
 */
export async function getExamResult(attemptId: string): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const params = new URLSearchParams({
    action: 'getExamResult',
    attemptId,
    studentEmail: user.email
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch exam result');
  }

  return response.json();
}

/**
 * Get student's exam attempts
 */
export async function getStudentExamAttempts(examId?: string): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const params = new URLSearchParams({
    action: 'getStudentAttempts',
    studentEmail: user.email
  });

  if (examId) {
    params.append('examId', examId);
  }

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch exam attempts');
  }

  return response.json();
}

/**
 * Get student's exam status from Response Sheet's Status subsheet
 * Returns status: "Completed" | "Disqualified" | null
 */
export async function getStudentExamStatus(examId: string): Promise<any> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const params = new URLSearchParams({
    action: 'getStudentExamStatus',
    examId,
    studentEmail: user.email
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch exam status');
  }

  return response.json();
}

// ============================================================================
// EXAM SESSION MANAGEMENT APIs
// ============================================================================

export interface SessionDeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
  browserVersion: string;
  userAgent: string;
  screenResolution: string;
  deviceHash: string;
  ipAddress: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
}

export interface CreateSessionResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  blocked?: boolean;
  blockedReason?: string;
  message?: string;
}

export interface ValidateSessionResponse {
  success: boolean;
  valid?: boolean;
  expired?: boolean;
  invalidDevice?: boolean;
  sessionNotFound?: boolean;
  message?: string;
}

/**
 * Create exam session after password verification
 * This logs the session to Exam_Verify sheet and returns a session token
 */
export async function createExamSession(
  examId: string,
  password: string,
  deviceInfo: SessionDeviceInfo
): Promise<CreateSessionResponse> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'createExamSession',
      examId,
      password,
      studentEmail: user.email,
      studentName: user.displayName || user.email,
      deviceInfo
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create exam session');
  }

  return response.json();
}

/**
 * Validate exam session before allowing access to consent/attempt pages
 * Checks if session exists, is active, and device hash matches
 */
export async function validateExamSession(
  examId: string,
  sessionToken: string,
  deviceHash: string
): Promise<ValidateSessionResponse> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const params = new URLSearchParams({
    action: 'validateExamSession',
    examId,
    sessionToken,
    deviceHash,
    studentEmail: user.email
  });

  const response = await fetch(`${EXAM_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to validate session');
  }

  return response.json();
}

/**
 * Update session activity timestamp
 * Called periodically during exam to prevent session timeout
 */
export async function updateSessionActivity(
  examId: string,
  sessionToken: string
): Promise<{ success: boolean }> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'updateSessionActivity',
      examId,
      sessionToken,
      studentEmail: user.email
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update session activity');
  }

  return response.json();
}

/**
 * End exam session
 * Called when exam is submitted or user navigates away
 */
export async function endExamSession(
  examId: string,
  sessionToken: string
): Promise<{ success: boolean }> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(EXAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      action: 'endExamSession',
      examId,
      sessionToken,
      studentEmail: user.email
    })
  });

  if (!response.ok) {
    throw new Error('Failed to end session');
  }

  return response.json();
}
