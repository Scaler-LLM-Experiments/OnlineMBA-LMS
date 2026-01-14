/**
 * SSB ASSIGNMENT MANAGEMENT SYSTEM - CRUD OPERATIONS
 *
 * This file contains all the assignment management functions:
 * - Create Assignment
 * - Update Assignment
 * - Get Assignments
 * - Delete Assignment
 * - Status Management
 * - File Upload
 * - Google Drive & Sheets Integration
 *
 * @author SSB Student Portal Team
 * @version 1.0.0
 */

// ==================== CREATE ASSIGNMENT ====================

/**
 * Create new assignment with Drive folders and submission sheet
 * @param {Object} assignmentData - Assignment details
 * @returns {Object} {success, data: {assignmentId, driveLink, sheetsLink}}
 */
function createAssignment(assignmentData) {
  try {
    Logger.log('📝 Creating new assignment...');

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);

    if (!sheet) {
      return { success: false, error: 'Assignment sheet not found' };
    }

    // Generate unique ID
    const assignmentId = generateAssignmentId();
    const timestamp = formatTimestamp();

    // Prepare Drive folder and submission sheet if CreateInDrive is Yes
    let driveLink = '';
    let fileUploadLink = '';
    let sheetsLink = '';
    let instructorFilesFolder = null;

    if (assignmentData.createInDrive === 'Yes') {
      const driveResult = createAssignmentDriveStructure(assignmentData, assignmentId);

      if (!driveResult.success) {
        return { success: false, error: driveResult.error };
      }

      driveLink = driveResult.folderUrl;
      fileUploadLink = driveResult.uploadFolderUrl;
      sheetsLink = driveResult.sheetUrl;
      instructorFilesFolder = driveResult.instructorFilesFolder;
    }

    // Handle instructor file uploads
    let instructorFilesUrls = [];
    if (assignmentData.uploadedFiles && assignmentData.uploadedFiles.length > 0) {
      if (!instructorFilesFolder) {
        return { success: false, error: 'Cannot upload files without Drive folder creation' };
      }

      Logger.log('📤 Uploading ' + assignmentData.uploadedFiles.length + ' instructor files...');

      for (let i = 0; i < assignmentData.uploadedFiles.length; i++) {
        const fileData = assignmentData.uploadedFiles[i];
        try {
          // Decode base64 and create file
          const base64Data = fileData.data.split(',')[1] || fileData.data;
          const bytes = Utilities.base64Decode(base64Data);
          const blob = Utilities.newBlob(bytes, fileData.mimeType, fileData.name);

          const file = instructorFilesFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

          instructorFilesUrls.push({
            name: fileData.name,
            url: file.getUrl()
          });

          Logger.log('✅ Uploaded: ' + fileData.name);
        } catch (fileError) {
          Logger.log('⚠️ Error uploading file ' + fileData.name + ': ' + fileError.message);
        }
      }
    }

    // Prepare questions array (Q1-Q20) - interleaved with mandatory flags
    const questionsInterleaved = [];

    for (let i = 1; i <= 20; i++) {
      questionsInterleaved.push(assignmentData['q' + i] || '');
      questionsInterleaved.push(assignmentData['q' + i + 'Mandatory'] || 'No');
    }

    // Prepare Assignment URLs (up to 5 name+url pairs)
    const assignmentURLsData = assignmentData.assignmentURLs || [];

    // Build row data matching sheet structure
    const row = [
      assignmentId,                                    // 0 - AssignmentID
      assignmentData.batch || '',                      // 1 - Batch
      assignmentData.term || '',                       // 2 - Term
      assignmentData.subject || '',                    // 3 - Subject
      assignmentData.publish || 'No',                  // 4 - Publish
      assignmentData.assignmentHeader || '',           // 5 - AssignmentHeader
      assignmentData.subHeader || '',                  // 6 - SubHeader
      assignmentData.assignmentDetails || '',          // 7 - AssignmentDetails (HTML from Quill)
      '',                                              // 8 - AssignmentLink (deprecated, kept for backward compatibility)
      assignmentData.startDateTime || timestamp,       // 9 - StartDateTime
      assignmentData.endDateTime || '',                // 10 - EndDateTime
      assignmentData.totalMarks || '',                 // 11 - TotalMarks
      assignmentData.folderName || assignmentId,       // 12 - FolderName
      assignmentData.createInDrive || 'No',            // 13 - CreateInDrive Yes or No
      timestamp,                                       // 14 - Created at
      ASSIGNMENT_CONFIG.STATUS.ACTIVE,                 // 15 - Status
      'No',                                            // 16 - Edited Yes/No
      '',                                              // 17 - Edited at
      '',                                              // 18 - Edited By
      driveLink,                                       // 19 - Drive Link
      fileUploadLink,                                  // 20 - Fileupload Link
      sheetsLink,                                      // 21 - SheetsLink
      assignmentData.groupAssignment || 'No',          // 22 - GroupAssignment
      assignmentData.attachmentMandatory || 'No',      // 23 - AttachmentMandatory
      assignmentData.urlMandatory || 'No',             // 24 - UrlMandatory
      assignmentData.fileTypes || '',                  // 25 - FileTypes
      ...questionsInterleaved,                         // 26-65 - Q1, Q1 Mandatory, Q2, Q2 Mandatory, ..., Q20, Q20 Mandatory
      JSON.stringify(instructorFilesUrls),             // 66 - InstructorFiles (JSON array)
      JSON.stringify(assignmentURLsData),              // 67 - AssignmentURLs (JSON array of {name, url} pairs)
      assignmentData.groupRatingRemarkEnabled || (assignmentData.groupAssignment === 'Yes' ? 'Yes' : 'No'), // 68 - GroupRatingRemarkEnabled (BQ column)
      assignmentData.maximumGroupMembers || ''         // 69 - MaximumGroupMembers (BR column)
    ];

    // Append to sheet
    sheet.appendRow(row);

    Logger.log('✅ Assignment created: ' + assignmentId);

    return {
      success: true,
      data: {
        assignmentId: assignmentId,
        driveLink: driveLink,
        fileUploadLink: fileUploadLink,
        sheetsLink: sheetsLink,
        message: 'Assignment created successfully'
      }
    };

  } catch (error) {
    Logger.log('❌ Error creating assignment: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== DRIVE & SHEETS INTEGRATION ====================

/**
 * Create Google Drive folder structure and submission sheet
 * Structure: Root > Batch > Assignments > Term > Subject >
 *   - File uploaded Folder
 *   - Response Sheet
 *   - Response file upload folder
 */
function createAssignmentDriveStructure(assignmentData, assignmentId) {
  try {
    Logger.log('📁 Creating Drive structure for: ' + assignmentId);

    // Get root folder
    const rootFolder = DriveApp.getFolderById(ASSIGNMENT_CONFIG.DRIVE_ROOT_ID);

    // Navigate/Create: Batch > Assignments > Term > Subject
    const batchFolder = findOrCreateFolder(rootFolder, assignmentData.batch);
    const assignmentsFolder = findOrCreateFolder(batchFolder, 'Assignments');
    const termFolder = findOrCreateFolder(assignmentsFolder, assignmentData.term);
    const subjectFolder = findOrCreateFolder(termFolder, assignmentData.subject);

    // Create folders inside Subject folder
    const fileUploadedFolder = findOrCreateFolder(subjectFolder, 'File uploaded Folder');
    fileUploadedFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const responseFileUploadFolder = findOrCreateFolder(subjectFolder, 'Response file upload folder');
    responseFileUploadFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

    // Create submission tracking sheet
    const sheetResult = createSubmissionSheet(assignmentData, assignmentId, subjectFolder);

    if (!sheetResult.success) {
      return sheetResult;
    }

    Logger.log('✅ Drive structure created successfully');

    return {
      success: true,
      folderUrl: subjectFolder.getUrl(),
      uploadFolderUrl: responseFileUploadFolder.getUrl(),
      sheetUrl: sheetResult.sheetUrl,
      instructorFilesFolder: fileUploadedFolder
    };

  } catch (error) {
    Logger.log('❌ Error creating Drive structure: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Find existing folder or create new one
 */
function findOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

/**
 * Update Response Sheet headers when assignment is edited
 * Only ADDS columns (never removes to preserve historical data)
 * Also creates Peer Ratings sub-sheet if group ratings are enabled
 */
function updateResponseSheetHeaders(sheetsLink, assignmentData, isGroupAssignment, groupRatingEnabled, maxGroupMembers) {
  try {
    Logger.log('🔄 Updating Response Sheet headers...');

    if (!sheetsLink) {
      Logger.log('⚠️ No sheets link - skipping header update');
      return { success: true, message: 'No Response Sheet to update' };
    }

    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    Logger.log('📋 Opening response spreadsheet with ID: ' + sheetId);
    Logger.log('📋 Spreadsheet URL: ' + sheetsLink);

    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0];

    Logger.log('📋 Response spreadsheet name: ' + ss.getName());
    Logger.log('📋 Number of sheets in spreadsheet: ' + ss.getSheets().length);
    Logger.log('📋 Sheet names: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));

    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Determine what columns to add
    const columnsToAdd = [];

    // Check if Submission ID needs to be added (after "Assignment Updated?")
    const submissionIdIndex = existingHeaders.indexOf('Submission ID');
    if (submissionIdIndex === -1) {
      // Insert Submission ID after "Assignment Updated?" (column 2)
      const assignmentUpdatedIndex = existingHeaders.indexOf('Assignment Updated?');
      if (assignmentUpdatedIndex !== -1) {
        existingHeaders.splice(assignmentUpdatedIndex + 1, 0, 'Submission ID');
        // Update the header row with Submission ID inserted
        sheet.insertColumnAfter(assignmentUpdatedIndex + 1);
        sheet.getRange(1, assignmentUpdatedIndex + 2).setValue('Submission ID');
        sheet.getRange(1, assignmentUpdatedIndex + 2).setBackground('#4CAF50').setFontColor('#FFFFFF').setFontWeight('bold');
        Logger.log('✅ Added Submission ID column after Assignment Updated?');
      }
    }

    // Check if Group Name needs to be added (after "Submission ID") - ONLY for group assignments
    if (isGroupAssignment) {
      const groupNameIndex = existingHeaders.indexOf('Group Name');
      if (groupNameIndex === -1) {
        const submissionIdIdx = existingHeaders.indexOf('Submission ID');
        if (submissionIdIdx !== -1) {
          existingHeaders.splice(submissionIdIdx + 1, 0, 'Group Name');
          sheet.insertColumnAfter(submissionIdIdx + 1);
          sheet.getRange(1, submissionIdIdx + 2).setValue('Group Name');
          sheet.getRange(1, submissionIdIdx + 2).setBackground('#4CAF50').setFontColor('#FFFFFF').setFontWeight('bold');
          Logger.log('✅ Added Group Name column after Submission ID');
        }
      }

      // Check if Group Members Emails needs to be added (after "Group Name") - ONLY for group assignments
      const groupMembersEmailsIndex = existingHeaders.indexOf('Group Members Emails');
      if (groupMembersEmailsIndex === -1) {
        const groupNameIdx = existingHeaders.indexOf('Group Name');
        if (groupNameIdx !== -1) {
          existingHeaders.splice(groupNameIdx + 1, 0, 'Group Members Emails');
          sheet.insertColumnAfter(groupNameIdx + 1);
          sheet.getRange(1, groupNameIdx + 2).setValue('Group Members Emails');
          sheet.getRange(1, groupNameIdx + 2).setBackground('#4CAF50').setFontColor('#FFFFFF').setFontWeight('bold');
          Logger.log('✅ Added Group Members Emails column after Group Name');
        }
      }

      // Check if Group Members column needs to be added (right after "Group Members Emails") - ONLY for group assignments
      const groupMembersIndex = existingHeaders.indexOf('Group Members');
      if (groupMembersIndex === -1) {
        const groupMembersEmailsIdx = existingHeaders.indexOf('Group Members Emails');
        if (groupMembersEmailsIdx !== -1) {
          existingHeaders.splice(groupMembersEmailsIdx + 1, 0, 'Group Members');
          sheet.insertColumnAfter(groupMembersEmailsIdx + 1);
          sheet.getRange(1, groupMembersEmailsIdx + 2).setValue('Group Members');
          sheet.getRange(1, groupMembersEmailsIdx + 2).setBackground('#4CAF50').setFontColor('#FFFFFF').setFontWeight('bold');
          Logger.log('✅ Added Group Members column after Group Members Emails');
        }
      }
    }

    // Check for new questions (Q1-Q20)
    for (let i = 1; i <= 20; i++) {
      const question = assignmentData['q' + i];
      if (question && question.trim() !== '') {
        // Check if this question already exists in headers
        if (!existingHeaders.includes(question)) {
          columnsToAdd.push(question);
        }
      }
    }

    // Add new columns to the end
    if (columnsToAdd.length > 0) {
      const currentLastCol = sheet.getLastColumn();
      const newHeaders = [...existingHeaders, ...columnsToAdd];

      // Update header row
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);

      // Format new header cells
      const newHeaderRange = sheet.getRange(1, currentLastCol + 1, 1, columnsToAdd.length);
      newHeaderRange.setBackground('#4CAF50');
      newHeaderRange.setFontColor('#FFFFFF');
      newHeaderRange.setFontWeight('bold');
      newHeaderRange.setWrap(true);

      Logger.log('✅ Added ' + columnsToAdd.length + ' new columns: ' + columnsToAdd.join(', '));
    } else {
      Logger.log('✅ No new columns needed');
    }

    // Create Peer Ratings sub-sheet if group ratings are enabled and sheet doesn't exist
    Logger.log('🔍 DEBUG - Peer Ratings check:');
    Logger.log('  - isGroupAssignment: ' + isGroupAssignment);
    Logger.log('  - groupRatingEnabled: ' + groupRatingEnabled);
    Logger.log('  - maxGroupMembers: ' + maxGroupMembers);
    Logger.log('  - Condition result: ' + (isGroupAssignment && groupRatingEnabled === 'Yes' && maxGroupMembers));

    let peerRatingDebug = {
      conditionMet: false,
      sheetCreated: false,
      sheetAlreadyExists: false,
      error: null
    };

    if (isGroupAssignment && groupRatingEnabled === 'Yes' && maxGroupMembers) {
      peerRatingDebug.conditionMet = true;
      const peerRatingsSheetName = 'Peer Ratings';
      let peerRatingsSheet = ss.getSheetByName(peerRatingsSheetName);

      Logger.log('  - Peer Ratings sheet exists: ' + (peerRatingsSheet !== null));

      if (!peerRatingsSheet) {
        try {
          Logger.log('📊 Creating Peer Ratings sub-sheet...');
          peerRatingsSheet = createPeerRatingsSheet(ss, parseInt(maxGroupMembers));
          Logger.log('✅ Peer Ratings sub-sheet created');
          peerRatingDebug.sheetCreated = true;
        } catch (e) {
          Logger.log('❌ Error creating Peer Ratings sheet: ' + e.message);
          peerRatingDebug.error = e.message;
        }
      } else {
        Logger.log('✅ Peer Ratings sub-sheet already exists');
        peerRatingDebug.sheetAlreadyExists = true;
      }
    }

    return {
      success: true,
      columnsAdded: columnsToAdd.length,
      peerRatingDebug: peerRatingDebug,
      spreadsheetId: sheetId,
      spreadsheetName: ss.getName(),
      sheetNames: ss.getSheets().map(function(s) { return s.getName(); })
    };

  } catch (error) {
    Logger.log('❌ Error updating Response Sheet headers: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create submission tracking Google Sheet with dynamic headers
 */
function createSubmissionSheet(assignmentData, assignmentId, folder) {
  try {
    Logger.log('📊 Creating submission sheet...');

    // New sheet naming format: Assignment [Title] + [Subtitle] + [Batch] + [End Date]
    const sheetName = 'Assignment ' +
                     (assignmentData.assignmentHeader || '') + ' ' +
                     (assignmentData.subHeader || '') + ' ' +
                     (assignmentData.batch || '') + ' ' +
                     (assignmentData.endDateTime || '');

    const ss = SpreadsheetApp.create(sheetName);
    const sheet = ss.getActiveSheet();

    // Move sheet to assignment folder
    const file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // Set sharing
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

    // Build headers array with FIXED structure
    const headers = [
      // Static base columns
      'Timestamp',
      'Assignment Updated?',
      'Submission ID',
      'Student Email',
      'Student Name'
    ];

    // DYNAMIC: Group-related columns (only if group assignment)
    if (assignmentData.groupAssignment === 'Yes') {
      headers.push('Group Name');
      headers.push('Group Members Emails');
      headers.push('Group Members');
    }

    // FIXED: File upload columns (20 columns - always present)
    for (let i = 1; i <= 10; i++) {
      headers.push('File Name ' + i);
      headers.push('File Url ' + i);
    }

    // FIXED: URL submission columns (10 columns - always present)
    for (let i = 1; i <= 5; i++) {
      headers.push('URL Name ' + i);
      headers.push('URL Link ' + i);
    }

    // DYNAMIC: Question columns (only questions that are defined)
    for (let i = 1; i <= 20; i++) {
      const question = assignmentData['q' + i];
      if (question && question.trim() !== '') {
        headers.push(question); // Use full question text as header
      }
    }

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4CAF50');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setWrap(true);

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('✅ Submission sheet created: ' + sheet.getName());

    // Create Peer Ratings sub-sheet if group ratings are enabled
    if (assignmentData.groupAssignment === 'Yes' && assignmentData.groupRatingRemarkEnabled === 'Yes' && assignmentData.maximumGroupMembers) {
      Logger.log('📊 Creating Peer Ratings sub-sheet...');
      const peerRatingsSheet = createPeerRatingsSheet(ss, parseInt(assignmentData.maximumGroupMembers));
      if (peerRatingsSheet) {
        Logger.log('✅ Peer Ratings sub-sheet created successfully');
      }
    }

    return {
      success: true,
      sheetUrl: ss.getUrl()
    };

  } catch (error) {
    Logger.log('❌ Error creating submission sheet: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create Peer Ratings sub-sheet within the Response Spreadsheet
 * @param {Spreadsheet} ss - The Response Spreadsheet object
 * @param {number} maxGroupMembers - Maximum number of group members
 * @returns {Sheet} The created Peer Ratings sheet
 */
function createPeerRatingsSheet(ss, maxGroupMembers) {
  try {
    const sheetName = 'Peer Ratings';

    // Check if sheet already exists
    let sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      Logger.log('⚠️ Peer Ratings sheet already exists');
      return sheet;
    }

    // Create new sheet
    sheet = ss.insertSheet(sheetName);

    // Build headers dynamically based on maxGroupMembers
    const headers = [
      'Timestamp',
      'Submission ID',
      'Student Email',
      'Student Name'
    ];

    // Add columns for each group member (Name, Rating, Remark)
    for (let i = 1; i <= maxGroupMembers; i++) {
      headers.push('Group Member ' + i);
      headers.push('Group Member ' + i + ' Rating');
      headers.push('Group Member ' + i + ' Remark');
    }

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#FF9800'); // Orange color to distinguish from main sheet
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setWrap(true);

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('✅ Peer Ratings sheet created with ' + maxGroupMembers + ' member slots');
    return sheet;

  } catch (error) {
    Logger.log('❌ Error creating Peer Ratings sheet: ' + error.message);
    return null;
  }
}

// ==================== GET ASSIGNMENTS ====================

/**
 * Get all assignments with optional filters
 * @param {Object} filters - {batch, term, subject, status, startDate, endDate}
 * @returns {Object} {success, data: assignments[]}
 */
function getAssignments(filters, studentEmail, isAdmin) {
  try {
    Logger.log('📚 Getting assignments for: ' + studentEmail + ' (isAdmin: ' + isAdmin + ')');

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);

    if (!sheet) {
      return { success: false, error: 'Assignment sheet not found' };
    }

    if (isAdmin) {
      Logger.log('🔑 Admin user detected - bypassing student filtering');
    }

    // Get student's role, batch and subjects from Group Members sheet
    let studentBatch = null;
    const studentSubjects = [];
    let studentFound = false;
    let studentRole = 'Student'; // Default to Student

    if (studentEmail) {
      const groupMembersSheet = ss.getSheetByName('Group Members');
      if (groupMembersSheet) {
        const groupMembersData = groupMembersSheet.getDataRange().getValues();
        const groupMembersHeaders = groupMembersData[0];
        const emailCol = groupMembersHeaders.indexOf('Student Email');
        const batchCol = groupMembersHeaders.indexOf('Batch');
        const roleCol = groupMembersHeaders.indexOf('Role');

        // Find all Subject columns (Subject 1 to Subject 100)
        const subjectCols = [];
        for (let i = 0; i < groupMembersHeaders.length; i++) {
          if (groupMembersHeaders[i] && groupMembersHeaders[i].toString().match(/^Subject \d+$/)) {
            subjectCols.push(i);
          }
        }

        // Find student's row
        for (let i = 1; i < groupMembersData.length; i++) {
          if (groupMembersData[i][emailCol] && groupMembersData[i][emailCol].toString().trim().toLowerCase() === studentEmail.toLowerCase()) {
            studentFound = true;
            studentBatch = groupMembersData[i][batchCol] ? groupMembersData[i][batchCol].toString().trim() : null;

            // Get Role
            if (roleCol !== -1 && groupMembersData[i][roleCol]) {
              studentRole = groupMembersData[i][roleCol].toString().trim();
            }

            // Get all subjects for this student
            for (let j = 0; j < subjectCols.length; j++) {
              const subjectValue = groupMembersData[i][subjectCols[j]];
              if (subjectValue && subjectValue.toString().trim() !== '') {
                studentSubjects.push(subjectValue.toString().trim());
              }
            }
            break;
          }
        }

        if (studentFound) {
          Logger.log('📋 Student found - Role: ' + studentRole + ', Batch: ' + studentBatch + ', Subjects: ' + studentSubjects.join(', '));
        } else {
          Logger.log('⚠️ Student not found in Group Members sheet');
        }
      }
    }

    // If Role is Admin, treat as admin (see all assignments)
    if (studentRole === 'Admin') {
      Logger.log('🔑 Admin role detected - user will see all assignments');
      isAdmin = true;
    }

    // If student not found in Group Members and not an admin, deny access
    if (!studentFound && !isAdmin) {
      return {
        success: false,
        error: 'Oops! Looks like you don\'t have access to the Assignment Platform yet. 🚧\n\nNo worries though! While we work on getting you set up, please drop a quick email to your Academic Administrator and they\'ll sort it out for you. 📧\n\nThanks for your patience! 🙏'
      };
    }

    const data = sheet.getDataRange().getValues();
    const assignments = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip filtering for admin users - they see all assignments
      if (!isAdmin) {
        // Filter by student's batch (row[1] is Batch column)
        if (studentBatch && row[1]) {
          if (row[1].toString().trim() !== studentBatch) {
            continue; // Skip assignments not for this student's batch
          }
        }

        // Filter by student's subjects (row[3] is Subject column)
        if (studentSubjects.length > 0 && row[3]) {
          const assignmentSubject = row[3].toString().trim();
          if (!studentSubjects.includes(assignmentSubject)) {
            continue; // Skip assignments for subjects student is not enrolled in
          }
        }
      }

      // Apply additional filters
      if (filters) {
        if (filters.batch && row[1] !== filters.batch) continue;
        if (filters.term && row[2] !== filters.term) continue;
        if (filters.subject && row[3] !== filters.subject) continue;
        if (filters.status && row[15] !== filters.status) continue;
        if (filters.publish && row[4] !== filters.publish) continue;
      }

      // Parse questions (interleaved structure: Q1 at 26, Q1 Mandatory at 27, Q2 at 28, etc.)
      const questions = [];
      const questionFields = {}; // For individual q1, q1Mandatory, etc.

      for (let q = 0; q < 20; q++) {
        const qIndex = 26 + (q * 2);        // Q1=26, Q2=28, Q3=30, etc.
        const qMandatoryIndex = 27 + (q * 2); // Q1 Mandatory=27, Q2 Mandatory=29, etc.
        const qNum = q + 1; // 1-based numbering

        if (row[qIndex]) {
          questions.push({
            question: row[qIndex],
            mandatory: row[qMandatoryIndex] || 'No'
          });

          // Add individual fields for frontend (q1, q1Mandatory, etc.)
          questionFields['q' + qNum] = row[qIndex];
          questionFields['q' + qNum + 'Mandatory'] = row[qMandatoryIndex] || 'No';
        }
      }

      // Parse instructor files
      let instructorFiles = [];
      try {
        if (row[66]) {
          instructorFiles = JSON.parse(row[66]);
        }
      } catch (e) {
        instructorFiles = [];
      }

      // Parse assignment URLs
      let assignmentURLs = [];
      try {
        if (row[67]) {
          assignmentURLs = JSON.parse(row[67]);
        }
      } catch (e) {
        assignmentURLs = [];
      }

      // Build assignment object
      const assignment = {
        assignmentId: row[0],
        batch: row[1],
        term: row[2],
        subject: row[3],
        publish: row[4],
        assignmentHeader: row[5],
        subHeader: row[6],
        assignmentDetails: row[7],
        startDateTime: row[9],
        endDateTime: row[10],
        totalMarks: row[11],
        folderName: row[12],
        createInDrive: row[13],
        createdAt: row[14],
        status: row[15],
        edited: row[16],
        editedAt: row[17],
        editedBy: row[18],
        driveLink: row[19],
        fileUploadLink: row[20],
        sheetsLink: row[21],
        groupAssignment: row[22],
        attachmentMandatory: row[23],
        urlMandatory: row[24],
        fileTypes: row[25],
        questions: questions,
        instructorFiles: instructorFiles,
        assignmentURLs: assignmentURLs,
        groupRatingRemarkEnabled: row[68] || 'No',
        maximumGroupMembers: row[69] || '',
        ...questionFields // Spread individual q1, q1Mandatory, q2, q2Mandatory, etc.
      };

      assignments.push(assignment);
    }

    Logger.log('✅ Found ' + assignments.length + ' assignments');

    return {
      success: true,
      data: assignments
    };

  } catch (error) {
    Logger.log('❌ Error getting assignments: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== UPDATE ASSIGNMENT ====================

/**
 * Update existing assignment
 * @param {String} assignmentId - Assignment ID
 * @param {Object} assignmentData - Updated data
 * @returns {Object} {success, data}
 */
function updateAssignment(assignmentId, assignmentData) {
  try {
    Logger.log('📝 Updating assignment: ' + assignmentId);
    Logger.log('🔍 DEBUG - assignmentData received:');
    Logger.log('  - groupAssignment: ' + assignmentData.groupAssignment);
    Logger.log('  - groupRatingRemarkEnabled: ' + assignmentData.groupRatingRemarkEnabled);
    Logger.log('  - maximumGroupMembers: ' + assignmentData.maximumGroupMembers);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);

    if (!sheet) {
      return { success: false, error: 'Assignment sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // Find assignment row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Assignment not found' };
    }

    const existingRow = data[rowIndex - 1];
    const timestamp = formatTimestamp();

    // Handle instructor file uploads if provided
    let instructorFilesUrls = [];

    // Parse existing instructor files
    try {
      if (existingRow[66]) {
        instructorFilesUrls = JSON.parse(existingRow[66]);
      }
    } catch (e) {
      instructorFilesUrls = [];
    }

    if (assignmentData.uploadedFiles && assignmentData.uploadedFiles.length > 0) {
      // Get the instructor files folder from Drive link
      if (existingRow[19]) { // Drive Link exists
        try {
          const folderId = extractFolderIdFromUrl(existingRow[19]);
          const subjectFolder = DriveApp.getFolderById(folderId);
          const fileUploadedFolder = findOrCreateFolder(subjectFolder, 'File uploaded Folder');

          Logger.log('📤 Uploading ' + assignmentData.uploadedFiles.length + ' instructor files...');

          for (let i = 0; i < assignmentData.uploadedFiles.length; i++) {
            const fileData = assignmentData.uploadedFiles[i];
            try {
              // Decode base64 and create file
              const base64Data = fileData.data.split(',')[1] || fileData.data;
              const bytes = Utilities.base64Decode(base64Data);
              const blob = Utilities.newBlob(bytes, fileData.mimeType, fileData.name);

              const file = fileUploadedFolder.createFile(blob);
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

              instructorFilesUrls.push({
                name: fileData.name,
                url: file.getUrl()
              });

              Logger.log('✅ Uploaded: ' + fileData.name);
            } catch (fileError) {
              Logger.log('⚠️ Error uploading file ' + fileData.name + ': ' + fileError.message);
            }
          }
        } catch (driveError) {
          Logger.log('⚠️ Error accessing Drive folder: ' + driveError.message);
        }
      }
    }

    // Prepare questions (interleaved structure)
    const questionsInterleaved = [];

    for (let i = 1; i <= 20; i++) {
      const qIndex = 26 + ((i - 1) * 2);        // Q1=26, Q2=28, Q3=30, etc.
      const qMandatoryIndex = 27 + ((i - 1) * 2); // Q1 Mandatory=27, Q2 Mandatory=29, etc.

      questionsInterleaved.push(assignmentData['q' + i] || existingRow[qIndex] || '');
      questionsInterleaved.push(assignmentData['q' + i + 'Mandatory'] || existingRow[qMandatoryIndex] || 'No');
    }

    // Prepare Assignment URLs
    const assignmentURLsData = assignmentData.assignmentURLs || (existingRow[67] ? JSON.parse(existingRow[67]) : []);

    // Build updated row (preserve Drive links - cannot be changed after creation)
    const updatedRow = [
      existingRow[0],                                         // 0 - AssignmentID (keep)
      assignmentData.batch || existingRow[1],                 // 1 - Batch
      assignmentData.term || existingRow[2],                  // 2 - Term
      assignmentData.subject || existingRow[3],               // 3 - Subject
      assignmentData.publish || existingRow[4],               // 4 - Publish
      assignmentData.assignmentHeader || existingRow[5],      // 5 - AssignmentHeader
      assignmentData.subHeader || existingRow[6],             // 6 - SubHeader
      assignmentData.assignmentDetails || existingRow[7],     // 7 - AssignmentDetails
      '',                                                     // 8 - AssignmentLink (deprecated, kept for backward compatibility)
      assignmentData.startDateTime || existingRow[9],         // 9 - StartDateTime
      assignmentData.endDateTime || existingRow[10],          // 10 - EndDateTime
      assignmentData.totalMarks || existingRow[11],           // 11 - TotalMarks
      assignmentData.folderName || existingRow[12],           // 12 - FolderName
      existingRow[13],                                        // 13 - CreateInDrive (keep)
      existingRow[14],                                        // 14 - Created at (keep)
      assignmentData.status || existingRow[15],               // 15 - Status
      'Yes',                                                  // 16 - Edited Yes/No
      timestamp,                                              // 17 - Edited at
      assignmentData.editedBy || '',                          // 18 - Edited By
      existingRow[19],                                        // 19 - Drive Link (keep)
      existingRow[20],                                        // 20 - Fileupload Link (keep)
      existingRow[21],                                        // 21 - SheetsLink (keep)
      assignmentData.groupAssignment || existingRow[22],      // 22 - GroupAssignment
      assignmentData.attachmentMandatory || existingRow[23],  // 23 - AttachmentMandatory
      assignmentData.urlMandatory || existingRow[24],         // 24 - UrlMandatory
      assignmentData.fileTypes || existingRow[25],            // 25 - FileTypes
      ...questionsInterleaved,                                // 26-65 - Q1, Q1 Mandatory, Q2, Q2 Mandatory, ..., Q20, Q20 Mandatory
      JSON.stringify(instructorFilesUrls),                    // 66 - InstructorFiles (JSON array)
      JSON.stringify(assignmentURLsData),                     // 67 - AssignmentURLs (JSON array of {name, url} pairs)
      assignmentData.groupRatingRemarkEnabled !== undefined ? assignmentData.groupRatingRemarkEnabled : (existingRow[68] || (assignmentData.groupAssignment === 'Yes' ? 'Yes' : 'No')), // 68 - GroupRatingRemarkEnabled (BQ column)
      assignmentData.maximumGroupMembers !== undefined ? assignmentData.maximumGroupMembers : (existingRow[69] || '') // 69 - MaximumGroupMembers (BR column)
    ];

    Logger.log('🔍 DEBUG - updatedRow array length: ' + updatedRow.length);
    Logger.log('🔍 DEBUG - updatedRow[22] (GroupAssignment): ' + updatedRow[22]);
    Logger.log('🔍 DEBUG - updatedRow[68] (GroupRatingEnabled): ' + updatedRow[68]);
    Logger.log('🔍 DEBUG - updatedRow[69] (MaxGroupMembers): ' + updatedRow[69]);

    // Update sheet
    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    // Update Response Sheet headers if structure changed
    if (existingRow[21]) { // If sheets link exists
      Logger.log('🔍 DEBUG - updateResponseSheetHeaders parameters:');
      Logger.log('  - sheetsLink: ' + existingRow[21]);
      Logger.log('  - isGroupAssignment (updatedRow[22]): ' + updatedRow[22] + ' => ' + (updatedRow[22] === 'Yes'));
      Logger.log('  - groupRatingEnabled (updatedRow[68]): ' + updatedRow[68] + ' => ' + (updatedRow[68] === 'Yes'));
      Logger.log('  - maxGroupMembers (updatedRow[69]): ' + updatedRow[69]);

      const updateHeadersResult = updateResponseSheetHeaders(existingRow[21], assignmentData, updatedRow[22] === 'Yes', updatedRow[68], updatedRow[69]);
      if (!updateHeadersResult.success) {
        Logger.log('⚠️ Failed to update Response Sheet headers: ' + updateHeadersResult.error);
        // Non-critical error - continue with success
      }

      // Return debug info
      Logger.log('✅ Assignment updated: ' + assignmentId);

      return {
        success: true,
        data: {
          assignmentId: assignmentId,
          message: 'Assignment updated successfully'
        },
        debug: {
          updatedRowLength: updatedRow.length,
          groupAssignment: updatedRow[22],
          groupRatingEnabled: updatedRow[68],
          maxGroupMembers: updatedRow[69],
          sheetsLink: existingRow[21],
          updateHeadersResult: updateHeadersResult
        }
      };
    }

    Logger.log('✅ Assignment updated: ' + assignmentId);

    return {
      success: true,
      data: {
        assignmentId: assignmentId,
        message: 'Assignment updated successfully'
      }
    };

  } catch (error) {
    Logger.log('❌ Error updating assignment: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== DELETE & STATUS MANAGEMENT ====================

/**
 * Delete assignment (soft delete - mark as Deleted)
 */
function deleteAssignment(assignmentId) {
  try {
    Logger.log('🗑️ Deleting assignment: ' + assignmentId);
    return changeAssignmentStatus(assignmentId, ASSIGNMENT_CONFIG.STATUS.DELETED);
  } catch (error) {
    Logger.log('❌ Error deleting assignment: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Change assignment status
 */
function changeAssignmentStatus(assignmentId, status) {
  try {
    Logger.log('🔄 Changing status for ' + assignmentId + ' to: ' + status);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);

    if (!sheet) {
      return { success: false, error: 'Assignment sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // Find assignment row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Assignment not found' };
    }

    // Update status (Column P = 16)
    sheet.getRange(rowIndex, 16).setValue(status);

    Logger.log('✅ Status changed successfully');

    return {
      success: true,
      data: {
        message: 'Status changed to ' + status
      }
    };

  } catch (error) {
    Logger.log('❌ Error changing status: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== DROPDOWN DATA ====================

/**
 * Get dropdown data for assignment form
 * Returns batches, terms from Subject Term sheet
 */
function getAssignmentDropdowns() {
  try {
    Logger.log('📊 Getting assignment dropdowns...');

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.SUBJECT_TERM_SHEET);

    if (!sheet) {
      return { success: false, error: 'Subject Term sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    const batches = new Set();
    const terms = new Set();
    const hierarchy = {}; // batch -> terms -> domains -> subjects

    // Process data (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const batch = row[0] ? row[0].toString().trim() : '';
      const term = row[1] ? row[1].toString().trim() : '';
      const domain = row[2] ? row[2].toString().trim() : '';
      const subject = row[3] ? row[3].toString().trim() : '';

      if (batch) {
        batches.add(batch);

        if (!hierarchy[batch]) {
          hierarchy[batch] = {};
        }

        if (term) {
          terms.add(term);

          if (!hierarchy[batch][term]) {
            hierarchy[batch][term] = {};
          }

          if (domain) {
            if (!hierarchy[batch][term][domain]) {
              hierarchy[batch][term][domain] = [];
            }

            if (subject) {
              hierarchy[batch][term][domain].push(subject);
            }
          }
        }
      }
    }

    Logger.log('✅ Dropdowns loaded successfully');

    return {
      success: true,
      data: {
        batches: [...batches].sort(),
        terms: [...terms].sort(),
        hierarchy: hierarchy,
        fileTypes: ASSIGNMENT_CONFIG.ALLOWED_FILE_TYPES
      }
    };

  } catch (error) {
    Logger.log('❌ Error getting dropdowns: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get subjects by batch and term
 */
function getSubjectsByBatchAndTerm(batch, term) {
  try {
    Logger.log('📚 Getting subjects for: ' + batch + ' / ' + term);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.SUBJECT_TERM_SHEET);

    if (!sheet) {
      return { success: false, error: 'Subject Term sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const subjects = new Set();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // row[0] = Batch, row[1] = Term, row[2] = Domain, row[3] = SubjectName
      if (row[0] === batch && row[1] === term && row[3]) {
        subjects.add(row[3].toString().trim());
      }
    }

    return {
      success: true,
      data: [...subjects].sort()
    };

  } catch (error) {
    Logger.log('❌ Error getting subjects: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FILE UPLOAD ====================

/**
 * Upload instructor file to assignment folder
 */
function uploadAssignmentFile(fileData, fileName, mimeType, assignmentId) {
  try {
    Logger.log('📤 Uploading file for assignment: ' + assignmentId);

    // Get assignment to find Drive folder
    const assignmentResult = getAssignments({ assignmentId: assignmentId });

    if (!assignmentResult.success || assignmentResult.data.length === 0) {
      return { success: false, error: 'Assignment not found' };
    }

    const assignment = assignmentResult.data[0];

    if (!assignment.driveLink) {
      return { success: false, error: 'No Drive folder for this assignment' };
    }

    // Extract folder ID from URL
    const folderId = extractFolderIdFromUrl(assignment.driveLink);
    const folder = DriveApp.getFolderById(folderId);

    // Decode base64 and create file
    const base64Data = fileData.split(',')[1] || fileData;
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log('✅ File uploaded: ' + file.getUrl());

    return {
      success: true,
      data: {
        fileUrl: file.getUrl(),
        fileName: file.getName()
      }
    };

  } catch (error) {
    Logger.log('❌ Error uploading file: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract folder ID from Drive URL
 */
function extractFolderIdFromUrl(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

// ==================== STUDENT SUBMISSION FUNCTIONS ====================

/**
 * Check if a student has submitted an assignment
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentEmail - Student email
 * @returns {Object} {success, data: {hasSubmitted, submissionCount, lastSubmission}}
 */
function checkSubmissionStatus(assignmentId, studentEmail) {
  try {
    Logger.log('🔍 Checking submission status for ' + studentEmail + ' on assignment ' + assignmentId);

    // Get assignment details to find response sheet
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    // Find the assignment
    let assignmentRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        assignmentRow = data[i];
        break;
      }
    }

    if (!assignmentRow) {
      return { success: false, error: 'Assignment not found' };
    }

    const sheetsLink = assignmentRow[21]; // SheetsLink column

    if (!sheetsLink) {
      return {
        success: true,
        data: {
          hasSubmitted: false,
          submissionCount: 0,
          lastSubmission: null
        }
      };
    }

    // Extract sheet ID from URL
    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    // Open response sheet
    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const responseSheet = responseSpreadsheet.getSheets()[0];

    // Update Response Sheet headers to add new columns if they don't exist (backward compatibility)
    updateResponseSheetHeaders(sheetsLink, assignmentRow, assignmentRow[22] === 'Yes', assignmentRow[68] === 'Yes', assignmentRow[69]);

    const responseData = responseSheet.getDataRange().getValues();

    // Get header row to find column indices
    const headerRow = responseData[0];
    const studentEmailColIndex = headerRow.indexOf('Student Email');
    const studentNameColIndex = headerRow.indexOf('Student Name');
    const groupMembersColIndex = headerRow.indexOf('Group Members');
    const groupMembersEmailsColIndex = headerRow.indexOf('Group Members Emails');
    const groupNameColIndex = headerRow.indexOf('Group Name');
    const submissionIdColIndex = headerRow.indexOf('Submission ID');

    Logger.log('🔍 Column Indices - Student Email: ' + studentEmailColIndex + ', Student Name: ' + studentNameColIndex + ', Group Members Emails: ' + groupMembersEmailsColIndex + ', Submission ID: ' + submissionIdColIndex);
    Logger.log('🔍 Header Row: ' + JSON.stringify(headerRow));

    if (studentEmailColIndex === -1) {
      return { success: false, error: 'Student Email column not found in Response Sheet' };
    }

    // Get student name for group member check
    let studentName = '';
    try {
      const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
      const groupMembersSheet = ss.getSheetByName('Group Members');
      if (groupMembersSheet) {
        const data = groupMembersSheet.getDataRange().getValues();
        const headers = data[0];
        const emailCol = headers.indexOf('Student Email');
        const nameCol = headers.indexOf('Full Name');

        if (emailCol !== -1 && nameCol !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (data[i][emailCol] === studentEmail) {
              studentName = data[i][nameCol];
              break;
            }
          }
        }
      }
    } catch (e) {
      Logger.log('⚠️ Could not fetch student name: ' + e.message);
    }

    // Find submissions by this student
    // Check: Student Email matches OR student name appears in Group Members
    const submissions = [];
    for (let i = 1; i < responseData.length; i++) {
      const row = responseData[i];
      let isMatch = false;

      // Check if student email matches (submitter)
      if (row[studentEmailColIndex] === studentEmail) {
        isMatch = true;
      }

      // Check if student email appears in Group Members Emails (for group assignments)
      if (!isMatch && groupMembersEmailsColIndex !== -1) {
        const groupMembersEmails = row[groupMembersEmailsColIndex] || '';
        // Group Members Emails format: "email1@example.com, email2@example.com"
        const memberEmails = groupMembersEmails.split(',').map(email => email.trim().toLowerCase());
        if (memberEmails.includes(studentEmail.toLowerCase())) {
          isMatch = true;
        }
      }

      // Fallback: Check if student name appears in Group Members (for backward compatibility with old submissions)
      if (!isMatch && groupMembersColIndex !== -1 && studentName) {
        const groupMembers = row[groupMembersColIndex] || '';
        // Group Members format: "Full Name 1, Full Name 2, Full Name 3"
        const memberNames = groupMembers.split(',').map(name => name.trim());
        if (memberNames.includes(studentName)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        const submission = {
          timestamp: row[0],
          responseUpdated: row[1],
          submissionId: submissionIdColIndex !== -1 ? row[submissionIdColIndex] : null,
          submitterEmail: studentEmailColIndex !== -1 ? row[studentEmailColIndex] : null,
          submitterName: studentNameColIndex !== -1 ? row[studentNameColIndex] : null,
          rowIndex: i + 1,
          rowData: row
        };
        Logger.log('✅ Found matching submission at row ' + (i + 1) + ': submissionId=' + submission.submissionId + ', submitterEmail=' + submission.submitterEmail + ', submitterName=' + submission.submitterName);
        submissions.push(submission);
      }
    }

    if (submissions.length === 0) {
      return {
        success: true,
        data: {
          hasSubmitted: false,
          submissionCount: 0,
          lastSubmission: null
        }
      };
    }

    // Get the last submission
    const lastSubmission = submissions[submissions.length - 1];

    return {
      success: true,
      data: {
        hasSubmitted: true,
        submissionCount: submissions.length,
        lastSubmission: lastSubmission,
        allSubmissions: submissions,
        // DEBUG INFO
        _debug: {
          headerRow: headerRow,
          columnIndices: {
            studentEmail: studentEmailColIndex,
            studentName: studentNameColIndex,
            groupMembersEmails: groupMembersEmailsColIndex,
            submissionId: submissionIdColIndex
          },
          lastSubmissionData: {
            submissionId: lastSubmission.submissionId,
            submitterEmail: lastSubmission.submitterEmail,
            submitterName: lastSubmission.submitterName,
            rowIndex: lastSubmission.rowIndex
          }
        }
      }
    };

  } catch (error) {
    Logger.log('❌ Error checking submission status: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Submit assignment - upload files and write to response sheet
 * @param {Object} submissionData - Contains assignmentId, studentEmail, answers, files, groupName, etc.
 * @returns {Object} {success, data: {submissionId, fileUrls}}
 */
function submitAssignment(submissionData) {
  try {
    Logger.log('📤 Submitting assignment: ' + submissionData.assignmentId);

    const assignmentId = submissionData.assignmentId;
    const studentEmail = submissionData.studentEmail;
    const studentName = submissionData.studentName;
    const answers = submissionData.answers || {};
    const files = submissionData.files || []; // Small files with base64 data
    const uploadedFileUrls = submissionData.uploadedFileUrls || []; // Large files already uploaded to Drive
    const groupName = submissionData.groupName || '';
    const groupMemberEmails = submissionData.groupMembers || [];

    Logger.log('📊 Submission breakdown: ' + files.length + ' small files (base64), ' + uploadedFileUrls.length + ' large files (pre-uploaded)');

    // Convert group member emails to full names
    const groupMembers = [];
    if (groupMemberEmails.length > 0) {
      const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
      const groupMembersSheet = ss.getSheetByName('Group Members');
      if (groupMembersSheet) {
        const data = groupMembersSheet.getDataRange().getValues();
        const headers = data[0];
        const emailCol = headers.indexOf('Student Email');
        const nameCol = headers.indexOf('Full Name');

        if (emailCol !== -1 && nameCol !== -1) {
          for (let email of groupMemberEmails) {
            for (let i = 1; i < data.length; i++) {
              if (data[i][emailCol] && data[i][emailCol].toString().trim().toLowerCase() === email.toLowerCase()) {
                if (data[i][nameCol]) {
                  groupMembers.push(data[i][nameCol].toString().trim());
                }
                break;
              }
            }
          }
        }
      }
    }

    // Get assignment details
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    let assignmentRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        assignmentRow = data[i];
        break;
      }
    }

    if (!assignmentRow) {
      return { success: false, error: 'Assignment not found' };
    }

    const fileUploadLink = assignmentRow[20]; // File Upload Link
    const sheetsLink = assignmentRow[21]; // Sheets Link

    // Upload files to Drive - ALL files must upload successfully
    const uploadedFiles = [];
    const failedFiles = [];

    if (files.length > 0 && fileUploadLink) {
      const folderId = extractFolderIdFromUrl(fileUploadLink);
      if (folderId) {
        const responseFolder = DriveApp.getFolderById(folderId);

        // Create or get student folder inside Response file upload folder
        let studentFolder;
        const studentFolderName = studentName; // Use student's full name as folder name

        // Check if student folder already exists
        const existingFolders = responseFolder.getFoldersByName(studentFolderName);
        if (existingFolders.hasNext()) {
          studentFolder = existingFolders.next();
          Logger.log('📁 Using existing student folder: ' + studentFolderName);
        } else {
          // Create new student folder
          studentFolder = responseFolder.createFolder(studentFolderName);
          Logger.log('📁 Created new student folder: ' + studentFolderName);
        }

        Logger.log('📤 Uploading ' + files.length + ' file(s) to ' + studentFolderName + ' folder...');

        for (let i = 0; i < files.length; i++) {
          const fileData = files[i];
          try {
            const base64Data = fileData.data.split(',')[1] || fileData.data;
            const bytes = Utilities.base64Decode(base64Data);
            const blob = Utilities.newBlob(bytes, fileData.mimeType, fileData.name);

            // Upload file to student's folder
            const file = studentFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

            uploadedFiles.push({
              name: fileData.displayName || fileData.name, // Use custom name if provided
              url: file.getUrl()
            });

            Logger.log('✅ File ' + (i + 1) + '/' + files.length + ' uploaded to ' + studentFolderName + ': ' + fileData.name);
          } catch (fileError) {
            Logger.log('❌ Error uploading file ' + fileData.name + ': ' + fileError.message);
            failedFiles.push({
              name: fileData.name,
              error: fileError.message
            });
          }
        }
      }
    }

    // Verify ALL files uploaded successfully before proceeding
    if (failedFiles.length > 0) {
      const failedFileNames = failedFiles.map(f => f.name + ' (' + f.error + ')').join(', ');
      Logger.log('❌ File upload failed. Aborting submission.');
      return {
        success: false,
        error: 'Failed to upload ' + failedFiles.length + ' file(s): ' + failedFileNames + '. Please try again.'
      };
    }

    // Verify file count matches (all files uploaded)
    if (files.length > 0 && uploadedFiles.length !== files.length) {
      Logger.log('❌ File count mismatch. Expected: ' + files.length + ', Uploaded: ' + uploadedFiles.length);
      return {
        success: false,
        error: 'File upload verification failed. Expected ' + files.length + ' files but only ' + uploadedFiles.length + ' uploaded successfully.'
      };
    }

    Logger.log('✅ All ' + uploadedFiles.length + ' small file(s) uploaded successfully.');

    // Add pre-uploaded large files to the uploadedFiles array
    if (uploadedFileUrls.length > 0) {
      Logger.log('📎 Adding ' + uploadedFileUrls.length + ' pre-uploaded large file(s)');
      for (let i = 0; i < uploadedFileUrls.length; i++) {
        uploadedFiles.push({
          name: uploadedFileUrls[i].name || uploadedFileUrls[i].fileName,
          url: uploadedFileUrls[i].url || uploadedFileUrls[i].fileUrl,
          id: uploadedFileUrls[i].fileId || uploadedFileUrls[i].id,
          mimeType: uploadedFileUrls[i].mimeType || ''
        });
      }
    }

    Logger.log('✅ Total files for submission: ' + uploadedFiles.length + ' (small + large). Proceeding to save submission...');

    // Check if this is an update (student has already submitted) BEFORE building the row
    const existingSubmissionCheck = checkSubmissionStatus(assignmentId, studentEmail);
    const isUpdate = existingSubmissionCheck.success && existingSubmissionCheck.data.hasSubmitted;

    // Write to response sheet
    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const responseSheet = responseSpreadsheet.getSheets()[0];

    // Update Response Sheet headers to add new columns if they don't exist (backward compatibility)
    updateResponseSheetHeaders(sheetsLink, assignmentRow, assignmentRow[22] === 'Yes', assignmentRow[68] === 'Yes', assignmentRow[69]);

    const headerRow = responseSheet.getRange(1, 1, 1, responseSheet.getLastColumn()).getValues()[0];

    // Prepare row data
    const timestamp = new Date();

    // CRITICAL FIX: For group assignments, reuse the same submission ID across all group members
    // This ensures peer ratings are consistently mapped to the group's submission
    let submissionId;
    if (isUpdate && existingSubmissionCheck.data.lastSubmission && existingSubmissionCheck.data.lastSubmission.submissionId) {
      // Reuse existing submission ID for updates
      submissionId = existingSubmissionCheck.data.lastSubmission.submissionId;
      Logger.log('🔄 Reusing existing submission ID for update: ' + submissionId);
    } else {
      // Generate new submission ID only for first-time submissions
      submissionId = assignmentId + '_' + studentEmail + '_' + timestamp.getTime();
      Logger.log('🆕 Generated new submission ID: ' + submissionId);
    }
    const rowData = [];

    for (let col = 0; col < headerRow.length; col++) {
      const header = headerRow[col];

      if (header === 'Timestamp') {
        rowData.push(timestamp);
      } else if (header === 'Assignment Updated?') {
        // Check if this is a resubmission
        rowData.push(isUpdate ? 'Yes' : 'No');
      } else if (header === 'Submission ID') {
        rowData.push(submissionId);
      } else if (header === 'Group Name') {
        rowData.push(groupName || '');
      } else if (header === 'Group Members Emails') {
        // Store emails as: "email1@example.com, email2@example.com"
        rowData.push(groupMemberEmails.length > 0 ? groupMemberEmails.join(', ') : '');
      } else if (header === 'Student Email') {
        rowData.push(studentEmail);
      } else if (header === 'Student Name') {
        rowData.push(studentName);
      } else if (header === 'Group Members') {
        // Store full names as: "Full Name 1, Full Name 2, Full Name 3"
        rowData.push(groupMembers.length > 0 ? groupMembers.join(', ') : '');
      } else if (header.startsWith('File Name ')) {
        const fileIndex = parseInt(header.replace('File Name ', '')) - 1;
        rowData.push(uploadedFiles[fileIndex] ? uploadedFiles[fileIndex].name : '');
      } else if (header.startsWith('File Url ')) {
        const fileIndex = parseInt(header.replace('File Url ', '')) - 1;
        rowData.push(uploadedFiles[fileIndex] ? uploadedFiles[fileIndex].url : '');
      } else if (header.startsWith('URL Name ')) {
        const urlIndex = parseInt(header.replace('URL Name ', '')) - 1;
        const urls = submissionData.urls || [];
        rowData.push(urls[urlIndex] ? urls[urlIndex].name : '');
      } else if (header.startsWith('URL Link ')) {
        const urlIndex = parseInt(header.replace('URL Link ', '')) - 1;
        const urls = submissionData.urls || [];
        rowData.push(urls[urlIndex] ? urls[urlIndex].link : '');
      } else {
        // Check if it's a question
        const questionMatch = Object.keys(answers).find(key => {
          const questionText = assignmentRow[26 + (parseInt(key.replace('q', '')) - 1) * 2];
          return questionText === header;
        });

        if (questionMatch) {
          rowData.push(answers[questionMatch] || '');
        } else {
          rowData.push('');
        }
      }
    }

    // ALWAYS append a new row (never update) to maintain submission history
    responseSheet.appendRow(rowData);
    if (isUpdate) {
      Logger.log('✅ Resubmission appended (Assignment Updated? = Yes)');
    } else {
      Logger.log('✅ New submission appended (Assignment Updated? = No)');
    }

    // DUAL-WRITE: Sync to Master Sheet
    try {
      Logger.log('🔄 Syncing to Master Sheet...');

      // Prepare submission data for Master Sheet
      const masterSubmissionData = {
        assignmentId: assignmentId,
        studentEmail: studentEmail,
        studentName: studentName,
        answers: answers,
        files: uploadedFiles,
        urls: submissionData.urls || [],
        groupName: groupName,
        groupMembers: groupMembers,
        isGroupLeader: submissionData.isGroupLeader || false
      };

      // Prepare assignment data for Master Sheet
      const masterAssignmentData = {
        assignmentHeader: assignmentRow[5],
        subHeader: assignmentRow[6],
        subject: assignmentRow[3],
        subjectCode: '', // Can be added if available
        groupAssignment: assignmentRow[22],
        startDateTime: assignmentRow[9],
        endDateTime: assignmentRow[10],
        totalMarks: assignmentRow[11],
        batch: assignmentRow[1],
        term: assignmentRow[2],
        sheetsLink: sheetsLink,
        questions: []
      };

      // Parse questions from assignment row for Master Sheet
      for (let i = 0; i < 20; i++) {
        const qIndex = 26 + (i * 2);
        const qMandatoryIndex = 27 + (i * 2);
        if (assignmentRow[qIndex]) {
          masterAssignmentData.questions.push({
            question: assignmentRow[qIndex],
            mandatory: assignmentRow[qMandatoryIndex] || 'No'
          });
        }
      }

      // Call syncToMasterSheet function (from Master_Sheet_Sync.js)
      const syncResult = syncToMasterSheet(masterSubmissionData, masterAssignmentData, isUpdate);

      if (syncResult.success) {
        Logger.log('✅ Master Sheet sync successful: ' + syncResult.data.action);
      } else {
        Logger.log('⚠️ Master Sheet sync failed: ' + syncResult.error);
        // Don't fail the whole submission if Master Sheet sync fails
      }
    } catch (masterError) {
      Logger.log('⚠️ Master Sheet sync error (non-critical): ' + masterError.message);
      // Continue with successful response even if Master Sheet sync fails
    }

    Logger.log('✅ Assignment submitted successfully');

    return {
      success: true,
      data: {
        submissionId: submissionId,
        fileUrls: uploadedFiles,
        timestamp: timestamp,
        isUpdate: isUpdate
      }
    };

  } catch (error) {
    Logger.log('❌ Error submitting assignment: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get previous submissions for a student
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentEmail - Student email
 * @returns {Object} {success, data: submissions array}
 */
function getStudentSubmissions(assignmentId, studentEmail) {
  try {
    const statusResult = checkSubmissionStatus(assignmentId, studentEmail);

    if (!statusResult.success) {
      return statusResult;
    }

    if (!statusResult.data.hasSubmitted) {
      return {
        success: true,
        data: {
          submissions: [],
          count: 0
        }
      };
    }

    // Get assignment details to parse the response sheet properly
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    let assignmentRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        assignmentRow = data[i];
        break;
      }
    }

    const sheetsLink = assignmentRow[21];
    const sheetId = extractSheetIdFromUrl(sheetsLink);
    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const responseSheet = responseSpreadsheet.getSheets()[0];
    const headerRow = responseSheet.getRange(1, 1, 1, responseSheet.getLastColumn()).getValues()[0];
    const allData = responseSheet.getDataRange().getValues();

    // Parse submissions
    const submissions = [];
    for (const sub of statusResult.data.allSubmissions) {
      const rowData = sub.rowData;
      const parsedSubmission = {
        timestamp: rowData[0],
        responseUpdated: rowData[1],
        submissionId: '',
        submitterEmail: '',
        submitterName: '',
        answers: {},
        files: [],
        urls: [],
        groupName: '',
        groupMembers: []
      };

      // Parse each column based on header
      for (let col = 0; col < headerRow.length; col++) {
        const header = headerRow[col];
        const value = rowData[col];

        if (header === 'Submission ID') {
          parsedSubmission.submissionId = value || '';
        } else if (header === 'Student Email') {
          parsedSubmission.submitterEmail = value || '';
        } else if (header === 'Student Name') {
          parsedSubmission.submitterName = value || '';
        } else if (header === 'Group Members') {
          parsedSubmission.groupMembers = value ? value.split(',').map(m => m.trim()) : [];
        } else if (header === 'Group Name') {
          parsedSubmission.groupName = value || '';
        } else if (header.startsWith('File Name ') && value) {
          const fileIndex = parseInt(header.replace('File Name ', '')) - 1;
          if (!parsedSubmission.files[fileIndex]) {
            parsedSubmission.files[fileIndex] = {};
          }
          parsedSubmission.files[fileIndex].name = value;
        } else if (header.startsWith('File Url ') && value) {
          const fileIndex = parseInt(header.replace('File Url ', '')) - 1;
          if (!parsedSubmission.files[fileIndex]) {
            parsedSubmission.files[fileIndex] = {};
          }
          parsedSubmission.files[fileIndex].url = value;
        } else if (header.startsWith('URL Name ') && value) {
          const urlIndex = parseInt(header.replace('URL Name ', '')) - 1;
          if (!parsedSubmission.urls[urlIndex]) {
            parsedSubmission.urls[urlIndex] = {};
          }
          parsedSubmission.urls[urlIndex].name = value;
        } else if (header.startsWith('URL Link ') && value) {
          const urlIndex = parseInt(header.replace('URL Link ', '')) - 1;
          if (!parsedSubmission.urls[urlIndex]) {
            parsedSubmission.urls[urlIndex] = {};
          }
          parsedSubmission.urls[urlIndex].link = value;
        } else if (header !== 'Timestamp' && header !== 'Response Updated' && header !== 'Assignment Updated?' &&
                   header !== 'Submission ID' && header !== 'Student Email' && header !== 'Student Name' &&
                   header !== 'Group Name' && header !== 'Group Members Emails' && header !== 'Group Members') {
          // It's a question answer
          parsedSubmission.answers[header] = value;
        }
      }

      // Filter out empty file objects
      parsedSubmission.files = parsedSubmission.files.filter(f => f && f.name);
      // Filter out empty URL objects
      parsedSubmission.urls = parsedSubmission.urls.filter(u => u && u.name && u.link);

      submissions.push(parsedSubmission);
    }

    return {
      success: true,
      data: {
        submissions: submissions,
        count: submissions.length,
        // Pass through debug info from checkSubmissionStatus
        _debug: statusResult.data._debug
      }
    };

  } catch (error) {
    Logger.log('❌ Error getting student submissions: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract sheet ID from Google Sheets URL
 */
function extractSheetIdFromUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Push refresh request to students
 * Records in "Push to Refresh" sheet with auto-generated Refresh ID
 * Format: Pushed By Email | Timestamp | Refresh ID | Reason For Push | Banner Notice to Refresh | Require full screen refresh | StartDateTimeRefresh | EndDateTimeRefresh
 */
function pushRefreshRequest(adminEmail, reason, bannerNotice, requireFullScreen, startDateTime, endDateTime) {
  try {
    Logger.log('🔄 Creating refresh request from: ' + adminEmail);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.PUSH_TO_REFRESH_SHEET);

    if (!sheet) {
      return {
        success: false,
        error: 'Push to Refresh sheet not found'
      };
    }

    const timestamp = formatTimestamp();

    // Generate Refresh ID: REFRESH-YYYYMMDD-XXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = year + month + day;

    // Count existing refresh requests today
    const data = sheet.getDataRange().getValues();
    const todayPrefix = 'REFRESH-' + dateStr;
    let count = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().startsWith(todayPrefix)) {
        count++;
      }
    }

    const sequence = String(count + 1).padStart(3, '0');
    const refreshId = todayPrefix + '-' + sequence;

    // Format datetime strings if provided (convert from ISO to dd-MMM-yyyy HH:mm:ss)
    let formattedStartDateTime = '';
    let formattedEndDateTime = '';

    if (startDateTime) {
      const startDate = new Date(startDateTime);
      formattedStartDateTime = Utilities.formatDate(startDate, ASSIGNMENT_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
    }

    if (endDateTime) {
      const endDate = new Date(endDateTime);
      formattedEndDateTime = Utilities.formatDate(endDate, ASSIGNMENT_CONFIG.TIMEZONE, "dd-MMM-yyyy HH:mm:ss");
    }

    const row = [
      adminEmail,               // Column A: Pushed By Email
      timestamp,                // Column B: Timestamp
      refreshId,                // Column C: Refresh ID
      reason,                   // Column D: Reason For Push
      bannerNotice,             // Column E: Banner Notice to Refresh
      requireFullScreen ? 'Yes' : 'No',  // Column F: Require full screen refresh
      formattedStartDateTime,   // Column G: StartDateTimeRefresh
      formattedEndDateTime      // Column H: EndDateTimeRefresh
    ];

    sheet.appendRow(row);

    Logger.log('✅ Refresh request created with ID: ' + refreshId);
    if (formattedStartDateTime && formattedEndDateTime) {
      Logger.log('📅 Scheduled from ' + formattedStartDateTime + ' to ' + formattedEndDateTime);
    }

    return {
      success: true,
      data: {
        refreshId: refreshId,
        timestamp: timestamp,
        startDateTime: formattedStartDateTime,
        endDateTime: formattedEndDateTime,
        message: 'Refresh request sent to students'
      }
    };

  } catch (error) {
    Logger.log('❌ Error pushing refresh request: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse refresh datetime string to Date object
 * Format: "10-Dec-2025 18:46:40"
 * @param {string} dateTimeStr - DateTime string
 * @returns {Date|null} Parsed Date object or null if parsing fails
 */
function parseRefreshDateTime(dateTimeStr) {
  try {
    if (!dateTimeStr || dateTimeStr.toString().trim() === '') {
      return null;
    }

    const str = dateTimeStr.toString().trim();

    // Format: "10-Dec-2025 18:46:40"
    // Split into date and time parts
    const parts = str.split(' ');
    if (parts.length !== 2) {
      Logger.log('⚠️ Invalid datetime format (expected date and time): ' + str);
      return null;
    }

    const datePart = parts[0]; // "10-Dec-2025"
    const timePart = parts[1]; // "18:46:40"

    // Parse date: "10-Dec-2025"
    const dateParts = datePart.split('-');
    if (dateParts.length !== 3) {
      Logger.log('⚠️ Invalid date format: ' + datePart);
      return null;
    }

    const day = parseInt(dateParts[0]);
    const monthStr = dateParts[1]; // "Dec"
    const year = parseInt(dateParts[2]);

    // Convert month string to number
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const month = monthMap[monthStr];
    if (month === undefined) {
      Logger.log('⚠️ Invalid month: ' + monthStr);
      return null;
    }

    // Parse time: "18:46:40"
    const timeParts = timePart.split(':');
    if (timeParts.length !== 3) {
      Logger.log('⚠️ Invalid time format: ' + timePart);
      return null;
    }

    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);

    // Create Date object (in IST timezone)
    const date = new Date(year, month, day, hours, minutes, seconds);

    if (isNaN(date.getTime())) {
      Logger.log('⚠️ Failed to create valid date from: ' + str);
      return null;
    }

    return date;

  } catch (error) {
    Logger.log('⚠️ Error parsing datetime: ' + error.message);
    return null;
  }
}

/**
 * Check if refresh is required for student
 * Checks latest refresh request against Acknowledgment Tracking Refresh sheet
 */
function checkRefreshRequired(studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const refreshSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.PUSH_TO_REFRESH_SHEET);
    const ackSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ACKNOWLEDGMENT_TRACKING_SHEET);

    if (!refreshSheet) {
      return {
        success: true,
        data: { refreshRequired: false }
      };
    }

    const refreshData = refreshSheet.getDataRange().getValues();

    // Get the most recent refresh request (last row)
    if (refreshData.length <= 1) {
      // No refresh requests
      return {
        success: true,
        data: { refreshRequired: false }
      };
    }

    const lastRow = refreshData[refreshData.length - 1];
    const timestamp = lastRow[1];       // Column B: Timestamp
    const refreshId = lastRow[2];       // Column C: Refresh ID
    const reason = lastRow[3];          // Column D: Reason For Push
    const bannerNotice = lastRow[4];    // Column E: Banner Notice to Refresh
    const requireFullScreen = lastRow[5] === 'Yes';  // Column F: Require full screen refresh
    const startDateTimeRefresh = lastRow[6];  // Column G: StartDateTimeRefresh
    const endDateTimeRefresh = lastRow[7];    // Column H: EndDateTimeRefresh

    // Check if refresh request is within valid time window
    if (startDateTimeRefresh && endDateTimeRefresh) {
      const now = new Date();

      // Parse datetime strings (format: "10-Dec-2025 18:46:40")
      const startDate = parseRefreshDateTime(startDateTimeRefresh);
      const endDate = parseRefreshDateTime(endDateTimeRefresh);

      if (startDate && endDate) {
        // Check if current time is within the range
        if (now < startDate || now > endDate) {
          Logger.log('⏰ Refresh request expired or not yet active. Current: ' + now + ', Start: ' + startDate + ', End: ' + endDate);
          return {
            success: true,
            data: { refreshRequired: false }
          };
        }
        Logger.log('✅ Refresh request is within active time window');
      } else {
        Logger.log('⚠️ Failed to parse start/end datetime, proceeding without time check');
      }
    }

    // Check if student has acknowledged this refresh ID
    let hasAcknowledged = false;

    if (ackSheet) {
      const ackData = ackSheet.getDataRange().getValues();

      // Search for this student's acknowledgment of this refresh ID
      for (let i = 1; i < ackData.length; i++) {
        const ackRefreshId = ackData[i][1];  // Column B: Refresh ID
        const ackStudentEmail = ackData[i][2]; // Column C: Student Email

        if (ackRefreshId && ackRefreshId.toString() === refreshId.toString() &&
            ackStudentEmail && ackStudentEmail.toString().trim().toLowerCase() === studentEmail.toLowerCase()) {
          hasAcknowledged = true;
          break;
        }
      }
    }

    if (hasAcknowledged) {
      return {
        success: true,
        data: { refreshRequired: false }
      };
    }

    return {
      success: true,
      data: {
        refreshRequired: true,
        refreshId: refreshId,
        timestamp: timestamp,
        reason: reason,
        bannerNotice: bannerNotice,
        requireFullScreen: requireFullScreen
      }
    };

  } catch (error) {
    Logger.log('⚠️ Error checking refresh required (silently handling): ' + error.message);
    // Return success with refreshRequired: false to avoid frontend errors
    // This prevents error loops when sheets are inaccessible or don't exist
    return {
      success: true,
      data: { refreshRequired: false }
    };
  }
}

/**
 * Acknowledge refresh by student
 * Records acknowledgment in "Acknowledgment Tracking Refresh" sheet
 * Format: Timestamp | Refresh ID | Student Email
 */
function acknowledgeRefresh(studentEmail) {
  try {
    Logger.log('✅ Student acknowledging refresh: ' + studentEmail);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const refreshSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.PUSH_TO_REFRESH_SHEET);
    const ackSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ACKNOWLEDGMENT_TRACKING_SHEET);

    if (!refreshSheet) {
      Logger.log('⚠️ Push to Refresh sheet not found - silently handling');
      return {
        success: true,
        message: 'Refresh feature not configured'
      };
    }

    if (!ackSheet) {
      Logger.log('⚠️ Acknowledgment Tracking Refresh sheet not found - silently handling');
      return {
        success: true,
        message: 'Refresh feature not configured'
      };
    }

    const refreshData = refreshSheet.getDataRange().getValues();

    if (refreshData.length <= 1) {
      return {
        success: true,
        message: 'No refresh request to acknowledge'
      };
    }

    // Get the latest refresh request
    const lastRow = refreshData[refreshData.length - 1];
    const refreshId = lastRow[2]; // Column C: Refresh ID

    // Check if student has already acknowledged this refresh ID
    const ackData = ackSheet.getDataRange().getValues();
    for (let i = 1; i < ackData.length; i++) {
      const ackRefreshId = ackData[i][1];  // Column B: Refresh ID
      const ackStudentEmail = ackData[i][2]; // Column C: Student Email

      if (ackRefreshId && ackRefreshId.toString() === refreshId.toString() &&
          ackStudentEmail && ackStudentEmail.toString().trim().toLowerCase() === studentEmail.toLowerCase()) {
        Logger.log('⚠️ Student has already acknowledged this refresh');
        return {
          success: true,
          message: 'Already acknowledged'
        };
      }
    }

    // Record acknowledgment
    const timestamp = formatTimestamp();
    const row = [
      timestamp,      // Column A: Timestamp
      refreshId,      // Column B: Refresh ID
      studentEmail    // Column C: Student Email
    ];

    ackSheet.appendRow(row);

    Logger.log('✅ Refresh acknowledged for Refresh ID: ' + refreshId);

    return {
      success: true,
      message: 'Refresh acknowledged',
      data: {
        refreshId: refreshId,
        timestamp: timestamp
      }
    };

  } catch (error) {
    Logger.log('⚠️ Error acknowledging refresh (silently handling): ' + error.message);
    // Return success to avoid frontend errors
    return {
      success: true,
      message: 'Acknowledged (with errors)'
    };
  }
}

/**
 * Get students by subject for group assignment selection
 * Filters students from Group Members sheet based on assignment subject
 */
function getStudentsBySubject(batch, subject) {
  try {
    Logger.log('📋 Getting students for batch: ' + batch + ', subject: ' + subject);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName('Group Members');

    if (!sheet) {
      return {
        success: false,
        error: 'Group Members sheet not found'
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const emailCol = headers.indexOf('Student Email');
    const nameCol = headers.indexOf('Full Name');
    const rollNoCol = headers.indexOf('Roll No');
    const batchCol = headers.indexOf('Batch');

    if (emailCol === -1 || nameCol === -1 || rollNoCol === -1 || batchCol === -1) {
      return {
        success: false,
        error: 'Required columns not found in Group Members sheet'
      };
    }

    // Find all Subject columns (Subject 1, Subject 2, ..., Subject 34)
    const subjectCols = [];
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().match(/^Subject \d+$/)) {
        subjectCols.push(i);
      }
    }

    Logger.log('📊 Found ' + subjectCols.length + ' subject columns');

    // Filter students
    const students = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Check if batch matches
      if (row[batchCol] && row[batchCol].toString().trim() === batch.trim()) {
        // Check if student has the required subject in any Subject column
        let hasSubject = false;
        for (let j = 0; j < subjectCols.length; j++) {
          const colIndex = subjectCols[j];
          const studentSubject = row[colIndex];
          if (studentSubject && studentSubject.toString().trim() === subject.trim()) {
            hasSubject = true;
            break;
          }
        }

        if (hasSubject && row[emailCol] && row[nameCol]) {
          students.push({
            email: row[emailCol].toString().trim(),
            fullName: row[nameCol].toString().trim(),
            rollNo: row[rollNoCol] ? row[rollNoCol].toString().trim() : ''
          });
        }
      }
    }

    Logger.log('✅ Found ' + students.length + ' students for ' + subject);

    return {
      success: true,
      data: students
    };

  } catch (error) {
    Logger.log('❌ Error getting students by subject: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== RESUMABLE UPLOAD FOR LARGE FILES ====================

/**
 * Initiate resumable upload session for large files
 * This creates a session URL that the client will use to upload chunks
 *
 * @param {Object} uploadData - Contains assignmentId, fileName, fileSize, mimeType, studentEmail, studentName
 * @returns {Object} {success, data: {uploadUrl, folderId, filePath}}
 */
function initiateResumableUpload(uploadData) {
  try {
    Logger.log('🚀 Initiating resumable upload for: ' + uploadData.fileName);

    const assignmentId = uploadData.assignmentId;
    const fileName = uploadData.fileName;
    const fileSize = uploadData.fileSize;
    const mimeType = uploadData.mimeType;
    const studentEmail = uploadData.studentEmail;
    const studentName = uploadData.studentName;

    // OPTIMIZATION: Use cache for assignment lookup
    const cache = CacheService.getScriptCache();
    const cacheKey = 'assignment_' + assignmentId;
    let assignmentRow = null;
    let fileUploadLink = null;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      fileUploadLink = parsed.fileUploadLink;
      Logger.log('✅ Cache hit for assignment: ' + assignmentId);
    } else {
      // Cache miss - fetch from sheet
      const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
      const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
      const data = assignmentSheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === assignmentId) {
          assignmentRow = data[i];
          fileUploadLink = assignmentRow[20];
          // Cache for 10 minutes
          cache.put(cacheKey, JSON.stringify({ fileUploadLink: fileUploadLink }), 600);
          break;
        }
      }
    }

    if (!fileUploadLink) {
      return { success: false, error: 'No file upload folder configured for this assignment' };
    }

    // Extract folder ID from Drive URL
    const folderId = extractFolderIdFromUrl(fileUploadLink);
    if (!folderId) {
      return { success: false, error: 'Invalid Drive folder URL' };
    }

    // OPTIMIZATION: Use cache for student folder lookup
    const studentFolderCacheKey = 'studentFolder_' + folderId + '_' + studentName;
    let studentFolderId = cache.get(studentFolderCacheKey);

    if (!studentFolderId) {
      // Cache miss - find or create folder
      const responseFolder = DriveApp.getFolderById(folderId);
      const studentFolderName = studentName;

      const existingFolders = responseFolder.getFoldersByName(studentFolderName);
      let studentFolder;

      if (existingFolders.hasNext()) {
        studentFolder = existingFolders.next();
        Logger.log('📁 Using existing student folder: ' + studentFolderName);
      } else {
        studentFolder = responseFolder.createFolder(studentFolderName);
        Logger.log('📁 Created new student folder: ' + studentFolderName);
      }

      studentFolderId = studentFolder.getId();
      // Cache for 1 hour
      cache.put(studentFolderCacheKey, studentFolderId, 3600);
    } else {
      Logger.log('✅ Cache hit for student folder: ' + studentName);
    }

    // Create a resumable upload session using Google Drive API
    const uploadUrl = createResumableUploadSession(studentFolderId, fileName, mimeType, fileSize);

    Logger.log('✅ Resumable upload session created');

    return {
      success: true,
      data: {
        uploadUrl: uploadUrl,
        folderId: studentFolderId,
        folderName: studentName,
        fileName: fileName,
        fileSize: fileSize
      }
    };

  } catch (error) {
    Logger.log('❌ Error initiating resumable upload: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create resumable upload session using Drive API
 * @param {string} folderId - Target folder ID
 * @param {string} fileName - Name of the file
 * @param {string} mimeType - MIME type
 * @param {number} fileSize - Total file size in bytes
 * @returns {string} Upload URL for chunked upload
 */
function createResumableUploadSession(folderId, fileName, mimeType, fileSize) {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [folderId]
  };

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': fileSize.toString()
    },
    payload: JSON.stringify(metadata),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 200) {
    const uploadUrl = response.getHeaders()['Location'];
    Logger.log('📍 Upload URL created: ' + uploadUrl.substring(0, 50) + '...');
    return uploadUrl;
  } else {
    throw new Error('Failed to create upload session: ' + response.getContentText());
  }
}

/**
 * Finalize resumable upload and get file details
 * This is called after all chunks have been uploaded
 *
 * @param {Object} finalizeData - Contains uploadUrl to check upload status
 * @returns {Object} {success, data: {fileId, fileUrl, fileName}}
 */
function finalizeResumableUpload(finalizeData) {
  try {
    Logger.log('✅ Finalizing resumable upload...');

    const uploadUrl = finalizeData.uploadUrl;

    // Query the upload status to get file ID
    // Note: Don't set Content-Length manually - Apps Script handles it automatically
    const options = {
      method: 'put',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Range': 'bytes */' + finalizeData.fileSize
      },
      payload: '', // Empty payload ensures Content-Length: 0
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(uploadUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      const fileData = JSON.parse(response.getContentText());
      const fileId = fileData.id;

      // Get file from Drive to set sharing permissions
      const file = DriveApp.getFileById(fileId);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileUrl = file.getUrl();
      const fileName = file.getName();

      Logger.log('✅ Upload finalized. File ID: ' + fileId);

      return {
        success: true,
        data: {
          fileId: fileId,
          fileUrl: fileUrl,
          fileName: fileName,
          mimeType: file.getMimeType()
        }
      };
    } else {
      throw new Error('Upload not complete. Status: ' + responseCode + ' - ' + response.getContentText());
    }

  } catch (error) {
    Logger.log('❌ Error finalizing upload: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Recover file URL from Drive when resumable upload finalization fails
 * Searches for the file by name in the student's submission folder
 *
 * @param {Object} recoveryData - Contains assignmentId, studentName, fileName
 * @returns {Object} {success, data: {fileId, fileUrl, fileName}}
 */
function recoverUploadedFile(recoveryData) {
  try {
    Logger.log('🔍 Attempting to recover uploaded file: ' + recoveryData.fileName);

    const assignmentId = recoveryData.assignmentId;
    const studentName = recoveryData.studentName;
    const fileName = recoveryData.fileName;

    // Get assignment to find the folder
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = sheet.getDataRange().getValues();

    let fileUploadLink = null;

    // Find assignment by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        fileUploadLink = data[i][23]; // Column X: File Upload Link
        break;
      }
    }

    if (!fileUploadLink) {
      throw new Error('Assignment folder not found');
    }

    // Extract folder ID from the link
    const folderIdMatch = fileUploadLink.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      throw new Error('Invalid folder link format');
    }

    const folderId = folderIdMatch[1];
    const folder = DriveApp.getFolderById(folderId);

    // Find student's folder
    const studentFolders = folder.getFoldersByName(studentName);
    if (!studentFolders.hasNext()) {
      throw new Error('Student folder not found: ' + studentName);
    }

    const studentFolder = studentFolders.next();

    // Search for file by name in student folder (look for recent files)
    const files = studentFolder.getFiles();
    let foundFile = null;
    let latestDate = null;

    while (files.hasNext()) {
      const file = files.next();
      const currentFileName = file.getName();

      // Match by exact name or if the uploaded file name contains the search name
      if (currentFileName === fileName || currentFileName.includes(fileName.split('.')[0])) {
        const fileDate = file.getLastUpdated();

        // Get the most recently updated file if multiple matches
        if (!latestDate || fileDate > latestDate) {
          foundFile = file;
          latestDate = fileDate;
        }
      }
    }

    if (!foundFile) {
      throw new Error('File not found in Drive: ' + fileName);
    }

    // Set sharing permissions
    foundFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = foundFile.getId();
    const fileUrl = foundFile.getUrl();
    const actualFileName = foundFile.getName();

    Logger.log('✅ File recovered: ' + actualFileName + ' (ID: ' + fileId + ')');

    return {
      success: true,
      data: {
        fileId: fileId,
        fileUrl: fileUrl,
        fileName: actualFileName,
        mimeType: foundFile.getMimeType()
      }
    };

  } catch (error) {
    Logger.log('❌ Error recovering file: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== PEER RATING & REVIEW SYSTEM ====================

/**
 * Get group members by subject group for pre-filling
 * Uses "Group Members" sheet to find students in the same SubjectGroup
 * @param {string} batch - Student's batch
 * @param {string} subject - Assignment subject
 * @param {string} studentEmail - Current student's email
 * @returns {Object} {success, data: students[]}
 */
function getGroupMembersBySubjectGroup(batch, subject, studentEmail) {
  try {
    Logger.log('👥 Getting group members for batch: ' + batch + ', subject: ' + subject + ', student: ' + studentEmail);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const groupMembersSheet = ss.getSheetByName('Group Members');

    if (!groupMembersSheet) {
      Logger.log('❌ Group Members sheet not found - cannot proceed');
      return {
        success: false,
        error: 'Group Members sheet not found. Please contact admin.'
      };
    }

    const data = groupMembersSheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const emailCol = headers.indexOf('Student Email');
    const nameCol = headers.indexOf('Full Name');
    const rollNoCol = headers.indexOf('Roll No');
    const batchCol = headers.indexOf('Batch');

    if (emailCol === -1 || nameCol === -1 || rollNoCol === -1 || batchCol === -1) {
      return {
        success: false,
        error: 'Required columns not found in Group Members sheet'
      };
    }

    // Find the current student's row
    let studentRow = null;
    let studentSubjectGroup = null;
    let subjectFound = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] && data[i][emailCol].toString().trim().toLowerCase() === studentEmail.toLowerCase()) {
        studentRow = data[i];
        break;
      }
    }

    if (!studentRow) {
      Logger.log('❌ Student not found in Group Members sheet');
      return {
        success: false,
        error: 'Student not found in Group Members sheet. Please contact admin.'
      };
    }

    // Find the SubjectGroup for the given subject
    // Headers are: Subject 1, SubjectGroup 1, Subject 2, SubjectGroup 2, ...
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().match(/^Subject \d+$/)) {
        const subjectValue = studentRow[i];
        if (subjectValue && subjectValue.toString().trim() === subject.trim()) {
          subjectFound = true;
          // Found the subject, now get the corresponding SubjectGroup (next column)
          const subjectGroupColIndex = i + 1;
          if (subjectGroupColIndex < headers.length && headers[subjectGroupColIndex].toString().match(/^SubjectGroup \d+$/)) {
            studentSubjectGroup = studentRow[subjectGroupColIndex];
            if (studentSubjectGroup && studentSubjectGroup.toString().trim() !== '') {
              Logger.log('📋 Found student\'s SubjectGroup: ' + studentSubjectGroup);
            } else {
              Logger.log('📋 SubjectGroup is empty - will return all students with this Batch + Subject');
              studentSubjectGroup = null; // Explicitly set to null for empty values
            }
            break;
          }
        }
      }
    }

    if (!subjectFound) {
      Logger.log('❌ Subject not mapped for this student in Group Members sheet');
      return {
        success: false,
        error: 'This subject is not mapped for you. Please contact admin.'
      };
    }

    // Now find all students with the same batch and subject
    // If studentSubjectGroup is not null, also filter by SubjectGroup
    const groupMembers = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Check if batch matches
      if (row[batchCol] && row[batchCol].toString().trim() === batch.trim()) {
        // Check each Subject/SubjectGroup pair
        for (let j = 0; j < headers.length; j++) {
          if (headers[j] && headers[j].toString().match(/^Subject \d+$/)) {
            const subjectValue = row[j];
            const subjectGroupColIndex = j + 1;

            if (subjectValue && subjectValue.toString().trim() === subject.trim()) {
              // Subject matches
              let shouldInclude = false;

              if (studentSubjectGroup === null) {
                // No SubjectGroup filtering - include all students with this Batch + Subject
                shouldInclude = true;
              } else {
                // Filter by SubjectGroup
                if (subjectGroupColIndex < headers.length && headers[subjectGroupColIndex].toString().match(/^SubjectGroup \d+$/)) {
                  const subjectGroupValue = row[subjectGroupColIndex];
                  if (subjectGroupValue && subjectGroupValue.toString().trim() === studentSubjectGroup.trim()) {
                    shouldInclude = true;
                  }
                }
              }

              if (shouldInclude) {
                // Add this student
                if (row[emailCol] && row[nameCol]) {
                  groupMembers.push({
                    email: row[emailCol].toString().trim(),
                    fullName: row[nameCol].toString().trim(),
                    rollNo: row[rollNoCol] ? row[rollNoCol].toString().trim() : ''
                  });
                }
                break;
              }
            }
          }
        }
      }
    }

    if (studentSubjectGroup) {
      Logger.log('✅ Found ' + groupMembers.length + ' group members in ' + studentSubjectGroup);
    } else {
      Logger.log('✅ Found ' + groupMembers.length + ' students for Batch: ' + batch + ', Subject: ' + subject);
    }

    return {
      success: true,
      data: groupMembers,
      groupName: studentSubjectGroup || null // Return the group name
    };

  } catch (error) {
    Logger.log('❌ Error getting group members by subject group: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Submit peer ratings and remarks
 * Saves ratings to the Peer Ratings sub-sheet
 * @param {Object} ratingsData - Contains submissionId, studentEmail, studentName, ratings[]
 * @returns {Object} {success, data}
 */
function submitPeerRatings(ratingsData) {
  try {
    const submissionId = ratingsData.submissionId;
    const studentEmail = ratingsData.studentEmail;
    const studentName = ratingsData.studentName;
    const ratings = ratingsData.ratings || []; // Array of {memberName, rating, remark}

    Logger.log('⭐ Submitting peer ratings - Submission ID: ' + submissionId + ', Student: ' + studentEmail);

    // Extract assignmentId from submissionId (format: AssignmentID_Email_Timestamp)
    const assignmentId = submissionId.split('_')[0];

    // Get assignment details to find sheets link
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    let sheetsLink = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        sheetsLink = data[i][21];
        break;
      }
    }

    if (!sheetsLink) {
      return { success: false, error: 'Assignment sheets link not found' };
    }

    // Open the Response Spreadsheet
    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const peerRatingsSheet = responseSpreadsheet.getSheetByName('Peer Ratings');

    if (!peerRatingsSheet) {
      return { success: false, error: 'Peer Ratings sheet not found' };
    }

    // Check if student has already submitted ratings for this submission
    const existingData = peerRatingsSheet.getDataRange().getValues();
    const headers = existingData[0];
    const submissionIdCol = headers.indexOf('Submission ID');
    const emailCol = headers.indexOf('Student Email');

    let existingRowIndex = -1;
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][submissionIdCol] === submissionId && existingData[i][emailCol] === studentEmail) {
        existingRowIndex = i + 1; // 1-indexed for sheet
        break;
      }
    }

    if (existingRowIndex !== -1) {
      return {
        success: false,
        error: 'Ratings already submitted and locked. Cannot edit peer ratings once submitted.'
      };
    }

    // Prepare row data
    const timestamp = new Date();
    const rowData = [];

    for (let col = 0; col < headers.length; col++) {
      const header = headers[col];

      if (header === 'Timestamp') {
        rowData.push(timestamp);
      } else if (header === 'Submission ID') {
        rowData.push(submissionId);
      } else if (header === 'Student Email') {
        rowData.push(studentEmail);
      } else if (header === 'Student Name') {
        rowData.push(studentName);
      } else if (header.startsWith('Group Member ')) {
        // Extract member number (e.g., "Group Member 1" -> 1)
        const memberMatch = header.match(/^Group Member (\d+)$/);
        if (memberMatch) {
          const memberIndex = parseInt(memberMatch[1]) - 1; // 0-indexed
          rowData.push(ratings[memberIndex] ? ratings[memberIndex].memberName : '');
        } else if (header.includes(' Rating')) {
          // "Group Member X Rating"
          const ratingMatch = header.match(/^Group Member (\d+) Rating$/);
          if (ratingMatch) {
            const memberIndex = parseInt(ratingMatch[1]) - 1;
            rowData.push(ratings[memberIndex] ? ratings[memberIndex].rating : '');
          }
        } else if (header.includes(' Remark')) {
          // "Group Member X Remark"
          const remarkMatch = header.match(/^Group Member (\d+) Remark$/);
          if (remarkMatch) {
            const memberIndex = parseInt(remarkMatch[1]) - 1;
            rowData.push(ratings[memberIndex] ? ratings[memberIndex].remark : '');
          }
        } else {
          rowData.push('');
        }
      } else {
        rowData.push('');
      }
    }

    // Append row
    peerRatingsSheet.appendRow(rowData);

    Logger.log('✅ Peer ratings submitted successfully');

    return {
      success: true,
      data: {
        submissionId: submissionId,
        timestamp: timestamp,
        message: 'Peer ratings submitted successfully'
      }
    };

  } catch (error) {
    Logger.log('❌ Error submitting peer ratings: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get peer ratings for a specific student and submission
 * Checks if ratings have been submitted (locked)
 * @param {string} submissionId - Submission ID
 * @param {string} studentEmail - Student's email
 * @returns {Object} {success, data: {hasSubmitted, ratings[]}}
 */
function getPeerRatings(submissionId, studentEmail) {
  try {
    Logger.log('📖 Getting peer ratings - Submission ID: ' + submissionId + ', Student: ' + studentEmail);

    // Extract assignmentId from submissionId
    const assignmentId = submissionId.split('_')[0];

    // Get assignment details to find sheets link
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    let sheetsLink = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        sheetsLink = data[i][21];
        break;
      }
    }

    if (!sheetsLink) {
      return { success: false, error: 'Assignment sheets link not found' };
    }

    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const peerRatingsSheet = responseSpreadsheet.getSheetByName('Peer Ratings');

    if (!peerRatingsSheet) {
      // No peer ratings sheet means ratings not enabled
      return {
        success: true,
        data: {
          hasSubmitted: false,
          ratings: []
        }
      };
    }

    // Check if student has submitted ratings
    const ratingsData = peerRatingsSheet.getDataRange().getValues();
    const headers = ratingsData[0];
    const submissionIdCol = headers.indexOf('Submission ID');
    const emailCol = headers.indexOf('Student Email');

    for (let i = 1; i < ratingsData.length; i++) {
      if (ratingsData[i][submissionIdCol] === submissionId && ratingsData[i][emailCol] === studentEmail) {
        // Found existing ratings - parse them
        const ratings = [];

        for (let col = 0; col < headers.length; col++) {
          const header = headers[col];
          const memberMatch = header.match(/^Group Member (\d+)$/);

          if (memberMatch) {
            const memberNum = parseInt(memberMatch[1]);
            const memberName = ratingsData[i][col];

            if (memberName) {
              // Find rating and remark for this member
              const ratingCol = headers.indexOf('Group Member ' + memberNum + ' Rating');
              const remarkCol = headers.indexOf('Group Member ' + memberNum + ' Remark');

              ratings.push({
                memberName: memberName,
                rating: ratingCol !== -1 ? ratingsData[i][ratingCol] : '',
                remark: remarkCol !== -1 ? ratingsData[i][remarkCol] : ''
              });
            }
          }
        }

        return {
          success: true,
          data: {
            hasSubmitted: true,
            ratings: ratings,
            timestamp: ratingsData[i][headers.indexOf('Timestamp')]
          }
        };
      }
    }

    // No ratings found
    return {
      success: true,
      data: {
        hasSubmitted: false,
        ratings: []
      }
    };

  } catch (error) {
    Logger.log('❌ Error getting peer ratings: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get average ratings and all remarks for a student
 * Calculates average rating from all peers and collects all remarks (anonymous)
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentEmail - Student's email (the one being rated)
 * @returns {Object} {success, data: {averageRating, totalRatings, remarks[]}}
 */
function getAverageRatings(assignmentId, studentEmail) {
  try {
    Logger.log('📊 Getting average ratings for student: ' + studentEmail + ' in assignment: ' + assignmentId);

    // Get assignment details to find sheets link
    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const assignmentSheet = ss.getSheetByName(ASSIGNMENT_CONFIG.ASSIGNMENT_SHEET);
    const data = assignmentSheet.getDataRange().getValues();

    let sheetsLink = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === assignmentId) {
        sheetsLink = data[i][21];
        break;
      }
    }

    if (!sheetsLink) {
      return { success: false, error: 'Assignment sheets link not found' };
    }

    const sheetId = extractSheetIdFromUrl(sheetsLink);
    if (!sheetId) {
      return { success: false, error: 'Invalid sheets link' };
    }

    const responseSpreadsheet = SpreadsheetApp.openById(sheetId);
    const peerRatingsSheet = responseSpreadsheet.getSheetByName('Peer Ratings');

    if (!peerRatingsSheet) {
      return {
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          remarks: []
        }
      };
    }

    // Get student's full name
    const groupMembersSheet = ss.getSheetByName('Group Members');
    let studentName = '';

    if (groupMembersSheet) {
      const groupMembersData = groupMembersSheet.getDataRange().getValues();
      const groupMembersHeaders = groupMembersData[0];
      const emailCol = groupMembersHeaders.indexOf('Student Email');
      const nameCol = groupMembersHeaders.indexOf('Full Name');

      for (let i = 1; i < groupMembersData.length; i++) {
        if (groupMembersData[i][emailCol] && groupMembersData[i][emailCol].toString().trim().toLowerCase() === studentEmail.toLowerCase()) {
          studentName = groupMembersData[i][nameCol].toString().trim();
          break;
        }
      }
    }

    if (!studentName) {
      return { success: false, error: 'Student name not found' };
    }

    // Scan Peer Ratings sheet for ratings given to this student
    const ratingsData = peerRatingsSheet.getDataRange().getValues();
    const headers = ratingsData[0];

    let totalRating = 0;
    let ratingCount = 0;
    const remarks = [];

    // Loop through all rows (skip header)
    for (let i = 1; i < ratingsData.length; i++) {
      const row = ratingsData[i];

      // Check all "Group Member X" columns for student's name
      for (let col = 0; col < headers.length; col++) {
        const header = headers[col];
        const memberMatch = header.match(/^Group Member (\d+)$/);

        if (memberMatch) {
          const memberNum = parseInt(memberMatch[1]);
          const memberName = row[col];

          if (memberName && memberName.toString().trim() === studentName) {
            // Found a rating for this student!
            const ratingCol = headers.indexOf('Group Member ' + memberNum + ' Rating');
            const remarkCol = headers.indexOf('Group Member ' + memberNum + ' Remark');

            if (ratingCol !== -1) {
              const rating = row[ratingCol];
              if (rating !== '' && !isNaN(rating)) {
                totalRating += parseFloat(rating);
                ratingCount++;
              }
            }

            if (remarkCol !== -1) {
              const remark = row[remarkCol];
              if (remark && remark.toString().trim() !== '') {
                remarks.push(remark.toString().trim());
              }
            }
          }
        }
      }
    }

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;

    Logger.log('✅ Average rating: ' + averageRating + ' from ' + ratingCount + ' ratings, ' + remarks.length + ' remarks');

    return {
      success: true,
      data: {
        averageRating: parseFloat(averageRating),
        totalRatings: ratingCount,
        remarks: remarks
      }
    };

  } catch (error) {
    Logger.log('❌ Error getting average ratings: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save new Subject Term entry to sheet
 * Used when admin selects "Others" option in dropdowns
 */
function saveSubjectTermEntry(batch, term, domain, subject) {
  try {
    Logger.log('💾 Saving new Subject Term entry...');
    Logger.log('Batch: ' + batch + ', Term: ' + term + ', Domain: ' + domain + ', Subject: ' + subject);

    const ss = SpreadsheetApp.openById(ASSIGNMENT_CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(ASSIGNMENT_CONFIG.SUBJECT_TERM_SHEET);

    if (!sheet) {
      return {
        success: false,
        error: 'Subject Term sheet not found'
      };
    }

    // Check if this exact combination already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === batch && row[1] === term && row[2] === domain && row[3] === subject) {
        Logger.log('ℹ️ Entry already exists, skipping...');
        return {
          success: true,
          message: 'Entry already exists'
        };
      }
    }

    // Append new row: Batch | Term | Domain | Subject
    const newRow = [
      batch,
      term,
      domain || '',  // Domain is optional
      subject
    ];

    sheet.appendRow(newRow);

    Logger.log('✅ New Subject Term entry saved successfully');

    return {
      success: true,
      message: 'Subject Term entry saved successfully',
      data: {
        batch: batch,
        term: term,
        domain: domain,
        subject: subject
      }
    };

  } catch (error) {
    Logger.log('❌ Error saving Subject Term entry: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
