/**
 * Assignment Management API Service
 * Handles all communication with the Assignment Backend
 */

const ASSIGNMENT_API_URL = process.env.REACT_APP_ASSIGNMENT_BACKEND_URL || '';

export interface AssignmentQuestion {
  question: string;
  mandatory: string; // 'Yes' or 'No'
}

export interface InstructorFile {
  name: string;
  url: string;
}

export interface AssignmentURL {
  name: string;
  url: string;
}

export interface AssignmentData {
  assignmentId?: string;
  batch: string;
  term: string;
  domain?: string;
  subject: string;
  publish: string; // 'Yes' or 'No'
  assignmentHeader: string;
  subHeader?: string;
  assignmentDetails?: string; // HTML content from Quill editor
  assignmentURLs?: AssignmentURL[]; // Array of up to 5 name+url pairs
  startDateTime: string;
  endDateTime: string;
  totalMarks?: string;
  folderName?: string;
  createInDrive: string; // 'Yes' or 'No'
  createdAt?: string;
  status?: string;
  edited?: string;
  editedAt?: string;
  editedBy?: string;
  driveLink?: string;
  fileUploadLink?: string;
  sheetsLink?: string;
  instructorFiles?: InstructorFile[]; // Array of file URLs
  groupAssignment: string; // 'Yes' or 'No'
  attachmentMandatory: string; // 'Yes' or 'No'
  urlMandatory: string; // 'Yes' or 'No'
  fileTypes?: string; // Comma-separated file extensions
  questions?: AssignmentQuestion[];
  uploadedFiles?: { name: string; data: string; mimeType: string }[]; // For file upload in creation
  // Peer Rating & Review fields
  groupRatingRemarkEnabled?: string; // 'Yes' or 'No'
  maximumGroupMembers?: string; // Number as string
  // Individual questions for form submission
  q1?: string;
  q1Mandatory?: string;
  q2?: string;
  q2Mandatory?: string;
  q3?: string;
  q3Mandatory?: string;
  q4?: string;
  q4Mandatory?: string;
  q5?: string;
  q5Mandatory?: string;
  q6?: string;
  q6Mandatory?: string;
  q7?: string;
  q7Mandatory?: string;
  q8?: string;
  q8Mandatory?: string;
  q9?: string;
  q9Mandatory?: string;
  q10?: string;
  q10Mandatory?: string;
  q11?: string;
  q11Mandatory?: string;
  q12?: string;
  q12Mandatory?: string;
  q13?: string;
  q13Mandatory?: string;
  q14?: string;
  q14Mandatory?: string;
  q15?: string;
  q15Mandatory?: string;
  q16?: string;
  q16Mandatory?: string;
  q17?: string;
  q17Mandatory?: string;
  q18?: string;
  q18Mandatory?: string;
  q19?: string;
  q19Mandatory?: string;
  q20?: string;
  q20Mandatory?: string;
}

export interface AssignmentFilters {
  batch?: string;
  term?: string;
  subject?: string;
  status?: string;
  publish?: string;
}

export interface AssignmentDropdowns {
  batches: string[];
  terms: string[];
  hierarchy: {
    [batch: string]: {
      [term: string]: {
        [domain: string]: string[];
      };
    };
  };
  fileTypes: string[];
}

export interface PeerRating {
  memberName: string;
  rating: number; // 0-5 with 0.5 increments
  remark: string;
}

export interface PeerRatingsData {
  hasSubmitted: boolean;
  ratings: PeerRating[];
  timestamp?: string;
}

export interface AverageRatingsData {
  averageRating: number;
  totalRatings: number;
  remarks: string[];
}

class AssignmentApiService {
  // Timeout for API requests (90 seconds to allow for large file uploads)
  private readonly REQUEST_TIMEOUT = 90000;

