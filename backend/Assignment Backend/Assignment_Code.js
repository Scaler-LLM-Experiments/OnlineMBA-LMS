/**
 * SSB ASSIGNMENT MANAGEMENT SYSTEM - MAIN CODE
 *
 * This is the main entry point for the Assignment Management System API
 * Handles all incoming requests and routes them to appropriate functions
 *
 * @author SSB Student Portal Team
 * @version 1.0.0
 */

// ==================== CONFIGURATION ====================

const ASSIGNMENT_CONFIG = {
  SHEET_ID: "1hZe_BA6xZUgM1KDWaZudghxFqq--7-dSVTSl4zTDwxg",
  ASSIGNMENT_SHEET: "Assignment Ceator",
  // SUBJECT_VISIBLE_SHEET: "Subject Visible Data", // DEPRECATED: Now using "Group Members" sheet
  SUBJECT_TERM_SHEET: "Subject Term",
  PUSH_TO_REFRESH_SHEET: "Push to Refresh",
  ACKNOWLEDGMENT_TRACKING_SHEET: "Acknowledgment Tracking Refresh",
  TIMEZONE: "Asia/Kolkata",

  // Drive folder structure root
  DRIVE_ROOT_ID: "16jTUfQMp-duWS_dgyRaZhke8mwVPr0TU",

  // Assignment ID Format: YYYY-SU-YYYYMMDD-XXX
  ID_PREFIX: "SU",

  // File types supported
  ALLOWED_FILE_TYPES: [
    'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx',
    'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'zip',
    'rar', '7z', 'mp4', 'avi', 'mov'
  ],

  // Status values
  STATUS: {
    ACTIVE: 'Active',
    DISABLED: 'Disabled',
    DELETED: 'Deleted'
  }
};

// ==================== WEB APP ENTRY POINT ====================

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;

    Logger.log('GET Request - Action: ' + action);

    // CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    return output.setContent(JSON.stringify({
      success: false,
      error: 'GET requests not supported. Please use POST.'
    }));

  } catch (error) {
    Logger.log('Error in doGet: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Parse form-urlencoded data
    const action = e.parameter.action;
    const studentEmail = e.parameter.studentEmail;
    const params = e.parameter.params ? JSON.parse(e.parameter.params) : {};

    Logger.log('POST Request - Action: ' + action);
    Logger.log('Student Email: ' + studentEmail);

    let result;

    // Route to appropriate function
    switch (action) {
      case 'createAssignment':
        result = createAssignment(params);
        break;

      case 'updateAssignment':
        result = updateAssignment(params.assignmentId, params.assignmentData);
        break;

      case 'getAssignments':
        result = getAssignments(params.filters, studentEmail, params.isAdmin || false);
        break;

      case 'deleteAssignment':
        result = deleteAssignment(params.assignmentId);
        break;

      case 'changeAssignmentStatus':
        result = changeAssignmentStatus(params.assignmentId, params.status);
        break;

      case 'getAssignmentDropdowns':
        result = getAssignmentDropdowns();
        break;

      case 'uploadAssignmentFile':
        result = uploadAssignmentFile(
          params.fileData,
          params.fileName,
          params.mimeType,
          params.assignmentId
        );
        break;

      case 'getSubjectsByBatch':
        result = getSubjectsByBatchAndTerm(params.batch, params.term);
        break;

      case 'checkSubmissionStatus':
        result = checkSubmissionStatus(params.assignmentId, studentEmail);
        break;

      case 'submitAssignment':
        result = submitAssignment({
          ...params,
          studentEmail: studentEmail
        });
        break;

      case 'getStudentSubmissions':
        result = getStudentSubmissions(params.assignmentId, studentEmail);
        break;

      case 'getStudentsBySubject':
        result = getStudentsBySubject(params.batch, params.subject);
        break;

      case 'getGroupMembersBySubjectGroup':
        result = getGroupMembersBySubjectGroup(params.batch, params.subject, studentEmail);
        break;

      case 'submitPeerRatings':
        result = submitPeerRatings({
          ...params,
          studentEmail: studentEmail
        });
        break;

      case 'getPeerRatings':
        result = getPeerRatings(params.submissionId, studentEmail);
        break;

      case 'getAverageRatings':
        result = getAverageRatings(params.assignmentId, studentEmail);
        break;

      case 'pushRefreshRequest':
        result = pushRefreshRequest(
          params.adminEmail,
          params.reason,
          params.bannerNotice,
          params.requireFullScreen,
          params.startDateTime,
          params.endDateTime
        );
        break;

      case 'checkRefreshRequired':
        result = checkRefreshRequired(studentEmail);
        break;

      case 'acknowledgeRefresh':
        result = acknowledgeRefresh(studentEmail);
        break;

      case 'initiateResumableUpload':
        result = initiateResumableUpload({
          ...params,
          studentEmail: studentEmail
        });
        break;

      case 'finalizeResumableUpload':
        result = finalizeResumableUpload(params);
        break;

      case 'recoverUploadedFile':
        result = recoverUploadedFile({
          ...params,
          studentEmail: studentEmail
        });
        break;

      case 'saveSubjectTermEntry':
        result = saveSubjectTermEntry(
          params.batch,
          params.term,
          params.domain,
          params.subject
        );
        break;

      default:
        result = {
          success: false,
          error: 'Invalid action: ' + action
        };
    }

    return createResponse(result);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return createResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create standardized API response
 */
function createResponse(data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  return output.setContent(JSON.stringify(data));
}

/**
 * Check if user is admin
 */
function isAdminAssignment(email) {
  try {
    if (!email) return false;

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName('Group Members');

    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find Student Email column
    const emailCol = headers.indexOf('Student Email');
    if (emailCol === -1) return false;

    // Search for email in Student Email column
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] && data[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
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
 * Format timestamp for sheets
 */
function formatTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, ASSIGNMENT_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
}

/**
 * Generate unique Assignment ID
 * Format: YYYY-SU-YYYYMMDD-XXX
 */
function generateAssignmentId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = year + month + day;

  // Get count of assignments created today
  const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
  const data = sheet.getDataRange().getValues();

  const todayPrefix = year + '-' + ASSIGNMENT_CONFIG.ID_PREFIX + '-' + dateStr;
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().startsWith(todayPrefix)) {
      count++;
    }
  }

  const sequence = String(count + 1).padStart(3, '0');
  return todayPrefix + '-' + sequence;
}

/**
 * Test function
 */
function testAssignmentSystem() {
  Logger.log('Assignment Management System - Test');
  Logger.log('Sheet ID: ' + ASSIGNMENT_CONFIG.SHEET_ID);
  Logger.log('Generated ID: ' + generateAssignmentId());
}
