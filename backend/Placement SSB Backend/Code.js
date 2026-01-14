// SSB PLACEMENT BACKEND - Google Apps Script
// Separate backend for all placement-related functionality

// Configuration constants
const TIMEZONE = "Asia/Kolkata";

// Google Sheets configuration
const STUDENT_SHEET_ID = "";
const STUDENT_PROFILE_SHEET = "Student Profile";

// Job Portal configuration
const JOB_PORTAL_SHEET_ID = "";
const JOB_PORTAL_SHEET_NAME = "Placement Data";
const JOB_PORTAL_DRIVE_FOLDER_ID = ""; // SSB PLACEMENT JOB PORTAL FOLDER

// Placement Resume Drive folder configuration
const PLACEMENT_RESUME_FOLDER_ID = "";

/**
 * Format timestamp for sheets in readable format
 * Returns format like: 21-Nov-2025 19:29:05
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

/**
 * Format a date string or Date object for sheets in readable format
 * Accepts ISO format (2025-12-03T23:39) or Date object
 * Returns format like: 03-Dec-2025 23:39:00
 */
function formatDateForSheets(dateInput) {
  if (!dateInput) return '';

  try {
    // Convert to Date object if it's a string
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      Logger.log(`Invalid date input: ${dateInput}`);
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: TIMEZONE });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Format: 03-Dec-2025 23:39:00
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    Logger.log(`Error formatting date: ${error.message}`);
    return '';
  }
}

/**
 * Main entry point for web app - handles all API requests
 * Deploy as web app with execute permissions: Anyone, even anonymous
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
 * @param {Object} data - The response data object
 * @return {ContentService.TextOutput} JSON response
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @return {ContentService.TextOutput} JSON error response
 */
function createErrorResponse(message) {
  return createJSONResponse({
    success: false,
    error: message
  });
}

/**
 * Main request handler - routes to appropriate function based on action
 */
function handleRequest(e) {
  try {
    // Handle undefined event parameter
    if (!e) {
      return createErrorResponse('No request data provided');
    }

    // Parse request parameters
    const params = e.parameter || {};
    const postData = e.postData ? e.postData.contents : null;

    // Parse POST body if present
    let bodyParams = {};
    if (postData) {
      try {
        bodyParams = JSON.parse(postData);
      } catch (parseError) {
        Logger.log('Could not parse POST body as JSON: ' + parseError.message);
      }
    }

    // Merge parameters (POST body takes precedence)
    const allParams = { ...params, ...bodyParams };

    const action = allParams.action;

    if (!action) {
      return createErrorResponse('No action specified');
    }

    Logger.log('Placement Backend - Action: ' + action);
    Logger.log('Placement Backend - Parameters: ' + JSON.stringify(allParams));

    let result;

    // Route to appropriate handler based on action
    switch (action) {
      // Job Portal CRUD operations
      case 'createJobPosting':
        // Parse jobData from JSON string
        const jobData = allParams.jobData ? JSON.parse(allParams.jobData) : allParams;
        result = createJobPosting(jobData);
        break;

      case 'getAllJobPostings':
        result = getAllJobPostings(allParams.filters ? JSON.parse(allParams.filters) : {});
        break;

      case 'getJobPosting':
        result = getJobPosting(allParams.jobId);
        break;

      case 'updateJobPosting':
        // Parse updates from JSON string if present
        const updates = allParams.updates ? JSON.parse(allParams.updates) : allParams;
        result = updateJobPosting(allParams.jobId, updates);
        break;

      case 'deleteJobPosting':
        result = deleteJobPosting(allParams.jobId);
        break;

      case 'uploadJobFile':
        result = uploadJobFile(allParams);
        break;

      // Student job applications
      case 'submitJobApplication':
        result = submitJobApplication(allParams);
        break;

      case 'getStudentApplications':
        result = getStudentApplications(allParams.studentEmail);
        break;

      // Admin operations
      case 'isAdmin':
        result = { success: true, isAdmin: isAdmin(allParams.email) };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }

    return createJSONResponse(result);

  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    return createErrorResponse('Server error: ' + error.message);
  }
}

/**
 * Check if user is an admin
 */
function isAdmin(userEmail) {
  try {
    if (!userEmail) return false;

    const sheet = SpreadsheetApp.openById(STUDENT_SHEET_ID).getSheetByName(STUDENT_PROFILE_SHEET);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find email and admin role columns
    const emailCol = headers.indexOf('Email');
    const adminCol = headers.indexOf('Admin');

    if (emailCol === -1 || adminCol === -1) {
      Logger.log('Required columns not found in Student Profile sheet');
      return false;
    }

    // Search for user
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === userEmail) {
        return data[i][adminCol] === 'Yes' || data[i][adminCol] === true;
      }
    }

    return false;

  } catch (error) {
    Logger.log('Error checking admin status: ' + error.message);
    return false;
  }
}

/**
 * Get or create a folder by name in parent folder
 */
function getOrCreateFolder(parentFolder, folderName) {
  try {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    Logger.log(`Creating folder: ${folderName}`);
    return parentFolder.createFolder(folderName);
  } catch (error) {
    Logger.log(`Error getting/creating folder ${folderName}: ${error.message}`);
    throw error;
  }
}
