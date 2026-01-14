// Students Corner type imports
import { StudentsCornerActivity, StudentsCornerDashboardData, LeaderboardEntry } from '../types/studentsCorner';
import { auth } from '../firebase/config';

// Main Backend API - Student Portal (all features except placement)
const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://script.google.com/macros/s/AKfycbzqM7YP9ppMpyCSdwJZibtjtnXcGY7InCox01frgodDXHr7tHh-LgaXTuNngoy2rQnR/exec';

// Placement Backend API - Job Portal & Placement features only
const PLACEMENT_BACKEND_URL = process.env.REACT_APP_PLACEMENT_BACKEND_URL || 'https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec';

// Log the backend URLs being used
console.log('🚀 SSB Main Backend URL:', BACKEND_URL);
console.log('💼 SSB Placement Backend URL:', PLACEMENT_BACKEND_URL);

// Content Management Types
export interface URLLink {
  name: string;
  url: string;
}

export interface FileAttachment {
  name: string;
  url: string;
  folderUrl?: string;
}

export interface ResourceData {
  id?: string;
  title: string;
  description: string;
  resourceType: string;
  resourceTypeCustom?: string;
  level: 'Session' | 'Subject' | 'Domain' | 'Term';
  batch: string;
  term?: string;
  domain?: string;
  subject?: string;
  sessionName?: string;
  targetBatch?: string;
  showOtherBatches?: string;
  startDateTime?: string;
  endDateTime?: string;
  learningObjectives?: string;
  prerequisites?: string;
  priority?: string;
  files?: FileAttachment[];
  urls?: URLLink[];
  postedBy?: string;
  status?: string;
  notes?: string;
  publish?: string;
  // File fields (up to 5 files)
  file1Name?: string;
  file1Url?: string;
  file2Name?: string;
  file2Url?: string;
  file3Name?: string;
  file3Url?: string;
  file4Name?: string;
  file4Url?: string;
  file5Name?: string;
  file5Url?: string;
}

export interface EventData {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  categoryType?: string; // 'EVENTS' or 'ANNOUNCEMENTS'
  eventType?: string; // Event Subtype
  announcementType?: string; // Announcement Subtype
  priority?: string; // 'High', 'Medium', 'Low'
  batch: string;
  targetBatch?: string;
  showOtherBatches?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string; // Event Location/Link
  agenda?: string; // Event Agenda
  speakerInfo?: string; // Speaker Info
  displayInCalendar?: string; // 'Yes' or 'No'
  requiresAcknowledgement?: string; // 'Yes' or 'No'
  registrationRequired?: string; // 'Yes' or 'No'
  registrationLink?: string;
  maxAttendees?: string;
  coverImageUrl?: string;
  files?: FileAttachment[];
  urls?: URLLink[];
  postedBy?: string;
  editedBy?: string;
  status?: string;
  notes?: string;
}

export interface PolicyData {
  id?: string;
  title: string;
  description: string;
  fullContent?: string;  // HTML content from rich text editor
  policyType: string;
  category: string;
  version?: string;
  batch: string;
  targetBatch?: string;
  showOtherBatches?: string;
  effectiveDate?: string;
  expiryDate?: string;
  supersedes?: string;
  files?: FileAttachment[];
  urls?: URLLink[];
  postedBy?: string;
  status?: string;
  notes?: string;
}

export interface FolderStructure {
  batches: string[];
  terms?: string[];
  domains?: string[];
  subjects?: string[];
  sessions?: string[];
}

export interface DropdownOptions {
  options: string[];
}

export interface StudentProfile {
  email: string;
  fullName: string;
  rollNo: string;
  batch: string;
  options?: string[];
  isAdmin?: boolean;
}

export interface FullStudentProfile {
  email: string;
  fullName: string;
  rollNo: string;
  batch: string;
  aboutMe: string;
  phoneNo: string;
  currentLocation: string;
  linkedIn: string;
  portfolioLink: string;
  github: string;
  undergraduateCollege: string;
  undergraduateStream: string;
  graduationYear: string;
  previousCompany: string;
  previousRole: string;
  previousDuration: string;
  techSkills: string;
  softSkills: string;
  achievements: string;
  certifications: string;
  interests: string;
  languages: string;
  profilePicture: string;
  // Placement fields (Column X onwards)
  placementView?: string; // X (23)
  experienceType?: string; // Y (24) - "Fresher" or "Experienced"
  preferredLocations?: string; // Z (25) - Comma-separated
  prevCompany1Name?: string; // AA (26)
  prevCompany1Role?: string; // AB (27)
  prevCompany1Duration?: string; // AC (28)
  prevCompany1CTC?: string; // AD (29)
  prevCompany2Name?: string; // AE (30)
  prevCompany2Role?: string; // AF (31)
  prevCompany2Duration?: string; // AG (32)
  prevCompany2CTC?: string; // AH (33)
  prevCompany3Name?: string; // AI (34)
  prevCompany3Role?: string; // AJ (35)
  prevCompany3Duration?: string; // AK (36)
  prevCompany3CTC?: string; // AL (37)
  internship1Company?: string; // AM (38)
  internship1Role?: string; // AN (39)
  internship1Duration?: string; // AO (40)
  internship1Stipend?: string; // AP (41)
  internship2Company?: string; // AQ (42)
  internship2Role?: string; // AR (43)
  internship2Duration?: string; // AS (44)
  internship2Stipend?: string; // AT (45)
  internship3Company?: string; // AU (46)
  internship3Role?: string; // AV (47)
  internship3Duration?: string; // AW (48)
  internship3Stipend?: string; // AX (49)
  previousCTCTotal?: string; // AY (50)
  previousStipendTotal?: string; // AZ (51)
  totalFTExperienceMonths?: string; // BA (52)
  totalInternshipExperienceMonths?: string; // BB (53)
  project1Title?: string; // BC (54)
  project1Description?: string; // BD (55)
  project1Link?: string; // BE (56)
  project2Title?: string; // BF (57)
  project2Description?: string; // BG (58)
  project2Link?: string; // BH (59)
  project3Title?: string; // BI (60)
  project3Description?: string; // BJ (61)
  project3Link?: string; // BK (62)
  otherLink1Title?: string; // BL (63)
  otherLink1URL?: string; // BM (64)
  otherLink2Title?: string; // BN (65)
  otherLink2URL?: string; // BO (66)
  domain1?: string; // BP (67)
  domain1ResumeURL?: string; // BQ (68)
  domain2?: string; // BR (69)
  domain2ResumeURL?: string; // BS (70)
  domain3?: string; // BT (71)
  domain3ResumeURL?: string; // BU (72)
  resumeGeneralURL?: string; // BV (73)
  preferredDomain1?: string; // BW (74)
  preferredDomain1RelevantExperienceMonths?: string; // BX (75)
  preferredDomain2?: string; // BY (76)
  preferredDomain2RelevantExperienceMonths?: string; // BZ (77)
}

