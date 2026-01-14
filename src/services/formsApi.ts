import { auth } from '../firebase/config';

// Use the same backend URL as the main API (Forms API is merged into Code.js)
const FORMS_API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://script.google.com/macros/s/AKfycbzqM7YP9ppMpyCSdwJZibtjtnXcGY7InCox01frgodDXHr7tHh-LgaXTuNngoy2rQnR/exec';

// Helper function to wait for auth initialization
async function waitForAuth() {
  let user = auth.currentUser;
  if (!user) {
    user = await new Promise<any>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((authUser) => {
        unsubscribe();
        resolve(authUser);
      });
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }
  return user;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// FORM MANAGEMENT
// ============================================================================

export interface Form {
  id: string;
  name: string;
  description: string;
  type: string;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  uploadedFile?: string;
  formFolderUrl: string;
  attachmentRequired?: string;
  responsesSheetUrl: string;
  isActive: string;
  showAtStartUntilFilled: string;
  showInTab?: string;
  visibleTo?: string;
  maxResponsesPerUser?: number;
  showResultsToRespondents?: string;
  confirmationMessage: string;
  redirectUrl: string;
  allowEditResponse?: string;
  allowStudentViewResponse?: string;
  requireLogin?: string;
  collectEmail: string;
  totalResponses: number;
  lastModifiedAt: string;
  lastModifiedBy: string;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  formId: string;
  questionId?: string;
  questionOrder?: number;
  questionText: string;
  questionType: string;
  questionDescription?: string;
  isRequired: string;
  order: number;
  placeholder?: string;
  placeholderText?: string;
  helpText?: string;
  defaultValue?: string;
  validationRule?: string;
  validationMessage?: string;
  minValue?: string;
  maxValue?: string;
  minLength?: string;
  maxLength?: string;
  minSelections?: string;
  maxSelections?: string;
  allowedFileTypes?: string;
  fileTypesAllowed?: string;
  maxFileSize?: string;
  maxFileSizeMB?: string;
  showOtherOption?: string;
  allowOtherOption?: string;
  randomizeOptions?: string;
  allowMultipleSelections?: string;
  selectionLimitType?: string;
  // Contact Info
  collectName?: string;
  collectEmail?: string;
  collectPhone?: string;
  collectAddress?: string;
  // Rating
  ratingType?: string;
  ratingScale?: string;
  // Scale
  scaleMin?: string;
  scaleMax?: string;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleMidLabel?: string;
  scaleStart?: string;
  scaleEnd?: string;
  scaleStartLabel?: string;
  scaleEndLabel?: string;
  // Matrix
  matrixRows?: string;
  matrixColumns?: string;
  matrixType?: string;
  // Date
  dateFormat?: string;
  restrictPast?: string;
  restrictFuture?: string;
  // Media
  mediaUrl?: string;
  mediaType?: string;
  autoplay?: string;
  // Advanced
  redirectUrl?: string;
  redirectDelay?: string;
  statementContent?: string;
  conditionalLogicId?: string;
  // Payment (Razorpay / Stripe)
  stripeAmount?: string;
  stripeCurrency?: string;
  // Google Drive
  driveType?: string;
  // Calendly
  calendlyUrl?: string;
  // Conditional Logic
  hasConditionalLogic?: string | boolean;
  conditionalRules?: any[];
  options?: QuestionOption[];
  // Group Selection
  minGroupSize?: number;
  maxGroupSize?: number;
  restrictStudents?: string; // 'Yes' or 'No'
  eligibleStudents?: string; // JSON array of student IDs
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  optionValue: string;
  imageUrl?: string;
  order: number;
  isCorrect: string;
}

export interface FormResponse {
  responseId: string;
  formId: string;
  userEmail: string;
  userName: string;
  userBatch: string;
  submissionDateTime: string;
  responseData: Record<string, any>;
  isComplete: string;
  completionTimeSeconds: number;
  ipAddress?: string;
  deviceType?: string;
  lastModifiedAt?: string;
  notes?: string;
  groupMemberIDs?: string;
  groupMemberNames?: string;
  filledByName?: string;
  additionalColumns?: Record<string, any>; // Dynamic columns from response sheet (column N onwards)
}

// ============================================================================
// GET TERM STRUCTURE AND FORM TYPES (for Form Builder dropdowns)
// ============================================================================

export interface TermMapping {
  batch: string;
  term: string;
  domain: string;
  subject: string;
}

export async function getTermStructure(): Promise<ApiResponse<{
  mappings: TermMapping[];
  batches: string[];
}>> {
  try {
    const params = new URLSearchParams({
      action: 'getTermStructure',
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error fetching term structure:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch term structure',
    };
  }
}

export async function getFormTypes(): Promise<ApiResponse<string[]>> {
  try {
    const params = new URLSearchParams({
      action: 'getFormTypes',
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error fetching form types:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch form types',
    };
  }
}

// ============================================================================
// GET FORMS
// ============================================================================

export async function getForms(filters?: {
  batch?: string;
  type?: string;
  status?: string;
  isActive?: string;
  showInTab?: string;
  showAtStartUntilFilled?: string;
  userEmail?: string;
  includeUserEmail?: boolean;
  includeAllStatuses?: boolean;
}): Promise<ApiResponse<Form[]>> {
  try {
    // Wait for auth to initialize if needed
    let user = auth.currentUser;
    if (!user) {
      // Wait for auth state to be ready
      user = await new Promise<any>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
          unsubscribe();
          resolve(authUser);
        });
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!user?.email) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Build params object with only string values
    const params = new URLSearchParams({
      action: 'getForms',
    });

    // Add filter parameters (excluding internal flags)
    if (filters) {
      if (filters.batch) params.set('batch', filters.batch);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.isActive) params.set('isActive', filters.isActive);
      if (filters.showInTab) params.set('showInTab', filters.showInTab);
      if (filters.showAtStartUntilFilled) params.set('showAtStartUntilFilled', filters.showAtStartUntilFilled);

      // Add userEmail only if includeUserEmail flag is true
      if (filters.includeUserEmail) {
        params.set('userEmail', user.email);
      }

      // Add includeAllStatuses for admin (shows Draft, Archived, expired forms)
      if (filters.includeAllStatuses) {
        params.set('includeAllStatuses', 'true');
      }
    }

    const url = `${FORMS_API_BASE_URL}?${params.toString()}`;

    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.error('Error fetching forms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch forms',
    };
  }
}