  private async makeRequest<T>(
    action: string,
    params: any,
    studentEmail: string
  ): Promise<{ success: boolean; data?: T; error?: string; networkError?: boolean }> {
    try {
      // Prepare form data like the working Placement backend
      const formData = new URLSearchParams();
      formData.append('action', action);
      formData.append('studentEmail', studentEmail);
      formData.append('params', JSON.stringify(params));

      if (action === 'updateAssignment') {
        console.log('🌐 Making POST request to backend:');
        console.log('  🎬 action:', action);
        console.log('  👤 studentEmail:', studentEmail);
        console.log('  📦 params (stringified):', JSON.stringify(params, null, 2));
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(ASSIGNMENT_API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (action === 'updateAssignment') {
        console.log('✅ Response from backend:');
        console.log('  📥 result:', result);

        if (result.debug) {
          console.log('🐛 DEBUG INFO FROM BACKEND:');
          console.log('  📊 Updated Row Length:', result.debug.updatedRowLength);
          console.log('  👥 Group Assignment (updatedRow[22]):', result.debug.groupAssignment);
          console.log('  ⭐ Group Rating Enabled (updatedRow[68]):', result.debug.groupRatingEnabled);
          console.log('  🔢 Max Group Members (updatedRow[69]):', result.debug.maxGroupMembers);
          console.log('  📋 Sheets Link:', result.debug.sheetsLink);

          if (result.debug.updateHeadersResult) {
            console.log('  📝 Update Headers Result:', result.debug.updateHeadersResult);

            if (result.debug.updateHeadersResult.peerRatingDebug) {
              const prd = result.debug.updateHeadersResult.peerRatingDebug;
              console.log('  🎯 PEER RATING DEBUG:');
              console.log('    ✓ Condition Met:', prd.conditionMet);
              console.log('    ✓ Sheet Created:', prd.sheetCreated);
              console.log('    ✓ Sheet Already Exists:', prd.sheetAlreadyExists);
              console.log('    ✓ Error:', prd.error);
            }

            if (result.debug.updateHeadersResult.spreadsheetId) {
              console.log('  📂 Response Spreadsheet ID:', result.debug.updateHeadersResult.spreadsheetId);
              console.log('  📂 Response Spreadsheet Name:', result.debug.updateHeadersResult.spreadsheetName);
              console.log('  📂 All Sheets:', result.debug.updateHeadersResult.sheetNames);
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Error in ${action}:`, error);

      // Check if this is a network error (Failed to fetch, timeout, etc.)
      const isNetworkError = error instanceof Error && (
        error.message === 'Failed to fetch' ||
        error.name === 'AbortError' ||
        error.message.includes('network') ||
        error.message.includes('timeout')
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        networkError: isNetworkError,
      };
    }
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    studentEmail: string,
    assignmentData: AssignmentData
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('createAssignment', assignmentData, studentEmail);
  }

  /**
   * Update an existing assignment
   */
  async updateAssignment(
    studentEmail: string,
    assignmentId: string,
    assignmentData: AssignmentData
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log('📤 API Service - updateAssignment called:');
    console.log('  📋 assignmentId:', assignmentId);
    console.log('  👤 studentEmail:', studentEmail);
    console.log('  👥 assignmentData.groupAssignment:', assignmentData.groupAssignment);
    console.log('  ⭐ assignmentData.groupRatingRemarkEnabled:', assignmentData.groupRatingRemarkEnabled);
    console.log('  🔢 assignmentData.maximumGroupMembers:', assignmentData.maximumGroupMembers);

    return this.makeRequest(
      'updateAssignment',
      { assignmentId, assignmentData },
      studentEmail
    );
  }

  /**
   * Get all assignments with optional filters
   */
  async getAssignments(
    studentEmail: string,
    filters?: AssignmentFilters,
    isAdmin?: boolean
  ): Promise<{ success: boolean; data?: AssignmentData[]; error?: string }> {
    return this.makeRequest<AssignmentData[]>(
      'getAssignments',
      { filters, isAdmin: isAdmin || false },
      studentEmail
    );
  }

  /**
   * Delete an assignment (soft delete)
   */
  async deleteAssignment(
    studentEmail: string,
    assignmentId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('deleteAssignment', { assignmentId }, studentEmail);
  }

  /**
   * Change assignment status
   */
  async changeAssignmentStatus(
    studentEmail: string,
    assignmentId: string,
    status: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'changeAssignmentStatus',
      { assignmentId, status },
      studentEmail
    );
  }

  /**
   * Get dropdown data for assignment form
   */
  async getAssignmentDropdowns(
    studentEmail: string
  ): Promise<{ success: boolean; data?: AssignmentDropdowns; error?: string }> {
    return this.makeRequest<AssignmentDropdowns>(
      'getAssignmentDropdowns',
      {},
      studentEmail
    );
  }

  /**
   * Get subjects by batch and term
   */
  async getSubjectsByBatch(
    studentEmail: string,
    batch: string,
    term: string
  ): Promise<{ success: boolean; data?: string[]; error?: string }> {
    return this.makeRequest<string[]>(
      'getSubjectsByBatch',
      { batch, term },
      studentEmail
    );
  }

  /**
   * Upload file to assignment folder
   */
  async uploadAssignmentFile(
    studentEmail: string,
    file: File,
    assignmentId: string
  ): Promise<{ success: boolean; data?: { fileUrl: string; fileName: string }; error?: string }> {
    try {
      const base64String = await this.fileToBase64(file);

      return this.makeRequest(
        'uploadAssignmentFile',
        {
          fileData: base64String,
          fileName: file.name,
          mimeType: file.type,
          assignmentId,
        },
        studentEmail
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Check submission status for a student
   */
  async checkSubmissionStatus(
    studentEmail: string,
    assignmentId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'checkSubmissionStatus',
      { assignmentId },
      studentEmail
    );
  }

  /**
   * Submit assignment
   */
  async submitAssignment(
    studentEmail: string,
    submissionData: {
      assignmentId: string;
      studentName: string;
      answers: Record<string, string>;
      files: { name: string; displayName?: string; data: string; mimeType: string }[];
      uploadedFileUrls?: {
        name: string;
        fileName: string;
        url: string;
        fileUrl: string;
        fileId: string;
        id: string;
        mimeType: string
      }[];
      urls?: { name: string; link: string }[];
      groupName?: string;
      groupMembers?: string[];
      isUpdate?: boolean;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'submitAssignment',
      submissionData,
      studentEmail
    );
  }

  /**
   * Get student's previous submissions
   */
  async getStudentSubmissions(
    studentEmail: string,
    assignmentId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'getStudentSubmissions',
      { assignmentId },
      studentEmail
    );
  }

  /**
   * Get students by subject for group assignment selection
   */
  async getStudentsBySubject(
    studentEmail: string,
    batch: string,
    subject: string
  ): Promise<{ success: boolean; data?: { email: string; fullName: string; rollNo: string }[]; error?: string }> {
    return this.makeRequest(
      'getStudentsBySubject',
      { batch, subject },
      studentEmail
    );
  }

  /**
   * Push refresh request to students (Admin only)
   */
  async pushRefreshRequest(
    adminEmail: string,
    reason: string,
    bannerNotice: string,
    requireFullScreen: boolean,
    startDateTime?: string,
    endDateTime?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'pushRefreshRequest',
      { adminEmail, reason, bannerNotice, requireFullScreen, startDateTime, endDateTime },
      adminEmail
    );
  }

  /**
   * Check if student needs to refresh
   */
  async checkRefreshRequired(
    studentEmail: string
  ): Promise<{ success: boolean; data?: { refreshRequired: boolean; timestamp?: string; reason?: string; bannerNotice?: string; requireFullScreen?: boolean }; error?: string }> {
    return this.makeRequest(
      'checkRefreshRequired',
      {},
      studentEmail
    );
  }

  /**
   * Acknowledge refresh notification
   */
  async acknowledgeRefresh(
    studentEmail: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'acknowledgeRefresh',
      {},
      studentEmail
    );
  }

  /**
   * Initiate resumable upload for large files
   */
  async initiateResumableUpload(
    studentEmail: string,
    uploadData: {
      assignmentId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      studentName: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'initiateResumableUpload',
      uploadData,
      studentEmail
    );
  }

  /**
   * Finalize resumable upload after all chunks uploaded
   */
  async finalizeResumableUpload(
    studentEmail: string,
    finalizeData: {
      uploadUrl: string;
      fileSize: number;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'finalizeResumableUpload',
      finalizeData,
      studentEmail
    );
  }

  /**
   * Recover file URL from Drive when finalization fails
   */
  async recoverUploadedFile(
    studentEmail: string,
    recoveryData: {
      assignmentId: string;
      studentName: string;
      fileName: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'recoverUploadedFile',
      recoveryData,
      studentEmail
    );
  }

  /**
   * Get group members by subject group for pre-filling
   */
  async getGroupMembersBySubjectGroup(
    studentEmail: string,
    batch: string,
    subject: string
  ): Promise<{ success: boolean; data?: { email: string; fullName: string; rollNo: string }[]; groupName?: string | null; error?: string }> {
    return this.makeRequest(
      'getGroupMembersBySubjectGroup',
      { batch, subject },
      studentEmail
    );
  }

  /**
   * Submit peer ratings and remarks
   */
  async submitPeerRatings(
    studentEmail: string,
    ratingsData: {
      submissionId: string;
      studentName: string;
      ratings: PeerRating[];
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'submitPeerRatings',
      ratingsData,
      studentEmail
    );
  }

  /**
   * Get peer ratings for a specific submission
   */
  async getPeerRatings(
    studentEmail: string,
    submissionId: string
  ): Promise<{ success: boolean; data?: PeerRatingsData; error?: string }> {
    return this.makeRequest<PeerRatingsData>(
      'getPeerRatings',
      { submissionId },
      studentEmail
    );
  }

  /**
   * Get average ratings and all remarks for a student
   */
  async getAverageRatings(
    studentEmail: string,
    assignmentId: string
  ): Promise<{ success: boolean; data?: AverageRatingsData; error?: string }> {
    return this.makeRequest<AverageRatingsData>(
      'getAverageRatings',
      { assignmentId },
      studentEmail
    );
  }

  /**
   * Save new Subject Term entry (when "Others" is selected)
   */
  async saveSubjectTermEntry(
    studentEmail: string,
    batch: string,
    term: string,
    domain: string,
    subject: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest(
      'saveSubjectTermEntry',
      { batch, term, domain, subject },
      studentEmail
    );
  }
}

export const assignmentApiService = new AssignmentApiService();