export interface ContentItem {
  id: string;
  category: string;
  eventType: string;
  title: string;
  subTitle: string;
  content?: string;
  priority: string;
  status: string;
  term?: string;
  domain?: string;
  subject?: string;
  groups?: string;
  postedBy?: string;
  createdAt: string;
  editedAt?: string;
  editedBy?: string;
  startDateTime: string;
  endDateTime: string;
  targetBatch?: string;
  targetStudents?: string;
  requiresAcknowledgment: boolean;
  driveLink?: string;
  sheetsLink?: string;
  fileuploadLink?: string;
  fileURL?: string;
  hasFiles: boolean;
  isNew: boolean;
  daysUntilDeadline: number | null;
  isAcknowledged?: boolean;
  acknowledgmentTimestamp?: string;
  files?: Array<{
    url: string;
    name: string;
  }>;
  
  // Category-specific fields
  
  // ASSIGNMENTS & TASKS
  instructions?: string;
  maxPoints?: string;
  submissionGuidelines?: string;
  rubricLink?: string;
  groupSize?: string;
  
  // ANNOUNCEMENTS
  messageDetails?: string;
  callToAction?: string;
  readTracking?: string;
  
  // EVENTS
  eventTitle?: string;
  eventLocation?: string;
  eventAgenda?: string;
  speakerInfo?: string;
  location?: string; // New field from Events & Announcements Management
  agenda?: string; // New field from Events & Announcements Management
  displayInCalendar?: string;
  coverImageUrl?: string;
  urls?: URLLink[];
  
  // COURSE MATERIAL
  learningObjectives?: string;
  prerequisites?: string;
  
  // POLICY & DOCUMENTS
  policyType?: string;
  policyName?: string;
  policyContent?: string;
  
  // FORMS
  formDescription?: string;
  formLink?: string;
  
  // DASHBOARDS
  dashboardName?: string;
  dashboardLink?: string;
  dashboardDescription?: string;
  dashboardSop?: string;
  dashboardVisibility?: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  upcoming: number;
  requiresAck: number;
}

export interface DashboardData {
  student: StudentProfile;
  content: ContentItem[];
  stats: DashboardStats;
  lastSync: string;
}

export interface ContentDetails extends ContentItem {
  // ContentDetails now inherits all fields including category-specific ones from ContentItem
  // No additional fields needed as targetStudents is now in base ContentItem
}

