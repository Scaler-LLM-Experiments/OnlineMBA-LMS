/**
 * SSB RESOURCES MANAGEMENT SYSTEM
 * Handles Course Materials, Lecture Slides, and Study Resources
 *
 * Features:
 * - CRUD operations for resources
 * - Dynamic folder structure: Batch > Resources > Term > Domain > Subject
 * - File upload to Google Drive (normal <50MB, resumable >50MB)
 * - Integration with Zoom Recordings for dropdown data
 * - Custom batch/term/domain/subject/session support
 */

// ==================== CONFIGURATION ====================

const RESOURCES_CONFIG = {
  SHEET_ID: "1b5MrRFysC3zf8ftsGJcjhUEjh5P3Q20fYAconTBm824",
  SHEET_NAME: "Resources Material",
  TERM_SHEET: "Term", // Changed from "Zoom Recordings" to "Term"

  // Main Drive folder
  MAIN_DRIVE_FOLDER_ID: "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD",

  TIMEZONE: "Asia/Kolkata",

  // File upload limits
  NORMAL_UPLOAD_LIMIT: 50 * 1024 * 1024, // 50 MB

  // Resource Types (removed "Lab Manual", added "Course Material")
  RESOURCE_TYPES: [
    'Lecture Slides',
    'Reading Material',
    'Assignment',
    'Course Material',
    'Reference Book',
    'Video Tutorial',
    'Practice Problems',
    'Case Study',
    'Course Outline',
    'Other'
  ],

  // Resource Levels
  RESOURCE_LEVELS: ['Session', 'Subject', 'Domain', 'Term', 'Other']
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get or create folder in Drive
 */
function getOrCreateFolderResMgmt(parentFolder, folderName) {
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
 */
function formatTimestampResMgmt() {
  const now = new Date();
  return Utilities.formatDate(now, RESOURCES_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
}

/**
 * Generate unique ID for resource
 */
function generateResourceIdResMgmt() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `RES_${timestamp}_${random}`;
}

/**
 * Parse URLs from single cell format to array
 * Format: "Name1|URL1,Name2|URL2,Name3|URL3"
 */
function parseURLsResMgmt(urlsCell) {
  if (!urlsCell || urlsCell.trim() === '') {
    return [];
  }

  try {
    const entries = urlsCell.split(',');
    const urls = [];

    for (let i = 0; i < entries.length && i < 50; i++) {
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
 */
function formatURLsForStorageResMgmt(urlsArray) {
  if (!urlsArray || urlsArray.length === 0) {
    return '';
  }

  // Take max 50 URLs
  const limited = urlsArray.slice(0, 50);

  // Format: "Name|URL,Name|URL"
  return limited
    .filter(item => item.name && item.url)
    .map(item => `${item.name.trim()}|${item.url.trim()}`)
    .join(',');
}

// ==================== FOLDER STRUCTURE ====================

/**
 * Create resource folder structure based on level
 * Path: Batch > Resources > Term > Domain > Subject
 *
 * @param {Object} params - {batch, level, term, domain, subject}
 * @returns {Object} {success, folder, folderUrl}
 */
function createResourceFolderResMgmt(params) {
  try {
    const { batch, level, term, domain, subject } = params;

    Logger.log(`📁 Creating resource folder for level: ${level}`);

    const mainFolder = DriveApp.getFolderById(RESOURCES_CONFIG.MAIN_DRIVE_FOLDER_ID);

    // Get/Create Batch folder
    const batchFolder = getOrCreateFolderResMgmt(mainFolder, batch);

    // Get/Create Resources folder inside Batch
    const resourcesFolder = getOrCreateFolderResMgmt(batchFolder, 'Resources');

    let targetFolder = resourcesFolder;

    // Build folder path based on level
    if (level === 'Term' && term) {
      targetFolder = getOrCreateFolderResMgmt(resourcesFolder, term);
    }
    else if (level === 'Domain' && term && domain) {
      const termFolder = getOrCreateFolderResMgmt(resourcesFolder, term);
      targetFolder = getOrCreateFolderResMgmt(termFolder, domain);
    }
    else if (level === 'Subject' && term && domain && subject) {
      const termFolder = getOrCreateFolderResMgmt(resourcesFolder, term);
      const domainFolder = getOrCreateFolderResMgmt(termFolder, domain);
      targetFolder = getOrCreateFolderResMgmt(domainFolder, subject);
    }
    else if (level === 'Session' && term && domain && subject) {
      // For session level, store in Subject folder
      const termFolder = getOrCreateFolderResMgmt(resourcesFolder, term);
      const domainFolder = getOrCreateFolderResMgmt(termFolder, domain);
      targetFolder = getOrCreateFolderResMgmt(domainFolder, subject);
    }

    Logger.log(`✅ Folder created: ${targetFolder.getUrl()}`);

    return {
      success: true,
      folder: targetFolder,
      folderUrl: targetFolder.getUrl()
    };

  } catch (error) {
    Logger.log('❌ Error creating resource folder: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FILE UPLOAD ====================

/**
 * Upload file to Drive (normal upload for <50MB)
 */
function uploadFileNormalResMgmt(folder, fileName, fileData, mimeType) {
  try {
    Logger.log(`📤 Normal upload: ${fileName}`);

    const binaryData = Utilities.base64Decode(fileData);
    const blob = Utilities.newBlob(binaryData, mimeType, fileName);
    const file = folder.createFile(blob);

    // Make file accessible to anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log(`✅ File uploaded: ${file.getUrl()}`);

    return {
      success: true,
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

/**
 * Initiate resumable upload for large files (>50MB)
 */
function initiateResumableUploadResMgmt(folderId, fileName, mimeType, fileSize) {
  try {
    Logger.log(`🚀 Initiating resumable upload: ${fileName} (${fileSize} bytes)`);

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
      Logger.log(`✅ Resumable upload session created`);

      return {
        success: true,
        uploadUrl: uploadUrl
      };
    } else {
      Logger.log(`❌ Failed to initiate upload: ${response.getContentText()}`);
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
 * Complete resumable upload
 */
function completeResumableUploadResMgmt(uploadUrl, fileData, fileSize) {
  try {
    Logger.log(`📤 Completing resumable upload`);

    const token = ScriptApp.getOAuthToken();
    const binaryData = Utilities.base64Decode(fileData);

    const options = {
      method: 'put',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Length': binaryData.length.toString(),
        'Content-Range': `bytes 0-${binaryData.length - 1}/${fileSize}`
      },
      payload: binaryData,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(uploadUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      const fileMetadata = JSON.parse(response.getContentText());
      const file = DriveApp.getFileById(fileMetadata.id);

      // Make file accessible
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      Logger.log(`✅ Resumable upload complete: ${file.getUrl()}`);

      return {
        success: true,
        fileUrl: file.getUrl(),
        fileName: file.getName()
      };
    } else {
      Logger.log(`❌ Upload failed: ${response.getContentText()}`);
      return {
        success: false,
        error: `Upload failed: ${response.getContentText()}`
      };
    }

  } catch (error) {
    Logger.log(`❌ Error completing upload: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload file to Drive (auto-detect normal vs resumable)
 */
function uploadFileResMgmt(folder, fileName, fileData, mimeType) {
  try {
    const binaryData = Utilities.base64Decode(fileData);
    const fileSize = binaryData.length;

    Logger.log(`📊 File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    // Use resumable upload for files > 50MB
    if (fileSize > RESOURCES_CONFIG.NORMAL_UPLOAD_LIMIT) {
      Logger.log(`Using resumable upload`);

      const initResult = initiateResumableUploadResMgmt(
        folder.getId(),
        fileName,
        mimeType,
        fileSize
      );

      if (!initResult.success) {
        return initResult;
      }

      return completeResumableUploadResMgmt(
        initResult.uploadUrl,
        fileData,
        fileSize
      );
    }

    // Use normal upload for smaller files
    return uploadFileNormalResMgmt(folder, fileName, fileData, mimeType);

  } catch (error) {
    Logger.log(`❌ Error in uploadFileResMgmt: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== GET TERM DROPDOWNS ====================

/**
 * Get unique Batch, Term, Domain, Subject data from Term sheet
 * Also generates Session 1-100 dropdown
 * @returns {Object} {success, data: {batches, terms, domains, subjects, sessions, resourceTypes, resourceLevels}}
 */
function getTermDropdownsResMgmt() {
  try {
    Logger.log('📊 Getting Term sheet dropdown data...');

    const sheet = SpreadsheetApp.openById(RESOURCES_CONFIG.SHEET_ID)
      .getSheetByName(RESOURCES_CONFIG.TERM_SHEET);

    if (!sheet) {
      return {
        success: false,
        error: 'Term sheet not found'
      };
    }

    const data = sheet.getDataRange().getValues();

    // Skip header row
    const batches = new Set();
    const terms = new Set();
    const domains = new Set();
    const subjects = new Set();

    // Hierarchical structure
    const hierarchy = {
      batches: {},  // batch -> terms
      terms: {},    // batch|term -> domains
      domains: {}   // batch|term|domain -> subjects
    };

    // Process Term sheet data (columns: Batch, Term, Domain, Subject)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const batch = row[0] ? row[0].toString().trim() : '';
      const term = row[1] ? row[1].toString().trim() : '';
      const domain = row[2] ? row[2].toString().trim() : '';
      const subject = row[3] ? row[3].toString().trim() : '';

      if (batch) {
        batches.add(batch);

        if (term) {
          terms.add(term);

          // Add term to batch
          if (!hierarchy.batches[batch]) {
            hierarchy.batches[batch] = new Set();
          }
          hierarchy.batches[batch].add(term);

          if (domain) {
            domains.add(domain);

            // Add domain to term
            const termKey = `${batch}|${term}`;
            if (!hierarchy.terms[termKey]) {
              hierarchy.terms[termKey] = new Set();
            }
            hierarchy.terms[termKey].add(domain);

            if (subject) {
              subjects.add(subject);

              // Add subject to domain
              const domainKey = `${batch}|${term}|${domain}`;
              if (!hierarchy.domains[domainKey]) {
                hierarchy.domains[domainKey] = new Set();
              }
              hierarchy.domains[domainKey].add(subject);
            }
          }
        }
      }
    }

    // Generate Session 1-100
    const sessions = [];
    for (let i = 1; i <= 100; i++) {
      sessions.push(`Session ${i}`);
    }
    sessions.push('Other'); // Add "Other" option

    // Convert Sets to Arrays and add "Other" option
    const result = {
      batches: [...batches].sort(),
      terms: [...terms].sort(),
      domains: [...domains].sort(),
      subjects: [...subjects].sort(),
      sessions: sessions, // Session 1-100 + Other
      resourceTypes: RESOURCES_CONFIG.RESOURCE_TYPES, // Include resource types
      resourceLevels: RESOURCES_CONFIG.RESOURCE_LEVELS, // Include resource levels
      hierarchy: {
        batches: {},
        terms: {},
        domains: {}
      }
    };

    // Add "Other" option to all arrays
    result.batches.push('Other');
    result.terms.push('Other');
    result.domains.push('Other');
    result.subjects.push('Other');

    // Convert hierarchy Sets to Arrays
    for (const batch in hierarchy.batches) {
      result.hierarchy.batches[batch] = [...hierarchy.batches[batch]].sort();
      result.hierarchy.batches[batch].push('Other');
    }
    for (const term in hierarchy.terms) {
      result.hierarchy.terms[term] = [...hierarchy.terms[term]].sort();
      result.hierarchy.terms[term].push('Other');
    }
    for (const domain in hierarchy.domains) {
      result.hierarchy.domains[domain] = [...hierarchy.domains[domain]].sort();
      result.hierarchy.domains[domain].push('Other');
    }

    Logger.log(`✅ Found ${result.batches.length} batches, ${result.terms.length} terms, ${result.domains.length} domains, ${result.subjects.length} subjects`);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    Logger.log('❌ Error getting Term dropdowns: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== CRUD OPERATIONS ====================

/**
 * Create new resource
 */
function createResourceResMgmt(resourceData) {
  try {
    Logger.log('📝 Creating new resource...');

    const sheet = SpreadsheetApp.openById(RESOURCES_CONFIG.SHEET_ID)
      .getSheetByName(RESOURCES_CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, error: 'Resources Material sheet not found' };
    }

    // Generate ID
    const resourceId = generateResourceIdResMgmt();
    const timestamp = formatTimestampResMgmt();

    // Handle folder creation only if there are files
    let folderUrl = '';
    let fileCount = 0;

    if (resourceData.files && resourceData.files.length > 0) {
      const folderResult = createResourceFolderResMgmt({
        batch: resourceData.batch,
        level: resourceData.level,
        term: resourceData.term,
        domain: resourceData.domain,
        subject: resourceData.subject
      });

      if (!folderResult.success) {
        return { success: false, error: folderResult.error };
      }

      folderUrl = folderResult.folderUrl;
      fileCount = resourceData.files.length;
    }

    // Format URLs
    const urlsCell = formatURLsForStorageResMgmt(resourceData.urls || []);

    // Extract files array into individual file columns (up to 5 files)
    const files = resourceData.files || [];
    const file1Name = files[0] ? files[0].name : '';
    const file1Url = files[0] ? files[0].url : '';
    const file2Name = files[1] ? files[1].name : '';
    const file2Url = files[1] ? files[1].url : '';
    const file3Name = files[2] ? files[2].name : '';
    const file3Url = files[2] ? files[2].url : '';
    const file4Name = files[3] ? files[3].name : '';
    const file4Url = files[3] ? files[3].url : '';
    const file5Name = files[4] ? files[4].name : '';
    const file5Url = files[4] ? files[4].url : '';

    // Prepare row data (37 columns)
    const row = [
      resourceId,                                  // A - ID_RES
      resourceData.publish || 'No',                // B - Publish_RES
      resourceData.postedBy,                       // C - Posted By_RES
      timestamp,                                   // D - Created at_RES
      '',                                          // E - Edited at_RES
      '',                                          // F - Edited by_RES
      resourceData.startDateTime || timestamp,     // G - StartDateTime_RES
      resourceData.endDateTime || '',              // H - EndDateTime_RES
      resourceData.targetBatch || resourceData.batch, // I - Target Batch_RES
      resourceData.showOtherBatches || 'No',       // J - Show Other Batches_RES
      resourceData.title,                          // K - Title_RES
      resourceData.description || '',              // L - Description_RES
      resourceData.term || '',                     // M - Term_RES
      resourceData.domain || '',                   // N - Domain_RES
      resourceData.subject || '',                  // O - Subject_RES
      resourceData.sessionName || '',              // P - Session Name_RES
      resourceData.level,                          // Q - Level_RES
      resourceData.resourceType,                   // R - Resource Type_RES
      resourceData.resourceTypeCustom || '',       // S - Resource Type Custom_RES
      resourceData.priority || 'Medium',           // T - Priority_RES
      resourceData.learningObjectives || '',       // U - Learning Objectives_RES
      resourceData.prerequisites || '',            // V - Prerequisites_RES
      file1Name,                                   // W - File 1 Name_RES
      file1Url,                                    // X - File 1 URL_RES
      file2Name,                                   // Y - File 2 Name_RES
      file2Url,                                    // Z - File 2 URL_RES
      file3Name,                                   // AA - File 3 Name_RES
      file3Url,                                    // AB - File 3 URL_RES
      file4Name,                                   // AC - File 4 Name_RES
      file4Url,                                    // AD - File 4 URL_RES
      file5Name,                                   // AE - File 5 Name_RES
      file5Url,                                    // AF - File 5 URL_RES
      urlsCell,                                    // AG - URLs_RES
      folderUrl,                                   // AH - Drive Folder Link_RES
      fileCount,                                   // AI - File Count_RES
      'Published',                                 // AJ - Status_RES
      resourceData.notes || ''                     // AK - Notes_RES
    ];

    // Append to sheet
    sheet.appendRow(row);

    Logger.log(`✅ Resource created: ${resourceId}`);

    return {
      success: true,
      data: {
        id: resourceId,
        message: 'Resource created successfully',
        folderUrl: folderUrl
      }
    };

  } catch (error) {
    Logger.log('❌ Error creating resource: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all resources with optional filters
 */
function getResourcesResMgmt(filters) {
  try {
    Logger.log('📚 Getting resources...');

    const sheet = SpreadsheetApp.openById(RESOURCES_CONFIG.SHEET_ID)
      .getSheetByName(RESOURCES_CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, error: 'Resources Material sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const resources = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Apply filters
      if (filters) {
        if (filters.batch && row[8] !== filters.batch) continue;
        if (filters.term && row[12] !== filters.term) continue;
        if (filters.domain && row[13] !== filters.domain) continue;
        if (filters.subject && row[14] !== filters.subject) continue;
        if (filters.level && row[16] !== filters.level) continue;
        if (filters.resourceType && row[17] !== filters.resourceType) continue;
        if (filters.status && row[35] !== filters.status) continue;
      }

      // Parse URLs
      const urls = parseURLsResMgmt(row[32]);

      // Build files array
      const files = [];
      for (let j = 0; j < 5; j++) {
        const nameIdx = 22 + (j * 2);
        const urlIdx = 23 + (j * 2);
        if (row[nameIdx] || row[urlIdx]) {
          files.push({
            name: row[nameIdx],
            url: row[urlIdx]
          });
        }
      }

      // Build resource object
      const resource = {
        id: row[0],
        publish: row[1],
        postedBy: row[2],
        createdAt: row[3],
        editedAt: row[4],
        editedBy: row[5],
        startDateTime: row[6],
        endDateTime: row[7],
        targetBatch: row[8],
        showOtherBatches: row[9],
        title: row[10],
        description: row[11],
        term: row[12],
        domain: row[13],
        subject: row[14],
        sessionName: row[15],
        level: row[16],
        resourceType: row[17],
        resourceTypeCustom: row[18],
        priority: row[19],
        learningObjectives: row[20],
        prerequisites: row[21],
        files: files,
        urls: urls,
        driveFolderLink: row[33],
        fileCount: row[34],
        status: row[35],
        notes: row[36]
      };

      resources.push(resource);
    }

    Logger.log(`✅ Found ${resources.length} resources`);

    return {
      success: true,
      data: resources
    };

  } catch (error) {
    Logger.log('❌ Error getting resources: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing resource
 */
function updateResourceResMgmt(resourceId, resourceData) {
  try {
    Logger.log(`📝 Updating resource: ${resourceId}`);

    const sheet = SpreadsheetApp.openById(RESOURCES_CONFIG.SHEET_ID)
      .getSheetByName(RESOURCES_CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, error: 'Resources Material sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // Find resource row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === resourceId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Resource not found' };
    }

    const existingRow = data[rowIndex - 1];
    const timestamp = formatTimestampResMgmt();

    // Handle folder creation/update only if there are files
    let folderUrl = existingRow[33]; // Keep existing folder URL
    let fileCount = 0;

    if (resourceData.files && resourceData.files.length > 0) {
      // Only create new folder if it doesn't exist
      if (!folderUrl) {
        const folderResult = createResourceFolderResMgmt({
          batch: resourceData.batch || existingRow[8],
          level: resourceData.level || existingRow[16],
          term: resourceData.term || existingRow[12],
          domain: resourceData.domain || existingRow[13],
          subject: resourceData.subject || existingRow[14]
        });

        if (folderResult.success) {
          folderUrl = folderResult.folderUrl;
        }
      }
      fileCount = resourceData.files.length;
    }

    // Format URLs
    const urlsCell = formatURLsForStorageResMgmt(resourceData.urls || []);

    // Extract files array into individual file columns (up to 5 files)
    // If files are provided in the update, use them; otherwise keep existing
    const files = resourceData.files || [];
    const file1Name = files[0] ? files[0].name : (existingRow[22] || '');
    const file1Url = files[0] ? files[0].url : (existingRow[23] || '');
    const file2Name = files[1] ? files[1].name : (existingRow[24] || '');
    const file2Url = files[1] ? files[1].url : (existingRow[25] || '');
    const file3Name = files[2] ? files[2].name : (existingRow[26] || '');
    const file3Url = files[2] ? files[2].url : (existingRow[27] || '');
    const file4Name = files[3] ? files[3].name : (existingRow[28] || '');
    const file4Url = files[3] ? files[3].url : (existingRow[29] || '');
    const file5Name = files[4] ? files[4].name : (existingRow[30] || '');
    const file5Url = files[4] ? files[4].url : (existingRow[31] || '');

    // Update row
    const updatedRow = [
      existingRow[0],                                         // A - ID_RES (keep)
      resourceData.publish || existingRow[1],                 // B - Publish_RES
      existingRow[2],                                         // C - Posted By_RES (keep)
      existingRow[3],                                         // D - Created at_RES (keep)
      timestamp,                                              // E - Edited at_RES
      resourceData.editedBy || '',                            // F - Edited by_RES
      resourceData.startDateTime || existingRow[6],           // G - StartDateTime_RES
      resourceData.endDateTime || existingRow[7],             // H - EndDateTime_RES
      resourceData.targetBatch || existingRow[8],             // I - Target Batch_RES
      resourceData.showOtherBatches || existingRow[9],        // J - Show Other Batches_RES
      resourceData.title || existingRow[10],                  // K - Title_RES
      resourceData.description || existingRow[11],            // L - Description_RES
      resourceData.term || existingRow[12],                   // M - Term_RES
      resourceData.domain || existingRow[13],                 // N - Domain_RES
      resourceData.subject || existingRow[14],                // O - Subject_RES
      resourceData.sessionName || existingRow[15],            // P - Session Name_RES
      resourceData.level || existingRow[16],                  // Q - Level_RES
      resourceData.resourceType || existingRow[17],           // R - Resource Type_RES
      resourceData.resourceTypeCustom || existingRow[18],     // S - Resource Type Custom_RES
      resourceData.priority || existingRow[19],               // T - Priority_RES
      resourceData.learningObjectives || existingRow[20],     // U - Learning Objectives_RES
      resourceData.prerequisites || existingRow[21],          // V - Prerequisites_RES
      file1Name,                                              // W - File 1 Name_RES
      file1Url,                                               // X - File 1 URL_RES
      file2Name,                                              // Y - File 2 Name_RES
      file2Url,                                               // Z - File 2 URL_RES
      file3Name,                                              // AA - File 3 Name_RES
      file3Url,                                               // AB - File 3 URL_RES
      file4Name,                                              // AC - File 4 Name_RES
      file4Url,                                               // AD - File 4 URL_RES
      file5Name,                                              // AE - File 5 Name_RES
      file5Url,                                               // AF - File 5 URL_RES
      urlsCell,                                               // AG - URLs_RES
      folderUrl,                                              // AH - Drive Folder Link_RES
      fileCount,                                              // AI - File Count_RES
      resourceData.status || existingRow[35],                 // AJ - Status_RES
      resourceData.notes || existingRow[36]                   // AK - Notes_RES
    ];

    // Update sheet
    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    Logger.log(`✅ Resource updated: ${resourceId}`);

    return {
      success: true,
      data: {
        id: resourceId,
        message: 'Resource updated successfully'
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating resource: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete resource (soft delete - set status to Archived)
 */
function deleteResourceResMgmt(resourceId) {
  try {
    Logger.log(`🗑️ Deleting resource: ${resourceId}`);

    const sheet = SpreadsheetApp.openById(RESOURCES_CONFIG.SHEET_ID)
      .getSheetByName(RESOURCES_CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, error: 'Resources Material sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // Find resource row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === resourceId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Resource not found' };
    }

    // Soft delete - set status to Archived
    sheet.getRange(rowIndex, 36).setValue('Archived'); // Column AJ - Status_RES

    Logger.log(`✅ Resource archived: ${resourceId}`);

    return {
      success: true,
      data: {
        message: 'Resource deleted successfully'
      }
    };

  } catch (error) {
    Logger.log('❌ Error deleting resource: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== EXPORT FUNCTIONS ====================
// All functions are automatically available to Code.js since Apps Script combines files
