// SSB STUDENT PORTAL BACKEND - Google Apps Script
// This is a separate GAS project for the student-facing Firebase frontend
// Resources Management Feature: Uses "Resources Material" sheet + "Term" sheet for dropdowns
// LAST PUSHED: 2025-12-05 - Resources Management fully integrated with Term sheet dropdowns

// Configuration constants - UPDATE THESE WITH YOUR ACTUAL VALUES
const SHEET_ID = "1b5MrRFysC3zf8ftsGJcjhUEjh5P3Q20fYAconTBm824";
const MAIN_SHEET = "ALLINONE";
const EVENTS_ANNOUNCEMENTS_SHEET = "Events & Announcements Management";
const STUDENT_LOGIN_SHEET = "Student Login";
const STUDENT_DATA_SHEET = "Student Data";
const STUDENT_PROFILE_SHEET = "Student Profile";
const ACKNOWLEDGEMENT_SHEET = "Acknowledgement Data";
const STUDENTS_CORNER_SHEET = "Students Corner - Activity";
const STUDENTS_CORNER_ENGAGEMENT_SHEET = "Students Corner - Engagement";
const ACCESS_SHEET = "Access";
const NOTES_SHEET = "Notes";
const TIMEZONE = "Asia/Kolkata";

// Zoom API Configuration (Server-to-Server OAuth)
const ZOOM_CONFIG = {
  ACCOUNT_ID: "",
  CLIENT_ID: "",
  CLIENT_SECRET: ""
};

/**
 * Format timestamp for sheets in readable format
 * Returns format like: 06-Nov-2025, 10:40:41 PM
 */
function formatTimestampForSheets() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short', timeZone: TIMEZONE });
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Format: 21-Nov-2025 19:29:05
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// Google Drive configuration for profile pictures
const MAIN_DRIVE_FOLDER_ID = "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD";
const MAIN_DRIVE_FOLDER_NAME = "SSB ALL IN ONE CREATOR";

// Notes Drive folder configuration
const NOTES_DRIVE_FOLDER_ID = "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD";

// Resources Drive folder configuration
const RESOURCES_DRIVE_FOLDER_ID = "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD";

// Placement Resume Drive folder configuration
const PLACEMENT_RESUME_FOLDER_ID = "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD";

// Job Portal configuration
const JOB_PORTAL_SHEET_ID = "";
const JOB_PORTAL_SHEET_NAME = "Placement Data";
const JOB_PORTAL_DRIVE_FOLDER_ID = ""; // SSB PLACEMENT JOB PORTAL FOLDER

// ImgBB API configuration for public image hosting
// Get your free API key from: https://api.imgbb.com/
const IMGBB_API_KEY = ""; // Your ImgBB API key
const IMGBB_UPLOAD_URL = "";

// Firebase configuration - UPDATE THESE AFTER SETTING UP FIREBASE
const FIREBASE_PROJECT_ID = "";
const FIREBASE_WEB_API_KEY = "";
const FIREBASE_WEBHOOK_URL = "";

/**
 * Main entry point for web app - handles all API requests
 * Deploy as web app with execute permissions: Anyone
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create a JSON response
 * Note: CORS is handled automatically by Google Apps Script when deployed as Web App with "Anyone" access
 * @param {Object} data - The response data object
 * @return {ContentService.TextOutput} JSON response
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e) {
  try {
    // Handle undefined event parameter
    if (!e) {
      Logger.log('Error: Event parameter is undefined');
      return createErrorResponse('Invalid request - no parameters received');
    }

    // Handle OPTIONS preflight request
    if (e.parameter && e.parameter.method === 'OPTIONS') {
      return doOptions(e);
    }

    // Handle Zoom webhooks (JSON payload)
    if (e.postData && e.postData.type === 'application/json') {
      try {
        const webhookData = JSON.parse(e.postData.contents);
        Logger.log('Zoom webhook received: ' + JSON.stringify(webhookData));

        // Log headers for debugging
        if (e.parameter && e.parameter['x-zm-signature']) {
          Logger.log('x-zm-signature header: ' + e.parameter['x-zm-signature']);
        }
        if (e.parameter && e.parameter['x-zm-request-timestamp']) {
          Logger.log('x-zm-request-timestamp header: ' + e.parameter['x-zm-request-timestamp']);
        }

        // Check if it's a Zoom webhook
        if (webhookData.event || webhookData.payload) {
          return handleZoomWebhook(webhookData, e);
        }
      } catch (jsonError) {
        Logger.log('Not a Zoom webhook or JSON parse error: ' + jsonError.message);
        // Continue to normal request handling
      }
    }

    // Handle both GET and POST parameters
    let params = e.parameter || {};
    
    // For POST requests, also check postData
    if (e.postData) {
      Logger.log('POST data type: ' + e.postData.type);
      Logger.log('POST data contents length: ' + (e.postData.contents ? e.postData.contents.length : 0));
      
      // If it's form data, parse parameters from contents
      if (e.postData.type.includes('multipart/form-data')) {
        const boundary = e.postData.type.split('boundary=')[1];
        if (boundary && e.postData.contents) {
          const formData = parseMultipartFormData(e.postData.contents, boundary);
          params = { ...params, ...formData };
          Logger.log('Parsed form data keys: ' + Object.keys(formData).join(', '));
        }
      } else if (e.postData.type === 'application/x-www-form-urlencoded') {
        // Parse URL encoded form data
        const postParams = e.postData.contents.split('&');
        for (const param of postParams) {
          const [key, value] = param.split('=');
          if (key && value) {
            // Use decodeURIComponent directly without replacing +
            // Modern encoding uses %20 for spaces, not +
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
      }
    }

    let action = params.action;
    let studentEmail = params.studentEmail || params.userEmail;

    // For POST requests with JSON content-type, parse JSON body
    // Note: application/x-www-form-urlencoded is already parsed above
    if (e.postData && e.postData.contents && e.postData.type !== 'application/x-www-form-urlencoded') {
      try {
        const postBody = JSON.parse(e.postData.contents);
        action = action || postBody.action;
        studentEmail = studentEmail || postBody.studentEmail || postBody.userEmail || postBody.studentId || postBody.createdBy;
        // Merge all POST body params into params object
        params = { ...params, ...postBody };
      } catch (err) {
        Logger.log('Could not parse POST body as JSON: ' + err.message);
      }
    }

    Logger.log('Action: ' + action);
    Logger.log('Student Email: ' + studentEmail);
    Logger.log('Backend Version: 422 - POST params merge fix active');
    Logger.log('Available params keys: ' + Object.keys(params).join(', '));

    // Validate student email (except for test action, public Zoom actions, and Forms API)
    // Note: saveNote, deleteNote, togglePinNote validate email internally from POST body
    // Forms API actions handle authentication and authorization internally
    const publicActions = [
      'test',
      'getSessions', 'getSession', 'getCalendarEvents', 'getLiveSessions', 'getRecordings',
      'saveNote', 'deleteNote', 'togglePinNote',
      // Forms API actions
      'getTermStructure', 'getFormTypes', 'getForms', 'getFormById',
      'getRequiredStartupForms', 'getUserFormResponses', 'getFormResponses', 'getResponseStats',
      'submitFormResponse', 'createForm', 'updateForm', 'updateFormStatus', 'deleteForm', 'duplicateForm',
      'createQuestion', 'updateQuestion', 'deleteQuestion', 'uploadStudentAttachment',
      'getAllStudents', 'getAvailableStudentsForQuestion', 'validateGroupMembers',
      // Placement Management API actions (admin checks are done inside each handler)
      'getBatches', 'enablePlacementViewForBatch',
      // Job Portal API actions (admin checks are done inside each handler)
      'createJobPosting', 'getAllJobPostings', 'getJobPosting', 'updateJobPosting', 'deleteJobPosting', 'uploadJobFile'
    ];

    // Skip validation for public actions or if user is admin
    const skipValidation = publicActions.includes(action) || (studentEmail && isAdmin(studentEmail));

    if (!skipValidation && (!studentEmail || !isValidStudentEmail(studentEmail))) {
      return createErrorResponse('Invalid or missing student email');
    }

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'test':
        result = {
          success: true,
          message: 'SSB Student Portal Backend is working!',
          version: 453,
          timestamp: new Date().toISOString(),
          resourcesManagementAvailable: typeof getTermDropdownsResMgmt === 'function',
          scriptId: ScriptApp.getScriptId()
        };
        break;
      case 'getDashboard':
      case 'getStudentDashboard':
        result = getStudentDashboard(studentEmail, e.parameter.lastSync);
        break;
      case 'getContentDetails':
        result = getContentDetails(e.parameter.contentId, studentEmail);
        break;
      case 'submitAcknowledgment':
        result = submitAcknowledgment(e.parameter.contentId, studentEmail, e.parameter.response);
        break;
      case 'getStudentProfile':
        result = getStudentProfile(studentEmail);
        break;
      case 'getFullStudentProfile':
        result = getFullStudentProfile(studentEmail);
        break;
      case 'updateStudentProfile':
        result = updateStudentProfile(studentEmail, JSON.parse(e.parameter.profileData || '{}'));
        break;
      case 'uploadResumePDF':
        result = uploadResumePDF(studentEmail, params.pdfData, params.domainNumber, params.fileName, params.domainName);
        break;
      case 'getUpcomingDeadlines':
        result = getUpcomingDeadlines(studentEmail);
        break;
      case 'markContentAsRead':
        result = markContentAsRead(e.parameter.contentId, studentEmail);
        break;
      case 'uploadProfilePicture':
        result = uploadProfilePicture(studentEmail, params.imageData, params.fileName, params.mimeType);
        break;
      case 'getDashboardLinks':
        result = getDashboardLinks(studentEmail);
        break;
      case 'getStudentSchedule':
        result = getStudentSchedule(studentEmail, params.startDate, params.endDate);
        break;
      case 'getPoliciesAndDocuments':
        result = getPoliciesAndDocuments(studentEmail);
        break;
      case 'getCourseResources':
        result = getCourseResources(studentEmail);
        break;
      case 'getStudentsCornerActivity':
        result = getStudentsCornerActivity(studentEmail, params.activityType, params.limit);
        break;
      case 'createStudentsCornerPost':
        result = createStudentsCornerPost(studentEmail, params.type, params.title, params.content, params.targetBatch, params.category, params.metadata);
        break;
      case 'getStudentsCornerLeaderboard':
        result = getStudentsCornerLeaderboard(studentEmail, params.timeframe);
        break;
      case 'updateActivityStatus':
        result = updateActivityStatus(params.activityId, params.status, studentEmail);
        break;
      case 'getStudentsCornerDashboard':
        result = getStudentsCornerDashboard(studentEmail);
        break;
      case 'createStudentsCornerEngagement':
        result = createStudentsCornerEngagement(params.activityId, studentEmail, params.engagementType, params.commentText);
        break;
      case 'getStudentsCornerEngagements':
        result = getStudentsCornerEngagements(params.activityId, studentEmail);
        break;
      case 'removeStudentsCornerEngagement':
        result = removeStudentsCornerEngagement(params.activityId, studentEmail, params.engagementType);
        break;
      case 'getStudentsForMentions':
        result = getStudentsForMentions(studentEmail);
        break;

      // Zoom Sessions API
      case 'getLiveSessions':
        result = getZoomLiveSessions(params.batch);
        break;
      case 'getRecordings':
        result = getZoomRecordings(params.batch, params.term, params.domain, params.subject);
        break;
      case 'getSessions':
        result = getZoomSessions(params.type, params.batch, params.term, params.domain, params.subject);
        break;
      case 'getSession':
        result = getZoomSession(params.sessionId);
        break;
      case 'getCalendarEvents':
        result = getCalendarEvents(params.batch);
        break;

      // Zoom Notes API
      case 'getNotes':
        result = getZoomNotes(params.studentId, params.sessionId);
        break;
      case 'getNote':
        result = getZoomNote(params.studentId, params.sessionId);
        break;
      case 'saveNote':
        // Note data is sent in POST body as JSON
        const postBody = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
        Logger.log('saveNote request body: ' + JSON.stringify(postBody));
        result = saveZoomNote(postBody);
        break;
      case 'deleteNote':
        const deleteBody = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
        result = deleteZoomNote(deleteBody.noteId || params.noteId, deleteBody.studentId || params.studentId);
        break;
      case 'togglePinNote':
        const toggleBody = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
        result = togglePinZoomNote(toggleBody.noteId || params.noteId, toggleBody.studentId || params.studentId);
        break;
      case 'updateNoteTags':
        const tags = JSON.parse(params.tags || '[]');
        result = updateNoteTags(params.noteId, params.studentId, tags);
        break;
      case 'updateNoteContent':
        result = updateNoteContent(params.noteId, params.studentId, params.noteContent, params.isEncoded);
        break;
      case 'searchNotes':
        result = searchZoomNotes(params.studentId, params.query);
        break;
      case 'getNotesHierarchy':
        result = getZoomNotesHierarchy(params.studentId);
        break;

      // Zoom Admin API (requires admin access)
      case 'triggerZoomSync':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = triggerZoomSync();
        break;
      case 'triggerRecordingSync':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = triggerRecordingSync();
        break;
      case 'createZoomSession':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const sessionData = JSON.parse(params.sessionData || '{}');
        result = createZoomSessionFromAdmin(sessionData);
        break;
      case 'getZoomSyncStatus':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getZoomSyncStatus();
        break;
      case 'getAllZoomCreateSessions':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getAllZoomCreateSessions();
        break;
      case 'getAllZoomLiveSessionsAdmin':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getAllZoomLiveSessionsAdmin();
        break;
      case 'getAllZoomRecordingsAdmin':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getAllZoomRecordingsAdmin();
        break;
      case 'updateZoomSheetRow':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const updatePayload = JSON.parse(requestBody || '{}');
        result = updateZoomSheetRow(
          updatePayload.sheetName,
          updatePayload.rowIndex,
          updatePayload.rowData
        );
        break;
      case 'deleteZoomSheetRow':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const deletePayload = JSON.parse(requestBody || '{}');
        result = deleteZoomSheetRow(
          deletePayload.sheetName,
          deletePayload.rowIndex
        );
        break;
      case 'getTermHierarchyData':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getTermHierarchyData();
        break;

      // Notes endpoints
      case 'getSessionNotes':
        const studentId = params.studentId;
        const sessionId = params.sessionId;
        result = getSessionNotes(studentId, sessionId);
        break;
      case 'saveSessionNote':
        const notePayload = JSON.parse(params.noteData || '{}');
        result = saveSessionNote(notePayload);
        break;
      case 'getAllNotes':
        const userId = params.studentId;
        result = getAllStudentNotes(userId);
        break;
      case 'togglePinNote':
        const noteId = params.noteId;
        result = togglePinNote(noteId);
        break;
      case 'getSessionNotesBySubject':
        result = getSessionNotesBySubject(
          params.studentId,
          params.batch,
          params.term,
          params.domain,
          params.subject
        );
        break;

      // Content Management API - Folder Operations
      case 'getAvailableFolders':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getAvailableFolders(params.batch, params.term, params.domain, params.subject);
        break;
      case 'getDropdownOptions':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const dropdownFilters = JSON.parse(params.filters || '{}');
        result = getDropdownOptions(params.level, dropdownFilters);
        break;

      // Content Management API - Resources Management
      case 'getTermDropdownsResMgmt':
        result = getTermDropdownsResMgmt();
        break;

      case 'createResourceResMgmt':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const createResData = JSON.parse(params.resourceData || '{}');
        result = createResourceResMgmt(createResData);
        break;

      case 'getResourcesResMgmt':
        const resFilters = JSON.parse(params.filters || '{}');
        result = getResourcesResMgmt(resFilters);
        break;

      case 'updateResourceResMgmt':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const updateResData = JSON.parse(params.resourceData || '{}');
        result = updateResourceResMgmt(params.resourceId, updateResData);
        break;

      case 'deleteResourceResMgmt':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = deleteResourceResMgmt(params.resourceId);
        break;

      case 'uploadFileResMgmt':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        // This endpoint expects folder details and file data
        const folderResult = createResourceFolderResMgmt({
          batch: params.batch,
          level: params.level,
          term: params.term,
          domain: params.domain,
          subject: params.subject
        });

        if (!folderResult.success) {
          return createErrorResponse(folderResult.error);
        }

        result = uploadFileResMgmt(
          folderResult.folder,
          params.fileName,
          params.fileData,
          params.mimeType
        );
        break;

      case 'uploadResourceFile':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = uploadResourceFile(
          params.fileData,
          params.fileName,
          params.mimeType,
          params.batch,
          params.term,
          params.domain,
          params.subject
        );
        break;

      case 'startResumableUpload':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = startResumableUpload(
          params.fileName,
          params.mimeType,
          params.fileSize,
          params.batch,
          params.term,
          params.domain,
          params.subject
        );
        break;

      case 'uploadChunk':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = uploadChunk(
          params.sessionId,
          params.chunkIndex,
          params.totalChunks,
          params.chunkData
        );
        break;

      case 'finalizeResumableUpload':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = finalizeResumableUpload(params.sessionId);
        break;

      // Content Management API - Events & Announcements
      case 'createEvent':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const eventData = JSON.parse(params.eventData || '{}');
        result = createEvent(eventData);
        break;
      case 'updateEvent':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const updateEventData = JSON.parse(params.eventData || '{}');
        result = updateEvent(params.eventId, updateEventData);
        break;
      case 'deleteEvent':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = deleteEvent(params.eventId);
        break;
      case 'getEvents':
        const eventFilters = JSON.parse(params.filters || '{}');
        result = getEvents(eventFilters);
        break;

      // Content Management API - Policy & Documents
      case 'createPolicy':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const policyData = JSON.parse(params.policyData || '{}');

        // Map frontend field names to backend expected names
        const mappedPolicyData = {
          policyName: policyData.title,
          shortDescription: policyData.description,
          fullContent: policyData.fullContent,
          documentCategory: policyData.category || policyData.policyType,
          policyType: policyData.policyType,
          version: policyData.version,
          batch: policyData.batch,
          targetBatch: policyData.targetBatch || policyData.batch,
          showOtherBatches: policyData.showOtherBatches,
          effectiveDate: policyData.effectiveDate,
          reviewDate: policyData.expiryDate,
          supersedes: policyData.supersedes,
          requiresAcknowledgement: policyData.requiresAcknowledgement || 'No',
          mandatoryReading: policyData.mandatoryReading || 'No',
          publish: policyData.publish || 'Yes',
          postedBy: policyData.postedBy || studentEmail,
          status: policyData.status || 'Published',
          notes: policyData.notes,
          priority: policyData.priority || 'Medium',
          // File mappings
          file1Name: policyData.files && policyData.files[0] ? policyData.files[0].name : '',
          file1Url: policyData.files && policyData.files[0] ? policyData.files[0].url : '',
          file2Name: policyData.files && policyData.files[1] ? policyData.files[1].name : '',
          file2Url: policyData.files && policyData.files[1] ? policyData.files[1].url : '',
          file3Name: policyData.files && policyData.files[2] ? policyData.files[2].name : '',
          file3Url: policyData.files && policyData.files[2] ? policyData.files[2].url : '',
          // URLs array
          urls: policyData.urls || []
        };

        result = createPolicy(mappedPolicyData);
        break;
      case 'updatePolicy':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        const updatePolicyData = JSON.parse(params.policyData || '{}');

        // Map frontend field names to backend expected names
        const mappedUpdatePolicyData = {
          policyName: updatePolicyData.title,
          shortDescription: updatePolicyData.description,
          fullContent: updatePolicyData.fullContent,
          documentCategory: updatePolicyData.category || updatePolicyData.policyType,
          policyType: updatePolicyData.policyType,
          version: updatePolicyData.version,
          batch: updatePolicyData.batch,
          targetBatch: updatePolicyData.targetBatch || updatePolicyData.batch,
          showOtherBatches: updatePolicyData.showOtherBatches,
          effectiveDate: updatePolicyData.effectiveDate,
          reviewDate: updatePolicyData.expiryDate,
          supersedes: updatePolicyData.supersedes,
          requiresAcknowledgement: updatePolicyData.requiresAcknowledgement || 'No',
          mandatoryReading: updatePolicyData.mandatoryReading || 'No',
          publish: updatePolicyData.publish,
          editedBy: studentEmail,
          status: updatePolicyData.status,
          notes: updatePolicyData.notes,
          priority: updatePolicyData.priority,
          // File mappings
          file1Name: updatePolicyData.files && updatePolicyData.files[0] ? updatePolicyData.files[0].name : '',
          file1Url: updatePolicyData.files && updatePolicyData.files[0] ? updatePolicyData.files[0].url : '',
          file2Name: updatePolicyData.files && updatePolicyData.files[1] ? updatePolicyData.files[1].name : '',
          file2Url: updatePolicyData.files && updatePolicyData.files[1] ? updatePolicyData.files[1].url : '',
          file3Name: updatePolicyData.files && updatePolicyData.files[2] ? updatePolicyData.files[2].name : '',
          file3Url: updatePolicyData.files && updatePolicyData.files[2] ? updatePolicyData.files[2].url : '',
          // URLs array
          urls: updatePolicyData.urls || []
        };

        result = updatePolicy(params.policyId, mappedUpdatePolicyData);
        break;
      case 'deletePolicy':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = deletePolicy(params.policyId);
        break;
      case 'getPolicies':
        const policyFilters = JSON.parse(params.filters || '{}');
        result = getPolicies(policyFilters);
        break;

      // Forms Management API
      case 'getTermStructure':
        result = getTermStructure();
        break;
      case 'getFormTypes':
        result = getFormTypes();
        break;
      case 'getForms':
        result = getForms(params);
        break;
      case 'getFormById':
        result = getFormById(params.formId);
        break;
      case 'getRequiredStartupForms':
        result = getRequiredStartupForms(params.userEmail);
        break;
      case 'getUserFormResponses':
        result = getUserFormResponses(params.formId, params.userEmail);
        break;
      case 'getFormResponses':
        result = getFormResponses(params.formId);
        break;
      case 'getResponseStats':
        result = getResponseStats(params.formId);
        break;
      case 'submitFormResponse':
        const responseData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = submitFormResponse(responseData);
        break;
      case 'createForm':
        const formData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = createForm(formData);
        break;
      case 'updateForm':
        const updateData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = updateForm(updateData.formId, updateData);
        break;
      case 'updateFormStatus':
        const statusData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = updateFormStatus(statusData.formId, statusData.status, statusData.lastModifiedBy);
        break;
      case 'deleteForm':
        const deleteData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = deleteForm(deleteData.formId);
        break;
      case 'duplicateForm':
        const dupData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = duplicateForm(dupData.formId, dupData.createdBy);
        break;
      case 'createQuestion':
        const questionData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = createQuestion(questionData);
        break;
      case 'updateQuestion':
        const qUpdateData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = updateQuestion(qUpdateData.questionId, qUpdateData);
        break;
      case 'deleteQuestion':
        const qDeleteData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = deleteQuestion(qDeleteData.questionId);
        break;
      case 'createOption':
        const optionData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = createOption(optionData);
        break;
      case 'deleteOption':
        const optDeleteData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = deleteOption(optDeleteData.optionId);
        break;
      case 'uploadFileToFormFolder':
        const uploadData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = uploadFileToFormFolder(uploadData.formFolderId, uploadData.fileName, uploadData.fileData, uploadData.mimeType);
        break;
      case 'uploadStudentAttachment':
        const attachData = e.postData ? JSON.parse(e.postData.contents) : {};
        result = uploadStudentAttachmentForms(attachData.formFolderId, attachData.studentName, attachData.fileName, attachData.fileData, attachData.mimeType);
        break;

      // Group Selection APIs
      case 'getAvailableStudentsForQuestion':
        result = getAvailableStudentsForQuestion(params.formId, params.questionId);
        break;
      case 'getStudentGroupStatus':
        result = getStudentGroupStatus(params.formId, params.questionId, params.studentEmail);
        break;
      case 'validateGroupMembers':
        const selectedMembers = params.selectedMembers ? JSON.parse(params.selectedMembers) : [];
        const validationResult = validateGroupMemberAvailability(params.formId, selectedMembers, params.questionId);
        // Wrap the validation result in the expected API response format
        result = {
          success: validationResult.success,
          data: {
            available: validationResult.available,
            unavailableMembers: validationResult.unavailableMembers,
            message: validationResult.message,
            debugLog: validationResult.debugLog
          }
        };
        break;
      case 'getAllStudents':
        result = getAllStudents();
        break;

      // Placement Management API
      case 'getBatches':
        result = getBatches();
        break;

      case 'enablePlacementViewForBatch':
        result = enablePlacementViewForBatch(params.batch, params.enable);
        break;

      // Job Portal API
      case 'createJobPosting':
        result = createJobPosting(JSON.parse(params.jobData || '{}'));
        break;
      case 'getAllJobPostings':
        result = getAllJobPostings(params.filters ? JSON.parse(params.filters) : null);
        break;
      case 'getJobPosting':
        result = getJobPosting(params.jobId);
        break;
      case 'updateJobPosting':
        result = updateJobPosting(params.jobId, JSON.parse(params.updates || '{}'));
        break;
      case 'deleteJobPosting':
        result = deleteJobPosting(params.jobId);
        break;
      case 'uploadJobFile':
        result = uploadJobFile(params.jobId, params.fileData, params.fileName, params.mimeType, params.fileType);
        break;

      // ==================== Course Access Management API ====================
      case 'getEnrolledStudents':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getEnrolledStudents(params);
        break;
      case 'enrollStudent':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = enrollStudent(params);
        break;
      case 'updateEnrolledStudent':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = updateEnrolledStudent(params);
        break;
      case 'removeStudentAccess':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = removeStudentAccess(params);
        break;
      case 'getNextRollNumber':
        if (!isAdmin(studentEmail)) {
          return createErrorResponse('Admin access required');
        }
        result = getNextRollNumber(params);
        break;

      default:
        return createErrorResponse('Unknown action: ' + action + ' | Backend Version: 422 | Params keys: ' + Object.keys(params).join(', '));
    }

    // Return JSON response
    return createJSONResponse(result);

  } catch (error) {
    Logger.log('API Error: ' + error.message);
    return createErrorResponse('Server error: ' + error.message);
  }
}

/**
 * Validate student email - allows any valid email format
 */
function isValidStudentEmail(email) {
  return email && typeof email === 'string' && email.includes('@') && email.includes('.');
}

/**
 * Create error response
 */
function createErrorResponse(message) {
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  return createJSONResponse(errorResponse);
}

/**
 * Get student dashboard with content filtered for them
 * @param {string} studentEmail - Student's email address
 * @param {string} lastSync - ISO timestamp of last sync (optional)
 * @return {Object} Dashboard data
 */
function getStudentDashboard(studentEmail, lastSync) {
  try {
    Logger.log('Getting dashboard for student: ' + studentEmail);
    
    // Get student profile to determine batch and options
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }

    const student = studentProfile.data;

    // Get content from Events & Announcements Management sheet (for EVENTS and ANNOUNCEMENTS)
    const eventsSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(EVENTS_ANNOUNCEMENTS_SHEET);
    const eventsData = eventsSheet ? eventsSheet.getDataRange().getValues() : [];

    // Get other content from main sheet (POLICIES, etc.)
    const mainSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const mainData = mainSheet.getDataRange().getValues();

    // Combine data from both sheets
    // Events & Announcements Management sheet has the same structure, so we can merge
    let data = [];
    if (eventsData.length > 2) {
      // Take header rows from events sheet
      data = eventsData;
    }

    // Add non-EVENTS/ANNOUNCEMENTS content from main sheet
    if (mainData.length > 2) {
      const mainHeaders = mainData[1];
      const mainCategoryIndex = mainHeaders.indexOf('Category');

      if (data.length === 0) {
        // If no events data, use main sheet structure
        data = [mainData[0], mainData[1]]; // Copy header rows
      }

      // Add rows from main sheet that are NOT events or announcements
      for (let i = 2; i < mainData.length; i++) {
        const category = mainData[i][mainCategoryIndex];
        if (category !== 'EVENTS' && category !== 'ANNOUNCEMENTS') {
          data.push(mainData[i]);
        }
      }
    }

    if (data.length <= 2) {
      Logger.log('Not enough data in sheets - need at least headers and one data row');
      return {
        success: true,
        data: {
          content: [],
          stats: {
            total: 0,
            active: 0,
            upcoming: 0,
            requiresAck: 0
          },
          student: student
        }
      };
    }

    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    const now = new Date();

    // Validate lastSync parameter
    let lastSyncDate = null;
    if (lastSync) {
      lastSyncDate = new Date(lastSync);
      if (isNaN(lastSyncDate.getTime())) {
        Logger.log('Invalid lastSync date provided: ' + lastSync);
        lastSyncDate = null;
      }
    }
    
    Logger.log(`Student Dashboard - Headers: ${headers.length} columns, Data rows: ${data.length - 2}`);
    Logger.log(`Column indices mapped: ${Object.keys(indices).length} fields`);
    
    const filteredContent = [];
    const stats = { total: 0, active: 0, upcoming: 0, requiresAck: 0 };

    // Process each content item (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      try {
        const row = data[i];

        // Skip unpublished content
        const publish = getValue(row, indices.publish);
        if (publish !== 'Yes') continue;

        // Calculate current status
        const startDateTime = parseDateTime(getValue(row, indices.startDateTime));
        const endDateTime = parseDateTime(getValue(row, indices.endDateTime));
        const currentStatus = calculateContentStatus(startDateTime, endDateTime);
      
      // Skip expired content older than 7 days
      if (currentStatus === 'Expired' && endDateTime) {
        const daysSinceExpired = (now - endDateTime) / (1000 * 60 * 60 * 24);
        if (daysSinceExpired > 7) continue;
      }

      // Check if content is targeted to this student
      const targetBatch = getValue(row, indices.targetBatch);
      const targetStudents = getValue(row, indices.targetStudents);
      
      if (!isContentTargetedToStudent(targetBatch, targetStudents, student)) {
        continue;
      }

      // If lastSync provided, only include content updated after that
      const createdAt = parseDateTime(getValue(row, indices.createdAt));
      const editedAt = parseDateTime(getValue(row, indices.editedAt));
      const lastModified = editedAt && editedAt > createdAt ? editedAt : createdAt;

      if (lastSyncDate && lastModified && lastModified <= lastSyncDate) {
        continue;
      }

      // Create base content item for dashboard
      let category = getValue(row, indices.category);
      const eventType = getValue(row, indices.eventType);

      // If category is empty but eventType exists, default to EVENTS
      // This handles Events & Announcements Management sheet where Category Type might be empty
      if (!category && eventType) {
        category = 'EVENTS';
      }

      const contentItem = {
        id: getValue(row, indices.id),
        category: category,
        eventType: eventType,
        title: getValue(row, indices.title),
        subTitle: getValue(row, indices.subTitle),
        content: getValue(row, indices.content),
        priority: getValue(row, indices.priority),
        status: currentStatus,
        term: getValue(row, indices.term),
        subject: getValue(row, indices.subject),
        groups: getValue(row, indices.groups),
        postedBy: getValue(row, indices.postedBy),
        createdAt: parseDateTime(getValue(row, indices.createdAt))?.toISOString() || null,
        startDateTime: parseDateTime(getValue(row, indices.startDateTime))?.toISOString() || null,
        endDateTime: parseDateTime(getValue(row, indices.endDateTime))?.toISOString() || null,
        targetBatch: getValue(row, indices.targetBatch),
        showOtherBatches: getValue(row, indices.showOtherBatches),
        requiresAcknowledgment: getValue(row, indices.requireAcknowledgment) === 'Yes',
        driveLink: getValue(row, indices.driveLink),
        sheetsLink: getValue(row, indices.sheetsLink),
        fileuploadLink: getValue(row, indices.fileuploadLink),
        fileURL: getValue(row, indices.fileURL),
        hasFiles: !!(getValue(row, indices.driveLink) || getValue(row, indices.sheetsLink) || getValue(row, indices.fileuploadLink) || getValue(row, indices.fileURL)),
        isNew: lastSyncDate && createdAt > lastSyncDate,
        daysUntilDeadline: endDateTime ? Math.ceil((endDateTime - now) / (1000 * 60 * 60 * 24)) : null
      };

      // Add acknowledgment status for ANNOUNCEMENTS and EVENTS
      if ((category === 'ANNOUNCEMENTS' || category === 'EVENTS') && contentItem.requiresAcknowledgment) {
        const ackStatus = getAcknowledgmentStatus(contentItem.id, studentEmail);
        contentItem.isAcknowledged = ackStatus.isAcknowledged;
        contentItem.acknowledgmentTimestamp = ackStatus.acknowledgmentTimestamp;
      } else {
        contentItem.isAcknowledged = false;
        contentItem.acknowledgmentTimestamp = null;
      }
      
      switch (category) {
        case 'ASSIGNMENTS & TASKS':
          contentItem.instructions = getValue(row, indices.instructions);
          contentItem.maxPoints = getValue(row, indices.maxPoints);
          contentItem.submissionGuidelines = getValue(row, indices.submissionGuidelines);
          contentItem.rubricLink = getValue(row, indices.rubricLink);
          contentItem.groupSize = getValue(row, indices.groupSize);
          break;
          
        case 'ANNOUNCEMENTS':
          contentItem.eventTitle = getValue(row, indices.eventTitle);
          contentItem.messageDetails = getValue(row, indices.messageDetails);
          contentItem.callToAction = getValue(row, indices.callToAction);
          contentItem.readTracking = getValue(row, indices.readTracking);
          contentItem.announcementType = getValue(row, indices.announcementType);
          contentItem.displayInCalendar = getValue(row, indices.displayInCalendar);
          contentItem.requiresAcknowledgement = getValue(row, indices.requiresAcknowledgement);
          contentItem.coverImageUrl = getValue(row, indices.coverImageUrl);
          break;

        case 'EVENTS':
          contentItem.eventTitle = getValue(row, indices.eventTitle);
          contentItem.eventLocation = getValue(row, indices.eventLocation);
          contentItem.eventAgenda = getValue(row, indices.eventAgenda);
          contentItem.speakerInfo = getValue(row, indices.speakerInfo);
          contentItem.displayInCalendar = getValue(row, indices.displayInCalendar);
          contentItem.requiresAcknowledgement = getValue(row, indices.requiresAcknowledgement);
          contentItem.registrationRequired = getValue(row, indices.registrationRequired);
          contentItem.registrationLink = getValue(row, indices.registrationLink);
          contentItem.maxAttendees = getValue(row, indices.maxAttendees);
          contentItem.coverImageUrl = getValue(row, indices.coverImageUrl);
          break;
          
        case 'COURSE MATERIAL':
          contentItem.learningObjectives = getValue(row, indices.learningObjectives);
          contentItem.prerequisites = getValue(row, indices.prerequisites);
          break;
          
        case 'POLICY & DOCUMENTS':
          contentItem.policyType = getValue(row, indices.policyType);
          contentItem.policyName = getValue(row, indices.policyName);
          contentItem.policyContent = getValue(row, indices.policyContent);
          break;
          
        case 'FORMS':
          contentItem.formDescription = getValue(row, indices.formDescription);
          contentItem.formLink = getValue(row, indices.formLink);
          break;
      }

      filteredContent.push(contentItem);
      
      // Update stats
      stats.total++;
      if (currentStatus === 'Active') stats.active++;
      if (currentStatus === 'Upcoming') stats.upcoming++;
      if (contentItem.requiresAcknowledgment) stats.requiresAck++;

      } catch (rowError) {
        Logger.log(`Error processing row ${i}: ${rowError.message}`);
        Logger.log(`Row ${i} - Stack: ${rowError.stack}`);
        // Log first few columns for debugging
        try {
          Logger.log(`Row ${i} - ID: ${data[i][indices.id]}, Category: ${data[i][indices.category]}, Title: ${data[i][indices.title]}`);
          Logger.log(`Row ${i} - StartDateTime raw: ${data[i][indices.startDateTime]}, EndDateTime raw: ${data[i][indices.endDateTime]}`);
        } catch (e) {
          Logger.log(`Row ${i} - Could not log row details: ${e.message}`);
        }
        continue; // Skip this row and process next
      }
    }

    // Add Students Corner activities to dashboard content
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const studentsCornerSheet = spreadsheet.getSheetByName(STUDENTS_CORNER_SHEET);
      
      if (studentsCornerSheet) {
        const data = studentsCornerSheet.getDataRange().getValues();
        
        if (data.length > 1) {
          const headers = data[0];
          const colMap = {
            id: headers.indexOf('S.ID'),
            type: headers.indexOf('S.Type'),
            studentEmail: headers.indexOf('S.Student Email'),
            fullName: headers.indexOf('S.Full Name'),
            batch: headers.indexOf('S.Batch'),
            timestamp: headers.indexOf('S.Timestamp'),
            status: headers.indexOf('S.Status'),
            points: headers.indexOf('S.Points'),
            title: headers.indexOf('S.Title'),
            content: headers.indexOf('S.Content'),
            targetBatch: headers.indexOf('S.Target Batch'),
            category: headers.indexOf('S.Category'),
            metadata: headers.indexOf('S.Metadata')
          };
          
          // Get recent activities with raw timestamps
          const recentActivities = [];
          for (let i = 1; i < data.length && recentActivities.length < 10; i++) {
            const row = data[i];
            
            // Skip if no student has access (simplified check)
            const targetBatch = row[colMap.targetBatch] || '';
            if (targetBatch && targetBatch !== 'All' && targetBatch !== student.batch) continue;
            
            // Get raw timestamp and convert to ISO
            const rawTimestamp = row[colMap.timestamp];
            let isoTimestamp = null;
            try {
              if (rawTimestamp instanceof Date) {
                isoTimestamp = rawTimestamp.toISOString();
              } else if (rawTimestamp) {
                // Parse various timestamp formats
                const parsedDate = parseDateTime(rawTimestamp);
                isoTimestamp = parsedDate ? parsedDate.toISOString() : new Date().toISOString();
              }
            } catch (e) {
              Logger.log('Error parsing Students Corner timestamp: ' + e.message);
              isoTimestamp = new Date().toISOString();
            }
            
            const studentsCornerItem = {
              id: `students-corner-${row[colMap.id] || i}`,
              category: 'STUDENTS CORNER',
              eventType: row[colMap.type] || 'POST',
              title: row[colMap.title] || 'Untitled',
              subTitle: `${row[colMap.type] || 'POST'} by ${row[colMap.fullName] || 'Student'}`,
              content: (row[colMap.content] || '').substring(0, 200) + '...', // Truncate for dashboard
              priority: 'Medium',
              status: 'Active',
              term: '',
              subject: row[colMap.category] || 'General',
              groups: row[colMap.batch] || '',
              postedBy: row[colMap.fullName] || 'Student',
              createdAt: isoTimestamp,
              startDateTime: isoTimestamp,
              endDateTime: null,
              targetBatch: row[colMap.targetBatch] || 'All',
              requiresAcknowledgment: false,
              driveLink: '',
              studentsCornerType: row[colMap.type] || 'POST',
              studentsCornerPoints: parseInt(row[colMap.points]) || 0,
              studentsCornerMetadata: row[colMap.metadata] || '{}'
            };
            
            recentActivities.push(studentsCornerItem);
          }
          
          // Add all recent activities to content
          recentActivities.forEach(item => {
            filteredContent.push(item);
            stats.total++;
            stats.active++;
          });
          
          Logger.log(`Added ${recentActivities.length} Students Corner activities to dashboard`);
        }
      }
    } catch (error) {
      Logger.log('Error adding Students Corner activities to dashboard: ' + error.message);
      // Continue without Students Corner activities if there's an error
    }

    // Add Students Corner tag notifications
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const engagementSheet = spreadsheet.getSheetByName(STUDENTS_CORNER_ENGAGEMENT_SHEET);
      
      if (engagementSheet) {
        const data = engagementSheet.getDataRange().getValues();
        
        if (data.length > 1) {
          const headers = data[0];
          const engColMap = {
            id: headers.indexOf('ID'),
            activityId: headers.indexOf('Activity ID'),
            studentEmail: headers.indexOf('Student Email'),
            fullName: headers.indexOf('Full Name'),
            batch: headers.indexOf('Batch'),
            timestamp: headers.indexOf('Timestamp'),
            engagementType: headers.indexOf('Engagement Type'),
            commentText: headers.indexOf('Comment Text'),
            points: headers.indexOf('Points')
          };
          
          // Look for recent comments where current student is mentioned
          const tagNotifications = [];
          for (let i = 1; i < data.length && tagNotifications.length < 5; i++) {
            const row = data[i];
            
            // Only check comments
            if (row[engColMap.engagementType] !== 'COMMENT') continue;
            
            // Check if current student is mentioned in the comment
            const commentText = row[engColMap.commentText] || '';
            if (!commentText.includes(`@${student.fullName}`)) continue;
            
            // Skip if the comment is by the current student (they don't need notification of their own comment)
            if (row[engColMap.studentEmail] === studentEmail) continue;
            
            // Get raw timestamp and convert to ISO
            const rawTimestamp = row[engColMap.timestamp];
            let isoTimestamp = null;
            try {
              if (rawTimestamp instanceof Date) {
                isoTimestamp = rawTimestamp.toISOString();
              } else if (rawTimestamp) {
                const parsedDate = parseDateTime(rawTimestamp);
                isoTimestamp = parsedDate ? parsedDate.toISOString() : new Date().toISOString();
              }
            } catch (e) {
              Logger.log('Error parsing engagement timestamp: ' + e.message);
              isoTimestamp = new Date().toISOString();
            }
            
            const tagNotification = {
              id: `tag-notification-${row[engColMap.id] || i}`,
              category: 'STUDENTS CORNER',
              eventType: 'MENTION',
              title: `You were mentioned in a comment`,
              subTitle: `${row[engColMap.fullName]} mentioned you`,
              content: commentText,
              priority: 'High',
              status: 'Active',
              term: '',
              subject: 'Mention',
              groups: row[engColMap.batch] || '',
              postedBy: row[engColMap.fullName] || 'Student',
              createdAt: isoTimestamp,
              startDateTime: isoTimestamp,
              endDateTime: null,
              targetBatch: 'All',
              requiresAcknowledgment: false,
              driveLink: '',
              studentsCornerType: 'MENTION',
              studentsCornerPoints: 0,
              studentsCornerActivityId: row[engColMap.activityId] || ''
            };
            
            tagNotifications.push(tagNotification);
          }
          
          // Add all tag notifications to content
          tagNotifications.forEach(item => {
            filteredContent.push(item);
            stats.total++;
            stats.active++;
          });
          
          Logger.log(`Added ${tagNotifications.length} tag notifications to dashboard`);
        }
      }
    } catch (error) {
      Logger.log('Error adding tag notifications to dashboard: ' + error.message);
      // Continue without tag notifications if there's an error
    }

    // Fetch policies from Policy & Documents Management sheet
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const policySheet = spreadsheet.getSheetByName('Policy & Documents Management');

      if (policySheet) {
        const policyData = policySheet.getDataRange().getValues();

        if (policyData.length > 1) {
          // Headers in row 1
          const policyHeaders = policyData[0];

          // Find column indices
          const policyColMap = {
            id: policyHeaders.indexOf('ID'),
            publish: policyHeaders.indexOf('Publish'),
            postedBy: policyHeaders.indexOf('Posted By'),
            createdAt: policyHeaders.indexOf('Created at'),
            editedAt: policyHeaders.indexOf('Edited at'),
            startDateTime: policyHeaders.indexOf('StartDateTime'),
            endDateTime: policyHeaders.indexOf('EndDateTime'),
            targetBatch: policyHeaders.indexOf('Target Batch'),
            showOtherBatches: policyHeaders.indexOf('Show Other Batches'),
            documentCategory: policyHeaders.indexOf('Document Category'),
            policyName: policyHeaders.indexOf('Policy/Document Name'),
            shortDescription: policyHeaders.indexOf('Short Description'),
            fullContent: policyHeaders.indexOf('Full Content'),
            priority: policyHeaders.indexOf('Priority'),
            version: policyHeaders.indexOf('Version'),
            effectiveDate: policyHeaders.indexOf('Effective Date'),
            status: policyHeaders.indexOf('Status')
          };

          // Process policies (start from row 2 = index 1)
          for (let i = 1; i < policyData.length; i++) {
            const row = policyData[i];

            // Skip unpublished
            if (row[policyColMap.publish] !== 'Yes') continue;

            // Skip archived
            if (row[policyColMap.status] === 'Archived') continue;

            // Check if targeted to student's batch
            const targetBatch = row[policyColMap.targetBatch];
            if (targetBatch && targetBatch !== student.batch) {
              // Check if other batches can view
              const showOtherBatches = row[policyColMap.showOtherBatches];
              if (showOtherBatches !== 'Yes') continue;
            }

            // Parse dates
            const startDateTime = parseDateTime(row[policyColMap.startDateTime]);
            const endDateTime = parseDateTime(row[policyColMap.endDateTime]);
            const currentStatus = calculateContentStatus(startDateTime, endDateTime);

            // Skip expired content older than 7 days
            if (currentStatus === 'Expired' && endDateTime) {
              const daysSinceExpired = (now - endDateTime) / (1000 * 60 * 60 * 24);
              if (daysSinceExpired > 7) continue;
            }

            // Create policy content item compatible with dashboard format
            const policyItem = {
              id: row[policyColMap.id],
              category: 'POLICY & DOCUMENTS',
              title: row[policyColMap.policyName],
              content: row[policyColMap.shortDescription] || '',
              priority: row[policyColMap.priority] || 'Medium',
              status: currentStatus,
              postedBy: row[policyColMap.postedBy],
              createdAt: parseDateTime(row[policyColMap.createdAt])?.toISOString() || null,
              startDateTime: startDateTime?.toISOString() || null,
              endDateTime: endDateTime?.toISOString() || null,
              targetBatch: targetBatch,
              requiresAcknowledgment: false,
              hasFiles: false,
              isNew: false,
              daysUntilDeadline: endDateTime ? Math.ceil((endDateTime - now) / (1000 * 60 * 60 * 24)) : null,
              // Policy-specific fields
              policyType: row[policyColMap.documentCategory],
              policyName: row[policyColMap.policyName],
              policyContent: row[policyColMap.fullContent] || row[policyColMap.shortDescription],
              version: row[policyColMap.version],
              effectiveDate: row[policyColMap.effectiveDate],
              source: 'PolicyManagement' // Mark source for debugging
            };

            filteredContent.push(policyItem);

            // Update stats
            stats.total++;
            if (currentStatus === 'Active') stats.active++;
            if (currentStatus === 'Upcoming') stats.upcoming++;
          }

          Logger.log(`Added ${policyData.length - 1} policies from Policy & Documents Management sheet`);
        }
      }
    } catch (error) {
      Logger.log('Error adding policies from Policy & Documents Management sheet: ' + error.message);
      // Continue without policies from management sheet if there's an error
    }

    // Sort by created date (newest first)
    filteredContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    Logger.log(`Dashboard loaded: ${filteredContent.length} items for ${studentEmail}`);
    
    return {
      success: true,
      data: {
        content: filteredContent,
        stats: stats,
        student: student,
        lastSync: new Date().toISOString()
      }
    };

  } catch (error) {
    Logger.log('Error in getStudentDashboard: ' + error.message);
    return {
      success: false,
      error: 'Failed to load dashboard: ' + error.message
    };
  }
}

/**
 * Get detailed content for a specific item
 * @param {string} contentId - Content ID
 * @param {string} studentEmail - Student's email
 * @return {Object} Content details
 */
function getContentDetails(contentId, studentEmail) {
  try {
    Logger.log(`Getting content details: ${contentId} for ${studentEmail}`);
    
    // Get student profile
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }

    const student = studentProfile.data;
    
    // Get content from main sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      Logger.log('Not enough data in sheet for content details');
      return {
        success: false,
        error: 'No content data found'
      };
    }
    
    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    Logger.log(`Content Details - Headers: ${headers.length} columns, Data rows: ${data.length - 2}`);
    
    // Find the content item (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      if (data[i][indices.id] === contentId) {
        const row = data[i];
        
        // Verify student has access to this content
        const targetBatch = getValue(row, indices.targetBatch);
        const targetStudents = getValue(row, indices.targetStudents);
        
        if (!isContentTargetedToStudent(targetBatch, targetStudents, student)) {
          return {
            success: false,
            error: 'Access denied: Content not targeted to this student'
          };
        }

        // Calculate current status
        const startDateTime = parseDateTime(getValue(row, indices.startDateTime));
        const endDateTime = parseDateTime(getValue(row, indices.endDateTime));
        const currentStatus = calculateContentStatus(startDateTime, endDateTime);
        
        // Parse file URLs
        const fileURLs = getValue(row, indices.fileURL);
        const files = fileURLs ? fileURLs.split(',').map(url => ({
          url: url.trim(),
          name: extractFileNameFromUrl(url.trim())
        })).filter(file => file.url) : [];

        // Create base content details
        const contentDetails = {
          id: getValue(row, indices.id),
          category: getValue(row, indices.category),
          eventType: getValue(row, indices.eventType),
          title: getValue(row, indices.title),
          subTitle: getValue(row, indices.subTitle),
          content: getValue(row, indices.content),
          priority: getValue(row, indices.priority),
          status: currentStatus,
          term: getValue(row, indices.term),
          domain: getValue(row, indices.domain),
          subject: getValue(row, indices.subject),
          groups: getValue(row, indices.groups),
          postedBy: getValue(row, indices.postedBy),
          createdAt: parseDateTime(getValue(row, indices.createdAt))?.toISOString() || null,
          editedAt: parseDateTime(getValue(row, indices.editedAt))?.toISOString() || null,
          editedBy: getValue(row, indices.editedBy),
          startDateTime: parseDateTime(getValue(row, indices.startDateTime))?.toISOString() || null,
          endDateTime: parseDateTime(getValue(row, indices.endDateTime))?.toISOString() || null,
          targetBatch: getValue(row, indices.targetBatch),
          targetStudents: getValue(row, indices.targetStudents),
          requiresAcknowledgment: getValue(row, indices.requireAcknowledgment) === 'Yes',
          driveLink: getValue(row, indices.driveLink),
          sheetsLink: getValue(row, indices.sheetsLink),
          fileuploadLink: getValue(row, indices.fileuploadLink),
          fileURL: getValue(row, indices.fileURL),
          files: files,
          daysUntilDeadline: endDateTime ? Math.ceil((endDateTime - new Date()) / (1000 * 60 * 60 * 24)) : null
        };

        // Add category-specific fields based on category
        const category = getValue(row, indices.category);
        
        switch (category) {
          case 'ASSIGNMENTS & TASKS':
            contentDetails.instructions = getValue(row, indices.instructions);
            contentDetails.maxPoints = getValue(row, indices.maxPoints);
            contentDetails.submissionGuidelines = getValue(row, indices.submissionGuidelines);
            contentDetails.rubricLink = getValue(row, indices.rubricLink);
            contentDetails.groupSize = getValue(row, indices.groupSize);
            break;
            
          case 'ANNOUNCEMENTS':
            contentDetails.eventTitle = getValue(row, indices.eventTitle);
            contentDetails.messageDetails = getValue(row, indices.messageDetails);
            contentDetails.callToAction = getValue(row, indices.callToAction);
            contentDetails.readTracking = getValue(row, indices.readTracking);
            break;
            
          case 'EVENTS':
            contentDetails.eventTitle = getValue(row, indices.eventTitle);
            contentDetails.eventLocation = getValue(row, indices.eventLocation);
            contentDetails.eventAgenda = getValue(row, indices.eventAgenda);
            contentDetails.speakerInfo = getValue(row, indices.speakerInfo);
            break;
            
          case 'COURSE MATERIAL':
            contentDetails.learningObjectives = getValue(row, indices.learningObjectives);
            contentDetails.prerequisites = getValue(row, indices.prerequisites);
            break;
            
          case 'POLICY & DOCUMENTS':
            contentDetails.policyType = getValue(row, indices.policyType);
            contentDetails.policyName = getValue(row, indices.policyName);
            contentDetails.policyContent = getValue(row, indices.policyContent);
            break;
            
          case 'FORMS':
            contentDetails.formDescription = getValue(row, indices.formDescription);
            contentDetails.formLink = getValue(row, indices.formLink);
            break;
            
          case 'DASHBOARDS':
            contentDetails.dashboardName = getValue(row, indices.dashboardName);
            contentDetails.dashboardLink = getValue(row, indices.dashboardLink);
            contentDetails.dashboardDescription = getValue(row, indices.dashboardDescription);
            contentDetails.dashboardSop = getValue(row, indices.dashboardSop);
            contentDetails.dashboardVisibility = getValue(row, indices.dashboardVisibility);
            break;
        }

        Logger.log('Content details retrieved: ' + contentId);
        return {
          success: true,
          data: contentDetails
        };
      }
    }

    return {
      success: false,
      error: 'Content not found'
    };

  } catch (error) {
    Logger.log('Error in getContentDetails: ' + error.message);
    return {
      success: false,
      error: 'Failed to get content details: ' + error.message
    };
  }
}

/**
 * Submit acknowledgment for content
 * @param {string} contentId - Content ID
 * @param {string} studentEmail - Student's email
 * @param {string} response - Acknowledgment response (Yes/No)
 * @return {Object} Submission result
 */
function submitAcknowledgment(contentId, studentEmail, response) {
  try {
    Logger.log(`Submitting acknowledgment: ${contentId} from ${studentEmail} - ${response}`);
    
    // Get student profile
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }

    const student = studentProfile.data;
    
    // Get content details to validate acknowledgment requirement
    const contentDetails = getContentDetails(contentId, studentEmail);
    if (!contentDetails.success) {
      return contentDetails;
    }

    const content = contentDetails.data;
    
    if (!content.requiresAcknowledgment) {
      return {
        success: false,
        error: 'This content does not require acknowledgment'
      };
    }

    // Use centralized acknowledgment sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const ackSheet = ss.getSheetByName(ACKNOWLEDGEMENT_SHEET);
    
    if (!ackSheet) {
      return {
        success: false,
        error: 'Acknowledgment sheet not found'
      };
    }
    
    // Check if student has already acknowledged this content
    const existingData = ackSheet.getDataRange().getValues();
    const headers = existingData[0];
    
    // Find column indices
    const idIndex = headers.indexOf('S.ID');
    const categoryIndex = headers.indexOf('S.Category');
    const timestampIndex = headers.indexOf('Timestamp');
    const emailIndex = headers.indexOf('Student Email');
    const nameIndex = headers.indexOf('Full Name');
    
    // Check for existing acknowledgment
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[idIndex] === contentId && row[emailIndex] === studentEmail) {
        // Update existing acknowledgment
        const timestamp = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
        ackSheet.getRange(i + 1, timestampIndex + 1).setValue(timestamp);
        
        Logger.log('Updated existing acknowledgment for: ' + studentEmail);
        return {
          success: true,
          message: 'Acknowledgment updated successfully'
        };
      }
    }

    // Add new acknowledgment row
    const timestamp = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const newRow = [];
    
    // Initialize all columns to empty
    for (let i = 0; i < headers.length; i++) {
      newRow[i] = '';
    }
    
    // Fill in the data
    if (idIndex >= 0) newRow[idIndex] = contentId;
    if (categoryIndex >= 0) newRow[categoryIndex] = content.category;
    if (timestampIndex >= 0) newRow[timestampIndex] = timestamp;
    if (emailIndex >= 0) newRow[emailIndex] = studentEmail;
    if (nameIndex >= 0) newRow[nameIndex] = student.fullName;
    
    ackSheet.appendRow(newRow);
    
    Logger.log('New acknowledgment added for: ' + studentEmail);
    
    // Trigger Firebase notification for real-time update
    triggerFirebaseNotification('acknowledgment', {
      contentId: contentId,
      studentEmail: studentEmail,
      response: response,
      timestamp: timestamp
    });
    
    return {
      success: true,
      message: 'Acknowledgment submitted successfully'
    };

  } catch (error) {
    Logger.log('Error in submitAcknowledgment: ' + error.message);
    return {
      success: false,
      error: 'Failed to submit acknowledgment: ' + error.message
    };
  }
}

/**
 * Check if user is an admin
 * @param {string} userEmail - User's email
 * @return {boolean} True if user is admin
 */
function isAdmin(userEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_LOGIN_SHEET);
    if (!sheet) {
      Logger.log('Student Login sheet not found');
      return false;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return false;
    }

    // Check if email exists in Student Login sheet with Admin role (column E, index 4)
    // Columns: Email (A/0) | Full Name (B/1) | Roll No (C/2) | Batch (D/3) | Role (E/4)
    for (let i = 1; i < data.length; i++) {
      const email = data[i][0]; // Column A
      const role = data[i][4]; // Column E

      Logger.log(`Checking admin for ${email}: role=${role}, matches=${email === userEmail && role === 'Admin'}`);

      if (email === userEmail && role === 'Admin') {
        return true;
      }
    }

    return false;
  } catch (error) {
    Logger.log('Error checking admin status: ' + error.message);
    return false;
  }
}

/**
 * Get student profile information
 * @param {string} studentEmail - Student's email
 * @return {Object} Student profile
 */
function getStudentProfile(studentEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_LOGIN_SHEET);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return {
        success: false,
        error: 'No student login data found'
      };
    }

    const headers = data[0];
    Logger.log('Student Login headers: ' + JSON.stringify(headers));

    // Find the student in Student Login sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentEmail) {
        const row = data[i];
        Logger.log('Found student row: ' + JSON.stringify(row));

        const isAdminFlag = isAdmin(studentEmail);
        Logger.log('isAdmin result for ' + studentEmail + ': ' + isAdminFlag);

        const studentProfile = {
          email: row[0],
          fullName: row[1] || '',
          rollNo: row[2] || '',
          batch: row[3] || '',
          options: [], // Initialize empty options array to prevent errors
          isAdmin: isAdminFlag // Check if user is admin
        };

        Logger.log('Returning student profile: ' + JSON.stringify(studentProfile));

        return {
          success: true,
          data: studentProfile
        };
      }
    }

    return {
      success: false,
      error: 'Student not found in login database'
    };

  } catch (error) {
    Logger.log('Error in getStudentProfile: ' + error.message);
    return {
      success: false,
      error: 'Failed to get student profile: ' + error.message
    };
  }
}

/**
 * Get full student profile from Student Profile sheet
 * @param {string} studentEmail - Student's email
 * @return {Object} Full student profile with extended fields
 */
function getFullStudentProfile(studentEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: false,
        error: 'No student profile data found'
      };
    }

    const headers = data[0];
    
    // Find the student in Student Profile sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentEmail) {
        const row = data[i];
        
        const fullProfile = {
          email: row[0] || '',
          fullName: row[1] || '',
          rollNo: row[2] || '',
          batch: row[3] || '',
          aboutMe: row[4] || '',
          phoneNo: row[5] || '',
          currentLocation: row[6] || '',
          linkedIn: row[7] || '',
          portfolioLink: row[8] || '',
          github: row[9] || '',
          undergraduateCollege: row[10] || '',
          undergraduateStream: row[11] || '',
          graduationYear: row[12] || '',
          previousCompany: row[13] || '',
          previousRole: row[14] || '',
          previousDuration: row[15] || '',
          techSkills: row[16] || '',
          softSkills: row[17] || '',
          achievements: row[18] || '',
          certifications: row[19] || '',
          interests: row[20] || '',
          languages: row[21] || '',
          profilePicture: row[22] || '',
          // Placement fields (Column X onwards - index 23+)
          placementView: row[23] || '',
          experienceType: row[24] || '',
          preferredLocations: row[25] || '',
          prevCompany1Name: row[26] || '',
          prevCompany1Role: row[27] || '',
          prevCompany1Duration: row[28] || '',
          prevCompany1CTC: row[29] || '',
          prevCompany2Name: row[30] || '',
          prevCompany2Role: row[31] || '',
          prevCompany2Duration: row[32] || '',
          prevCompany2CTC: row[33] || '',
          prevCompany3Name: row[34] || '',
          prevCompany3Role: row[35] || '',
          prevCompany3Duration: row[36] || '',
          prevCompany3CTC: row[37] || '',
          internship1Company: row[38] || '',
          internship1Role: row[39] || '',
          internship1Duration: row[40] || '',
          internship1Stipend: row[41] || '',
          internship2Company: row[42] || '',
          internship2Role: row[43] || '',
          internship2Duration: row[44] || '',
          internship2Stipend: row[45] || '',
          internship3Company: row[46] || '',
          internship3Role: row[47] || '',
          internship3Duration: row[48] || '',
          internship3Stipend: row[49] || '',
          previousCTCTotal: row[50] || '',
          previousStipendTotal: row[51] || '',
          totalFTExperienceMonths: row[52] || '',
          totalInternshipExperienceMonths: row[53] || '',
          project1Title: row[54] || '',
          project1Description: row[55] || '',
          project1Link: row[56] || '',
          project2Title: row[57] || '',
          project2Description: row[58] || '',
          project2Link: row[59] || '',
          project3Title: row[60] || '',
          project3Description: row[61] || '',
          project3Link: row[62] || '',
          otherLink1Title: row[63] || '',
          otherLink1URL: row[64] || '',
          otherLink2Title: row[65] || '',
          otherLink2URL: row[66] || '',
          domain1: row[67] || '',
          domain1ResumeURL: row[68] || '',
          domain2: row[69] || '',
          domain2ResumeURL: row[70] || '',
          domain3: row[71] || '',
          domain3ResumeURL: row[72] || '',
          resumeGeneralURL: row[73] || '',
          preferredDomain1: row[74] || '',
          preferredDomain1RelevantExperienceMonths: row[75] || '',
          preferredDomain2: row[76] || '',
          preferredDomain2RelevantExperienceMonths: row[77] || ''
        };

        return {
          success: true,
          data: fullProfile
        };
      }
    }

    // If student not found in profile sheet, create a new row with basic info from login sheet
    const loginResult = getStudentProfile(studentEmail);
    if (loginResult.success) {
      const basicProfile = {
        email: loginResult.data.email,
        fullName: loginResult.data.fullName,
        rollNo: loginResult.data.rollNo,
        batch: loginResult.data.batch,
        aboutMe: '',
        phoneNo: '',
        currentLocation: '',
        linkedIn: '',
        portfolioLink: '',
        github: '',
        undergraduateCollege: '',
        undergraduateStream: '',
        graduationYear: '',
        previousCompany: '',
        previousRole: '',
        previousDuration: '',
        techSkills: '',
        softSkills: '',
        achievements: '',
        certifications: '',
        interests: '',
        languages: '',
        profilePicture: ''
      };

      // Add the student to the profile sheet
      const newRow = [
        basicProfile.email,
        basicProfile.fullName,
        basicProfile.rollNo,
        basicProfile.batch,
        basicProfile.aboutMe,
        basicProfile.phoneNo,
        basicProfile.currentLocation,
        basicProfile.linkedIn,
        basicProfile.portfolioLink,
        basicProfile.github,
        basicProfile.undergraduateCollege,
        basicProfile.undergraduateStream,
        basicProfile.graduationYear,
        basicProfile.previousCompany,
        basicProfile.previousRole,
        basicProfile.previousDuration,
        basicProfile.techSkills,
        basicProfile.softSkills,
        basicProfile.achievements,
        basicProfile.certifications,
        basicProfile.interests,
        basicProfile.languages,
        basicProfile.profilePicture
      ];
      
      sheet.appendRow(newRow);

      return {
        success: true,
        data: basicProfile
      };
    }

    return {
      success: false,
      error: 'Student not found in login database'
    };

  } catch (error) {
    Logger.log('Error in getFullStudentProfile: ' + error.message);
    return {
      success: false,
      error: 'Failed to get full student profile: ' + error.message
    };
  }
}

/**
 * Update student profile in Student Profile sheet
 * @param {string} studentEmail - Student's email
 * @param {Object} profileData - Profile data to update
 * @return {Object} Result
 */
function updateStudentProfile(studentEmail, profileData) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: false,
        error: 'No student profile data found'
      };
    }

    const headers = data[0];
    let rowIndex = -1;
    
    // Find the student in Student Profile sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentEmail) {
        rowIndex = i;
        break;
      }
    }

    // If student not found, try to add them from login data
    if (rowIndex === -1) {
      const loginResult = getStudentProfile(studentEmail);
      if (!loginResult.success) {
        return {
          success: false,
          error: 'Student not found in login database'
        };
      }

      // Add new row with basic info
      const newRow = [
        studentEmail,
        loginResult.data.fullName || '',
        loginResult.data.rollNo || '',
        loginResult.data.batch || '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' // Empty profile fields
      ];
      
      sheet.appendRow(newRow);
      rowIndex = sheet.getLastRow() - 1; // Convert to 0-based index
    }

    // Update the profile data (keep first 4 columns from existing data - read-only)
    const updatedRow = [
      studentEmail, // Email (column 0) - read-only
      data[rowIndex][1] || '', // Full Name (column 1) - read-only from login sheet
      data[rowIndex][2] || '', // Roll No (column 2) - read-only from login sheet
      data[rowIndex][3] || '', // Batch (column 3) - read-only from login sheet
      profileData.aboutMe !== undefined ? profileData.aboutMe : (data[rowIndex][4] || ''), // About Me (column 4)
      profileData.phoneNo !== undefined ? profileData.phoneNo : (data[rowIndex][5] || ''), // Phone No (column 5)
      profileData.currentLocation !== undefined ? profileData.currentLocation : (data[rowIndex][6] || ''), // Current Location (column 6)
      profileData.linkedIn !== undefined ? profileData.linkedIn : (data[rowIndex][7] || ''), // LinkedIn (column 7)
      profileData.portfolioLink !== undefined ? profileData.portfolioLink : (data[rowIndex][8] || ''), // Portfolio Link (column 8)
      profileData.github !== undefined ? profileData.github : (data[rowIndex][9] || ''), // GitHub (column 9)
      profileData.undergraduateCollege !== undefined ? profileData.undergraduateCollege : (data[rowIndex][10] || ''), // Undergraduate College (column 10)
      profileData.undergraduateStream !== undefined ? profileData.undergraduateStream : (data[rowIndex][11] || ''), // Undergraduate Stream (column 11)
      profileData.graduationYear !== undefined ? profileData.graduationYear : (data[rowIndex][12] || ''), // Graduation Year (column 12)
      profileData.previousCompany !== undefined ? profileData.previousCompany : (data[rowIndex][13] || ''), // Previous Company (column 13)
      profileData.previousRole !== undefined ? profileData.previousRole : (data[rowIndex][14] || ''), // Previous Role (column 14)
      profileData.previousDuration !== undefined ? profileData.previousDuration : (data[rowIndex][15] || ''), // Previous Duration (column 15)
      profileData.techSkills !== undefined ? profileData.techSkills : (data[rowIndex][16] || ''), // Tech Skills (column 16)
      profileData.softSkills !== undefined ? profileData.softSkills : (data[rowIndex][17] || ''), // Soft Skills (column 17)
      profileData.achievements !== undefined ? profileData.achievements : (data[rowIndex][18] || ''), // Achievements (column 18)
      profileData.certifications !== undefined ? profileData.certifications : (data[rowIndex][19] || ''), // Certifications (column 19)
      profileData.interests !== undefined ? profileData.interests : (data[rowIndex][20] || ''), // Interests (column 20)
      profileData.languages !== undefined ? profileData.languages : (data[rowIndex][21] || ''), // Languages (column 21)
      profileData.profilePicture !== undefined ? profileData.profilePicture : (data[rowIndex][22] || ''), // Profile Picture (column 22)
      // Placement fields (Column X onwards - index 23+)
      profileData.placementView !== undefined ? profileData.placementView : (data[rowIndex][23] || ''),
      profileData.experienceType !== undefined ? profileData.experienceType : (data[rowIndex][24] || ''),
      profileData.preferredLocations !== undefined ? profileData.preferredLocations : (data[rowIndex][25] || ''),
      profileData.prevCompany1Name !== undefined ? profileData.prevCompany1Name : (data[rowIndex][26] || ''),
      profileData.prevCompany1Role !== undefined ? profileData.prevCompany1Role : (data[rowIndex][27] || ''),
      profileData.prevCompany1Duration !== undefined ? profileData.prevCompany1Duration : (data[rowIndex][28] || ''),
      profileData.prevCompany1CTC !== undefined ? profileData.prevCompany1CTC : (data[rowIndex][29] || ''),
      profileData.prevCompany2Name !== undefined ? profileData.prevCompany2Name : (data[rowIndex][30] || ''),
      profileData.prevCompany2Role !== undefined ? profileData.prevCompany2Role : (data[rowIndex][31] || ''),
      profileData.prevCompany2Duration !== undefined ? profileData.prevCompany2Duration : (data[rowIndex][32] || ''),
      profileData.prevCompany2CTC !== undefined ? profileData.prevCompany2CTC : (data[rowIndex][33] || ''),
      profileData.prevCompany3Name !== undefined ? profileData.prevCompany3Name : (data[rowIndex][34] || ''),
      profileData.prevCompany3Role !== undefined ? profileData.prevCompany3Role : (data[rowIndex][35] || ''),
      profileData.prevCompany3Duration !== undefined ? profileData.prevCompany3Duration : (data[rowIndex][36] || ''),
      profileData.prevCompany3CTC !== undefined ? profileData.prevCompany3CTC : (data[rowIndex][37] || ''),
      profileData.internship1Company !== undefined ? profileData.internship1Company : (data[rowIndex][38] || ''),
      profileData.internship1Role !== undefined ? profileData.internship1Role : (data[rowIndex][39] || ''),
      profileData.internship1Duration !== undefined ? profileData.internship1Duration : (data[rowIndex][40] || ''),
      profileData.internship1Stipend !== undefined ? profileData.internship1Stipend : (data[rowIndex][41] || ''),
      profileData.internship2Company !== undefined ? profileData.internship2Company : (data[rowIndex][42] || ''),
      profileData.internship2Role !== undefined ? profileData.internship2Role : (data[rowIndex][43] || ''),
      profileData.internship2Duration !== undefined ? profileData.internship2Duration : (data[rowIndex][44] || ''),
      profileData.internship2Stipend !== undefined ? profileData.internship2Stipend : (data[rowIndex][45] || ''),
      profileData.internship3Company !== undefined ? profileData.internship3Company : (data[rowIndex][46] || ''),
      profileData.internship3Role !== undefined ? profileData.internship3Role : (data[rowIndex][47] || ''),
      profileData.internship3Duration !== undefined ? profileData.internship3Duration : (data[rowIndex][48] || ''),
      profileData.internship3Stipend !== undefined ? profileData.internship3Stipend : (data[rowIndex][49] || ''),
      profileData.previousCTCTotal !== undefined ? profileData.previousCTCTotal : (data[rowIndex][50] || ''),
      profileData.previousStipendTotal !== undefined ? profileData.previousStipendTotal : (data[rowIndex][51] || ''),
      profileData.totalFTExperienceMonths !== undefined ? profileData.totalFTExperienceMonths : (data[rowIndex][52] || ''),
      profileData.totalInternshipExperienceMonths !== undefined ? profileData.totalInternshipExperienceMonths : (data[rowIndex][53] || ''),
      profileData.project1Title !== undefined ? profileData.project1Title : (data[rowIndex][54] || ''),
      profileData.project1Description !== undefined ? profileData.project1Description : (data[rowIndex][55] || ''),
      profileData.project1Link !== undefined ? profileData.project1Link : (data[rowIndex][56] || ''),
      profileData.project2Title !== undefined ? profileData.project2Title : (data[rowIndex][57] || ''),
      profileData.project2Description !== undefined ? profileData.project2Description : (data[rowIndex][58] || ''),
      profileData.project2Link !== undefined ? profileData.project2Link : (data[rowIndex][59] || ''),
      profileData.project3Title !== undefined ? profileData.project3Title : (data[rowIndex][60] || ''),
      profileData.project3Description !== undefined ? profileData.project3Description : (data[rowIndex][61] || ''),
      profileData.project3Link !== undefined ? profileData.project3Link : (data[rowIndex][62] || ''),
      profileData.otherLink1Title !== undefined ? profileData.otherLink1Title : (data[rowIndex][63] || ''),
      profileData.otherLink1URL !== undefined ? profileData.otherLink1URL : (data[rowIndex][64] || ''),
      profileData.otherLink2Title !== undefined ? profileData.otherLink2Title : (data[rowIndex][65] || ''),
      profileData.otherLink2URL !== undefined ? profileData.otherLink2URL : (data[rowIndex][66] || ''),
      profileData.domain1 !== undefined ? profileData.domain1 : (data[rowIndex][67] || ''),
      profileData.domain1ResumeURL !== undefined ? profileData.domain1ResumeURL : (data[rowIndex][68] || ''),
      profileData.domain2 !== undefined ? profileData.domain2 : (data[rowIndex][69] || ''),
      profileData.domain2ResumeURL !== undefined ? profileData.domain2ResumeURL : (data[rowIndex][70] || ''),
      profileData.domain3 !== undefined ? profileData.domain3 : (data[rowIndex][71] || ''),
      profileData.domain3ResumeURL !== undefined ? profileData.domain3ResumeURL : (data[rowIndex][72] || ''),
      profileData.resumeGeneralURL !== undefined ? profileData.resumeGeneralURL : (data[rowIndex][73] || ''),
      profileData.preferredDomain1 !== undefined ? profileData.preferredDomain1 : (data[rowIndex][74] || ''),
      profileData.preferredDomain1RelevantExperienceMonths !== undefined ? profileData.preferredDomain1RelevantExperienceMonths : (data[rowIndex][75] || ''),
      profileData.preferredDomain2 !== undefined ? profileData.preferredDomain2 : (data[rowIndex][76] || ''),
      profileData.preferredDomain2RelevantExperienceMonths !== undefined ? profileData.preferredDomain2RelevantExperienceMonths : (data[rowIndex][77] || '')
    ];

    // Update the row (rowIndex + 1 because sheet rows are 1-based)
    const range = sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length);
    range.setValues([updatedRow]);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        email: updatedRow[0],
        fullName: updatedRow[1],
        rollNo: updatedRow[2],
        batch: updatedRow[3],
        aboutMe: updatedRow[4],
        phoneNo: updatedRow[5],
        currentLocation: updatedRow[6],
        linkedIn: updatedRow[7],
        portfolioLink: updatedRow[8],
        github: updatedRow[9],
        undergraduateCollege: updatedRow[10],
        undergraduateStream: updatedRow[11],
        graduationYear: updatedRow[12],
        previousCompany: updatedRow[13],
        previousRole: updatedRow[14],
        previousDuration: updatedRow[15],
        techSkills: updatedRow[16],
        softSkills: updatedRow[17],
        achievements: updatedRow[18],
        certifications: updatedRow[19],
        interests: updatedRow[20],
        languages: updatedRow[21],
        profilePicture: updatedRow[22],
        // Placement fields
        placementView: updatedRow[23],
        experienceType: updatedRow[24],
        preferredLocations: updatedRow[25],
        prevCompany1Name: updatedRow[26],
        prevCompany1Role: updatedRow[27],
        prevCompany1Duration: updatedRow[28],
        prevCompany1CTC: updatedRow[29],
        prevCompany2Name: updatedRow[30],
        prevCompany2Role: updatedRow[31],
        prevCompany2Duration: updatedRow[32],
        prevCompany2CTC: updatedRow[33],
        prevCompany3Name: updatedRow[34],
        prevCompany3Role: updatedRow[35],
        prevCompany3Duration: updatedRow[36],
        prevCompany3CTC: updatedRow[37],
        internship1Company: updatedRow[38],
        internship1Role: updatedRow[39],
        internship1Duration: updatedRow[40],
        internship1Stipend: updatedRow[41],
        internship2Company: updatedRow[42],
        internship2Role: updatedRow[43],
        internship2Duration: updatedRow[44],
        internship2Stipend: updatedRow[45],
        internship3Company: updatedRow[46],
        internship3Role: updatedRow[47],
        internship3Duration: updatedRow[48],
        internship3Stipend: updatedRow[49],
        previousCTCTotal: updatedRow[50],
        previousStipendTotal: updatedRow[51],
        totalFTExperienceMonths: updatedRow[52],
        totalInternshipExperienceMonths: updatedRow[53],
        project1Title: updatedRow[54],
        project1Description: updatedRow[55],
        project1Link: updatedRow[56],
        project2Title: updatedRow[57],
        project2Description: updatedRow[58],
        project2Link: updatedRow[59],
        project3Title: updatedRow[60],
        project3Description: updatedRow[61],
        project3Link: updatedRow[62],
        otherLink1Title: updatedRow[63],
        otherLink1URL: updatedRow[64],
        otherLink2Title: updatedRow[65],
        otherLink2URL: updatedRow[66],
        domain1: updatedRow[67],
        domain1ResumeURL: updatedRow[68],
        domain2: updatedRow[69],
        domain2ResumeURL: updatedRow[70],
        domain3: updatedRow[71],
        domain3ResumeURL: updatedRow[72],
        resumeGeneralURL: updatedRow[73],
        preferredDomain1: updatedRow[74],
        preferredDomain1RelevantExperienceMonths: updatedRow[75],
        preferredDomain2: updatedRow[76],
        preferredDomain2RelevantExperienceMonths: updatedRow[77]
      }
    };

  } catch (error) {
    Logger.log('Error in updateStudentProfile: ' + error.message);
    return {
      success: false,
      error: 'Failed to update student profile: ' + error.message
    };
  }
}

/**
 * Get all unique batches from Student Profile sheet
 * @return {Object} List of unique batches
 */
function getBatches() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return {
        success: true,
        data: { batches: [] }
      };
    }

    // Column D (index 3) contains Batch
    const batches = [];
    const seen = new Set();

    for (let i = 1; i < data.length; i++) {
      const batch = data[i][3];
      if (batch && batch.toString().trim() && !seen.has(batch)) {
        seen.add(batch);
        batches.push(batch);
      }
    }

    // Sort batches
    batches.sort();

    return {
      success: true,
      data: { batches: batches }
    };

  } catch (error) {
    Logger.log('Error in getBatches: ' + error.message);
    return {
      success: false,
      error: 'Failed to get batches: ' + error.message
    };
  }
}

/**
 * Enable or disable placement view for all students in a batch
 * @param {string} batch - Batch name
 * @param {string} enable - 'Yes' or 'No'
 * @return {Object} Result with count of updated students
 */
function enablePlacementViewForBatch(batch, enable) {
  try {
    if (!batch) {
      return {
        success: false,
        error: 'Batch parameter is required'
      };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return {
        success: false,
        error: 'No student profile data found'
      };
    }

    const BATCH_COL = 3; // Column D (0-indexed)
    const PLACEMENT_VIEW_COL = 23; // Column X (0-indexed)

    let updatedCount = 0;

    // Find all students in the batch and update their placement view
    for (let i = 1; i < data.length; i++) {
      if (data[i][BATCH_COL] === batch) {
        // Update the placement view column
        sheet.getRange(i + 1, PLACEMENT_VIEW_COL + 1).setValue(enable);
        updatedCount++;
      }
    }

    return {
      success: true,
      data: { count: updatedCount },
      message: `Updated ${updatedCount} students in batch ${batch}`
    };

  } catch (error) {
    Logger.log('Error in enablePlacementViewForBatch: ' + error.message);
    return {
      success: false,
      error: 'Failed to update placement view: ' + error.message
    };
  }
}

/**
 * Get upcoming deadlines for student
 * @param {string} studentEmail - Student's email
 * @return {Object} Upcoming deadlines
 */
function getUpcomingDeadlines(studentEmail) {
  try {
    const dashboardData = getStudentDashboard(studentEmail);
    if (!dashboardData.success) {
      return dashboardData;
    }

    const now = new Date();
    const upcomingDeadlines = dashboardData.data.content
      .filter(item => {
        const endDate = new Date(item.endDateTime);
        const daysUntil = (endDate - now) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 7; // Next 7 days
      })
      .sort((a, b) => new Date(a.endDateTime) - new Date(b.endDateTime))
      .slice(0, 10); // Top 10 upcoming

    return {
      success: true,
      data: upcomingDeadlines
    };

  } catch (error) {
    Logger.log('Error in getUpcomingDeadlines: ' + error.message);
    return {
      success: false,
      error: 'Failed to get upcoming deadlines: ' + error.message
    };
  }
}

/**
 * Mark content as read by student (for read tracking)
 * @param {string} contentId - Content ID
 * @param {string} studentEmail - Student's email
 * @return {Object} Result
 */
function markContentAsRead(contentId, studentEmail) {
  try {
    // This could be implemented to track read status
    // For now, just return success
    Logger.log(`Marking content as read: ${contentId} by ${studentEmail}`);
    
    return {
      success: true,
      message: 'Content marked as read'
    };

  } catch (error) {
    Logger.log('Error in markContentAsRead: ' + error.message);
    return {
      success: false,
      error: 'Failed to mark content as read: ' + error.message
    };
  }
}

/**
 * Upload image to ImgBB (free image hosting service)
 * @param {string} imageData - Base64 encoded image data
 * @param {string} fileName - Original file name
 * @return {Object} ImgBB upload result
 */
function uploadToImgBB(imageData, fileName) {
  try {
    Logger.log('Uploading to ImgBB: ' + fileName);
    
    // Prepare form data for ImgBB API
    const payload = {
      'key': IMGBB_API_KEY,
      'image': imageData,
      'name': fileName.replace(/\.[^/.]+$/, ""), // Remove extension
      'expiration': '' // No expiration (permanent)
    };
    
    const options = {
      'method': 'POST',
      'payload': payload
    };
    
    const response = UrlFetchApp.fetch(IMGBB_UPLOAD_URL, options);
    const responseText = response.getContentText();
    const result = JSON.parse(responseText);
    
    if (result.success) {
      Logger.log('ImgBB upload successful: ' + result.data.url);
      return {
        success: true,
        data: {
          url: result.data.url,
          display_url: result.data.display_url,
          thumb: {
            url: result.data.thumb.url
          },
          medium: {
            url: result.data.medium.url
          },
          delete_url: result.data.delete_url
        }
      };
    } else {
      Logger.log('ImgBB upload failed: ' + responseText);
      return {
        success: false,
        error: result.error ? result.error.message : 'Upload failed'
      };
    }
    
  } catch (error) {
    Logger.log('Error uploading to ImgBB: ' + error.message);
    return {
      success: false,
      error: 'ImgBB upload error: ' + error.message
    };
  }
}

/**
 * Upload profile picture to both Google Drive (backup) and ImgBB (public display)
 * @param {string} studentEmail - Student's email
 * @param {string} imageData - Base64 encoded image data
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the image
 * @return {Object} Upload result with public URL
 */
/**
 * Get dashboard links for student - specifically from DASHBOARDS category
 * @param {string} studentEmail Student email
 * @return {Object} Dashboard links data
 */
function getDashboardLinks(studentEmail) {
  try {
    Logger.log(`Getting dashboard links for: ${studentEmail}`);
    
    // Get student profile for batch info
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      Logger.log(`Student profile not found for: ${studentEmail}`);
      return {
        success: false,
        error: 'Student profile not found'
      };
    }
    
    const student = studentProfile.data;
    Logger.log(`Student found - Batch: ${student.batch}, Name: ${student.fullName}`);
    
    // Get dashboard data from main sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      Logger.log('Not enough data in sheet - need at least headers and one data row');
      return {
        success: true,
        data: []
      };
    }
    
    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    Logger.log(`Headers found: ${headers.length} columns`);
    Logger.log(`Column indices mapped: ${Object.keys(indices).length} fields`);
    
    const dashboards = [];
    
    Logger.log(`Processing ${data.length - 2} data rows for dashboard entries`);
    
    // Process each row looking for DASHBOARDS category entries (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      // Check if this is a DASHBOARDS category entry
      const category = getValue(row, indices.category);
      Logger.log(`Row ${i}: Category = "${category}"`);
      if (category !== 'DASHBOARDS') continue;
      
      Logger.log(`Found DASHBOARDS row ${i}`);
      
      // Check if published
      const publish = getValue(row, indices.publish);
      Logger.log(`Row ${i}: Publish = "${publish}"`);
      if (publish !== 'Yes') continue;
      
      Logger.log(`Row ${i}: Passed publish check`);
      
      // Get dashboard-specific data
      const dashboardName = getValue(row, indices.dashboardName) || getValue(row, indices.title);
      const dashboardLink = getValue(row, indices.dashboardLink) || getValue(row, indices.driveLink) || getValue(row, indices.sheetsLink);
      const dashboardDescription = getValue(row, indices.dashboardDescription) || getValue(row, indices.content);
      const dashboardVisibility = getValue(row, indices.dashboardVisibility);
      const dashboardSop = getValue(row, indices.dashboardSop);
      
      // Skip if no name or link
      if (!dashboardName || !dashboardLink) continue;
      
      // Check visibility settings
      if (dashboardVisibility && dashboardVisibility.toLowerCase() === 'hidden') continue;
      
      // Check if student has access to this dashboard
      const targetBatch = getValue(row, indices.targetBatch);
      const targetStudents = getValue(row, indices.targetStudents);
      
      Logger.log(`Row ${i}: Target Batch = "${targetBatch}", Student Batch = "${student.batch}"`);
      Logger.log(`Row ${i}: Target Students = "${targetStudents}"`);
      
      if (isContentTargetedToStudent(targetBatch, targetStudents, student)) {
        Logger.log(`Row ${i}: Passed targeting check`);
        // Calculate current status for dashboard availability
        const startDateTime = parseDateTime(getValue(row, indices.startDateTime));
        const endDateTime = parseDateTime(getValue(row, indices.endDateTime));
        const currentStatus = calculateContentStatus(startDateTime, endDateTime);
        
        // Only include active or upcoming dashboards
        if (currentStatus === 'Active' || currentStatus === 'Upcoming') {
          dashboards.push({
            name: dashboardName,
            link: dashboardLink,
            description: dashboardDescription || '',
            type: getDashboardType(dashboardName),
            category: category,
            eventType: getValue(row, indices.eventType) || 'dashboard',
            visibility: dashboardVisibility || 'public',
            sop: dashboardSop || '',
            status: currentStatus,
            priority: getValue(row, indices.priority) || 'Medium'
          });
        }
      }
    }
    
    // Sort dashboards by priority (High -> Medium -> Low) and then by name
    dashboards.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
    
    Logger.log(`Found ${dashboards.length} dashboard links for ${studentEmail}`);
    
    return {
      success: true,
      data: dashboards
    };
    
  } catch (error) {
    Logger.log('Error in getDashboardLinks: ' + error.message);
    return {
      success: false,
      error: 'Failed to get dashboard links: ' + error.message
    };
  }
}

/**
 * Get student schedule/calendar data - specifically from CLASS/SESSION SCHEDULE category
 * @param {string} studentEmail Student email
 * @param {string} startDate Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate Optional end date filter (YYYY-MM-DD)
 * @return {Object} Schedule data
 */
function getStudentSchedule(studentEmail, startDate, endDate) {
  try {
    Logger.log(`Getting schedule for: ${studentEmail}`);
    
    // Get student profile for batch info
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      Logger.log(`Student profile not found for: ${studentEmail}`);
      return {
        success: false,
        error: 'Student profile not found'
      };
    }
    
    const student = studentProfile.data;
    Logger.log(`Student found - Batch: ${student.batch}, Name: ${student.fullName}`);
    
    // Get schedule data from main sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      Logger.log('Not enough data in sheet - need at least headers and one data row');
      return {
        success: true,
        data: []
      };
    }
    
    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    Logger.log(`Headers found: ${headers.length} columns`);
    Logger.log(`Column indices mapped: ${Object.keys(indices).length} fields`);
    
    const scheduleItems = [];
    const now = new Date();
    
    // Parse date filters if provided
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;
    
    Logger.log(`Processing ${data.length - 2} data rows for schedule entries`);
    
    // Process each row looking for entries with dates (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      // Get category and check if it has meaningful dates
      const category = getValue(row, indices.category);
      Logger.log(`Row ${i}: Category = "${category}"`);
      
      // Skip entries without valid categories
      if (!category) continue;
      
      // Skip categories that don't belong in calendar view
      const nonCalendarCategories = ['DASHBOARDS', 'POLICY & DOCUMENTS'];
      if (nonCalendarCategories.includes(category)) {
        Logger.log(`Row ${i}: Skipping non-calendar category: ${category}`);
        continue;
      }
      
      // Get start and end date times to check if this entry should appear in calendar
      const startDateTimeValue = getValue(row, indices.startDateTime);
      const endDateTimeValue = getValue(row, indices.endDateTime);
      
      // Skip entries without dates (no point showing them in calendar)
      if (!startDateTimeValue && !endDateTimeValue) {
        Logger.log(`Row ${i}: Skipping - no dates provided`);
        continue;
      }
      
      Logger.log(`Found calendar entry: ${category} row ${i}`);
      
      // Check if published
      const publish = getValue(row, indices.publish);
      Logger.log(`Row ${i}: Publish = "${publish}"`);
      if (publish !== 'Yes') continue;
      
      Logger.log(`Row ${i}: Passed publish check`);
      
      // Check if student has access to this schedule item
      const targetBatch = getValue(row, indices.targetBatch);
      const targetStudents = getValue(row, indices.targetStudents);
      
      Logger.log(`Row ${i}: Target Batch = "${targetBatch}", Student Batch = "${student.batch}"`);
      
      if (isContentTargetedToStudent(targetBatch, targetStudents, student)) {
        Logger.log(`Row ${i}: Passed targeting check`);
        
        // Get schedule timing
        const startDateTime = parseDateTime(startDateTimeValue);
        const endDateTime = parseDateTime(endDateTimeValue);
        
        // Apply date filters if provided
        if (filterStartDate && startDateTime && startDateTime < filterStartDate) continue;
        if (filterEndDate && startDateTime && startDateTime > filterEndDate) continue;
        
        // Calculate current status for schedule item
        const currentStatus = calculateContentStatus(startDateTime, endDateTime);
        
        // Map categories to display categories and determine eventType
        let displayCategory = category;
        let defaultEventType = 'general';
        
        switch (category) {
          case 'CLASS/SESSION SCHEDULE': 
            defaultEventType = 'class'; 
            break;
          case 'ASSIGNMENTS & TASKS': 
            defaultEventType = 'assignment'; 
            break;
          case 'EVENTS': 
            displayCategory = 'Events & Announcements';
            defaultEventType = 'event'; 
            break;
          case 'ANNOUNCEMENTS': 
            displayCategory = 'Events & Announcements';
            defaultEventType = 'announcement'; 
            break;
          case 'FORMS': 
            defaultEventType = 'form'; 
            break;
          case 'COURSE MATERIAL': 
            displayCategory = 'Resource';
            defaultEventType = 'resource'; 
            break;
          default: 
            defaultEventType = 'general'; 
            break;
        }
        
        // Determine title with category-specific fallbacks
        let itemTitle = getValue(row, indices.title);
        if (!itemTitle) {
          switch (category) {
            case 'EVENTS':
              itemTitle = getValue(row, indices.eventTitle);
              break;
            default:
              itemTitle = 'Untitled';
              break;
          }
        }
        // Final fallback
        if (!itemTitle) itemTitle = 'Untitled';

        // Create schedule item
        const scheduleItem = {
          id: getValue(row, indices.id),
          category: displayCategory,
          originalCategory: category, // Keep original for category-specific fields
          eventType: getValue(row, indices.eventType) || defaultEventType,
          title: itemTitle,
          subTitle: getValue(row, indices.subTitle),
          content: getValue(row, indices.content),
          domain: getValue(row, indices.domain),
          subject: getValue(row, indices.subject),
          groups: getValue(row, indices.groups),
          postedBy: getValue(row, indices.postedBy),
          startDateTime: startDateTime ? startDateTime.toISOString() : null,
          endDateTime: endDateTime ? endDateTime.toISOString() : null,
          startDateTimeRaw: startDateTime, // Keep raw date for sorting
          endDateTimeRaw: endDateTime,
          targetBatch: getValue(row, indices.targetBatch),
          term: getValue(row, indices.term),
          priority: getValue(row, indices.priority) || 'Medium',
          status: currentStatus,
          driveLink: getValue(row, indices.driveLink),
          sheetsLink: getValue(row, indices.sheetsLink),
          requiresAcknowledgment: getValue(row, indices.requireAcknowledgment) === 'Yes',
          createdAt: parseDateTime(getValue(row, indices.createdAt))?.toISOString() || null
        };
        
        // Add category-specific fields for better calendar display
        switch (scheduleItem.originalCategory) {
          case 'ASSIGNMENTS & TASKS':
            scheduleItem.instructions = getValue(row, indices.instructions);
            scheduleItem.maxPoints = getValue(row, indices.maxPoints);
            scheduleItem.submissionGuidelines = getValue(row, indices.submissionGuidelines);
            scheduleItem.groupSize = getValue(row, indices.groupSize);
            break;
            
          case 'EVENTS':
            scheduleItem.eventTitle = getValue(row, indices.eventTitle);
            scheduleItem.eventLocation = getValue(row, indices.eventLocation);
            scheduleItem.eventAgenda = getValue(row, indices.eventAgenda);
            scheduleItem.speakerInfo = getValue(row, indices.speakerInfo);
            break;
            
          case 'ANNOUNCEMENTS':
            scheduleItem.messageDetails = getValue(row, indices.messageDetails);
            scheduleItem.callToAction = getValue(row, indices.callToAction);
            break;
            
          case 'FORMS':
            scheduleItem.formDescription = getValue(row, indices.formDescription);
            scheduleItem.formLink = getValue(row, indices.formLink);
            break;
            
          case 'COURSE MATERIAL':
            scheduleItem.learningObjectives = getValue(row, indices.learningObjectives);
            scheduleItem.prerequisites = getValue(row, indices.prerequisites);
            break;
        }
        
        scheduleItems.push(scheduleItem);
        Logger.log(`Row ${i}: Added schedule item - ${scheduleItem.title}`);
      } else {
        Logger.log(`Row ${i}: Failed targeting check`);
      }
    }
    
    // Sort schedule items by start date/time (upcoming first)
    scheduleItems.sort((a, b) => {
      if (!a.startDateTimeRaw) return 1;
      if (!b.startDateTimeRaw) return -1;
      return a.startDateTimeRaw - b.startDateTimeRaw;
    });
    
    Logger.log(`Found ${scheduleItems.length} schedule items for ${studentEmail}`);
    
    return {
      success: true,
      data: scheduleItems
    };
    
  } catch (error) {
    Logger.log('Error in getStudentSchedule: ' + error.message);
    return {
      success: false,
      error: 'Failed to get student schedule: ' + error.message
    };
  }
}

/**
 * Get policies and documents for student
 * @param {string} studentEmail Student email
 * @return {Object} Policies and documents data
 */
function getPoliciesAndDocuments(studentEmail) {
  try {
    Logger.log(`Getting policies and documents for: ${studentEmail}`);
    
    // Get student profile for batch info
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      Logger.log(`Student profile not found for: ${studentEmail}`);
      return {
        success: false,
        error: 'Student profile not found'
      };
    }
    
    const student = studentProfile.data;
    Logger.log(`Student found - Batch: ${student.batch}, Name: ${student.fullName}`);
    
    // Get data from main sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      Logger.log('Not enough data in sheet - need at least headers and one data row');
      return {
        success: true,
        data: []
      };
    }
    
    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    Logger.log(`Headers found: ${headers.length} columns`);
    Logger.log(`Column indices mapped: ${Object.keys(indices).length} fields`);
    
    const policyItems = [];
    const now = new Date();
    
    Logger.log(`Processing ${data.length - 2} data rows for POLICY & DOCUMENTS entries`);
    
    // Process each row looking for POLICY & DOCUMENTS entries (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      // Get category and check if it's POLICY & DOCUMENTS
      const category = getValue(row, indices.category);
      Logger.log(`Row ${i}: Category = "${category}"`);
      
      // Only process POLICY & DOCUMENTS entries
      if (category !== 'POLICY & DOCUMENTS') continue;
      
      Logger.log(`Found policy/document entry at row ${i}`);
      
      // Check if published
      const publish = getValue(row, indices.publish);
      Logger.log(`Row ${i}: Publish = "${publish}"`);
      if (publish !== 'Yes') continue;
      
      Logger.log(`Row ${i}: Passed publish check`);
      
      // Check if student has access to this policy/document
      const targetBatch = getValue(row, indices.targetBatch);
      const targetStudents = getValue(row, indices.targetStudents);
      
      Logger.log(`Row ${i}: Target Batch = "${targetBatch}", Student Batch = "${student.batch}"`);
      
      if (isContentTargetedToStudent(targetBatch, targetStudents, student)) {
        Logger.log(`Row ${i}: Passed targeting check`);
        
        // Get dates for status calculation
        const startDateTime = parseDateTime(getValue(row, indices.startDateTime));
        const endDateTime = parseDateTime(getValue(row, indices.endDateTime));
        
        // Calculate status based on dates (if provided)
        let currentStatus = 'Active';
        if (startDateTime && endDateTime) {
          if (now < startDateTime) {
            currentStatus = 'Upcoming';
          } else if (now > endDateTime) {
            currentStatus = 'Expired';
          } else {
            currentStatus = 'Active';
          }
        } else if (startDateTime && now < startDateTime) {
          currentStatus = 'Upcoming';
        } else if (endDateTime && now > endDateTime) {
          currentStatus = 'Expired';
        }
        
        // Get title
        let itemTitle = getValue(row, indices.title);
        if (!itemTitle) {
          // Try policy name as fallback
          itemTitle = getValue(row, indices.policyName);
        }
        // Final fallback
        if (!itemTitle) itemTitle = 'Untitled Policy/Document';

        // Create policy/document item
        const policyItem = {
          id: getValue(row, indices.id),
          category: category,
          eventType: getValue(row, indices.eventType) || 'Policy',
          title: itemTitle,
          subTitle: getValue(row, indices.subTitle),
          content: getValue(row, indices.content),
          postedBy: getValue(row, indices.postedBy),
          startDateTime: startDateTime ? startDateTime.toISOString() : null,
          endDateTime: endDateTime ? endDateTime.toISOString() : null,
          targetBatch: getValue(row, indices.targetBatch),
          priority: getValue(row, indices.priority) || 'Medium',
          status: currentStatus,
          fileURL: getValue(row, indices.fileURL),
          driveLink: getValue(row, indices.driveLink),
          sheetsLink: getValue(row, indices.sheetsLink),
          fileuploadLink: getValue(row, indices.fileuploadLink),
          requiresAcknowledgment: getValue(row, indices.requiresAcknowledgment) === 'Yes',
          createdAt: parseDateTime(getValue(row, indices.createdAt))?.toISOString() || null,
          editedAt: parseDateTime(getValue(row, indices.editedAt))?.toISOString() || null,
          editedBy: getValue(row, indices.editedBy),
          
          // POLICY & DOCUMENTS specific fields
          policyType: getValue(row, indices.policyType),
          policyName: getValue(row, indices.policyName),
          policyContent: getValue(row, indices.policyContent)
        };
        
        // Check for files
        const driveLink = getValue(row, indices.driveLink);
        const sheetsLink = getValue(row, indices.sheetsLink);
        const fileuploadLink = getValue(row, indices.fileuploadLink);
        const fileURL = getValue(row, indices.fileURL);
        policyItem.hasFiles = !!(driveLink || sheetsLink || fileuploadLink || fileURL);
        
        policyItems.push(policyItem);
        Logger.log(`Row ${i}: Added policy/document item - ${policyItem.title}`);
      } else {
        Logger.log(`Row ${i}: Failed targeting check`);
      }
    }
    
    // Sort policy items by title
    policyItems.sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    });
    
    Logger.log(`Found ${policyItems.length} policy/document items for ${studentEmail}`);
    
    return {
      success: true,
      data: policyItems
    };
    
  } catch (error) {
    Logger.log('Error in getPoliciesAndDocuments: ' + error.message);
    return {
      success: false,
      error: 'Failed to get policies and documents: ' + error.message
    };
  }
}

/**
 * Get course resources with dynamic hierarchical folder structure
 * @param {string} studentEmail - Student's email address
 * @returns {Object} Dynamic folder structure with resources organized by term/domain/subject
 */
function getCourseResources(studentEmail) {
  try {
    Logger.log(`Getting course resources for: ${studentEmail}`);
    
    // Get student profile for batch info
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      Logger.log(`Student profile not found for: ${studentEmail}`);
      return {
        success: false,
        error: 'Student profile not found'
      };
    }
    
    const student = studentProfile.data;
    Logger.log(`Student found - Batch: ${student.batch}, Name: ${student.fullName}`);
    
    // Get data from main sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      Logger.log('Not enough data in sheet - need at least headers and one data row');
      return {
        success: true,
        data: {
          availableTerms: [],
          folderStructure: {},
          flatMaterials: []
        }
      };
    }
    
    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    Logger.log(`Headers found: ${headers.length} columns`);
    Logger.log(`Column indices mapped: ${Object.keys(indices).length} fields`);
    
    const courseMaterials = [];
    const now = new Date();
    
    Logger.log(`Processing ${data.length - 2} data rows for COURSE MATERIAL entries`);
    
    // Process each row looking for COURSE MATERIAL entries (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      // Get category and check if it's COURSE MATERIAL
      const category = getValue(row, indices.category);
      
      // Only process COURSE MATERIAL entries
      if (category === 'COURSE MATERIAL') {
        // Get basic info
        const publish = getValue(row, indices.publish);
        
        Logger.log(`Row ${i}: Found COURSE MATERIAL - Publish: ${publish}`);
        
        // Skip non-published items (case sensitive: "Yes" not "YES")
        if (publish !== 'Yes') {
          Logger.log(`Skipping row ${i}: Not published (${publish})`);
          continue;
        }
        
        // Check if student is targeted (simplified logic)
        const targetBatch = getValue(row, indices.targetBatch);
        
        // Direct batch comparison instead of complex getTargetedStudents logic
        if (targetBatch && targetBatch !== 'ALL' && targetBatch !== student.batch) {
          Logger.log(`Skipping row ${i}: Student batch ${student.batch} not targeted (target: ${targetBatch})`);
          continue;
        }
        
        // Create course material item with safe date parsing
        let createdAtISO = null;
        let editedAtISO = null;

        try {
          const createdAtDate = parseDateTime(getValue(row, indices.createdAt));
          if (createdAtDate && !isNaN(createdAtDate.getTime())) {
            createdAtISO = createdAtDate.toISOString();
          }
        } catch (e) {
          Logger.log(`Error parsing createdAt for row ${i}: ${e.message}`);
        }

        try {
          const editedAtDate = parseDateTime(getValue(row, indices.editedAt));
          if (editedAtDate && !isNaN(editedAtDate.getTime())) {
            editedAtISO = editedAtDate.toISOString();
          }
        } catch (e) {
          Logger.log(`Error parsing editedAt for row ${i}: ${e.message}`);
        }

        const materialItem = {
          id: getValue(row, indices.id),
          title: getValue(row, indices.title),
          subTitle: getValue(row, indices.subTitle),
          term: getValue(row, indices.term) || null,
          domain: getValue(row, indices.domain) || null,
          subject: getValue(row, indices.subject) || null,
          priority: getValue(row, indices.priority) || null,
          createdAt: createdAtISO,
          editedAt: editedAtISO,
          driveLink: getValue(row, indices.driveLink),
          fileURL: getValue(row, indices.fileURL), // S.File URL field
          attachments: getValue(row, indices.driveLink), // S.Drive Link field only
          resourceLink: getValue(row, indices.fileuploadLink), // S.Fileupload Link field only
          learningObjectives: getValue(row, indices.learningObjectives),
          prerequisites: getValue(row, indices.prerequisites),
          eventType: getValue(row, indices.eventType),
          category: getValue(row, indices.category),
          targetBatch: getValue(row, indices.targetBatch)
        };
        
        courseMaterials.push(materialItem);
        Logger.log(`Added course material: ${materialItem.title} [Term: ${materialItem.term}, Domain: ${materialItem.domain}, Subject: ${materialItem.subject}]`);
      }
    }
    
    Logger.log(`Found ${courseMaterials.length} course materials from ALL IN ONE sheet`);

    // ALSO fetch from Resources Material sheet
    Logger.log('=== FETCHING FROM RESOURCES MATERIAL SHEET ===');
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const resourceMgmtSheet = spreadsheet.getSheetByName('Resources Material');

      if (resourceMgmtSheet) {
        const resourceData = resourceMgmtSheet.getDataRange().getValues();
        Logger.log(`✓ Resources Material sheet found with ${resourceData.length} rows`);

        if (resourceData.length > 1) {
          const resourceHeaders = resourceData[0];
          // Map column indices for Resource Management sheet
          const colMap = {};
          resourceHeaders.forEach((header, idx) => {
            colMap[header.trim()] = idx;
          });

          // Process rows from Resources Material (skip header)
          Logger.log(`Processing ${resourceData.length - 1} rows from Resources Material...`);
          for (let i = 1; i < resourceData.length; i++) {
            const row = resourceData[i];

            const title = (row[colMap['Title_RES']] || '').toString().trim();
            const publish = (row[colMap['Publish_RES']] || '').toString().trim();
            const status = (row[colMap['Status_RES']] || '').toString().trim();

            Logger.log(`Row ${i}: ${title} - Publish: "${publish}", Status: "${status}"`);

            // Only include Published resources
            if (publish !== 'Yes' || status !== 'Published') {
              Logger.log(`  ✗ Skipped - Publish/Status check failed`);
              continue;
            }

            // Check batch targeting
            const targetBatch = (row[colMap['Target Batch_RES']] || '').toString().trim();
            Logger.log(`  Batch check - Target: "${targetBatch}", Student: "${student.batch}"`);
            if (targetBatch && targetBatch !== student.batch && targetBatch !== 'ALL') {
              Logger.log(`  ✗ Skipped - Batch mismatch`);
              continue;
            }

            // Check date range
            const now = new Date();
            const startDateTime = row[colMap['StartDateTime_RES']];
            const endDateTime = row[colMap['EndDateTime_RES']];

            Logger.log(`  Date check - Start: "${startDateTime}", End: "${endDateTime}", Now: ${now.toISOString()}`);

            if (startDateTime) {
              const start = parseDateTime(startDateTime);
              Logger.log(`  Parsed start date: ${start ? start.toISOString() : 'null'}`);
              if (start && now < start) {
                Logger.log(`  ✗ Skipped - Start date is in the future`);
                continue;
              }
            }

            if (endDateTime) {
              const end = parseDateTime(endDateTime);
              Logger.log(`  Parsed end date: ${end ? end.toISOString() : 'null'}`);
              if (end && now > end) {
                Logger.log(`  ✗ Skipped - End date has passed`);
                continue;
              }
            }

            // Collect all file URLs (File 1 through File 5)
            const files = [];
            for (let fileNum = 1; fileNum <= 5; fileNum++) {
              const fileName = (row[colMap[`File ${fileNum} Name_RES`]] || '').toString().trim();
              const fileUrl = (row[colMap[`File ${fileNum} URL_RES`]] || '').toString().trim();
              if (fileUrl) {
                files.push({
                  name: fileName || `File ${fileNum}`,
                  url: fileUrl
                });
              }
            }

            // Parse URLs field (format: "Name|URL,Name|URL" or "Name|URL\nName|URL")
            const urlsField = (row[colMap['URLs_RES']] || '').toString().trim();
            const urls = [];
            if (urlsField) {
              // Split by comma or newline
              const urlPairs = urlsField.split(/[,\n]+/);
              urlPairs.forEach(pair => {
                const trimmedPair = pair.trim();
                if (trimmedPair && trimmedPair.includes('|')) {
                  const parts = trimmedPair.split('|');
                  if (parts.length >= 2) {
                    urls.push({
                      name: parts[0].trim(),
                      url: parts[1].trim()
                    });
                  }
                }
              });
            }

            const driveLink = (row[colMap['Drive Folder Link_RES']] || '').toString().trim();

            // Create material item from Resources Material
            const materialItem = {
              id: row[colMap['ID_RES']] || '',
              title: row[colMap['Title_RES']] || '',
              subTitle: row[colMap['Description_RES']] || '',
              term: row[colMap['Term_RES']] || null,
              domain: row[colMap['Domain_RES']] || null,
              subject: row[colMap['Subject_RES']] || null,
              priority: row[colMap['Priority_RES']] || 'Medium',
              createdAt: parseDateTime(row[colMap['Created at_RES']]),
              editedAt: parseDateTime(row[colMap['Edited at_RES']]),
              driveLink: driveLink,
              // Legacy fields for backward compatibility
              fileURL: files.length > 0 ? files[0].url : '',
              attachments: urlsField || driveLink,
              resourceLink: files.length > 0 ? files[0].url : '',
              // New structured fields
              files: files, // Array of {name, url}
              urls: urls,   // Array of {name, url}
              learningObjectives: row[colMap['Learning Objectives_RES']] || '',
              prerequisites: row[colMap['Prerequisites_RES']] || '',
              eventType: row[colMap['Resource Type_RES']] || '',
              category: 'COURSE MATERIAL',
              targetBatch: targetBatch,
              source: 'Resources Material' // Mark source for debugging
            };

            courseMaterials.push(materialItem);
            Logger.log(`  ✓ ADDED: ${materialItem.title} [Term: ${materialItem.term}]`);
          }
        }
      } else {
        Logger.log('✗ Resources Material sheet NOT FOUND');
        const allSheets = spreadsheet.getSheets();
        Logger.log('Available sheets: ' + allSheets.map(s => s.getName()).join(', '));
      }
    } catch (resError) {
      Logger.log('✗✗✗ ERROR in Resources Material fetch: ' + resError.toString());
      Logger.log('Stack: ' + resError.stack);
      // Continue with just ALL IN ONE data
    }

    Logger.log(`Total course materials (ALL IN ONE + Resources Material): ${courseMaterials.length}`);

    // Now build dynamic hierarchical structure
    const availableTerms = [];
    const folderStructure = {};
    
    // First pass: discover all unique terms, domains, and subjects
    const termSet = new Set();
    const termDomainMap = new Map(); // term -> Set of domains
    const domainSubjectMap = new Map(); // "term|domain" -> Set of subjects
    
    courseMaterials.forEach(material => {
      const term = material.term || 'Other Resources';
      const domain = material.domain || 'General';
      const subject = material.subject || 'Miscellaneous';
      
      termSet.add(term);
      
      if (!termDomainMap.has(term)) {
        termDomainMap.set(term, new Set());
      }
      termDomainMap.get(term).add(domain);
      
      const termDomainKey = `${term}|${domain}`;
      if (!domainSubjectMap.has(termDomainKey)) {
        domainSubjectMap.set(termDomainKey, new Set());
      }
      domainSubjectMap.get(termDomainKey).add(subject);
    });
    
    // Sort terms logically (Term 1 before Term 10, alphabetical for text)
    const sortedTerms = Array.from(termSet).sort((a, b) => {
      // Handle "Other Resources" specially - put it last
      if (a === 'Other Resources') return 1;
      if (b === 'Other Resources') return -1;
      
      // Try to extract numbers for smart sorting
      const aMatch = a.match(/(\d+)/);
      const bMatch = b.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        if (aNum !== bNum) return aNum - bNum;
      }
      
      // Fallback to alphabetical
      return a.localeCompare(b);
    });
    
    availableTerms.push(...sortedTerms);
    
    // Second pass: build hierarchical structure and organize materials
    sortedTerms.forEach(term => {
      folderStructure[term] = {
        domains: {}
      };
      
      const domains = Array.from(termDomainMap.get(term)).sort();
      
      domains.forEach(domain => {
        folderStructure[term].domains[domain] = {
          subjects: {}
        };
        
        const termDomainKey = `${term}|${domain}`;
        const subjects = Array.from(domainSubjectMap.get(termDomainKey)).sort();
        
        subjects.forEach(subject => {
          // Filter materials for this specific term/domain/subject combination
          const materialsForSubject = courseMaterials.filter(material => {
            const materialTerm = material.term || 'Other Resources';
            const materialDomain = material.domain || 'General';
            const materialSubject = material.subject || 'Miscellaneous';
            
            return materialTerm === term && 
                   materialDomain === domain && 
                   materialSubject === subject;
          });
          
          // Sort materials by priority (higher first), then by date
          materialsForSubject.sort((a, b) => {
            if (a.priority !== b.priority) {
              return b.priority - a.priority;
            }
            return new Date(b.dateAdded) - new Date(a.dateAdded);
          });
          
          folderStructure[term].domains[domain].subjects[subject] = materialsForSubject;
        });
      });
    });
    
    Logger.log(`Built dynamic folder structure with ${availableTerms.length} terms`);

    // Count materials by source for debugging
    const allInOneCount = courseMaterials.filter(m => m.source === 'ALLINONE').length;
    const resourceMgmtCount = courseMaterials.filter(m => m.source === 'Resource Management').length;

    return {
      success: true,
      data: {
        availableTerms: availableTerms,
        folderStructure: folderStructure,
        flatMaterials: courseMaterials.sort((a, b) => {
          // Sort flat materials by priority first, then by date
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        })
      },
      debug: {
        studentBatch: student.batch,
        totalMaterials: courseMaterials.length,
        allInOneCount: allInOneCount,
        resourceMgmtCount: resourceMgmtCount,
        termCounts: availableTerms.map(term => ({
          term: term,
          count: courseMaterials.filter(m => (m.term || 'Other Resources') === term).length
        }))
      }
    };
    
  } catch (error) {
    Logger.log('Error in getCourseResources: ' + error.message);
    return {
      success: false,
      error: 'Failed to get course resources: ' + error.message
    };
  }
}

/**
 * Determine dashboard type based on name
 * @param {string} name Dashboard name
 * @return {string} Dashboard type
 */
function getDashboardType(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('academic')) return 'academic';
  if (lowerName.includes('assignment')) return 'assignment';
  if (lowerName.includes('attendance')) return 'attendance';
  if (lowerName.includes('mentorship') || lowerName.includes('mentor')) return 'mentorship';
  if (lowerName.includes('placement')) return 'placement';
  return 'general';
}

function uploadProfilePicture(studentEmail, imageData, fileName, mimeType) {
  try {
    Logger.log(`Uploading profile picture for: ${studentEmail}`);
    
    // Validate inputs
    if (!studentEmail || !imageData || !fileName) {
      return {
        success: false,
        error: 'Missing required parameters for profile picture upload'
      };
    }

    // Get or create the main drive folder
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    } catch (error) {
      return {
        success: false,
        error: 'Main drive folder not found. Please check the MAIN_DRIVE_FOLDER_ID.'
      };
    }

    // Get or create the Profile subfolder
    let profileFolder;
    const profileFolders = mainFolder.getFoldersByName('Profile');
    if (profileFolders.hasNext()) {
      profileFolder = profileFolders.next();
    } else {
      profileFolder = mainFolder.createFolder('Profile');
      Logger.log('Created Profile subfolder in main drive folder');
    }

    // Get student's full name for folder creation
    const loginResult = getStudentProfile(studentEmail);
    if (!loginResult.success) {
      return {
        success: false,
        error: 'Student not found in database'
      };
    }
    
    const studentName = loginResult.data.fullName || studentEmail.split('@')[0];
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    
    // Get or create the student's personal folder
    let studentFolder;
    const studentFolders = profileFolder.getFoldersByName(sanitizedName);
    if (studentFolders.hasNext()) {
      studentFolder = studentFolders.next();
    } else {
      studentFolder = profileFolder.createFolder(sanitizedName);
      Logger.log('Created personal folder for student: ' + sanitizedName);
    }

    // Convert base64 to blob
    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(imageData), 
      mimeType, 
      `profile_picture_${Date.now()}.${getFileExtension(mimeType)}`
    );

    // Delete any existing profile picture for this student in their folder
    const existingFiles = studentFolder.getFiles();
    while (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      if (existingFile.getName().startsWith('profile_picture_')) {
        studentFolder.removeFile(existingFile);
        Logger.log('Deleted existing profile picture: ' + existingFile.getName());
      }
    }

    // Step 1: Upload to ImgBB for public display (primary)
    const imgbbResult = uploadToImgBB(imageData, fileName);
    
    let publicImageUrl = null;
    let imgbbUrls = {};
    
    if (imgbbResult.success) {
      publicImageUrl = imgbbResult.data.display_url;
      imgbbUrls = {
        full: imgbbResult.data.url,
        display: imgbbResult.data.display_url,
        thumb: imgbbResult.data.thumb.url,
        medium: imgbbResult.data.medium.url
      };
      Logger.log('ImgBB upload successful: ' + publicImageUrl);
    } else {
      Logger.log('ImgBB upload failed, will use Google Drive as fallback: ' + imgbbResult.error);
    }

    // Step 2: Upload to Google Drive for backup/storage
    const uploadedFile = studentFolder.createFile(imageBlob);
    
    // Set file sharing to viewable by anyone with the link
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get Google Drive URLs (fallback)
    const fileId = uploadedFile.getId();
    const driveUrls = {
      googleusercontent: `https://lh3.googleusercontent.com/d/${fileId}=w400-h400`,
      driveDirect: `https://drive.google.com/uc?export=view&id=${fileId}`,
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`,
      alternative: `https://lh3.googleusercontent.com/d/${fileId}`
    };
    
    // Use ImgBB URL as primary, Google Drive as fallback
    const finalImageUrl = publicImageUrl || driveUrls.googleusercontent;
    
    Logger.log('Profile picture uploaded successfully: ' + uploadedFile.getName());
    Logger.log('Google Drive File ID: ' + fileId);
    Logger.log('Final Image URL (primary): ' + finalImageUrl);
    Logger.log('ImgBB Success: ' + (imgbbResult.success ? 'Yes' : 'No'));

    // Update the student profile in the Student Profile sheet with the final URL
    const updateResult = updateStudentProfilePicture(studentEmail, finalImageUrl);
    if (!updateResult.success) {
      // File was uploaded but profile wasn't updated - log warning but don't fail
      Logger.log('Warning: Profile picture uploaded but sheet update failed: ' + updateResult.error);
    }

    return {
      success: true,
      data: {
        profilePictureUrl: finalImageUrl,
        imgbbUrls: imgbbUrls,
        driveUrls: driveUrls,
        driveFileId: fileId,
        uploadMethod: imgbbResult.success ? 'imgbb' : 'googledrive'
      },
      message: `Profile picture uploaded successfully via ${imgbbResult.success ? 'ImgBB' : 'Google Drive'}`
    };

  } catch (error) {
    Logger.log('Error in uploadProfilePicture: ' + error.message);
    return {
      success: false,
      error: 'Failed to upload profile picture: ' + error.message
    };
  }
}

/**
 * Update student profile picture URL in the Student Profile sheet
 * @param {string} studentEmail - Student's email
 * @param {string} profilePictureUrl - New profile picture URL
 * @return {Object} Update result
 */
function updateStudentProfilePicture(studentEmail, profilePictureUrl) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: false,
        error: 'No student profile data found'
      };
    }

    // Find the student in Student Profile sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studentEmail) {
        // Update profile picture column (column 23, index 22)
        sheet.getRange(i + 1, 23).setValue(profilePictureUrl);
        
        Logger.log('Updated profile picture URL for: ' + studentEmail);
        return {
          success: true,
          message: 'Profile picture URL updated in sheet'
        };
      }
    }

    // If student not found, try to add them from login data with the new profile picture
    const loginResult = getStudentProfile(studentEmail);
    if (loginResult.success) {
      const newRow = [
        studentEmail,
        loginResult.data.fullName || '',
        loginResult.data.rollNo || '',
        loginResult.data.batch || '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // Empty profile fields
        profilePictureUrl // Profile picture URL
      ];
      
      sheet.appendRow(newRow);
      Logger.log('Added new student profile with picture for: ' + studentEmail);
      
      return {
        success: true,
        message: 'New student profile created with profile picture'
      };
    }

    return {
      success: false,
      error: 'Student not found in login database'
    };

  } catch (error) {
    Logger.log('Error in updateStudentProfilePicture: ' + error.message);
    return {
      success: false,
      error: 'Failed to update profile picture in sheet: ' + error.message
    };
  }
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @return {string} File extension
 */
function getFileExtension(mimeType) {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp'
  };
  
  return mimeToExt[mimeType] || 'jpg';
}

/**
 * Parse multipart form data from POST request
 * @param {string} contents - Raw POST data
 * @param {string} boundary - Boundary string
 * @return {Object} Parsed form data
 */
function parseMultipartFormData(contents, boundary) {
  const formData = {};
  
  try {
    const parts = contents.split('--' + boundary);
    
    for (const part of parts) {
      if (part.trim().length === 0 || part === '--') continue;
      
      const lines = part.split('\r\n');
      let fieldName = '';
      let fieldValue = '';
      let isBody = false;
      
      for (const line of lines) {
        if (line.includes('Content-Disposition: form-data;')) {
          const nameMatch = line.match(/name="([^"]+)"/);
          if (nameMatch) {
            fieldName = nameMatch[1];
          }
        } else if (line.trim() === '' && fieldName && !isBody) {
          isBody = true;
        } else if (isBody) {
          fieldValue += line;
        }
      }
      
      if (fieldName && fieldValue) {
        formData[fieldName] = fieldValue.trim();
      }
    }
  } catch (error) {
    Logger.log('Error parsing multipart form data: ' + error.message);
  }
  
  return formData;
}

// Helper Functions

/**
 * Check if content is targeted to a specific student
 * @param {string} targetBatch - Target batch from content
 * @param {string} targetStudents - Target students list from content
 * @param {Object} student - Student profile object
 * @return {boolean} Whether content is targeted to student
 */
function isContentTargetedToStudent(targetBatch, targetStudents, student) {
  // Check batch match
  if (targetBatch !== student.batch) {
    return false;
  }

  // If no specific targeting, it's for all students in the batch
  if (!targetStudents || targetStudents.trim() === '') {
    return true;
  }

  const targetList = targetStudents.split(',').map(t => t.trim().toLowerCase());
  
  // Check if student email is directly targeted
  if (targetList.includes(student.email.toLowerCase())) {
    return true;
  }

  // Check if any of student's options are targeted
  for (const option of student.options) {
    if (targetList.includes(option.toLowerCase())) {
      return true;
    }
  }

  // Check for "ALL STUDENTS" targeting
  const allStudentsPattern = `all students (${student.batch} batch)`.toLowerCase();
  if (targetList.includes(allStudentsPattern)) {
    return true;
  }

  return false;
}

/**
 * Parse datetime string to Date object
 * @param {string} dateTimeValue 
 * @return {Date|null}
 */
function parseDateTime(dateTimeValue) {
  if (!dateTimeValue) return null;

  try {
    // If it's already a Date object, validate and return it
    if (dateTimeValue instanceof Date) {
      // Check if it's a valid date
      if (isNaN(dateTimeValue.getTime())) {
        Logger.log('Invalid Date object received');
        return null;
      }
      return dateTimeValue;
    }

    // Convert to string for parsing
    const dateTimeString = String(dateTimeValue).trim();
    if (!dateTimeString) return null;

    // Check if it's in dd/mm/yyyy hh:mm:ss format (with flexible whitespace)
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
    const match = dateTimeString.match(ddmmyyyyRegex);

    // Also try dd/mm/yyyy hh:mm format (without seconds)
    if (!match) {
      const ddmmyyyyNoSecRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/;
      const matchNoSec = dateTimeString.match(ddmmyyyyNoSecRegex);

      if (matchNoSec) {
        const [, day, month, year, hour, minute] = matchNoSec;
        const parsedDate = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1, // Month is 0-indexed
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10),
          0 // seconds = 0
        );

        // Validate the parsed date
        if (isNaN(parsedDate.getTime())) {
          Logger.log(`Invalid date created from: ${dateTimeString}`);
          return null;
        }

        return parsedDate;
      }
    }

    if (match) {
      const [, day, month, year, hour, minute, second] = match;
      // Create Date object (month is 0-indexed in JavaScript)
      const parsedDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Month is 0-indexed
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10)
      );

      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        Logger.log(`Invalid date created from: ${dateTimeString}`);
        return null;
      }

      return parsedDate;
    }

    // If not in dd/mm/yyyy format, try standard Date parsing
    const standardDate = new Date(dateTimeString);
    if (!isNaN(standardDate.getTime())) {
      return standardDate;
    }

    Logger.log(`Could not parse datetime: ${dateTimeString}`);
    return null;

  } catch (error) {
    Logger.log("Error parsing datetime: " + error.message + " for value: " + dateTimeValue);
    return null;
  }
}

/**
 * Calculate content status based on dates
 * @param {Date} startDateTime 
 * @param {Date} endDateTime 
 * @return {string}
 */
function calculateContentStatus(startDateTime, endDateTime) {
  const now = new Date();
  
  if (!startDateTime || !endDateTime) return "Draft";
  
  if (now < startDateTime) return "Upcoming";
  if (now >= startDateTime && now <= endDateTime) return "Active";
  return "Expired";
}

/**
 * Check acknowledgment status for a content item
 * @param {string} contentId 
 * @param {string} studentEmail 
 * @return {Object} acknowledgment status object
 */
function getAcknowledgmentStatus(contentId, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const ackSheet = ss.getSheetByName(ACKNOWLEDGEMENT_SHEET);
    
    if (!ackSheet) {
      Logger.log('Acknowledgement sheet not found');
      return { isAcknowledged: false, acknowledgmentTimestamp: null };
    }
    
    const ackData = ackSheet.getDataRange().getValues();
    const headers = ackData[0];
    
    // Find column indices
    const idIndex = headers.indexOf('S.ID');
    const emailIndex = headers.indexOf('Student Email');
    const timestampIndex = headers.indexOf('Timestamp');
    
    if (idIndex === -1 || emailIndex === -1) {
      Logger.log('Required columns not found in acknowledgement sheet');
      return { isAcknowledged: false, acknowledgmentTimestamp: null };
    }
    
    // Check if acknowledgment exists
    for (let i = 1; i < ackData.length; i++) {
      const row = ackData[i];
      if (row[idIndex] === contentId && row[emailIndex] === studentEmail) {
        return {
          isAcknowledged: true,
          acknowledgmentTimestamp: timestampIndex >= 0 ? row[timestampIndex] : null
        };
      }
    }
    
    return { isAcknowledged: false, acknowledgmentTimestamp: null };
  } catch (error) {
    Logger.log('Error checking acknowledgment status: ' + error.message);
    return { isAcknowledged: false, acknowledgmentTimestamp: null };
  }
}

/**
 * Get column indices mapping for new ALLINONE structure
 * @param {Array} headers Array of header names
 * @return {Object} Column indices mapping
 */
function getColumnIndices(headers) {
  const indices = {};
  const mapping = {
    // STATIC CORE (Common for all categories)
    "S.ID": "id",
    "ID": "id", // Events & Announcements Management sheet
    "S.Category": "category",
    "Category Type": "category", // Events & Announcements Management sheet
    "S.Event Type": "eventType",
    "Event Subtype": "eventType", // Events & Announcements Management sheet
    "S.Publish": "publish",
    "Publish": "publish", // Events & Announcements Management sheet
    "S.Title": "title",
    "Title": "title", // Events & Announcements Management sheet
    "S.SubTitle": "subTitle",
    "Subtitle": "subTitle", // Events & Announcements Management sheet
    "S.Content": "content",
    "Description": "content", // Events & Announcements Management sheet
    "S.Posted By": "postedBy",
    "Posted By": "postedBy", // Events & Announcements Management sheet
    "S.Created at": "createdAt",
    "Created at": "createdAt", // Events & Announcements Management sheet
    "S.Edited at": "editedAt",
    "Edited at": "editedAt", // Events & Announcements Management sheet
    "S.Edited by": "editedBy",
    "Edited by": "editedBy", // Events & Announcements Management sheet
    "S.StartDateTime": "startDateTime",
    "StartDateTime": "startDateTime", // Events & Announcements Management sheet
    "S.EndDateTime": "endDateTime",
    "EndDateTime": "endDateTime", // Events & Announcements Management sheet
    "S.Status": "status",
    "Status": "status", // Events & Announcements Management sheet
    "S.Target Batch": "targetBatch",
    "Target Batch": "targetBatch", // Events & Announcements Management sheet
    "Show Other Batches": "showOtherBatches", // Events & Announcements Management sheet
    "S.TERM": "term",
    "S.Domain": "domain",
    "S.Subject": "subject",
    "S.Groups": "groups",
    "S.Students": "targetStudents",
    "S.Priority": "priority",
    "Priority": "priority", // Events & Announcements Management sheet
    "S.File URL": "fileURL",
    "S.Drive Link": "driveLink",
    "S.Fileupload Link": "fileuploadLink",
    "S.SheetsLink": "sheetsLink",
    "S.Acknowledge": "requireAcknowledgment",
    
    // CATEGORY-SPECIFIC COLUMNS
    
    // DASHBOARDS
    "D.Dashboard Name": "dashboardName",
    "D.Dashboard Link": "dashboardLink",
    "D.Description": "dashboardDescription",
    "D.Sop": "dashboardSop",
    "D.Visibility": "dashboardVisibility",
    
    // COURSE MATERIAL
    "C.Learning Objectives": "learningObjectives",
    "C.Prerequisites": "prerequisites",
    
    // ASSIGNMENTS & TASKS
    "AT.Instructions": "instructions",
    "AT.Max Points": "maxPoints",
    "AT.Submission Guidelines": "submissionGuidelines",
    "AT.Rubric Link": "rubricLink",
    "AT.Group Size": "groupSize",
    
    // ANNOUNCEMENTS
    "AN.Message Details": "messageDetails",
    "AN.Call to Action": "callToAction",
    "AN.Read Tracking": "readTracking",
    
    // POLICY & DOCUMENTS
    "PD.Type": "policyType",
    "PD.Policy Name": "policyName",
    "PD.Content": "policyContent",
    
    // EVENTS
    "E.Title": "eventTitle",
    "E.Location/Link": "eventLocation",
    "Event Location/Link": "eventLocation", // Events & Announcements Management sheet
    "E.Agenda": "eventAgenda",
    "Event Agenda": "eventAgenda", // Events & Announcements Management sheet
    "E.Speaker Info (if any)": "speakerInfo",
    "Speaker Info": "speakerInfo", // Events & Announcements Management sheet
    "Announcement Subtype": "announcementType", // Events & Announcements Management sheet
    "Display in Calendar": "displayInCalendar", // Events & Announcements Management sheet
    "Requires Acknowledgement": "requiresAcknowledgement", // Events & Announcements Management sheet
    "Registration Required": "registrationRequired", // Events & Announcements Management sheet
    "Registration Link": "registrationLink", // Events & Announcements Management sheet
    "Max Attendees": "maxAttendees", // Events & Announcements Management sheet
    "Cover Image URL": "coverImageUrl", // Events & Announcements Management sheet
    
    // FORMS
    "F.Description": "formDescription",
    "F.Form Link": "formLink"
  };
  
  headers.forEach((header, index) => {
    if (header && mapping[header]) {
      indices[mapping[header]] = index;
    }
  });
  
  return indices;
}

/**
 * Get value from row by index
 * @param {Array} row 
 * @param {number} index 
 * @return {string}
 */
function getValue(row, index) {
  if (index === undefined || index === null || index < 0 || index >= row.length) {
    return "";
  }
  
  const value = row[index];
  if (value === null || value === undefined) {
    return "";
  }
  
  return value.toString();
}

/**
 * Format datetime for display
 * @param {*} dateValue 
 * @return {string}
 */
function formatDisplayDateTime(dateValue) {
  if (!dateValue) return "";
  
  try {
    let date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return dateValue.toString();
    }
    
    return Utilities.formatDate(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
  } catch (error) {
    Logger.log("Error formatting date: " + error.message);
    return dateValue.toString();
  }
}

/**
 * Extract file name from URL
 * @param {string} url 
 * @return {string}
 */
function extractFileNameFromUrl(url) {
  try {
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      return 'Google Drive File';
    }
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    return fileName || 'File Link';
  } catch (error) {
    return 'File Link';
  }
}

/**
 * Trigger Firebase notification for real-time updates
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 */
function triggerFirebaseNotification(type, data) {
  try {
    // Only trigger if Firebase webhook URL is configured
    if (!FIREBASE_WEBHOOK_URL || FIREBASE_WEBHOOK_URL === 'https://your-firebase-project.firebaseapp.com/api/webhook') {
      Logger.log('Firebase webhook not configured, skipping notification');
      return;
    }

    const payload = {
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    };

    const options = {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(FIREBASE_WEBHOOK_URL, options);
    Logger.log('Firebase notification sent: ' + response.getContentText());

  } catch (error) {
    Logger.log('Error sending Firebase notification: ' + error.message);
    // Don't fail the main operation if notification fails
  }
}

/**
 * ADMIN FUNCTION: Trigger notification when new content is created
 * Call this from your admin script after saving content
 * @param {Object} contentData - Content that was created/updated
 */
function notifyStudentsOfNewContent(contentData) {
  try {
    Logger.log('Notifying students of new content: ' + contentData.id);
    
    // Get all students who should receive this content
    const targetedStudents = getTargetedStudents(contentData.targetBatch, contentData.targetStudents);
    
    // Trigger Firebase notification
    triggerFirebaseNotification('new_content', {
      contentId: contentData.id,
      title: contentData.title,
      category: contentData.category,
      eventType: contentData.eventType,
      priority: contentData.priority,
      targetedStudents: targetedStudents,
      requiresAcknowledgment: contentData.requireAcknowledgment,
      deadline: contentData.endDateTime
    });

    Logger.log(`Notification sent for content ${contentData.id} to ${targetedStudents.length} students`);

  } catch (error) {
    Logger.log('Error in notifyStudentsOfNewContent: ' + error.message);
  }
}

/**
 * Get list of students targeted by content
 * @param {string} targetBatch - Target batch
 * @param {string} targetStudents - Target students string
 * @return {Array} Array of student emails
 */
function getTargetedStudents(targetBatch, targetStudents) {
  try {
    const studentSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENT_DATA_SHEET);
    const studentData = studentSheet.getDataRange().getValues();
    const targetedEmails = [];

    // If no specific targeting, return all students in batch
    if (!targetStudents || targetStudents.trim() === '') {
      for (let i = 1; i < studentData.length; i++) {
        const email = studentData[i][0];
        const batch = studentData[i][3];
        
        if (batch === targetBatch && email) {
          targetedEmails.push(email);
        }
      }
      return targetedEmails;
    }

    // Parse target list
    const targetList = targetStudents.split(',').map(t => t.trim());

    // Check each student
    for (let i = 1; i < studentData.length; i++) {
      const email = studentData[i][0];
      const batch = studentData[i][3];
      
      if (batch === targetBatch && email) {
        const student = {
          email: email,
          batch: batch,
          options: []
        };

        // Get student options
        const headers = studentData[0];
        for (let j = 4; j < headers.length; j++) {
          const header = headers[j];
          const value = studentData[i][j];
          
          if (header && header.toLowerCase().startsWith('options') && value) {
            student.options.push(value.toString().trim());
          }
        }

        // Check if student is targeted
        if (isContentTargetedToStudent(targetBatch, targetStudents, student)) {
          targetedEmails.push(email);
        }
      }
    }

    return targetedEmails;

  } catch (error) {
    Logger.log('Error in getTargetedStudents: ' + error.message);
    return [];
  }
}


// SSB STUDENT PORTAL BACKEND - Additional Functions (Part 2)
// Add these functions to your Student Portal GAS project

/**
 * DEADLINE REMINDER SYSTEM
 * Set up time-driven triggers to send deadline reminders
 */

/**
 * Setup automatic deadline reminders
 * Run this once to create the triggers
 */
function setupDeadlineReminders() {
  try {
    // Delete existing triggers first
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'checkAndSendDeadlineReminders') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create new trigger to run every 4 hours
    ScriptApp.newTrigger('checkAndSendDeadlineReminders')
      .timeBased()
      .everyHours(4)
      .create();

    Logger.log('Deadline reminder trigger setup successfully');
    return { success: true, message: 'Deadline reminders setup successfully' };

  } catch (error) {
    Logger.log('Error setting up deadline reminders: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check for upcoming deadlines and send notifications
 * This runs automatically via trigger
 */
function checkAndSendDeadlineReminders() {
  try {
    Logger.log('Checking for deadline reminders...');
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return;

    const headers = data[0];
    const indices = getColumnIndices(headers);
    const now = new Date();
    const reminderSent = [];

    // Check each content item
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const contentId = getValue(row, indices.id);
      const title = getValue(row, indices.title);
      const endDateTime = parseDateTime(getValue(row, indices.endDateTime));
      const targetBatch = getValue(row, indices.targetBatch);
      const targetStudents = getValue(row, indices.targetStudents);
      const priority = getValue(row, indices.priority);
      
      if (!endDateTime) continue;

      // Calculate hours until deadline
      const hoursUntilDeadline = (endDateTime - now) / (1000 * 60 * 60);
      
      // Send reminder if deadline is within 24 hours and content is still active
      if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
        const currentStatus = calculateContentStatus(
          parseDateTime(getValue(row, indices.startDateTime)), 
          endDateTime
        );
        
        if (currentStatus === 'Active') {
          // Get targeted students
          const targetedStudents = getTargetedStudents(targetBatch, targetStudents);
          
          if (targetedStudents.length > 0) {
            // Send Firebase notification for deadline reminder
            triggerFirebaseNotification('deadline_reminder', {
              contentId: contentId,
              title: title,
              priority: priority,
              hoursRemaining: Math.ceil(hoursUntilDeadline),
              deadline: endDateTime.toISOString(),
              targetedStudents: targetedStudents
            });

            reminderSent.push({
              contentId: contentId,
              title: title,
              studentsCount: targetedStudents.length,
              hoursRemaining: Math.ceil(hoursUntilDeadline)
            });
          }
        }
      }
    }

    Logger.log(`Deadline reminders sent for ${reminderSent.length} content items`);
    return { success: true, remindersSent: reminderSent };

  } catch (error) {
    Logger.log('Error in checkAndSendDeadlineReminders: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * BULK OPERATIONS FOR STUDENTS
 */

/**
 * Get content summary for multiple students (for admin analytics)
 * @param {Array} studentEmails - Array of student emails
 * @return {Object} Summary data
 */
function getBulkStudentSummary(studentEmails) {
  try {
    const summary = {
      totalStudents: studentEmails.length,
      studentsWithContent: 0,
      contentStats: {
        total: 0,
        active: 0,
        upcoming: 0,
        expired: 0,
        requiresAck: 0
      },
      acknowledgmentStats: {
        totalRequired: 0,
        completed: 0,
        pending: 0
      }
    };

    const studentSummaries = [];

    studentEmails.forEach(email => {
      const dashboard = getStudentDashboard(email);
      if (dashboard.success && dashboard.data.content.length > 0) {
        summary.studentsWithContent++;
        summary.contentStats.total += dashboard.data.stats.total;
        summary.contentStats.active += dashboard.data.stats.active;
        summary.contentStats.upcoming += dashboard.data.stats.upcoming;
        summary.contentStats.requiresAck += dashboard.data.stats.requiresAck;

        studentSummaries.push({
          email: email,
          name: dashboard.data.student.fullName,
          batch: dashboard.data.student.batch,
          contentCount: dashboard.data.stats.total,
          acknowledgementsRequired: dashboard.data.stats.requiresAck
        });
      }
    });

    return {
      success: true,
      data: {
        summary: summary,
        studentDetails: studentSummaries
      }
    };

  } catch (error) {
    Logger.log('Error in getBulkStudentSummary: ' + error.message);
    return {
      success: false,
      error: 'Failed to get bulk summary: ' + error.message
    };
  }
}

/**
 * CONTENT ANALYTICS FOR STUDENTS
 */

/**
 * Get student engagement analytics
 * @param {string} studentEmail - Student's email
 * @return {Object} Analytics data
 */
function getStudentAnalytics(studentEmail) {
  try {
    const dashboard = getStudentDashboard(studentEmail);
    if (!dashboard.success) {
      return dashboard;
    }

    const content = dashboard.data.content;
    const now = new Date();
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalContent: content.length,
        activeContent: content.filter(c => c.status === 'Active').length,
        upcomingContent: content.filter(c => c.status === 'Upcoming').length,
        expiredContent: content.filter(c => c.status === 'Expired').length
      },
      
      byCategory: {},
      byEventType: {},
      byPriority: {
        High: content.filter(c => c.priority === 'High').length,
        Medium: content.filter(c => c.priority === 'Medium').length,
        Low: content.filter(c => c.priority === 'Low').length
      },
      
      acknowledgments: {
        required: content.filter(c => c.requiresAcknowledgment).length,
        // Note: Tracking actual acknowledgment completion would require additional logic
      },
      
      upcomingDeadlines: content
        .filter(c => {
          const deadline = new Date(c.endDateTime);
          const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
          return daysUntil > 0 && daysUntil <= 7;
        })
        .sort((a, b) => new Date(a.endDateTime) - new Date(b.endDateTime)),
      
      recentActivity: content
        .filter(c => {
          const created = new Date(c.createdAt);
          const daysAgo = (now - created) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };

    // Calculate category breakdown
    content.forEach(item => {
      analytics.byCategory[item.category] = (analytics.byCategory[item.category] || 0) + 1;
      analytics.byEventType[item.eventType] = (analytics.byEventType[item.eventType] || 0) + 1;
    });

    return {
      success: true,
      data: analytics
    };

  } catch (error) {
    Logger.log('Error in getStudentAnalytics: ' + error.message);
    return {
      success: false,
      error: 'Failed to get analytics: ' + error.message
    };
  }
}

/**
 * ADVANCED CONTENT FILTERING
 */

/**
 * Get filtered content for student with advanced options
 * @param {string} studentEmail - Student's email
 * @param {Object} filters - Filter options
 * @return {Object} Filtered content
 */
function getFilteredStudentContent(studentEmail, filters = {}) {
  try {
    const dashboard = getStudentDashboard(studentEmail);
    if (!dashboard.success) {
      return dashboard;
    }

    let content = dashboard.data.content;

    // Apply filters
    if (filters.category) {
      content = content.filter(item => item.category === filters.category);
    }

    if (filters.eventType) {
      content = content.filter(item => item.eventType === filters.eventType);
    }

    if (filters.status) {
      content = content.filter(item => item.status === filters.status);
    }

    if (filters.priority) {
      content = content.filter(item => item.priority === filters.priority);
    }

    if (filters.requiresAcknowledgment !== undefined) {
      content = content.filter(item => item.requiresAcknowledgment === filters.requiresAcknowledgment);
    }

    if (filters.hasFiles !== undefined) {
      content = content.filter(item => item.hasFiles === filters.hasFiles);
    }

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      content = content.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      content = content.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.subTitle.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.eventType.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortField = filters.sortBy;
      const sortOrder = filters.sortOrder || 'desc';
      
      content.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle date sorting
        if (sortField.includes('DateTime') || sortField === 'createdAt') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply pagination
    if (filters.page && filters.pageSize) {
      const startIndex = (filters.page - 1) * filters.pageSize;
      const endIndex = startIndex + filters.pageSize;
      content = content.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: {
        content: content,
        totalCount: dashboard.data.content.length,
        filteredCount: content.length,
        filters: filters
      }
    };

  } catch (error) {
    Logger.log('Error in getFilteredStudentContent: ' + error.message);
    return {
      success: false,
      error: 'Failed to filter content: ' + error.message
    };
  }
}

/**
 * NOTIFICATION PREFERENCES (Future Enhancement)
 */

/**
 * Get student notification preferences
 * @param {string} studentEmail - Student's email
 * @return {Object} Notification preferences
 */
function getNotificationPreferences(studentEmail) {
  try {
    // For now, return default preferences
    // In future, this could be stored in a separate sheet
    const defaultPreferences = {
      email: studentEmail,
      preferences: {
        newContent: true,
        deadlineReminders: true,
        acknowledgmentRequests: true,
        weeklyDigest: false,
        pushNotifications: true,
        emailNotifications: false
      },
      reminderTiming: {
        deadlineHours: [24, 6], // Remind 24h and 6h before deadline
        dailyDigestTime: '09:00' // 9 AM IST
      }
    };

    return {
      success: true,
      data: defaultPreferences
    };

  } catch (error) {
    Logger.log('Error in getNotificationPreferences: ' + error.message);
    return {
      success: false,
      error: 'Failed to get notification preferences: ' + error.message
    };
  }
}

/**
 * Update student notification preferences
 * @param {string} studentEmail - Student's email
 * @param {Object} preferences - New preferences
 * @return {Object} Update result
 */
function updateNotificationPreferences(studentEmail, preferences) {
  try {
    // For now, just log the preferences
    // In future, save to a preferences sheet
    Logger.log(`Updating preferences for ${studentEmail}: ${JSON.stringify(preferences)}`);

    return {
      success: true,
      message: 'Notification preferences updated successfully'
    };

  } catch (error) {
    Logger.log('Error in updateNotificationPreferences: ' + error.message);
    return {
      success: false,
      error: 'Failed to update preferences: ' + error.message
    };
  }
}

/**
 * INTEGRATION HELPERS
 */

/**
 * Get API health status and configuration
 * @return {Object} Health status
 */
function getAPIHealth() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        googleSheets: 'connected',
        firebase: FIREBASE_WEBHOOK_URL !== 'https://your-firebase-project.firebaseapp.com/api/webhook' ? 'configured' : 'not_configured',
        triggers: ScriptApp.getProjectTriggers().length > 0 ? 'active' : 'inactive'
      },
      configuration: {
        sheetId: SHEET_ID ? 'configured' : 'missing',
        timezone: TIMEZONE,
        webAppUrl: ScriptApp.getService().getUrl()
      }
    };

    // Test sheet access
    try {
      const sheet = SpreadsheetApp.openById(SHEET_ID);
      const mainSheet = sheet.getSheetByName(MAIN_SHEET);
      health.services.googleSheets = 'connected';
      health.dataInfo = {
        totalContentItems: mainSheet.getLastRow() - 1, // Subtract header row
        lastUpdated: new Date().toISOString()
      };
    } catch (sheetError) {
      health.services.googleSheets = 'error: ' + sheetError.message;
      health.status = 'degraded';
    }

    return {
      success: true,
      data: health
    };

  } catch (error) {
    return {
      success: false,
      error: 'Health check failed: ' + error.message,
      status: 'unhealthy'
    };
  }
}

/**
 * Get available categories and event types for frontend dropdowns
 * @return {Object} Categories and types
 */
function getAvailableFilters() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 2) {
      return {
        success: true,
        data: {
          categories: [],
          eventTypes: [],
          priorities: ['High', 'Medium', 'Low'],
          statuses: ['Active', 'Upcoming', 'Expired']
        }
      };
    }

    // Headers are in row 2 (index 1), data starts from row 3 (index 2)
    const headers = data[1];
    const indices = getColumnIndices(headers);
    
    const categories = new Set();
    const eventTypes = new Set();

    // Collect unique values from all content (start from row 3 = index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const category = getValue(row, indices.category);
      const eventType = getValue(row, indices.eventType);
      
      if (category) categories.add(category);
      if (eventType) eventTypes.add(eventType);
    }

    return {
      success: true,
      data: {
        categories: Array.from(categories).sort(),
        eventTypes: Array.from(eventTypes).sort(),
        priorities: ['High', 'Medium', 'Low'],
        statuses: ['Active', 'Upcoming', 'Expired']
      }
    };

  } catch (error) {
    Logger.log('Error in getAvailableFilters: ' + error.message);
    return {
      success: false,
      error: 'Failed to get available filters: ' + error.message
    };
  }
}

/**
 * ADMIN INTEGRATION FUNCTIONS
 * These functions should be called from your admin script
 */

/**
 * Notify students when content is updated (call from admin script)
 * @param {string} contentId - Content ID that was updated
 * @param {Object} changes - What was changed
 */
function notifyStudentsOfContentUpdate(contentId, changes) {
  try {
    Logger.log('Notifying students of content update: ' + contentId);
    
    // Get content details
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const indices = getColumnIndices(headers);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][indices.id] === contentId) {
        const row = data[i];
        const targetBatch = getValue(row, indices.targetBatch);
        const targetStudents = getValue(row, indices.targetStudents);
        const title = getValue(row, indices.title);
        
        const targetedStudents = getTargetedStudents(targetBatch, targetStudents);
        
        triggerFirebaseNotification('content_updated', {
          contentId: contentId,
          title: title,
          changes: changes,
          targetedStudents: targetedStudents
        });
        
        Logger.log(`Update notification sent for content ${contentId} to ${targetedStudents.length} students`);
        break;
      }
    }

  } catch (error) {
    Logger.log('Error in notifyStudentsOfContentUpdate: ' + error.message);
  }
}

/**
 * Get content interaction summary for admin dashboard
 * @param {string} contentId - Content ID
 * @return {Object} Interaction summary
 */
function getContentInteractionSummary(contentId) {
  try {
    // Get content details
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MAIN_SHEET);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const indices = getColumnIndices(headers);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][indices.id] === contentId) {
        const row = data[i];
        const targetBatch = getValue(row, indices.targetBatch);
        const targetStudents = getValue(row, indices.targetStudents);
        const requiresAck = getValue(row, indices.requireAcknowledgment) === 'Yes';
        const sheetsLink = getValue(row, indices.sheetsLink);
        
        const targetedStudents = getTargetedStudents(targetBatch, targetStudents);
        
        const summary = {
          contentId: contentId,
          targetedStudentsCount: targetedStudents.length,
          requiresAcknowledgment: requiresAck,
          acknowledgmentStats: {
            total: 0,
            completed: 0,
            pending: 0
          }
        };

        // If requires acknowledgment, get stats from the acknowledgment sheet
        if (requiresAck && sheetsLink) {
          try {
            const sheetIdMatch = sheetsLink.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (sheetIdMatch) {
              const ackSheetId = sheetIdMatch[1];
              const ackSheet = SpreadsheetApp.openById(ackSheetId).getActiveSheet();
              const ackData = ackSheet.getDataRange().getValues();
              
              summary.acknowledgmentStats.total = targetedStudents.length;
              summary.acknowledgmentStats.completed = ackData.length - 1; // Subtract header
              summary.acknowledgmentStats.pending = summary.acknowledgmentStats.total - summary.acknowledgmentStats.completed;
            }
          } catch (ackError) {
            Logger.log('Error getting acknowledgment stats: ' + ackError.message);
          }
        }

        return {
          success: true,
          data: summary
        };
      }
    }

    return {
      success: false,
      error: 'Content not found'
    };

  } catch (error) {
    Logger.log('Error in getContentInteractionSummary: ' + error.message);
    return {
      success: false,
      error: 'Failed to get interaction summary: ' + error.message
    };
  }
}

/**
 * STUDENTS CORNER FUNCTIONS
 * 
 * These functions handle all Students Corner functionality including:
 * - Activity creation (posts, forums, events, skills)
 * - Activity retrieval with filtering
 * - Leaderboard and points system
 * - Dashboard overview
 */

/**
 * Get Students Corner activity with optional filtering
 * @param {string} studentEmail - Student's email address
 * @param {string} activityType - Optional filter by type (POST, FORUM, EVENT, SKILL_OFFER, SKILL_REQUEST)
 * @param {number} limit - Optional limit on number of activities returned
 * @return {Object} Activity data
 */
function getStudentsCornerActivity(studentEmail, activityType, limit) {
  try {
    Logger.log('Getting Students Corner activity for: ' + studentEmail);
    
    // Get student profile to determine batch and access
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }
    
    const student = studentProfile.data;
    
    // Get or create Students Corner sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(STUDENTS_CORNER_SHEET);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(STUDENTS_CORNER_SHEET);
      // Add headers
      const headers = [
        'S.ID', 'S.Type', 'S.Student Email', 'S.Full Name', 'S.Batch', 
        'S.Timestamp', 'S.Status', 'S.Points', 'S.Title', 'S.Content', 
        'S.Target Batch', 'S.Category', 'S.Metadata'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        data: []
      };
    }
    
    const headers = data[0];
    const activities = [];
    
    // Column mappings
    const colMap = {
      id: headers.indexOf('S.ID'),
      type: headers.indexOf('S.Type'),
      studentEmail: headers.indexOf('S.Student Email'),
      fullName: headers.indexOf('S.Full Name'),
      batch: headers.indexOf('S.Batch'),
      timestamp: headers.indexOf('S.Timestamp'),
      status: headers.indexOf('S.Status'),
      points: headers.indexOf('S.Points'),
      title: headers.indexOf('S.Title'),
      content: headers.indexOf('S.Content'),
      targetBatch: headers.indexOf('S.Target Batch'),
      category: headers.indexOf('S.Category'),
      metadata: headers.indexOf('S.Metadata')
    };
    
    // Process activities
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Check if activity is targeted to student's batch or is public
      const targetBatch = row[colMap.targetBatch] || '';
      const isTargeted = !targetBatch || 
                        targetBatch === 'All' || 
                        targetBatch.includes(student.batch);
      
      if (!isTargeted) continue;
      
      // Check status filter (only show active activities)
      if (row[colMap.status] !== 'Active') continue;
      
      // Check activity type filter
      if (activityType && row[colMap.type] !== activityType) continue;
      
      const activity = {
        id: row[colMap.id] || '',
        type: row[colMap.type] || '',
        studentEmail: row[colMap.studentEmail] || '',
        fullName: row[colMap.fullName] || '',
        batch: row[colMap.batch] || '',
        timestamp: formatDisplayDateTime(row[colMap.timestamp]),
        status: row[colMap.status] || '',
        points: parseInt(row[colMap.points]) || 0,
        title: row[colMap.title] || '',
        content: row[colMap.content] || '',
        targetBatch: row[colMap.targetBatch] || '',
        category: row[colMap.category] || '',
        metadata: row[colMap.metadata] || '{}'
      };
      
      activities.push(activity);
    }
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit if specified
    const limitedActivities = limit ? activities.slice(0, parseInt(limit)) : activities;
    
    return {
      success: true,
      data: limitedActivities
    };
    
  } catch (error) {
    Logger.log('Error in getStudentsCornerActivity: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Students Corner activity: ' + error.message
    };
  }
}

/**
 * Create a new Students Corner post/activity
 * @param {string} studentEmail - Student's email address
 * @param {string} type - Activity type (POST, FORUM, EVENT, SKILL_OFFER, SKILL_REQUEST)
 * @param {string} title - Activity title
 * @param {string} content - Activity content/description
 * @param {string} targetBatch - Target batch (optional, defaults to student's batch)
 * @param {string} category - Category/tag for the activity
 * @param {string} metadata - JSON string with additional metadata
 * @return {Object} Creation result
 */
function createStudentsCornerPost(studentEmail, type, title, content, targetBatch, category, metadata) {
  try {
    Logger.log('Creating Students Corner post for: ' + studentEmail);
    
    // Get student profile
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }
    
    const student = studentProfile.data;
    
    // Validate required fields
    if (!type || !title || !content) {
      return {
        success: false,
        error: 'Missing required fields: type, title, content'
      };
    }
    
    // Validate activity type
    const validTypes = ['POST', 'FORUM', 'EVENT', 'SKILL_OFFER', 'SKILL_REQUEST'];
    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: 'Invalid activity type. Must be one of: ' + validTypes.join(', ')
      };
    }
    
    // Get or create Students Corner sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(STUDENTS_CORNER_SHEET);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(STUDENTS_CORNER_SHEET);
      // Add headers
      const headers = [
        'S.ID', 'S.Type', 'S.Student Email', 'S.Full Name', 'S.Batch', 
        'S.Timestamp', 'S.Status', 'S.Points', 'S.Title', 'S.Content', 
        'S.Target Batch', 'S.Category', 'S.Metadata'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Generate unique ID
    const timestamp = new Date();
    const activityId = 'SC_' + timestamp.getTime() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Calculate points based on activity type
    const pointsMap = {
      'POST': 10,
      'FORUM': 5,
      'EVENT': 25,
      'SKILL_OFFER': 15,
      'SKILL_REQUEST': 10
    };
    const points = pointsMap[type] || 5;
    
    // Set default target batch if not specified
    const finalTargetBatch = targetBatch || student.batch;
    
    // Create new row data
    const newRow = [
      activityId,
      type,
      studentEmail,
      student.fullName,
      student.batch,
      Utilities.formatDate(timestamp, TIMEZONE, "dd/MM/yyyy HH:mm:ss"),
      'Active',
      points,
      title,
      content,
      finalTargetBatch,
      category || 'General',
      metadata || '{}'
    ];
    
    // Add to sheet
    sheet.appendRow(newRow);
    
    Logger.log('Students Corner activity created with ID: ' + activityId);
    
    return {
      success: true,
      data: {
        id: activityId,
        type: type,
        title: title,
        points: points,
        message: 'Activity created successfully'
      }
    };
    
  } catch (error) {
    Logger.log('Error in createStudentsCornerPost: ' + error.message);
    return {
      success: false,
      error: 'Failed to create Students Corner post: ' + error.message
    };
  }
}

/**
 * Get Students Corner leaderboard
 * @param {string} studentEmail - Student's email address  
 * @param {string} timeframe - Optional timeframe filter (week, month, all)
 * @return {Object} Leaderboard data
 */
function getStudentsCornerLeaderboard(studentEmail, timeframe) {
  try {
    Logger.log('Getting Students Corner leaderboard for: ' + studentEmail);
    
    // Get student profile to determine batch
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }
    
    const student = studentProfile.data;
    
    // Get Students Corner sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(STUDENTS_CORNER_SHEET);
    
    if (!sheet) {
      return {
        success: true,
        data: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        data: []
      };
    }
    
    const headers = data[0];
    const studentPoints = new Map();
    
    // Column mappings
    const colMap = {
      studentEmail: headers.indexOf('S.Student Email'),
      fullName: headers.indexOf('S.Full Name'),
      batch: headers.indexOf('S.Batch'),
      timestamp: headers.indexOf('S.Timestamp'),
      status: headers.indexOf('S.Status'),
      points: headers.indexOf('S.Points')
    };
    
    // Calculate timeframe cutoff
    let cutoffDate = null;
    if (timeframe === 'week') {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (timeframe === 'month') {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }
    
    // Aggregate points by student
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Only count active activities
      if (row[colMap.status] !== 'Active') continue;
      
      // Apply timeframe filter if specified
      if (cutoffDate) {
        const activityDate = new Date(row[colMap.timestamp]);
        if (activityDate < cutoffDate) continue;
      }
      
      const email = row[colMap.studentEmail];
      const fullName = row[colMap.fullName];
      const batch = row[colMap.batch];
      const points = parseInt(row[colMap.points]) || 0;
      
      if (!studentPoints.has(email)) {
        studentPoints.set(email, {
          studentEmail: email,
          fullName: fullName,
          batch: batch,
          totalPoints: 0,
          recentActivity: 0
        });
      }
      
      const studentData = studentPoints.get(email);
      studentData.totalPoints += points;
      studentData.recentActivity += 1;
    }
    
    // Add engagement points for each student
    for (const [email, studentData] of studentPoints) {
      const engagementPoints = getStudentEngagementPoints(email);
      studentData.totalPoints += engagementPoints;
    }
    
    // Convert to array and sort by points
    const leaderboard = Array.from(studentPoints.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    
    // Limit to top 20 for performance
    const topLeaderboard = leaderboard.slice(0, 20);
    
    return {
      success: true,
      data: topLeaderboard
    };
    
  } catch (error) {
    Logger.log('Error in getStudentsCornerLeaderboard: ' + error.message);
    return {
      success: false,
      error: 'Failed to get leaderboard: ' + error.message
    };
  }
}

/**
 * Update activity status (for moderation)
 * @param {string} activityId - Activity ID to update
 * @param {string} status - New status (Active, Archived, Flagged, Pending)
 * @param {string} studentEmail - Email of student making the request
 * @return {Object} Update result
 */
function updateActivityStatus(activityId, status, studentEmail) {
  try {
    Logger.log('Updating activity status: ' + activityId + ' to ' + status);
    
    // Validate status
    const validStatuses = ['Active', 'Archived', 'Flagged', 'Pending'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      };
    }
    
    // Get Students Corner sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(STUDENTS_CORNER_SHEET);
    
    if (!sheet) {
      return {
        success: false,
        error: 'Students Corner sheet not found'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const colMap = {
      id: headers.indexOf('S.ID'),
      status: headers.indexOf('S.Status'),
      studentEmail: headers.indexOf('S.Student Email')
    };
    
    // Find the activity
    for (let i = 1; i < data.length; i++) {
      if (data[i][colMap.id] === activityId) {
        // Check if user owns this activity (basic permission check)
        const activityOwner = data[i][colMap.studentEmail];
        if (activityOwner !== studentEmail) {
          return {
            success: false,
            error: 'You can only modify your own activities'
          };
        }
        
        // Update status
        sheet.getRange(i + 1, colMap.status + 1).setValue(status);
        
        return {
          success: true,
          data: {
            id: activityId,
            newStatus: status,
            message: 'Activity status updated successfully'
          }
        };
      }
    }
    
    return {
      success: false,
      error: 'Activity not found'
    };
    
  } catch (error) {
    Logger.log('Error in updateActivityStatus: ' + error.message);
    return {
      success: false,
      error: 'Failed to update activity status: ' + error.message
    };
  }
}

/**
 * Get Students Corner dashboard overview
 * @param {string} studentEmail - Student's email address
 * @return {Object} Dashboard data with stats and recent activity
 */
function getStudentsCornerDashboard(studentEmail) {
  try {
    Logger.log('Getting Students Corner dashboard for: ' + studentEmail);
    
    // Get student profile
    const studentProfile = getStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return studentProfile;
    }
    
    const student = studentProfile.data;
    
    // Get recent activity (last 10 items)
    const recentActivity = getStudentsCornerActivity(studentEmail, null, 10);
    if (!recentActivity.success) {
      return recentActivity;
    }
    
    // Get leaderboard data
    const leaderboard = getStudentsCornerLeaderboard(studentEmail);
    if (!leaderboard.success) {
      return leaderboard;
    }
    
    // Calculate stats
    const allActivity = getStudentsCornerActivity(studentEmail);
    const activities = allActivity.success ? allActivity.data : [];
    
    // Calculate total points including engagement points
    const activityPoints = activities
      .filter(a => a.studentEmail === studentEmail)
      .reduce((sum, a) => sum + a.points, 0);
    const engagementPoints = getStudentEngagementPoints(studentEmail);
    
    const stats = {
      totalActivities: activities.length,
      myActivities: activities.filter(a => a.studentEmail === studentEmail).length,
      totalPoints: activityPoints + engagementPoints,
      weeklyActivities: activities.filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(a.timestamp) >= weekAgo;
      }).length,
      myRank: leaderboard.data.find(l => l.studentEmail === studentEmail)?.rank || 0,
      activitiesByType: {
        POST: activities.filter(a => a.type === 'POST').length,
        FORUM: activities.filter(a => a.type === 'FORUM').length,
        EVENT: activities.filter(a => a.type === 'EVENT').length,
        SKILL_OFFER: activities.filter(a => a.type === 'SKILL_OFFER').length,
        SKILL_REQUEST: activities.filter(a => a.type === 'SKILL_REQUEST').length
      }
    };
    
    return {
      success: true,
      data: {
        student: student,
        stats: stats,
        recentActivity: recentActivity.data,
        leaderboard: leaderboard.data.slice(0, 5), // Top 5 for dashboard
        lastSync: new Date().toISOString()
      }
    };
    
  } catch (error) {
    Logger.log('Error in getStudentsCornerDashboard: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Students Corner dashboard: ' + error.message
    };
  }
}

// =====================================================
// STUDENTS CORNER - ENGAGEMENT FUNCTIONS
// =====================================================

/**
 * Helper function to get student info by email
 */
function getStudentByEmail(email) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(STUDENT_LOGIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: false, error: 'No students found' };
    }
    
    // Find student by email
    const studentRow = data.slice(1).find(row => row[0] === email);
    
    if (!studentRow) {
      return { success: false, error: 'Student not found' };
    }
    
    return {
      success: true,
      data: {
        email: studentRow[0],
        fullName: studentRow[1],
        batch: studentRow[2],
        rollNo: studentRow[3] || ''
      }
    };
    
  } catch (error) {
    Logger.log('Error in getStudentByEmail: ' + error.message);
    return { success: false, error: 'Failed to get student: ' + error.message };
  }
}

/**
 * Create engagement sheet if it doesn't exist
 */
function createEngagementSheetIfNeeded() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(STUDENTS_CORNER_ENGAGEMENT_SHEET);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(STUDENTS_CORNER_ENGAGEMENT_SHEET);
      
      // Set up headers
      const headers = [
        'ID', 'ActivityID', 'StudentEmail', 'FullName', 'Batch', 
        'EngagementType', 'CommentText', 'Timestamp', 'Points'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      Logger.log('Created Students Corner - Engagement sheet');
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error creating engagement sheet: ' + error.message);
    throw error;
  }
}

/**
 * Create a new engagement (like or comment)
 */
function createStudentsCornerEngagement(activityId, studentEmail, engagementType, commentText = '') {
  try {
    Logger.log(`Creating engagement: activityId=${activityId}, email=${studentEmail}, type=${engagementType}`);
    
    // Validate inputs
    if (!activityId || !studentEmail || !engagementType) {
      throw new Error('Missing required parameters');
    }
    
    if (!['LIKE', 'COMMENT'].includes(engagementType)) {
      throw new Error('Invalid engagement type');
    }
    
    // Get student info
    const student = getStudentByEmail(studentEmail);
    if (!student.success) {
      throw new Error('Student not found');
    }
    
    // Check if student is trying to like their own post
    if (engagementType === 'LIKE') {
      const activitySheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENTS_CORNER_SHEET);
      const activityData = activitySheet.getDataRange().getValues();
      const activityRow = activityData.find(row => row[0] === activityId);
      
      if (activityRow && activityRow[2] === studentEmail) {
        throw new Error('Cannot like your own post');
      }
      
      // Check if student already liked this post
      const engagementSheet = createEngagementSheetIfNeeded();
      const engagementData = engagementSheet.getDataRange().getValues();
      const existingLike = engagementData.find(row => 
        row[1] === activityId && row[2] === studentEmail && row[5] === 'LIKE'
      );
      
      if (existingLike) {
        throw new Error('Already liked this post');
      }
    }
    
    // Validate comment length
    if (engagementType === 'COMMENT' && commentText.length > 200) {
      throw new Error('Comment exceeds 200 character limit');
    }
    
    const engagementSheet = createEngagementSheetIfNeeded();
    const timestamp = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm:ss");
    
    // Generate unique ID
    const lastRow = engagementSheet.getLastRow();
    const newId = lastRow > 1 ? 'ENG' + (lastRow).toString().padStart(4, '0') : 'ENG0001';
    
    // Points calculation
    const points = engagementType === 'LIKE' ? 2 : 3;
    
    // Add engagement row
    const newRowData = [
      newId,
      activityId,
      studentEmail,
      student.data.fullName,
      student.data.batch,
      engagementType,
      commentText || '',
      timestamp,
      points
    ];
    
    engagementSheet.appendRow(newRowData);
    
    // Update leaderboard points for the person who engaged
    updateStudentsCornerPoints(studentEmail, points);
    
    // Give points to the post author for receiving engagement
    const activitySheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENTS_CORNER_SHEET);
    const activityData = activitySheet.getDataRange().getValues();
    const activityRow = activityData.find(row => row[0] === activityId);
    
    if (activityRow) {
      const authorEmail = activityRow[2];
      const authorPoints = engagementType === 'LIKE' ? 1 : 2;
      updateStudentsCornerPoints(authorEmail, authorPoints);
    }
    
    Logger.log(`Created engagement: ${newId}`);
    
    return {
      success: true,
      data: {
        id: newId,
        type: engagementType,
        points: points,
        message: `${engagementType === 'LIKE' ? 'Liked' : 'Commented on'} successfully! +${points} points`
      }
    };
    
  } catch (error) {
    Logger.log('Error in createStudentsCornerEngagement: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get engagements for a specific activity
 */
function getStudentsCornerEngagements(activityId, currentUserEmail = null) {
  try {
    const engagementSheet = createEngagementSheetIfNeeded();
    const data = engagementSheet.getDataRange().getValues();
    const headers = data[0];
    
    if (data.length <= 1) {
      return {
        success: true,
        data: {
          likes: 0,
          comments: [],
          userLiked: false
        }
      };
    }
    
    // Filter engagements for this activity
    const activityEngagements = data.slice(1).filter(row => row[1] === activityId);
    
    const likes = activityEngagements.filter(row => row[5] === 'LIKE');
    const comments = activityEngagements
      .filter(row => row[5] === 'COMMENT')
      .map(row => ({
        id: row[0],
        studentEmail: row[2],
        fullName: row[3],
        batch: row[4],
        text: row[6],
        timestamp: formatDisplayDateTime(row[7])
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Check if current user liked this activity
    const userLiked = currentUserEmail ? 
      likes.some(like => like[2] === currentUserEmail) : false;
    
    return {
      success: true,
      data: {
        likes: likes.length,
        comments: comments,
        userLiked: userLiked
      }
    };
    
  } catch (error) {
    Logger.log('Error in getStudentsCornerEngagements: ' + error.message);
    return {
      success: false,
      error: 'Failed to get engagements: ' + error.message
    };
  }
}

/**
 * Remove a like (unlike functionality)
 */
function removeStudentsCornerEngagement(activityId, studentEmail, engagementType) {
  try {
    const engagementSheet = createEngagementSheetIfNeeded();
    const data = engagementSheet.getDataRange().getValues();
    
    // Find the engagement to remove
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === activityId && row[2] === studentEmail && row[5] === engagementType) {
        const points = row[8];
        engagementSheet.deleteRow(i + 1);
        
        // Remove points from the person who engaged
        updateStudentsCornerPoints(studentEmail, -points);
        
        // Remove points from the post author
        const activitySheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STUDENTS_CORNER_SHEET);
        const activityData = activitySheet.getDataRange().getValues();
        const activityRow = activityData.find(row => row[0] === activityId);
        
        if (activityRow) {
          const authorEmail = activityRow[2];
          const authorPoints = engagementType === 'LIKE' ? 1 : 2;
          updateStudentsCornerPoints(authorEmail, -authorPoints);
        }
        
        return {
          success: true,
          data: { message: `${engagementType} removed successfully` }
        };
      }
    }
    
    return {
      success: false,
      error: 'Engagement not found'
    };
    
  } catch (error) {
    Logger.log('Error in removeStudentsCornerEngagement: ' + error.message);
    return {
      success: false,
      error: 'Failed to remove engagement: ' + error.message
    };
  }
}

/**
 * Get engagement points for a student
 */
function getStudentEngagementPoints(studentEmail) {
  try {
    const engagementSheet = createEngagementSheetIfNeeded();
    const data = engagementSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return 0;
    }
    
    let totalPoints = 0;
    
    // Sum up all points earned by this student from engagements
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === studentEmail) { // StudentEmail column
        totalPoints += row[8] || 0; // Points column
      }
    }
    
    return totalPoints;
  } catch (error) {
    Logger.log('Error getting student engagement points: ' + error.message);
    return 0;
  }
}

/**
 * Update points for a student (helper function)
 * This is now handled automatically through the leaderboard calculation
 */
function updateStudentsCornerPoints(studentEmail, pointsToAdd) {
  try {
    Logger.log(`Engagement points logged for ${studentEmail}: +${pointsToAdd}`);
    // Points are now calculated dynamically from engagements
    // No need to update any sheet as leaderboard will calculate from engagement data
  } catch (error) {
    Logger.log('Error logging points: ' + error.message);
  }
}

/**
 * Get all students for @ mention functionality
 */
function getStudentsForMentions(studentEmail) {
  if (!studentEmail) {
    return createErrorResponse('Invalid or missing student email');
  }
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(STUDENT_LOGIN_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const students = data.slice(1).map(row => ({
      email: row[0],
      fullName: row[1],
      batch: row[2]
    })).filter(student => student.email && student.fullName);
    
    return {
      success: true,
      data: students
    };

  } catch (error) {
    Logger.log('Error in getStudentsForMentions: ' + error.message);
    return {
      success: false,
      error: 'Failed to get students: ' + error.message
    };
  }
}

// ==================== ZOOM SESSIONS API ====================

/**
 * Get live and upcoming Zoom sessions
 */
function getZoomLiveSessions(batch) {
  try {
    Logger.log('Getting live sessions for batch: ' + batch);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const liveSheet = spreadsheet.getSheetByName('Zoom Live');

    if (!liveSheet) {
      return {
        success: true,
        data: { sessions: [], count: 0 }
      };
    }

    const data = liveSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { sessions: [], count: 0 }
      };
    }

    const headers = data[0];
    const sessions = [];
    const now = new Date();

    // Map column indices
    const colIndices = {
      batch: headers.indexOf('Batch'),
      term: headers.indexOf('Term'),
      domain: headers.indexOf('Domain'),
      subject: headers.indexOf('Subject'),
      sessionName: headers.indexOf('Session Name'),
      date: headers.indexOf('Date'),
      startTime: headers.indexOf('Start Time'),
      duration: headers.indexOf('Duration (min)'),
      zoomLiveLink: headers.indexOf('Zoom Live Link'),
      meetingId: headers.indexOf('Meeting ID'),
      meetingPassword: headers.indexOf('Meeting Password'),
      fullSynced: headers.indexOf('Full Synced'),
      downloadGalleryView: headers.indexOf('Gallery View'),
      downloadSpeakerView: headers.indexOf('Speaker View'),
      downloadScreenShareSpeaker: headers.indexOf('Screen Share + Speaker'),
      downloadScreenShare: headers.indexOf('Screen Share Only')
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Filter by batch if provided
      if (batch && row[colIndices.batch] !== batch) continue;

      const sessionDate = row[colIndices.date];
      const startTime = row[colIndices.startTime];
      const durationMinutes = row[colIndices.duration] || 0;

      if (!sessionDate || !startTime) continue;

      // Parse date
      const sessionDateObj = new Date(sessionDate);

      // Format date for display (DD-MMM-YYYY format like 03-Nov-2025)
      const displayDate = Utilities.formatDate(sessionDateObj, 'Asia/Kolkata', 'dd-MMM-yyyy');

      // Calculate end time by adding duration to start time
      const calculateEndTime = function(startTimeStr, durationMin) {
        try {
          // Parse start time (format: "02:15 PM" or "2:15 PM")
          var timeParts = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!timeParts) return '';

          var hours = parseInt(timeParts[1]);
          var minutes = parseInt(timeParts[2]);
          var period = timeParts[3].toUpperCase();

          // Convert to 24-hour format
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          // Add duration
          var totalMinutes = minutes + parseInt(durationMin);
          var totalHours = hours + Math.floor(totalMinutes / 60);
          var endMinutes = totalMinutes % 60;
          var endHours = totalHours % 24; // Handle day overflow

          // Convert back to 12-hour format
          var endPeriod = endHours >= 12 ? 'PM' : 'AM';
          var displayHours = endHours % 12;
          if (displayHours === 0) displayHours = 12;

          return displayHours + ':' + (endMinutes < 10 ? '0' : '') + endMinutes + ' ' + endPeriod;
        } catch (e) {
          Logger.log('Error calculating end time: ' + e.message);
          return '';
        }
      };

      var endTime = calculateEndTime(startTime, durationMinutes);

      // Get Full Synced status (check if recordings are available)
      const fullSynced = row[colIndices.fullSynced];
      const hasRecording = (fullSynced === 'TRUE' || fullSynced === true);

      sessions.push({
        sessionId: `zoom_${i}`,
        batch: row[colIndices.batch] || '',
        term: row[colIndices.term] || '',
        domain: row[colIndices.domain] || '',
        subject: row[colIndices.subject] || '',
        sessionName: row[colIndices.sessionName] || '',
        date: displayDate,
        startTime: startTime,
        endTime: endTime,
        duration: durationMinutes,
        joinUrl: row[colIndices.zoomLiveLink] || '',
        zoomMeetingId: row[colIndices.meetingId] || '',
        zoomPassword: row[colIndices.meetingPassword] || '',
        fullSynced: hasRecording,
        hasRecording: hasRecording,
        downloadGalleryView: row[colIndices.downloadGalleryView] || '',
        downloadSpeakerView: row[colIndices.downloadSpeakerView] || '',
        downloadScreenShareSpeaker: row[colIndices.downloadScreenShareSpeaker] || '',
        downloadScreenShare: row[colIndices.downloadScreenShare] || '',
        type: 'live'
      });
    }

    // Sort by date (newest first for better UX)
    sessions.sort((a, b) => {
      // Parse dates from DD-MMM-YYYY format
      const parseDate = (dateStr) => {
        const months = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const parts = dateStr.split('-');
        return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
      };

      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA; // Descending order (newest first)
    });

    Logger.log(`Found ${sessions.length} sessions`);

    return {
      success: true,
      data: {
        sessions: sessions,
        count: sessions.length
      }
    };

  } catch (error) {
    Logger.log('Error in getZoomLiveSessions: ' + error.message);
    return {
      success: false,
      error: 'Failed to get live sessions: ' + error.message
    };
  }
}

/**
 * Get Zoom recordings with filters
 */
function getZoomRecordings(batch, term, domain, subject) {
  try {
    Logger.log('Getting recordings with filters - batch: ' + batch + ', term: ' + term + ', domain: ' + domain + ', subject: ' + subject);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const recordingSheet = spreadsheet.getSheetByName('Zoom Recordings');

    if (!recordingSheet) {
      return {
        success: true,
        data: { sessions: [], count: 0 }
      };
    }

    const data = recordingSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { sessions: [], count: 0 }
      };
    }

    const headers = data[0];
    const recordings = [];

    // Map column indices - Using fixed indices from Backend Zoom.js CONFIG.RECORDING_COLS
    const colIndices = {
      batch: 0,
      term: 1,
      domain: 2,
      subject: 3,
      sessionName: 4,
      date: 5,
      startTime: 6,
      duration: 7,
      meetingId: 8,
      meetingPassword: 9,
      manualDownload: 10,
      speakerViewLink: 11,
      galleryViewLink: 12,
      screenShareLink: 13,
      activeSpeakerLink: 14,
      transcriptLink: 15,
      audioLink: 16,
      chatLink: 17,
      publish: 18,
      file1Name: 19,
      file1: 20,
      file2Name: 21,
      file2: 22,
      file3Name: 23,
      file3: 24,
      file4Name: 25,
      file4: 26,
      file5Name: 27,
      file5: 28
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Apply filters
      if (batch && row[colIndices.batch] !== batch) continue;
      if (term && row[colIndices.term] !== term) continue;
      if (domain && row[colIndices.domain] !== domain) continue;
      if (subject && row[colIndices.subject] !== subject) continue;

      // Check Publish status - only show if Publish = "Yes"
      const publishStatus = row[colIndices.publish] || '';
      if (publishStatus.toLowerCase() !== 'yes') {
        continue;
      }

      // Get recording links
      const speakerViewLink = row[colIndices.speakerViewLink] || row[colIndices.activeSpeakerLink] || '';
      const galleryViewLink = row[colIndices.galleryViewLink] || '';
      const screenShareLink = row[colIndices.screenShareLink] || '';
      const activeSpeakerLink = row[colIndices.activeSpeakerLink] || '';
      const transcriptLink = row[colIndices.transcriptLink] || '';
      const audioLink = row[colIndices.audioLink] || '';
      const chatLink = row[colIndices.chatLink] || '';

      // Get additional files with names (consistent pattern: Name → URL)
      const file1Name = row[colIndices.file1Name] || '';
      const file1 = row[colIndices.file1] || '';
      const file2Name = row[colIndices.file2Name] || '';
      const file2 = row[colIndices.file2] || '';
      const file3Name = row[colIndices.file3Name] || '';
      const file3 = row[colIndices.file3] || '';
      const file4Name = row[colIndices.file4Name] || '';
      const file4 = row[colIndices.file4] || '';
      const file5Name = row[colIndices.file5Name] || '';
      const file5 = row[colIndices.file5] || '';

      // Skip if no recording links at all
      if (!speakerViewLink && !galleryViewLink && !screenShareLink && !activeSpeakerLink) {
        continue;
      }

      const sessionDate = row[colIndices.date];
      const sessionDateObj = sessionDate ? new Date(sessionDate) : new Date();

      // Get start time and duration from the sheet
      const startTime = row[colIndices.startTime] || '';
      const duration = row[colIndices.duration] || '';

      recordings.push({
        sessionId: row[colIndices.meetingId] || `zoom_rec_${i}`,
        batch: row[colIndices.batch] || '',
        term: row[colIndices.term] || '',
        domain: row[colIndices.domain] || '',
        subject: row[colIndices.subject] || '',
        sessionName: row[colIndices.sessionName] || '',
        date: sessionDateObj.toISOString(),
        day: '',
        startTime: startTime,
        endTime: '',
        duration: duration,
        gmeetLive: '',
        gmeetRecording: '',
        scalerLive: '',
        scalerRecording: '',
        zoomMeetingId: row[colIndices.meetingId] || '',
        zoomPassword: row[colIndices.meetingPassword] || '',
        status: 'Completed',
        isLive: false,
        hasRecording: true,
        type: 'recording',
        // Recording view Drive links
        speakerViewLink: speakerViewLink,
        galleryViewLink: galleryViewLink,
        screenShareLink: screenShareLink,
        activeSpeakerLink: activeSpeakerLink,
        // Additional assets
        transcriptLink: transcriptLink,
        audioLink: audioLink,
        chatLink: chatLink,
        // Additional files with names
        file1Name: file1Name,
        file1: file1,
        file2: file2,
        file2Name: file2Name,
        file3: file3,
        file3Name: file3Name,
        file4: file4,
        file4Name: file4Name,
        file5: file5,
        file5Name: file5Name,
        // Manual download flag
        manualDownload: row[colIndices.manualDownload] || '',
        // Publish status
        publish: publishStatus
      });
    }

    // Sort by date (most recent first)
    recordings.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    Logger.log(`Found ${recordings.length} recordings`);

    return {
      success: true,
      data: {
        sessions: recordings,
        count: recordings.length
      }
    };

  } catch (error) {
    Logger.log('Error in getZoomRecordings: ' + error.message);
    return {
      success: false,
      error: 'Failed to get recordings: ' + error.message
    };
  }
}

/**
 * Get all sessions with filters
 */
function getZoomSessions(type, batch, term, domain, subject) {
  try {
    if (type === 'live') {
      return getZoomLiveSessions(batch);
    } else if (type === 'recorded') {
      return getZoomRecordings(batch, term, domain, subject);
    } else {
      // Return both live and recorded
      const liveResult = getZoomLiveSessions(batch);
      const recordedResult = getZoomRecordings(batch, term, domain, subject);

      if (liveResult.success && recordedResult.success) {
        const allSessions = [...liveResult.data.sessions, ...recordedResult.data.sessions];
        return {
          success: true,
          data: {
            sessions: allSessions,
            count: allSessions.length
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to get sessions'
        };
      }
    }
  } catch (error) {
    Logger.log('Error in getZoomSessions: ' + error.message);
    return {
      success: false,
      error: 'Failed to get sessions: ' + error.message
    };
  }
}

/**
 * Get SSB Calendar Events from Info.ssb Calendar subsheet
 * Filters by batch and only returns published events (Publish = "Yes")
 */
function getCalendarEvents(batch) {
  try {
    Logger.log('Getting calendar events for batch: ' + batch);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const calendarSheet = spreadsheet.getSheetByName('Info.ssb Calendar');

    if (!calendarSheet) {
      return {
        success: true,
        data: { events: [], count: 0 }
      };
    }

    const data = calendarSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { events: [], count: 0 }
      };
    }

    const headers = data[0];
    const events = [];

    // Map column indices
    const colIndices = {
      batch: headers.indexOf('Batch'),
      publish: headers.indexOf('Publish'),
      eventType: headers.indexOf('Event Type'),
      studentLevelShow: headers.indexOf('Student Level Show'),
      eventName: headers.indexOf('Event Name'),
      startDate: headers.indexOf('Start Date'),
      startTime: headers.indexOf('Start Time'),
      endDate: headers.indexOf('End Date'),
      endTime: headers.indexOf('End Time'),
      link: headers.indexOf('Link'),
      description: headers.indexOf('Description'),
      attendees: headers.indexOf('Attendees'),
      eventId: headers.indexOf('Event ID'),
      updated: headers.indexOf('Updated?'),
      updatedAt: headers.indexOf('Updated at Timestamp'),
      location: headers.indexOf('Location')
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Filter by batch if provided
      if (batch && row[colIndices.batch] !== batch) continue;

      // Only include published events
      const publishValue = row[colIndices.publish];
      if (publishValue !== 'Yes') continue;

      const eventName = row[colIndices.eventName];
      const startDate = row[colIndices.startDate];
      const startTime = row[colIndices.startTime];

      // Skip if missing required fields
      if (!eventName || !startDate || !startTime) continue;

      // Format dates if they are Date objects
      const formattedStartDate = startDate instanceof Date
        ? Utilities.formatDate(startDate, 'Asia/Kolkata', 'dd-MMM-yyyy')
        : startDate;

      const formattedEndDate = row[colIndices.endDate] instanceof Date
        ? Utilities.formatDate(row[colIndices.endDate], 'Asia/Kolkata', 'dd-MMM-yyyy')
        : row[colIndices.endDate];

      const formattedUpdatedAt = row[colIndices.updatedAt] instanceof Date
        ? Utilities.formatDate(row[colIndices.updatedAt], 'Asia/Kolkata', 'dd-MMM-yyyy hh:mm a')
        : row[colIndices.updatedAt];

      // Build event object
      const event = {
        eventId: row[colIndices.eventId] || `cal_${i}`,
        batch: row[colIndices.batch] || '',
        publish: publishValue || '',
        eventType: row[colIndices.eventType] || '',
        studentLevelShow: row[colIndices.studentLevelShow] || '',
        eventName: eventName,
        startDate: formattedStartDate,
        startTime: row[colIndices.startTime] || '',
        endDate: formattedEndDate || formattedStartDate,
        endTime: row[colIndices.endTime] || '',
        link: row[colIndices.link] || '',
        description: row[colIndices.description] || '',
        attendees: row[colIndices.attendees] || '',
        updated: row[colIndices.updated] || 'No',
        updatedAt: formattedUpdatedAt || '',
        location: row[colIndices.location] || ''
      };

      events.push(event);
    }

    Logger.log('Found ' + events.length + ' calendar events');

    return {
      success: true,
      data: {
        events: events,
        count: events.length
      }
    };

  } catch (error) {
    Logger.log('Error in getCalendarEvents: ' + error.message);
    return {
      success: false,
      error: 'Failed to get calendar events: ' + error.message
    };
  }
}

/**
 * Get single session by ID
 */
function getZoomSession(sessionId) {
  try {
    Logger.log('Getting session: ' + sessionId);

    // Extract row number from sessionId (format: zoom_X or zoom_rec_X)
    const rowMatch = sessionId.match(/zoom(?:_rec)?_(\d+)/);
    if (!rowMatch) {
      return {
        success: false,
        error: 'Invalid session ID'
      };
    }

    const rowIndex = parseInt(rowMatch[1]);
    const isRecording = sessionId.includes('_rec_');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = isRecording ? 'Zoom Recording' : 'Zoom Live';
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet || rowIndex >= sheet.getLastRow()) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const row = data[rowIndex];

    // Build session object (simplified - expand as needed)
    const session = {
      sessionId: sessionId,
      sessionName: row[headers.indexOf('Session Name')] || '',
      // Add other fields as needed
    };

    return {
      success: true,
      data: { session: session }
    };

  } catch (error) {
    Logger.log('Error in getZoomSession: ' + error.message);
    return {
      success: false,
      error: 'Failed to get session: ' + error.message
    };
  }
}

// ==================== ZOOM NOTES API ====================

/**
 * Get notes for a student
 */
function getZoomNotes(studentId, sessionId) {
  try {
    Logger.log('Getting notes for student: ' + studentId + ', session: ' + sessionId);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let notesSheet = spreadsheet.getSheetByName('Zoom Notes');

    // Create sheet if it doesn't exist
    if (!notesSheet) {
      notesSheet = spreadsheet.insertSheet(NOTES_SHEET);
      // Updated headers to match required structure
      notesSheet.appendRow([
        'Note ID',          // A
        'Student Email',    // B
        'Student Name',     // C
        'Batch',            // D
        'Term',             // E
        'Domain',           // F
        'Subject',          // G
        'Session Name',     // H
        'Date',             // I
        'Start Time',       // J
        'Meeting ID',       // K
        'Note Title',       // L
        'Note Content',     // M
        'Images',           // N
        'Timestamp',        // O
        'Last Modified',    // P
        'Is Pinned',        // Q
        'Tags',             // R
        'Type'              // S
      ]);
      return {
        success: true,
        data: { notes: [] }
      };
    }

    const data = notesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { notes: [] }
      };
    }

    const headers = data[0];
    const notes = [];

    const colIndices = {
      noteId: headers.indexOf('Note ID'),
      studentEmail: headers.indexOf('Student Email'),
      studentName: headers.indexOf('Student Name'),
      batch: headers.indexOf('Batch'),
      term: headers.indexOf('Term'),
      domain: headers.indexOf('Domain'),
      subject: headers.indexOf('Subject'),
      sessionName: headers.indexOf('Session Name'),
      date: headers.indexOf('Date'),
      startTime: headers.indexOf('Start Time'),
      meetingId: headers.indexOf('Meeting ID'),
      noteTitle: headers.indexOf('Note Title'),
      noteContent: headers.indexOf('Note Content'),
      images: headers.indexOf('Images'),
      timestamp: headers.indexOf('Timestamp'),
      lastModified: headers.indexOf('Last Modified'),
      isPinned: headers.indexOf('Is Pinned'),
      tags: headers.indexOf('Tags'),
      type: headers.indexOf('Type')
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Filter by student email
      if (row[colIndices.studentEmail] !== studentId) continue;

      // Filter by session ID (Meeting ID) if provided
      if (sessionId && row[colIndices.meetingId] !== sessionId) continue;

      notes.push({
        noteId: row[colIndices.noteId],
        studentEmail: row[colIndices.studentEmail],
        studentName: row[colIndices.studentName],
        batch: row[colIndices.batch],
        term: row[colIndices.term],
        domain: row[colIndices.domain],
        subject: row[colIndices.subject],
        sessionName: row[colIndices.sessionName],
        sessionId: row[colIndices.meetingId], // Meeting ID is the session ID
        date: row[colIndices.date],
        startTime: row[colIndices.startTime],
        meetingId: row[colIndices.meetingId],
        noteTitle: row[colIndices.noteTitle],
        noteContent: row[colIndices.noteContent],
        images: row[colIndices.images],
        timestamp: row[colIndices.timestamp],
        lastModified: row[colIndices.lastModified],
        isPinned: row[colIndices.isPinned] === 'Yes' || row[colIndices.isPinned] === true,
        noteTags: row[colIndices.tags],
        type: row[colIndices.type]
      });
    }

    Logger.log(`Found ${notes.length} notes`);

    return {
      success: true,
      data: { notes: notes }
    };

  } catch (error) {
    Logger.log('Error in getZoomNotes: ' + error.message);
    return {
      success: false,
      error: 'Failed to get notes: ' + error.message
    };
  }
}

/**
 * Get a single note
 */
function getZoomNote(studentId, sessionId) {
  try {
    const result = getZoomNotes(studentId, sessionId);

    if (result.success && result.data.notes.length > 0) {
      return {
        success: true,
        data: { note: result.data.notes[0] }
      };
    }

    return {
      success: true,
      data: { note: null }
    };

  } catch (error) {
    Logger.log('Error in getZoomNote: ' + error.message);
    return {
      success: false,
      error: 'Failed to get note: ' + error.message
    };
  }
}

/**
 * Save (create or update) a note
 */
function saveZoomNote(noteData) {
  try {
    Logger.log('Saving note: ' + JSON.stringify(noteData));

    // Validate student email
    const studentEmail = noteData.studentId || noteData.studentEmail;
    if (!studentEmail) {
      return {
        success: false,
        error: 'Student email is required'
      };
    }

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let notesSheet = spreadsheet.getSheetByName(NOTES_SHEET);

    // Create sheet if it doesn't exist
    if (!notesSheet) {
      notesSheet = spreadsheet.insertSheet(NOTES_SHEET);
      notesSheet.appendRow([
        'Note ID', 'Student Email', 'Student Name', 'Batch', 'Term', 'Domain', 'Subject',
        'Session Name', 'Date', 'Start Time', 'Meeting ID', 'Note Title', 'Note Content',
        'Images', 'Timestamp', 'Last Modified', 'Is Pinned', 'Tags', 'Type'
      ]);
    }

    const data = notesSheet.getDataRange().getValues();
    const headers = data[0];

    const colIndices = {
      noteId: headers.indexOf('Note ID'),
      studentEmail: headers.indexOf('Student Email'),
      studentName: headers.indexOf('Student Name'),
      batch: headers.indexOf('Batch'),
      term: headers.indexOf('Term'),
      domain: headers.indexOf('Domain'),
      subject: headers.indexOf('Subject'),
      sessionName: headers.indexOf('Session Name'),
      date: headers.indexOf('Date'),
      startTime: headers.indexOf('Start Time'),
      meetingId: headers.indexOf('Meeting ID'),
      noteTitle: headers.indexOf('Note Title'),
      noteContent: headers.indexOf('Note Content'),
      images: headers.indexOf('Images'),
      timestamp: headers.indexOf('Timestamp'),
      lastModified: headers.indexOf('Last Modified'),
      isPinned: headers.indexOf('Is Pinned'),
      tags: headers.indexOf('Tags'),
      type: headers.indexOf('Type')
    };

    const now = formatTimestampForSheets();

    // Check if note exists (by noteId if provided, otherwise by student+session)
    let existingRowIndex = -1;
    if (noteData.noteId) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][colIndices.noteId] === noteData.noteId) {
          existingRowIndex = i + 1; // +1 for 1-based indexing
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Update existing note - update all fields
      const row = existingRowIndex;
      if (studentEmail) notesSheet.getRange(row, colIndices.studentEmail + 1).setValue(studentEmail);
      if (noteData.batch) notesSheet.getRange(row, colIndices.batch + 1).setValue(noteData.batch);
      if (noteData.term) notesSheet.getRange(row, colIndices.term + 1).setValue(noteData.term);
      if (noteData.domain) notesSheet.getRange(row, colIndices.domain + 1).setValue(noteData.domain);
      if (noteData.subject) notesSheet.getRange(row, colIndices.subject + 1).setValue(noteData.subject);
      if (noteData.sessionName) notesSheet.getRange(row, colIndices.sessionName + 1).setValue(noteData.sessionName);
      if (noteData.sessionId) notesSheet.getRange(row, colIndices.meetingId + 1).setValue(noteData.sessionId);
      if (noteData.noteTitle) notesSheet.getRange(row, colIndices.noteTitle + 1).setValue(noteData.noteTitle);
      if (noteData.noteContent) notesSheet.getRange(row, colIndices.noteContent + 1).setValue(noteData.noteContent);
      if (noteData.noteTags) notesSheet.getRange(row, colIndices.tags + 1).setValue(noteData.noteTags);
      notesSheet.getRange(row, colIndices.lastModified + 1).setValue(now);
      if (noteData.isPinned !== undefined) notesSheet.getRange(row, colIndices.isPinned + 1).setValue(noteData.isPinned ? 'Yes' : 'No');

      // Update Type field
      if (noteData.sessionId && typeof noteData.sessionId === 'string') {
        let noteType = noteData.sessionId.startsWith('quick-note-') ? 'Quick Note' : 'Session Note';
        notesSheet.getRange(row, colIndices.type + 1).setValue(noteType);
      }

      Logger.log('Updated note: ' + noteData.noteId);

      return {
        success: true,
        data: {
          noteId: noteData.noteId,
          action: 'updated'
        }
      };
    } else {
      // Create new note
      const noteId = noteData.noteId || ('note_' + Utilities.getUuid());

      // Get student name from Student Data sheet
      const studentSheet = spreadsheet.getSheetByName(STUDENT_DATA_SHEET);
      let studentName = '';
      if (studentSheet) {
        const studentData = studentSheet.getDataRange().getValues();
        const emailCol = studentData[0].indexOf('Email');
        const nameCol = studentData[0].indexOf('Name');
        for (let i = 1; i < studentData.length; i++) {
          if (studentData[i][emailCol] === studentEmail) {
            studentName = studentData[i][nameCol];
            break;
          }
        }
      }

      // Determine note type based on sessionId
      let noteType = '';
      if (noteData.sessionId && typeof noteData.sessionId === 'string' && noteData.sessionId.startsWith('quick-note-')) {
        noteType = 'Quick Note';
      } else if (noteData.sessionId && typeof noteData.sessionId === 'string') {
        noteType = 'Session Note';
      }

      notesSheet.appendRow([
        noteId,                                           // Note ID
        studentEmail,                                     // Student Email
        studentName,                                      // Student Name
        noteData.batch || '',                             // Batch
        noteData.term || '',                              // Term
        noteData.domain || '',                            // Domain
        noteData.subject || '',                           // Subject
        noteData.sessionName || '',                       // Session Name
        '',                                               // Date (can be populated from session)
        '',                                               // Start Time (can be populated from session)
        noteData.sessionId || '',                         // Meeting ID
        noteData.noteTitle || '',                         // Note Title
        noteData.noteContent || '',                       // Note Content
        '',                                               // Images
        now,                                              // Timestamp
        now,                                              // Last Modified
        noteData.isPinned ? 'Yes' : 'No',                // Is Pinned
        noteData.noteTags || '',                          // Tags
        noteType                                          // Type
      ]);

      Logger.log('Created note: ' + noteId);

      return {
        success: true,
        data: {
          noteId: noteId,
          action: 'created'
        }
      };
    }

  } catch (error) {
    Logger.log('Error in saveZoomNote: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      error: 'Failed to save note: ' + error.message
    };
  }
}

/**
 * Delete a note
 */
function deleteZoomNote(noteId, studentId) {
  try {
    Logger.log('Deleting note: ' + noteId + ' for student: ' + studentId);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = spreadsheet.getSheetByName('Zoom Notes');

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();
    const headers = data[0];

    const colIndices = {
      noteId: headers.indexOf('Note ID'),
      studentId: headers.indexOf('Student ID')
    };

    // Find and delete the note
    for (let i = 1; i < data.length; i++) {
      if (data[i][colIndices.noteId] === noteId && data[i][colIndices.studentId] === studentId) {
        notesSheet.deleteRow(i + 1);
        return {
          success: true,
          data: null
        };
      }
    }

    return {
      success: false,
      error: 'Note not found'
    };

  } catch (error) {
    Logger.log('Error in deleteZoomNote: ' + error.message);
    return {
      success: false,
      error: 'Failed to delete note: ' + error.message
    };
  }
}

/**
 * Toggle pin status of a note
 */
function togglePinZoomNote(noteId, studentId) {
  try {
    Logger.log('Toggling pin for note: ' + noteId + ', studentId: ' + studentId);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET);  // Use NOTES_SHEET constant

    if (!notesSheet) {
      Logger.log('Notes sheet not found. Expected sheet name: ' + NOTES_SHEET);
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();

    // Column indices for Notes sheet (based on saveSessionNote structure)
    // Columns: Note ID (A/0), Student Email (B/1), Student Name (C/2), ..., Is Pinned (Q/16)
    const noteIdCol = 0;
    const studentEmailCol = 1;
    const isPinnedCol = 16;

    // Find and toggle the note
    for (let i = 1; i < data.length; i++) {
      if (data[i][noteIdCol] === noteId && data[i][studentEmailCol] === studentId) {
        const currentPinned = data[i][isPinnedCol];
        const newPinned = currentPinned === 'Yes' ? 'No' : 'Yes';
        notesSheet.getRange(i + 1, isPinnedCol + 1).setValue(newPinned);

        Logger.log('Successfully toggled pin status to: ' + newPinned);
        return {
          success: true,
          data: {
            isPinned: newPinned === 'Yes'
          }
        };
      }
    }

    Logger.log('Note not found with noteId: ' + noteId + ', studentId: ' + studentId);
    return {
      success: false,
      error: 'Note not found'
    };

  } catch (error) {
    Logger.log('Error in togglePinZoomNote: ' + error.message);
    return {
      success: false,
      error: 'Failed to toggle pin: ' + error.message
    };
  }
}

/**
 * Update tags for a note
 * @param {string} noteId - Note ID
 * @param {string} studentId - Student email
 * @param {Array} tags - Array of tags
 * @return {Object} Success response
 */
function updateNoteTags(noteId, studentId, tags) {
  try {
    Logger.log('Updating tags for note: ' + noteId + ', studentId: ' + studentId + ', tags: ' + tags);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      Logger.log('Notes sheet not found. Expected sheet name: ' + NOTES_SHEET);
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();

    // Column indices for Notes sheet
    // Columns: Note ID (A/0), Student Email (B/1), ..., Is Pinned (Q/16), Tags (R/17)
    const noteIdCol = 0;
    const studentEmailCol = 1;
    const tagsCol = 17;

    // Convert tags array to comma-separated string
    const tagsString = Array.isArray(tags) ? tags.join(',') : '';

    // Find and update the note
    for (let i = 1; i < data.length; i++) {
      if (data[i][noteIdCol] === noteId && data[i][studentEmailCol] === studentId) {
        notesSheet.getRange(i + 1, tagsCol + 1).setValue(tagsString);

        Logger.log('Successfully updated tags to: ' + tagsString);
        return {
          success: true,
          data: {
            tags: tags
          }
        };
      }
    }

    Logger.log('Note not found with noteId: ' + noteId + ', studentId: ' + studentId);
    return {
      success: false,
      error: 'Note not found'
    };

  } catch (error) {
    Logger.log('Error in updateNoteTags: ' + error.message);
    return {
      success: false,
      error: 'Failed to update tags: ' + error.message
    };
  }
}

/**
 * Update note content (for checkbox state updates)
 * @param {string} noteId - Note ID
 * @param {string} studentId - Student email
 * @param {string} noteContent - Updated note content HTML
 * @return {Object} Success response
 */
function updateNoteContent(noteId, studentId, noteContent, isEncoded) {
  try {
    Logger.log('Updating note content for note: ' + noteId + ', studentId: ' + studentId);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = spreadsheet.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      Logger.log('Notes sheet not found. Expected sheet name: ' + NOTES_SHEET);
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    // Decode base64 content if encoded
    let decodedContent = noteContent;
    if (isEncoded === 'true') {
      try {
        decodedContent = Utilities.newBlob(Utilities.base64Decode(noteContent)).getDataAsString();
        Logger.log('Decoded content from base64');
      } catch (decodeError) {
        Logger.log('Error decoding base64: ' + decodeError.message);
        // If decode fails, use original content
      }
    }

    const data = notesSheet.getDataRange().getValues();

    // Column indices for Notes sheet
    // Columns: Note ID (A/0), Student Email (B/1), ..., Note Content (M/12), ..., Last Modified (P/15)
    const noteIdCol = 0;
    const studentEmailCol = 1;
    const noteContentCol = 12;
    const lastModifiedCol = 15;

    // Find and update the note
    for (let i = 1; i < data.length; i++) {
      if (data[i][noteIdCol] === noteId && data[i][studentEmailCol] === studentId) {
        const now = new Date().toISOString();
        notesSheet.getRange(i + 1, noteContentCol + 1).setValue(decodedContent);
        notesSheet.getRange(i + 1, lastModifiedCol + 1).setValue(now);

        Logger.log('Successfully updated note content');
        return {
          success: true,
          data: {
            noteContent: decodedContent,
            lastModified: now
          }
        };
      }
    }

    Logger.log('Note not found with noteId: ' + noteId + ', studentId: ' + studentId);
    return {
      success: false,
      error: 'Note not found'
    };

  } catch (error) {
    Logger.log('Error in updateNoteContent: ' + error.message);
    return {
      success: false,
      error: 'Failed to update note content: ' + error.message
    };
  }
}

/**
 * Get all session notes for a student by Batch/Term/Domain/Subject
 * @param {string} studentId - Student email
 * @param {string} batch - Batch name
 * @param {string} term - Term name
 * @param {string} domain - Domain name
 * @param {string} subject - Subject name
 * @return {Object} Array of sessions with their notes
 */
function getSessionNotesBySubject(studentId, batch, term, domain, subject) {
  try {
    Logger.log('Getting all session notes for: ' + studentId + ', Batch: ' + batch + ', Term: ' + term + ', Domain: ' + domain + ', Subject: ' + subject);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = ss.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();
    const sessionMap = {}; // Group notes by session

    // Normalize function to handle both spaces and + symbols
    function normalize(str) {
      if (!str) return '';
      return String(str).replace(/\+/g, ' ').trim();
    }

    // Normalize filter values
    const normalizedBatch = normalize(batch);
    const normalizedTerm = normalize(term);
    const normalizedDomain = normalize(domain);
    const normalizedSubject = normalize(subject);

    Logger.log('Normalized filters - Batch: "' + normalizedBatch + '", Term: "' + normalizedTerm + '", Domain: "' + normalizedDomain + '", Subject: "' + normalizedSubject + '"');

    // Find all notes for this student matching the filters
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Normalize sheet values for comparison
      const rowBatch = normalize(row[3]);
      const rowTerm = normalize(row[4]);
      const rowDomain = normalize(row[5]);
      const rowSubject = normalize(row[6]);

      // Check if matches: Student Email (B/1), Batch (D/3), Term (E/4), Domain (F/5), Subject (G/6)
      if (row[1] === studentId &&
          rowBatch === normalizedBatch &&
          rowTerm === normalizedTerm &&
          rowDomain === normalizedDomain &&
          rowSubject === normalizedSubject) {

        const sessionId = row[10]; // Meeting ID (K/10)
        const sessionName = row[7]; // Session Name (H/7)
        const date = row[8]; // Date (I/8)
        const startTime = row[9]; // Start Time (J/9)

        // Initialize session if not exists
        if (!sessionMap[sessionId]) {
          sessionMap[sessionId] = {
            sessionId: sessionId,
            sessionName: sessionName,
            date: date,
            startTime: startTime,
            batch: batch,
            term: term,
            domain: domain,
            subject: subject,
            notes: []
          };
        }

        // Add note to session
        sessionMap[sessionId].notes.push({
          noteId: row[0],
          studentEmail: row[1],
          studentName: row[2],
          noteTitle: row[11],
          noteContent: row[12],
          images: row[13],
          timestamp: row[14],
          lastModified: row[15],
          isPinned: row[16],
          tags: row[17],
          type: row[18] || 'Live'  // Column S (18) - Type
        });
      }
    }

    // Convert map to array and sort by date (newest first)
    const sessions = Object.values(sessionMap).sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.startTime);
      const dateB = new Date(b.date + ' ' + b.startTime);
      return dateB - dateA; // Descending order
    });

    return {
      success: true,
      data: sessions
    };

  } catch (error) {
    Logger.log('Error in getSessionNotesBySubject: ' + error.message);
    return {
      success: false,
      error: 'Failed to get session notes: ' + error.message
    };
  }
}

/**
 * Search notes
 */
function searchZoomNotes(studentId, query) {
  try {
    Logger.log('Searching notes for student: ' + studentId + ', query: ' + query);

    const result = getZoomNotes(studentId);

    if (!result.success) {
      return result;
    }

    const searchQuery = query.toLowerCase();
    const filteredNotes = result.data.notes.filter(note =>
      note.content.toLowerCase().includes(searchQuery)
    );

    return {
      success: true,
      data: { notes: filteredNotes }
    };

  } catch (error) {
    Logger.log('Error in searchZoomNotes: ' + error.message);
    return {
      success: false,
      error: 'Failed to search notes: ' + error.message
    };
  }
}

/**
 * Get notes hierarchy (grouped by session)
 */
function getZoomNotesHierarchy(studentId) {
  try {
    Logger.log('Getting notes hierarchy for student: ' + studentId);

    const result = getZoomNotes(studentId);

    if (!result.success) {
      return result;
    }

    // Group notes by session
    const hierarchy = {};
    result.data.notes.forEach(note => {
      if (!hierarchy[note.sessionId]) {
        hierarchy[note.sessionId] = [];
      }
      hierarchy[note.sessionId].push(note);
    });

    return {
      success: true,
      data: { hierarchy: hierarchy }
    };

  } catch (error) {
    Logger.log('Error in getZoomNotesHierarchy: ' + error.message);
    return {
      success: false,
      error: 'Failed to get notes hierarchy: ' + error.message
    };
  }
}
// ==================== ZOOM ADMIN API ====================

/**
 * Trigger Zoom sync (Create → Live)
 * Calls the Backend Zoom.js syncCreateToLive function
 */
function triggerZoomSync() {
  try {
    Logger.log('Admin: Triggering Zoom sync (Create → Live)');

    // Check if Backend Zoom.js functions are available
    if (typeof syncCreateToLive === 'function') {
      const result = syncCreateToLive();
      return {
        success: true,
        data: {
          message: 'Zoom sync completed successfully',
          ...result
        }
      };
    } else {
      return {
        success: false,
        error: 'Backend Zoom.js syncCreateToLive function not found. Make sure Backend Zoom.js is in the same project.'
      };
    }
  } catch (error) {
    Logger.log('Error in triggerZoomSync: ' + error.message);
    return {
      success: false,
      error: 'Failed to trigger Zoom sync: ' + error.message
    };
  }
}

/**
 * Trigger Zoom recording sync
 * Calls the Backend Zoom.js syncZoomRecordings function
 */
function triggerRecordingSync() {
  try {
    Logger.log('Admin: Triggering Zoom recording sync');

    // Check if Backend Zoom.js functions are available
    if (typeof syncZoomRecordings === 'function') {
      const result = syncZoomRecordings();
      return {
        success: true,
        data: {
          message: 'Recording sync completed successfully',
          ...result
        }
      };
    } else {
      return {
        success: false,
        error: 'Backend Zoom.js syncZoomRecordings function not found. Make sure Backend Zoom.js is in the same project.'
      };
    }
  } catch (error) {
    Logger.log('Error in triggerRecordingSync: ' + error.message);
    return {
      success: false,
      error: 'Failed to trigger recording sync: ' + error.message
    };
  }
}

/**
 * Handle Zoom webhook events
 * @param {Object} webhookData - Webhook payload from Zoom
 * @param {Object} e - Event object with headers
 */
function handleZoomWebhook(webhookData, e) {
  try {
    Logger.log('Processing Zoom webhook...');
    Logger.log('Full event object keys: ' + (e ? Object.keys(e).join(', ') : 'null'));

    // Handle Zoom webhook verification challenge (required for initial setup)
    if (webhookData.event === 'endpoint.url_validation') {
      Logger.log('Webhook validation challenge received');
      Logger.log('Plain token: ' + webhookData.payload.plainToken);

      const plainToken = webhookData.payload.plainToken;
      const secret = 'r8P-EJ-kQDmwSZo7M0ie1g';

      // Compute HMAC-SHA256 signature
      const signature = Utilities.computeHmacSha256Signature(plainToken, secret);

      // Convert to base64-url-safe encoding (REQUIRED by Zoom!)
      const encryptedToken = Utilities.base64EncodeWebSafe(signature);

      Logger.log('Encrypted token (base64-url-safe): ' + encryptedToken);

      const response = {
        plainToken: plainToken,
        encryptedToken: encryptedToken
      };

      Logger.log('Validation response: ' + JSON.stringify(response));

      // Return JSON response with 200 status (default)
      return createJSONResponse(response);
    }

    const event = webhookData.event;
    const payload = webhookData.payload;

    Logger.log('Webhook event type: ' + event);

    // Handle different Zoom events
    switch (event) {
      case 'meeting.registration_created':
        return handleMeetingRegistration(payload);

      case 'meeting.participant_joined':
        return handleParticipantJoined(payload);

      case 'meeting.started':
        Logger.log('Meeting started: ' + payload.object.id);
        break;

      case 'meeting.ended':
        Logger.log('Meeting ended: ' + payload.object.id);
        break;

      default:
        Logger.log('Unhandled webhook event: ' + event);
    }

    // Return success response
    return createJSONResponse({ success: true });

  } catch (error) {
    Logger.log('Error handling Zoom webhook: ' + error.message);
    return createJSONResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle meeting registration event
 * @param {Object} payload - Registration event payload
 */
function handleMeetingRegistration(payload) {
  try {
    const registrant = payload.object.registrant;
    const email = registrant.email;
    const meetingId = payload.object.id;

    Logger.log('Registration created - Email: ' + email + ', Meeting ID: ' + meetingId);

    // Check if email exists in Zoom Login sheet
    if (typeof checkEmailInZoomLogin === 'function') {
      const isAuthorized = checkEmailInZoomLogin(email);

      if (!isAuthorized) {
        Logger.log('Registration denied - Email not in Zoom Login sheet: ' + email);
        // Note: Zoom doesn't allow rejecting registration via webhook
        // You would need to manually reject or use the Zoom API to update approval status
        return createJSONResponse({
          success: true,
          authorized: false,
          message: 'Email not authorized'
        });
      }

      Logger.log('Registration approved - Email authorized: ' + email);
      return createJSONResponse({
        success: true,
        authorized: true,
        message: 'Email authorized'
      });
    }

    return createJSONResponse({ success: true });

  } catch (error) {
    Logger.log('Error handling registration: ' + error.message);
    return createJSONResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle participant joined event
 * @param {Object} payload - Participant joined event payload
 */
function handleParticipantJoined(payload) {
  try {
    const participant = payload.object.participant;
    const email = participant.email || participant.user_name; // Email might be in different fields
    const meetingId = payload.object.id;
    const meetingTopic = payload.object.topic;
    const joinTime = new Date(payload.object.participant.join_time);

    Logger.log('Participant joined - Email: ' + email + ', Meeting: ' + meetingTopic);

    // Log attendance to Zoom LOG sheet
    if (typeof logAttendanceToZoomLog === 'function') {
      const logged = logAttendanceToZoomLog(email, meetingTopic, joinTime);

      if (logged) {
        Logger.log('Attendance logged successfully for: ' + email);
      } else {
        Logger.log('Failed to log attendance for: ' + email);
      }
    } else {
      Logger.log('logAttendanceToZoomLog function not found');
    }

    return createJSONResponse({
      success: true,
      logged: true
    });

  } catch (error) {
    Logger.log('Error handling participant joined: ' + error.message);
    return createJSONResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Create Zoom session from admin panel
 * @param {Object} sessionData - Session details
 */
function createZoomSessionFromAdmin(sessionData) {
  try {
    Logger.log('Admin: Creating Zoom session: ' + JSON.stringify(sessionData));

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const createSheet = spreadsheet.getSheetByName('Create Zoom + Google Calendar');

    if (!createSheet) {
      return {
        success: false,
        error: 'Create Zoom + Google Calendar sheet not found'
      };
    }

    // Append new row with session data
    const newRow = [
      'Yes', // Checkbox
      sessionData.batch || '',
      sessionData.term || '',
      sessionData.domain || '',
      sessionData.subject || '',
      sessionData.sessionName || '',
      sessionData.date || '',
      sessionData.day || '',
      sessionData.startTime || '',
      sessionData.endTime || '',
      sessionData.duration || '',
      '', // Zoom Live Link (will be filled by sync)
      '', // Meeting ID (will be filled by sync)
      '', // Meeting Password (will be filled by sync)
      '', // Calendar Event ID
      '', // Calendar Event Link
      sessionData.instructor || ''
    ];

    createSheet.appendRow(newRow);

    return {
      success: true,
      data: {
        message: 'Session added to Create sheet. Click "Sync Create → Live" to create Zoom meeting.'
      }
    };

  } catch (error) {
    Logger.log('Error in createZoomSessionFromAdmin: ' + error.message);
    return {
      success: false,
      error: 'Failed to create Zoom session: ' + error.message
    };
  }
}

/**
 * Get Zoom sync status
 * Returns statistics about Zoom Live and Recording sheets
 */
function getZoomSyncStatus() {
  try {
    Logger.log('Admin: Getting Zoom sync status');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const liveSheet = spreadsheet.getSheetByName('Zoom Live');
    const recordingSheet = spreadsheet.getSheetByName('Zoom Recordings');
    const createSheet = spreadsheet.getSheetByName('Create Zoom + Google Calendar');

    const status = {
      createSheet: {
        totalSessions: createSheet ? createSheet.getLastRow() - 1 : 0,
        pendingSync: 0
      },
      liveSheet: {
        totalSessions: liveSheet ? liveSheet.getLastRow() - 1 : 0,
        liveSessions: 0,
        upcomingSessions: 0
      },
      recordingSheet: {
        totalRecordings: recordingSheet ? recordingSheet.getLastRow() - 1 : 0
      },
      lastUpdated: new Date().toISOString()
    };

    // Count pending sessions in Create sheet
    if (createSheet) {
      const createData = createSheet.getDataRange().getValues();
      for (let i = 1; i < createData.length; i++) {
        const isChecked = createData[i][0];
        const meetingId = createData[i][12];
        if (isChecked && !meetingId) {
          status.createSheet.pendingSync++;
        }
      }
    }

    // Count live and upcoming sessions
    if (liveSheet) {
      const liveData = liveSheet.getDataRange().getValues();
      const now = new Date();

      for (let i = 1; i < liveData.length; i++) {
        const sessionDate = liveData[i][5]; // Date column
        if (sessionDate) {
          const sessionDateObj = new Date(sessionDate);
          if (sessionDateObj.toDateString() === now.toDateString()) {
            status.liveSheet.liveSessions++;
          } else if (sessionDateObj > now) {
            status.liveSheet.upcomingSessions++;
          }
        }
      }
    }

    return {
      success: true,
      data: status
    };

  } catch (error) {
    Logger.log('Error in getZoomSyncStatus: ' + error.message);
    return {
      success: false,
      error: 'Failed to get sync status: ' + error.message
    };
  }
}

/**
 * Get all sessions from Create Zoom + Google Calendar sheet for admin
 */
function getAllZoomCreateSessions() {
  try {
    Logger.log('Admin: Getting all Create Zoom sessions');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const createSheet = spreadsheet.getSheetByName('Create Zoom + Google Calendar');

    if (!createSheet) {
      return {
        success: true,
        data: { sessions: [], headers: [] }
      };
    }

    const data = createSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { sessions: [], headers: data[0] || [] }
      };
    }

    const headers = data[0];
    const sessions = [];

    // Process each row (starting from row 1, skipping header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const session = {
        rowIndex: i + 1, // Actual sheet row number (1-indexed)
        checked: row[0] || false,
        batch: row[1] || '',
        term: row[2] || '',
        domain: row[3] || '',
        subject: row[4] || '',
        sessionName: row[5] || '',
        date: row[6] ? Utilities.formatDate(new Date(row[6]), 'Asia/Kolkata', 'dd-MMM-yyyy') : '',
        startTime: row[7] || '',
        duration: row[8] || '',
        agenda: row[9] || '',
        sessionType: row[10] || '',
        calendarEventId: row[11] || '',
        meetingId: row[12] || '',
        meetingPassword: row[13] || '',
        joinUrl: row[14] || ''
      };
      sessions.push(session);
    }

    return {
      success: true,
      data: {
        sessions: sessions,
        headers: headers,
        count: sessions.length
      }
    };

  } catch (error) {
    Logger.log('Error in getAllZoomCreateSessions: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Create Zoom sessions: ' + error.message
    };
  }
}

/**
 * Get all sessions from Zoom Live sheet for admin
 */
function getAllZoomLiveSessionsAdmin() {
  try {
    Logger.log('Admin: Getting all Zoom Live sessions');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const liveSheet = spreadsheet.getSheetByName('Zoom Live');

    if (!liveSheet) {
      return {
        success: true,
        data: { sessions: [], headers: [] }
      };
    }

    const data = liveSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { sessions: [], headers: data[0] || [] }
      };
    }

    const headers = data[0];
    const sessions = [];

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const session = {
        rowIndex: i + 1,
        batch: row[0] || '',
        term: row[1] || '',
        domain: row[2] || '',
        subject: row[3] || '',
        sessionName: row[4] || '',
        date: row[5] ? Utilities.formatDate(new Date(row[5]), 'Asia/Kolkata', 'dd-MMM-yyyy') : '',
        startTime: row[6] || '',
        duration: row[7] || '',
        zoomLiveLink: row[8] || '',
        meetingId: row[9] || '',
        meetingPassword: row[10] || '',
        fullSynced: row[11] || '',
        galleryView: row[12] || '',
        speakerView: row[13] || '',
        screenShareSpeaker: row[14] || '',
        screenShareOnly: row[15] || ''
      };
      sessions.push(session);
    }

    return {
      success: true,
      data: {
        sessions: sessions,
        headers: headers,
        count: sessions.length
      }
    };

  } catch (error) {
    Logger.log('Error in getAllZoomLiveSessionsAdmin: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Zoom Live sessions: ' + error.message
    };
  }
}

/**
 * Get all recordings from Zoom Recording sheet for admin
 */
function getAllZoomRecordingsAdmin() {
  try {
    Logger.log('Admin: Getting all Zoom Recordings');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const recordingSheet = spreadsheet.getSheetByName('Zoom Recordings');

    if (!recordingSheet) {
      return {
        success: true,
        data: { recordings: [], headers: [] }
      };
    }

    const data = recordingSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: { recordings: [], headers: data[0] || [] }
      };
    }

    const headers = data[0];
    const recordings = [];

    // Process each row
    // Column mapping: Batch, Term, Domain, Subject, Session Name, Date, Start Time, Duration (min),
    // Meeting ID, Meeting Password, Manual Download, Speaker View Link, Gallery View Link, Screen Share Link,
    // Active Speaker Link, Transcript Link, Audio Link, Chat Link, Publish, File1-5 Name/Link pairs
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const recording = {
        rowIndex: i + 1,
        batch: row[0] || '',
        term: row[1] || '',
        domain: row[2] || '',
        subject: row[3] || '',
        sessionName: row[4] || '',
        date: row[5] ? Utilities.formatDate(new Date(row[5]), 'Asia/Kolkata', 'dd-MMM-yyyy') : '',
        startTime: row[6] || '',
        duration: row[7] || '',
        meetingId: row[8] || '',
        meetingPassword: row[9] || '',
        manualDownload: row[10] || '',
        speakerViewLink: row[11] || '',
        galleryViewLink: row[12] || '',
        screenShareLink: row[13] || '',
        activeSpeakerLink: row[14] || '',
        transcriptLink: row[15] || '',
        audioLink: row[16] || '',
        chatLink: row[17] || '',
        publish: row[18] || ''
      };
      recordings.push(recording);
    }

    return {
      success: true,
      data: {
        recordings: recordings,
        headers: headers,
        count: recordings.length
      }
    };

  } catch (error) {
    Logger.log('Error in getAllZoomRecordingsAdmin: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Zoom Recordings: ' + error.message
    };
  }
}

/**
 * Get all hierarchy options from Zoom Recordings sheet
 * Returns Batch, Term, Domain, Subject, Session Name data for cascading dropdowns
 * Falls back to Term subsheet if Zoom Recordings is empty
 */
function getTermHierarchyData() {
  try {
    Logger.log('Admin: Getting hierarchy data from BOTH Zoom Recordings AND Term subsheet');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

    // Initialize data structures for merging both sources
    const batchSet = new Set();
    const termMap = new Map(); // batch -> Set of terms
    const domainMap = new Map(); // "batch|term" -> Set of domains
    const subjectMap = new Map(); // "batch|term|domain" -> Set of subjects
    const sessionMap = new Map(); // "batch|term|domain|subject" -> Set of sessions

    // FIRST: Get data from Zoom Recordings sheet
    const zoomSheet = spreadsheet.getSheetByName('Zoom Recordings');
    if (zoomSheet) {
      const zoomData = zoomSheet.getDataRange().getValues();
      if (zoomData.length > 1) {
        Logger.log('Adding data from Zoom Recordings');
        const zoomRows = zoomData.slice(1); // Skip header row

        for (const row of zoomRows) {
          const batch = (row[0] || '').toString().trim();
          const term = (row[1] || '').toString().trim();
          const domain = (row[2] || '').toString().trim();
          const subject = (row[3] || '').toString().trim();
          const sessionName = (row[4] || '').toString().trim();

          if (!batch) continue;

          batchSet.add(batch);

          if (term) {
            if (!termMap.has(batch)) {
              termMap.set(batch, new Set());
            }
            termMap.get(batch).add(term);

            if (domain) {
              const domainKey = `${batch}|${term}`;
              if (!domainMap.has(domainKey)) {
                domainMap.set(domainKey, new Set());
              }
              domainMap.get(domainKey).add(domain);

              if (subject) {
                const subjectKey = `${batch}|${term}|${domain}`;
                if (!subjectMap.has(subjectKey)) {
                  subjectMap.set(subjectKey, new Set());
                }
                subjectMap.get(subjectKey).add(subject);

                if (sessionName) {
                  const sessionKey = `${batch}|${term}|${domain}|${subject}`;
                  if (!sessionMap.has(sessionKey)) {
                    sessionMap.set(sessionKey, new Set());
                  }
                  sessionMap.get(sessionKey).add(sessionName);
                }
              }
            }
          }
        }
      }
    }

    // SECOND: Get data from Term subsheet and MERGE with Zoom data
    const termSheet = spreadsheet.getSheetByName('Term');
    if (termSheet) {
      const termData = termSheet.getDataRange().getValues();
      if (termData.length > 1) {
        Logger.log('Merging data from Term subsheet');
        const termRows = termData.slice(1); // Skip header row

        for (const row of termRows) {
          const batch = (row[0] || '').toString().trim();
          const term = (row[1] || '').toString().trim();
          const domain = (row[2] || '').toString().trim();
          const subject = (row[3] || '').toString().trim();

          if (!batch) continue;

          batchSet.add(batch);

          if (term) {
            if (!termMap.has(batch)) {
              termMap.set(batch, new Set());
            }
            termMap.get(batch).add(term);

            if (domain) {
              const domainKey = `${batch}|${term}`;
              if (!domainMap.has(domainKey)) {
                domainMap.set(domainKey, new Set());
              }
              domainMap.get(domainKey).add(domain);

              if (subject) {
                const subjectKey = `${batch}|${term}|${domain}`;
                if (!subjectMap.has(subjectKey)) {
                  subjectMap.set(subjectKey, new Set());
                }
                subjectMap.get(subjectKey).add(subject);
              }
            }
          }
        }
      }
    }

    // Convert Sets to sorted Arrays
    const result = {
      batches: [],
      terms: {},
      domains: {},
      subjects: {},
      sessions: {}
    };

    // Convert Sets to sorted Arrays
    result.batches = Array.from(batchSet).sort();

    // Build terms object
    termMap.forEach((terms, batch) => {
      result.terms[batch] = Array.from(terms).sort();
    });

    // Build domains object
    domainMap.forEach((domains, key) => {
      const [batch, term] = key.split('|');
      if (!result.domains[batch]) {
        result.domains[batch] = {};
      }
      result.domains[batch][term] = Array.from(domains).sort();
    });

    // Build subjects object
    subjectMap.forEach((subjects, key) => {
      const [batch, term, domain] = key.split('|');
      if (!result.subjects[batch]) {
        result.subjects[batch] = {};
      }
      if (!result.subjects[batch][term]) {
        result.subjects[batch][term] = {};
      }
      result.subjects[batch][term][domain] = Array.from(subjects).sort();
    });

    // Build sessions object
    sessionMap.forEach((sessions, key) => {
      const [batch, term, domain, subject] = key.split('|');
      if (!result.sessions[batch]) {
        result.sessions[batch] = {};
      }
      if (!result.sessions[batch][term]) {
        result.sessions[batch][term] = {};
      }
      if (!result.sessions[batch][term][domain]) {
        result.sessions[batch][term][domain] = {};
      }
      result.sessions[batch][term][domain][subject] = Array.from(sessions).sort();
    });

    return {
      success: true,
      data: result
    };

  } catch (error) {
    Logger.log('Error in getTermHierarchyData: ' + error.message);
    return {
      success: false,
      error: 'Failed to get hierarchy data: ' + error.message
    };
  }
}

/**
 * Fallback function to get hierarchy from Term subsheet
 */
function getTermSubsheetData() {
  try {
    Logger.log('Getting data from Term subsheet');

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const termSheet = spreadsheet.getSheetByName('Term');

    if (!termSheet) {
      return {
        success: true,
        data: {
          batches: [],
          terms: {},
          domains: {},
          subjects: {},
          sessions: {}
        }
      };
    }

    const data = termSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        data: {
          batches: [],
          terms: {},
          domains: {},
          subjects: {},
          sessions: {}
        }
      };
    }

    const rows = data.slice(1);
    const result = {
      batches: [],
      terms: {},
      domains: {},
      subjects: {},
      sessions: {}
    };

    const batchSet = new Set();
    const termMap = new Map();
    const domainMap = new Map();
    const subjectMap = new Map();

    for (const row of rows) {
      const batch = (row[0] || '').toString().trim();
      const term = (row[1] || '').toString().trim();
      const domain = (row[2] || '').toString().trim();
      const subject = (row[3] || '').toString().trim();

      if (!batch) continue;

      batchSet.add(batch);

      if (term) {
        if (!termMap.has(batch)) {
          termMap.set(batch, new Set());
        }
        termMap.get(batch).add(term);

        if (domain) {
          const domainKey = `${batch}|${term}`;
          if (!domainMap.has(domainKey)) {
            domainMap.set(domainKey, new Set());
          }
          domainMap.get(domainKey).add(domain);

          if (subject) {
            const subjectKey = `${batch}|${term}|${domain}`;
            if (!subjectMap.has(subjectKey)) {
              subjectMap.set(subjectKey, new Set());
            }
            subjectMap.get(subjectKey).add(subject);
          }
        }
      }
    }

    result.batches = Array.from(batchSet).sort();

    termMap.forEach((terms, batch) => {
      result.terms[batch] = Array.from(terms).sort();
    });

    domainMap.forEach((domains, key) => {
      const [batch, term] = key.split('|');
      if (!result.domains[batch]) {
        result.domains[batch] = {};
      }
      result.domains[batch][term] = Array.from(domains).sort();
    });

    subjectMap.forEach((subjects, key) => {
      const [batch, term, domain] = key.split('|');
      if (!result.subjects[batch]) {
        result.subjects[batch] = {};
      }
      if (!result.subjects[batch][term]) {
        result.subjects[batch][term] = {};
      }
      result.subjects[batch][term][domain] = Array.from(subjects).sort();
    });

    return {
      success: true,
      data: result
    };

  } catch (error) {
    Logger.log('Error in getTermSubsheetData: ' + error.message);
    return {
      success: false,
      error: 'Failed to get Term subsheet data: ' + error.message
    };
  }
}

/**
 * Get Zoom Access Token using Server-to-Server OAuth
 */
function getZoomAccessToken() {
  try {
    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_CONFIG.ACCOUNT_ID}`;
    const credentials = Utilities.base64Encode(ZOOM_CONFIG.CLIENT_ID + ':' + ZOOM_CONFIG.CLIENT_SECRET);

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());

    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error('No access token in response: ' + JSON.stringify(data));
    }
  } catch (error) {
    Logger.log('Error getting Zoom access token: ' + error.message);
    throw error;
  }
}

/**
 * Update Zoom Meeting via API
 */
function updateZoomMeeting(meetingId, updates) {
  try {
    const accessToken = getZoomAccessToken();

    const url = `https://api.zoom.us/v2/meetings/${meetingId}`;
    const options = {
      method: 'patch',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(updates),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    Logger.log(`Updated Zoom meeting ${meetingId}: ${response.getResponseCode()}`);
    return response.getResponseCode() === 204; // Zoom returns 204 on successful update
  } catch (error) {
    Logger.log(`Error updating Zoom meeting ${meetingId}: ` + error.message);
    return false;
  }
}

/**
 * Update a row in any Zoom sheet AND update the Zoom meeting via API
 */
function updateZoomSheetRow(sheetName, rowIndex, rowData) {
  try {
    Logger.log('Admin: Updating ' + sheetName + ' row ' + rowIndex);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return {
        success: false,
        error: 'Sheet not found: ' + sheetName
      };
    }

    // Convert rowData object to array based on sheet type
    let rowArray = [];

    if (sheetName === 'Create Zoom + Google Calendar') {
      rowArray = [
        rowData.checked || false,
        rowData.batch || '',
        rowData.term || '',
        rowData.domain || '',
        rowData.subject || '',
        rowData.sessionName || '',
        rowData.date || '',
        rowData.startTime || '',
        rowData.duration || '',
        rowData.agenda || '',
        rowData.sessionType || '',
        rowData.calendarEventId || '',
        rowData.meetingId || '',
        rowData.meetingPassword || '',
        rowData.joinUrl || ''
      ];
    } else if (sheetName === 'Zoom Live') {
      rowArray = [
        rowData.batch || '',
        rowData.term || '',
        rowData.domain || '',
        rowData.subject || '',
        rowData.sessionName || '',
        rowData.date || '',
        rowData.startTime || '',
        rowData.duration || '',
        rowData.zoomLiveLink || '',
        rowData.meetingId || '',
        rowData.meetingPassword || '',
        rowData.fullSynced || '',
        rowData.galleryView || '',
        rowData.speakerView || '',
        rowData.screenShareSpeaker || '',
        rowData.screenShareOnly || ''
      ];
    } else if (sheetName === 'Zoom Recordings') {
      rowArray = [
        rowData.batch || '',
        rowData.term || '',
        rowData.domain || '',
        rowData.subject || '',
        rowData.sessionName || '',
        rowData.date || '',
        rowData.startTime || '',
        rowData.duration || '',
        rowData.meetingId || '',
        rowData.meetingPassword || '',
        rowData.manualDownload || '',
        rowData.speakerViewLink || '',
        rowData.galleryViewLink || '',
        rowData.screenShareLink || '',
        rowData.activeSpeakerLink || '',
        rowData.transcriptLink || '',
        rowData.audioLink || '',
        rowData.chatLink || '',
        rowData.publish || ''
      ];
    }

    // Update the row in Google Sheet
    const range = sheet.getRange(rowIndex, 1, 1, rowArray.length);
    range.setValues([rowArray]);

    // If updating "Create Zoom + Google Calendar" and meetingId exists, update the Zoom meeting via API
    if (sheetName === 'Create Zoom + Google Calendar' && rowData.meetingId) {
      try {
        Logger.log(`Updating Zoom meeting ${rowData.meetingId} via API`);

        // Parse date and time to create ISO 8601 format for Zoom
        const dateStr = rowData.date; // Expected format: "dd-MMM-yyyy" or similar
        const startTimeStr = rowData.startTime; // Expected format: "HH:mm"

        // Create Zoom API update payload
        const zoomUpdates = {
          topic: `${rowData.batch} - ${rowData.subject} x ${rowData.sessionName}`,
          agenda: `Batch: ${rowData.batch}\nTerm: ${rowData.term}\nDomain: ${rowData.domain}\nSubject: ${rowData.subject}\nSession: ${rowData.sessionName}`,
          duration: parseInt(rowData.duration) || 60
        };

        // If date and time are provided, update start_time
        if (dateStr && startTimeStr) {
          try {
            // Parse the date and time
            const dateObj = new Date(dateStr);
            const [hours, minutes] = startTimeStr.split(':');
            dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Format to ISO 8601 for Zoom API
            const zoomStartTime = Utilities.formatDate(
              dateObj,
              TIMEZONE,
              "yyyy-MM-dd'T'HH:mm:ss"
            );
            zoomUpdates.start_time = zoomStartTime;
            zoomUpdates.timezone = 'Asia/Kolkata';
          } catch (dateError) {
            Logger.log('Warning: Could not parse date/time for Zoom update: ' + dateError.message);
          }
        }

        // Call the Zoom API
        const zoomUpdateSuccess = updateZoomMeeting(rowData.meetingId, zoomUpdates);

        if (zoomUpdateSuccess) {
          Logger.log('✅ Zoom meeting updated successfully via API');
        } else {
          Logger.log('⚠️ Zoom meeting update failed, but sheet was updated');
        }
      } catch (zoomError) {
        Logger.log('Error updating Zoom meeting via API: ' + zoomError.message);
        // Continue anyway - sheet was updated successfully
      }
    }

    return {
      success: true,
      message: 'Row and Zoom meeting updated successfully'
    };

  } catch (error) {
    Logger.log('Error in updateZoomSheetRow: ' + error.message);
    return {
      success: false,
      error: 'Failed to update row: ' + error.message
    };
  }
}

/**
 * Delete a row from any Zoom sheet
 */
function deleteZoomSheetRow(sheetName, rowIndex) {
  try {
    Logger.log('Admin: Deleting ' + sheetName + ' row ' + rowIndex);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return {
        success: false,
        error: 'Sheet not found: ' + sheetName
      };
    }

    sheet.deleteRow(rowIndex);

    return {
      success: true,
      message: 'Row deleted successfully'
    };

  } catch (error) {
    Logger.log('Error in deleteZoomSheetRow: ' + error.message);
    return {
      success: false,
      error: 'Failed to delete row: ' + error.message
    };
  }
}

// ==================== NOTES FUNCTIONS ====================

/**
 * Get notes for a specific session
 * @param {string} studentId - Student ID
 * @param {string} sessionId - Meeting ID
 * @return {Object} Note data or null
 */
function getSessionNotes(studentId, sessionId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = ss.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();
    const notes = [];

    // Find ALL notes for this student and session (skip header row) - THREADED
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === studentId && row[10] === sessionId) {  // Student Email (B), Meeting ID (K)
        notes.push({
          noteId: row[0],
          studentEmail: row[1],
          studentName: row[2],
          batch: row[3],
          term: row[4],
          domain: row[5],
          subject: row[6],
          sessionName: row[7],
          date: row[8],
          startTime: row[9],
          meetingId: row[10],
          noteTitle: row[11],        // NEW - Column L
          noteContent: row[12],      // Column M
          images: row[13],           // NEW - Column N (comma-separated URLs)
          timestamp: row[14],        // Column O
          lastModified: row[15],     // Column P
          isPinned: row[16],         // Column Q
          tags: row[17]              // Column R (comma-separated tags)
        });
      }
    }

    // Return all notes (empty array if none found)
    return {
      success: true,
      data: notes
    };

  } catch (error) {
    Logger.log('Error in getSessionNotes: ' + error.message);
    return {
      success: false,
      error: 'Failed to get notes: ' + error.message
    };
  }
}

/**
 * Save a NEW session note (threaded - always appends, never updates)
 * @param {Object} noteData - Note data object with title, content, images
 * @return {Object} Success response
 */
function saveSessionNote(noteData) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = ss.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    // Decode note content if it's base64 encoded
    let noteContent = noteData.noteContent || '';
    if (noteData.isContentEncoded) {
      try {
        noteContent = Utilities.newBlob(Utilities.base64Decode(noteContent)).getDataAsString();
        Logger.log('Decoded note content from base64');
      } catch (decodeError) {
        Logger.log('Error decoding note content: ' + decodeError.message);
        // Use original content if decode fails
      }
    }

    // Use formatted timestamp from frontend if provided, otherwise create new one
    const now = noteData.timestamp || formatTimestampForSheets();

    // Create Drive folder structure: Batch > Term > Domain > Subject > Session > Student
    let studentFolderId = '';
    let studentFolderUrl = '';
    try {
      const notesMainFolder = DriveApp.getFolderById(NOTES_DRIVE_FOLDER_ID);
      const batchFolder = getOrCreateFolder(notesMainFolder, noteData.batch);
      const termFolder = getOrCreateFolder(batchFolder, noteData.term);
      const domainFolder = getOrCreateFolder(termFolder, noteData.domain);
      const subjectFolder = getOrCreateFolder(domainFolder, noteData.subject);
      const sessionFolder = getOrCreateFolder(subjectFolder, noteData.sessionName);
      const studentFolder = getOrCreateFolder(sessionFolder, noteData.studentEmail);
      studentFolderId = studentFolder.getId();
      studentFolderUrl = studentFolder.getUrl();
      Logger.log(`Created student folder for notes: ${studentFolderUrl}`);
    } catch (folderError) {
      Logger.log('Warning: Could not create folder structure: ' + folderError.message);
    }

    // Handle image uploads if provided
    let imageLinks = '';
    if (noteData.images && noteData.images.length > 0) {
      try {
        const uploadedLinks = [];
        const studentFolder = DriveApp.getFolderById(studentFolderId);

        for (let i = 0; i < noteData.images.length; i++) {
          const imageData = noteData.images[i];
          // imageData format: { data: base64String, name: fileName, mimeType: mimeType }

          // Step 1: Upload to ImgBB for public display (primary method)
          const imgbbResult = uploadToImgBB(imageData.data, imageData.name);
          let publicUrl = null;

          if (imgbbResult.success) {
            publicUrl = imgbbResult.data.display_url;
            Logger.log('ImgBB upload successful for note image: ' + publicUrl);
          } else {
            Logger.log('ImgBB upload failed, using Google Drive fallback: ' + imgbbResult.error);
          }

          // Step 2: Upload to Google Drive for backup (always do this)
          const blob = Utilities.newBlob(
            Utilities.base64Decode(imageData.data),
            imageData.mimeType,
            imageData.name
          );
          const file = studentFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

          // Get file ID for Google Drive fallback URLs
          const fileId = file.getId();
          const driveUrl = 'https://lh3.googleusercontent.com/d/' + fileId + '=w2000';

          // Use ImgBB URL as primary, Google Drive as fallback
          const finalUrl = publicUrl || driveUrl;
          uploadedLinks.push(finalUrl);
          Logger.log('Note image URL (final): ' + finalUrl);
        }
        imageLinks = uploadedLinks.join(',');
      } catch (imageError) {
        Logger.log('Error uploading images: ' + imageError.message);
      }
    }

    // ALWAYS CREATE NEW NOTE (threaded approach)
    const noteId = `${noteData.studentEmail}_${noteData.sessionId}_${Date.now()}`;

    // Convert tags array to comma-separated string
    const tagsString = noteData.tags && Array.isArray(noteData.tags)
      ? noteData.tags.join(',')
      : '';

    // 18 columns: Note ID, Student Email, Student Name, Batch, Term, Domain, Subject,
    // Session Name, Date, Start Time, Meeting ID, Note Title, Note Content, Images,
    // Timestamp, Last Modified, Is Pinned, Tags
    const newRow = [
      noteId,
      noteData.studentEmail || '',
      noteData.studentName || '',
      noteData.batch || '',
      noteData.term || '',
      noteData.domain || '',
      noteData.subject || '',
      noteData.sessionName || '',
      noteData.date || '',
      noteData.startTime || '',
      noteData.sessionId || '',
      noteData.noteTitle || '',       // NEW: Note title/header
      noteContent,                    // Note content with checkboxes (decoded if encoded)
      imageLinks,                     // NEW: Comma-separated image URLs
      now,                            // Timestamp
      now,                            // Last modified
      noteData.isPinned || 'No',      // Is Pinned
      tagsString,                     // Tags (comma-separated)
      noteData.type || 'Live'         // Type: Live or Recording
    ];

    notesSheet.appendRow(newRow);

    return {
      success: true,
      message: 'Note created successfully',
      data: {
        noteId,
        folderUrl: studentFolderUrl,
        timestamp: now
      }
    };

  } catch (error) {
    Logger.log('Error in saveSessionNote: ' + error.message);
    return {
      success: false,
      error: 'Failed to save note: ' + error.message
    };
  }
}

/**
 * Get all notes for a student
 * @param {string} studentId - Student ID
 * @return {Object} Array of notes
 */
function getAllStudentNotes(studentId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = ss.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();
    const notes = [];

    // Column mapping for Notes sheet:
    // A=0: Note ID, B=1: Student Email, C=2: Student Name, D=3: Batch,
    // E=4: Term, F=5: Domain, G=6: Subject, H=7: Session Name,
    // I=8: Date, J=9: Start Time, K=10: Meeting ID, L=11: Note Title,
    // M=12: Note Content, N=13: Images, O=14: Timestamp, P=15: Last Modified,
    // Q=16: Is Pinned, R=17: Tags, S=18: Type

    // Get all notes for this student (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === studentId) {  // Student Email column (B)
        notes.push({
          noteId: row[0],           // A: Note ID
          studentEmail: row[1],     // B: Student Email
          studentName: row[2],      // C: Student Name
          batch: row[3],            // D: Batch
          term: row[4],             // E: Term
          domain: row[5],           // F: Domain
          subject: row[6],          // G: Subject
          sessionName: row[7],      // H: Session Name
          date: row[8],             // I: Date
          startTime: row[9],        // J: Start Time
          sessionId: row[10],       // K: Meeting ID (used as sessionId)
          meetingId: row[10],       // K: Meeting ID
          noteTitle: row[11],       // L: Note Title
          noteContent: row[12],     // M: Note Content
          images: row[13],          // N: Images
          timestamp: row[14],       // O: Timestamp
          lastModified: row[15],    // P: Last Modified
          isPinned: row[16],        // Q: Is Pinned
          noteTags: row[17],        // R: Tags
          type: row[18]             // S: Type
        });
      }
    }

    // Sort: Pinned first, then by last modified (newest first)
    notes.sort((a, b) => {
      if (a.isPinned === 'Yes' && b.isPinned !== 'Yes') return -1;
      if (a.isPinned !== 'Yes' && b.isPinned === 'Yes') return 1;
      return new Date(b.lastModified) - new Date(a.lastModified);
    });

    return {
      success: true,
      data: notes
    };

  } catch (error) {
    Logger.log('Error in getAllStudentNotes: ' + error.message);
    return {
      success: false,
      error: 'Failed to get notes: ' + error.message
    };
  }
}

/**
 * Toggle pin status of a note
 * @param {string} noteId - Note ID
 * @return {Object} Success response
 */
function togglePinNote(noteId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const notesSheet = ss.getSheetByName(NOTES_SHEET);

    if (!notesSheet) {
      return {
        success: false,
        error: 'Notes sheet not found'
      };
    }

    const data = notesSheet.getDataRange().getValues();
    const MAX_PINS_PER_SESSION = 10;

    // Find note by ID and get session info
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === noteId) {  // Note ID column
        const currentPinStatus = row[16];  // Column Q (Is Pinned)
        const studentEmail = row[1];  // Column B
        const sessionId = row[10];  // Column K (Meeting ID)

        // If trying to pin (not unpin), check the limit per session
        if (currentPinStatus !== 'Yes') {
          // Count currently pinned notes for this student in this session
          let pinnedCount = 0;
          for (let j = 1; j < data.length; j++) {
            const checkRow = data[j];
            if (checkRow[1] === studentEmail && checkRow[10] === sessionId && checkRow[16] === 'Yes') {
              pinnedCount++;
            }
          }

          // Check if limit reached
          if (pinnedCount >= MAX_PINS_PER_SESSION) {
            return {
              success: false,
              error: `Maximum ${MAX_PINS_PER_SESSION} pinned notes per session reached. Unpin a note first.`
            };
          }
        }

        const newPinStatus = currentPinStatus === 'Yes' ? 'No' : 'Yes';
        notesSheet.getRange(i + 1, 17).setValue(newPinStatus);  // Update Is Pinned column (column Q)

        return {
          success: true,
          message: 'Note pin status updated',
          data: { isPinned: newPinStatus }
        };
      }
    }

    return {
      success: false,
      error: 'Note not found'
    };

  } catch (error) {
    Logger.log('Error in togglePinNote: ' + error.message);
    return {
      success: false,
      error: 'Failed to toggle pin: ' + error.message
    };
  }
}

// ============================================================================
// FORMS MANAGEMENT API
// ============================================================================

/**
 * SSB FORMS MANAGEMENT API
 * Dynamic form engine with student data integration
 *
 * Features:
 * - CRUD operations for forms, questions, options
 * - Auto-populate user data (email, name, batch) from Student Data
 * - Response submission and retrieval
 * - Form validation and conditional logic
 * - Blocking forms (show at start until filled)
 */

// ==================== CONFIGURATION ====================

const FORMS_API_CONFIG = {
  SHEET_ID: "1b5MrRFysC3zf8ftsGJcjhUEjh5P3Q20fYAconTBm824",

  SHEETS: {
    FORMS: "Forms",
    QUESTIONS: "Form_Questions",
    OPTIONS: "Form_Question_Options",
    RESPONSES: "Form_Responses",
    CONDITIONAL_LOGIC: "Form_Conditional_Logic",  // ✅ Already defined
    STUDENT_DATA: "Student Data"
  },

  MAIN_DRIVE_FOLDER_ID: "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD",
  TIMEZONE: "Asia/Kolkata"
};

/**
 * GOOGLE SHEETS SCHEMA FOR FORM_QUESTIONS
 * ========================================
 *
 * The Form_Questions sheet must have the following columns to support all 34 question types:
 *
 * BASIC FIELDS (A-AB):
 * A  - Question_ID
 * B  - Form_ID
 * C  - Question_Order
 * D  - Question_Type
 * E  - Question_Text
 * F  - Question_Description
 * G  - Is_Required (Yes/No)
 * H  - Placeholder_Text
 * I  - Validation_Type
 * J  - Validation_Pattern
 * K  - Validation_Message
 * L  - Min_Length
 * M  - Max_Length
 * N  - Min_Value
 * O  - Max_Value
 * P  - Min_Selections
 * Q  - Max_Selections
 * R  - Allow_Other_Option (Yes/No)
 * S  - File_Types_Allowed
 * T  - Max_File_Size_MB
 * U  - Scale_Start
 * V  - Scale_End
 * W  - Scale_Start_Label
 * X  - Scale_End_Label
 * Y  - Conditional_Logic_ID
 * Z  - Created_At
 * AA - Updated_At
 * AB - Notes
 *
 * NEW FIELDS FOR ALL 34 QUESTION TYPES (AC-BI):
 * AC - Randomize_Options (Yes/No)
 * AD - Allow_Multiple_Selections (Yes/No)
 * AE - Selection_Limit_Type (unlimited/exact/range)
 * AF - Collect_Name (Yes/No) - Contact Info
 * AG - Collect_Email (Yes/No) - Contact Info
 * AH - Collect_Phone (Yes/No) - Contact Info
 * AI - Collect_Address (Yes/No) - Contact Info
 * AJ - Rating_Type (star/heart/smiley) - Rating
 * AK - Rating_Scale (1-10) - Rating
 * AL - Scale_Min - Opinion Scale/NPS
 * AM - Scale_Max - Opinion Scale/NPS
 * AN - Scale_Min_Label - Opinion Scale
 * AO - Scale_Max_Label - Opinion Scale/NPS
 * AP - Scale_Mid_Label - Opinion Scale
 * AQ - Matrix_Rows (JSON) - Matrix
 * AR - Matrix_Columns (JSON) - Matrix
 * AS - Matrix_Type (single/multiple) - Matrix
 * AT - Date_Format (MM/DD/YYYY, etc.) - Date
 * AU - Restrict_Past_Dates (Yes/No) - Date
 * AV - Restrict_Future_Dates (Yes/No) - Date
 * AW - Media_URL - Video/Audio/Statement
 * AX - Media_Type (video/audio/image/none) - Video/Audio
 * AY - Autoplay (Yes/No) - Video/Audio
 * AZ - Stripe_Amount - Stripe Payment
 * BA - Stripe_Currency - Stripe Payment
 * BB - Drive_Type (file/folder) - Google Drive
 * BC - Calendly_URL - Calendly
 * BD - AI_Context - Clarify with AI
 * BE - AI_FAQ_Data - FAQ with AI
 * BF - Redirect_URL - Redirect to URL
 * BG - Redirect_Delay (seconds) - Redirect to URL
 * BH - Statement_Content - Statement
 * BI - Grouped_Question_IDs (JSON) - Question Group
 *
 * To update your Google Sheet:
 * 1. Open the spreadsheet: https://docs.google.com/spreadsheets/d/1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk
 * 2. Go to the "Form_Questions" sheet
 * 3. Add the new column headers (AC through BI) in row 1
 * 4. The backend will automatically populate these columns when creating/updating questions
 */

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get student data by email
 * Fetches name and batch from Student Data sheet
 * @param {string} email - User email
 * @returns {Object} {name, batch, email}
 */
function getStudentDataByEmail(email) {
  try {
    Logger.log(`📋 Looking up student data for: ${email}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const studentSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.STUDENT_DATA);

    if (!studentSheet) {
      Logger.log('⚠️ Student Data sheet not found');
      return {
        success: false,
        error: 'Student Data sheet not found',
        data: { email: email, name: email, batch: 'Unknown' }
      };
    }

    const data = studentSheet.getDataRange().getValues();

    // Student Data columns: Student Email (A), Full Name (B), Roll No (C), Batch (D)
    // Find student by email
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEmail = row[0]; // Column A - Student Email (0-indexed: 0)

      if (rowEmail && rowEmail.toLowerCase() === email.toLowerCase()) {
        Logger.log(`✅ Found student: ${row[1]}`);
        return {
          success: true,
          data: {
            email: rowEmail,
            name: row[1] || email,      // Column B - Full Name
            rollNo: row[2] || '',        // Column C - Roll No
            batch: row[3] || 'Unknown'  // Column D - Batch
          }
        };
      }
    }

    Logger.log('⚠️ Student not found in database');
    return {
      success: false,
      error: 'Student not found',
      data: { email: email, name: email, batch: 'Unknown' }
    };

  } catch (error) {
    Logger.log(`❌ Error getting student data: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: { email: email, name: email, batch: 'Unknown' }
    };
  }
}

/**
 * Format timestamp
 */
function formatFormsTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, FORMS_API_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
}

/**
 * Generate unique ID
 */
function generateFormsId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

// ==================== GOOGLE DRIVE FOLDER MANAGEMENT ====================

/**
 * Get or create folder in Drive
 * @param {Folder} parentFolder - Parent folder object
 * @param {string} folderName - Name of folder to get/create
 * @returns {Folder} Folder object
 */
/**
 * Helper function to get or create a folder
 * @param {Folder} parentFolder - Parent folder object
 * @param {string} folderName - Name of folder to get or create
 * @returns {Folder} The folder object
 */
function getOrCreateFolderForms(parentFolder, folderName) {
  try {
    console.log(`📂 Checking for folder: ${folderName}`);
    console.log(`📂 Parent folder ID: ${parentFolder.getId()}`);
    console.log(`📂 Parent folder name: ${parentFolder.getName()}`);

    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      const existingFolder = folders.next();
      console.log(`✅ Found existing folder: ${folderName} (${existingFolder.getId()})`);
      return existingFolder;
    }

    console.log(`📁 Creating new folder: ${folderName}`);
    const newFolder = parentFolder.createFolder(folderName);
    console.log(`✅ Created folder: ${folderName} (${newFolder.getId()})`);
    return newFolder;
  } catch (error) {
    console.log(`❌ Error getting/creating folder ${folderName}: ${error.message}`);
    console.log(`❌ Error stack: ${error.stack}`);
    console.log(`❌ Error toString: ${error.toString()}`);
    throw error;
  }
}

function getOrCreateFormFolder(parentFolder, folderName) {
  // Use the Forms-specific function
  return getOrCreateFolderForms(parentFolder, folderName);
}

/**
 * Create form folder structure in Google Drive
 * Hierarchy: Batch > Forms > Term (optional) > Domain (optional) > Subject (optional) > Form_Name
 *
 * Inside Form folder:
 * - Response Sheet (auto-created Google Sheet with Form_ID column)
 * - Uploaded Files (if form creator uploads attachments)
 * - Attachments (if form requires student attachments)
 *   - Student_Name (individual student folders)
 *
 * @param {Object} params - {batch, term, domain, subject, formName, createdBy}
 * @returns {Object} {success, formFolder, responsesSheetUrl, uploadedFilesFolder, attachmentsFolder}
 */
function createFormFolderStructure(params) {
  const debugLogs = [];
  try {
    const { batch, term, domain, subject, formName, createdBy } = params;

    debugLogs.push(`📁 Creating folder structure for form: ${formName}`);

    // Build path for logging
    let pathParts = [batch, 'Forms'];
    if (term && term.trim() !== '') pathParts.push(term);
    if (domain && domain.trim() !== '') pathParts.push(domain);
    if (subject && subject.trim() !== '') pathParts.push(subject);
    pathParts.push(formName);
    debugLogs.push(`Path: ${pathParts.join('/')}`);

    // Validate folder ID
    if (!FORMS_API_CONFIG.MAIN_DRIVE_FOLDER_ID) {
      debugLogs.push('❌ MAIN_DRIVE_FOLDER_ID is not configured');
      return {
        success: false,
        error: 'Drive folder configuration is missing. Please contact administrator.',
        debugLogs: debugLogs
      };
    }

    debugLogs.push(`📂 Accessing main folder: ${FORMS_API_CONFIG.MAIN_DRIVE_FOLDER_ID}`);

    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(FORMS_API_CONFIG.MAIN_DRIVE_FOLDER_ID);
      debugLogs.push(`✅ Successfully accessed main folder: ${mainFolder.getName()}`);
    } catch (folderError) {
      debugLogs.push(`❌ Error accessing main folder: ${folderError.message}`);
      debugLogs.push(`❌ Error name: ${folderError.name}`);
      debugLogs.push(`❌ Error stack: ${folderError.stack}`);
      return {
        success: false,
        error: `Cannot access Drive folder. Error: ${folderError.message}`,
        debugLogs: debugLogs
      };
    }

    // Navigate/Create: Batch
    debugLogs.push(`📁 Creating/accessing batch folder: ${batch}`);
    let batchFolder;
    try {
      batchFolder = getOrCreateFormFolder(mainFolder, batch);
      debugLogs.push(`✅ Batch folder ready: ${batchFolder.getName()}`);
    } catch (batchError) {
      debugLogs.push(`❌ Error creating batch folder: ${batchError.message}`);
      debugLogs.push(`❌ Error name: ${batchError.name}`);
      debugLogs.push(`❌ Error stack: ${batchError.stack}`);
      return {
        success: false,
        error: `Failed to create batch folder. Error: ${batchError.message}`,
        debugLogs: debugLogs
      };
    }

    // Navigate/Create: Forms folder (new intermediate level)
    Logger.log(`📁 Creating/accessing Forms folder`);
    let formsFolder;
    try {
      formsFolder = getOrCreateFormFolder(batchFolder, 'Forms');
      Logger.log(`✅ Forms folder ready`);
    } catch (formsError) {
      Logger.log(`❌ Error creating Forms folder: ${formsError.message}`);
      return {
        success: false,
        error: `Failed to create Forms folder. Error: ${formsError.message}`
      };
    }

    // Navigate/Create: Term (optional)
    let currentFolder = formsFolder;
    if (term && term.trim() !== '') {
      Logger.log(`📁 Creating/accessing Term folder: ${term}`);
      try {
        currentFolder = getOrCreateFormFolder(currentFolder, term);
        Logger.log(`✅ Term folder ready`);
      } catch (termError) {
        Logger.log(`❌ Error creating Term folder: ${termError.message}`);
        return {
          success: false,
          error: `Failed to create Term folder. Error: ${termError.message}`
        };
      }
    }

    // Navigate/Create: Domain (if specified)
    if (domain && domain.trim() !== '') {
      Logger.log(`📁 Creating/accessing Domain folder: ${domain}`);
      try {
        currentFolder = getOrCreateFormFolder(currentFolder, domain);
        Logger.log(`✅ Domain folder ready`);
      } catch (domainError) {
        Logger.log(`❌ Error creating Domain folder: ${domainError.message}`);
        return {
          success: false,
          error: `Failed to create Domain folder. Error: ${domainError.message}`
        };
      }

      // Navigate/Create: Subject (if specified and domain exists)
      if (subject && subject.trim() !== '') {
        Logger.log(`📁 Creating/accessing Subject folder: ${subject}`);
        try {
          currentFolder = getOrCreateFormFolder(currentFolder, subject);
          Logger.log(`✅ Subject folder ready`);
        } catch (subjectError) {
          Logger.log(`❌ Error creating Subject folder: ${subjectError.message}`);
          return {
            success: false,
            error: `Failed to create Subject folder. Error: ${subjectError.message}`
          };
        }
      }
    }

    // Create: Form folder
    Logger.log(`📁 Creating form folder: ${formName}`);
    let formFolder;
    try {
      formFolder = getOrCreateFormFolder(currentFolder, formName);
      Logger.log(`✅ Form folder created: ${formFolder.getUrl()}`);
    } catch (formFolderError) {
      Logger.log(`❌ Error creating form folder: ${formFolderError.message}`);
      return {
        success: false,
        error: `Failed to create form folder. Error: ${formFolderError.message}`
      };
    }

    // Create: Response Sheet inside form folder
    Logger.log(`📊 Creating response sheet`);
    let responseSheet, responseFile;
    try {
      responseSheet = SpreadsheetApp.create(`${formName} - Responses`);
      responseFile = DriveApp.getFileById(responseSheet.getId());
      Logger.log(`✅ Response sheet created`);
    } catch (sheetError) {
      Logger.log(`❌ Error creating response sheet: ${sheetError.message}`);
      return {
        success: false,
        error: `Failed to create response sheet. Error: ${sheetError.message}`
      };
    }

    // Move response sheet to form folder
    responseFile.moveTo(formFolder);

    // Set up response sheet headers
    const sheet = responseSheet.getActiveSheet();
    const headers = [
      'Response_ID',           // A
      'Form_ID',              // B
      'User_Email',           // C
      'User_Name',            // D
      'User_Batch',           // E
      'Submission_DateTime',  // F
      'Response_JSON',        // G - Keep JSON for backup/complex answers
      'IP_Address',           // H
      'Completion_Time_Seconds', // I
      'Is_Complete',          // J
      'Last_Modified_At',     // K
      'Device_Type',          // L
      'Notes',                // M
      'Updated'               // N - 'Yes' for 2nd+ submissions
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Create: Uploaded Files folder (for admin attachments)
    const uploadedFilesFolder = getOrCreateFormFolder(formFolder, 'Uploaded Files');

    // Create: Attachments folder (for student submissions)
    const attachmentsFolder = getOrCreateFormFolder(formFolder, 'Attachments');

    Logger.log(`✅ Form folder structure created successfully`);
    Logger.log(`Form Folder: ${formFolder.getUrl()}`);
    Logger.log(`Response Sheet: ${responseSheet.getUrl()}`);

    return {
      success: true,
      formFolderUrl: formFolder.getUrl(),
      formFolderId: formFolder.getId(),
      responsesSheetUrl: responseSheet.getUrl(),
      responsesSheetId: responseSheet.getId(),
      uploadedFilesFolderId: uploadedFilesFolder.getId(),
      attachmentsFolderId: attachmentsFolder.getId()
    };

  } catch (error) {
    Logger.log(`❌ Error creating form folder structure: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload file to form's Uploaded Files folder
 * @param {string} formFolderId - Form folder ID
 * @param {string} fileName - File name
 * @param {string} fileData - Base64 encoded file data
 * @param {string} mimeType - MIME type
 * @returns {Object} {success, fileUrl, fileId}
 */
function uploadFileToFormFolder(formFolderId, fileName, fileData, mimeType) {
  try {
    Logger.log(`📤 Uploading file to form folder: ${fileName}`);

    const formFolder = DriveApp.getFolderById(formFolderId);
    const uploadedFilesFolder = getOrCreateFormFolder(formFolder, 'Uploaded Files');

    // Decode base64 file data
    const binaryData = Utilities.base64Decode(fileData);
    const blob = Utilities.newBlob(binaryData, mimeType, fileName);

    // Create file
    const file = uploadedFilesFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log(`✅ File uploaded: ${file.getUrl()}`);

    return {
      success: true,
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      fileName: file.getName()
    };

  } catch (error) {
    Logger.log(`❌ Error uploading file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload student attachment to form's Uploaded Files folder
 * Creates student-specific subfolder
 * @param {string} formFolderId - Form folder ID
 * @param {string} studentName - Student name
 * @param {string} fileName - File name
 * @param {string} fileData - Base64 encoded file data
 * @param {string} mimeType - MIME type
 * @returns {Object} {success, fileUrl, fileId}
 */
function uploadStudentAttachmentForms(formFolderId, studentName, fileName, fileData, mimeType) {
  try {
    Logger.log(`📎 Uploading student file: ${studentName}/${fileName}`);

    const formFolder = DriveApp.getFolderById(formFolderId);
    const uploadedFilesFolder = getOrCreateFolderForms(formFolder, 'Uploaded Files');
    const studentFolder = getOrCreateFolderForms(uploadedFilesFolder, studentName);

    // Decode base64 file data
    const binaryData = Utilities.base64Decode(fileData);
    const blob = Utilities.newBlob(binaryData, mimeType, fileName);

    // Create file
    const file = studentFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log(`✅ Attachment uploaded: ${file.getUrl()}`);

    return {
      success: true,
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      fileName: file.getName()
    };

  } catch (error) {
    Logger.log(`❌ Error uploading attachment: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FORMS CRUD ====================

/**
 * Parse DD/MM/YYYY date format to JavaScript Date object
 * @param {string} dateStr - Date string in DD/MM/YYYY HH:MM:SS format
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
function parseDDMMYYYY(dateStr) {
  if (!dateStr) return null;

  try {
    // Format: DD/MM/YYYY HH:MM:SS or DD/MM/YYYY
    const parts = dateStr.trim().split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';

    const [day, month, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // JavaScript months are 0-indexed
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours) || 0,
      parseInt(minutes) || 0,
      parseInt(seconds) || 0
    );
  } catch (error) {
    Logger.log(`⚠️ Error parsing date: ${dateStr} - ${error.message}`);
    return null;
  }
}

/**
 * Get all forms with optional filters
 * @param {Object} filters - {batch, isActive, showInTab, userEmail}
 * @returns {Object} {success, data: [forms]}
 */
function getForms(filters) {
  try {
    Logger.log('📚 Getting forms...');

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);

    const data = sheet.getDataRange().getValues();
    const forms = [];

    // Get user batch if userEmail is provided
    let userBatch = null;
    if (filters && filters.userEmail) {
      const studentData = getStudentDataByEmail(filters.userEmail);
      if (studentData.success) {
        userBatch = studentData.data.batch;
      }
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if status is not Published (UNLESS includeAllStatuses is true for admin)
      if (!filters?.includeAllStatuses && row[31] !== 'Published') continue; // AF - Status

      // Apply filters
      if (filters) {
        if (filters.isActive === 'Yes' && row[16] !== 'Yes') continue; // Q - Is_Active
        if (filters.showInTab === 'Yes' && row[18] !== 'Yes') continue; // S - Show_In_Tab
        if (filters.showAtStartUntilFilled === 'Yes' && row[17] !== 'Yes') continue; // R - Show_At_Start_Until_Filled

        // Batch filtering - show forms for user's batch
        const formBatch = row[1]; // B - Batch

        if (userBatch) {
          // Skip if form batch doesn't match user's batch (unless empty/not set)
          if (formBatch && formBatch.trim() !== '' && formBatch !== userBatch) {
            continue;
          }
        } else if (filters.batch) {
          // Admin/specific batch filter
          if (formBatch && formBatch.trim() !== '' && formBatch !== filters.batch) {
            continue;
          }
        }
      }

      // NOTE: Date filtering removed - frontend will handle expired/upcoming status
      // The frontend's getFormStatus() function checks dates and shows forms in appropriate tabs
      // (Available, Expired, Upcoming, Completed)

      const form = {
        id: row[0],                          // A - Form_ID
        batch: row[1],                       // B - Batch
        term: row[2],                        // C - Term
        domain: row[3],                      // D - Domain
        subject: row[4],                     // E - Subject
        name: row[5],                        // F - Form_Name
        description: row[6],                 // G - Form_Description
        type: row[7],                        // H - Form_Type
        createdBy: row[8],                   // I - Created_By
        createdAt: row[9],                   // J - Created_At
        startDateTime: row[10],              // K - Start_DateTime
        endDateTime: row[11],                // L - End_DateTime
        uploadedFile: row[12],               // M - Uploaded_File
        formFolderUrl: row[13],              // N - Drive_Link (frontend expects formFolderUrl)
        attachmentRequired: row[14],         // O - Attachment_Required
        responsesSheetUrl: row[15],          // P - Response_Sheet_Link (frontend expects responsesSheetUrl)
        isActive: row[16],                   // Q - Is_Active
        showAtStartUntilFilled: row[17],     // R - Show_At_Start_Until_Filled
        showInTab: row[18],                  // S - Show_In_Tab
        visibleTo: row[19],                  // T - Visible_To
        maxResponsesPerUser: row[20] || 1,   // U - Max_Responses_Per_User
        showResultsToRespondents: row[21],   // V - Show_Results_To_Respondents
        confirmationMessage: row[22],        // W - Thank_You_Message (frontend expects confirmationMessage)
        redirectUrl: row[23],                // X - Redirect_URL
        allowEditResponse: row[24],          // Y - Allow_Edit_Response
        allowStudentViewResponse: row[25],   // Z - Allow_Student_View_Response
        requireLogin: row[26],               // AA - Require_Login
        collectEmail: row[27],               // AB - Collect_Email
        totalResponses: (typeof row[28] === 'number' ? row[28] : 0),        // AC - Total_Responses (ensure it's a number)
        lastUpdatedAt: row[29],              // AD - Last_Updated_At
        lastUpdatedBy: row[30],              // AE - Last_Updated_By
        status: row[31],                     // AF - Status
        notes: row[32]                       // AG - Notes
      };

      // If userEmail is provided, check if user has completed this form
      if (filters && filters.userEmail) {
        form.userHasCompleted = checkUserHasSubmittedForm(row[0], filters.userEmail);
      }

      forms.push(form);
    }

    Logger.log(`✅ Found ${forms.length} forms`);

    return {
      success: true,
      data: forms
    };

  } catch (error) {
    Logger.log(`❌ Error getting forms: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get forms that require submission at startup (blocking forms)
 * @param {string} userEmail - User email
 * @returns {Object} {success, data: [forms], hasUnfilledRequiredForms}
 */
function getRequiredStartupForms(userEmail) {
  try {
    Logger.log(`🚪 Checking required startup forms for: ${userEmail}`);

    // Get all forms with Show_At_Start_Until_Filled = Yes
    const allFormsResult = getForms({
      userEmail: userEmail,
      isActive: 'Yes'
    });

    if (!allFormsResult.success) {
      return allFormsResult;
    }

    const requiredForms = allFormsResult.data.filter(form =>
      form.showAtStartUntilFilled === 'Yes'
    );

    if (requiredForms.length === 0) {
      return {
        success: true,
        data: [],
        hasUnfilledRequiredForms: false
      };
    }

    // Check which forms the user has already submitted
    const unfilledForms = [];

    for (const form of requiredForms) {
      const hasSubmitted = checkUserHasSubmittedForm(form.id, userEmail);
      if (!hasSubmitted) {
        unfilledForms.push(form);
      }
    }

    Logger.log(`✅ Found ${unfilledForms.length} unfilled required forms`);

    return {
      success: true,
      data: unfilledForms,
      hasUnfilledRequiredForms: unfilledForms.length > 0
    };

  } catch (error) {
    Logger.log(`❌ Error getting required startup forms: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user has submitted a form
 * @param {string} formId - Form ID
 * @param {string} userEmail - User email
 * @returns {boolean} true if submitted
 */
function checkUserHasSubmittedForm(formId, userEmail) {
  try {
    // Use the form-specific response sheet to check for submissions
    const responsesResult = getUserFormResponses(formId, userEmail);

    if (responsesResult.success && responsesResult.data) {
      // Check if any response is complete
      const completedResponses = responsesResult.data.filter(function(r) {
        return r.isComplete === 'Yes';
      });
      return completedResponses.length > 0;
    }

    return false;

  } catch (error) {
    Logger.log(`❌ Error checking form submission: ${error.message}`);
    return false;
  }
}

/**
 * Get form by ID with questions and options
 * @param {string} formId - Form ID
 * @returns {Object} {success, data: {form, questions}}
 */
function getFormById(formId) {
  try {
    Logger.log(`📄 Getting form: ${formId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);

    // Get form
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const formData = formSheet.getDataRange().getValues();

    let form = null;
    for (let i = 1; i < formData.length; i++) {
      if (formData[i][0] === formId) {
        const row = formData[i];
        form = {
          id: row[0],
          batch: row[1],
          term: row[2],
          domain: row[3],
          subject: row[4],
          name: row[5],
          description: row[6],
          type: row[7],
          createdBy: row[8],
          createdAt: row[9],
          startDate: row[10],  // Frontend expects startDate
          endDate: row[11],    // Frontend expects endDate
          uploadedFile: row[12],
          driveLink: row[13],
          attachmentRequired: row[14],
          responseSheetLink: row[15],
          isActive: row[16],
          showAtStartUntilFilled: row[17],
          showInTab: row[18],
          visibleTo: row[19],
          maxResponsesPerUser: row[20] || 1,
          showResultsToRespondents: row[21],
          confirmationMessage: row[22],  // Frontend expects confirmationMessage
          redirectUrl: row[23],
          allowEditResponse: row[24],
          requireLogin: row[25],
          collectEmail: row[26],
          totalResponses: row[27] || 0,
          lastUpdatedAt: row[28],
          lastUpdatedBy: row[29],
          status: row[30],
          notes: row[31],
          formFolderUrl: row[13],  // driveLink -> formFolderUrl for frontend
          responsesSheetUrl: row[15],  // responseSheetLink -> responsesSheetUrl for frontend
          notificationEmail: '',  // Not stored in backend yet
          allowMultipleSubmissions: (row[20] > 1) ? 'Yes' : 'No'  // Derived from maxResponsesPerUser
        };
        break;
      }
    }

    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    // Get questions
    const questions = getFormQuestions(formId);

    Logger.log(`✅ Form retrieved with ${questions.data.length} questions`);

    return {
      success: true,
      data: {
        form: form,
        questions: questions.data
      }
    };

  } catch (error) {
    Logger.log(`❌ Error getting form: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get questions for a form
 * @param {string} formId - Form ID
 * @returns {Object} {success, data: [questions with options]}
 */
function getFormQuestions(formId) {
  try {
    Logger.log(`❓ Getting questions for form: ${formId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const questionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);

    const questionData = questionSheet.getDataRange().getValues();
    const optionData = optionSheet.getDataRange().getValues();

    const questions = [];

    for (let i = 1; i < questionData.length; i++) {
      const row = questionData[i];

      if (row[1] !== formId) continue; // Form_ID

      const questionId = row[0];
      const questionType = row[3];

      // Get options for this question
      const options = [];
      for (let j = 1; j < optionData.length; j++) {
        const optRow = optionData[j];
        // Convert both to strings for comparison to handle any type mismatches
        const optionQuestionId = String(optRow[1]).trim();
        const currentQuestionId = String(questionId).trim();

        if (optionQuestionId === currentQuestionId) { // Question_ID match
          options.push({
            id: optRow[0],
            questionId: questionId,
            order: optRow[2],
            optionText: optRow[3],  // Frontend expects optionText
            optionValue: optRow[4], // Frontend expects optionValue
            hasImage: optRow[5],
            imageUrl: optRow[6],
            jumpToQuestionId: optRow[7],
            isCorrect: 'No'  // Frontend expects isCorrect
          });
        }
      }

      // Log if no options found for question types that should have options
      const optionTypes = ['Multiple Choice', 'Dropdown', 'Checkboxes', 'Picture Choice', 'Rating', 'Opinion Scale'];
      if (options.length === 0 && optionTypes.includes(questionType)) {
        Logger.log(`⚠️ Warning: No options found for ${questionType} question: ${questionId}`)
      }

      // Sort options by order
      options.sort((a, b) => a.order - b.order);

      // Get conditional logic rules for this question
      const conditionalRules = getConditionalRules(questionId);

      const question = {
        id: questionId,
        questionId: questionId,  // Also include questionId for frontend compatibility
        formId: row[1],
        order: row[2],
        questionOrder: row[2],  // Also include questionOrder for frontend compatibility
        questionType: questionType,  // Frontend expects questionType
        questionText: row[4],  // Frontend expects questionText
        helpText: row[5] || '',  // Frontend expects helpText (was description)
        questionDescription: row[5] || '',  // Also send as questionDescription for FormFillPage
        isRequired: row[6] === true || row[6] === 'TRUE' || row[6] === 'Yes' ? 'Yes' : 'No',
        placeholder: row[7] || '',  // Frontend expects placeholder (was placeholderText)
        placeholderText: row[7] || '',  // Also include placeholderText for compatibility
        validationRule: row[8] || '',  // Frontend expects validationRule (was validationType)
        validationMessage: row[10] || '',
        minLength: row[11] || '',
        maxLength: row[12] || '',
        minValue: row[13] || '',
        maxValue: row[14] || '',
        minSelections: row[15] || '',
        maxSelections: row[16] || '',
        showOtherOption: row[17] || 'No',  // Frontend expects showOtherOption
        allowedFileTypes: row[18] || '',  // Frontend expects allowedFileTypes
        maxFileSize: row[19] || '',  // Frontend expects maxFileSize (was maxFileSizeMB)
        defaultValue: '',  // Not stored in backend yet
        scaleStart: row[20],
        scaleEnd: row[21],
        scaleStartLabel: row[22],
        scaleEndLabel: row[23],
        hasConditionalLogic: conditionalRules.data && conditionalRules.data.length > 0,
        conditionalRules: conditionalRules.data && conditionalRules.data.length > 0
          ? conditionalRules.data.map(rule => ({
              questionIndex: rule.questionIndex,
              operator: rule.operator,
              value: rule.value,
              action: rule.action,
              order: rule.order || 0
            }))
          : undefined,
        createdAt: row[25],
        updatedAt: row[26],
        notes: row[27],
        // Additional fields for all 34 question types (columns AC-BI)
        randomizeOptions: row[28] || 'No',
        allowMultipleSelections: row[29] || 'No',
        selectionLimitType: row[30] || 'unlimited',
        collectName: row[31] || 'No',
        collectEmail: row[32] || 'No',
        collectPhone: row[33] || 'No',
        collectAddress: row[34] || 'No',
        ratingType: row[35] || 'star',
        ratingScale: row[36] || '5',
        scaleMin: row[37] || '',
        scaleMax: row[38] || '',
        scaleMinLabel: row[39] || '',
        scaleMaxLabel: row[40] || '',
        scaleMidLabel: row[41] || '',
        matrixRows: row[42] ? JSON.parse(row[42]) : [],
        matrixColumns: row[43] ? JSON.parse(row[43]) : [],
        matrixType: row[44] || 'single',
        dateFormat: row[45] || 'MM/DD/YYYY',
        restrictPast: row[46] || 'No',
        restrictFuture: row[47] || 'No',
        mediaUrl: row[48] || '',
        mediaType: row[49] || 'none',
        autoplay: row[50] || 'No',
        stripeAmount: row[51] || '',
        stripeCurrency: row[52] || 'USD',
        driveType: row[53] || 'file',
        calendlyUrl: row[54] || '',
        aiContext: row[55] || '',
        aiFaqData: row[56] || '',
        redirectUrl: row[57] || '',
        redirectDelay: row[58] || '3',
        statementContent: row[59] || '',
        groupedQuestionIds: row[60] ? JSON.parse(row[60]) : [],
        // Group Selection fields (columns BJ-BM)
        minGroupSize: row[61] || '',
        maxGroupSize: row[62] || '',
        restrictStudents: row[63] || 'No',
        eligibleStudents: row[64] || '',
        options: options
      };

      questions.push(question);
    }

    // Sort questions by order
    questions.sort((a, b) => a.order - b.order);

    Logger.log(`✅ Found ${questions.length} questions`);

    return {
      success: true,
      data: questions
    };

  } catch (error) {
    Logger.log(`❌ Error getting questions: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== GROUP SELECTION APIS ====================

/**
 * Get all students from Student Login sheet
 * @returns {Object} {success, students: [{id, name, email, batch}]}
 */
function getAllStudents() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const studentSheet = spreadsheet.getSheetByName(STUDENT_LOGIN_SHEET);

    if (!studentSheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = studentSheet.getDataRange().getValues();
    const students = [];

    // Skip header row
    // Student Login sheet structure: Student Email, Full Name, Roll No, Batch, Role
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // If email exists
        students.push({
          id: row[0],           // Column A - Student Email (used as ID)
          email: row[0] || '',  // Column A - Student Email
          name: row[1] || '',   // Column B - Full Name
          rollNo: row[2] || '', // Column C - Roll No
          batch: row[3] || '',  // Column D - Batch
          role: row[4] || ''    // Column E - Role
        });
      }
    }

    Logger.log(`✅ Retrieved ${students.length} students`);
    return {
      success: true,
      data: students
    };

  } catch (error) {
    Logger.log(`❌ Error getting all students: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get available students for a specific question
 * Simply converts Eligible_Students list into student objects
 * @param {string} formId - Form ID
 * @param {string} questionId - Question ID
 * @returns {Object} {success, students: [{id, name, email, batch}]}
 */
function getAvailableStudentsForQuestion(formId, questionId) {
  try {
    Logger.log(`📊 Getting available students for question ${questionId} in form ${formId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const questionsSheet = spreadsheet.getSheetByName('Form_Questions');

    // Get question configuration
    const questionsData = questionsSheet.getDataRange().getValues();
    const questionHeaders = questionsData[0];
    const questionIdIndex = questionHeaders.indexOf('Question_ID');
    const eligibleStudentsIndex = questionHeaders.indexOf('Eligible_Students');

    Logger.log(`📋 Column indices - Question_ID: ${questionIdIndex}, Eligible_Students: ${eligibleStudentsIndex}`);

    let eligibleStudentNames = [];

    // Find the question and get eligible students
    for (let i = 1; i < questionsData.length; i++) {
      if (questionsData[i][questionIdIndex] === questionId) {
        const eligibleStudentsStr = questionsData[i][eligibleStudentsIndex];

        Logger.log(`📋 Eligible Students String: "${eligibleStudentsStr}"`);

        if (eligibleStudentsStr && eligibleStudentsStr.trim() !== '') {
          try {
            // Try parsing as JSON array first
            eligibleStudentNames = JSON.parse(eligibleStudentsStr);
            Logger.log(`✅ Parsed ${eligibleStudentNames.length} eligible students (JSON format)`);
          } catch (e) {
            // If not JSON, try comma-separated or newline-separated
            if (eligibleStudentsStr.includes(',')) {
              // Comma-separated
              eligibleStudentNames = eligibleStudentsStr.split(',').map(function(name) { return name.trim(); }).filter(function(name) { return name; });
              Logger.log(`✅ Parsed ${eligibleStudentNames.length} eligible students (comma-separated)`);
            } else if (eligibleStudentsStr.includes('\n')) {
              // Newline-separated (one per line)
              eligibleStudentNames = eligibleStudentsStr.split('\n').map(function(name) { return name.trim(); }).filter(function(name) { return name; });
              Logger.log(`✅ Parsed ${eligibleStudentNames.length} eligible students (newline-separated)`);
            } else {
              // Single name
              eligibleStudentNames = [eligibleStudentsStr.trim()];
              Logger.log(`✅ Parsed 1 eligible student`);
            }
          }
        }
        break;
      }
    }

    // Convert names to student objects (use name as ID)
    Logger.log(`🔧 NEW CODE: Converting ${eligibleStudentNames.length} names to student objects`);
    const students = eligibleStudentNames.map(function(name, index) {
      Logger.log(`🔧 NEW CODE: Creating student with id="${name}", name="${name}"`);
      return {
        id: name,        // Use actual name as ID
        name: name,
        email: '',  // Email not needed for display
        batch: ''   // Batch not needed for display
      };
    });

    Logger.log(`✅ Returning ${students.length} students from Eligible_Students column`);

    // Get response sheet for this form
    const responseSheetResult = getOrCreateFormResponseSheet(formId);
    if (!responseSheetResult.success) {
      // If no response sheet exists yet, all students are available
      return {
        success: true,
        data: students
      };
    }

    const responseSheet = responseSheetResult.sheet;
    const data = responseSheet.getDataRange().getValues();

    if (data.length <= 1) {
      // No responses yet, all students available
      return {
        success: true,
        data: students
      };
    }

    // Collect all student names who are already in groups for this question
    // Check Response_JSON column (column G, index 6)
    const groupedStudentNames = new Set();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const responseJSON = row[6]; // Column G - Response_JSON

      if (responseJSON && responseJSON.trim() !== '') {
        try {
          const responseData = JSON.parse(responseJSON);
          const questionAnswer = responseData[questionId];

          // If this question has an array answer (group selection), add all names
          if (Array.isArray(questionAnswer)) {
            questionAnswer.forEach(function(name) {
              groupedStudentNames.add(name);
            });
            Logger.log(`📊 Found group with ${questionAnswer.length} members: ${questionAnswer.join(', ')}`);
          }
        } catch (e) {
          Logger.log(`⚠️ Warning: Could not parse Response_JSON: ${e.message}`);
        }
      }
    }

    // Filter out students who are already in groups
    const availableStudents = students.filter(function(student) {
      return !groupedStudentNames.has(student.id);
    });

    Logger.log(`✅ Found ${availableStudents.length} available students (${groupedStudentNames.size} already grouped)`);

    return {
      success: true,
      data: availableStudents
    };

  } catch (error) {
    Logger.log(`❌ Error getting available students: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get student's group status for a specific question
 * @param {string} formId - Form ID
 * @param {string} questionId - Question ID
 * @param {string} studentEmail - Student email
 * @returns {Object} {success, isFilled: boolean, filledBy: string}
 */
function getStudentGroupStatus(formId, questionId, studentEmail) {
  try {
    Logger.log(`📊 Checking group status for ${studentEmail} in question ${questionId}`);

    // Get student name from Student Login sheet (using email from auth)
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const loginSheet = spreadsheet.getSheetByName('Student Login');
    const loginData = loginSheet.getDataRange().getValues();

    let studentName = null;
    for (let i = 1; i < loginData.length; i++) {
      if (loginData[i][0] === studentEmail) { // Column A - Student Email
        studentName = loginData[i][1]; // Column B - Full Name
        break;
      }
    }

    if (!studentName) {
      Logger.log(`⚠️ Student not found in Student Login sheet: ${studentEmail}`);
      return {
        success: true,
        data: {
          isFilled: false,
          filledBy: null,
          groupMembers: []
        }
      };
    }

    Logger.log(`✅ Found student: ${studentName}`);

    // ALWAYS check all responses to see if student is in someone else's group
    Logger.log(`📊 Checking if ${studentName} is in anyone's group`);
    const allResponsesResult = getAllFormResponses(formId);

    if (allResponsesResult.success && allResponsesResult.data) {
      for (let i = 0; i < allResponsesResult.data.length; i++) {
        const response = allResponsesResult.data[i];
        const responseData = response.responseData || {};
        const questionAnswer = responseData[questionId];

        if (Array.isArray(questionAnswer) && questionAnswer.includes(studentName)) {
          // Student is in this group!
          Logger.log(`✅ Student ${studentName} is in a group filled by: ${response.userName}`);
          return {
            success: true,
            data: {
              isFilled: true,
              filledBy: response.userName,
              groupMembers: questionAnswer
            }
          };
        }
      }
    }

    // If not in anyone's group, return not filled
    Logger.log(`📊 Student ${studentName} is not in any group`);
    return {
      success: true,
      data: {
        isFilled: false,
        filledBy: null,
        groupMembers: []
      }
    };

  } catch (error) {
    Logger.log(`❌ Error checking student group status: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== RESPONSE SUBMISSION ====================

/**
 * Submit form response
 * @param {Object} responseData - {formId, userEmail, responses: {questionId: answer}, completionTimeSeconds}
 * @returns {Object} {success, responseId}
 */
/**
 * Validate form deadline - check if form is still accepting submissions
 */
function validateFormDeadline(formId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formsSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formsSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        const endDateTime = data[i][11]; // Column L - End_DateTime
        const status = data[i][31]; // Column AF - Status

        // Check if form is published
        if (status !== 'Published') {
          return {
            success: false,
            expired: true,
            message: 'This form is no longer accepting submissions (not published)'
          };
        }

        // Check deadline
        if (endDateTime) {
          const now = new Date();
          const deadline = new Date(endDateTime);

          if (now > deadline) {
            return {
              success: false,
              expired: true,
              message: 'This form deadline has passed. Submissions are no longer accepted.'
            };
          }
        }

        return {
          success: true,
          expired: false
        };
      }
    }

    return {
      success: false,
      error: 'Form not found'
    };

  } catch (error) {
    Logger.log(`Error validating form deadline: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate group member availability - check if selected members are already taken
 */
function validateGroupMemberAvailability(formId, selectedMembers, questionId) {
  try {
    const debugLog = []; // Collect debug info to return in response
    debugLog.push(`🔍 Validating ${selectedMembers.length} members: ${JSON.stringify(selectedMembers)}`);
    debugLog.push(`🔍 Question ID: ${questionId}`);

    Logger.log(`🔍 Validating group member availability for ${selectedMembers.length} members`);
    Logger.log(`🔍 Selected members: ${JSON.stringify(selectedMembers)}`);
    Logger.log(`🔍 Question ID: ${questionId}`);

    // Get response sheet for this form using the proper function
    const responseSheetResult = getOrCreateFormResponseSheet(formId);
    if (!responseSheetResult.success) {
      // If no response sheet exists yet, all students are available
      debugLog.push(`✅ No response sheet found - all members available`);
      Logger.log(`✅ No response sheet found - all members available`);
      return {
        success: true,
        available: true,
        debugLog
      };
    }

    const responseSheet = responseSheetResult.sheet;
    const data = responseSheet.getDataRange().getValues();

    debugLog.push(`📋 Found response sheet with ${data.length - 1} responses`);
    Logger.log(`📋 Found response sheet with ${data.length - 1} responses`);

    if (data.length <= 1) {
      // Only headers, no responses yet
      debugLog.push(`✅ No responses yet - all members available`);
      Logger.log(`✅ No responses yet - all members available`);
      return {
        success: true,
        available: true,
        debugLog
      };
    }

    // Collect all already-selected members from Response_JSON column (same as getAvailableStudentsForQuestion)
    const alreadySelected = new Set();

    debugLog.push(`📋 Processing ${data.length - 1} existing responses from Response_JSON column...`);
    Logger.log(`📋 Processing ${data.length - 1} existing responses from Response_JSON column...`);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const responseJSON = row[6]; // Column G - Response_JSON (same as getAvailableStudentsForQuestion)

      if (responseJSON && responseJSON.trim() !== '') {
        try {
          const responseData = JSON.parse(responseJSON);
          const questionAnswer = responseData[questionId];

          // If this question has an array answer (group selection), add all names
          if (Array.isArray(questionAnswer)) {
            questionAnswer.forEach(function(name) {
              const normalized = name.toLowerCase();
              alreadySelected.add(normalized);
            });
            debugLog.push(`📋 Row ${i}: Found group with ${questionAnswer.length} members: ${questionAnswer.join(', ')}`);
            Logger.log(`📋 Row ${i}: Found group with ${questionAnswer.length} members: ${questionAnswer.join(', ')}`);
          }
        } catch (e) {
          debugLog.push(`⚠️ Row ${i}: Could not parse Response_JSON: ${e.message}`);
          Logger.log(`⚠️ Row ${i}: Could not parse Response_JSON: ${e.message}`);
        }
      }
    }

    debugLog.push(`📊 Already selected members (${alreadySelected.size} total): ${Array.from(alreadySelected).join(', ')}`);
    Logger.log(`📊 Already selected members (${alreadySelected.size} total): ${Array.from(alreadySelected).join(', ')}`);

    // Check which of the selected members are unavailable
    debugLog.push(`🔍 Checking availability of selected members...`);
    Logger.log(`🔍 Checking availability of selected members...`);

    const unavailable = selectedMembers.filter(member => {
      const normalized = member.toLowerCase();
      const isUnavailable = alreadySelected.has(normalized);
      const status = isUnavailable ? '❌ UNAVAILABLE' : '✅ AVAILABLE';
      debugLog.push(`  🔍 "${member}" → "${normalized}" → ${status}`);
      Logger.log(`  🔍 "${member}" → "${normalized}" → ${status}`);
      return isUnavailable;
    });

    if (unavailable.length > 0) {
      debugLog.push(`❌ Unavailable members: ${unavailable.join(', ')}`);
      Logger.log(`❌ Unavailable members: ${unavailable.join(', ')}`);
      return {
        success: false,
        available: false,
        unavailableMembers: unavailable,
        message: `The following group members are already selected by other students: ${unavailable.join(', ')}`,
        debugLog
      };
    }

    debugLog.push(`✅ All selected members are available`);
    Logger.log(`✅ All selected members are available`);
    return {
      success: true,
      available: true,
      debugLog
    };

  } catch (error) {
    Logger.log(`Error validating group members: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

function submitFormResponse(responseData) {
  try {
    Logger.log(`📝 ========== STARTING FORM SUBMISSION ==========`);
    Logger.log(`📝 Form ID: ${responseData.formId}`);
    Logger.log(`📝 User Email: ${responseData.userEmail}`);
    Logger.log(`📝 Number of answers: ${Object.keys(responseData.answers || responseData.responses || {}).length}`);

    // VALIDATION 1: Check if form deadline has passed
    Logger.log(`⏰ Checking form deadline...`);
    const deadlineCheck = validateFormDeadline(responseData.formId);
    if (deadlineCheck.expired) {
      Logger.log(`❌ Form deadline validation failed: ${deadlineCheck.message}`);
      return {
        success: false,
        error: 'FORM_EXPIRED',
        message: deadlineCheck.message
      };
    }
    Logger.log(`✅ Form deadline validation passed`);

    // VALIDATION 2: Check group member availability (if applicable)
    const answers = responseData.answers || responseData.responses;
    let groupMemberNames = [];

    Logger.log(`🔍 Starting group member validation...`);
    Logger.log(`🔍 Answers object: ${JSON.stringify(answers)}`);

    if (answers && typeof answers === 'object') {
      // Get form questions to check for group_selection type
      const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
      const questionsSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);
      const questionsData = questionsSheet.getDataRange().getValues();

      Logger.log(`🔍 Checking ${Object.keys(answers).length} questions for group selection type...`);

      for (const questionId in answers) {
        // Find question type
        Logger.log(`🔍 Checking question ID: ${questionId}`);
        for (let i = 1; i < questionsData.length; i++) {
          const qId = questionsData[i][0];
          const qType = questionsData[i][3];

          if (qId === questionId) {
            Logger.log(`🔍 Found question ${questionId}, type: "${qType}"`);
          }

          if (qId === questionId && (qType === 'group_selection' || qType === 'Group Selection')) {
            Logger.log(`✅ FOUND GROUP SELECTION QUESTION: ${questionId}`);
            const groupAnswer = answers[questionId];

            try {
              if (typeof groupAnswer === 'string') {
                groupMemberNames = JSON.parse(groupAnswer);
              } else if (Array.isArray(groupAnswer)) {
                groupMemberNames = groupAnswer;
              }

              Logger.log(`👥 Checking availability for group members: ${groupMemberNames.join(', ')}`);

              // Validate availability
              const availabilityCheck = validateGroupMemberAvailability(
                responseData.formId,
                groupMemberNames,
                questionId
              );

              if (!availabilityCheck.available) {
                Logger.log(`❌ Group member validation failed: ${availabilityCheck.message}`);
                return {
                  success: false,
                  error: 'GROUP_MEMBERS_UNAVAILABLE',
                  unavailableMembers: availabilityCheck.unavailableMembers,
                  message: availabilityCheck.message
                };
              }

              Logger.log(`✅ All group members are available`);

            } catch (e) {
              Logger.log(`⚠️ Error parsing group selection answer: ${e.message}`);
            }
            break;
          }
        }
      }
    }

    // Get or create form-specific response sheet
    const sheetResult = getOrCreateFormResponseSheet(responseData.formId);
    if (!sheetResult.success) {
      Logger.log(`❌ FAILED to get response sheet: ${sheetResult.error}`);
      return sheetResult;
    }

    Logger.log(`✅ Successfully got response sheet: ${sheetResult.sheetUrl}`);
    const responseSheet = sheetResult.sheet;
    Logger.log(`✅ Sheet name: ${responseSheet.getName()}`);
    Logger.log(`✅ Current row count: ${responseSheet.getLastRow()}`);

    // Get student data
    const studentData = getStudentDataByEmail(responseData.userEmail);
    const userName = studentData.success ? studentData.data.name : responseData.userEmail;
    const userBatch = studentData.success ? studentData.data.batch : 'Unknown';

    // Generate response ID
    const responseId = generateFormsId('RESP');
    const timestamp = formatFormsTimestamp();

    // Read existing column headers to build flexible row
    const lastColumn = responseSheet.getLastColumn();
    const headers = responseSheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    // Create a map of column name -> column index (1-based)
    const columnMap = {};
    for (let i = 0; i < headers.length; i++) {
      columnMap[headers[i]] = i + 1;
    }

    Logger.log(`📊 Found ${headers.length} columns in response sheet`);

    // Check if user has already submitted (for "Updated" column)
    const allData = responseSheet.getDataRange().getValues();
    const userEmailColumnIndex = columnMap['User_Email'] - 1; // 0-indexed for array
    let hasExistingResponse = false;

    if (userEmailColumnIndex >= 0) {
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][userEmailColumnIndex] === responseData.userEmail) {
          hasExistingResponse = true;
          Logger.log(`✅ User has existing response - this is a resubmission`);
          break;
        }
      }
    }

    // Use group member names from validation step above
    let groupMemberIDs = groupMemberNames.slice(); // Copy the array
    Logger.log(`📊 Group Members to save: ${groupMemberNames.join(', ') || 'None'}`);


    // Prepare data mapping for all possible standard columns
    const dataMap = {
      'Response_ID': responseId,
      'Form_ID': responseData.formId,
      'User_Email': responseData.userEmail,
      'User_Name': userName,
      'User_Batch': userBatch,
      'Submission_DateTime': timestamp,
      'Response_JSON': JSON.stringify(responseData.answers || responseData.responses),
      'IP_Address': responseData.ipAddress || '',
      'Completion_Time_Seconds': responseData.completionTimeSeconds || 0,
      'Is_Complete': 'Yes',
      'Last_Modified_At': timestamp,
      'Device_Type': responseData.deviceType || 'Unknown',
      'Notes': '',
      'Updated': hasExistingResponse ? 'Yes' : 'No'  // Mark as 'Yes' for 2nd+ submissions
    };

    // Add group data if present
    if (groupMemberIDs.length > 0) {
      dataMap['Group_Member_IDs'] = JSON.stringify(groupMemberIDs);
      dataMap['Group_Member_Names'] = groupMemberNames.join(', ');
      dataMap['Filled_By_Name'] = userName;
      Logger.log(`✓ Added group data: ${groupMemberIDs.length} members`);
    }

    // Build row array with correct number of columns (fill with empty strings)
    const row = new Array(lastColumn).fill('');

    // Fill in data for columns that exist
    for (const columnName in dataMap) {
      if (columnMap[columnName]) {
        row[columnMap[columnName] - 1] = dataMap[columnName];
        Logger.log(`✓ Mapped ${columnName} to column ${columnMap[columnName]}`);
      }
    }

    // Append row to sheet
    responseSheet.appendRow(row);
    const rowIndex = responseSheet.getLastRow();

    Logger.log(`✓ Added base row at index ${rowIndex}`);

    // Now add individual question answers to dynamic columns
    // Note: 'answers' variable is already declared above when checking for group selection
    if (answers && typeof answers === 'object') {
      Logger.log(`📝 Saving ${Object.keys(answers).length} question answers to columns`);

      for (const questionId in answers) {
        const answer = answers[questionId];

        // Get column index for this question
        const columnIndex = getResponseSheetColumnIndex(responseSheet, questionId);

        if (columnIndex !== -1) {
          // Column exists, save answer
          let answerValue = answer;

          // Convert complex answers to JSON string (but not URLs which are already strings)
          if (typeof answer === 'object' && answer !== null) {
            answerValue = JSON.stringify(answer);
          }

          responseSheet.getRange(rowIndex, columnIndex).setValue(answerValue);
          Logger.log(`✓ Saved answer for Q_${questionId} to column ${columnIndex}`);
        } else {
          Logger.log(`⚠️ Column not found for question ${questionId}, answer saved in JSON only`);
        }
      }
    }

    // Update form's total response count
    updateFormResponseCount(responseData.formId);

    Logger.log(`✅ ========== FORM SUBMISSION COMPLETED ==========`);
    Logger.log(`✅ Response ID: ${responseId}`);
    Logger.log(`✅ Saved to row: ${rowIndex}`);
    Logger.log(`✅ Sheet URL: ${sheetResult.sheetUrl}`);

    return {
      success: true,
      responseId: responseId,
      data: {
        responseId: responseId,
        userName: userName,
        userBatch: userBatch,
        sheetUrl: sheetResult.sheetUrl
      }
    };

  } catch (error) {
    Logger.log(`❌ ========== FORM SUBMISSION FAILED ==========`);
    Logger.log(`❌ Error: ${error.message}`);
    Logger.log(`❌ Stack: ${error.stack}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update form's total response count
 */
function updateFormResponseCount(formId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        const currentCount = data[i][28] || 0; // AC - Total_Responses (FIXED: was 27)
        formSheet.getRange(i + 1, 29).setValue(currentCount + 1); // Column AC (FIXED: was 28)
        break;
      }
    }
  } catch (error) {
    Logger.log(`⚠️ Error updating response count: ${error.message}`);
  }
}

/**
 * Get user's responses for a form
 * @param {string} formId - Form ID
 * @param {string} userEmail - User email
 * @returns {Object} {success, data: [responses]}
 */
function getUserFormResponses(formId, userEmail) {
  try {
    Logger.log(`📊 Getting responses for form ${formId}, user ${userEmail}`);

    // Get form-specific response sheet (same as submission)
    const sheetResult = getOrCreateFormResponseSheet(formId);
    if (!sheetResult.success) {
      Logger.log(`❌ Error getting response sheet: ${sheetResult.error}`);
      return { success: false, error: sheetResult.error };
    }

    const sheet = sheetResult.sheet;
    const data = sheet.getDataRange().getValues();
    const responses = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Check if this response belongs to the user (column C = User_Email)
      if (row[2] === userEmail) {
        const response = {
          responseId: row[0],
          formId: row[1],
          userEmail: row[2],
          userName: row[3],
          userBatch: row[4],
          submissionDateTime: row[5],
          responseData: JSON.parse(row[6] || '{}'),
          ipAddress: row[7],
          completionTimeSeconds: row[8],
          isComplete: row[9],
          lastModifiedAt: row[10],
          deviceType: row[11],
          notes: row[12]
        };

        // Add group selection data if available (columns O, P, Q)
        if (row.length > 14) {
          response.groupMemberIDs = row[14] || '';      // Column O
          response.groupMemberNames = row[15] || '';    // Column P
        }
        // filledByName is always the User_Name (Column D) who submitted this response
        response.filledByName = row[3] || '';           // Column D - User_Name

        responses.push(response);
      }
    }

    Logger.log(`✅ Found ${responses.length} responses`);

    return {
      success: true,
      data: responses
    };

  } catch (error) {
    Logger.log(`❌ Error getting user responses: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all responses for a form (not filtered by user)
 * @param {string} formId - Form ID
 * @returns {Object} {success, data: [responses]}
 */
function getAllFormResponses(formId) {
  try {
    Logger.log(`📊 Getting all responses for form ${formId}`);

    // Get form-specific response sheet
    const sheetResult = getOrCreateFormResponseSheet(formId);
    if (!sheetResult.success) {
      Logger.log(`❌ Error getting response sheet: ${sheetResult.error}`);
      return { success: false, error: sheetResult.error };
    }

    const sheet = sheetResult.sheet;
    const data = sheet.getDataRange().getValues();
    const responses = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const response = {
        responseId: row[0],
        formId: row[1],
        userEmail: row[2],
        userName: row[3],
        userBatch: row[4],
        submissionDateTime: row[5],
        responseData: JSON.parse(row[6] || '{}'),
        ipAddress: row[7],
        completionTimeSeconds: row[8],
        isComplete: row[9],
        lastModifiedAt: row[10],
        deviceType: row[11],
        notes: row[12]
      };

      // Add group selection data if available (columns O, P, Q)
      if (row.length > 14) {
        response.groupMemberIDs = row[14] || '';      // Column O
        response.groupMemberNames = row[15] || '';    // Column P
      }
      // filledByName is always the User_Name (Column D) who submitted this response
      response.filledByName = row[3] || '';           // Column D - User_Name

      responses.push(response);
    }

    Logger.log(`✅ Found ${responses.length} total responses`);

    return {
      success: true,
      data: responses
    };

  } catch (error) {
    Logger.log(`❌ Error getting all responses: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}


/**
 * FORMS CRUD OPERATIONS - ADD THESE TO Forms API.js
 * Insert after getFormQuestions() function
 */

// ==================== ADMIN CRUD OPERATIONS ====================

/**
 * Create new form with folder structure
 * @param {Object} formData - Form data
 * @returns {Object} {success, formId, folders}
 */
function createForm(formData) {
  try {
    Logger.log('📝 Creating new form...');
    Logger.log('🔍 RECEIVED FORMDATA: ' + JSON.stringify(formData));

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);

    // Generate Form ID
    const formId = generateFormsId('FORM');
    const timestamp = formatFormsTimestamp();

    // Create folder structure
    const folderResult = createFormFolderStructure({
      batch: formData.batch,
      term: formData.term,
      domain: formData.domain || '',
      subject: formData.subject || '',
      formName: formData.formName,
      createdBy: formData.createdBy
    });

    if (!folderResult.success) {
      Logger.log(`❌ Drive folder creation failed: ${folderResult.error}`);
      return {
        success: false,
        error: folderResult.error,
        details: 'Failed to create Drive folder structure. Please check folder permissions.'
      };
    }

    // Prepare form row (32 columns from Forms sheet)
    const row = [
      formId,                                     // A - Form_ID
      formData.batch,                             // B - Batch
      formData.term || '',                        // C - Term
      formData.domain || '',                      // D - Domain
      formData.subject || '',                     // E - Subject
      formData.formName,                          // F - Form_Name
      formData.description || '',                 // G - Form_Description
      formData.formType,                          // H - Form_Type
      formData.createdBy,                         // I - Created_By
      timestamp,                                  // J - Created_At
      formData.startDateTime || timestamp,        // K - Start_DateTime
      formData.endDateTime || '',                 // L - End_DateTime
      formData.uploadedFile || '',                // M - Uploaded_File
      folderResult.formFolderUrl,                 // N - Drive_Link
      formData.attachmentRequired || 'No',        // O - Attachment_Required
      folderResult.responsesSheetUrl,             // P - Response_Sheet_Link
      formData.isActive || 'Yes',                 // Q - Is_Active
      formData.showAtStartUntilFilled || 'No',    // R - Show_At_Start_Until_Filled
      formData.showInTab || 'Yes',                // S - Show_In_Tab
      formData.visibleTo || 'All',                // T - Visible_To
      formData.maxResponsesPerUser || 1,          // U - Max_Responses_Per_User
      formData.showResultsToRespondents || 'No',  // V - Show_Results_To_Respondents
      formData.thankYouMessage || 'Thank you for your response!', // W - Thank_You_Message
      formData.redirectUrl || '',                 // X - Redirect_URL
      formData.allowEditResponse || 'No',         // Y - Allow_Edit_Response
      formData.allowStudentViewResponse || 'No',  // Z - Allow_Student_View_Response
      formData.requireLogin || 'Yes',             // AA - Require_Login
      formData.collectEmail || 'Yes',             // AB - Collect_Email
      0,                                          // AC - Total_Responses
      timestamp,                                  // AD - Last_Updated_At
      formData.createdBy,                         // AE - Last_Updated_By
      formData.status || 'Draft',                 // AF - Status
      formData.notes || ''                        // AG - Notes
    ];

    Logger.log('🔍 ROW ARRAY LENGTH: ' + row.length);
    Logger.log('🔍 ROW DATA:');
    Logger.log('  F (Form_Name): ' + row[5]);
    Logger.log('  H (Form_Type): ' + row[7]);
    Logger.log('  K (Start_DateTime): ' + row[10]);
    Logger.log('  L (End_DateTime): ' + row[11]);
    Logger.log('  W (Thank_You_Message): ' + row[22]);
    Logger.log('  AE (Last_Updated_By): ' + row[29]);

    // Append to sheet
    formSheet.appendRow(row);

    Logger.log(`✅ Form created: ${formId}`);

    return {
      success: true,
      formId: formId,
      folders: folderResult,
      data: {
        formId: formId,
        formName: formData.formName,
        formFolderUrl: folderResult.formFolderUrl,
        responsesSheetUrl: folderResult.responsesSheetUrl
      }
    };

  } catch (error) {
    Logger.log(`❌ Error creating form: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing form
 * @param {string} formId - Form ID
 * @param {Object} formData - Updated form data
 * @returns {Object} {success}
 */
function updateForm(formId, formData) {
  try {
    Logger.log(`📝 Updating form: ${formId}`);
    Logger.log('🔍 RECEIVED FORMDATA: ' + JSON.stringify(formData));

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formSheet.getDataRange().getValues();

    // Find form row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Form not found' };
    }

    const timestamp = formatFormsTimestamp();
    const existingRow = data[rowIndex - 1];

    // Check if Drive folders need to be created (for duplicated forms)
    let driveLinkUrl = existingRow[13]; // N - Drive_Link
    let responseSheetUrl = existingRow[15]; // P - Response_Sheet_Link

    // If Drive links are empty, this form was duplicated without folders
    // Create folders now when saving
    if (!driveLinkUrl || driveLinkUrl.trim() === '') {
      Logger.log('📁 Drive folders not found. Creating folder structure for duplicated form...');

      const folderResult = createFormFolderStructure({
        batch: formData.batch || existingRow[1],
        term: formData.term || existingRow[2],
        domain: formData.domain || existingRow[3],
        subject: formData.subject || existingRow[4],
        formName: formData.formName || existingRow[5],
        createdBy: existingRow[8]
      });

      if (folderResult.success) {
        driveLinkUrl = folderResult.formFolderUrl;
        responseSheetUrl = folderResult.responsesSheetUrl;
        Logger.log('✅ Drive folders created successfully');
      } else {
        Logger.log(`❌ Failed to create Drive folders: ${folderResult.error}`);
        return {
          success: false,
          error: folderResult.error,
          details: 'Failed to create Drive folder structure. Please check folder permissions.'
        };
      }
    }

    // Update row (keep IDs, timestamps, folder links)
    const updatedRow = [
      existingRow[0],                             // A - Form_ID (keep)
      formData.batch || existingRow[1],           // B - Batch
      formData.term || existingRow[2],            // C - Term
      formData.domain || existingRow[3],          // D - Domain
      formData.subject || existingRow[4],         // E - Subject
      formData.formName || existingRow[5],        // F - Form_Name
      formData.description || existingRow[6],     // G - Form_Description
      formData.formType || existingRow[7],        // H - Form_Type
      existingRow[8],                             // I - Created_By (keep)
      existingRow[9],                             // J - Created_At (keep)
      formData.startDateTime || existingRow[10],  // K - Start_DateTime
      formData.endDateTime || existingRow[11],    // L - End_DateTime
      formData.uploadedFile || existingRow[12],   // M - Uploaded_File
      driveLinkUrl,                               // N - Drive_Link (create if missing)
      formData.attachmentRequired || existingRow[14], // O - Attachment_Required
      responseSheetUrl,                           // P - Response_Sheet_Link (create if missing)
      formData.isActive || existingRow[16],       // Q - Is_Active
      formData.showAtStartUntilFilled || existingRow[17], // R - Show_At_Start_Until_Filled
      formData.showInTab || existingRow[18],      // S - Show_In_Tab
      formData.visibleTo || existingRow[19],      // T - Visible_To
      formData.maxResponsesPerUser || existingRow[20], // U - Max_Responses_Per_User
      formData.showResultsToRespondents || existingRow[21], // V - Show_Results_To_Respondents
      formData.thankYouMessage || existingRow[22], // W - Thank_You_Message
      formData.redirectUrl || existingRow[23],    // X - Redirect_URL
      formData.allowEditResponse || existingRow[24], // Y - Allow_Edit_Response
      formData.allowStudentViewResponse || existingRow[25], // Z - Allow_Student_View_Response
      formData.requireLogin || existingRow[26],   // AA - Require_Login
      formData.collectEmail || existingRow[27],   // AB - Collect_Email
      existingRow[28],                            // AC - Total_Responses (keep)
      timestamp,                                  // AD - Last_Updated_At
      formData.updatedBy || existingRow[29],      // AE - Last_Updated_By (FIXED INDEX)
      formData.status || existingRow[30],         // AF - Status (FIXED INDEX)
      formData.notes || existingRow[31]           // AG - Notes (FIXED INDEX)
    ];

    Logger.log('🔍 UPDATED ROW ARRAY LENGTH: ' + updatedRow.length);
    Logger.log('🔍 UPDATED ROW DATA:');
    Logger.log('  F (Form_Name): ' + updatedRow[5]);
    Logger.log('  H (Form_Type): ' + updatedRow[7]);
    Logger.log('  K (Start_DateTime): ' + updatedRow[10]);
    Logger.log('  L (End_DateTime): ' + updatedRow[11]);
    Logger.log('  W (Thank_You_Message): ' + updatedRow[22]);
    Logger.log('  AE (Last_Updated_By): ' + updatedRow[29]);

    // Update sheet
    formSheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    Logger.log(`✅ Form updated: ${formId}`);

    return {
      success: true,
      formId: formId
    };

  } catch (error) {
    Logger.log(`❌ Error updating form: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update form status only (quick status change)
 * @param {string} formId - Form ID
 * @param {string} status - New status (Published/Draft/Closed/Archived)
 * @param {string} lastModifiedBy - User email
 * @returns {Object} {success}
 */
function updateFormStatus(formId, status, lastModifiedBy) {
  try {
    Logger.log(`🔄 Updating form status: ${formId} -> ${status}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formSheet.getDataRange().getValues();

    // Find form row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Form not found' };
    }

    const timestamp = formatFormsTimestamp();

    // Update status and last modified fields
    formSheet.getRange(rowIndex, 32).setValue(status); // Column AF - Status (FIXED: was 31)
    formSheet.getRange(rowIndex, 30).setValue(timestamp); // Column AD - Last_Updated_At (FIXED: was 29)
    formSheet.getRange(rowIndex, 31).setValue(lastModifiedBy); // Column AE - Last_Updated_By (FIXED: was 30)

    Logger.log(`✅ Form status updated: ${formId} -> ${status}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error updating form status: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete form (soft delete - archive)
 * @param {string} formId - Form ID
 * @returns {Object} {success}
 */
function deleteForm(formId) {
  try {
    Logger.log(`🗑️ Deleting form: ${formId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formSheet.getDataRange().getValues();

    // Find form row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Form not found' };
    }

    // Soft delete - set status to Archived
    formSheet.getRange(rowIndex, 32).setValue('Archived'); // Column AF - Status (FIXED: was 31)

    Logger.log(`✅ Form archived: ${formId}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error deleting form: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create form WITHOUT Drive folders (used for duplication)
 * Only writes to Forms sheet, no Drive operations
 * Drive folders will be created later when form is saved/published
 * @param {Object} formData - Form data
 * @returns {Object} {success, formId}
 */
function createFormWithoutFolders(formData) {
  try {
    Logger.log('📝 Creating form without Drive folders (duplicate mode)...');
    Logger.log('🔍 RECEIVED FORMDATA: ' + JSON.stringify(formData));

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);

    // Generate Form ID
    const formId = generateFormsId('FORM');
    const timestamp = formatFormsTimestamp();

    // Prepare form row WITHOUT Drive folder links
    const row = [
      formId,                                     // A - Form_ID
      formData.batch,                             // B - Batch
      formData.term || '',                        // C - Term
      formData.domain || '',                      // D - Domain
      formData.subject || '',                     // E - Subject
      formData.formName,                          // F - Form_Name
      formData.description || '',                 // G - Form_Description
      formData.formType || formData.type,         // H - Form_Type
      formData.createdBy,                         // I - Created_By
      timestamp,                                  // J - Created_At
      formData.startDateTime || timestamp,        // K - Start_DateTime
      formData.endDateTime || '',                 // L - End_DateTime
      formData.uploadedFile || '',                // M - Uploaded_File
      '',                                         // N - Drive_Link (empty - will be created on save)
      formData.attachmentRequired || 'No',        // O - Attachment_Required
      '',                                         // P - Response_Sheet_Link (empty - will be created on save)
      formData.isActive || 'Yes',                 // Q - Is_Active
      formData.showAtStartUntilFilled || 'No',    // R - Show_At_Start_Until_Filled
      formData.showInTab || 'Yes',                // S - Show_In_Tab
      formData.visibleTo || 'All',                // T - Visible_To
      formData.maxResponsesPerUser || 1,          // U - Max_Responses_Per_User
      formData.showResultsToRespondents || 'No',  // V - Show_Results_To_Respondents
      formData.thankYouMessage || formData.confirmationMessage || 'Thank you for your response!', // W - Thank_You_Message
      formData.redirectUrl || '',                 // X - Redirect_URL
      formData.allowEditResponse || 'No',         // Y - Allow_Edit_Response
      formData.allowStudentViewResponse || 'No',  // Z - Allow_Student_View_Response
      formData.requireLogin || 'Yes',             // AA - Require_Login
      formData.collectEmail || 'Yes',             // AB - Collect_Email
      0,                                          // AC - Total_Responses
      timestamp,                                  // AD - Last_Updated_At
      formData.createdBy,                         // AE - Last_Updated_By
      formData.status || 'Draft',                 // AF - Status
      formData.notes || ''                        // AG - Notes
    ];

    Logger.log('🔍 ROW ARRAY LENGTH: ' + row.length);
    Logger.log('🔍 ROW DATA (Without Drive folders):');
    Logger.log('  F (Form_Name): ' + row[5]);
    Logger.log('  H (Form_Type): ' + row[7]);
    Logger.log('  N (Drive_Link): ' + row[13] + ' (empty)');
    Logger.log('  P (Response_Sheet_Link): ' + row[15] + ' (empty)');
    Logger.log('  AF (Status): ' + row[31]);

    // Append to sheet
    formSheet.appendRow(row);

    Logger.log(`✅ Form created without folders: ${formId}`);

    return {
      success: true,
      formId: formId,
      data: {
        formId: formId,
        formName: formData.formName,
        formFolderUrl: '',
        responsesSheetUrl: ''
      }
    };

  } catch (error) {
    Logger.log(`❌ Error creating form without folders: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Duplicate form
 * @param {string} formId - Form ID to duplicate
 * @param {string} createdBy - User email
 * @returns {Object} {success, newFormId}
 */
function duplicateForm(formId, createdBy) {
  try {
    Logger.log(`📋 Duplicating form: ${formId}`);

    // Get original form
    const formResult = getFormById(formId);
    if (!formResult.success) {
      return { success: false, error: 'Form not found' };
    }

    const originalForm = formResult.data.form;

    // Create new form with "(Copy)" suffix - WITHOUT creating Drive folders
    const newFormData = {
      ...originalForm,
      formName: originalForm.name + ' (Copy)',
      createdBy: createdBy,
      status: 'Draft',
      skipDriveFolders: true  // Flag to skip folder creation
    };
    delete newFormData.id;
    delete newFormData.createdAt;
    delete newFormData.totalResponses;
    delete newFormData.driveLink;  // Remove Drive links
    delete newFormData.responsesSheetUrl;

    const createResult = createFormWithoutFolders(newFormData);
    if (!createResult.success) {
      return createResult;
    }

    const newFormId = createResult.formId;

    // Copy questions
    const questions = formResult.data.questions;
    for (const question of questions) {
      const questionData = {
        ...question,
        formId: newFormId
      };
      delete questionData.id;
      delete questionData.createdAt;

      const questionResult = createQuestion(questionData);
      if (!questionResult.success) {
        Logger.log(`⚠️ Failed to copy question: ${question.text}`);
        continue;
      }

      const newQuestionId = questionResult.questionId;

      // Copy options for this question
      if (question.options && question.options.length > 0) {
        for (const option of question.options) {
          const optionData = {
            questionId: newQuestionId,
            optionOrder: option.order,
            optionText: option.text,
            optionValue: option.value || option.text,
            hasImage: option.hasImage || 'No',
            imageUrl: option.imageUrl || '',
            jumpToQuestionId: '' // Don't copy jump logic
          };

          createOption(optionData);
        }
      }
    }

    Logger.log(`✅ Form duplicated: ${newFormId}`);

    return {
      success: true,
      newFormId: newFormId,
      newFormName: newFormData.formName
    };

  } catch (error) {
    Logger.log(`❌ Error duplicating form: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== QUESTIONS CRUD ====================

/**
 * Create new question
 * @param {Object} questionData - Question data
 * @returns {Object} {success, questionId}
 */
function createQuestion(questionData) {
  try {
    Logger.log(`❓ Creating question for form: ${questionData.formId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const questionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);

    const questionId = generateFormsId('Q');
    const timestamp = formatFormsTimestamp();

    const row = [
      questionId,                                 // A - Question_ID
      questionData.formId,                        // B - Form_ID
      questionData.questionOrder,                 // C - Question_Order
      questionData.questionType,                  // D - Question_Type
      questionData.questionText,                  // E - Question_Text
      questionData.helpText || questionData.questionDescription || '',     // F - Question_Description (frontend sends helpText)
      questionData.isRequired || 'No',            // G - Is_Required
      questionData.placeholderText || '',         // H - Placeholder_Text
      questionData.validationType || 'None',      // I - Validation_Type
      questionData.validationPattern || '',       // J - Validation_Pattern
      questionData.validationMessage || '',       // K - Validation_Message
      questionData.minLength || '',               // L - Min_Length
      questionData.maxLength || '',               // M - Max_Length
      questionData.minValue || '',                // N - Min_Value
      questionData.maxValue || '',                // O - Max_Value
      questionData.minSelections || '',           // P - Min_Selections
      questionData.maxSelections || '',           // Q - Max_Selections
      questionData.allowOtherOption || 'No',      // R - Allow_Other_Option
      questionData.fileTypesAllowed || '',        // S - File_Types_Allowed
      questionData.maxFileSizeMB || '',           // T - Max_File_Size_MB
      questionData.scaleStart || '',              // U - Scale_Start
      questionData.scaleEnd || '',                // V - Scale_End
      questionData.scaleStartLabel || '',         // W - Scale_Start_Label
      questionData.scaleEndLabel || '',           // X - Scale_End_Label
      questionData.conditionalLogicId || '',      // Y - Conditional_Logic_ID
      timestamp,                                  // Z - Created_At
      timestamp,                                  // AA - Updated_At
      questionData.notes || '',                   // AB - Notes
      // NEW FIELDS FOR ALL 34 QUESTION TYPES
      questionData.randomizeOptions || 'No',      // AC - Randomize_Options
      questionData.allowMultipleSelections || 'No', // AD - Allow_Multiple_Selections
      questionData.selectionLimitType || 'unlimited', // AE - Selection_Limit_Type
      questionData.collectName || 'No',           // AF - Collect_Name (Contact Info)
      questionData.collectEmail || 'No',          // AG - Collect_Email (Contact Info)
      questionData.collectPhone || 'No',          // AH - Collect_Phone (Contact Info)
      questionData.collectAddress || 'No',        // AI - Collect_Address (Contact Info)
      questionData.ratingType || 'star',          // AJ - Rating_Type (star/heart/smiley)
      questionData.ratingScale || '5',            // AK - Rating_Scale (1-10)
      questionData.scaleMin || '',                // AL - Scale_Min (Opinion Scale/NPS)
      questionData.scaleMax || '',                // AM - Scale_Max (Opinion Scale/NPS)
      questionData.scaleMinLabel || '',           // AN - Scale_Min_Label
      questionData.scaleMaxLabel || '',           // AO - Scale_Max_Label
      questionData.scaleMidLabel || '',           // AP - Scale_Mid_Label
      questionData.matrixRows ? JSON.stringify(questionData.matrixRows) : '', // AQ - Matrix_Rows (JSON)
      questionData.matrixColumns ? JSON.stringify(questionData.matrixColumns) : '', // AR - Matrix_Columns (JSON)
      questionData.matrixType || 'single',        // AS - Matrix_Type (single/multiple)
      questionData.dateFormat || 'MM/DD/YYYY',    // AT - Date_Format
      questionData.restrictPast || 'No',          // AU - Restrict_Past_Dates
      questionData.restrictFuture || 'No',        // AV - Restrict_Future_Dates
      questionData.mediaUrl || '',                // AW - Media_URL (Video/Audio/Statement)
      questionData.mediaType || 'none',           // AX - Media_Type (video/audio/image/none)
      questionData.autoplay || 'No',              // AY - Autoplay (Yes/No)
      questionData.stripeAmount || '',            // AZ - Stripe_Amount
      questionData.stripeCurrency || 'USD',       // BA - Stripe_Currency
      questionData.driveType || 'file',           // BB - Drive_Type (file/folder)
      questionData.calendlyUrl || '',             // BC - Calendly_URL
      questionData.aiContext || '',               // BD - AI_Context (Clarify with AI)
      questionData.aiFaqData || '',               // BE - AI_FAQ_Data (FAQ with AI)
      questionData.redirectUrl || '',             // BF - Redirect_URL
      questionData.redirectDelay || '3',          // BG - Redirect_Delay (seconds)
      questionData.statementContent || '',        // BH - Statement_Content
      questionData.groupedQuestionIds ? JSON.stringify(questionData.groupedQuestionIds) : '', // BI - Grouped_Question_IDs (JSON)
      questionData.minGroupSize || '',            // BJ - Min_Group_Size (Group Selection)
      questionData.maxGroupSize || '',            // BK - Max_Group_Size (Group Selection)
      questionData.restrictStudents || 'No',      // BL - Restrict_Students (Group Selection)
      questionData.eligibleStudents || ''         // BM - Eligible_Students (Group Selection)
    ];

    questionSheet.appendRow(row);

    Logger.log(`✅ Question created: ${questionId} with type ${questionData.questionType}`);

    // Save options if provided (for Multiple Choice, Dropdown, Checkboxes, etc.)
    if (questionData.options && questionData.options.length > 0) {
      Logger.log(`📋 Saving ${questionData.options.length} options for question ${questionId}`);
      for (let i = 0; i < questionData.options.length; i++) {
        const option = questionData.options[i];
        const optionResult = createOption({
          questionId: questionId,
          optionOrder: option.order || i + 1,
          optionText: option.optionText,
          optionValue: option.optionValue || option.optionText,
          hasImage: option.hasImage || 'No',
          imageUrl: option.imageUrl || '',
          jumpToQuestionId: option.jumpToQuestionId || '',
          notes: option.notes || ''
        });
        if (!optionResult.success) {
          Logger.log(`⚠️ Warning: Failed to save option ${i + 1}: ${optionResult.error}`);
        }
      }
    }

    // Save conditional logic rules if provided
    if (questionData.conditionalRules && questionData.conditionalRules.length > 0) {
      Logger.log(`💡 Saving ${questionData.conditionalRules.length} conditional rules for question ${questionId}`);
      const rulesResult = createConditionalRules(questionId, questionData.formId, questionData.conditionalRules);
      if (!rulesResult.success) {
        Logger.log(`⚠️ Warning: Failed to save conditional rules: ${rulesResult.error}`);
      }
    }

    // Add column to response sheet for this question
    Logger.log(`📊 Adding response sheet column for question ${questionId}`);
    const columnResult = addResponseSheetColumn(
      questionData.formId,
      questionId,
      questionData.questionText,
      questionData.questionOrder
    );
    if (!columnResult.success) {
      Logger.log(`⚠️ Warning: Failed to add response sheet column: ${columnResult.error}`);
    }

    return {
      success: true,
      questionId: questionId
    };

  } catch (error) {
    Logger.log(`❌ Error creating question: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update question
 * @param {string} questionId - Question ID
 * @param {Object} questionData - Updated question data
 * @returns {Object} {success}
 */
function updateQuestion(questionId, questionData) {
  try {
    Logger.log(`❓ Updating question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const questionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);
    const data = questionSheet.getDataRange().getValues();

    // Find question row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === questionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Question not found' };
    }

    const timestamp = formatFormsTimestamp();

    // Update all fields that are provided (comprehensive support for all 34 question types)
    if (questionData.questionOrder !== undefined) {
      questionSheet.getRange(rowIndex, 3).setValue(questionData.questionOrder); // C
    }
    if (questionData.questionType !== undefined) {
      questionSheet.getRange(rowIndex, 4).setValue(questionData.questionType); // D
    }
    if (questionData.questionText !== undefined) {
      questionSheet.getRange(rowIndex, 5).setValue(questionData.questionText); // E
    }
    if (questionData.helpText !== undefined || questionData.questionDescription !== undefined) {
      questionSheet.getRange(rowIndex, 6).setValue(questionData.helpText || questionData.questionDescription); // F
    }
    if (questionData.isRequired !== undefined) {
      questionSheet.getRange(rowIndex, 7).setValue(questionData.isRequired); // G
    }
    if (questionData.placeholderText !== undefined) {
      questionSheet.getRange(rowIndex, 8).setValue(questionData.placeholderText); // H
    }
    if (questionData.validationType !== undefined) {
      questionSheet.getRange(rowIndex, 9).setValue(questionData.validationType); // I
    }
    if (questionData.validationPattern !== undefined) {
      questionSheet.getRange(rowIndex, 10).setValue(questionData.validationPattern); // J
    }
    if (questionData.validationMessage !== undefined) {
      questionSheet.getRange(rowIndex, 11).setValue(questionData.validationMessage); // K
    }
    if (questionData.minLength !== undefined) {
      questionSheet.getRange(rowIndex, 12).setValue(questionData.minLength); // L
    }
    if (questionData.maxLength !== undefined) {
      questionSheet.getRange(rowIndex, 13).setValue(questionData.maxLength); // M
    }
    if (questionData.minValue !== undefined) {
      questionSheet.getRange(rowIndex, 14).setValue(questionData.minValue); // N
    }
    if (questionData.maxValue !== undefined) {
      questionSheet.getRange(rowIndex, 15).setValue(questionData.maxValue); // O
    }
    if (questionData.minSelections !== undefined) {
      questionSheet.getRange(rowIndex, 16).setValue(questionData.minSelections); // P
    }
    if (questionData.maxSelections !== undefined) {
      questionSheet.getRange(rowIndex, 17).setValue(questionData.maxSelections); // Q
    }
    if (questionData.allowOtherOption !== undefined) {
      questionSheet.getRange(rowIndex, 18).setValue(questionData.allowOtherOption); // R
    }
    if (questionData.fileTypesAllowed !== undefined) {
      questionSheet.getRange(rowIndex, 19).setValue(questionData.fileTypesAllowed); // S
    }
    if (questionData.maxFileSizeMB !== undefined) {
      questionSheet.getRange(rowIndex, 20).setValue(questionData.maxFileSizeMB); // T
    }
    if (questionData.scaleStart !== undefined) {
      questionSheet.getRange(rowIndex, 21).setValue(questionData.scaleStart); // U
    }
    if (questionData.scaleEnd !== undefined) {
      questionSheet.getRange(rowIndex, 22).setValue(questionData.scaleEnd); // V
    }
    if (questionData.scaleStartLabel !== undefined) {
      questionSheet.getRange(rowIndex, 23).setValue(questionData.scaleStartLabel); // W
    }
    if (questionData.scaleEndLabel !== undefined) {
      questionSheet.getRange(rowIndex, 24).setValue(questionData.scaleEndLabel); // X
    }
    if (questionData.conditionalLogicId !== undefined) {
      questionSheet.getRange(rowIndex, 25).setValue(questionData.conditionalLogicId); // Y
    }
    if (questionData.notes !== undefined) {
      questionSheet.getRange(rowIndex, 28).setValue(questionData.notes); // AB
    }

    // NEW FIELDS FOR ALL 34 QUESTION TYPES
    if (questionData.randomizeOptions !== undefined) {
      questionSheet.getRange(rowIndex, 29).setValue(questionData.randomizeOptions); // AC
    }
    if (questionData.allowMultipleSelections !== undefined) {
      questionSheet.getRange(rowIndex, 30).setValue(questionData.allowMultipleSelections); // AD
    }
    if (questionData.selectionLimitType !== undefined) {
      questionSheet.getRange(rowIndex, 31).setValue(questionData.selectionLimitType); // AE
    }
    if (questionData.collectName !== undefined) {
      questionSheet.getRange(rowIndex, 32).setValue(questionData.collectName); // AF
    }
    if (questionData.collectEmail !== undefined) {
      questionSheet.getRange(rowIndex, 33).setValue(questionData.collectEmail); // AG
    }
    if (questionData.collectPhone !== undefined) {
      questionSheet.getRange(rowIndex, 34).setValue(questionData.collectPhone); // AH
    }
    if (questionData.collectAddress !== undefined) {
      questionSheet.getRange(rowIndex, 35).setValue(questionData.collectAddress); // AI
    }
    if (questionData.ratingType !== undefined) {
      questionSheet.getRange(rowIndex, 36).setValue(questionData.ratingType); // AJ
    }
    if (questionData.ratingScale !== undefined) {
      questionSheet.getRange(rowIndex, 37).setValue(questionData.ratingScale); // AK
    }
    if (questionData.scaleMin !== undefined) {
      questionSheet.getRange(rowIndex, 38).setValue(questionData.scaleMin); // AL
    }
    if (questionData.scaleMax !== undefined) {
      questionSheet.getRange(rowIndex, 39).setValue(questionData.scaleMax); // AM
    }
    if (questionData.scaleMinLabel !== undefined) {
      questionSheet.getRange(rowIndex, 40).setValue(questionData.scaleMinLabel); // AN
    }
    if (questionData.scaleMaxLabel !== undefined) {
      questionSheet.getRange(rowIndex, 41).setValue(questionData.scaleMaxLabel); // AO
    }
    if (questionData.scaleMidLabel !== undefined) {
      questionSheet.getRange(rowIndex, 42).setValue(questionData.scaleMidLabel); // AP
    }
    if (questionData.matrixRows !== undefined) {
      questionSheet.getRange(rowIndex, 43).setValue(JSON.stringify(questionData.matrixRows)); // AQ
    }
    if (questionData.matrixColumns !== undefined) {
      questionSheet.getRange(rowIndex, 44).setValue(JSON.stringify(questionData.matrixColumns)); // AR
    }
    if (questionData.matrixType !== undefined) {
      questionSheet.getRange(rowIndex, 45).setValue(questionData.matrixType); // AS
    }
    if (questionData.dateFormat !== undefined) {
      questionSheet.getRange(rowIndex, 46).setValue(questionData.dateFormat); // AT
    }
    if (questionData.restrictPast !== undefined) {
      questionSheet.getRange(rowIndex, 47).setValue(questionData.restrictPast); // AU
    }
    if (questionData.restrictFuture !== undefined) {
      questionSheet.getRange(rowIndex, 48).setValue(questionData.restrictFuture); // AV
    }
    if (questionData.mediaUrl !== undefined) {
      questionSheet.getRange(rowIndex, 49).setValue(questionData.mediaUrl); // AW
    }
    if (questionData.mediaType !== undefined) {
      questionSheet.getRange(rowIndex, 50).setValue(questionData.mediaType); // AX
    }
    if (questionData.autoplay !== undefined) {
      questionSheet.getRange(rowIndex, 51).setValue(questionData.autoplay); // AY
    }
    if (questionData.stripeAmount !== undefined) {
      questionSheet.getRange(rowIndex, 52).setValue(questionData.stripeAmount); // AZ
    }
    if (questionData.stripeCurrency !== undefined) {
      questionSheet.getRange(rowIndex, 53).setValue(questionData.stripeCurrency); // BA
    }
    if (questionData.driveType !== undefined) {
      questionSheet.getRange(rowIndex, 54).setValue(questionData.driveType); // BB
    }
    if (questionData.calendlyUrl !== undefined) {
      questionSheet.getRange(rowIndex, 55).setValue(questionData.calendlyUrl); // BC
    }
    if (questionData.aiContext !== undefined) {
      questionSheet.getRange(rowIndex, 56).setValue(questionData.aiContext); // BD
    }
    if (questionData.aiFaqData !== undefined) {
      questionSheet.getRange(rowIndex, 57).setValue(questionData.aiFaqData); // BE
    }
    if (questionData.redirectUrl !== undefined) {
      questionSheet.getRange(rowIndex, 58).setValue(questionData.redirectUrl); // BF
    }
    if (questionData.redirectDelay !== undefined) {
      questionSheet.getRange(rowIndex, 59).setValue(questionData.redirectDelay); // BG
    }
    if (questionData.statementContent !== undefined) {
      questionSheet.getRange(rowIndex, 60).setValue(questionData.statementContent); // BH
    }
    if (questionData.groupedQuestionIds !== undefined) {
      questionSheet.getRange(rowIndex, 61).setValue(JSON.stringify(questionData.groupedQuestionIds)); // BI
    }

    // Group Selection fields
    if (questionData.minGroupSize !== undefined) {
      questionSheet.getRange(rowIndex, 62).setValue(questionData.minGroupSize); // BJ
    }
    if (questionData.maxGroupSize !== undefined) {
      questionSheet.getRange(rowIndex, 63).setValue(questionData.maxGroupSize); // BK
    }
    if (questionData.restrictStudents !== undefined) {
      questionSheet.getRange(rowIndex, 64).setValue(questionData.restrictStudents); // BL
    }
    if (questionData.eligibleStudents !== undefined) {
      questionSheet.getRange(rowIndex, 65).setValue(questionData.eligibleStudents); // BM
    }

    // Always update timestamp
    questionSheet.getRange(rowIndex, 27).setValue(timestamp); // AA - Updated_At

    // Update conditional logic rules if provided
    if (questionData.conditionalRules !== undefined) {
      if (questionData.conditionalRules && questionData.conditionalRules.length > 0) {
        Logger.log(`💡 Updating ${questionData.conditionalRules.length} conditional rules for question ${questionId}`);
        const rulesResult = updateConditionalRules(questionId, questionData.formId, questionData.conditionalRules);
        if (!rulesResult.success) {
          Logger.log(`⚠️ Warning: Failed to update conditional rules: ${rulesResult.error}`);
        }
      } else {
        // Empty array means delete all rules
        Logger.log(`💡 Removing all conditional rules for question ${questionId}`);
        const deleteResult = deleteConditionalRules(questionId);
        if (!deleteResult.success) {
          Logger.log(`⚠️ Warning: Failed to delete conditional rules: ${deleteResult.error}`);
        }
      }
    }

    // Update options if provided
    if (questionData.options !== undefined) {
      Logger.log(`📋 Updating options for question ${questionId}`);

      // First, delete all existing options for this question
      const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);
      const optionData = optionSheet.getDataRange().getValues();

      for (let i = optionData.length - 1; i >= 1; i--) {
        const optionQuestionId = String(optionData[i][1]).trim();
        const currentQuestionId = String(questionId).trim();
        if (optionQuestionId === currentQuestionId) {
          optionSheet.deleteRow(i + 1);
        }
      }

      // Then add new options
      if (questionData.options && questionData.options.length > 0) {
        Logger.log(`📋 Saving ${questionData.options.length} new options for question ${questionId}`);
        for (let i = 0; i < questionData.options.length; i++) {
          const option = questionData.options[i];
          const optionResult = createOption({
            questionId: questionId,
            optionOrder: option.order || i + 1,
            optionText: option.optionText,
            optionValue: option.optionValue || option.optionText,
            hasImage: option.hasImage || 'No',
            imageUrl: option.imageUrl || '',
            jumpToQuestionId: option.jumpToQuestionId || '',
            notes: option.notes || ''
          });
          if (!optionResult.success) {
            Logger.log(`⚠️ Warning: Failed to save option ${i + 1}: ${optionResult.error}`);
          }
        }
      }
    }

    // Update response sheet column header if question text or order changed
    if (questionData.questionText !== undefined || questionData.questionOrder !== undefined) {
      Logger.log(`📊 Updating response sheet column header for question ${questionId}`);
      const columnResult = updateResponseSheetColumnHeader(
        questionData.formId,
        questionId,
        questionData.questionText || data[rowIndex - 1][4], // Use existing text if not provided
        questionData.questionOrder || data[rowIndex - 1][2]  // Use existing order if not provided
      );
      if (!columnResult.success) {
        Logger.log(`⚠️ Warning: Failed to update response sheet column: ${columnResult.error}`);
      }
    }

    Logger.log(`✅ Question updated: ${questionId}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error updating question: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete question
 * @param {string} questionId - Question ID
 * @returns {Object} {success}
 */
function deleteQuestion(questionId) {
  try {
    Logger.log(`🗑️ Deleting question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const questionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);
    const data = questionSheet.getDataRange().getValues();

    // Find question row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === questionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Question not found' };
    }

    // Delete row
    questionSheet.deleteRow(rowIndex);

    // Also delete associated options
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);
    const optionData = optionSheet.getDataRange().getValues();

    for (let i = optionData.length - 1; i >= 1; i--) {
      if (optionData[i][1] === questionId) { // Question_ID column
        optionSheet.deleteRow(i + 1);
      }
    }

    // Also delete associated conditional logic rules
    Logger.log(`💡 Deleting conditional rules for question ${questionId}`);
    const deleteRulesResult = deleteConditionalRules(questionId);
    if (!deleteRulesResult.success) {
      Logger.log(`⚠️ Warning: Failed to delete conditional rules: ${deleteRulesResult.error}`);
    }

    Logger.log(`✅ Question deleted: ${questionId}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error deleting question: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== OPTIONS CRUD ====================

/**
 * Create option for a question
 * @param {Object} optionData - Option data
 * @returns {Object} {success, optionId}
 */
function createOption(optionData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);

    const optionId = generateFormsId('OPT');
    const timestamp = formatFormsTimestamp();

    const row = [
      optionId,                               // A - Option_ID
      optionData.questionId,                  // B - Question_ID
      optionData.optionOrder,                 // C - Option_Order
      optionData.optionText,                  // D - Option_Text
      optionData.optionValue || optionData.optionText, // E - Option_Value
      optionData.hasImage || 'No',            // F - Has_Image
      optionData.imageUrl || '',              // G - Image_URL
      optionData.jumpToQuestionId || '',      // H - Jump_To_Question_ID
      timestamp,                              // I - Created_At
      optionData.notes || ''                  // J - Notes
    ];

    optionSheet.appendRow(row);

    return {
      success: true,
      optionId: optionId
    };

  } catch (error) {
    Logger.log(`❌ Error creating option: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete option
 * @param {string} optionId - Option ID
 * @returns {Object} {success}
 */
function deleteOption(optionId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);
    const data = optionSheet.getDataRange().getValues();

    // Find option row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === optionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Option not found' };
    }

    // Delete row
    optionSheet.deleteRow(rowIndex);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error deleting option: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== CONDITIONAL LOGIC CRUD ====================

/**
 * Create conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @param {string} formId - Form ID
 * @param {Array} rules - Array of conditional rules [{questionIndex, operator, value}]
 * @returns {Object} {success}
 */
function createConditionalRules(questionId, formId, rules) {
  try {
    if (!rules || rules.length === 0) {
      return { success: true }; // No rules to create
    }

    Logger.log(`🔀 Creating ${rules.length} conditional rules for question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const timestamp = formatFormsTimestamp();

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleId = generateFormsId('RULE');

      const row = [
        ruleId,                                   // A - Rule_ID
        questionId,                               // B - Question_ID
        formId,                                   // C - Form_ID
        rule.questionIndex,                       // D - Target_Question_Index
        rule.operator || 'equals',                // E - Operator
        rule.value || '',                         // F - Value
        'show',                                   // G - Action (show/hide)
        i + 1,                                    // H - Rule_Order
        timestamp,                                // I - Created_At
        ''                                        // J - Notes
      ];

      logicSheet.appendRow(row);
    }

    Logger.log(`✅ Created ${rules.length} conditional rules`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error creating conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @returns {Object} {success, data: [rules]}
 */
function getConditionalRules(questionId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const data = logicSheet.getDataRange().getValues();
    const rules = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row[1] === questionId) { // Question_ID column
        rules.push({
          ruleId: row[0],
          questionId: row[1],
          formId: row[2],
          questionIndex: row[3],
          operator: row[4],
          value: row[5],
          action: row[6],
          order: row[7],
          createdAt: row[8],
          notes: row[9]
        });
      }
    }

    // Sort by order
    rules.sort((a, b) => a.order - b.order);

    return {
      success: true,
      data: rules
    };

  } catch (error) {
    Logger.log(`❌ Error getting conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Update conditional logic rules for a question
 * Deletes existing rules and creates new ones
 * @param {string} questionId - Question ID
 * @param {string} formId - Form ID
 * @param {Array} rules - New array of conditional rules
 * @returns {Object} {success}
 */
function updateConditionalRules(questionId, formId, rules) {
  try {
    Logger.log(`🔀 Updating conditional rules for question: ${questionId}`);

    // Delete existing rules
    const deleteResult = deleteConditionalRules(questionId);
    if (!deleteResult.success) {
      return deleteResult;
    }

    // Create new rules
    const createResult = createConditionalRules(questionId, formId, rules);
    return createResult;

  } catch (error) {
    Logger.log(`❌ Error updating conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete all conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @returns {Object} {success}
 */
function deleteConditionalRules(questionId) {
  try {
    Logger.log(`🗑️ Deleting conditional rules for question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const data = logicSheet.getDataRange().getValues();

    // Delete rows in reverse order to avoid index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === questionId) { // Question_ID column
        logicSheet.deleteRow(i + 1);
      }
    }

    Logger.log(`✅ Deleted conditional rules for question: ${questionId}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error deleting conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== DYNAMIC RESPONSE SHEET COLUMNS ====================

/**
 * Get or create a response sheet for a form
 * Each form has its own response sheet in the form's folder
 * @param {string} formId - Form ID
 * @returns {Object} {success, sheet, sheetUrl}
 */
function getOrCreateFormResponseSheet(formId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const formsSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.FORMS);
    const data = formsSheet.getDataRange().getValues();

    // Find form
    let formRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === formId) {
        formRow = data[i];
        break;
      }
    }

    if (!formRow) {
      return { success: false, error: 'Form not found' };
    }

    const responseSheetUrl = formRow[15]; // Column P - Response_Sheet_Link

    Logger.log(`📊 Response Sheet URL from Forms sheet: ${responseSheetUrl}`);

    // If response sheet already exists, open it
    if (responseSheetUrl && responseSheetUrl.trim() !== '') {
      try {
        // Extract sheet ID from various URL formats
        let sheetId = null;

        if (responseSheetUrl.includes('/spreadsheets/d/')) {
          sheetId = responseSheetUrl.split('/spreadsheets/d/')[1].split('/')[0];
        } else if (responseSheetUrl.includes('spreadsheets/d/')) {
          sheetId = responseSheetUrl.split('spreadsheets/d/')[1].split('/')[0];
        } else if (responseSheetUrl.includes('?id=')) {
          sheetId = responseSheetUrl.split('?id=')[1].split('&')[0];
        } else {
          // Assume it's just the ID
          sheetId = responseSheetUrl.trim();
        }

        Logger.log(`📊 Attempting to open response sheet with ID: ${sheetId}`);

        const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
        const sheet = responseSpreadsheet.getSheets()[0]; // First sheet

        Logger.log(`✅ Successfully opened existing response sheet: ${sheet.getName()}`);

        return {
          success: true,
          sheet: sheet,
          sheetUrl: responseSheetUrl
        };
      } catch (e) {
        Logger.log(`❌ ERROR: Could not open existing response sheet: ${e.message}`);
        Logger.log(`❌ Sheet URL: ${responseSheetUrl}`);
        Logger.log(`❌ This usually means: (1) Sheet was deleted, (2) Permission issue, or (3) Invalid URL`);

        // Return error instead of creating new sheet automatically
        return {
          success: false,
          error: `Cannot access response sheet. Error: ${e.message}. Please check if the sheet exists and is accessible, or clear the Response_Sheet_Link field to create a new one.`
        };
      }
    }

    Logger.log(`📊 No existing response sheet found, creating new one...`);

    // Create new response sheet in form's folder
    const formFolderUrl = formRow[13]; // Column N - Drive_Link (form folder)
    let folderId = FORMS_API_CONFIG.MAIN_DRIVE_FOLDER_ID;

    if (formFolderUrl && formFolderUrl.includes('/folders/')) {
      folderId = formFolderUrl.split('/folders/')[1].split('?')[0];
    }

    const folder = DriveApp.getFolderById(folderId);
    const formName = formRow[5]; // Column F - Form_Name

    // Create new spreadsheet for responses
    const responseSpreadsheet = SpreadsheetApp.create(`${formName} - Responses`);
    const sheet = responseSpreadsheet.getSheets()[0];
    sheet.setName('Responses');

    // Move to form folder
    const file = DriveApp.getFileById(responseSpreadsheet.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    const newSheetUrl = responseSpreadsheet.getUrl();

    // Update form with response sheet URL
    const formRowIndex = data.findIndex(row => row[0] === formId) + 1;
    formsSheet.getRange(formRowIndex, 16).setValue(newSheetUrl); // Column P

    // Set up initial columns (A-N are standard, O onwards are dynamic question columns)
    const headers = [
      'Response_ID',           // A
      'Form_ID',              // B
      'User_Email',           // C
      'User_Name',            // D
      'User_Batch',           // E
      'Submission_DateTime',  // F
      'Response_JSON',        // G - Keep JSON for backup/complex answers
      'IP_Address',           // H
      'Completion_Time_Seconds', // I
      'Is_Complete',          // J
      'Last_Modified_At',     // K
      'Device_Type',          // L
      'Notes',                // M
      'Updated'               // N - 'Yes' for 2nd+ submissions
    ];

    // Check if form has Group Selection questions - if so, add group columns
    const questionsSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.QUESTIONS);
    const questionsData = questionsSheet.getDataRange().getValues();

    let hasGroupSelection = false;
    for (let i = 1; i < questionsData.length; i++) {
      const questionFormId = questionsData[i][1]; // Column B - Form_ID
      const questionType = questionsData[i][3];   // Column D - Question_Type

      if (questionFormId === formId && (questionType === 'group_selection' || questionType === 'Group Selection')) {
        hasGroupSelection = true;
        break;
      }
    }

    if (hasGroupSelection) {
      headers.push('Group_Member_IDs');      // O
      headers.push('Group_Member_Names');    // P
      headers.push('Filled_By_Name');        // Q
      Logger.log(`📊 Form has Group Selection questions - adding group columns`);
    }

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    Logger.log(`✅ Created response sheet for form ${formId}: ${newSheetUrl}`);

    return {
      success: true,
      sheet: sheet,
      sheetUrl: newSheetUrl
    };

  } catch (error) {
    Logger.log(`❌ Error getting/creating response sheet: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add a dynamic column to the response sheet for a question
 * @param {string} formId - Form ID
 * @param {string} questionId - Question ID
 * @param {string} questionText - Question text (column header)
 * @param {number} questionOrder - Question order (for column ordering)
 * @returns {Object} {success, columnIndex}
 */
function addResponseSheetColumn(formId, questionId, questionText, questionOrder) {
  try {
    Logger.log(`📊 Adding response column for question ${questionId}: "${questionText}"`);

    const sheetResult = getOrCreateFormResponseSheet(formId);
    if (!sheetResult.success) {
      return sheetResult;
    }

    const sheet = sheetResult.sheet;

    // Check if column already exists (check both old and new format)
    const existingColumnIndex = getResponseSheetColumnIndex(sheet, questionId);

    if (existingColumnIndex !== -1) {
      Logger.log(`⚠️ Column for question ${questionId} already exists at index ${existingColumnIndex}`);
      return {
        success: true,
        columnIndex: existingColumnIndex,
        message: 'Column already exists'
      };
    }

    // Add new column at the end
    const newColumnIndex = sheet.getLastColumn() + 1;

    // Set column header: Use just the question text for simplicity
    const headerText = questionText;
    sheet.getRange(1, newColumnIndex).setValue(headerText);
    sheet.getRange(1, newColumnIndex).setNote(`Question ID: ${questionId}`);
    sheet.getRange(1, newColumnIndex).setFontWeight('bold');

    Logger.log(`✅ Added column at index ${newColumnIndex} for question ${questionId}`);

    return {
      success: true,
      columnIndex: newColumnIndex
    };

  } catch (error) {
    Logger.log(`❌ Error adding response sheet column: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update response sheet column header when question text changes
 * @param {string} formId - Form ID
 * @param {string} questionId - Question ID
 * @param {string} newQuestionText - New question text
 * @param {number} questionOrder - Question order
 * @returns {Object} {success}
 */
function updateResponseSheetColumnHeader(formId, questionId, newQuestionText, questionOrder) {
  try {
    Logger.log(`📊 Updating response column header for question ${questionId}`);

    const sheetResult = getOrCreateFormResponseSheet(formId);
    if (!sheetResult.success) {
      return sheetResult;
    }

    const sheet = sheetResult.sheet;

    // Find column by question ID (works with both old and new format)
    const columnIndex = getResponseSheetColumnIndex(sheet, questionId);

    if (columnIndex === -1) {
      Logger.log(`⚠️ Column for question ${questionId} not found, will create it`);
      return addResponseSheetColumn(formId, questionId, newQuestionText, questionOrder);
    }

    // Update header and note with new question text
    const headerText = newQuestionText;
    sheet.getRange(1, columnIndex).setValue(headerText);
    sheet.getRange(1, columnIndex).setNote(`Question ID: ${questionId}`);

    Logger.log(`✅ Updated column header at index ${columnIndex}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error updating response sheet column: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get the column index for a question ID in the response sheet
 * @param {Object} sheet - Response sheet object
 * @param {string} questionId - Question ID
 * @returns {number} Column index (1-based), or -1 if not found
 */
function getResponseSheetColumnIndex(sheet, questionId) {
  try {
    const lastColumn = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    // First try old format: Q_<questionId>
    let columnIndex = headers.findIndex(h => h === `Q_${questionId}`) + 1;

    // If not found, try new format: check notes for Question ID
    if (columnIndex === 0) {
      for (let i = 0; i < lastColumn; i++) {
        const note = sheet.getRange(1, i + 1).getNote();
        if (note && note.includes(`Question ID: ${questionId}`)) {
          columnIndex = i + 1;
          break;
        }
      }
    }

    return columnIndex > 0 ? columnIndex : -1;
  } catch (error) {
    Logger.log(`❌ Error getting column index: ${error.message}`);
    return -1;
  }
}

// ==================== RESPONSE ANALYTICS ====================

/**
 * Get all responses for a form
 * @param {string} formId - Form ID
 * @returns {Object} {success, data: [responses]}
 */
function getFormResponses(formId) {
  try {
    Logger.log(`📊 Getting responses for form: ${formId}`);

    // Get form-specific response sheet (same as submission)
    const sheetResult = getOrCreateFormResponseSheet(formId);
    if (!sheetResult.success) {
      Logger.log(`❌ Error getting response sheet: ${sheetResult.error}`);
      return { success: false, error: sheetResult.error };
    }

    const sheet = sheetResult.sheet;
    const data = sheet.getDataRange().getValues();

    // Get headers dynamically to support any number of columns
    const headers = data[0];
    Logger.log(`📊 Response sheet has ${headers.length} columns`);

    const responses = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Build response object with fixed columns
      const response = {
        responseId: row[0],
        formId: row[1],
        userEmail: row[2],
        userName: row[3],
        userBatch: row[4],
        submissionDateTime: row[5],
        responseData: JSON.parse(row[6] || '{}'),
        ipAddress: row[7],
        completionTimeSeconds: row[8],
        isComplete: row[9],
        lastModifiedAt: row[10],
        deviceType: row[11],
        notes: row[12]
      };

      // Add all additional columns dynamically (column 13 onwards = index 13+)
      // These are the individual question columns
      const additionalColumns = {};
      for (let colIndex = 13; colIndex < row.length; colIndex++) {
        const columnName = headers[colIndex];
        const columnValue = row[colIndex];
        if (columnName) {
          additionalColumns[columnName] = columnValue || '';
        }
      }

      // Add additional columns to response object
      if (Object.keys(additionalColumns).length > 0) {
        response.additionalColumns = additionalColumns;
      }

      responses.push(response);
    }

    Logger.log(`✅ Found ${responses.length} responses with ${headers.length} total columns`);

    return {
      success: true,
      data: responses,
      headers: headers // Return headers so frontend knows what columns exist
    };

  } catch (error) {
    Logger.log(`❌ Error getting responses: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get response statistics for a form
 * @param {string} formId - Form ID
 * @returns {Object} {success, stats}
 */
function getResponseStats(formId) {
  try {
    const responsesResult = getFormResponses(formId);
    if (!responsesResult.success) {
      return responsesResult;
    }

    const responses = responsesResult.data;

    // Calculate stats
    const stats = {
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.isComplete === 'Yes').length,
      averageCompletionTime: 0,
      responsesByBatch: {},
      responsesByDate: {}
    };

    // Calculate average completion time
    const completionTimes = responses
      .filter(r => r.completionTimeSeconds)
      .map(r => parseInt(r.completionTimeSeconds));

    if (completionTimes.length > 0) {
      stats.averageCompletionTime = Math.round(
        completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      );
    }

    // Group by batch
    responses.forEach(r => {
      const batch = r.userBatch || 'Unknown';
      stats.responsesByBatch[batch] = (stats.responsesByBatch[batch] || 0) + 1;
    });

    // Group by date
    responses.forEach(r => {
      const date = r.submissionDateTime.split(' ')[0]; // Get date part
      stats.responsesByDate[date] = (stats.responsesByDate[date] || 0) + 1;
    });

    return {
      success: true,
      stats: stats
    };

  } catch (error) {
    Logger.log(`❌ Error getting stats: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
// ============================================================================
// FORMS HELPER APIs - Get Data for Form Builder Dropdowns
// ============================================================================

/**
 * Get batch, term, domain, subject options from Term subsheet
 * @return {Object} Success response with term data
 */
function getTermStructure() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const termSheet = ss.getSheetByName('Term');

    if (!termSheet) {
      return {
        success: false,
        error: 'Term sheet not found'
      };
    }

    const data = termSheet.getDataRange().getValues();

    // Build term structure with cascading dropdowns
    const terms = new Set();
    const batches = new Set();
    const mappings = [];

    // Parse all rows and create flat mappings for cascading dropdowns
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const batch = row[0];
      const term = row[1];
      const domain = row[2];
      const subject = row[3];

      if (batch && term && domain && subject) {
        terms.add(term);
        batches.add(batch);

        // Add each unique combination as a mapping
        mappings.push({
          batch: batch,
          term: term,
          domain: domain,
          subject: subject
        });
      }
    }

    return {
      success: true,
      data: {
        terms: Array.from(terms).sort(),
        mappings: mappings,
        batches: Array.from(batches).sort()
      }
    };

  } catch (error) {
    Logger.log('Error in getTermStructure: ' + error.message);
    return {
      success: false,
      error: 'Failed to get term structure: ' + error.message
    };
  }
}

/**
 * Get form types from CATEGORY&TYPE subsheet where Category = 'FORMS'
 * @return {Object} Success response with form types
 */
function getFormTypes() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const categorySheet = ss.getSheetByName('CATEGORY&TYPE');
    
    if (!categorySheet) {
      return {
        success: false,
        error: 'CATEGORY&TYPE sheet not found'
      };
    }

    const data = categorySheet.getDataRange().getValues();
    const formTypes = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const category = row[0]; // Column A: Category
      const type = row[1];     // Column B: Type
      
      if (category && category.toString().toUpperCase() === 'FORMS' && type) {
        formTypes.push(type.toString());
      }
    }

    return {
      success: true,
      data: formTypes.sort()
    };

  } catch (error) {
    Logger.log('Error in getFormTypes: ' + error.message);
    return {
      success: false,
      error: 'Failed to get form types: ' + error.message
    };
  }
}

/**
 * Upload Resume PDF to Google Drive
 * Structure: Main Folder > Batch > Student Name > domain_name_Resume.pdf
 * @param {string} studentEmail - Student email
 * @param {string} pdfData - Base64 encoded PDF data
 * @param {number} domainNumber - Domain number (1, 2, or 0 for general)
 * @param {string} fileName - Original file name
 * @param {string} domainName - Domain name for better file naming (optional)
 * @returns {Object} {success, fileUrl, error}
 */
function uploadResumePDF(studentEmail, pdfData, domainNumber, fileName, domainName) {
  try {
    Logger.log(`Uploading resume PDF for: ${studentEmail}, domain: ${domainNumber}, domainName: ${domainName}`);

    // Get student profile to find batch and name
    const studentProfile = getFullStudentProfile(studentEmail);
    if (!studentProfile.success) {
      return {
        success: false,
        error: 'Could not find student profile'
      };
    }

    const student = studentProfile.data;
    const batch = student.batch || 'Unknown';
    const studentName = student.fullName || studentEmail;

    Logger.log(`Student details - Batch: ${batch}, Name: ${studentName}`);

    // Get the main placement resume folder
    const mainFolder = DriveApp.getFolderById(PLACEMENT_RESUME_FOLDER_ID);

    // Create or get Batch folder
    const batchFolder = getOrCreateFolder(mainFolder, batch);
    Logger.log(`Batch folder: ${batchFolder.getName()}`);

    // Create or get Student Name folder
    const studentFolder = getOrCreateFolder(batchFolder, studentName);
    Logger.log(`Student folder: ${studentFolder.getName()}`);

    // Remove base64 prefix if present
    let base64Data = pdfData;
    if (pdfData.includes(',')) {
      base64Data = pdfData.split(',')[1];
    }

    // Create filename with format: "Student Name - Domain.pdf"
    let newFileName = fileName;
    if (domainName) {
      // Clean domain name but keep it readable (allow spaces, letters, numbers, slashes, hyphens)
      const cleanDomainName = domainName
        .replace(/[^a-zA-Z0-9\s\-\/]/g, '')
        .trim();
      newFileName = `${studentName} - ${cleanDomainName}.pdf`;
    } else if (domainNumber === 0 || domainNumber === '0') {
      newFileName = `${studentName} - General.pdf`;
    } else {
      newFileName = `${studentName} - Domain ${domainNumber}.pdf`;
    }

    Logger.log(`Creating file with name: ${newFileName}`);

    // Decode base64 data
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, 'application/pdf', newFileName);

    // Check if file already exists and delete it (check for the new filename pattern)
    const existingFiles = studentFolder.getFilesByName(newFileName);
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      Logger.log(`Deleting existing file: ${file.getName()}`);
      file.setTrashed(true);
    }

    // Upload the new file
    const uploadedFile = studentFolder.createFile(blob);
    Logger.log(`File uploaded: ${uploadedFile.getName()}`);

    // Set sharing permissions - anyone with link can view
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the file URL
    const fileUrl = uploadedFile.getUrl();
    Logger.log(`File URL: ${fileUrl}`);

    // Update the student profile with the new resume URL
    const updateData = {};
    updateData[`domain${domainNumber}ResumeURL`] = fileUrl;

    const updateResult = updateStudentProfile(studentEmail, updateData);
    if (!updateResult.success) {
      Logger.log(`Warning: Could not update profile with resume URL: ${updateResult.error}`);
    }

    return {
      success: true,
      fileUrl: fileUrl,
      message: 'Resume uploaded successfully'
    };

  } catch (error) {
    Logger.log(`Error uploading resume PDF: ${error.message}`);
    Logger.log(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}
// ================================================================================================
// JOB PORTAL FUNCTIONS - SSB Placement Management
// ================================================================================================

/**
 * Generate unique Job ID
 * Format: SSB-YYYY-TYPE-####
 * Example: SSB-2025-INT-0001
 */
function generateJobID(type) {
  const year = new Date().getFullYear();
  const typeCode = type === 'Internship' ? 'INT' : type === 'Full-Time' ? 'FT' : 'CON';

  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Find highest number for this type and year
    let maxNum = 0;
    const prefix = `SSB-${year}-${typeCode}-`;

    for (let i = 1; i < data.length; i++) {
      const jobId = data[i][0];
      if (jobId && jobId.startsWith(prefix)) {
        const num = parseInt(jobId.split('-')[3]);
        if (num > maxNum) maxNum = num;
      }
    }

    const newNum = String(maxNum + 1).padStart(4, '0');
    return `${prefix}${newNum}`;

  } catch (error) {
    Logger.log(`Error generating Job ID: ${error.message}`);
    // Fallback to timestamp-based ID
    return `SSB-${year}-${typeCode}-${Date.now()}`;
  }
}

/**
 * Create Drive folder structure for a job posting
 * Structure: Main Folder / Batch / Company - Role - JobID / JobFileUploads, StudentResumes
 */
function createJobDriveFolders(batch, company, role, jobId) {
  try {
    const mainFolder = DriveApp.getFolderById(JOB_PORTAL_DRIVE_FOLDER_ID);

    // Create or get Batch folder
    const batchFolder = getOrCreateFolder(mainFolder, batch);

    // Create job-specific folder
    const jobFolderName = `${company} - ${role} - ${jobId}`;
    const jobFolder = getOrCreateFolder(batchFolder, jobFolderName);

    // Create subfolders
    const jobFilesFolder = getOrCreateFolder(jobFolder, 'JobFileUploads');
    const studentResumesFolder = getOrCreateFolder(jobFolder, 'StudentResumes');

    return {
      success: true,
      jobFolderId: jobFolder.getId(),
      jobFolderUrl: jobFolder.getUrl(),
      studentResumesFolderId: studentResumesFolder.getId(),
      studentResumesFolderUrl: studentResumesFolder.getUrl(),
      jobFilesFolderId: jobFilesFolder.getId()
    };

  } catch (error) {
    Logger.log(`Error creating job folders: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create response sheet for job applications
 * Columns: Timestamp, Email, Name, Batch, ResumeURL, Q1-Q30 answers, AssignmentFileURL, Status
 */
function createJobResponseSheet(jobId, company, role, questions) {
  try {
    const sheetName = `${jobId} - Applications`;
    const responseSheet = SpreadsheetApp.create(sheetName);
    const sheet = responseSheet.getActiveSheet();

    // Build headers
    const headers = [
      'Application_ID',
      'JobID',
      'Timestamp',
      'Student_Email',
      'Student_Name',
      'Student_Batch',
      'Student_Roll_No',
      'Resume_URL',
      'Assignment_File_URL'
    ];

    // Add question headers (Q1 to Q30)
    for (let i = 1; i <= 30; i++) {
      headers.push(`Q${i}_Answer`);
    }

    headers.push('Application_Status'); // Pending/Shortlisted/Rejected
    headers.push('Admin_Notes');
    headers.push('Submitted_At');

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Move to job folder
    const responseFile = DriveApp.getFileById(responseSheet.getId());
    const jobFolder = DriveApp.getFolderById(JOB_PORTAL_DRIVE_FOLDER_ID);
    responseFile.moveTo(jobFolder);

    return {
      success: true,
      sheetId: responseSheet.getId(),
      sheetUrl: responseSheet.getUrl()
    };

  } catch (error) {
    Logger.log(`Error creating response sheet: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a new job posting
 *
 * COMPLETE SCHEMA (191 columns in sheet):
 * Columns 1-16: Basic Info
 * Columns 17-29: Compensation (CTC, ESOP, Bonus)
 * Columns 30-32: PPO Details (for Internships)
 * Columns 33-46: JD & Instructions (JD, Files, URLs)
 * Columns 47-166: Questions (30 questions × 4 fields = 120 columns)
 * Columns 167-172: Assignment (6 fields including AssignmentVisibility)
 * Columns 173-183: Eligibility & Visibility (11 fields including PPO/FTE visibility)
 * Columns 184-191: System Fields (Folder IDs, Status, Timestamps)
 *
 * Total: 191 columns in sheet
 */
function createJobPosting(jobData) {
  try {
    Logger.log('Creating new job posting...');

    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);

    // Generate Job ID
    const jobId = generateJobID(jobData.type);
    Logger.log(`Generated Job ID: ${jobId}`);

    // Create Drive folders
    const folderResult = createJobDriveFolders(
      jobData.batch,
      jobData.company,
      jobData.role,
      jobId
    );

    if (!folderResult.success) {
      return folderResult;
    }

    // Create response sheet
    const sheetResult = createJobResponseSheet(jobId, jobData.company, jobData.role, jobData.questions || []);

    if (!sheetResult.success) {
      return sheetResult;
    }

    // Prepare row data (178 columns total based on schema)
    const row = [
      jobId, // JobID
      jobData.batch || '',
      jobData.type || '',
      jobData.source || '',
      jobData.company || '',
      jobData.role || '',
      jobData.companyURL || '',
      jobData.location || '',
      jobData.workMode || '',
      jobData.eligibilityMonths || '',
      jobData.requiredSkills || '',
      jobData.roleTags || '',
      jobData.ctcType || '',
      jobData.ctcValue || '',
      jobData.ctcValueSecondary || '',
      jobData.ctcDisplay || '',
      jobData.esopType || 'None',
      jobData.esopValue || '',
      jobData.esopValueSecondary || '',
      jobData.esopDisplay || '',
      jobData.bonusType || 'None',
      jobData.bonusValue || '',
      jobData.bonusValueSecondary || '',
      jobData.bonusDisplay || '',
      jobData.compensationDisplay || '',
      jobData.ppoOpportunity || 'No', // PPO Field 1
      jobData.ppoCTCRange || '', // PPO Field 2
      jobData.ppoIncludes || '', // PPO Field 3
      jobData.jdHTML || '',
      jobData.jdFileURL || '', // JD File URL
      jobData.applicationInstructions || '',
      jobData.adminURL1 || '',
      jobData.adminURL2 || '',
      jobData.adminURL3 || '',
      jobData.adminURL4 || '',
      jobData.adminURL5 || '',
      jobData.fileAttachmentName1 || '',
      jobData.fileAttachmentURL1 || '',
      jobData.fileAttachmentName2 || '',
      jobData.fileAttachmentURL2 || '',
      jobData.fileAttachmentName3 || '',
      jobData.fileAttachmentURL3 || '',
      jobData.applicationStartTime || '',
      jobData.applicationEndTime || '',
      folderResult.jobFolderUrl, // Drive Link
      folderResult.studentResumesFolderUrl, // StudentDriveLink
      sheetResult.sheetUrl // SheetsLink
    ];

    // Add 30 questions (Q1-Q30), each with Text, Type, Options, Required (4 fields × 30 = 120 fields)
    for (let i = 1; i <= 30; i++) {
      const q = jobData.questions?.find(q => q.number === i) || {};
      row.push(q.text || '');
      row.push(q.type || '');
      row.push(q.options || '');
      row.push(q.required || 'No');
    }

    // Add assignment fields (5 fields + 1 new = 6 fields)
    row.push(jobData.hasAssignment || 'No');
    row.push(jobData.assignmentFileURL || '');
    row.push(jobData.assignmentDescription || '');
    row.push(jobData.assignmentDeadlineSameAsJob || 'Yes');
    row.push(jobData.assignmentDeadline || '');
    row.push(jobData.assignmentVisibility || 'Batch(s)'); // NEW FIELD

    // Add eligibility rules (7 existing + 4 new PPO visibility = 11 fields)
    row.push(jobData.showToBatchLevels || jobData.batch);
    row.push(jobData.showToNoOfferStudents || 'No');
    row.push(jobData.showToStudentsWithOneFT_PPO || 'No');
    row.push(jobData.showToStudentsWithNoPPO || 'No');
    row.push(jobData.showToStudentsWithInternships || 'No');
    row.push(jobData.showToStudentsWithZeroOffers || 'No');
    row.push(jobData.customVisibilityRule || '');
    row.push(jobData.showToStudentsWithPPO || 'No'); // NEW PPO visibility field
    row.push(jobData.showToStudentsWithoutPPO || 'No'); // NEW PPO visibility field
    row.push(jobData.showToStudentsWithFTE || 'No'); // NEW FTE visibility field
    row.push(jobData.showToStudentsWithoutFTE || 'No'); // NEW FTE visibility field

    // Add system columns
    row.push(folderResult.studentResumesFolderId); // ResumeFolderID
    row.push(sheetResult.sheetId); // ResponsesSheetID
    row.push(0); // ApplicationsCount
    row.push(jobData.status || 'Draft'); // Status
    row.push(jobData.createdBy || ''); // CreatedBy
    row.push(formatTimestampForSheets()); // CreatedAt
    row.push(''); // UpdatedBy
    row.push(''); // UpdatedAt

    // Append the row
    sheet.appendRow(row);

    Logger.log(`Job posting created successfully: ${jobId}`);

    return {
      success: true,
      jobId: jobId,
      message: 'Job posting created successfully',
      data: {
        jobId: jobId,
        driveUrl: folderResult.jobFolderUrl,
        responsesSheetUrl: sheetResult.sheetUrl
      }
    };

  } catch (error) {
    Logger.log(`Error creating job posting: ${error.message}`);
    Logger.log(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all job postings
 */
function getAllJobPostings(filters) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return {
        success: true,
        data: []
      };
    }

    const headers = data[0];
    const jobs = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if JobID is empty
      if (!row[0]) continue;

      const job = {
        jobId: row[0],
        batch: row[1],
        type: row[2],
        source: row[3],
        company: row[4],
        role: row[5],
        companyURL: row[6],
        location: row[7],
        workMode: row[8],
        eligibilityMonths: row[9],
        requiredSkills: row[10],
        roleTags: row[11],
        ctcType: row[12],
        ctcValue: row[13],
        ctcValueSecondary: row[14],
        ctcDisplay: row[15],
        esopType: row[16],
        esopValue: row[17],
        esopValueSecondary: row[18],
        esopDisplay: row[19],
        bonusType: row[20],
        bonusValue: row[21],
        bonusValueSecondary: row[22],
        bonusDisplay: row[23],
        compensationDisplay: row[24],
        ppoOpportunity: row[25],
        ppoCTCRange: row[26],
        ppoIncludes: row[27],
        jdHTML: row[28],
        jdFileURL: row[29],
        applicationInstructions: row[30],
        applicationStartTime: row[42],
        applicationEndTime: row[43],
        driveLink: row[44],
        studentDriveLink: row[45],
        sheetsLink: row[46],
        status: row[186],
        applicationsCount: row[185],
        createdBy: row[187],
        createdAt: row[188],
        updatedBy: row[189],
        updatedAt: row[190]
      };

      // Apply filters if provided
      if (filters) {
        if (filters.batch && job.batch !== filters.batch) continue;
        if (filters.type && job.type !== filters.type) continue;
        if (filters.status && job.status !== filters.status) continue;
      }

      jobs.push(job);
    }

    return {
      success: true,
      data: jobs
    };

  } catch (error) {
    Logger.log(`Error getting job postings: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get single job posting by ID
 */
function getJobPosting(jobId) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        const row = data[i];

        // Parse questions
        const questions = [];
        for (let q = 1; q <= 30; q++) {
          const baseIndex = 46 + (q - 1) * 4; // Questions start at column 47 (index 46)
          const qText = row[baseIndex];
          if (qText) {
            questions.push({
              number: q,
              text: qText,
              type: row[baseIndex + 1],
              options: row[baseIndex + 2],
              required: row[baseIndex + 3]
            });
          }
        }

        return {
          success: true,
          data: {
            jobId: row[0],
            batch: row[1],
            type: row[2],
            source: row[3],
            company: row[4],
            role: row[5],
            companyURL: row[6],
            location: row[7],
            workMode: row[8],
            eligibilityMonths: row[9],
            requiredSkills: row[10],
            roleTags: row[11],
            ctcType: row[12],
            ctcValue: row[13],
            ctcValueSecondary: row[14],
            ctcDisplay: row[15],
            esopType: row[16],
            esopValue: row[17],
            esopValueSecondary: row[18],
            esopDisplay: row[19],
            bonusType: row[20],
            bonusValue: row[21],
            bonusValueSecondary: row[22],
            bonusDisplay: row[23],
            compensationDisplay: row[24],
            ppoOpportunity: row[25],
            ppoCTCRange: row[26],
            ppoIncludes: row[27],
            jdHTML: row[28],
            jdFileURL: row[29],
            applicationInstructions: row[30],
            adminURL1: row[31],
            adminURL2: row[32],
            adminURL3: row[33],
            adminURL4: row[34],
            adminURL5: row[35],
            fileAttachmentName1: row[36],
            fileAttachmentURL1: row[37],
            fileAttachmentName2: row[38],
            fileAttachmentURL2: row[39],
            fileAttachmentName3: row[40],
            fileAttachmentURL3: row[41],
            applicationStartTime: row[42],
            applicationEndTime: row[43],
            driveLink: row[44],
            studentDriveLink: row[45],
            sheetsLink: row[46],
            questions: questions,
            hasAssignment: row[166], // Assignment starts here (col 167, index 166)
            assignmentFileURL: row[167],
            assignmentDescription: row[168],
            assignmentDeadlineSameAsJob: row[169],
            assignmentDeadline: row[170],
            assignmentVisibility: row[171], // NEW FIELD
            showToBatchLevels: row[172], // Eligibility starts here
            showToNoOfferStudents: row[173],
            showToStudentsWithOneFT_PPO: row[174],
            showToStudentsWithNoPPO: row[175],
            showToStudentsWithInternships: row[176],
            showToStudentsWithZeroOffers: row[177],
            customVisibilityRule: row[178],
            showToStudentsWithPPO: row[179], // NEW FIELD
            showToStudentsWithoutPPO: row[180], // NEW FIELD
            showToStudentsWithFTE: row[181], // NEW FIELD
            showToStudentsWithoutFTE: row[182], // NEW FIELD
            resumeFolderId: row[183], // System fields start here
            responsesSheetId: row[184],
            applicationsCount: row[185],
            status: row[186],
            createdBy: row[187],
            createdAt: row[188],
            updatedBy: row[189],
            updatedAt: row[190]
          }
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error getting job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update job posting
 */
function updateJobPosting(jobId, updates) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        // Update the row with new data
        // (Implementation similar to createJobPosting but updating existing row)

        // Update UpdatedBy and UpdatedAt
        const rowIndex = i + 1;
        sheet.getRange(rowIndex, 172).setValue(updates.updatedBy || '');
        sheet.getRange(rowIndex, 173).setValue(formatTimestampForSheets());

        return {
          success: true,
          message: 'Job posting updated successfully'
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error updating job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete job posting
 */
function deleteJobPosting(jobId) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        sheet.deleteRow(i + 1);

        return {
          success: true,
          message: 'Job posting deleted successfully'
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error deleting job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload a file for a job posting (JD or attachment)
 */
function uploadJobFile(jobId, fileData, fileName, mimeType, fileType) {
  try {
    Logger.log(`Uploading ${fileType} file for job: ${jobId}`);

    // Validate inputs
    if (!jobId || !fileData || !fileName) {
      return {
        success: false,
        error: 'Missing required parameters for file upload'
      };
    }

    // Get or create the main drive folder
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    } catch (error) {
      return {
        success: false,
        error: 'Main drive folder not found. Please check the MAIN_DRIVE_FOLDER_ID.'
      };
    }

    // Get or create the "Job Portal" subfolder
    let jobPortalFolder;
    const jobPortalFolders = mainFolder.getFoldersByName('Job Portal');
    if (jobPortalFolders.hasNext()) {
      jobPortalFolder = jobPortalFolders.next();
    } else {
      jobPortalFolder = mainFolder.createFolder('Job Portal');
      Logger.log('Created Job Portal subfolder in main drive folder');
    }

    // Get or create folder for this specific job
    let jobFolder;
    const jobFolders = jobPortalFolder.getFoldersByName(jobId);
    if (jobFolders.hasNext()) {
      jobFolder = jobFolders.next();
    } else {
      jobFolder = jobPortalFolder.createFolder(jobId);
      Logger.log('Created folder for job: ' + jobId);
    }

    // Convert base64 to blob
    const fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    // Upload to Google Drive
    const uploadedFile = jobFolder.createFile(fileBlob);

    // Set file sharing to viewable by anyone with the link
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get file URL
    const fileId = uploadedFile.getId();
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    Logger.log('File uploaded successfully: ' + uploadedFile.getName());
    Logger.log('Google Drive File ID: ' + fileId);
    Logger.log('File URL: ' + fileUrl);

    return {
      success: true,
      data: {
        fileUrl: fileUrl,
        fileId: fileId,
        fileName: fileName
      }
    };

  } catch (error) {
    Logger.log(`Error uploading job file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// REMOVED - testUploadResourceFile function deleted

// ============================================================================
// Resources Management - File Upload Functions  
// ============================================================================

/**
 * Upload a resource file to Google Drive
 * Folder structure: Batch > Resources > Term > Domain > Subject
 * Parent folder ID: 18u-3233E10NZRB7PhMiWYAbNkzCLlBRD
 */
function uploadResourceFile(fileData, fileName, mimeType, batch, term, domain, subject) {
  try {
    Logger.log('📤 uploadResourceFile: Starting upload for ' + fileName);
    
    const PARENT_FOLDER_ID = '18u-3233E10NZRB7PhMiWYAbNkzCLlBRD';
    
    // Create folder structure: Batch > Resources > Term > Domain > Subject
    let currentFolderId = PARENT_FOLDER_ID;
    const folderPath = [batch, 'Resources', term, domain, subject].filter(Boolean);
    
    for (let i = 0; i < folderPath.length; i++) {
      const folderName = folderPath[i];
      currentFolderId = getOrCreateFolder(folderName, currentFolderId);
    }
    
    Logger.log('✅ Folder structure created, uploading file to folder: ' + currentFolderId);
    
    // Decode base64 and create file
    const base64Data = fileData.split(',')[1] || fileData;
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    
    const file = DriveApp.getFolderById(currentFolderId).createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    Logger.log('✅ File uploaded successfully: ' + fileUrl);
    
    return {
      success: true,
      data: {
        url: fileUrl,
        folderId: currentFolderId,
        fileId: fileId
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error in uploadResourceFile: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper function to get or create a folder
 */
function getOrCreateFolder(folderName, parentFolderId) {
  const parent = DriveApp.getFolderById(parentFolderId);
  const folders = parent.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next().getId();
  } else {
    const newFolder = parent.createFolder(folderName);
    return newFolder.getId();
  }
}

// ============================================================================
// Resumable Upload for Large Files (>=50MB)
// ============================================================================

// Global object to store upload sessions
var uploadSessions = uploadSessions || {};

/**
 * Start a resumable upload session for large files
 */
function startResumableUpload(fileName, mimeType, fileSize, batch, term, domain, subject) {
  try {
    Logger.log('📤 startResumableUpload: ' + fileName + ' (' + fileSize + ' bytes)');
    
    const PARENT_FOLDER_ID = '18u-3233E10NZRB7PhMiWYAbNkzCLlBRD';
    
    // Create folder structure
    let currentFolderId = PARENT_FOLDER_ID;
    const folderPath = [batch, 'Resources', term, domain, subject].filter(Boolean);
    
    for (let i = 0; i < folderPath.length; i++) {
      const folderName = folderPath[i];
      currentFolderId = getOrCreateFolder(folderName, currentFolderId);
    }
    
    // Generate session ID
    const sessionId = Utilities.getUuid();
    
    // Store session info in PropertiesService for persistence
    const sessionData = {
      sessionId: sessionId,
      fileName: fileName,
      mimeType: mimeType,
      fileSize: fileSize,
      folderId: currentFolderId,
      chunks: [],
      createdAt: new Date().toISOString()
    };
    
    PropertiesService.getScriptProperties().setProperty(
      'upload_session_' + sessionId,
      JSON.stringify(sessionData)
    );
    
    Logger.log('✅ Upload session created: ' + sessionId);
    
    return {
      success: true,
      data: {
        sessionId: sessionId,
        folderId: currentFolderId
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error in startResumableUpload: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload a chunk of data for resumable upload
 */
function uploadChunk(sessionId, chunkIndex, totalChunks, chunkData) {
  try {
    Logger.log('📦 uploadChunk: Session ' + sessionId + ', Chunk ' + (chunkIndex + 1) + '/' + totalChunks);
    
    // Retrieve session data
    const sessionJson = PropertiesService.getScriptProperties().getProperty('upload_session_' + sessionId);
    if (!sessionJson) {
      throw new Error('Session not found: ' + sessionId);
    }
    
    const sessionData = JSON.parse(sessionJson);
    
    // Store chunk data
    sessionData.chunks[chunkIndex] = chunkData;
    
    // Save updated session
    PropertiesService.getScriptProperties().setProperty(
      'upload_session_' + sessionId,
      JSON.stringify(sessionData)
    );
    
    Logger.log('✅ Chunk ' + (chunkIndex + 1) + ' uploaded successfully');
    
    return {
      success: true,
      data: {
        chunkIndex: chunkIndex,
        totalChunks: totalChunks
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error in uploadChunk: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Finalize resumable upload by combining all chunks
 */
function finalizeResumableUpload(sessionId) {
  try {
    Logger.log('🔄 finalizeResumableUpload: Session ' + sessionId);
    
    // Retrieve session data
    const sessionJson = PropertiesService.getScriptProperties().getProperty('upload_session_' + sessionId);
    if (!sessionJson) {
      throw new Error('Session not found: ' + sessionId);
    }
    
    const sessionData = JSON.parse(sessionJson);
    
    // Combine all chunks
    let combinedBase64 = '';
    for (let i = 0; i < sessionData.chunks.length; i++) {
      const chunk = sessionData.chunks[i];
      if (!chunk) {
        throw new Error('Missing chunk ' + i);
      }
      const base64Data = chunk.split(',')[1] || chunk;
      combinedBase64 += base64Data;
    }
    
    Logger.log('📝 All chunks combined, creating file...');
    
    // Decode and create file
    const bytes = Utilities.base64Decode(combinedBase64);
    const blob = Utilities.newBlob(bytes, sessionData.mimeType, sessionData.fileName);
    
    const folder = DriveApp.getFolderById(sessionData.folderId);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    // Clean up session
    PropertiesService.getScriptProperties().deleteProperty('upload_session_' + sessionId);
    
    Logger.log('✅ File finalized successfully: ' + fileUrl);
    
    return {
      success: true,
      data: {
        url: fileUrl,
        fileId: fileId
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error in finalizeResumableUpload: ' + error.message);
    
    // Clean up session on error
    try {
      PropertiesService.getScriptProperties().deleteProperty('upload_session_' + sessionId);
    } catch (cleanupError) {
      Logger.log('⚠️ Error cleaning up session: ' + cleanupError.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

Logger.log('✅ Resource upload functions loaded successfully');

// ============================================================================
// Course Access Management Functions
// ============================================================================

/**
 * Get all enrolled students from Student Login sheet
 */
function getEnrolledStudents(params) {
  try {
    const ss = SpreadsheetApp.openById(getGlobalSheetId());
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices (case-insensitive) - support both 'email' and 'student email'
    const emailCol = headers.findIndex(h => h === 'email' || h === 'student email');
    const fullNameCol = headers.findIndex(h => h === 'full name' || h === 'fullname' || h === 'name');
    const rollNoCol = headers.findIndex(h => h === 'roll no' || h === 'rollno' || h === 'roll number');
    const batchCol = headers.findIndex(h => h === 'batch');
    const roleCol = headers.findIndex(h => h === 'role');
    const isAdminCol = headers.findIndex(h => h === 'isadmin' || h === 'is admin' || h === 'admin');
    const createdAtCol = headers.findIndex(h => h === 'created at' || h === 'createdat' || h === 'enrolled at');
    const createdByCol = headers.findIndex(h => h === 'created by' || h === 'createdby' || h === 'enrolled by');

    if (emailCol === -1) {
      return { success: false, error: 'Email column not found in Student Login sheet' };
    }

    const students = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = row[emailCol];

      // Skip empty rows
      if (!email || String(email).trim() === '') continue;

      // Determine role - check isAdmin column or role column
      let role = 'Student';
      if (roleCol >= 0 && row[roleCol]) {
        role = String(row[roleCol]).trim();
      } else if (isAdminCol >= 0) {
        const isAdminValue = String(row[isAdminCol]).toLowerCase();
        if (isAdminValue === 'true' || isAdminValue === 'yes' || isAdminValue === '1') {
          role = 'Admin';
        }
      }

      students.push({
        email: String(email).trim(),
        fullName: fullNameCol >= 0 ? String(row[fullNameCol] || '').trim() : '',
        rollNo: rollNoCol >= 0 ? String(row[rollNoCol] || '').trim() : '',
        batch: batchCol >= 0 ? String(row[batchCol] || '').trim() : '',
        role: role,
        enrolledAt: createdAtCol >= 0 ? String(row[createdAtCol] || '') : '',
        enrolledBy: createdByCol >= 0 ? String(row[createdByCol] || '') : ''
      });
    }

    return { success: true, data: students };
  } catch (error) {
    Logger.log('Error in getEnrolledStudents: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Enroll a new student
 */
function enrollStudent(params) {
  try {
    const studentData = typeof params.studentData === 'string'
      ? JSON.parse(params.studentData)
      : params.studentData;
    const adminEmail = params.studentEmail;

    if (!studentData.email) {
      return { success: false, error: 'Student email is required' };
    }

    const ss = SpreadsheetApp.openById(getGlobalSheetId());
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices - support both 'email' and 'student email'
    const emailCol = headers.findIndex(h => h === 'email' || h === 'student email');
    const fullNameCol = headers.findIndex(h => h === 'full name' || h === 'fullname' || h === 'name');
    const rollNoCol = headers.findIndex(h => h === 'roll no' || h === 'rollno' || h === 'roll number');
    const batchCol = headers.findIndex(h => h === 'batch');
    const roleCol = headers.findIndex(h => h === 'role');
    const isAdminCol = headers.findIndex(h => h === 'isadmin' || h === 'is admin' || h === 'admin');
    const createdAtCol = headers.findIndex(h => h === 'created at' || h === 'createdat' || h === 'enrolled at');
    const createdByCol = headers.findIndex(h => h === 'created by' || h === 'createdby' || h === 'enrolled by');

    if (emailCol === -1) {
      return { success: false, error: 'Email column not found in Student Login sheet' };
    }

    // Check if email already exists
    const studentEmail = String(studentData.email).trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      const existingEmail = String(data[i][emailCol] || '').trim().toLowerCase();
      if (existingEmail === studentEmail) {
        return { success: false, error: 'A student with this email already exists' };
      }
    }

    // Check if roll number already exists (if provided)
    if (studentData.rollNo && rollNoCol >= 0) {
      const newRollNo = String(studentData.rollNo).trim().toUpperCase();
      for (let i = 1; i < data.length; i++) {
        const existingRollNo = String(data[i][rollNoCol] || '').trim().toUpperCase();
        if (existingRollNo === newRollNo && existingRollNo !== '') {
          return { success: false, error: 'This roll number is already assigned to another student' };
        }
      }
    }

    // Prepare new row
    const newRow = new Array(headers.length).fill('');
    newRow[emailCol] = studentData.email.trim().toLowerCase();

    if (fullNameCol >= 0) newRow[fullNameCol] = studentData.fullName || '';
    if (rollNoCol >= 0) newRow[rollNoCol] = studentData.rollNo || '';
    if (batchCol >= 0) newRow[batchCol] = studentData.batch || '';

    // Handle role
    if (roleCol >= 0) {
      newRow[roleCol] = studentData.role || 'Student';
    }

    // Set isAdmin based on role
    if (isAdminCol >= 0) {
      newRow[isAdminCol] = studentData.role === 'Admin' ? 'TRUE' : 'FALSE';
    }

    // Set metadata
    if (createdAtCol >= 0) {
      newRow[createdAtCol] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm:ss");
    }
    if (createdByCol >= 0) {
      newRow[createdByCol] = adminEmail || '';
    }

    // Append the row
    sheet.appendRow(newRow);

    Logger.log('Student enrolled successfully: ' + studentData.email);

    return {
      success: true,
      data: {
        message: 'Student enrolled successfully',
        student: {
          email: studentData.email,
          fullName: studentData.fullName,
          rollNo: studentData.rollNo,
          batch: studentData.batch,
          role: studentData.role || 'Student'
        }
      }
    };
  } catch (error) {
    Logger.log('Error in enrollStudent: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update an enrolled student
 */
function updateEnrolledStudent(params) {
  try {
    const studentData = typeof params.studentData === 'string'
      ? JSON.parse(params.studentData)
      : params.studentData;
    const targetEmail = params.targetStudentEmail;

    if (!targetEmail) {
      return { success: false, error: 'Target student email is required' };
    }

    const ss = SpreadsheetApp.openById(getGlobalSheetId());
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices - support both 'email' and 'student email'
    const emailCol = headers.findIndex(h => h === 'email' || h === 'student email');
    const fullNameCol = headers.findIndex(h => h === 'full name' || h === 'fullname' || h === 'name');
    const rollNoCol = headers.findIndex(h => h === 'roll no' || h === 'rollno' || h === 'roll number');
    const batchCol = headers.findIndex(h => h === 'batch');
    const roleCol = headers.findIndex(h => h === 'role');
    const isAdminCol = headers.findIndex(h => h === 'isadmin' || h === 'is admin' || h === 'admin');

    if (emailCol === -1) {
      return { success: false, error: 'Email column not found' };
    }

    // Find the student row
    let rowIndex = -1;
    const targetEmailLower = String(targetEmail).trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      const existingEmail = String(data[i][emailCol] || '').trim().toLowerCase();
      if (existingEmail === targetEmailLower) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Student not found' };
    }

    // Check if new roll number conflicts with another student
    if (studentData.rollNo && rollNoCol >= 0) {
      const newRollNo = String(studentData.rollNo).trim().toUpperCase();
      for (let i = 1; i < data.length; i++) {
        if (i + 1 === rowIndex) continue; // Skip current student
        const existingRollNo = String(data[i][rollNoCol] || '').trim().toUpperCase();
        if (existingRollNo === newRollNo && existingRollNo !== '') {
          return { success: false, error: 'This roll number is already assigned to another student' };
        }
      }
    }

    // Update the row
    if (studentData.fullName !== undefined && fullNameCol >= 0) {
      sheet.getRange(rowIndex, fullNameCol + 1).setValue(studentData.fullName);
    }
    if (studentData.rollNo !== undefined && rollNoCol >= 0) {
      sheet.getRange(rowIndex, rollNoCol + 1).setValue(studentData.rollNo);
    }
    if (studentData.batch !== undefined && batchCol >= 0) {
      sheet.getRange(rowIndex, batchCol + 1).setValue(studentData.batch);
    }
    if (studentData.role !== undefined) {
      if (roleCol >= 0) {
        sheet.getRange(rowIndex, roleCol + 1).setValue(studentData.role);
      }
      if (isAdminCol >= 0) {
        sheet.getRange(rowIndex, isAdminCol + 1).setValue(studentData.role === 'Admin' ? 'TRUE' : 'FALSE');
      }
    }

    Logger.log('Student updated successfully: ' + targetEmail);

    return { success: true, data: { message: 'Student updated successfully' } };
  } catch (error) {
    Logger.log('Error in updateEnrolledStudent: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove student access (delete from sheet)
 */
function removeStudentAccess(params) {
  try {
    const targetEmail = params.targetStudentEmail;

    if (!targetEmail) {
      return { success: false, error: 'Target student email is required' };
    }

    const ss = SpreadsheetApp.openById(getGlobalSheetId());
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailCol = headers.findIndex(h => h === 'email' || h === 'student email');

    if (emailCol === -1) {
      return { success: false, error: 'Email column not found' };
    }

    // Find the student row
    let rowIndex = -1;
    const targetEmailLower = String(targetEmail).trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      const existingEmail = String(data[i][emailCol] || '').trim().toLowerCase();
      if (existingEmail === targetEmailLower) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Student not found' };
    }

    // Delete the row
    sheet.deleteRow(rowIndex);

    Logger.log('Student access removed: ' + targetEmail);

    return { success: true, data: { message: 'Student access removed successfully' } };
  } catch (error) {
    Logger.log('Error in removeStudentAccess: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get next auto-generated roll number for a batch
 */
function getNextRollNumber(params) {
  try {
    const batch = params.batch;

    if (!batch) {
      return { success: false, error: 'Batch is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    const rollNoCol = headers.findIndex(h => h === 'roll no' || h === 'rollno' || h === 'roll number');
    const batchCol = headers.findIndex(h => h === 'batch');

    if (rollNoCol === -1) {
      return { success: true, data: { nextRollNumber: 'MBA001' } };
    }

    // Find all roll numbers for this batch
    const rollNumbers = [];
    for (let i = 1; i < data.length; i++) {
      const rowBatch = batchCol >= 0 ? String(data[i][batchCol] || '').trim() : '';
      const rollNo = String(data[i][rollNoCol] || '').trim();

      // If batch filter is provided, only count rolls from that batch
      // If no batch column, count all rolls
      if (batchCol === -1 || rowBatch === batch) {
        // Extract number from roll number (supports formats like MBA001, MBA-001, 001, etc.)
        const match = rollNo.match(/(\d+)/);
        if (match) {
          rollNumbers.push(parseInt(match[1], 10));
        }
      }
    }

    // Find the next available number
    const maxRoll = rollNumbers.length > 0 ? Math.max(...rollNumbers) : 0;
    const nextRoll = maxRoll + 1;
    const nextRollNumber = 'MBA' + String(nextRoll).padStart(3, '0');

    return { success: true, data: { nextRollNumber: nextRollNumber } };
  } catch (error) {
    Logger.log('Error in getNextRollNumber: ' + error.message);
    return { success: false, error: error.message };
  }
}

Logger.log('✅ Course Access Management functions loaded successfully');