export interface ContentItemWithAck extends ContentItem {
  requiresAcknowledgment: boolean;
  isAcknowledged: boolean;
  acknowledgmentTimestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async makeRequest<T>(action: string, params: Record<string, any> = {}, usePost: boolean = false, customBackendUrl?: string): Promise<ApiResponse<T>> {
    try {
      // Use custom backend URL if provided, otherwise use default BACKEND_URL
      const backendUrl = customBackendUrl || BACKEND_URL;

      // Wait for auth to initialize if needed
      let user = auth.currentUser;
      if (!user) {
        user = await new Promise<any>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((authUser: any) => {
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
        } as ApiResponse<T>;
      }

      // Filter out undefined/null values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      let response: Response;

      // Add timeout to fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        if (usePost) {
          // Use POST with form data for large payloads
          // Manually construct form body using encodeURIComponent which uses %20 for spaces
          // This avoids + symbols that the backend doesn't decode properly
          const formPairs: string[] = [];
          formPairs.push(`action=${encodeURIComponent(action)}`);

          Object.entries(cleanParams).forEach(([key, value]) => {
            const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
            // encodeURIComponent uses %20 for spaces, which the backend will decode correctly
            const encodedValue = encodeURIComponent(valueStr);
            formPairs.push(`${encodeURIComponent(key)}=${encodedValue}`);
          });

          const body = formPairs.join('&');
          console.log('📤 POST request body length:', body.length, 'bytes');

          response = await fetch(backendUrl, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
            signal: controller.signal
          });
        } else {
          // Use GET with query parameters for smaller payloads
          const queryParams = new URLSearchParams({
            action,
            ...cleanParams
          });

          response = await fetch(`${backendUrl}?${queryParams}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            signal: controller.signal
          });
        }
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      // Check if response is HTML (redirect page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Received HTML response instead of JSON - possible redirect issue');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);

      // More specific error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out after 2 minutes. Please try again with a smaller file or check your connection.'
          };
        }
        if (error.message === 'Failed to fetch') {
          return {
            success: false,
            error: 'Network error: Unable to reach the server. Please check your internet connection and try again.'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  // Test connection
  async testConnection(): Promise<ApiResponse<any>> {
    return this.makeRequest('test');
  }

  // Get API health
  async getAPIHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest('getAPIHealth');
  }

  // Get student dashboard
  async getStudentDashboard(studentEmail: string, lastSync?: string): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest<DashboardData>('getStudentDashboard', {
      studentEmail,
      ...(lastSync && { lastSync })
    });
  }

  // Get content details
  async getContentDetails(contentId: string, studentEmail: string): Promise<ApiResponse<ContentDetails>> {
    return this.makeRequest<ContentDetails>('getContentDetails', {
      contentId,
      studentEmail
    });
  }

  // Submit acknowledgment
  async submitAcknowledgment(
    contentId: string, 
    studentEmail: string, 
    response: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest('submitAcknowledgment', {
      contentId,
      studentEmail,
      response
    });
  }

  // Get student profile
  async getStudentProfile(studentEmail: string): Promise<ApiResponse<StudentProfile>> {
    return this.makeRequest<StudentProfile>('getStudentProfile', {
      studentEmail
    });
  }

  // Get full student profile
  async getFullStudentProfile(studentEmail: string): Promise<ApiResponse<FullStudentProfile>> {
    return this.makeRequest<FullStudentProfile>('getFullStudentProfile', {
      studentEmail
    });
  }

  // Update student profile
  async updateStudentProfile(
    studentEmail: string,
    profileData: Partial<FullStudentProfile>
  ): Promise<ApiResponse<FullStudentProfile>> {
    return this.makeRequest<FullStudentProfile>('updateStudentProfile', {
      studentEmail,
      profileData: JSON.stringify(profileData)
    });
  }

  async uploadResumePDF(
    studentEmail: string,
    pdfData: string,
    domainNumber: number,
    fileName: string,
    domainName?: string
  ): Promise<ApiResponse<{ fileUrl: string }>> {
    return this.makeRequest<{ fileUrl: string }>('uploadResumePDF', {
      studentEmail,
      pdfData,
      domainNumber,
      fileName,
      domainName
    }, true); // Use POST for large file uploads
  }

  // Placement Profile Management (Admin)
  async enablePlacementViewForBatch(
    batch: string,
    enable: boolean
  ): Promise<ApiResponse<{count: number}>> {
    return this.makeRequest<{count: number}>('enablePlacementViewForBatch', {
      batch,
      enable: enable ? 'Yes' : 'No'
    });
  }

  // Get list of batches
  async getBatches(): Promise<ApiResponse<{batches: string[]}>> {
    return this.makeRequest<{batches: string[]}>('getBatches', {});
  }

  // Job Portal Management (Admin) - Uses Placement Backend
  async createJobPosting(jobData: any): Promise<ApiResponse<{jobId: string; driveUrl: string; responsesSheetUrl: string}>> {
    return this.makeRequest<{jobId: string; driveUrl: string; responsesSheetUrl: string}>('createJobPosting', {
      jobData: JSON.stringify(jobData)
    }, true, PLACEMENT_BACKEND_URL);
  }

  async getAllJobPostings(filters?: any): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('getAllJobPostings', {
      filters: filters ? JSON.stringify(filters) : undefined
    }, false, PLACEMENT_BACKEND_URL);
  }

  async getJobPosting(jobId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('getJobPosting', {
      jobId
    }, false, PLACEMENT_BACKEND_URL);
  }

  async updateJobPosting(jobId: string, updates: any): Promise<ApiResponse<{message: string}>> {
    return this.makeRequest<{message: string}>('updateJobPosting', {
      jobId,
      updates: JSON.stringify(updates)
    }, true, PLACEMENT_BACKEND_URL);
  }

  async deleteJobPosting(jobId: string): Promise<ApiResponse<{message: string}>> {
    return this.makeRequest<{message: string}>('deleteJobPosting', {
      jobId
    }, false, PLACEMENT_BACKEND_URL);
  }

  async uploadJobFile(file: File, jobId: string, fileType: 'jd' | 'attachment'): Promise<ApiResponse<{ fileUrl: string }>> {
    try {
      // Convert file to base64
      const base64String = await this.fileToBase64(file);

      // Use POST request with URL-encoded form data
      const formBody = new URLSearchParams();
      formBody.append('action', 'uploadJobFile');
      formBody.append('jobId', jobId);
      formBody.append('fileData', base64String);
      formBody.append('fileName', file.name);
      formBody.append('mimeType', file.type);
      formBody.append('fileType', fileType);

      const response = await fetch(PLACEMENT_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading job file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  // Submit job application
  async submitJobApplication(applicationData: any): Promise<ApiResponse<{applicationId: string; message: string}>> {
    return this.makeRequest<{applicationId: string; message: string}>('submitJobApplication', {
      applicationData: JSON.stringify(applicationData)
    }, true, PLACEMENT_BACKEND_URL);
  }

  // Get student applications
  async getStudentApplications(studentEmail: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('getStudentApplications', {
      studentEmail
    }, false, PLACEMENT_BACKEND_URL);
  }

  // Get student placement profile
  async getStudentPlacementProfile(studentEmail: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('getStudentProfile', {
      studentEmail
    }, false, PLACEMENT_BACKEND_URL);
  }

  // Update student placement profile
  async updateStudentPlacementProfile(studentEmail: string, profileData: any): Promise<ApiResponse<{message: string}>> {
    return this.makeRequest<{message: string}>('updateStudentProfile', {
      studentEmail,
      profileData: JSON.stringify(profileData)
    }, true, PLACEMENT_BACKEND_URL);
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines(studentEmail: string): Promise<ApiResponse<ContentItem[]>> {
    return this.makeRequest<ContentItem[]>('getUpcomingDeadlines', {
      studentEmail
    });
  }

  // Mark content as read
  async markContentAsRead(contentId: string, studentEmail: string): Promise<ApiResponse<any>> {
    return this.makeRequest('markContentAsRead', {
      contentId,
      studentEmail
    });
  }

  // Get dashboard links
  async getDashboardLinks(studentEmail: string): Promise<ApiResponse<Array<{name: string, link: string, description: string, type: string, category?: string, eventType?: string}>>> {
    console.log('API Service: Getting dashboard links for:', studentEmail);
    const result = await this.makeRequest<Array<{name: string, link: string, description: string, type: string, category?: string, eventType?: string}>>('getDashboardLinks', {
      studentEmail
    });
    console.log('API Service: Dashboard links result:', result);
    return result;
  }

  // Get student schedule/calendar
  async getStudentSchedule(studentEmail: string, startDate?: string, endDate?: string): Promise<ApiResponse<ContentItem[]>> {
    console.log('API Service: Getting schedule for:', studentEmail);
    const result = await this.makeRequest<ContentItem[]>('getStudentSchedule', {
      studentEmail,
      startDate,
      endDate
    });
    console.log('API Service: Schedule result:', result);
    return result;
  }

  // Get policies and documents
  async getPoliciesAndDocuments(studentEmail: string): Promise<ApiResponse<ContentItem[]>> {
    console.log('API Service: Getting policies and documents for:', studentEmail);
    const result = await this.makeRequest<ContentItem[]>('getPoliciesAndDocuments', {
      studentEmail
    });
    console.log('API Service: Policies and documents result:', result);
    return result;
  }

  // Get course resources with dynamic folder structure
  async getCourseResources(studentEmail: string): Promise<ApiResponse<{
    availableTerms: string[];
    folderStructure: Record<string, {
      domains: Record<string, {
        subjects: Record<string, ContentItem[]>;
      }>;
    }>;
    flatMaterials: ContentItem[];
  }>> {
    console.log('API Service: Getting course resources for:', studentEmail);
    const result = await this.makeRequest<{
      availableTerms: string[];
      folderStructure: Record<string, {
        domains: Record<string, {
          subjects: Record<string, ContentItem[]>;
        }>;
      }>;
      flatMaterials: ContentItem[];
    }>('getCourseResources', {
      studentEmail
    });
    console.log('API Service: Course resources result:', result);
    return result;
  }

  // Upload profile picture
  async uploadProfilePicture(studentEmail: string, imageFile: File): Promise<ApiResponse<{ profilePictureUrl: string }>> {
    try {
      // Convert file to base64
      const base64String = await this.fileToBase64(imageFile);
      
      // Use POST request with URL-encoded form data
      const formBody = new URLSearchParams();
      formBody.append('action', 'uploadProfilePicture');
      formBody.append('studentEmail', studentEmail);
      formBody.append('imageData', base64String);
      formBody.append('fileName', imageFile.name);
      formBody.append('mimeType', imageFile.type);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload profile picture'
      };
    }
  }

  // Resumable upload for large files
  private fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Get filtered content (if you implement this later)
  async getFilteredContent(
    studentEmail: string,
    filters: {
      category?: string;
      eventType?: string;
      status?: string;
      priority?: string;
      requiresAcknowledgment?: boolean;
      hasFiles?: boolean;
      search?: string;
      dateRange?: {
        start: string;
        end: string;
      };
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<{
    content: ContentItem[];
    totalCount: number;
    filteredCount: number;
  }>> {
    return this.makeRequest('getFilteredStudentContent', {
      studentEmail,
      ...filters
    });
  }

  // Students Corner API Methods

  // Get Students Corner activities
  async getStudentsCornerActivity(
    studentEmail: string,
    activityType?: string,
    limit?: number
  ): Promise<ApiResponse<StudentsCornerActivity[]>> {
    console.log('API Service: Getting Students Corner activity for:', studentEmail);
    const result = await this.makeRequest<StudentsCornerActivity[]>('getStudentsCornerActivity', {
      studentEmail,
      activityType,
      limit: limit?.toString()
    });
    console.log('API Service: Students Corner activity result:', result);
    return result;
  }

  // Create Students Corner post/activity
  async createStudentsCornerPost(
    studentEmail: string,
    type: string,
    title: string,
    content: string,
    targetBatch?: string,
    category?: string,
    metadata?: string
  ): Promise<ApiResponse<{ id: string; type: string; title: string; points: number; message: string }>> {
    console.log('API Service: Creating Students Corner post:', { type, title });
    const result = await this.makeRequest<{ id: string; type: string; title: string; points: number; message: string }>('createStudentsCornerPost', {
      studentEmail,
      type,
      title,
      content,
      targetBatch,
      category,
      metadata
    });
    console.log('API Service: Create post result:', result);
    return result;
  }

  // Get Students Corner leaderboard
  async getStudentsCornerLeaderboard(
    studentEmail: string,
    timeframe?: string
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    console.log('API Service: Getting Students Corner leaderboard for:', studentEmail);
    const result = await this.makeRequest<LeaderboardEntry[]>('getStudentsCornerLeaderboard', {
      studentEmail,
      timeframe
    });
    console.log('API Service: Leaderboard result:', result);
    return result;
  }

  // Update activity status
  async updateActivityStatus(
    activityId: string,
    status: string,
    studentEmail: string
  ): Promise<ApiResponse<{ id: string; newStatus: string; message: string }>> {
    console.log('API Service: Updating activity status:', activityId, 'to', status);
    const result = await this.makeRequest<{ id: string; newStatus: string; message: string }>('updateActivityStatus', {
      activityId,
      status,
      studentEmail
    });
    console.log('API Service: Update status result:', result);
    return result;
  }

  // Get Students Corner dashboard
  async getStudentsCornerDashboard(
    studentEmail: string
  ): Promise<ApiResponse<StudentsCornerDashboardData>> {
    console.log('API Service: Getting Students Corner dashboard for:', studentEmail);
    const result = await this.makeRequest<StudentsCornerDashboardData>('getStudentsCornerDashboard', {
      studentEmail
    });
    console.log('API Service: Students Corner dashboard result:', result);
    return result;
  }

  // Create engagement (like or comment)
  async createStudentsCornerEngagement(
    studentEmail: string,
    activityId: string,
    engagementType: 'LIKE' | 'COMMENT',
    commentText?: string
  ): Promise<ApiResponse<any>> {
    console.log('API Service: Creating engagement:', { activityId, engagementType, commentText });
    const result = await this.makeRequest('createStudentsCornerEngagement', {
      studentEmail,
      activityId,
      engagementType,
      commentText: commentText || ''
    });
    console.log('API Service: Create engagement result:', result);
    return result;
  }

  // Get engagements for an activity
  async getStudentsCornerEngagements(
    studentEmail: string,
    activityId: string
  ): Promise<ApiResponse<any>> {
    console.log('API Service: Getting engagements for activity:', activityId);
    const result = await this.makeRequest('getStudentsCornerEngagements', {
      studentEmail,
      activityId
    });
    console.log('API Service: Get engagements result:', result);
    return result;
  }

  // Remove engagement (unlike)
  async removeStudentsCornerEngagement(
    studentEmail: string,
    activityId: string,
    engagementType: 'LIKE' | 'COMMENT'
  ): Promise<ApiResponse<any>> {
    console.log('API Service: Removing engagement:', { activityId, engagementType });
    const result = await this.makeRequest('removeStudentsCornerEngagement', {
      studentEmail,
      activityId,
      engagementType
    });
    console.log('API Service: Remove engagement result:', result);
    return result;
  }

  // Get students for @ mentions
  async getStudentsForMentions(studentEmail: string): Promise<ApiResponse<any>> {
    console.log('API Service: Getting students for mentions');
    const result = await this.makeRequest('getStudentsForMentions', {
      studentEmail
    });
    console.log('API Service: Get students for mentions result:', result);
    return result;
  }

  // Helper functions for date/time formatting
  private formatDateForSheets(dateStr?: string): string {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If invalid, try parsing DD-MM-YYYY or similar formats
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        // Assume DD-MM-YYYY or DD/MM/YYYY
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr; // Return as-is if can't parse
    }

    // Format as: 06-Nov-2025
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatTimeForSheets(timeStr?: string): string {
    if (!timeStr) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // If already in format like "7:00 PM", return as-is
    if (timeStr.match(/\d{1,2}:\d{2}\s*[AP]M/i)) {
      return timeStr;
    }

    // If in 24-hour format like "22:10:39" or "22:10"
    if (timeStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    return timeStr; // Return as-is if can't parse
  }

  private formatTimestampForSheets(): string {
    const now = new Date();
    return now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Notes API Methods

  // Get session notes
  async getSessionNotes(studentId: string, sessionId: string): Promise<ApiResponse<{
    noteId: string;
    studentEmail: string;
    studentName: string;
    batch: string;
    term: string;
    domain: string;
    subject: string;
    sessionName: string;
    date: string;
    startTime: string;
    meetingId: string;
    noteContent: string;
    timestamp: string;
    lastModified: string;
    isPinned: string;
  }>> {
    console.log('API Service: Getting session notes for student:', studentId, 'session:', sessionId);
    const result = await this.makeRequest<{
      noteId: string;
      studentEmail: string;
      studentName: string;
      batch: string;
      term: string;
      domain: string;
      subject: string;
      sessionName: string;
      date: string;
      startTime: string;
      meetingId: string;
      noteContent: string;
      timestamp: string;
      lastModified: string;
      isPinned: string;
    }>('getSessionNotes', {
      studentEmail: studentId,  // For backend validation
      studentId: studentId,     // For the actual function call
      sessionId
    });
    console.log('API Service: Session notes result:', result);
    return result;
  }

  // Save session note (threaded - always creates new note)
  async saveSessionNote(noteData: {
    studentId: string;
    studentName?: string;
    sessionId: string;
    noteTitle?: string;
    noteContent: string;
    images?: any[];  // Array of { data: base64, name: string, mimeType: string }
    batch: string;
    term?: string;
    domain?: string;
    subject?: string;
    sessionName?: string;
    date?: string;
    startTime?: string;
  }): Promise<ApiResponse<{ noteId: string; message: string; folderUrl?: string; timestamp: string }>> {
    console.log('API Service: Saving session note:', noteData);

    // Base64 encode the note content to preserve HTML exactly
    const encodedContent = btoa(unescape(encodeURIComponent(noteData.noteContent)));

    // Format date and time for better readability in sheets
    const formattedDate = this.formatDateForSheets(noteData.date);
    const formattedStartTime = this.formatTimeForSheets(noteData.startTime);
    const formattedTimestamp = this.formatTimestampForSheets();

    // Transform studentId to studentEmail for the noteData
    const { studentId, date, startTime, ...restNoteData } = noteData;
    const noteDataWithEmail = {
      ...restNoteData,
      studentEmail: studentId,
      noteContent: encodedContent,
      date: formattedDate,
      startTime: formattedStartTime,
      timestamp: formattedTimestamp,
      isContentEncoded: true  // Flag for backend
    };

    const result = await this.makeRequest<{ noteId: string; message: string; folderUrl?: string; timestamp: string }>('saveSessionNote', {
      studentEmail: studentId,  // Backend expects this as a top-level parameter
      noteData: JSON.stringify(noteDataWithEmail)
    }, true); // Use POST for large payloads
    console.log('API Service: Save note result:', result);
    return result;
  }

  // Update session note
  async updateSessionNote(noteData: {
    noteId: string;
    studentId: string;
    noteTitle: string;
    noteContent: string;
    images?: any[];
    tags?: string[];
  }): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Updating session note:', noteData.noteId);

    // Base64 encode the note content to preserve HTML exactly
    const encodedContent = btoa(unescape(encodeURIComponent(noteData.noteContent)));

    const result = await this.makeRequest<{ message: string }>('updateNoteContent', {
      studentEmail: noteData.studentId,
      noteId: noteData.noteId,
      noteContent: encodedContent,
      isContentEncoded: true
    }, true);

    console.log('API Service: Update note result:', result);
    return result;
  }

  // Delete session note
  async deleteSessionNote(data: {
    studentId: string;
    noteId: string;
  }): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Deleting session note:', data.noteId);

    const result = await this.makeRequest<{ message: string }>('deleteNote', {
      studentEmail: data.studentId,
      noteId: data.noteId
    });

    console.log('API Service: Delete note result:', result);
    return result;
  }

  // Get all notes for a student
  async getAllStudentNotes(studentId: string): Promise<ApiResponse<Array<{
    noteId: string;
    studentEmail: string;
    studentName: string;
    batch: string;
    term: string;
    domain: string;
    subject: string;
    sessionName: string;
    date: string;
    startTime: string;
    meetingId: string;
    noteContent: string;
    timestamp: string;
    lastModified: string;
    isPinned: string;
  }>>> {
    console.log('API Service: Getting all notes for student:', studentId);
    const result = await this.makeRequest<Array<{
      noteId: string;
      studentEmail: string;
      studentName: string;
      batch: string;
      term: string;
      domain: string;
      subject: string;
      sessionName: string;
      date: string;
      startTime: string;
      meetingId: string;
      noteContent: string;
      timestamp: string;
      lastModified: string;
      isPinned: string;
    }>>('getAllNotes', {
      studentEmail: studentId,  // For backend validation
      studentId: studentId      // For the actual function call
    });
    console.log('API Service: All notes result:', result);
    return result;
  }

  // Toggle pin status of a note
  async togglePinNote(noteId: string, studentEmail: string): Promise<ApiResponse<{ message: string; isPinned: string }>> {
    console.log('API Service: Toggling pin status for note:', noteId, 'studentEmail:', studentEmail);
    const result = await this.makeRequest<{ message: string; isPinned: string }>('togglePinNote', {
      studentEmail: studentEmail,  // Backend expects studentEmail for validation
      studentId: studentEmail,     // Also send as studentId for the function
      noteId
    });
    console.log('API Service: Toggle pin result:', result);
    return result;
  }

  // Update tags for a note
  async updateNoteTags(noteId: string, studentEmail: string, tags: string[]): Promise<ApiResponse<{ message: string; tags: string[] }>> {
    console.log('API Service: Updating tags for note:', noteId, 'tags:', tags);
    const result = await this.makeRequest<{ message: string; tags: string[] }>('updateNoteTags', {
      studentEmail: studentEmail,  // Backend expects studentEmail parameter
      studentId: studentEmail,     // Also send as studentId for the updateNoteTags function
      noteId,
      tags: JSON.stringify(tags)
    }, true); // Use POST to avoid CORS and rate limiting issues
    console.log('API Service: Update tags result:', result);
    return result;
  }

  // Update note content (for checkbox state)
  async updateNoteContent(noteId: string, studentEmail: string, noteContent: string): Promise<ApiResponse<{ message: string; noteContent: string }>> {
    console.log('API Service: Updating note content for note:', noteId);
    // Base64 encode the HTML content to preserve it exactly (avoid URL encoding issues)
    const encodedContent = btoa(unescape(encodeURIComponent(noteContent)));
    const result = await this.makeRequest<{ message: string; noteContent: string }>('updateNoteContent', {
      studentEmail: studentEmail,
      studentId: studentEmail,
      noteId,
      noteContent: encodedContent,
      isEncoded: 'true'  // Flag to tell backend this is base64 encoded
    }, true); // Use POST for large content payloads
    console.log('API Service: Update note content result:', result);
    return result;
  }

  // Get all session notes by subject (for thread view)
  async getSessionNotesBySubject(
    studentId: string,
    batch: string,
    term: string,
    domain: string,
    subject: string
  ): Promise<ApiResponse<Array<{
    sessionId: string;
    sessionName: string;
    date: string;
    startTime: string;
    batch: string;
    term: string;
    domain: string;
    subject: string;
    notes: Array<any>;
  }>>> {
    console.log('API Service: Getting session notes by subject:', { batch, term, domain, subject });
    const result = await this.makeRequest<Array<{
      sessionId: string;
      sessionName: string;
      date: string;
      startTime: string;
      batch: string;
      term: string;
      domain: string;
      subject: string;
      notes: Array<any>;
    }>>('getSessionNotesBySubject', {
      studentEmail: studentId,
      studentId,
      batch,
      term,
      domain,
      subject
    });
    console.log('API Service: Session notes by subject result:', result);
    return result;
  }

  // Get notes (alias for getAllStudentNotes for NotesPage)
  async getNotes(studentEmail: string): Promise<ApiResponse<Array<{
    noteId: string;
    studentEmail: string;
    studentName: string;
    batch: string;
    term: string;
    domain: string;
    subject: string;
    sessionName: string;
    date: string;
    startTime: string;
    meetingId: string;
    noteContent: string;
    timestamp: string;
    lastModified: string;
    isPinned: string;
  }>>> {
    return this.getAllStudentNotes(studentEmail);
  }

  // ==================== Content Management API Methods ====================

  // Folder Operations
  async getAvailableFolders(
    studentEmail: string,
    batch?: string,
    term?: string,
    domain?: string,
    subject?: string
  ): Promise<ApiResponse<FolderStructure>> {
    console.log('API Service: Getting available folders');
    const result = await this.makeRequest<FolderStructure>('getAvailableFolders', {
      studentEmail,
      batch,
      term,
      domain,
      subject
    });
    console.log('API Service: Available folders result:', result);
    return result;
  }

  async getTermHierarchyData(studentEmail: string): Promise<ApiResponse<any>> {
    console.log('API Service: Getting Term hierarchy data');
    const result = await this.makeRequest<any>('getTermHierarchyData', {
      studentEmail
    });
    console.log('API Service: Term hierarchy result:', result);
    return result;
  }

  async getDropdownOptions(
    studentEmail: string,
    level: string,
    filters: Record<string, any>
  ): Promise<ApiResponse<DropdownOptions>> {
    console.log('API Service: Getting dropdown options for level:', level);
    const result = await this.makeRequest<DropdownOptions>('getDropdownOptions', {
      studentEmail,
      level,
      filters: JSON.stringify(filters)
    });
    console.log('API Service: Dropdown options result:', result);
    return result;
  }

  // Resources Management
  async getTermDropdowns(studentEmail: string): Promise<ApiResponse<any>> {
    console.log('API Service: Getting Term sheet dropdowns');
    const result = await this.makeRequest('getTermDropdownsResMgmt', {
      studentEmail
    });
    console.log('API Service: Term dropdowns result:', result);
    return result;
  }

  async createResource(
    studentEmail: string,
    resourceData: ResourceData
  ): Promise<ApiResponse<{ id: string; message: string; folderUrl?: string }>> {
    console.log('API Service: Creating resource:', resourceData.title);
    const result = await this.makeRequest<{ id: string; message: string; folderUrl?: string }>(
      'createResourceResMgmt',
      {
        studentEmail,
        resourceData: JSON.stringify(resourceData)
      },
      true // Use POST for large payloads
    );
    console.log('API Service: Create resource result:', result);
    return result;
  }

  async updateResource(
    studentEmail: string,
    resourceId: string,
    resourceData: Partial<ResourceData>
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Updating resource:', resourceId);
    const result = await this.makeRequest<{ message: string }>(
      'updateResourceResMgmt',
      {
        studentEmail,
        resourceId,
        resourceData: JSON.stringify(resourceData)
      },
      true
    );
    console.log('API Service: Update resource result:', result);
    return result;
  }

  async deleteResource(
    studentEmail: string,
    resourceId: string
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Deleting resource:', resourceId);
    const result = await this.makeRequest<{ message: string }>('deleteResourceResMgmt', {
      studentEmail,
      resourceId
    });
    console.log('API Service: Delete resource result:', result);
    return result;
  }

  async getResources(
    studentEmail: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<ResourceData[]>> {
    console.log('API Service: Getting resources with filters:', filters);
    const result = await this.makeRequest<ResourceData[]>('getResourcesResMgmt', {
      studentEmail,
      filters: JSON.stringify(filters || {})
    });
    console.log('API Service: Resources result:', result);
    return result;
  }

  async uploadResourceFile(
    studentEmail: string,
    file: File,
    customFileName: string,
    batch: string,
    term?: string,
    domain?: string,
    subject?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; folderId: string }>> {
    try {
      console.log('API Service: Uploading resource file (<50MB):', customFileName);
      console.log('API Service: studentEmail received:', studentEmail);
      console.log('API Service: batch:', batch, 'term:', term, 'domain:', domain, 'subject:', subject);

      // Convert file to base64
      const base64String = await this.fileToBase64(file);

      // Simulate progress for small files
      if (onProgress) {
        onProgress(25);
      }

      const result = await this.makeRequest<{ url: string; folderId: string }>(
        'uploadResourceFile',
        {
          studentEmail,
          fileData: base64String,
          fileName: customFileName,
          mimeType: file.type,
          batch,
          term,
          domain,
          subject
        },
        true // Use POST for file uploads
      );

      if (onProgress) {
        onProgress(100);
      }

      console.log('API Service: Upload file result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading resource file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  async uploadResourceFileResumable(
    studentEmail: string,
    file: File,
    customFileName: string,
    batch: string,
    term?: string,
    domain?: string,
    subject?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; folderId: string }>> {
    try {
      console.log('API Service: Uploading large resource file (≥50MB) with resumable upload:', customFileName);

      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);

      // Start resumable upload session
      const sessionResult = await this.makeRequest<{ sessionId: string; folderId: string }>(
        'startResumableUpload',
        {
          studentEmail,
          fileName: customFileName,
          mimeType: file.type,
          fileSize: file.size,
          batch,
          term,
          domain,
          subject
        },
        true
      );

      if (!sessionResult.success || !sessionResult.data) {
        throw new Error(sessionResult.error || 'Failed to start resumable upload session');
      }

      const { sessionId, folderId } = sessionResult.data;

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // Convert chunk to base64
        const chunkBase64 = await this.fileToBase64(chunk);

        const chunkResult = await this.makeRequest<{ success: boolean }>(
          'uploadChunk',
          {
            studentEmail,
            sessionId,
            chunkIndex,
            totalChunks,
            chunkData: chunkBase64
          },
          true
        );

        if (!chunkResult.success) {
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
        }

        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      }

      // Finalize upload
      const finalizeResult = await this.makeRequest<{ url: string }>(
        'finalizeResumableUpload',
        {
          studentEmail,
          sessionId
        },
        true
      );

      if (!finalizeResult.success || !finalizeResult.data) {
        throw new Error(finalizeResult.error || 'Failed to finalize upload');
      }

      console.log('API Service: Resumable upload completed successfully');
      return {
        success: true,
        data: {
          url: finalizeResult.data.url,
          folderId
        }
      };
    } catch (error) {
      console.error('Error in resumable upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload large file'
      };
    }
  }

  // Events & Announcements Management
  async createEvent(
    studentEmail: string,
    eventData: EventData
  ): Promise<ApiResponse<{ id: string; message: string; folderUrl?: string }>> {
    console.log('API Service: Creating event:', eventData.title);
    const result = await this.makeRequest<{ id: string; message: string; folderUrl?: string }>(
      'createEvent',
      {
        studentEmail,
        eventData: JSON.stringify(eventData)
      },
      true
    );
    console.log('API Service: Create event result:', result);
    return result;
  }

  async updateEvent(
    studentEmail: string,
    eventId: string,
    eventData: Partial<EventData>
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Updating event:', eventId);
    const result = await this.makeRequest<{ message: string }>(
      'updateEvent',
      {
        studentEmail,
        eventId,
        eventData: JSON.stringify(eventData)
      },
      true
    );
    console.log('API Service: Update event result:', result);
    return result;
  }

  async deleteEvent(
    studentEmail: string,
    eventId: string
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Deleting event:', eventId);
    const result = await this.makeRequest<{ message: string }>('deleteEvent', {
      studentEmail,
      eventId
    });
    console.log('API Service: Delete event result:', result);
    return result;
  }

  async getEvents(
    studentEmail: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<EventData[]>> {
    console.log('API Service: Getting events with filters:', filters);
    const result = await this.makeRequest<EventData[]>('getEvents', {
      studentEmail,
      filters: JSON.stringify(filters || {})
    });
    console.log('API Service: Events result:', result);
    return result;
  }

  // Policy & Documents Management
  async createPolicy(
    studentEmail: string,
    policyData: PolicyData
  ): Promise<ApiResponse<{ id: string; message: string; folderUrl?: string }>> {
    console.log('API Service: Creating policy:', policyData.title);
    const result = await this.makeRequest<{ id: string; message: string; folderUrl?: string }>(
      'createPolicy',
      {
        studentEmail,
        policyData: JSON.stringify(policyData)
      },
      true
    );
    console.log('API Service: Create policy result:', result);
    return result;
  }

  async updatePolicy(
    studentEmail: string,
    policyId: string,
    policyData: Partial<PolicyData>
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Updating policy:', policyId);
    const result = await this.makeRequest<{ message: string }>(
      'updatePolicy',
      {
        studentEmail,
        policyId,
        policyData: JSON.stringify(policyData)
      },
      true
    );
    console.log('API Service: Update policy result:', result);
    return result;
  }

  async deletePolicy(
    studentEmail: string,
    policyId: string
  ): Promise<ApiResponse<{ message: string }>> {
    console.log('API Service: Deleting policy:', policyId);
    const result = await this.makeRequest<{ message: string }>('deletePolicy', {
      studentEmail,
      policyId
    });
    console.log('API Service: Delete policy result:', result);
    return result;
  }

  async getPolicies(
    studentEmail: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<PolicyData[]>> {
    console.log('API Service: Getting policies with filters:', filters);
    const result = await this.makeRequest<PolicyData[]>('getPolicies', {
      studentEmail,
      filters: JSON.stringify(filters || {})
    });
    console.log('API Service: Policies result:', result);
    return result;
  }
}

export const apiService = new ApiService();

// Export as 'api' for backward compatibility with NotesPopup
export const api = apiService;