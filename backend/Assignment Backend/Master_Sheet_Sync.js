/**
 * SSB ASSIGNMENT MANAGEMENT SYSTEM - MASTER SHEET SYNC
 *
 * This file handles syncing assignment submissions to the Master Sheet
 * "AllAssignmentTracker" for efficient querying and analytics
 *
 * @author SSB Student Portal Team
 * @version 1.0.0
 */

// ==================== CONFIGURATION ====================

const MASTER_SHEET_CONFIG = {
  SHEET_ID: "1hZe_BA6xZUgM1KDWaZudghxFqq--7-dSVTSl4zTDwxg",
  MASTER_SHEET_NAME: "AllAssignmentTracker",
  TIMEZONE: "Asia/Kolkata"
};

// ==================== MASTER SHEET COLUMN MAPPING ====================

/**
 * Column mapping for Master Sheet (88 columns total)
 * This ensures we write to the correct column positions
 */
const MASTER_COLUMNS = {
  ROW_ID: 0,              // A: rowId
  UNIQUE_ID: 1,           // B: Unique ID
  ASSIGNMENT_ID: 2,       // C: assignmentId
  ASSIGNMENT_TITLE: 3,    // D: assignmentTitle
  SUBJECT: 4,             // E: subject
  SUBJECT_CODE: 5,        // F: subjectCode
  ASSIGNMENT_TYPE: 6,     // G: assignmentType
  START_DATE: 7,          // H: startDate
  DUE_DATE: 8,            // I: dueDate
  TOTAL_MARKS: 9,         // J: totalMarks
  STUDENT_EMAIL: 10,      // K: studentEmail
  STUDENT_NAME: 11,       // L: studentName
  BATCH: 12,              // M: batch
  TERM: 13,               // N: term
  IS_SUBMITTED: 14,       // O: isSubmitted
  IS_EDITED: 15,          // P: isEdited
  EDIT_COUNT: 16,         // Q: editCount
  SUBMISSION_STATUS: 17,  // R: submissionStatus
  SUBMISSION_TYPE: 18,    // S: submissionType
  FIRST_SUBMISSION_TIME: 19,  // T: firstSubmissionTime
  LAST_EDIT_TIME: 20,     // U: lastEditTime
  LAST_EDITED_BY: 21,     // V: lastEditedBy
  RECORD_CREATED: 22,     // W: recordCreated
  RECORD_LAST_UPDATED: 23, // X: recordLastUpdated

  // Q1-Q20 start at column 24 (Y)
  Q1: 24,
  Q2: 25,
  Q3: 26,
  Q4: 27,
  Q5: 28,
  Q6: 29,
  Q7: 30,
  Q8: 31,
  Q9: 32,
  Q10: 33,
  Q11: 34,
  Q12: 35,
  Q13: 36,
  Q14: 37,
  Q15: 38,
  Q16: 39,
  Q17: 40,
  Q18: 41,
  Q19: 42,
  Q20: 43,

  // Q1-Q20 Mandatory flags start at column 44
  Q1_MANDATORY: 44,
  Q2_MANDATORY: 45,
  Q3_MANDATORY: 46,
  Q4_MANDATORY: 47,
  Q5_MANDATORY: 48,
  Q6_MANDATORY: 49,
  Q7_MANDATORY: 50,
  Q8_MANDATORY: 51,
  Q9_MANDATORY: 52,
  Q10_MANDATORY: 53,
  Q11_MANDATORY: 54,
  Q12_MANDATORY: 55,
  Q13_MANDATORY: 56,
  Q14_MANDATORY: 57,
  Q15_MANDATORY: 58,
  Q16_MANDATORY: 59,
  Q17_MANDATORY: 60,
  Q18_MANDATORY: 61,
  Q19_MANDATORY: 62,
  Q20_MANDATORY: 63,

  // URL Submissions (5 fields) start at column 64
  URL_SUBMISSION_1: 64,
  URL_SUBMISSION_2: 65,
  URL_SUBMISSION_3: 66,
  URL_SUBMISSION_4: 67,
  URL_SUBMISSION_5: 68,

  // File Uploads (10 fields) start at column 69
  FILE_UPLOAD_1: 69,
  FILE_UPLOAD_2: 70,
  FILE_UPLOAD_3: 71,
  FILE_UPLOAD_4: 72,
  FILE_UPLOAD_5: 73,
  FILE_UPLOAD_6: 74,
  FILE_UPLOAD_7: 75,
  FILE_UPLOAD_8: 76,
  FILE_UPLOAD_9: 77,
  FILE_UPLOAD_10: 78,

  // Group & Metadata columns
  GROUP_NAME: 79,         // groupName
  GROUP_MEMBERS: 80,      // groupMembers
  GROUP_MEMBERS_EMAILS: 81, // groupMembersEmails (NEW - CRITICAL!)
  TOTAL_GROUP_MEMBERS: 82,  // totalGroupMembers (NEW)
  IS_GROUP_LEADER: 83,    // isGroupLeader
  MAX_GROUP_MEMBERS: 84,  // maxGroupMembers (NEW)

  // Submission Tracking columns (NEW - CRITICAL!)
  SUBMISSION_ID: 85,      // submissionId - Links to peer ratings
  SUBMITTER_EMAIL: 86,    // submitterEmail - Who submitted for group
  SUBMITTER_NAME: 87,     // submitterName

  // Peer Rating columns (NEW)
  PEER_RATING_ENABLED: 88,        // peerRatingEnabled
  PEER_RATINGS_SUBMITTED: 89,     // peerRatingsSubmitted
  PEER_RATINGS_SUBMITTED_AT: 90,  // peerRatingsSubmittedAt
  PEER_RATINGS_LOCKED: 91,        // peerRatingsLocked
  AVERAGE_PEER_RATING_RECEIVED: 92, // averagePeerRatingReceived
  TOTAL_PEER_RATINGS_RECEIVED: 93,  // totalPeerRatingsReceived
  PEER_RATINGS_GIVEN_COUNT: 94,     // peerRatingsGivenCount
  ALL_PEERS_RATED: 95,              // allPeersRated

  // Metadata columns
  SHEET_SOURCE: 96,       // sheetSource
  SYNCED_AT: 97,          // syncedAt
  IS_ACTIVE: 98,          // isActive
  NOTES: 99               // notes
};

