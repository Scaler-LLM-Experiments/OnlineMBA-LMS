/**
 * SSB CONTENT MANAGEMENT SYSTEM
 * Handles Events & Announcements, Policy & Documents
 *
 * Features:
 * - CRUD operations for all content types
 * - Dynamic folder structure using existing Zoom folders
 * - File upload to Google Drive
 * - URL parsing and formatting
 * - Batch-based folder creation/reuse
 */

// ==================== CONFIGURATION ====================

const CONTENT_CONFIG = {
  SHEET_ID: "1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk",

  // Main Drive folder - renamed from "SSB Zoom Recordings" to "Scaler School of Business"
  MAIN_DRIVE_FOLDER_ID: "1fm5W7aHG8ad0GNCyluUwBLtkRMioEkQG",
  MAIN_DRIVE_FOLDER_NAME: "Scaler School of Business",

  // Sheet names for content management
  SHEETS: {
    // RESOURCES: "Resources Management", // REMOVED - Will be reimplemented
    EVENTS: "Events & Announcements Management",
    POLICIES: "Policy & Documents Management"
  },

  TIMEZONE: "Asia/Kolkata"
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get or create folder in Drive
 * @param {Folder} parentFolder - Parent folder object
 * @param {string} folderName - Name of folder to get/create
 * @returns {Folder} Folder object
 */
function getOrCreateContentFolder(parentFolder, folderName) {
  try {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parentFolder.createFolder(folderName);
  } catch (error) {
    Logger.log(`Error getting/creating folder ${folderName}: ${error.message}`);
    throw error;
  }
}

/**
 * Format timestamp for sheets
 * @returns {string} Formatted timestamp
 */
function formatContentTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, CONTENT_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
}

/**
 * Generate unique ID for content
 * @param {string} prefix - Prefix for ID (RES, EVT, POL)
 * @returns {string} Unique ID
 */
function generateContentId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Parse URLs from single cell format to array
 * Format: "Name1|URL1,Name2|URL2,Name3|URL3"
 * @param {string} urlsCell - Cell content
 * @returns {Array} Array of {name, url} objects
 */
function parseURLs(urlsCell) {
  if (!urlsCell || urlsCell.trim() === '') {
    return [];
  }

  try {
    const entries = urlsCell.split(',');
    const urls = [];

    for (let i = 0; i < entries.length && i < 5; i++) {
      const entry = entries[i].trim();
      const parts = entry.split('|');

      if (parts.length === 2) {
        urls.push({
          name: parts[0].trim(),
          url: parts[1].trim()
        });
      }
    }

    return urls;
  } catch (error) {
    Logger.log('Error parsing URLs: ' + error.message);
    return [];
  }
}

/**
 * Format URLs array for storage in single cell
 * @param {Array} urlsArray - Array of {name, url} objects
 * @returns {string} Formatted string
 */
function formatURLsForStorage(urlsArray) {
  if (!urlsArray || urlsArray.length === 0) {
    return '';
  }

  // Take max 5 URLs
  const limited = urlsArray.slice(0, 5);

  // Format: "Name|URL,Name|URL"
  return limited
    .filter(item => item.name && item.url)
    .map(item => `${item.name.trim()}|${item.url.trim()}`)
    .join(',');
}

// ==================== FOLDER SCANNING ====================

/**
 * Get available folders from existing structure
 * Scans the main Drive folder and returns hierarchical structure
 *
 * @param {string} batch - Optional: Filter by batch
 * @param {string} term - Optional: Filter by term
 * @param {string} domain - Optional: Filter by domain
 * @param {string} subject - Optional: Filter by subject
 * @returns {Object} Available folders structure
 */