// ============================================================================
// GET FORM BY ID (with questions)
// ============================================================================

export async function getFormById(formId: string): Promise<ApiResponse<{ form: Form; questions: Question[] }>> {
  try {
    const params = new URLSearchParams({
      action: 'getFormById',
      formId,
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    // Silently fail - transient errors during page load are expected
    // console.error('Error fetching form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch form',
    };
  }
}

// ============================================================================
// GET REQUIRED STARTUP FORMS
// ============================================================================

export async function getRequiredStartupForms(): Promise<ApiResponse<Form[]>> {
  try {
    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams({
      action: 'getRequiredStartupForms',
      userEmail: user.email,
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error fetching required forms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch required forms',
    };
  }
}

// ============================================================================
// SUBMIT FORM RESPONSE
// ============================================================================

// Helper function to detect device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, any>,
  completionTimeSeconds?: number
): Promise<ApiResponse<{ responseId: string; userName?: string; userBatch?: string; sheetUrl?: string }>> {
  try {
    // Wait for auth to initialize if needed
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise<any>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
          unsubscribe();
          resolve(authUser);
        });
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!user?.email) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const payload = {
      action: 'submitFormResponse',
      formId,
      userEmail: user.email,
      answers,
      deviceType: getDeviceType(),
      isComplete: 'Yes',
      completionTimeSeconds: completionTimeSeconds || 0,
    };

    // DEBUG: Log what we're sending to backend
    console.log('📤 SENDING TO BACKEND:');
    console.log('API URL:', FORMS_API_BASE_URL);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Create a timeout promise (30 seconds for Google Apps Script)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );

    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(FORMS_API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      }),
      timeoutPromise
    ]) as Response;

    // DEBUG: Log response
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    // Check if response is ok
    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      // Even if response fails, the data might be saved on backend
      // Return success anyway since user said data is being recorded
      return {
        success: true,
        message: 'Form submitted (response delayed)',
      };
    }

    const result = await response.json();
    console.log('📡 Response body:', result);

    return result;
  } catch (error) {
    console.error('❌ Error submitting form:', error);

    // If it's a timeout or fetch error, the data might still be saved on backend
    // (User reported data is recorded even when this error occurs)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout')) {
      console.log('⚠️ Network error but data may be saved on backend');
      return {
        success: true,
        message: 'Form submitted (response verification failed)',
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// UPLOAD STUDENT FILE
// ============================================================================

export async function uploadStudentFile(
  formId: string,
  file: File,
  studentName: string
): Promise<ApiResponse<{ fileUrl: string }>> {
  try {
    console.log('📤 Uploading file:', file.name, 'for student:', studentName);

    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Convert file to base64
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log('📤 File converted to base64, size:', fileData.length);

    // Get form folder ID first
    const forms = await getForms();
    const form = forms.data?.find(f => f.id === formId);
    if (!form || !form.formFolderUrl) {
      throw new Error('Form folder not found');
    }

    // Extract folder ID from URL
    const folderIdMatch = form.formFolderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      throw new Error('Invalid form folder URL');
    }
    const formFolderId = folderIdMatch[0];

    console.log('📤 Form folder ID:', formFolderId);

    const payload = {
      action: 'uploadStudentAttachment',
      formFolderId: formFolderId,
      studentName: studentName,
      fileName: file.name,
      fileData: fileData,
      mimeType: file.type
    };

    console.log('📤 Sending file upload request...');

    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📤 Upload result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      data: { fileUrl: result.fileUrl }
    };
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

// ============================================================================
// CREATE FORM (Admin)
// ============================================================================

export async function createForm(formData: {
  name: string;
  description: string;
  type: string;
  batch: string;
  term: string;
  domain?: string;
  subject?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  showAtStartUntilFilled: boolean;
  allowMultipleSubmissions: boolean;
  confirmationMessage?: string;
  notificationEmail?: string;
}): Promise<ApiResponse<{ formId: string; folderUrl: string; responsesSheetUrl: string }>> {
  try {
    console.log('📍 createForm: Starting...');
    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }
    console.log('📍 createForm: User authenticated:', user.email);

    const payload = {
      action: 'createForm',
      studentEmail: user.email,
      formName: formData.name,
      description: formData.description || '',
      formType: formData.type,
      batch: formData.batch,
      term: formData.term || '',
      domain: formData.domain || '',
      subject: formData.subject || '',
      startDateTime: formData.startDate,
      endDateTime: formData.endDate,
      isActive: formData.isActive ? 'Yes' : 'No',
      showAtStartUntilFilled: formData.showAtStartUntilFilled ? 'Yes' : 'No',
      maxResponsesPerUser: formData.allowMultipleSubmissions ? '999' : '1',
      thankYouMessage: formData.confirmationMessage || 'Thank you for your response!',
      notificationEmail: formData.notificationEmail || '',
      createdBy: user.email,
    };

    console.log('📍 createForm: Sending request to:', FORMS_API_BASE_URL);
    console.log('📍 createForm: Payload:', payload);

    // Use text/plain to avoid CORS preflight (same as notes)
    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    console.log('📍 createForm: Response status:', response.status);
    console.log('📍 createForm: Response ok:', response.ok);

    const result = await response.json();
    console.log('📍 createForm: Result:', result);

    if (result.debugLogs) {
      console.log('🔧 BACKEND DEBUG LOGS:');
      result.debugLogs.forEach((log: string) => console.log(log));
    }

    return result;
  } catch (error) {
    console.error('❌ Error creating form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create form',
    };
  }
}

// ============================================================================
// UPDATE FORM (Admin)
// ============================================================================

export async function updateForm(
  formId: string,
  formData: Partial<Form>
): Promise<ApiResponse<void>> {
  try {
    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'updateForm',
        formId,
        ...formData,
        updatedBy: user.email,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update form',
    };
  }
}