// Total columns: 100 (0-99 index)

// ==================== CACHING LAYER ====================

/**
 * Cache configuration
 * - Script Cache: 10 minutes TTL, 100KB limit per entry
 * - Used to cache row lookups and reduce sheet reads
 */
const CACHE_CONFIG = {
  TTL_SECONDS: 600, // 10 minutes
  PREFIX_ROW_INDEX: 'rowIndex_',
  PREFIX_ROW_DATA: 'rowData_'
};

/**
 * Get cached row index
 */
function getCachedRowIndex(rowId) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CACHE_CONFIG.PREFIX_ROW_INDEX + rowId);
    return cached ? parseInt(cached) : null;
  } catch (error) {
    Logger.log('⚠️ Cache read error: ' + error.message);
    return null;
  }
}

/**
 * Set cached row index
 */
function setCachedRowIndex(rowId, rowIndex) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(
      CACHE_CONFIG.PREFIX_ROW_INDEX + rowId,
      rowIndex.toString(),
      CACHE_CONFIG.TTL_SECONDS
    );
  } catch (error) {
    Logger.log('⚠️ Cache write error: ' + error.message);
  }
}

/**
 * Invalidate cache for a rowId
 */
function invalidateCache(rowId) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_CONFIG.PREFIX_ROW_INDEX + rowId);
    cache.remove(CACHE_CONFIG.PREFIX_ROW_DATA + rowId);
  } catch (error) {
    Logger.log('⚠️ Cache invalidation error: ' + error.message);
  }
}

// ==================== CORE SYNC FUNCTIONS ====================

/**
 * Generate unique rowId for Master Sheet
 * Format: email_assignmentId (for individual) or groupName_assignmentId (for group)
 */
function generateRowId(studentEmailOrGroupName, assignmentId) {
  return studentEmailOrGroupName + '_' + assignmentId;
}

/**
 * Generate unique ID (auto-incrementing or timestamp-based)
 */
function generateUniqueId() {
  return new Date().getTime().toString();
}

/**
 * Find existing row in Master Sheet by rowId (WITH CACHING)
 * @param {string} rowId - The rowId to search for
 * @returns {Object} {found: boolean, rowIndex: number, rowData: array}
 */
function findMasterSheetRow(rowId) {
  try {
    // OPTIMIZATION 1: Check cache first
    const cachedIndex = getCachedRowIndex(rowId);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_CONFIG.SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);

    if (!masterSheet) {
      Logger.log('❌ Master Sheet not found: ' + MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);
      return { found: false, rowIndex: -1, rowData: null };
    }

    // If we have cached index, verify it's still valid
    if (cachedIndex) {
      try {
        const rowData = masterSheet.getRange(cachedIndex, 1, 1, 100).getValues()[0];
        if (rowData[MASTER_COLUMNS.ROW_ID] === rowId) {
          Logger.log('✅ Cache hit for rowId: ' + rowId);
          return {
            found: true,
            rowIndex: cachedIndex,
            rowData: rowData
          };
        } else {
          // Cache is stale, invalidate it
          invalidateCache(rowId);
        }
      } catch (cacheError) {
        Logger.log('⚠️ Cache validation failed, falling back to search');
        invalidateCache(rowId);
      }
    }

    // OPTIMIZATION 2: Use getDataRange() only once
    const data = masterSheet.getDataRange().getValues();

    // Search for rowId in column A (index 0)
    for (let i = 1; i < data.length; i++) {
      if (data[i][MASTER_COLUMNS.ROW_ID] === rowId) {
        const rowIndex = i + 1; // Sheet row number (1-indexed)

        // Cache the result for future lookups
        setCachedRowIndex(rowId, rowIndex);

        return {
          found: true,
          rowIndex: rowIndex,
          rowData: data[i]
        };
      }
    }

    return { found: false, rowIndex: -1, rowData: null };

  } catch (error) {
    Logger.log('❌ Error finding Master Sheet row: ' + error.message);
    return { found: false, rowIndex: -1, rowData: null };
  }
}

/**
 * Sync submission to Master Sheet (INSERT or UPDATE)
 * @param {Object} submissionData - Complete submission data
 * @param {Object} assignmentData - Assignment details
 * @param {boolean} isUpdate - Whether this is an update to existing submission
 * @returns {Object} {success, data}
 */