function getAvailableFolders(batch, term, domain, subject) {
  try {
    Logger.log('📂 Scanning available folders...');

    const mainFolder = DriveApp.getFolderById(CONTENT_CONFIG.MAIN_DRIVE_FOLDER_ID);
    const result = {
      batches: [],
      terms: {},
      domains: {},
      subjects: {},
      sessions: {}
    };

    // Get all batches
    const batchFolders = mainFolder.getFolders();
    while (batchFolders.hasNext()) {
      const batchFolder = batchFolders.next();
      const batchName = batchFolder.getName();

      // Skip internal folders (starting with _)
      if (batchName.startsWith('_')) continue;

      result.batches.push(batchName);

      // If batch filter provided and doesn't match, skip
      if (batch && batchName !== batch) continue;

      result.terms[batchName] = [];
      result.domains[batchName] = {};
      result.subjects[batchName] = {};
      result.sessions[batchName] = {};

      // Get terms for this batch
      const termFolders = batchFolder.getFolders();
      while (termFolders.hasNext()) {
        const termFolder = termFolders.next();
        const termName = termFolder.getName();

        // Skip internal folders
        if (termName.startsWith('_')) continue;

        result.terms[batchName].push(termName);

        // If term filter provided and doesn't match, skip
        if (term && termName !== term) continue;

        result.domains[batchName][termName] = [];
        result.subjects[batchName][termName] = {};
        result.sessions[batchName][termName] = {};

        // Get domains for this term
        const domainFolders = termFolder.getFolders();
        while (domainFolders.hasNext()) {
          const domainFolder = domainFolders.next();
          const domainName = domainFolder.getName();

          // Skip internal folders
          if (domainName.startsWith('_')) continue;

          result.domains[batchName][termName].push(domainName);

          // If domain filter provided and doesn't match, skip
          if (domain && domainName !== domain) continue;

          result.subjects[batchName][termName][domainName] = [];
          result.sessions[batchName][termName][domainName] = {};

          // Get subjects for this domain
          const subjectFolders = domainFolder.getFolders();
          while (subjectFolders.hasNext()) {
            const subjectFolder = subjectFolders.next();
            const subjectName = subjectFolder.getName();

            // Skip internal folders
            if (subjectName.startsWith('_')) continue;

            result.subjects[batchName][termName][domainName].push(subjectName);

            // If subject filter provided and doesn't match, skip
            if (subject && subjectName !== subject) continue;

            result.sessions[batchName][termName][domainName][subjectName] = [];

            // Get sessions for this subject
            const sessionFolders = subjectFolder.getFolders();
            while (sessionFolders.hasNext()) {
              const sessionFolder = sessionFolders.next();
              const sessionName = sessionFolder.getName();

              // Skip internal folders and resource folders
              if (sessionName.startsWith('_') || sessionName.match(/^\d{2} - /)) continue;

              result.sessions[batchName][termName][domainName][subjectName].push(sessionName);
            }
          }
        }
      }
    }

    Logger.log(`✅ Found ${result.batches.length} batches`);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    Logger.log('❌ Error scanning folders: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get simplified dropdown options based on selection
 * @param {string} level - Level to get options for: 'batch' | 'term' | 'domain' | 'subject' | 'session'
 * @param {Object} filters - Current selections {batch, term, domain, subject}
 * @returns {Object} Available options for the level
 */
function getDropdownOptions(level, filters) {
  try {
    const structure = getAvailableFolders(
      filters.batch,
      filters.term,
      filters.domain,
      filters.subject
    );

    if (!structure.success) {
      return { success: false, error: structure.error };
    }

    const data = structure.data;
    let options = [];

    switch (level) {
      case 'batch':
        options = data.batches;
        break;

      case 'term':
        if (filters.batch && data.terms[filters.batch]) {
          options = data.terms[filters.batch];
        }
        break;

      case 'domain':
        if (filters.batch && filters.term && data.domains[filters.batch] && data.domains[filters.batch][filters.term]) {
          options = data.domains[filters.batch][filters.term];
        }
        break;

      case 'subject':
        if (filters.batch && filters.term && filters.domain &&
            data.subjects[filters.batch] && data.subjects[filters.batch][filters.term] &&
            data.subjects[filters.batch][filters.term][filters.domain]) {
          options = data.subjects[filters.batch][filters.term][filters.domain];
        }
        break;

      case 'session':
        if (filters.batch && filters.term && filters.domain && filters.subject &&
            data.sessions[filters.batch] && data.sessions[filters.batch][filters.term] &&
            data.sessions[filters.batch][filters.term][filters.domain] &&
            data.sessions[filters.batch][filters.term][filters.domain][filters.subject]) {
          options = data.sessions[filters.batch][filters.term][filters.domain][filters.subject];
        }
        break;
    }

    return {
      success: true,
      data: options
    };

  } catch (error) {
    Logger.log('Error getting dropdown options: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FOLDER CREATION ====================

/**
 * Create event/announcement folder structure
 * Path: Batch/_Events & Announcements/{YYYY-MM}/{EventName}/
 *
 * @param {Object} params - {batch, eventName, startDateTime}
 * @returns {Object} {success, folder, folderUrl}
 */
function createEventFolder(params) {
  try {
    const { batch, eventName, startDateTime } = params;

    Logger.log(`📁 Creating event folder: ${eventName}`);

    const mainFolder = DriveApp.getFolderById(CONTENT_CONFIG.MAIN_DRIVE_FOLDER_ID);
    const batchFolder = getOrCreateContentFolder(mainFolder, batch);

    // Create _Events & Announcements folder
    const eventsFolder = getOrCreateContentFolder(batchFolder, '_Events & Announcements');

    // Get year-month from startDateTime
    const date = new Date(startDateTime);
    const yearMonth = Utilities.formatDate(date, CONTENT_CONFIG.TIMEZONE, 'yyyy-MM');

    // Create year-month folder
    const monthFolder = getOrCreateContentFolder(eventsFolder, yearMonth);

    // Create event folder
    const eventFolder = getOrCreateContentFolder(monthFolder, eventName);

    // Create subfolders
    getOrCreateContentFolder(eventFolder, 'Attachments');
    getOrCreateContentFolder(eventFolder, 'Photos');

    Logger.log(`✅ Event folder created: ${eventFolder.getUrl()}`);

    return {
      success: true,
      folder: eventFolder,
      folderUrl: eventFolder.getUrl()
    };

  } catch (error) {
    Logger.log('❌ Error creating event folder: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create policy/document folder structure
 * Path: Batch/_Policy & Documents/{Category}/
 *
 * @param {Object} params - {batch, category}
 * @returns {Object} {success, folder, folderUrl}
 */
function createPolicyFolder(params) {
  try {
    const { batch, category } = params;

    Logger.log(`📁 Creating policy folder: Category=${category}`);

    const mainFolder = DriveApp.getFolderById(CONTENT_CONFIG.MAIN_DRIVE_FOLDER_ID);
    const batchFolder = getOrCreateContentFolder(mainFolder, batch);

    // Create _Policy & Documents folder
    const policiesFolder = getOrCreateContentFolder(batchFolder, '_Policy & Documents');

    // Create category folder
    const categoryFolder = getOrCreateContentFolder(policiesFolder, category);

    Logger.log(`✅ Policy folder created: ${categoryFolder.getUrl()}`);

    return {
      success: true,
      folder: categoryFolder,
      folderUrl: categoryFolder.getUrl()
    };

  } catch (error) {
    Logger.log('❌ Error creating policy folder: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FILE UPLOAD ====================

/**
 * Initiate a resumable upload session
 * @param {string} folderId - Target folder ID
 * @param {string} fileName - Name of file
 * @param {string} mimeType - MIME type of file
 * @param {number} fileSize - Size of file in bytes
 * @returns {Object} {success, uploadUrl, sessionUrl}
 */
function initiateResumableUpload(folderId, fileName, mimeType, fileSize) {
  try {
    Logger.log(`🚀 Initiating resumable upload for: ${fileName} (${fileSize} bytes)`);

    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [folderId]
    };

    const token = ScriptApp.getOAuthToken();
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize.toString()
      },
      payload: JSON.stringify(metadata),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const uploadUrl = response.getHeaders()['Location'];
      Logger.log(`✅ Resumable upload session created: ${uploadUrl}`);

      return {
        success: true,
        uploadUrl: uploadUrl,
        sessionUrl: uploadUrl
      };
    } else {
      Logger.log(`❌ Failed to initiate upload. Response: ${response.getContentText()}`);
      return {
        success: false,
        error: `Failed to initiate upload: ${response.getContentText()}`
      };
    }

  } catch (error) {
    Logger.log(`❌ Error initiating resumable upload: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check resumable upload status
 * @param {string} uploadUrl - Session upload URL
 * @returns {Object} {success, bytesReceived, complete}
 */
function checkResumableUploadStatus(uploadUrl) {
  try {
    Logger.log(`🔍 Checking upload status for session: ${uploadUrl}`);

    const token = ScriptApp.getOAuthToken();
    const options = {
      method: 'put',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Length': '0',
        'Content-Range': 'bytes */*'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(uploadUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 308) {
      // Upload incomplete, get range
      const rangeHeader = response.getHeaders()['Range'];
      if (rangeHeader) {
        const bytesReceived = parseInt(rangeHeader.split('-')[1]) + 1;
        Logger.log(`📊 Upload progress: ${bytesReceived} bytes received`);
        return {
          success: true,
          bytesReceived: bytesReceived,
          complete: false
        };
      }
    } else if (responseCode === 200 || responseCode === 201) {
      // Upload complete
      Logger.log(`✅ Upload complete`);
      const fileMetadata = JSON.parse(response.getContentText());
      return {
        success: true,
        complete: true,
        fileId: fileMetadata.id,
        fileName: fileMetadata.name
      };
    }

    return {
      success: false,
      error: `Unexpected response code: ${responseCode}`
    };

  } catch (error) {
    Logger.log(`❌ Error checking upload status: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Finalize resumable upload
 * @param {string} uploadUrl - Session upload URL
 * @param {string} fileData - Base64 encoded file data
 * @param {number} startByte - Starting byte position (for resume)
 * @param {number} totalSize - Total file size
 * @returns {Object} {success, fileId, fileUrl}
 */
function finalizeResumableUpload(uploadUrl, fileData, startByte, totalSize) {
  try {
    Logger.log(`📤 Uploading chunk from byte ${startByte} to ${totalSize}`);

    const token = ScriptApp.getOAuthToken();
    const binaryData = Utilities.base64Decode(fileData);

    const options = {
      method: 'put',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Length': binaryData.length.toString(),
        'Content-Range': `bytes ${startByte}-${startByte + binaryData.length - 1}/${totalSize}`
      },
      payload: binaryData,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(uploadUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      const fileMetadata = JSON.parse(response.getContentText());
      const file = DriveApp.getFileById(fileMetadata.id);

      // Make file accessible to anyone with link
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      Logger.log(`✅ Upload finalized: ${file.getUrl()}`);

      return {
        success: true,
        fileId: fileMetadata.id,
        fileUrl: file.getUrl(),
        fileName: file.getName(),
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.size
      };
    } else if (responseCode === 308) {
      // More chunks needed
      return {
        success: true,
        incomplete: true,
        message: 'More chunks required'
      };
    } else {
      Logger.log(`❌ Upload failed. Response: ${response.getContentText()}`);
      return {
        success: false,
        error: `Upload failed: ${response.getContentText()}`
      };
    }

  } catch (error) {
    Logger.log(`❌ Error finalizing upload: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload file to Drive folder (Simple upload for small files < 10MB, Resumable for larger)
 * @param {Folder} folder - Target folder
 * @param {string} fileName - Name of file
 * @param {string} fileData - Base64 encoded file data
 * @param {string} mimeType - MIME type of file
 * @returns {Object} {success, file, fileUrl}
 */
function uploadFileToDrive(folder, fileName, fileData, mimeType) {
  try {
    Logger.log(`📤 Uploading file: ${fileName}`);

    // Decode to check size
    const binaryData = Utilities.base64Decode(fileData);
    const fileSize = binaryData.length;
    const fileSizeMB = fileSize / (1024 * 1024);

    Logger.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);

    // Use resumable upload for files > 10MB
    if (fileSize > 10 * 1024 * 1024) {
      Logger.log(`🚀 Using resumable upload for large file`);

      // Initiate resumable session
      const initResult = initiateResumableUpload(folder.getId(), fileName, mimeType, fileSize);

      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // Upload the file data
      const uploadResult = finalizeResumableUpload(initResult.uploadUrl, fileData, 0, fileSize);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      return {
        success: true,
        file: DriveApp.getFileById(uploadResult.fileId),
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName
      };
    }

    // Simple upload for smaller files
    Logger.log(`📦 Using simple upload for small file`);

    const blob = Utilities.newBlob(binaryData, mimeType, fileName);
    const file = folder.createFile(blob);

    // Make file accessible to anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log(`✅ File uploaded: ${file.getUrl()}`);

    return {
      success: true,
      file: file,
      fileUrl: file.getUrl(),
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

// ==================== EVENTS & ANNOUNCEMENTS CRUD ====================

/**
 * Create new event/announcement
 * @param {Object} eventData - Event data from admin form
 * @returns {Object} {success, eventId, data}
 */
function createEvent(eventData) {
  try {
    Logger.log('📝 Creating new event/announcement...');

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.EVENTS);

    // Generate ID
    const eventId = generateContentId('EVT');

    // Create folder structure
    const folderResult = createEventFolder({
      batch: eventData.batch,
      eventName: eventData.title,
      startDateTime: eventData.startDateTime
    });

    if (!folderResult.success) {
      return { success: false, error: folderResult.error };
    }

    // Format URLs
    const urlsCell = formatURLsForStorage(eventData.urls || []);

    // Count files
    const fileCount = [
      eventData.file1Url,
      eventData.file2Url,
      eventData.file3Url
    ].filter(url => url && url.trim() !== '').length;

    // Prepare row data (37 columns)
    const timestamp = formatContentTimestamp();
    const row = [
      eventId,                              // A - ID
      eventData.publish || 'No',            // B - Publish
      eventData.postedBy,                   // C - Posted By
      timestamp,                            // D - Created at
      '',                                   // E - Edited at
      '',                                   // F - Edited by
      eventData.startDateTime,              // G - StartDateTime
      eventData.endDateTime || '',          // H - EndDateTime
      eventData.batch || '',                // I - Batch
      eventData.showOtherBatches || '',     // J - Show Other Batches
      eventData.categoryType,               // K - Category Type (Event/Announcement)
      eventData.eventType || '',            // L - Event Subtype
      eventData.announcementType || '',     // M - Announcement Subtype
      eventData.title,                      // N - Title
      eventData.subtitle || '',             // O - Subtitle
      eventData.description || '',          // P - Description
      eventData.priority || 'Medium',       // Q - Priority
      eventData.location || '',             // R - Event Location/Link
      eventData.agenda || '',               // S - Event Agenda
      eventData.speakerInfo || '',          // T - Speaker Info
      eventData.displayInCalendar || 'Yes', // U - Display in Calendar
      eventData.requiresAcknowledgement || 'No', // V - Requires Acknowledgement
      eventData.registrationRequired || 'No',    // W - Registration Required
      eventData.registrationLink || '',     // X - Registration Link
      eventData.maxAttendees || '',         // Y - Max Attendees
      eventData.file1Name || '',            // Z - File 1 Name
      eventData.file1Url || '',             // AA - File 1 URL
      eventData.file2Name || '',            // AB - File 2 Name
      eventData.file2Url || '',             // AC - File 2 URL
      eventData.file3Name || '',            // AD - File 3 Name
      eventData.file3Url || '',             // AE - File 3 URL
      urlsCell,                             // AF - URLs
      eventData.coverImageUrl || '',        // AG - Cover Image URL
      folderResult.folderUrl,               // AH - Drive Folder Link
      fileCount,                            // AI - File Count
      'Published',                          // AJ - Status
      eventData.notes || ''                 // AK - Notes
    ];

    // Append to sheet
    sheet.appendRow(row);

    Logger.log(`✅ Event created: ${eventId}`);

    return {
      success: true,
      eventId: eventId,
      data: {
        id: eventId,
        title: eventData.title,
        folderUrl: folderResult.folderUrl
      }
    };

  } catch (error) {
    Logger.log('❌ Error creating event: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing event/announcement
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Updated event data
 * @returns {Object} {success, data}
 */
function updateEvent(eventId, eventData) {
  try {
    Logger.log(`📝 Updating event: ${eventId}`);

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.EVENTS);

    const data = sheet.getDataRange().getValues();

    // Find event row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === eventId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Event not found' };
    }

    // Format URLs
    const urlsCell = formatURLsForStorage(eventData.urls || []);

    // Count files
    const fileCount = [
      eventData.file1Url,
      eventData.file2Url,
      eventData.file3Url
    ].filter(url => url && url.trim() !== '').length;

    // Update row
    const timestamp = formatContentTimestamp();
    const existingRow = data[rowIndex - 1];

    const updatedRow = [
      existingRow[0],                       // A - ID (keep original)
      eventData.publish || existingRow[1],  // B - Publish
      existingRow[2],                       // C - Posted By (keep original)
      existingRow[3],                       // D - Created at (keep original)
      timestamp,                            // E - Edited at
      eventData.editedBy,                   // F - Edited by
      eventData.startDateTime,              // G - StartDateTime
      eventData.endDateTime || '',          // H - EndDateTime
      eventData.batch || existingRow[8] || '', // I - Batch
      eventData.showOtherBatches || '',     // J - Show Other Batches
      eventData.categoryType,               // K - Category Type
      eventData.eventType || '',            // L - Event Subtype
      eventData.announcementType || '',     // M - Announcement Subtype
      eventData.title,                      // N - Title
      eventData.subtitle || '',             // O - Subtitle
      eventData.description || '',          // P - Description
      eventData.priority || 'Medium',       // Q - Priority
      eventData.location || '',             // R - Event Location/Link
      eventData.agenda || '',               // S - Event Agenda
      eventData.speakerInfo || '',          // T - Speaker Info
      eventData.displayInCalendar || 'Yes', // U - Display in Calendar
      eventData.requiresAcknowledgement || 'No', // V - Requires Acknowledgement
      eventData.registrationRequired || 'No',    // W - Registration Required
      eventData.registrationLink || '',     // X - Registration Link
      eventData.maxAttendees || '',         // Y - Max Attendees
      eventData.file1Name || '',            // Z - File 1 Name
      eventData.file1Url || '',             // AA - File 1 URL
      eventData.file2Name || '',            // AB - File 2 Name
      eventData.file2Url || '',             // AC - File 2 URL
      eventData.file3Name || '',            // AD - File 3 Name
      eventData.file3Url || '',             // AE - File 3 URL
      urlsCell,                             // AF - URLs
      eventData.coverImageUrl || '',        // AG - Cover Image URL
      existingRow[32],                      // AH - Drive Folder Link (keep original)
      fileCount,                            // AI - File Count
      eventData.status || 'Published',      // AJ - Status
      eventData.notes || ''                 // AK - Notes
    ];

    // Update sheet
    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    Logger.log(`✅ Event updated: ${eventId}`);

    return {
      success: true,
      data: {
        id: eventId,
        title: eventData.title
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating event: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete event/announcement (soft delete)
 * @param {string} eventId - Event ID to delete
 * @returns {Object} {success}
 */
function deleteEvent(eventId) {
  try {
    Logger.log(`🗑️ Deleting event: ${eventId}`);

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.EVENTS);

    const data = sheet.getDataRange().getValues();

    // Find event row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === eventId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Event not found' };
    }

    // Soft delete - set status to Ended
    sheet.getRange(rowIndex, 36).setValue('Ended'); // Column AJ - Status

    Logger.log(`✅ Event archived: ${eventId}`);

    return { success: true };

  } catch (error) {
    Logger.log('❌ Error deleting event: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all events/announcements with optional filters
 * @param {Object} filters - Optional filters
 * @returns {Object} {success, data: [events]}
 */
function getEvents(filters) {
  try {
    Logger.log('📚 Getting events/announcements...');

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.EVENTS);

    const data = sheet.getDataRange().getValues();
    const events = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Apply filters
      if (filters) {
        if (filters.batch && row[8] !== filters.batch) continue;
        if (filters.categoryType && row[10] !== filters.categoryType) continue;
        if (filters.status && row[35] !== filters.status) continue;
      }

      // Parse URLs
      const urls = parseURLs(row[31]);

      // Build event object
      const event = {
        id: row[0],
        publish: row[1],
        postedBy: row[2],
        createdAt: row[3],
        editedAt: row[4],
        editedBy: row[5],
        startDateTime: row[6],
        endDateTime: row[7],
        batch: row[8],
        showOtherBatches: row[9],
        categoryType: row[10],
        eventType: row[11],
        announcementType: row[12],
        title: row[13],
        subtitle: row[14],
        description: row[15],
        priority: row[16],
        location: row[17],
        agenda: row[18],
        speakerInfo: row[19],
        displayInCalendar: row[20],
        requiresAcknowledgement: row[21],
        registrationRequired: row[22],
        registrationLink: row[23],
        maxAttendees: row[24],
        files: [
          { name: row[25], url: row[26] },
          { name: row[27], url: row[28] },
          { name: row[29], url: row[30] }
        ].filter(f => f.name || f.url),
        urls: urls,
        coverImageUrl: row[32],
        driveFolderLink: row[33],
        fileCount: row[34],
        status: row[35],
        notes: row[36]
      };

      events.push(event);
    }

    Logger.log(`✅ Found ${events.length} events/announcements`);

    return {
      success: true,
      data: events
    };

  } catch (error) {
    Logger.log('❌ Error getting events: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== POLICY & DOCUMENTS CRUD ====================

/**
 * Create new policy/document
 * @param {Object} policyData - Policy data from admin form
 * @returns {Object} {success, policyId, data}
 */
function createPolicy(policyData) {
  try {
    Logger.log('📝 Creating new policy/document...');

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.POLICIES);

    // Generate ID
    const policyId = generateContentId('POL');

    // Create folder structure
    const folderResult = createPolicyFolder({
      batch: policyData.batch,
      category: policyData.documentCategory
    });

    if (!folderResult.success) {
      return { success: false, error: folderResult.error };
    }

    // Format URLs
    const urlsCell = formatURLsForStorage(policyData.urls || []);

    // Count files
    const fileCount = [
      policyData.file1Url,
      policyData.file2Url,
      policyData.file3Url
    ].filter(url => url && url.trim() !== '').length;

    // Prepare row data (32 columns)
    const timestamp = formatContentTimestamp();
    const row = [
      policyId,                             // A - ID
      policyData.publish || 'No',           // B - Publish
      policyData.postedBy,                  // C - Posted By
      timestamp,                            // D - Created at
      '',                                   // E - Edited at
      '',                                   // F - Edited by
      policyData.effectiveDate || timestamp, // G - StartDateTime (Effective Date)
      policyData.reviewDate || '',          // H - EndDateTime (Review Date)
      policyData.targetBatch,               // I - Target Batch
      policyData.showOtherBatches || '',    // J - Show Other Batches
      policyData.documentCategory,          // K - Document Category
      policyData.policyName,                // L - Policy/Document Name
      policyData.shortDescription || '',    // M - Short Description
      policyData.fullContent || '',         // N - Full Content
      policyData.priority || 'Medium',      // O - Priority
      policyData.version || '1.0',          // P - Version
      policyData.effectiveDate || '',       // Q - Effective Date
      policyData.reviewDate || '',          // R - Review Date
      policyData.supersedes || '',          // S - Supersedes
      policyData.requiresAcknowledgement || 'No', // T - Requires Acknowledgement
      policyData.mandatoryReading || 'No',  // U - Mandatory Reading
      policyData.file1Name || '',           // V - File 1 Name
      policyData.file1Url || '',            // W - File 1 URL
      policyData.file2Name || '',           // X - File 2 Name
      policyData.file2Url || '',            // Y - File 2 URL
      policyData.file3Name || '',           // Z - File 3 Name
      policyData.file3Url || '',            // AA - File 3 URL
      urlsCell,                             // AB - URLs
      folderResult.folderUrl,               // AC - Drive Folder Link
      fileCount,                            // AD - File Count
      'Published',                          // AE - Status
      policyData.notes || ''                // AF - Notes
    ];

    // Append to sheet
    sheet.appendRow(row);

    Logger.log(`✅ Policy created: ${policyId}`);

    return {
      success: true,
      policyId: policyId,
      data: {
        id: policyId,
        policyName: policyData.policyName,
        folderUrl: folderResult.folderUrl
      }
    };

  } catch (error) {
    Logger.log('❌ Error creating policy: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing policy/document
 * @param {string} policyId - Policy ID to update
 * @param {Object} policyData - Updated policy data
 * @returns {Object} {success, data}
 */
function updatePolicy(policyId, policyData) {
  try {
    Logger.log(`📝 Updating policy: ${policyId}`);

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.POLICIES);

    const data = sheet.getDataRange().getValues();

    // Find policy row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === policyId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Policy not found' };
    }

    // Format URLs
    const urlsCell = formatURLsForStorage(policyData.urls || []);

    // Count files
    const fileCount = [
      policyData.file1Url,
      policyData.file2Url,
      policyData.file3Url
    ].filter(url => url && url.trim() !== '').length;

    // Update row
    const timestamp = formatContentTimestamp();
    const existingRow = data[rowIndex - 1];

    const updatedRow = [
      existingRow[0],                       // A - ID (keep original)
      policyData.publish || existingRow[1], // B - Publish
      existingRow[2],                       // C - Posted By (keep original)
      existingRow[3],                       // D - Created at (keep original)
      timestamp,                            // E - Edited at
      policyData.editedBy,                  // F - Edited by
      policyData.effectiveDate || existingRow[6], // G - Effective Date
      policyData.reviewDate || existingRow[7],    // H - Review Date
      policyData.targetBatch || existingRow[8],   // I - Target Batch
      policyData.showOtherBatches || '',    // J - Show Other Batches
      policyData.documentCategory,          // K - Document Category
      policyData.policyName,                // L - Policy/Document Name
      policyData.shortDescription || '',    // M - Short Description
      policyData.fullContent || '',         // N - Full Content
      policyData.priority || 'Medium',      // O - Priority
      policyData.version || existingRow[15], // P - Version
      policyData.effectiveDate || '',       // Q - Effective Date
      policyData.reviewDate || '',          // R - Review Date
      policyData.supersedes || '',          // S - Supersedes
      policyData.requiresAcknowledgement || 'No', // T - Requires Acknowledgement
      policyData.mandatoryReading || 'No',  // U - Mandatory Reading
      policyData.file1Name || '',           // V - File 1 Name
      policyData.file1Url || '',            // W - File 1 URL
      policyData.file2Name || '',           // X - File 2 Name
      policyData.file2Url || '',            // Y - File 2 URL
      policyData.file3Name || '',           // Z - File 3 Name
      policyData.file3Url || '',            // AA - File 3 URL
      urlsCell,                             // AB - URLs
      existingRow[27],                      // AC - Drive Folder Link (keep original)
      fileCount,                            // AD - File Count
      policyData.status || 'Published',     // AE - Status
      policyData.notes || ''                // AF - Notes
    ];

    // Update sheet
    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    Logger.log(`✅ Policy updated: ${policyId}`);

    return {
      success: true,
      data: {
        id: policyId,
        policyName: policyData.policyName
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating policy: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete policy/document (soft delete)
 * @param {string} policyId - Policy ID to delete
 * @returns {Object} {success}
 */
function deletePolicy(policyId) {
  try {
    Logger.log(`🗑️ Deleting policy: ${policyId}`);

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.POLICIES);

    const data = sheet.getDataRange().getValues();

    // Find policy row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === policyId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Policy not found' };
    }

    // Soft delete - set status to Archived
    sheet.getRange(rowIndex, 31).setValue('Archived'); // Column AE - Status

    Logger.log(`✅ Policy archived: ${policyId}`);

    return { success: true };

  } catch (error) {
    Logger.log('❌ Error deleting policy: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all policies/documents with optional filters
 * @param {Object} filters - Optional filters
 * @returns {Object} {success, data: [policies]}
 */
function getPolicies(filters) {
  try {
    Logger.log('📚 Getting policies/documents...');

    const sheet = SpreadsheetApp.openById(CONTENT_CONFIG.SHEET_ID)
      .getSheetByName(CONTENT_CONFIG.SHEETS.POLICIES);

    const data = sheet.getDataRange().getValues();
    const policies = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if archived (unless explicitly requested)
      if (row[30] === 'Archived' && filters && filters.includeArchived !== true) {
        continue;
      }

      // Apply filters
      if (filters) {
        if (filters.batch && row[8] !== filters.batch) continue;
        if (filters.documentCategory && row[10] !== filters.documentCategory) continue;
        if (filters.status && row[30] !== filters.status) continue;
      }

      // Parse URLs
      const urls = parseURLs(row[27]);

      // Build policy object
      const policy = {
        id: row[0],
        publish: row[1],
        postedBy: row[2],
        createdAt: row[3],
        editedAt: row[4],
        editedBy: row[5],
        effectiveDate: row[6],
        reviewDate: row[7],
        targetBatch: row[8],
        showOtherBatches: row[9],
        documentCategory: row[10],
        policyName: row[11],
        shortDescription: row[12],
        fullContent: row[13],
        priority: row[14],
        version: row[15],
        supersedes: row[18],
        requiresAcknowledgement: row[19],
        mandatoryReading: row[20],
        files: [
          { name: row[21], url: row[22] },
          { name: row[23], url: row[24] },
          { name: row[25], url: row[26] }
        ].filter(f => f.name || f.url),
        urls: urls,
        driveFolderLink: row[28],
        fileCount: row[29],
        status: row[30],
        notes: row[31]
      };

      policies.push(policy);
    }

    Logger.log(`✅ Found ${policies.length} policies/documents`);

    return {
      success: true,
      data: policies
    };

  } catch (error) {
    Logger.log('❌ Error getting policies: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== EXPORT FUNCTIONS ====================
// All functions are automatically available to Code.js since Apps Script combines files