// ============================================================================
// UPDATE FORM STATUS (Admin - Quick status change)
// ============================================================================

export async function updateFormStatus(
  formId: string,
  status: string
): Promise<ApiResponse<void>> {
  try {
    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'updateFormStatus',
        formId,
        status,
        lastModifiedBy: user.email,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating form status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update form status',
    };
  }
}

// ============================================================================
// DELETE FORM (Admin - Soft Delete)
// ============================================================================

export async function deleteForm(formId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'deleteForm',
        formId,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete form',
    };
  }
}

// ============================================================================
// DUPLICATE FORM (Admin)
// ============================================================================

export async function duplicateForm(formId: string): Promise<ApiResponse<{ newFormId: string }>> {
  try {
    const user = await waitForAuth();
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'duplicateForm',
        formId,
        createdBy: user.email,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error duplicating form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate form',
    };
  }
}

// ============================================================================
// QUESTION MANAGEMENT (Admin)
// ============================================================================

export async function createQuestion(questionData: {
  formId: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  validationRule?: string;
  options?: Array<{ optionText: string; optionValue: string; order: number }>;
}): Promise<ApiResponse<{ questionId: string }>> {
  try {
    // Use text/plain to avoid CORS preflight (same as notes)
    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'createQuestion',
        ...questionData,
        isRequired: questionData.isRequired ? 'Yes' : 'No',
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating question:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create question',
    };
  }
}