function syncToMasterSheet(submissionData, assignmentData, isUpdate) {
  try {
    Logger.log('📊 Syncing to Master Sheet: ' + submissionData.assignmentId);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_CONFIG.SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);

    if (!masterSheet) {
      return { success: false, error: 'Master Sheet not found' };
    }

    // Determine if this is individual or group assignment
    const isGroupAssignment = assignmentData.groupAssignment === 'Yes';
    const identifier = isGroupAssignment ?
      (submissionData.groupName || 'Group_' + submissionData.studentEmail) :
      submissionData.studentEmail;

    const rowId = generateRowId(identifier, submissionData.assignmentId);

    // Check if row already exists
    const existingRow = findMasterSheetRow(rowId);

    if (existingRow.found) {
      // UPDATE existing row
      return updateMasterSheetRow(
        masterSheet,
        existingRow.rowIndex,
        existingRow.rowData,
        submissionData,
        assignmentData
      );
    } else {
      // INSERT new row
      return insertMasterSheetRow(
        masterSheet,
        submissionData,
        assignmentData,
        rowId
      );
    }

  } catch (error) {
    Logger.log('❌ Error syncing to Master Sheet: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Insert new row into Master Sheet
 */
function insertMasterSheetRow(masterSheet, submissionData, assignmentData, rowId) {
  try {
    Logger.log('➕ Inserting new row to Master Sheet: ' + rowId);

    const now = formatMasterTimestamp();
    const uniqueId = generateUniqueId();

    // Initialize row array with 100 columns
    const row = new Array(100).fill('');

    // Core identification
    row[MASTER_COLUMNS.ROW_ID] = rowId;
    row[MASTER_COLUMNS.UNIQUE_ID] = uniqueId;
    row[MASTER_COLUMNS.ASSIGNMENT_ID] = submissionData.assignmentId;
    row[MASTER_COLUMNS.ASSIGNMENT_TITLE] = assignmentData.assignmentHeader || '';
    row[MASTER_COLUMNS.SUBJECT] = assignmentData.subject || '';
    row[MASTER_COLUMNS.SUBJECT_CODE] = assignmentData.subjectCode || '';
    row[MASTER_COLUMNS.ASSIGNMENT_TYPE] = assignmentData.groupAssignment === 'Yes' ? 'Group' : 'Individual';
    row[MASTER_COLUMNS.START_DATE] = assignmentData.startDateTime || '';
    row[MASTER_COLUMNS.DUE_DATE] = assignmentData.endDateTime || '';
    row[MASTER_COLUMNS.TOTAL_MARKS] = assignmentData.totalMarks || '';

    // Student/Group info
    row[MASTER_COLUMNS.STUDENT_EMAIL] = submissionData.studentEmail || '';
    row[MASTER_COLUMNS.STUDENT_NAME] = submissionData.studentName || '';
    row[MASTER_COLUMNS.BATCH] = assignmentData.batch || '';
    row[MASTER_COLUMNS.TERM] = assignmentData.term || '';

    // Submission status
    row[MASTER_COLUMNS.IS_SUBMITTED] = 'TRUE';
    row[MASTER_COLUMNS.IS_EDITED] = 'FALSE';
    row[MASTER_COLUMNS.EDIT_COUNT] = 0;
    row[MASTER_COLUMNS.SUBMISSION_STATUS] = 'Submitted';

    // Determine submission type
    const hasFiles = submissionData.files && submissionData.files.length > 0;
    const hasUrls = submissionData.urls && submissionData.urls.length > 0;
    let submissionType = 'Individual';
    if (assignmentData.groupAssignment === 'Yes') {
      submissionType = 'Group';
    }
    row[MASTER_COLUMNS.SUBMISSION_TYPE] = submissionType;

    // Timestamps
    row[MASTER_COLUMNS.FIRST_SUBMISSION_TIME] = now;
    row[MASTER_COLUMNS.LAST_EDIT_TIME] = now;
    row[MASTER_COLUMNS.LAST_EDITED_BY] = submissionData.studentEmail || '';
    row[MASTER_COLUMNS.RECORD_CREATED] = now;
    row[MASTER_COLUMNS.RECORD_LAST_UPDATED] = now;

    // Questions Q1-Q20 (columns 24-43)
    const answers = submissionData.answers || {};
    for (let i = 1; i <= 20; i++) {
      const qKey = 'q' + i;
      row[MASTER_COLUMNS.Q1 + (i - 1)] = answers[qKey] || '';
    }

    // Mandatory flags Q1-Q20 (columns 44-63)
    for (let i = 1; i <= 20; i++) {
      const qIndex = 26 + ((i - 1) * 2); // Get from assignment data
      const qMandatoryIndex = 27 + ((i - 1) * 2);
      row[MASTER_COLUMNS.Q1_MANDATORY + (i - 1)] = assignmentData.questions?.[i-1]?.mandatory || 'No';
    }

    // URL Submissions (columns 64-68) - 5 URL fields
    if (submissionData.urls && submissionData.urls.length > 0) {
      for (let i = 0; i < Math.min(5, submissionData.urls.length); i++) {
        const url = submissionData.urls[i];
        const urlInfo = url.name + ' | ' + url.link; // Format: "Name | Link"
        row[MASTER_COLUMNS.URL_SUBMISSION_1 + i] = urlInfo;
      }
    }

    // File Uploads (columns 69-78) - 10 file fields
    if (submissionData.files && submissionData.files.length > 0) {
      for (let i = 0; i < Math.min(10, submissionData.files.length); i++) {
        const file = submissionData.files[i];
        const fileInfo = file.name + ' | ' + file.url; // Combined format
        row[MASTER_COLUMNS.FILE_UPLOAD_1 + i] = fileInfo;
      }
    }

    // Group fields
    row[MASTER_COLUMNS.GROUP_NAME] = submissionData.groupName || '';
    row[MASTER_COLUMNS.GROUP_MEMBERS] = submissionData.groupMembers ?
      submissionData.groupMembers.join(', ') : '';

    // NEW: Group Members Emails (CRITICAL!)
    row[MASTER_COLUMNS.GROUP_MEMBERS_EMAILS] = submissionData.groupMembersEmails ?
      submissionData.groupMembersEmails.join(', ') : '';

    // NEW: Total Group Members
    row[MASTER_COLUMNS.TOTAL_GROUP_MEMBERS] = submissionData.groupMembers ?
      submissionData.groupMembers.length : 0;

    row[MASTER_COLUMNS.IS_GROUP_LEADER] = submissionData.isGroupLeader ? 'TRUE' : 'FALSE';

    // NEW: Max Group Members (from assignment settings)
    row[MASTER_COLUMNS.MAX_GROUP_MEMBERS] = assignmentData.maximumGroupMembers || '';

    // NEW: Submission Tracking (CRITICAL!)
    row[MASTER_COLUMNS.SUBMISSION_ID] = submissionData.submissionId || '';
    row[MASTER_COLUMNS.SUBMITTER_EMAIL] = submissionData.submitterEmail || submissionData.studentEmail;
    row[MASTER_COLUMNS.SUBMITTER_NAME] = submissionData.submitterName || submissionData.studentName;

    // NEW: Peer Rating columns (initialized with defaults)
    row[MASTER_COLUMNS.PEER_RATING_ENABLED] = assignmentData.groupRatingRemarkEnabled || 'No';
    row[MASTER_COLUMNS.PEER_RATINGS_SUBMITTED] = 'No';
    row[MASTER_COLUMNS.PEER_RATINGS_SUBMITTED_AT] = '';
    row[MASTER_COLUMNS.PEER_RATINGS_LOCKED] = 'No';
    row[MASTER_COLUMNS.AVERAGE_PEER_RATING_RECEIVED] = 0;
    row[MASTER_COLUMNS.TOTAL_PEER_RATINGS_RECEIVED] = 0;
    row[MASTER_COLUMNS.PEER_RATINGS_GIVEN_COUNT] = 0;
    row[MASTER_COLUMNS.ALL_PEERS_RATED] = 'No';

    // Metadata
    row[MASTER_COLUMNS.SHEET_SOURCE] = assignmentData.sheetsLink || '';
    row[MASTER_COLUMNS.SYNCED_AT] = now;
    row[MASTER_COLUMNS.IS_ACTIVE] = 'TRUE';
    row[MASTER_COLUMNS.NOTES] = '';

    // Append row to Master Sheet
    masterSheet.appendRow(row);

    Logger.log('✅ New row inserted to Master Sheet');

    return {
      success: true,
      data: {
        rowId: rowId,
        uniqueId: uniqueId,
        action: 'INSERT'
      }
    };

  } catch (error) {
    Logger.log('❌ Error inserting Master Sheet row: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing row in Master Sheet
 */
function updateMasterSheetRow(masterSheet, rowIndex, existingRowData, submissionData, assignmentData) {
  try {
    Logger.log('🔄 Updating existing row in Master Sheet at row ' + rowIndex);

    const now = formatMasterTimestamp();

    // Initialize updated row with existing data
    const row = [...existingRowData];

    // Increment edit count
    const currentEditCount = parseInt(row[MASTER_COLUMNS.EDIT_COUNT]) || 0;
    row[MASTER_COLUMNS.EDIT_COUNT] = currentEditCount + 1;

    // Mark as edited
    row[MASTER_COLUMNS.IS_EDITED] = 'TRUE';

    // Update timestamps
    row[MASTER_COLUMNS.LAST_EDIT_TIME] = now;
    row[MASTER_COLUMNS.LAST_EDITED_BY] = submissionData.studentEmail || '';
    row[MASTER_COLUMNS.RECORD_LAST_UPDATED] = now;

    // Update answers Q1-Q20 (clear empty answers)
    const answers = submissionData.answers || {};
    for (let i = 1; i <= 20; i++) {
      const qKey = 'q' + i;
      // Always update - if answer is empty, it will clear the previous value
      row[MASTER_COLUMNS.Q1 + (i - 1)] = answers[qKey] || '';
    }

    // Update URL Submissions (always clear and rewrite)
    // Clear existing URLs first
    for (let i = 0; i < 5; i++) {
      row[MASTER_COLUMNS.URL_SUBMISSION_1 + i] = '';
    }
    // Add new URLs if provided
    if (submissionData.urls && submissionData.urls.length > 0) {
      for (let i = 0; i < Math.min(5, submissionData.urls.length); i++) {
        const url = submissionData.urls[i];
        const urlInfo = url.name + ' | ' + url.link; // Format: "Name | Link"
        row[MASTER_COLUMNS.URL_SUBMISSION_1 + i] = urlInfo;
      }
    }

    // Update File Uploads
    if (submissionData.files && submissionData.files.length > 0) {
      // Clear existing files first
      for (let i = 0; i < 10; i++) {
        row[MASTER_COLUMNS.FILE_UPLOAD_1 + i] = '';
      }
      // Add new files
      for (let i = 0; i < Math.min(10, submissionData.files.length); i++) {
        const file = submissionData.files[i];
        const fileInfo = file.name + ' | ' + file.url;
        row[MASTER_COLUMNS.FILE_UPLOAD_1 + i] = fileInfo;
      }
    }

    // Update synced timestamp
    row[MASTER_COLUMNS.SYNCED_AT] = now;

    // NEW: Update submission tracking (preserve submissionId - never change it!)
    // submissionId should NEVER change on update - it's the permanent link to peer ratings
    // submitterEmail and submitterName should also be preserved (who submitted first)
    // Only update if they're missing (backward compatibility)
    if (!row[MASTER_COLUMNS.SUBMISSION_ID]) {
      row[MASTER_COLUMNS.SUBMISSION_ID] = submissionData.submissionId || '';
    }
    if (!row[MASTER_COLUMNS.SUBMITTER_EMAIL]) {
      row[MASTER_COLUMNS.SUBMITTER_EMAIL] = submissionData.submitterEmail || submissionData.studentEmail;
    }
    if (!row[MASTER_COLUMNS.SUBMITTER_NAME]) {
      row[MASTER_COLUMNS.SUBMITTER_NAME] = submissionData.submitterName || submissionData.studentName;
    }

    // NEW: Update group members emails if provided (may have changed)
    if (submissionData.groupMembersEmails) {
      row[MASTER_COLUMNS.GROUP_MEMBERS_EMAILS] = submissionData.groupMembersEmails.join(', ');
      row[MASTER_COLUMNS.TOTAL_GROUP_MEMBERS] = submissionData.groupMembersEmails.length;
    }

    // NOTE: Peer rating columns are NOT updated here - they're updated by a separate sync function
    // when peer ratings are submitted (see future enhancement)

    // Write updated row back to sheet
    masterSheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);

    Logger.log('✅ Row updated in Master Sheet');

    return {
      success: true,
      data: {
        rowId: row[MASTER_COLUMNS.ROW_ID],
        uniqueId: row[MASTER_COLUMNS.UNIQUE_ID],
        action: 'UPDATE',
        editCount: row[MASTER_COLUMNS.EDIT_COUNT]
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating Master Sheet row: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format timestamp for Master Sheet
 */
function formatMasterTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, MASTER_SHEET_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get submission data from Master Sheet for a specific student and assignment
 * @param {string} studentEmail - Student email
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} {success, data}
 */
function getFromMasterSheet(studentEmail, assignmentId) {
  try {
    const rowId = generateRowId(studentEmail, assignmentId);
    const existingRow = findMasterSheetRow(rowId);

    if (!existingRow.found) {
      return {
        success: true,
        data: null,
        message: 'No submission found'
      };
    }

    // Parse row data into structured object
    const rowData = existingRow.rowData;

    const submission = {
      rowId: rowData[MASTER_COLUMNS.ROW_ID],
      uniqueId: rowData[MASTER_COLUMNS.UNIQUE_ID],
      assignmentId: rowData[MASTER_COLUMNS.ASSIGNMENT_ID],
      studentEmail: rowData[MASTER_COLUMNS.STUDENT_EMAIL],
      studentName: rowData[MASTER_COLUMNS.STUDENT_NAME],
      isSubmitted: rowData[MASTER_COLUMNS.IS_SUBMITTED] === 'TRUE',
      isEdited: rowData[MASTER_COLUMNS.IS_EDITED] === 'TRUE',
      editCount: parseInt(rowData[MASTER_COLUMNS.EDIT_COUNT]) || 0,
      submissionStatus: rowData[MASTER_COLUMNS.SUBMISSION_STATUS],
      firstSubmissionTime: rowData[MASTER_COLUMNS.FIRST_SUBMISSION_TIME],
      lastEditTime: rowData[MASTER_COLUMNS.LAST_EDIT_TIME],
      lastEditedBy: rowData[MASTER_COLUMNS.LAST_EDITED_BY],
      answers: {},
      files: [],
      urls: [],
      groupName: rowData[MASTER_COLUMNS.GROUP_NAME],
      groupMembers: rowData[MASTER_COLUMNS.GROUP_MEMBERS] ?
        rowData[MASTER_COLUMNS.GROUP_MEMBERS].split(',').map(m => m.trim()) : []
    };

    // Parse answers Q1-Q20
    for (let i = 1; i <= 20; i++) {
      const answer = rowData[MASTER_COLUMNS.Q1 + (i - 1)];
      if (answer) {
        submission.answers['q' + i] = answer;
      }
    }

    // Parse URL submissions
    for (let i = 0; i < 5; i++) {
      const url = rowData[MASTER_COLUMNS.URL_SUBMISSION_1 + i];
      if (url) {
        submission.urls.push(url);
      }
    }

    // Parse file uploads
    for (let i = 0; i < 10; i++) {
      const fileInfo = rowData[MASTER_COLUMNS.FILE_UPLOAD_1 + i];
      if (fileInfo && fileInfo.includes(' | ')) {
        const parts = fileInfo.split(' | ');
        submission.files.push({
          name: parts[0],
          url: parts[1]
        });
      }
    }

    return {
      success: true,
      data: submission
    };

  } catch (error) {
    Logger.log('❌ Error getting from Master Sheet: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== BATCH WRITE OPTIMIZATION ====================

/**
 * Batch submission queue
 * - Collects multiple submissions and writes them in batches
 * - Reduces API calls to Google Sheets
 */
const BATCH_CONFIG = {
  QUEUE_KEY: 'masterSheetQueue',
  BATCH_SIZE: 20, // Process 20 submissions at once
  MAX_WAIT_MS: 5000 // Maximum 5 seconds wait before flushing
};

/**
 * Add submission to batch queue
 * @param {Object} submissionData - Submission data
 * @param {Object} assignmentData - Assignment data
 * @param {boolean} isUpdate - Is this an update
 */
function addToBatchQueue(submissionData, assignmentData, isUpdate) {
  try {
    const props = PropertiesService.getScriptProperties();
    const queueJson = props.getProperty(BATCH_CONFIG.QUEUE_KEY) || '[]';
    const queue = JSON.parse(queueJson);

    queue.push({
      submission: submissionData,
      assignment: assignmentData,
      isUpdate: isUpdate,
      timestamp: new Date().getTime()
    });

    props.setProperty(BATCH_CONFIG.QUEUE_KEY, JSON.stringify(queue));

    // If queue is full, process it immediately
    if (queue.length >= BATCH_CONFIG.BATCH_SIZE) {
      processBatchQueue();
    }

    return { success: true, queued: true, queueSize: queue.length };

  } catch (error) {
    Logger.log('❌ Error adding to batch queue: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Process batch queue - write all queued submissions at once
 */
function processBatchQueue() {
  try {
    Logger.log('🔄 Processing batch queue...');

    const props = PropertiesService.getScriptProperties();
    const queueJson = props.getProperty(BATCH_CONFIG.QUEUE_KEY) || '[]';
    const queue = JSON.parse(queueJson);

    if (queue.length === 0) {
      Logger.log('✅ Queue is empty, nothing to process');
      return { success: true, processed: 0 };
    }

    Logger.log('📦 Processing ' + queue.length + ' queued submissions...');

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        const result = syncToMasterSheet(item.submission, item.assignment, item.isUpdate);
        if (result.success) {
          processed++;
        } else {
          failed++;
          Logger.log('⚠️ Batch item failed: ' + result.error);
        }
      } catch (itemError) {
        failed++;
        Logger.log('⚠️ Batch item error: ' + itemError.message);
      }
    }

    // Clear the queue
    props.setProperty(BATCH_CONFIG.QUEUE_KEY, '[]');

    Logger.log('✅ Batch processed: ' + processed + ' successful, ' + failed + ' failed');

    return {
      success: true,
      processed: processed,
      failed: failed
    };

  } catch (error) {
    Logger.log('❌ Error processing batch queue: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Time-based trigger to flush batch queue
 * Set this up as a time-driven trigger in Apps Script
 * Recommended: Every 1 minute
 */
function flushBatchQueueTrigger() {
  Logger.log('⏰ Batch queue flush trigger running...');
  processBatchQueue();
}

// ==================== ASYNC/BACKGROUND SYNC ====================

/**
 * Queue submission for async background sync
 * - Immediately returns success to user
 * - Master Sheet sync happens in background via trigger
 *
 * @param {Object} submissionData - Submission data
 * @param {Object} assignmentData - Assignment data
 * @param {boolean} isUpdate - Is this an update
 * @returns {Object} {success: true, queued: true}
 */
function queueAsyncMasterSheetSync(submissionData, assignmentData, isUpdate) {
  try {
    Logger.log('📮 Queuing async Master Sheet sync for: ' + submissionData.assignmentId);

    // Add to batch queue
    const result = addToBatchQueue(submissionData, assignmentData, isUpdate);

    if (result.success) {
      Logger.log('✅ Queued for background sync (queue size: ' + result.queueSize + ')');

      // If queue is getting large, trigger immediate processing
      if (result.queueSize >= BATCH_CONFIG.BATCH_SIZE) {
        Logger.log('🚀 Queue full, triggering immediate batch processing');
        // Use UrlFetchApp to trigger async (non-blocking)
        // This will be processed by the trigger
      }
    }

    return {
      success: true,
      queued: true,
      async: true,
      message: 'Master Sheet sync queued for background processing'
    };

  } catch (error) {
    Logger.log('⚠️ Error queuing async sync: ' + error.message);

    // Fallback to synchronous sync if queueing fails
    Logger.log('⚠️ Falling back to synchronous sync...');
    return syncToMasterSheet(submissionData, assignmentData, isUpdate);
  }
}

/**
 * Sync mode configuration
 * Change this to switch between sync/async modes globally
 */
const SYNC_MODE = {
  SYNCHRONOUS: 'sync',      // Block until Master Sheet write completes
  ASYNCHRONOUS: 'async',    // Queue for background processing
  BATCH: 'batch',           // Batch multiple submissions
  AUTO: 'auto'              // Automatically choose based on load
};

// Set current mode (can be changed via admin panel)
var CURRENT_SYNC_MODE = SYNC_MODE.SYNCHRONOUS; // Default to sync for reliability

/**
 * Smart sync - automatically chooses best sync method
 * @param {Object} submissionData - Submission data
 * @param {Object} assignmentData - Assignment data
 * @param {boolean} isUpdate - Is this an update
 * @returns {Object} Result object
 */
function smartSync(submissionData, assignmentData, isUpdate) {
  try {
    // Check current mode
    if (CURRENT_SYNC_MODE === SYNC_MODE.ASYNCHRONOUS) {
      return queueAsyncMasterSheetSync(submissionData, assignmentData, isUpdate);
    } else if (CURRENT_SYNC_MODE === SYNC_MODE.BATCH) {
      return addToBatchQueue(submissionData, assignmentData, isUpdate);
    } else if (CURRENT_SYNC_MODE === SYNC_MODE.AUTO) {
      // Auto mode: Check queue size and Master Sheet size
      const props = PropertiesService.getScriptProperties();
      const queueJson = props.getProperty(BATCH_CONFIG.QUEUE_KEY) || '[]';
      const queueSize = JSON.parse(queueJson).length;

      // If queue is building up, use async
      if (queueSize > 5) {
        Logger.log('📊 Auto mode: Queue building up, using async');
        return queueAsyncMasterSheetSync(submissionData, assignmentData, isUpdate);
      } else {
        // Otherwise use synchronous for immediate consistency
        Logger.log('📊 Auto mode: Low load, using synchronous');
        return syncToMasterSheet(submissionData, assignmentData, isUpdate);
      }
    } else {
      // Default: SYNCHRONOUS
      return syncToMasterSheet(submissionData, assignmentData, isUpdate);
    }

  } catch (error) {
    Logger.log('❌ Error in smartSync: ' + error.message);
    // Fallback to direct sync
    return syncToMasterSheet(submissionData, assignmentData, isUpdate);
  }
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Set sync mode (to be called from admin panel)
 * @param {string} mode - One of: 'sync', 'async', 'batch', 'auto'
 */
function setSyncMode(mode) {
  const validModes = Object.values(SYNC_MODE);
  if (!validModes.includes(mode)) {
    return {
      success: false,
      error: 'Invalid mode. Valid modes: ' + validModes.join(', ')
    };
  }

  CURRENT_SYNC_MODE = mode;

  // Persist the setting
  const props = PropertiesService.getScriptProperties();
  props.setProperty('MASTER_SHEET_SYNC_MODE', mode);

  Logger.log('✅ Sync mode changed to: ' + mode);

  return {
    success: true,
    mode: mode,
    message: 'Sync mode updated successfully'
  };
}

/**
 * Get current sync mode
 */
function getSyncMode() {
  return {
    success: true,
    mode: CURRENT_SYNC_MODE,
    availableModes: Object.values(SYNC_MODE)
  };
}

/**
 * Get batch queue status
 */
function getBatchQueueStatus() {
  try {
    const props = PropertiesService.getScriptProperties();
    const queueJson = props.getProperty(BATCH_CONFIG.QUEUE_KEY) || '[]';
    const queue = JSON.parse(queueJson);

    return {
      success: true,
      queueSize: queue.length,
      batchSize: BATCH_CONFIG.BATCH_SIZE,
      maxWaitMs: BATCH_CONFIG.MAX_WAIT_MS,
      willProcessAt: queue.length >= BATCH_CONFIG.BATCH_SIZE ? 'Immediately' : 'Next trigger (1 min)'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear cache manually (admin function)
 */
function clearMasterSheetCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll([]);

    Logger.log('✅ Cache cleared successfully');

    return {
      success: true,
      message: 'Master Sheet cache cleared'
    };

  } catch (error) {
    Logger.log('❌ Error clearing cache: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== PEER RATING SYNC FUNCTIONS ====================

/**
 * Sync peer rating data to Master Sheet
 * Called after peer ratings are submitted
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentEmail - Student email
 * @param {Object} peerRatingData - Peer rating details
 * @returns {Object} {success, data}
 */
function syncPeerRatingsToMaster(assignmentId, studentEmail, peerRatingData) {
  try {
    Logger.log('⭐ Syncing peer ratings to Master Sheet for: ' + studentEmail);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_CONFIG.SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);

    if (!masterSheet) {
      return { success: false, error: 'Master Sheet not found' };
    }

    // Find the student's row
    const rowId = generateRowId(studentEmail, assignmentId);
    const existingRow = findMasterSheetRow(rowId);

    if (!existingRow.found) {
      return {
        success: false,
        error: 'Student submission not found in Master Sheet'
      };
    }

    const row = [...existingRow.rowData];
    const now = formatMasterTimestamp();

    // Update peer rating columns
    row[MASTER_COLUMNS.PEER_RATINGS_SUBMITTED] = 'Yes';
    row[MASTER_COLUMNS.PEER_RATINGS_SUBMITTED_AT] = now;
    row[MASTER_COLUMNS.PEER_RATINGS_LOCKED] = 'Yes';
    row[MASTER_COLUMNS.PEER_RATINGS_GIVEN_COUNT] = peerRatingData.ratingsGiven || 0;
    row[MASTER_COLUMNS.ALL_PEERS_RATED] = peerRatingData.allPeersRated ? 'Yes' : 'No';

    // Update synced timestamp
    row[MASTER_COLUMNS.SYNCED_AT] = now;
    row[MASTER_COLUMNS.RECORD_LAST_UPDATED] = now;

    // Write updated row back to sheet
    masterSheet.getRange(existingRow.rowIndex, 1, 1, row.length).setValues([row]);

    Logger.log('✅ Peer ratings synced to Master Sheet');

    // Invalidate cache for this row
    invalidateCache(rowId);

    return {
      success: true,
      data: {
        rowId: rowId,
        action: 'PEER_RATINGS_SUBMITTED'
      }
    };

  } catch (error) {
    Logger.log('❌ Error syncing peer ratings to Master Sheet: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update average peer rating received for a student
 * Called when calculating average ratings
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentEmail - Student email
 * @param {number} averageRating - Average rating received
 * @param {number} totalRatings - Total number of ratings received
 * @returns {Object} {success, data}
 */
function updateAveragePeerRating(assignmentId, studentEmail, averageRating, totalRatings) {
  try {
    Logger.log('⭐ Updating average peer rating for: ' + studentEmail);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_CONFIG.SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);

    if (!masterSheet) {
      return { success: false, error: 'Master Sheet not found' };
    }

    // Find the student's row
    const rowId = generateRowId(studentEmail, assignmentId);
    const existingRow = findMasterSheetRow(rowId);

    if (!existingRow.found) {
      return {
        success: false,
        error: 'Student submission not found in Master Sheet'
      };
    }

    const row = [...existingRow.rowData];
    const now = formatMasterTimestamp();

    // Update average peer rating columns
    row[MASTER_COLUMNS.AVERAGE_PEER_RATING_RECEIVED] = averageRating || 0;
    row[MASTER_COLUMNS.TOTAL_PEER_RATINGS_RECEIVED] = totalRatings || 0;

    // Update synced timestamp
    row[MASTER_COLUMNS.SYNCED_AT] = now;
    row[MASTER_COLUMNS.RECORD_LAST_UPDATED] = now;

    // Write updated row back to sheet
    masterSheet.getRange(existingRow.rowIndex, 1, 1, row.length).setValues([row]);

    Logger.log('✅ Average peer rating updated in Master Sheet');

    // Invalidate cache for this row
    invalidateCache(rowId);

    return {
      success: true,
      data: {
        rowId: rowId,
        averageRating: averageRating,
        totalRatings: totalRatings,
        action: 'PEER_RATING_AVERAGE_UPDATED'
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating average peer rating: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== HEADER INITIALIZATION ====================

/**
 * Initialize or Update Master Sheet Headers
 * Run this function once to add all 100 column headers
 * @returns {Object} {success, message}
 */
function initializeMasterSheetHeaders() {
  try {
    Logger.log('🔧 Initializing Master Sheet Headers...');

    const ss = SpreadsheetApp.openById(MASTER_SHEET_CONFIG.SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_CONFIG.MASTER_SHEET_NAME);

    if (!masterSheet) {
      return { success: false, error: 'Master Sheet not found' };
    }

    // Define all 100 column headers
    const headers = [
      'rowId',                        // 0 - A
      'Unique ID',                    // 1 - B
      'assignmentId',                 // 2 - C
      'assignmentTitle',              // 3 - D
      'subject',                      // 4 - E
      'subjectCode',                  // 5 - F
      'assignmentType',               // 6 - G
      'startDate',                    // 7 - H
      'dueDate',                      // 8 - I
      'totalMarks',                   // 9 - J
      'studentEmail',                 // 10 - K
      'studentName',                  // 11 - L
      'batch',                        // 12 - M
      'term',                         // 13 - N
      'isSubmitted',                  // 14 - O
      'isEdited',                     // 15 - P
      'editCount',                    // 16 - Q
      'submissionStatus',             // 17 - R
      'submissionType',               // 18 - S
      'firstSubmissionTime',          // 19 - T
      'lastEditTime',                 // 20 - U
      'lastEditedBy',                 // 21 - V
      'recordCreated',                // 22 - W
      'recordLastUpdated',            // 23 - X
      'Q1',                           // 24 - Y
      'Q2',                           // 25 - Z
      'Q3',                           // 26 - AA
      'Q4',                           // 27 - AB
      'Q5',                           // 28 - AC
      'Q6',                           // 29 - AD
      'Q7',                           // 30 - AE
      'Q8',                           // 31 - AF
      'Q9',                           // 32 - AG
      'Q10',                          // 33 - AH
      'Q11',                          // 34 - AI
      'Q12',                          // 35 - AJ
      'Q13',                          // 36 - AK
      'Q14',                          // 37 - AL
      'Q15',                          // 38 - AM
      'Q16',                          // 39 - AN
      'Q17',                          // 40 - AO
      'Q18',                          // 41 - AP
      'Q19',                          // 42 - AQ
      'Q20',                          // 43 - AR
      'Q1 Mandatory',                 // 44 - AS
      'Q2 Mandatory',                 // 45 - AT
      'Q3 Mandatory',                 // 46 - AU
      'Q4 Mandatory',                 // 47 - AV
      'Q5 Mandatory',                 // 48 - AW
      'Q6 Mandatory',                 // 49 - AX
      'Q7 Mandatory',                 // 50 - AY
      'Q8 Mandatory',                 // 51 - AZ
      'Q9 Mandatory',                 // 52 - BA
      'Q10 Mandatory',                // 53 - BB
      'Q11 Mandatory',                // 54 - BC
      'Q12 Mandatory',                // 55 - BD
      'Q13 Mandatory',                // 56 - BE
      'Q14 Mandatory',                // 57 - BF
      'Q15 Mandatory',                // 58 - BG
      'Q16 Mandatory',                // 59 - BH
      'Q17 Mandatory',                // 60 - BI
      'Q18 Mandatory',                // 61 - BJ
      'Q19 Mandatory',                // 62 - BK
      'Q20 Mandatory',                // 63 - BL
      'URL Submission 1',             // 64 - BM
      'URL Submission 2',             // 65 - BN
      'URL Submission 3',             // 66 - BO
      'URL Submission 4',             // 67 - BP
      'URL Submission 5',             // 68 - BQ
      'File Upload 1',                // 69 - BR
      'File Upload 2',                // 70 - BS
      'File Upload 3',                // 71 - BT
      'File Upload 4',                // 72 - BU
      'File Upload 5',                // 73 - BV
      'File Upload 6',                // 74 - BW
      'File Upload 7',                // 75 - BX
      'File Upload 8',                // 76 - BY
      'File Upload 9',                // 77 - BZ
      'File Upload 10',               // 78 - CA
      'groupName',                    // 79 - CB
      'groupMembers',                 // 80 - CC
      'Group Members Emails',         // 81 - CD (NEW)
      'Total Group Members',          // 82 - CE (NEW)
      'isGroupLeader',                // 83 - CF
      'Max Group Members',            // 84 - CG (NEW)
      'Submission ID',                // 85 - CH (NEW - CRITICAL!)
      'Submitter Email',              // 86 - CI (NEW)
      'Submitter Name',               // 87 - CJ (NEW)
      'Peer Rating Enabled',          // 88 - CK (NEW)
      'Peer Ratings Submitted',       // 89 - CL (NEW)
      'Peer Ratings Submitted At',    // 90 - CM (NEW)
      'Peer Ratings Locked',          // 91 - CN (NEW)
      'Average Peer Rating Received', // 92 - CO (NEW)
      'Total Peer Ratings Received',  // 93 - CP (NEW)
      'Peer Ratings Given Count',     // 94 - CQ (NEW)
      'All Peers Rated',              // 95 - CR (NEW)
      'sheetSource',                  // 96 - CS
      'syncedAt',                     // 97 - CT
      'isActive',                     // 98 - CU
      'notes'                         // 99 - CV
    ];

    // Check current header row
    const currentHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const currentColumnCount = currentHeaders.length;

    Logger.log('📊 Current column count: ' + currentColumnCount);
    Logger.log('📊 Target column count: 100');

    if (currentColumnCount >= 100) {
      // Already has 100+ columns, just update the headers to ensure they're correct
      Logger.log('✅ Sheet already has 100+ columns, updating headers...');
      masterSheet.getRange(1, 1, 1, 100).setValues([headers]);

      return {
        success: true,
        message: 'Headers updated successfully (100 columns)',
        action: 'UPDATED'
      };
    } else {
      // Need to add missing columns
      const missingColumns = 100 - currentColumnCount;
      Logger.log('➕ Adding ' + missingColumns + ' missing columns...');

      // Update all headers
      masterSheet.getRange(1, 1, 1, 100).setValues([headers]);

      return {
        success: true,
        message: 'Added ' + missingColumns + ' new columns. Total: 100 columns',
        action: 'INITIALIZED',
        columnsAdded: missingColumns
      };
    }

  } catch (error) {
    Logger.log('❌ Error initializing headers: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== TEST FUNCTIONS ====================

/**
 * Test Master Sheet sync
 */
function testMasterSheetSync() {
  Logger.log('🧪 Testing Master Sheet Sync...');

  const testSubmission = {
    assignmentId: '2025-SU-20251207-001',
    studentEmail: 'test@ssb.edu',
    studentName: 'Test Student',
    answers: {
      q1: 'Answer 1',
      q2: 'Answer 2'
    },
    files: [
      { name: 'test.pdf', url: 'https://drive.google.com/file/d/123' }
    ],
    urls: ['https://example.com'],
    groupName: '',
    groupMembers: [],
    isGroupLeader: false
  };

  const testAssignment = {
    assignmentHeader: 'Test Assignment',
    subject: 'Test Subject',
    subjectCode: 'TS101',
    groupAssignment: 'No',
    startDateTime: '01-Dec-2025 00:00:00',
    endDateTime: '31-Dec-2025 23:59:59',
    totalMarks: '100',
    batch: 'Batch 2025',
    term: 'Term 1',
    sheetsLink: 'https://docs.google.com/spreadsheets/d/test',
    questions: [
      { question: 'Q1?', mandatory: 'Yes' },
      { question: 'Q2?', mandatory: 'No' }
    ]
  };

  const result = syncToMasterSheet(testSubmission, testAssignment, false);
  Logger.log('Test Result: ' + JSON.stringify(result));
}

/**
 * Test batch processing
 */
function testBatchProcessing() {
  Logger.log('🧪 Testing Batch Processing...');

  // Add 5 test submissions to queue
  for (let i = 1; i <= 5; i++) {
    const testSubmission = {
      assignmentId: '2025-SU-20251207-00' + i,
      studentEmail: 'test' + i + '@ssb.edu',
      studentName: 'Test Student ' + i,
      answers: { q1: 'Answer ' + i },
      files: [],
      urls: [],
      groupName: '',
      groupMembers: [],
      isGroupLeader: false
    };

    const testAssignment = {
      assignmentHeader: 'Test Assignment ' + i,
      subject: 'Test Subject',
      subjectCode: 'TS101',
      groupAssignment: 'No',
      startDateTime: '01-Dec-2025 00:00:00',
      endDateTime: '31-Dec-2025 23:59:59',
      totalMarks: '100',
      batch: 'Batch 2025',
      term: 'Term 1',
      sheetsLink: 'https://docs.google.com/spreadsheets/d/test',
      questions: []
    };

    addToBatchQueue(testSubmission, testAssignment, false);
  }

  // Check queue status
  const status = getBatchQueueStatus();
  Logger.log('Queue Status: ' + JSON.stringify(status));

  // Process the queue
  const result = processBatchQueue();
  Logger.log('Batch Result: ' + JSON.stringify(result));
}
