/**
 * Core Type Definitions
 * Strongly typed interfaces for the Online MBA LMS
 */

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  batch: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'student' | 'admin' | 'instructor' | 'mentor';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: ApiMetadata;
}

export interface ApiMetadata {
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  batch?: string;
}

// ============================================
// Content Types
// ============================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: Priority;
  author: string;
  authorAvatar?: string;
  attachments?: Attachment[];
  targetBatches: string[];
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type AnnouncementCategory =
  | 'general'
  | 'academic'
  | 'placement'
  | 'event'
  | 'urgent'
  | 'holiday';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  thumbnailUrl?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  downloadCount: number;
  targetBatches: string[];
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | 'document'
  | 'video'
  | 'audio'
  | 'image'
  | 'link'
  | 'archive';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// ============================================
// Session & Recording Types
// ============================================

export interface Session {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  term: string;
  domain: string;
  subject: string;
  sessionNumber: number;
  scheduledAt: string;
  duration: number; // in minutes
  status: SessionStatus;
  meetingLink?: string;
  isLive: boolean;
  hasRecording: boolean;
  recording?: Recording;
  notes?: Note[];
  attendance?: number;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled';

export interface Recording {
  id: string;
  sessionId: string;
  title: string;
  duration: number;
  views: number;
  formats: RecordingFormat[];
  thumbnailUrl?: string;
  transcriptUrl?: string;
  createdAt: string;
}

export interface RecordingFormat {
  type: 'speaker' | 'gallery' | 'screen_share' | 'audio';
  url: string;
  quality: 'sd' | 'hd' | 'fhd';
  size: number;
}

export interface Note {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  timestamp?: number; // video timestamp in seconds
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Exam Types
// ============================================

export interface Exam {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: ExamType;
  status: ExamStatus;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  settings: ExamSettings;
  targetBatches: string[];
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export type ExamType =
  | 'quiz'
  | 'midterm'
  | 'final'
  | 'practice'
  | 'assignment';

export type ExamStatus =
  | 'draft'
  | 'published'
  | 'active'
  | 'completed'
  | 'archived';

export interface ExamSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  proctoring: ProctoringSettings;
  maxAttempts: number;
  passwordProtected: boolean;
}

export interface ProctoringSettings {
  enabled: boolean;
  webcamRequired: boolean;
  screenShareRequired: boolean;
  tabSwitchDetection: boolean;
  copyPasteBlocked: boolean;
  screenshotInterval: number; // in seconds
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
  attachments?: Attachment[];
  order: number;
}

export type QuestionType =
  | 'mcq'
  | 'mcq_multiple'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'numerical'
  | 'fill_blank'
  | 'match'
  | 'ordering';

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalMarks: number;
  percentage?: number;
  answers: AnswerSubmission[];
  violations: Violation[];
  timeSpent: number; // in seconds
}

export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'expired';

export interface AnswerSubmission {
  questionId: string;
  answer: string | string[];
  marksObtained?: number;
  isCorrect?: boolean;
  timeSpent: number;
}

export interface Violation {
  type: ViolationType;
  timestamp: string;
  details: string;
  screenshotUrl?: string;
}

export type ViolationType =
  | 'tab_switch'
  | 'copy_paste'
  | 'screen_share_stopped'
  | 'webcam_blocked'
  | 'multiple_faces'
  | 'no_face';

// ============================================
// Assignment Types
// ============================================

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: AssignmentType;
  status: AssignmentStatus;
  dueDate: string;
  totalMarks: number;
  submissionType: SubmissionType;
  isGroupAssignment: boolean;
  groupSize?: number;
  rubric?: Rubric;
  attachments: Attachment[];
  targetBatches: string[];
  createdAt: string;
  updatedAt: string;
}

export type AssignmentType =
  | 'individual'
  | 'group'
  | 'peer_review';

export type AssignmentStatus =
  | 'draft'
  | 'published'
  | 'active'
  | 'closed'
  | 'graded';

export type SubmissionType =
  | 'file'
  | 'url'
  | 'text'
  | 'form';

export interface Rubric {
  id: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  groupId?: string;
  status: SubmissionStatus;
  content?: string;
  fileUrl?: string;
  linkUrl?: string;
  score?: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
  peerRatings?: PeerRating[];
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
}

export type SubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'late'
  | 'graded'
  | 'returned';

export interface PeerRating {
  raterId: string;
  raterName: string;
  rating: number;
  feedback?: string;
  createdAt: string;
}

// ============================================
// Form Types
// ============================================

export interface Form {
  id: string;
  title: string;
  description: string;
  type: FormType;
  status: FormStatus;
  fields: FormField[];
  settings: FormSettings;
  targetBatches: string[];
  deadline?: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export type FormType =
  | 'survey'
  | 'feedback'
  | 'registration'
  | 'consent'
  | 'application';

export type FormStatus =
  | 'draft'
  | 'active'
  | 'closed'
  | 'archived';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  conditionalLogic?: ConditionalLogic;
  order: number;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'rating'
  | 'scale';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
}

export interface ConditionalLogic {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: string;
  action: 'show' | 'hide';
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  showProgressBar: boolean;
  confirmationMessage: string;
  notifyOnSubmission: boolean;
  requiredAtStart: boolean;
}

export interface FormResponse {
  id: string;
  formId: string;
  userId: string;
  responses: Record<string, FormFieldValue>;
  submittedAt: string;
}

export type FormFieldValue = string | string[] | number | boolean | File;

// ============================================
// Placement Types
// ============================================

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: SalaryRange;
  applicationDeadline: string;
  status: JobStatus;
  applicationCount: number;
  targetBatches: string[];
  applicationQuestions?: FormField[];
  createdAt: string;
  updatedAt: string;
}

export type JobType =
  | 'full_time'
  | 'part_time'
  | 'internship'
  | 'contract';

export type JobStatus =
  | 'active'
  | 'closed'
  | 'filled'
  | 'cancelled';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'annual';
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  resume?: string;
  coverLetter?: string;
  responses?: Record<string, FormFieldValue>;
  appliedAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'interviewed'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

// ============================================
// Calendar & Events Types
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  meetingLink?: string;
  color?: string;
  targetBatches: string[];
  reminders: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | 'class'
  | 'exam'
  | 'assignment'
  | 'webinar'
  | 'holiday'
  | 'deadline'
  | 'other';

export interface Reminder {
  id: string;
  time: number; // minutes before event
  type: 'email' | 'push' | 'sms';
}

// ============================================
// Policy Types
// ============================================

export interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  effectiveDate: string;
  requiresAcknowledgement: boolean;
  acknowledgements?: PolicyAcknowledgement[];
  createdAt: string;
  updatedAt: string;
}

export interface PolicyAcknowledgement {
  userId: string;
  userName: string;
  acknowledgedAt: string;
}

// ============================================
// Community Types
// ============================================

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  content: string;
  attachments?: Attachment[];
  likes: number;
  comments: Comment[];
  isLiked?: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'post'
  | 'question'
  | 'announcement'
  | 'achievement'
  | 'milestone';

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  badges: Badge[];
  activities: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardData {
  upcomingSessions: Session[];
  recentAnnouncements: Announcement[];
  pendingAssignments: Assignment[];
  upcomingExams: Exam[];
  unreadForms: Form[];
  calendarEvents: CalendarEvent[];
  progressStats: ProgressStats;
}

export interface ProgressStats {
  coursesCompleted: number;
  totalCourses: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  examsCompleted: number;
  totalExams: number;
  averageScore: number;
  attendancePercentage: number;
  rank?: number;
  totalStudents?: number;
}

// ============================================
// Utility Types
// ============================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