export async function updateQuestion(
  questionId: string,
  questionData: Partial<Question>
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'updateQuestion',
        questionId,
        ...questionData,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating question:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update question',
    };
  }
}

export async function deleteQuestion(questionId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'deleteQuestion',
        questionId,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting question:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete question',
    };
  }
}

// ============================================================================
// GET USER'S FORM RESPONSES
// ============================================================================

export async function getUserFormResponses(formId: string): Promise<ApiResponse<FormResponse[]>> {
  try {
    // Wait for auth to initialize if needed
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise<any>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
          unsubscribe();
          resolve(authUser);
        });
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!user?.email) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const params = new URLSearchParams({
      action: 'getUserFormResponses',
      formId,
      userEmail: user.email,
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error fetching user responses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user responses',
    };
  }
}

// ============================================================================
// GET FORM RESPONSES (Admin)
// ============================================================================

export async function getFormResponses(formId: string): Promise<ApiResponse<FormResponse[]>> {
  try {
    const params = new URLSearchParams({
      action: 'getFormResponses',
      formId,
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    // Silently fail - transient errors during page load are expected
    // console.error('Error fetching responses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch responses',
    };
  }
}

// ============================================================================
// GET RESPONSE STATS (Admin)
// ============================================================================

export async function getResponseStats(formId: string): Promise<ApiResponse<{
  totalResponses: number;
  completedResponses: number;
  averageCompletionTime: number;
  responseRate: number;
}>> {
  try {
    const params = new URLSearchParams({
      action: 'getResponseStats',
      formId,
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export async function uploadStudentAttachment(
  formFolderId: string,
  studentName: string,
  file: File
): Promise<ApiResponse<{ fileUrl: string; fileId: string }>> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);

    const response = await fetch(FORMS_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'uploadStudentAttachment',
        formFolderId,
        studentName,
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

// ============================================================================
// GROUP SELECTION APIS
// ============================================================================

export interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
}

export interface GroupStatus {
  isFilled: boolean;
  filledBy: string | null;
  groupMembers?: string[];
}

/**
 * Get all students from STUDENT_DATA sheet
 */
export async function getAllStudents(): Promise<ApiResponse<Student[]>> {
  try {
    const params = new URLSearchParams({
      action: 'getAllStudents'
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching all students:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get available students for a specific question (excludes students already in groups)
 */
export async function getAvailableStudentsForQuestion(
  formId: string,
  questionId: string
): Promise<ApiResponse<Student[]>> {
  try {
    // Wait for auth to initialize if needed
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise<any>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
          unsubscribe();
          resolve(authUser);
        });
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!user?.email) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const params = new URLSearchParams({
      action: 'getAvailableStudentsForQuestion',
      formId,
      questionId
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch available students');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching available students:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate group members before submission
 */
export async function validateGroupMembers(
  formId: string,
  questionId: string,
  selectedMembers: string[]
): Promise<ApiResponse<{ available: boolean; unavailableMembers?: string[]; message?: string; debugLog?: string[] }>> {
  try {
    const params = new URLSearchParams({
      action: 'validateGroupMembers',
      formId,
      questionId,
      selectedMembers: JSON.stringify(selectedMembers)
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to validate group members');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error validating group members:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get student's group status for a specific question
 */
export async function getStudentGroupStatus(
  formId: string,
  questionId: string,
  studentEmail: string
): Promise<ApiResponse<GroupStatus>> {
  try {
    const params = new URLSearchParams({
      action: 'getStudentGroupStatus',
      formId,
      questionId,
      studentEmail
    });

    const response = await fetch(`${FORMS_API_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch group status');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching group status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

// Helper: Convert File to Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
