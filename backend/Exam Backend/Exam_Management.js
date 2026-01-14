// EXAM MANAGEMENT SYSTEM
// ============================================================================

const EXAM_SHEET_ID = '';
const TIMEZONE = "Asia/Kolkata";

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

/**
 * Format device hash for storage in Google Sheets
 * Adds 'd_' prefix to prevent Sheets from converting hex strings to scientific notation
 * @param {string} hash - The device hash
 * @returns {string} - Prefixed hash for safe storage
 */
function formatDeviceHashForStorage(hash) {
  if (!hash) return '';
  // If already prefixed, return as is
  if (hash.startsWith('d_')) return hash;
  return 'd_' + hash;
}

/**
 * Normalize device hash for comparison
 * Strips 'd_' prefix if present to handle both legacy and new data
 * @param {string} hash - The device hash (may or may not have prefix)
 * @returns {string} - Normalized hash without prefix
 */
function normalizeDeviceHash(hash) {
  if (!hash) return '';
  // Convert to string in case it was converted to number by Sheets
  const hashStr = String(hash);
  // Strip prefix if present
  if (hashStr.startsWith('d_')) return hashStr.substring(2);
  return hashStr;
}

/**
 * Initialize exam sheets - Run ONCE to create structure
 */
function initializeExamSheets() {
  const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
  const results = [];

  try {
    // 1. Exams Master
    const masterSheet = getOrCreateExamSheet(ss, 'Exams_Master');
    if (masterSheet.getLastRow() === 0) {
      masterSheet.appendRow([
        'Exam ID', 'Exam Title', 'Exam Type', 'Batch', 'Term', 'Domain', 'Subject', 'Description',
        'Duration (minutes)', 'Total Marks', 'Passing Marks', 'Start DateTime', 'End DateTime',
        'Instructions', 'Status', 'Password Type', 'Master Password', 'Is Practice',
        'Drive Folder Link', 'Response Sheet Link', 'Settings JSON', 'Created By', 'Created At', 'Updated By',
        'Updated At', 'Published By', 'Published At', 'Total Questions', 'Total Students Attempted',
        'Average Score', 'Highest Score', 'Lowest Score', 'View Result', 'Device Allowed'
      ]);
      formatExamHeaderRow(masterSheet, 34, '#34D399');
      results.push('✓ Exams_Master created');
    }

    // 2. Exam Questions
    const questionsSheet = getOrCreateExamSheet(ss, 'Exam_Questions');
    if (questionsSheet.getLastRow() === 0) {
      questionsSheet.appendRow([
        'Question ID', 'Exam ID', 'Question Number', 'Question Type', 'Question Text',
        'allowUpdateAfterSubmit', 'allowSeeQuestionAfterSubmit',
        'Question Image URL', 'Option A', 'Option B', 'Option C', 'Option D', 'Option E',
        'Option F', 'Option G', 'Option H', 'Option I', 'Option J',
        'More than 1 Answer?', 'Correct Answer', 'Marks', 'Negative Marks', 'Difficulty', 'Explanation',
        'Enable Rough Space', 'Word Limit', 'Enable Calculator', 'Enable Scientific Calculator',
        'Enable Table', 'Enable Spreadsheet', 'Created At', 'Updated At'
      ]);
      formatExamHeaderRow(questionsSheet, 32, '#60A5FA');
      results.push('✓ Exam_Questions created');
    }

    // 3. Exam Responses
    const responsesSheet = getOrCreateExamSheet(ss, 'Exam_Responses');
    if (responsesSheet.getLastRow() === 0) {
      responsesSheet.appendRow([
        'Response ID', 'Exam ID', 'Student ID', 'Student Name', 'Student Email', 'Start Time',
        'Submit Time', 'Time Taken (minutes)', 'Total Score', 'Percentage', 'Status',
        'IP Address', 'Browser Info', 'Answer Response Sheet Link', 'Proctoring Drive Folder Link',
        'Proctoring Screenshots', 'Camera Recordings', 'Answers JSON', 'Rough Work JSON',
        'Proctoring Violations Summary', 'Violation Count', 'Auto Submitted', 'Graded',
        'Graded By', 'Graded At', 'Feedback', 'Created At', 'Updated At'
      ]);
      formatExamHeaderRow(responsesSheet, 27, '#F59E0B');
      results.push('✓ Exam_Responses created');
    }

    // 4. Exam Passwords
    const passwordsSheet = getOrCreateExamSheet(ss, 'Exam_Passwords');
    if (passwordsSheet.getLastRow() === 0) {
      passwordsSheet.appendRow([
        'Password ID', 'Exam ID', 'Student ID', 'Student Name', 'Student Email', 'Password',
        'Generated At', 'Sent At', 'Email Status', 'Used', 'Used At'
      ]);
      formatExamHeaderRow(passwordsSheet, 11, '#8B5CF6');
      results.push('✓ Exam_Passwords created');
    }

    // 5. Exam Proctoring
    const proctoringSheet = getOrCreateExamSheet(ss, 'Exam_Proctoring');
    if (proctoringSheet.getLastRow() === 0) {
      proctoringSheet.appendRow([
        'Log ID', 'Exam ID', 'Response ID', 'Student ID', 'Student Name', 'Timestamp',
        'Violation Type', 'Violation Details', 'Question Number', 'Severity',
        'Screenshot URL', 'Camera Frame URL', 'Action Taken'
      ]);
      formatExamHeaderRow(proctoringSheet, 13, '#EF4444');
      results.push('✓ Exam_Proctoring created');
    }

    // 6. Exam Analytics
    const analyticsSheet = getOrCreateExamSheet(ss, 'Exam_Analytics');
    if (analyticsSheet.getLastRow() === 0) {
      analyticsSheet.appendRow([
        'Analytics ID', 'Exam ID', 'Question ID', 'Question Number', 'Total Attempts',
        'Correct Answers', 'Wrong Answers', 'Skipped', 'Accuracy %', 'Average Time (seconds)',
        'Difficulty Index', 'Discrimination Index', 'Last Updated'
      ]);
      formatExamHeaderRow(analyticsSheet, 13, '#10B981');
      results.push('✓ Exam_Analytics created');
    }

    // 7. Exam_Verify - Session verification and single sign-in tracking
    const verifySheet = getOrCreateExamSheet(ss, 'Exam_Verify');
    if (verifySheet.getLastRow() === 0) {
      verifySheet.appendRow([
        'Exam ID', 'Student Email', 'Student Name', 'Roll Number', 'Password Status',
        'Verification Time', 'Session Token', 'Session Active', 'Session Expiry',
        'Device Hash', 'IP Address', 'Device Type', 'OS', 'Browser', 'Browser Version',
        'User Agent', 'Screen Resolution', 'Latitude', 'Longitude', 'City', 'Country',
        'Attempt Count', 'Last Activity', 'Login Blocked', 'Blocked Reason',
        'Blocked Device Hash', 'Blocked IP', 'Blocked Time', 'Previous Session Invalidated'
      ]);
      formatExamHeaderRow(verifySheet, 29, '#EC4899');
      results.push('✓ Exam_Verify created');
    }

    return { success: true, message: 'Exam sheets initialized', details: results };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getOrCreateExamSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

/**
 * Create exam with Drive folder and response sheet
 */
function createExam(examData) {
  const debug = [];
  try {
    debug.push('CREATE EXAM START');
    debug.push('Opening spreadsheet...');

    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');
    debug.push('✓ Sheet opened successfully');

    const examId = 'EXAM_' + Date.now();
    const timestamp = formatTimestampForSheets();
    debug.push('✓ Generated Exam ID: ' + examId);

    // Create Drive folder with hierarchical structure
    debug.push('Creating Drive folder hierarchy...');
    const folderResult = createExamDriveFolder(
      examId,
      examData.examTitle || 'Exam',
      examData.batch || '',
      examData.term || '',
      examData.domain || '',
      examData.subject || ''
    );

    if (!folderResult.success) {
      debug.push('✗ Folder creation FAILED: ' + folderResult.error);
      return { success: false, error: 'Folder creation failed: ' + folderResult.error, debug: debug };
    }
    debug.push('✓ Drive folder created: ' + folderResult.folderUrl);

    // Create response sheet in the exam folder
    debug.push('Creating Response Sheet...');
    const sheetResult = createExamResponseSheet(examData.examTitle || 'Exam', folderResult.folderUrl);

    if (!sheetResult.success) {
      debug.push('✗ Response Sheet creation FAILED: ' + sheetResult.error);
      return { success: false, error: 'Response Sheet creation failed: ' + sheetResult.error, debug: debug };
    }
    debug.push('✓ Response Sheet created: ' + sheetResult.sheetUrl);

    const settings = {
      randomizeQuestions: examData.settings?.randomizeQuestions || false,
      randomizeOptions: examData.settings?.randomizeOptions || false,
      enableRoughSpace: examData.settings?.enableRoughSpace !== false,
      enableNegativeMarking: examData.settings?.enableNegativeMarking || false,
      negativeMarksValue: examData.settings?.negativeMarksValue || 0,
      showResultsImmediately: examData.settings?.showResultsImmediately || false,
      showCorrectAnswers: examData.settings?.showCorrectAnswers || false,
      autoSubmitOnTimeUp: examData.settings?.autoSubmitOnTimeUp !== false,
      gracePeriod: examData.settings?.gracePeriod || 10,
      proctoring: examData.settings?.proctoring || {}
    };

    // Calculate total questions
    const totalQuestions = examData.questions && Array.isArray(examData.questions) ? examData.questions.length : 0;

    // Get created by email (from user who is logged in)
    const createdBy = examData.createdBy || 'Admin';

    // Get the next row number
    const nextRow = masterSheet.getLastRow() + 1;

    // Append the row with plain text values (no URL encoding)
    masterSheet.appendRow([
      examId,
      examData.examTitle || '',
      examData.examType || '',
      examData.batch || '',
      examData.term || '',
      examData.domain || '',
      examData.subject || '',
      examData.description || '',
      examData.duration || '',
      examData.totalMarks || '',
      examData.passingMarks || '',
      examData.startDateTime || '',
      examData.endDateTime || '',
      examData.instructions || '',
      examData.status || 'DRAFT',
      examData.passwordType || 'SAME',
      examData.masterPassword || '',
      examData.isPractice ? 'Yes' : 'No',
      folderResult.folderUrl || '',
      sheetResult.sheetUrl || '',
      JSON.stringify(settings),
      createdBy,
      timestamp,
      '', '', '', '', totalQuestions, 0, 0, 0, 0,  // Updated By, Updated At, Published By, Published At, Total Questions, Total Students Attempted, Avg Score, Highest, Lowest
      examData.viewResult || 'No',  // View Result
      examData.deviceAllowed || 'Laptop/Computer'  // Device Allowed (default to Laptop/Computer)
    ]);

    // Set all cells in the row to plain text format (no number formatting)
    const range = masterSheet.getRange(nextRow, 1, 1, 34);
    range.setNumberFormat('@STRING@'); // Force plain text format

    // Save questions if provided
    debug.push('Saving questions to sheet...');
    if (examData.questions && Array.isArray(examData.questions) && examData.questions.length > 0) {
      debug.push('Number of questions: ' + examData.questions.length);
      const questionsSheet = ss.getSheetByName('Exam_Questions');
      if (questionsSheet) {
        examData.questions.forEach(function(q, index) {
          const questionId = q.questionId || ('Q_' + Date.now() + '_' + index);
          questionsSheet.appendRow([
            questionId,
            examId,
            q.questionNumber || (index + 1),
            q.questionType || 'MCQ',
            q.questionText || '',
            q.allowUpdateAfterSubmit !== false,
            q.allowSeeQuestionAfterSubmit !== false,
            q.questionImageUrl || '',
            q.optionA || '',
            q.optionB || '',
            q.optionC || '',
            q.optionD || '',
            q.optionE || '',
            q.optionF || '',
            q.optionG || '',
            q.optionH || '',
            q.optionI || '',
            q.optionJ || '',
            q.hasMultipleAnswers ? 'Yes' : 'No',
            q.correctAnswer || '',
            q.marks || 1,
            q.negativeMarks || 0,
            q.difficulty || 'Medium',
            q.explanation || '',
            q.enableRoughSpace !== false,
            q.wordLimit || '',
            q.enableCalculator ? 'Yes' : 'No',
            q.enableScientificCalculator ? 'Yes' : 'No',
            q.enableTable ? 'Yes' : 'No',
            q.enableSpreadsheet ? 'Yes' : 'No',
            timestamp,
            timestamp  // Updated At
          ]);
        });
        debug.push('✓ Questions saved successfully');
      } else {
        debug.push('⚠ WARNING: Exam_Questions sheet not found');
      }
    }

    debug.push('✓✓✓ CREATE EXAM SUCCESS ✓✓✓');
    return { success: true, examId: examId, createdAt: timestamp, debug: debug };
  } catch (error) {
    debug.push('✗✗✗ CREATE EXAM ERROR ✗✗✗');
    debug.push('Error: ' + error.toString());
    return { success: false, error: error.toString(), debug: debug };
  }
}

function createExamDriveFolder(examId, examTitle, batch, term, domain, subject) {
  try {

    // Main exam folder ID: 1Yf_BTC727lEG5g6tXlWPXeWP0VUDxBOj
    const mainExamFolderId = '1Yf_BTC727lEG5g6tXlWPXeWP0VUDxBOj';
    const mainExamFolder = DriveApp.getFolderById(mainExamFolderId);

    // Check if batch folder exists, create if not
    let batchFolder;
    const batchFolders = mainExamFolder.getFoldersByName(batch);
    if (batchFolders.hasNext()) {
      batchFolder = batchFolders.next();
    } else {
      batchFolder = mainExamFolder.createFolder(batch);
    }

    // Create EXAM folder inside batch folder
    let examMainFolder;
    const examMainFolders = batchFolder.getFoldersByName('EXAM');
    if (examMainFolders.hasNext()) {
      examMainFolder = examMainFolders.next();
    } else {
      examMainFolder = batchFolder.createFolder('EXAM');
    }

    // Create Term folder
    let termFolder;
    const termFolders = examMainFolder.getFoldersByName(term);
    if (termFolders.hasNext()) {
      termFolder = termFolders.next();
    } else {
      termFolder = examMainFolder.createFolder(term);
    }

    // Create Domain folder
    let domainFolder;
    const domainFolders = termFolder.getFoldersByName(domain);
    if (domainFolders.hasNext()) {
      domainFolder = domainFolders.next();
    } else {
      domainFolder = termFolder.createFolder(domain);
    }

    // Create Subject folder
    let subjectFolder;
    const subjectFolders = domainFolder.getFoldersByName(subject);
    if (subjectFolders.hasNext()) {
      subjectFolder = subjectFolders.next();
    } else {
      subjectFolder = domainFolder.createFolder(subject);
    }

    // Create exam folder with exam title (not exam ID)
    const examFolder = subjectFolder.createFolder(examTitle);

    examFolder.createFolder('Proctoring_Screenshots');
    examFolder.createFolder('Camera_Recordings');

    return { success: true, folderUrl: examFolder.getUrl() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function createExamResponseSheet(examTitle, examFolderUrl) {
  try {

    // Extract folder ID from URL
    const folderId = examFolderUrl.match(/folders\/([a-zA-Z0-9-_]+)/)[1];
    const examFolder = DriveApp.getFolderById(folderId);

    // Create new spreadsheet with exam title (not exam ID)
    const newSpreadsheet = SpreadsheetApp.create(examTitle + ' - Responses');

    const newFile = DriveApp.getFileById(newSpreadsheet.getId());

    // Move to exam folder
    newFile.moveTo(examFolder);

    // Get the first sheet and rename it
    const responseSheet = newSpreadsheet.getSheets()[0];
    responseSheet.setName('Responses');

    // Add headers
    responseSheet.appendRow([
      'Response ID', 'Student ID', 'Student Name', 'Question ID', 'Question Number',
      'Question Type', 'Question Text', 'Student Answer', 'Correct Answer', 'Is Correct',
      'Marks Awarded', 'Time Taken (seconds)', 'Marked For Review', 'Rough Work', 'Answered At'
    ]);

    // Create Status subsheet (for tracking Completed/Disqualified students)
    const statusSheet = newSpreadsheet.insertSheet('Status');
    statusSheet.appendRow([
      'Student ID', 'Student Name', 'Status', 'Timestamp',
      'Proctoring Folder', 'Screenshots Folder', 'Camera Folder',
      'Screenshot Count', 'Screenshot URLs'
    ]);

    // Format headers (done after both sheets are created to avoid interruption)
    try {
      formatExamHeaderRow(responseSheet, 15, '#10B981');
      formatExamHeaderRow(statusSheet, 9, '#34D399');
    } catch (formatError) {
      // Continue anyway - sheets are created
    }

    return { success: true, sheetUrl: newSpreadsheet.getUrl() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all exams with filters
 */
function getAllExams(filters) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');

    if (!masterSheet || masterSheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }

    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    let exams = rows.map(function(row) {
      const exam = {};
      headers.forEach(function(h, i) {
        if (h === 'Settings JSON') {
          try { exam.settings = JSON.parse(row[i] || '{}'); }
          catch (e) { exam.settings = {}; }
        } else {
          // Decode + symbols (legacy data may have URL-encoded values)
          const value = row[i];
          if (typeof value === 'string') {
            exam[h] = value.replace(/\+/g, ' ');
          } else {
            exam[h] = value;
          }
        }
      });
      return exam;
    });

    // Fix missing question counts for legacy exams
    const questionsSheet = ss.getSheetByName('Exam_Questions');
    if (questionsSheet) {
      const qData = questionsSheet.getDataRange().getValues();
      const qHeaders = qData[0];
      const qExamIdIndex = qHeaders.indexOf('Exam ID');

      exams = exams.map(function(exam) {
        // If Total Questions is 0 or missing, calculate it from questions sheet
        if (!exam['Total Questions'] || exam['Total Questions'] === 0) {
          const questionCount = qData.slice(1).filter(function(row) {
            return row[qExamIdIndex] === exam['Exam ID'];
          }).length;
          exam['Total Questions'] = questionCount;
        }
        return exam;
      });
    }

    // Apply filters
    if (filters) {
      if (filters.status) exams = exams.filter(function(e) { return e.Status === filters.status; });
      if (filters.examType) exams = exams.filter(function(e) { return e['Exam Type'] === filters.examType; });
      if (filters.term) exams = exams.filter(function(e) { return e.Term === filters.term; });
      if (filters.search) {
        const s = filters.search.toLowerCase();
        exams = exams.filter(function(e) {
          return (e['Exam Title'] || '').toLowerCase().indexOf(s) > -1 ||
                 (e.Subject || '').toLowerCase().indexOf(s) > -1;
        });
      }
    }

    return { success: true, data: exams };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get exam by ID with questions
 */
function getExamById(examId) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');

    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');
    let examRow = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][examIdIndex] === examId) {
        examRow = data[i];
        break;
      }
    }

    if (!examRow) return { success: false, error: 'Exam not found' };

    const exam = {};
    headers.forEach(function(h, i) {
      if (h === 'Settings JSON') {
        try { exam.settings = JSON.parse(examRow[i] || '{}'); }
        catch (e) { exam.settings = {}; }
      } else {
        exam[h] = examRow[i];
      }
    });

    // Get questions
    const questionsSheet = ss.getSheetByName('Exam_Questions');
    if (questionsSheet && questionsSheet.getLastRow() > 1) {
      const qData = questionsSheet.getDataRange().getValues();
      const qHeaders = qData[0];
      const qExamIdIndex = qHeaders.indexOf('Exam ID');

      exam.questions = [];
      for (let i = 1; i < qData.length; i++) {
        if (qData[i][qExamIdIndex] === examId) {
          const q = {};
          // Map column headers to camelCase field names for frontend
          qHeaders.forEach(function(h, idx) {
            const fieldMapping = {
              'Question ID': 'questionId',
              'Question Number': 'questionNumber',
              'Question Type': 'questionType',
              'Question Text': 'questionText',
              'allowUpdateAfterSubmit': 'allowUpdateAfterSubmit',
              'allowSeeQuestionAfterSubmit': 'allowSeeQuestionAfterSubmit',
              'Question Image URL': 'questionImageUrl',
              'Option A': 'optionA',
              'Option B': 'optionB',
              'Option C': 'optionC',
              'Option D': 'optionD',
              'Option E': 'optionE',
              'Option F': 'optionF',
              'Option G': 'optionG',
              'Option H': 'optionH',
              'Option I': 'optionI',
              'Option J': 'optionJ',
              'More than 1 Answer?': 'hasMultipleAnswers',
              'Correct Answer': 'correctAnswer',
              'Marks': 'marks',
              'Negative Marks': 'negativeMarks',
              'Difficulty': 'difficulty',
              'Explanation': 'explanation',
              'Enable Rough Space': 'enableRoughSpace',
              'Word Limit': 'wordLimit',
              'Enable Calculator': 'enableCalculator',
              'Enable Scientific Calculator': 'enableScientificCalculator',
              'Enable Table': 'enableTable',
              'Enable Spreadsheet': 'enableSpreadsheet'
            };
            const fieldName = fieldMapping[h] || h;
            let value = qData[i][idx];

            // Convert "Yes"/"No" to boolean for checkbox fields
            if (fieldName === 'hasMultipleAnswers' || fieldName === 'enableCalculator' ||
                fieldName === 'enableScientificCalculator' || fieldName === 'enableTable' ||
                fieldName === 'enableSpreadsheet') {
              value = value === 'Yes';
            }

            // Convert wordLimit to number if present
            if (fieldName === 'wordLimit' && value !== '' && value !== null) {
              value = parseInt(value, 10) || null;
            }

            q[fieldName] = value;
          });
          exam.questions.push(q);
        }
      }

      exam.questions.sort(function(a, b) {
        return (a.questionNumber || 0) - (b.questionNumber || 0);
      });
    } else {
      exam.questions = [];
    }

    return { success: true, data: exam };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Update exam
 */
function updateExam(examId, updates) {
  const debug = [];
  try {
    debug.push('UPDATE EXAM START');
    debug.push('Exam ID: ' + examId);
    debug.push('Opening spreadsheet...');

    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');

    if (!masterSheet) {
      debug.push('✗ Exams_Master sheet not found');
      return {
        success: false,
        message: 'Exams_Master sheet not found',
        debug: debug
      };
    }
    debug.push('✓ Sheet opened successfully');

    debug.push('Reading sheet data...');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');

    if (examIdIndex === -1) {
      debug.push('✗ Invalid sheet structure - Exam ID column not found');
      return {
        success: false,
        message: 'Invalid sheet structure',
        debug: debug
      };
    }
    debug.push('✓ Sheet data loaded');

    debug.push('Finding exam row...');
    const rowIndex = data.findIndex(row => row[examIdIndex] === examId);

    if (rowIndex === -1) {
      debug.push('✗ Exam not found with ID: ' + examId);
      return {
        success: false,
        message: 'Exam not found',
        debug: debug
      };
    }
    debug.push('✓ Found exam at row: ' + (rowIndex + 1));

    const timestamp = formatTimestampForSheets();
    const updatedBy = updates.updatedBy || 'Admin';

    debug.push('Updates received: ' + JSON.stringify(Object.keys(updates)));

    // Field name mapping from camelCase to Sheet column headers
    const fieldMapping = {
      'examTitle': 'Exam Title',
      'examType': 'Exam Type',
      'batch': 'Batch',
      'term': 'Term',
      'domain': 'Domain',
      'subject': 'Subject',
      'description': 'Description',
      'duration': 'Duration (minutes)',
      'totalMarks': 'Total Marks',
      'passingMarks': 'Passing Marks',
      'startDateTime': 'Start DateTime',
      'endDateTime': 'End DateTime',
      'instructions': 'Instructions',
      'status': 'Status',
      'passwordType': 'Password Type',
      'masterPassword': 'Master Password',
      'isPractice': 'Is Practice',
      'settings': 'Settings JSON',
      'viewResult': 'View Result',
      'deviceAllowed': 'Device Allowed'
    };

    // Update fields
    debug.push('Updating fields...');
    let fieldsUpdated = 0;
    Object.keys(updates).forEach(key => {
      // Skip internal/non-field keys
      if (key === 'updatedBy') {
        debug.push('  → Skipping: ' + key + ' (handled separately)');
        return;
      }

      // Get the sheet column name (either from mapping or use key as-is if it's already a column header)
      const sheetColumnName = fieldMapping[key] || key;
      const colIndex = headers.indexOf(sheetColumnName);

      debug.push('  → Processing: ' + key + ' → ' + sheetColumnName + ' (col index: ' + colIndex + ')');

      if (colIndex !== -1) {
        if (key === 'settings' || sheetColumnName === 'Settings JSON') {
          const settingsIndex = headers.indexOf('Settings JSON');
          masterSheet.getRange(rowIndex + 1, settingsIndex + 1).setValue(
            JSON.stringify(updates[key])
          );
          debug.push('  ✓ Updated: Settings JSON');
          fieldsUpdated++;
        } else if (key === 'isPractice') {
          // Convert boolean to Yes/No
          const value = updates[key] ? 'Yes' : 'No';
          masterSheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
          debug.push('  ✓ Updated: ' + sheetColumnName + ' = ' + value);
          fieldsUpdated++;
        } else {
          masterSheet.getRange(rowIndex + 1, colIndex + 1).setValue(updates[key]);
          debug.push('  ✓ Updated: ' + sheetColumnName + ' = ' + updates[key]);
          fieldsUpdated++;
        }
      } else {
        debug.push('  ✗ Column not found: ' + sheetColumnName);
      }
    });
    debug.push('✓ Updated ' + fieldsUpdated + ' fields');

    // Check if Drive Folder Link and Response Sheet Link are missing - create them if needed
    debug.push('Checking Drive folder and Response sheet...');
    const driveFolderIndex = headers.indexOf('Drive Folder Link');
    const responseSheetIndex = headers.indexOf('Response Sheet Link');
    const currentDriveFolder = data[rowIndex][driveFolderIndex];
    const currentResponseSheet = data[rowIndex][responseSheetIndex];

    debug.push('  Current Drive Folder: ' + (currentDriveFolder || 'MISSING'));
    debug.push('  Current Response Sheet: ' + (currentResponseSheet || 'MISSING'));

    // If Drive Folder or Response Sheet is missing, create them
    if ((!currentDriveFolder || currentDriveFolder === '') || (!currentResponseSheet || currentResponseSheet === '')) {
      debug.push('Missing resources detected - creating...');

      const examTitleIndex = headers.indexOf('Exam Title');
      const batchIndex = headers.indexOf('Batch');
      const termIndex = headers.indexOf('Term');
      const domainIndex = headers.indexOf('Domain');
      const subjectIndex = headers.indexOf('Subject');

      const examTitle = data[rowIndex][examTitleIndex] || 'Exam';
      const batch = data[rowIndex][batchIndex] || '';
      const term = data[rowIndex][termIndex] || '';
      const domain = data[rowIndex][domainIndex] || '';
      const subject = data[rowIndex][subjectIndex] || '';

      debug.push('  Exam info - Title: ' + examTitle + ', Batch: ' + batch + ', Term: ' + term);

      // Create Drive folder if missing
      if (!currentDriveFolder || currentDriveFolder === '') {
        debug.push('  Creating Drive folder...');
        const folderResult = createExamDriveFolder(examId, examTitle, batch, term, domain, subject);
        if (folderResult.success && folderResult.folderUrl) {
          masterSheet.getRange(rowIndex + 1, driveFolderIndex + 1).setValue(folderResult.folderUrl);
          debug.push('  ✓ Drive folder created: ' + folderResult.folderUrl);

          // Create Response Sheet using the newly created folder
          if (!currentResponseSheet || currentResponseSheet === '') {
            debug.push('  Creating Response sheet...');
            const sheetResult = createExamResponseSheet(examTitle, folderResult.folderUrl);
            if (sheetResult.success && sheetResult.sheetUrl) {
              masterSheet.getRange(rowIndex + 1, responseSheetIndex + 1).setValue(sheetResult.sheetUrl);
              debug.push('  ✓ Response sheet created: ' + sheetResult.sheetUrl);
            } else {
              debug.push('  ✗ Response sheet creation failed: ' + (sheetResult.error || 'Unknown error'));
            }
          }
        } else {
          debug.push('  ✗ Drive folder creation failed: ' + (folderResult.error || 'Unknown error'));
        }
      } else if (!currentResponseSheet || currentResponseSheet === '') {
        // Drive folder exists but Response Sheet is missing
        debug.push('  Drive folder exists, creating Response sheet only...');
        const sheetResult = createExamResponseSheet(examTitle, currentDriveFolder);
        if (sheetResult.success && sheetResult.sheetUrl) {
          masterSheet.getRange(rowIndex + 1, responseSheetIndex + 1).setValue(sheetResult.sheetUrl);
          debug.push('  ✓ Response sheet created: ' + sheetResult.sheetUrl);
        } else {
          debug.push('  ✗ Response sheet creation failed: ' + (sheetResult.error || 'Unknown error'));
        }
      }
    } else {
      debug.push('✓ Drive folder and Response sheet already exist');
    }

    // Update tracking fields
    debug.push('Updating tracking fields...');
    const updatedByIndex = headers.indexOf('Updated By');
    const updatedAtIndex = headers.indexOf('Updated At');

    if (updatedByIndex !== -1) {
      masterSheet.getRange(rowIndex + 1, updatedByIndex + 1).setValue(updatedBy);
      debug.push('  ✓ Updated By: ' + updatedBy);
    }
    if (updatedAtIndex !== -1) {
      masterSheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(timestamp);
      debug.push('  ✓ Updated At: ' + timestamp);
    }

    // If status changed to ACTIVE, update Published By and Published At
    if (updates.status === 'ACTIVE' || updates.Status === 'ACTIVE') {
      debug.push('Status change to ACTIVE detected...');
      const publishedByIndex = headers.indexOf('Published By');
      const publishedAtIndex = headers.indexOf('Published At');
      const statusIndex = headers.indexOf('Status');
      const currentStatus = data[rowIndex][statusIndex];

      if (currentStatus !== 'ACTIVE') {
        debug.push('  Publishing exam (was: ' + currentStatus + ')...');
        if (publishedByIndex !== -1) {
          masterSheet.getRange(rowIndex + 1, publishedByIndex + 1).setValue(updatedBy);
          debug.push('  ✓ Published By: ' + updatedBy);
        }
        if (publishedAtIndex !== -1) {
          masterSheet.getRange(rowIndex + 1, publishedAtIndex + 1).setValue(timestamp);
          debug.push('  ✓ Published At: ' + timestamp);
        }

        // Auto-generate unique passwords if Password Type is UNIQUE
        const passwordTypeIndex = headers.indexOf('Password Type');
        const batchIndex = headers.indexOf('Batch');
        const passwordType = data[rowIndex][passwordTypeIndex];
        const batchName = data[rowIndex][batchIndex];

        if (passwordType === 'UNIQUE' && batchName) {
          debug.push('  Generating UNIQUE passwords for batch: ' + batchName);
          // Generate passwords for all students in the batch
          const passwordsResult = generatePasswords(examId, 'UNIQUE', batchName);

          if (passwordsResult.success && passwordsResult.data && passwordsResult.data.length > 0) {
            debug.push('  ✓ Generated ' + passwordsResult.data.length + ' passwords');
            // Save passwords to Exam_Passwords sheet
            const saveResult = savePasswords(examId, passwordsResult.data);

            if (!saveResult.success) {
              debug.push('  ✗ Failed to save passwords: ' + (saveResult.error || 'Unknown error'));
            } else {
              debug.push('  ✓ Passwords saved successfully');
            }
          } else if (!passwordsResult.success) {
            debug.push('  ✗ Password generation failed: ' + (passwordsResult.error || 'Unknown error'));
          }
        }
      } else {
        debug.push('  Already ACTIVE - no publishing needed');
      }
    }

    // Handle questions update if provided
    if (updates.questions && Array.isArray(updates.questions)) {
      debug.push('Updating questions (' + updates.questions.length + ' questions)...');
      const questionsSheet = ss.getSheetByName('Exam_Questions');
      if (questionsSheet) {
        // Delete existing questions for this exam
        deleteRowsByExamId(questionsSheet, examId);
        debug.push('  ✓ Deleted existing questions');

        // Add updated questions
        updates.questions.forEach(function(q, index) {
          const questionId = q.questionId || ('Q_' + Date.now() + '_' + index);
          questionsSheet.appendRow([
            questionId,
            examId,
            q.questionNumber || (index + 1),
            q.questionType || 'MCQ',
            q.questionText || '',
            q.allowUpdateAfterSubmit !== false,
            q.allowSeeQuestionAfterSubmit !== false,
            q.questionImageUrl || '',
            q.optionA || '',
            q.optionB || '',
            q.optionC || '',
            q.optionD || '',
            q.optionE || '',
            q.optionF || '',
            q.optionG || '',
            q.optionH || '',
            q.optionI || '',
            q.optionJ || '',
            q.hasMultipleAnswers ? 'Yes' : 'No',
            q.correctAnswer || '',
            q.marks || 1,
            q.negativeMarks || 0,
            q.difficulty || 'Medium',
            q.explanation || '',
            q.enableRoughSpace !== false,
            q.wordLimit || '',
            q.enableCalculator ? 'Yes' : 'No',
            q.enableScientificCalculator ? 'Yes' : 'No',
            q.enableTable ? 'Yes' : 'No',
            q.enableSpreadsheet ? 'Yes' : 'No',
            timestamp,
            timestamp  // Updated At
          ]);
        });
        debug.push('  ✓ Added ' + updates.questions.length + ' questions');

        // Update total questions count in master sheet
        updateExamQuestionCount(examId);
        debug.push('  ✓ Updated question count in master sheet');
      } else {
        debug.push('  ✗ Exam_Questions sheet not found');
      }
    }

    debug.push('✓✓✓ UPDATE EXAM SUCCESS ✓✓✓');
    return {
      success: true,
      message: 'Exam updated successfully',
      debug: debug
    };

  } catch (error) {
    debug.push('✗✗✗ UPDATE EXAM ERROR ✗✗✗');
    debug.push('Error: ' + error.toString());
    return {
      success: false,
      message: 'Failed to update exam',
      error: error.toString(),
      debug: debug
    };
  }
}

/**
 * Delete exam and all associated data
 */
function deleteExam(examId) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);

    // Get exam details before deleting (to find Drive folder and Response Sheet)
    const masterSheet = ss.getSheetByName('Exams_Master');
    let driveFolderLink = '';
    let responseSheetName = '';

    if (masterSheet) {
      const data = masterSheet.getDataRange().getValues();
      const headers = data[0];
      const examIdIndex = headers.indexOf('Exam ID');
      const driveLinkIndex = headers.indexOf('Drive Folder Link');
      const rowIndex = data.findIndex(row => row[examIdIndex] === examId);

      if (rowIndex !== -1) {
        if (driveLinkIndex !== -1) {
          driveFolderLink = data[rowIndex][driveLinkIndex];
        }
        responseSheetName = examId + '_Answers';

        // Delete row from master sheet
        masterSheet.deleteRow(rowIndex + 1);
      }
    }

    // Delete Response Sheet if exists
    if (responseSheetName) {
      const responseSheet = ss.getSheetByName(responseSheetName);
      if (responseSheet) {
        ss.deleteSheet(responseSheet);
      }
    }

    // Delete Drive folder if exists
    if (driveFolderLink) {
      try {
        const folderId = driveFolderLink.split('/').pop();
        const folder = DriveApp.getFolderById(folderId);
        folder.setTrashed(true);
      } catch (e) {
        // Folder may not exist or already deleted
      }
    }

    // Delete questions for this exam
    const questionsSheet = ss.getSheetByName('Exam_Questions');
    if (questionsSheet) {
      deleteRowsByExamId(questionsSheet, examId);
    }

    // Delete responses for this exam
    const responsesSheet = ss.getSheetByName('Exam_Responses');
    if (responsesSheet) {
      deleteRowsByExamId(responsesSheet, examId);
    }

    // Delete passwords for this exam
    const passwordsSheet = ss.getSheetByName('Exam_Passwords');
    if (passwordsSheet) {
      deleteRowsByExamId(passwordsSheet, examId);
    }

    // Delete proctoring logs for this exam
    const proctoringSheet = ss.getSheetByName('Exam_Proctoring');
    if (proctoringSheet) {
      deleteRowsByExamId(proctoringSheet, examId);
    }

    // Delete analytics for this exam
    const analyticsSheet = ss.getSheetByName('Exam_Analytics');
    if (analyticsSheet) {
      deleteRowsByExamId(analyticsSheet, examId);
    }

    return {
      success: true,
      message: 'Exam and all associated data deleted successfully (Drive folder moved to trash)'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete exam',
      error: error.toString()
    };
  }
}

/**
 * Helper: Delete all rows for a specific exam ID
 */
function deleteRowsByExamId(sheet, examId) {
  if (sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const examIdIndex = headers.indexOf('Exam ID');

  if (examIdIndex === -1) return;

  // Delete from bottom to top to avoid index shifting
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][examIdIndex] === examId) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * Add question to exam
 */
function addQuestion(examId, questionData) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const questionsSheet = ss.getSheetByName('Exam_Questions');

    if (!questionsSheet) {
      return {
        success: false,
        message: 'Exam_Questions sheet not found'
      };
    }

    const questionId = 'Q_' + Date.now();
    const timestamp = formatTimestampForSheets();

    // Get next question number for this exam
    const data = questionsSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');

    const examQuestions = data.slice(1).filter(row => row[examIdIndex] === examId);
    const questionNumber = examQuestions.length + 1;

    const rowData = [
      questionId,
      examId,
      questionNumber,
      questionData.questionType || 'MCQ',
      questionData.questionText || '',
      questionData.allowUpdateAfterSubmit !== false, // Default: true
      questionData.allowSeeQuestionAfterSubmit !== false, // Default: true
      questionData.questionImageUrl || '',
      questionData.optionA || '',
      questionData.optionB || '',
      questionData.optionC || '',
      questionData.optionD || '',
      questionData.optionE || '',
      questionData.optionF || '',
      questionData.optionG || '',
      questionData.optionH || '',
      questionData.optionI || '',
      questionData.optionJ || '',
      questionData.hasMultipleAnswers ? 'Yes' : 'No',
      questionData.correctAnswer || '',
      questionData.marks || 1,
      questionData.negativeMarks || 0,
      questionData.difficulty || 'MEDIUM',
      questionData.explanation || '',
      questionData.enableRoughSpace !== false,
      timestamp,
      timestamp
    ];

    questionsSheet.appendRow(rowData);

    // Update total questions count in master sheet
    updateExamQuestionCount(examId);

    return {
      success: true,
      message: 'Question added successfully',
      questionId: questionId,
      questionNumber: questionNumber
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to add question',
      error: error.toString()
    };
  }
}

/**
 * Update question
 */
function updateExamQuestion(examId, questionId, updates) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const questionsSheet = ss.getSheetByName('Exam_Questions');

    if (!questionsSheet) {
      return {
        success: false,
        message: 'Exam_Questions sheet not found'
      };
    }

    const data = questionsSheet.getDataRange().getValues();
    const headers = data[0];
    const qIdIndex = headers.indexOf('Question ID');
    const rowIndex = data.findIndex(row => row[qIdIndex] === questionId);

    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Question not found'
      };
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        questionsSheet.getRange(rowIndex + 1, colIndex + 1).setValue(updates[key]);
      }
    });

    // Update timestamp
    const updatedAtIndex = headers.indexOf('Updated At');
    questionsSheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(formatTimestampForSheets());

    return {
      success: true,
      message: 'Question updated successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to update question',
      error: error.toString()
    };
  }
}

/**
 * Delete an exam question
 */
function deleteExamQuestion(examId, questionId) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const questionsSheet = ss.getSheetByName('Exam_Questions');

    if (!questionsSheet) {
      return {
        success: false,
        message: 'Exam_Questions sheet not found'
      };
    }

    const data = questionsSheet.getDataRange().getValues();
    const headers = data[0];
    const qIdIndex = headers.indexOf('Question ID');
    const rowIndex = data.findIndex(row => row[qIdIndex] === questionId);

    if (rowIndex !== -1) {
      questionsSheet.deleteRow(rowIndex + 1);

      // Renumber remaining questions for this exam
      renumberQuestionsForExam(examId);

      // Update total questions count
      updateExamQuestionCount(examId);
    }

    return {
      success: true,
      message: 'Question deleted successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete question',
      error: error.toString()
    };
  }
}

/**
 * Reorder questions
 */
function reorderQuestions(examId, questionOrder) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const questionsSheet = ss.getSheetByName('Exam_Questions');

    if (!questionsSheet) {
      return {
        success: false,
        message: 'Exam_Questions sheet not found'
      };
    }

    const data = questionsSheet.getDataRange().getValues();
    const headers = data[0];
    const qIdIndex = headers.indexOf('Question ID');
    const qNumIndex = headers.indexOf('Question Number');

    // Update question numbers based on new order
    questionOrder.forEach((questionId, index) => {
      const rowIndex = data.findIndex(row => row[qIdIndex] === questionId);
      if (rowIndex !== -1) {
        questionsSheet.getRange(rowIndex + 1, qNumIndex + 1).setValue(index + 1);
      }
    });

    return {
      success: true,
      message: 'Questions reordered successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to reorder questions',
      error: error.toString()
    };
  }
}

/**
 * Helper: Renumber questions for a specific exam
 */
function renumberQuestionsForExam(examId) {
  const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
  const questionsSheet = ss.getSheetByName('Exam_Questions');

  if (!questionsSheet || questionsSheet.getLastRow() < 2) return;

  const data = questionsSheet.getDataRange().getValues();
  const headers = data[0];
  const examIdIndex = headers.indexOf('Exam ID');
  const qNumIndex = headers.indexOf('Question Number');

  // Get all questions for this exam
  const examQuestions = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][examIdIndex] === examId) {
      examQuestions.push({ rowIndex: i + 1, currentNumber: data[i][qNumIndex] });
    }
  }

  // Sort by current number and renumber
  examQuestions.sort((a, b) => a.currentNumber - b.currentNumber);
  examQuestions.forEach((q, index) => {
    questionsSheet.getRange(q.rowIndex, qNumIndex + 1).setValue(index + 1);
  });
}

/**
 * Helper: Update total question count in master sheet
 */
function updateExamQuestionCount(examId) {
  const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
  const masterSheet = ss.getSheetByName('Exams_Master');
  const questionsSheet = ss.getSheetByName('Exam_Questions');

  if (!masterSheet || !questionsSheet) return;

  // Count questions for this exam
  const qData = questionsSheet.getDataRange().getValues();
  const qHeaders = qData[0];
  const qExamIdIndex = qHeaders.indexOf('Exam ID');
  const questionCount = qData.slice(1).filter(row => row[qExamIdIndex] === examId).length;

  // Update in master sheet
  const mData = masterSheet.getDataRange().getValues();
  const mHeaders = mData[0];
  const mExamIdIndex = mHeaders.indexOf('Exam ID');
  const totalQIndex = mHeaders.indexOf('Total Questions');
  const rowIndex = mData.findIndex(row => row[mExamIdIndex] === examId);

  if (rowIndex !== -1 && totalQIndex !== -1) {
    masterSheet.getRange(rowIndex + 1, totalQIndex + 1).setValue(questionCount);
  }
}

/**
 * Generate unique passwords for students
 */
/**
 * Get students from Batch List subsheet in exam spreadsheet
 * @param {string} batchName - The batch name to filter students
 * @returns {Array} Array of student objects with email, name, and roll number
 */
function getStudentsFromBatchList(batchName) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const batchListSheet = ss.getSheetByName('Batch List');

    if (!batchListSheet) {
      return {
        success: false,
        message: 'Batch List sheet not found'
      };
    }

    const data = batchListSheet.getDataRange().getValues();
    const headers = data[0];
    const batchIndex = headers.indexOf('Batch');
    const emailIndex = headers.indexOf('Student Email');
    const nameIndex = headers.indexOf('Full Name');
    const rollNoIndex = headers.indexOf('Roll No');

    if (batchIndex === -1 || emailIndex === -1) {
      return {
        success: false,
        message: 'Invalid Batch List sheet structure'
      };
    }

    // Filter students by batch name
    const students = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][batchIndex] === batchName) {
        students.push({
          email: data[i][emailIndex],
          name: data[i][nameIndex] || '',
          rollNo: data[i][rollNoIndex] || ''
        });
      }
    }

    return {
      success: true,
      data: students
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to get students from Batch List',
      error: error.toString()
    };
  }
}

/**
 * Generate passwords for exam
 * - For SAME type: returns empty array (master password is stored in exam row)
 * - For UNIQUE type: reads students from Batch List and generates unique passwords
 * @param {string} examId - The exam ID
 * @param {string} passwordType - SAME or UNIQUE
 * @param {string} batchName - The batch name for filtering students (required for UNIQUE)
 * @returns {Object} Response with passwords array
 */
function generatePasswords(examId, passwordType, batchName) {
  try {
    // If SAME password type, no need to generate unique passwords
    if (passwordType === 'SAME') {
      return {
        success: true,
        data: [],
        message: 'SAME password type - master password should be stored in exam row'
      };
    }

    // For UNIQUE type, get students from Batch List
    if (passwordType === 'UNIQUE') {
      if (!batchName) {
        return {
          success: false,
          message: 'Batch name is required for UNIQUE password type'
        };
      }

      const studentsResult = getStudentsFromBatchList(batchName);
      if (!studentsResult.success) {
        return studentsResult;
      }

      const students = studentsResult.data;
      const passwords = [];

      // Generate unique password for each student
      students.forEach(function(student) {
        passwords.push({
          studentEmail: student.email,
          studentName: student.name,
          studentId: student.rollNo,
          password: generateSecurePassword(8)
        });
      });

      return {
        success: true,
        data: passwords
      };
    }

    return {
      success: false,
      message: 'Invalid password type'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate passwords',
      error: error.toString()
    };
  }
}

/**
 * Save passwords to sheet
 */
function savePasswords(examId, passwordData) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const passwordsSheet = ss.getSheetByName('Exam_Passwords');

    if (!passwordsSheet) {
      return {
        success: false,
        message: 'Exam_Passwords sheet not found'
      };
    }

    const timestamp = formatTimestampForSheets();

    passwordData.forEach(entry => {
      const passwordId = 'PWD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const rowData = [
        passwordId,
        examId,
        entry.studentId || '',
        entry.studentName || '',
        entry.studentEmail || '',
        entry.password,
        timestamp,
        '',
        'PENDING',
        false,
        ''
      ];
      passwordsSheet.appendRow(rowData);
    });

    return {
      success: true,
      message: passwordData.length + ' passwords saved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to save passwords',
      error: error.toString()
    };
  }
}

/**
 * Helper: Generate secure random password
 */
function generateSecurePassword(length) {
  length = length || 8;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Update exam statistics in Exams_Master
 * Called after student submits exam response
 * Updates: Total Students Attempted, Average Score, Highest Score, Lowest Score
 */
function updateExamStatistics(examId) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');
    const attemptsSheet = ss.getSheetByName('Exam_Attempts');

    // Find exam row in Exams_Master
    const masterData = masterSheet.getDataRange().getValues();
    let examRow = -1;
    for (let i = 1; i < masterData.length; i++) {
      if (masterData[i][0] === examId) {
        examRow = i + 1; // Convert to 1-indexed
        break;
      }
    }

    if (examRow === -1) {
      return { success: false, error: 'Exam not found' };
    }

    // Get all completed attempts for this exam from Exam_Attempts
    const attemptsData = attemptsSheet.getDataRange().getValues();
    const attemptsHeaders = attemptsData[0];
    const examIdIndex = attemptsHeaders.indexOf('Exam ID');
    const statusIndex = attemptsHeaders.indexOf('Status');
    const scoreIndex = attemptsHeaders.indexOf('Score');
    const studentEmailIndex = attemptsHeaders.indexOf('Student Email');

    const examAttempts = [];
    for (let i = 1; i < attemptsData.length; i++) {
      if (attemptsData[i][examIdIndex] === examId && attemptsData[i][statusIndex] === 'COMPLETED') {
        examAttempts.push({
          studentEmail: attemptsData[i][studentEmailIndex],
          totalScore: attemptsData[i][scoreIndex] || 0
        });
      }
    }

    // Calculate statistics
    const totalStudentsAttempted = examAttempts.length;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;

    if (totalStudentsAttempted > 0) {
      const scores = examAttempts.map(r => r.totalScore);
      const sum = scores.reduce((a, b) => a + b, 0);
      averageScore = sum / totalStudentsAttempted;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // Update Exams_Master
    // Columns: Total Questions (27), Total Students Attempted (28), Average Score (29), Highest Score (30), Lowest Score (31)
    masterSheet.getRange(examRow, 28).setValue(totalStudentsAttempted);
    masterSheet.getRange(examRow, 29).setValue(Math.round(averageScore * 100) / 100);
    masterSheet.getRange(examRow, 30).setValue(highestScore);
    masterSheet.getRange(examRow, 31).setValue(lowestScore);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Helper function to format exam header rows
 */
function formatExamHeaderRow(sheet, columnCount, color) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground(color)
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, columnCount);
}

// ============================================================================
// EXAM ATTEMPT & PROCTORING APIS
// ============================================================================

/**
 * Verify exam password
 */
function verifyExamPassword(examId, password, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');
    
    if (!masterSheet) {
      return { success: false, message: 'Exams sheet not found' };
    }

    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');
    const passwordTypeIndex = headers.indexOf('Password Type');
    const masterPasswordIndex = headers.indexOf('Master Password');
    
    const examRow = data.findIndex(row => row[examIdIndex] === examId);
    
    if (examRow === -1) {
      return { success: false, message: 'Exam not found' };
    }

    const passwordType = String(data[examRow][passwordTypeIndex] || '').trim().toUpperCase();
    const masterPassword = String(data[examRow][masterPasswordIndex] || '').trim();
    const inputPassword = String(password || '').trim();

    // Check password based on type
    if (passwordType === 'SAME' || passwordType === 'MASTER' || passwordType === '') {
      // Compare as strings, trimmed
      if (inputPassword === masterPassword) {
        return { success: true, message: 'Password verified' };
      } else {
        return { success: false, message: 'Incorrect password' };
      }
    } else if (passwordType === 'UNIQUE') {
      // Check student-specific password from Exam_Passwords sheet
      const passwordsSheet = ss.getSheetByName('Exam_Passwords');
      if (!passwordsSheet) {
        return { success: false, message: 'Passwords sheet not found' };
      }

      const passwordData = passwordsSheet.getDataRange().getValues();
      const passwordHeaders = passwordData[0];
      const pExamIdIndex = passwordHeaders.indexOf('Exam ID');
      const studentEmailIndex = passwordHeaders.indexOf('Student Email');
      const studentPasswordIndex = passwordHeaders.indexOf('Password');

      const studentPasswordRow = passwordData.findIndex(row =>
        row[pExamIdIndex] === examId &&
        String(row[studentEmailIndex] || '').trim().toLowerCase() === studentEmail.toLowerCase()
      );

      if (studentPasswordRow === -1) {
        return { success: false, message: 'Student password not found' };
      }

      const studentPassword = String(passwordData[studentPasswordRow][studentPasswordIndex] || '').trim();
      if (inputPassword === studentPassword) {
        return { success: true, message: 'Password verified' };
      } else {
        return { success: false, message: 'Incorrect password' };
      }
    }

    return { success: false, message: 'Invalid password type: ' + passwordType };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get saved answers for an attempt
 */
function getSavedAnswersForAttempt(ss, attemptId) {
  const answersSheet = ss.getSheetByName('Exam_Answers');
  if (!answersSheet || answersSheet.getLastRow() < 2) {
    return [];
  }

  const data = answersSheet.getDataRange().getValues();
  const headers = data[0];
  const attemptIdIndex = headers.indexOf('Attempt ID');
  const questionIdIndex = headers.indexOf('Question ID');
  const answerIndex = headers.indexOf('Answer');
  const submittedIndex = headers.indexOf('Submitted');

  const savedAnswers = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][attemptIdIndex] === attemptId) {
      savedAnswers.push({
        questionId: data[i][questionIdIndex],
        answer: data[i][answerIndex] || '',
        submitted: data[i][submittedIndex] === true || data[i][submittedIndex] === 'TRUE'
      });
    }
  }

  return savedAnswers;
}

/**
 * Start exam attempt (or resume existing one)
 */
function startExamAttempt(examId, studentEmail, studentName) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const attemptsSheet = getOrCreateSheet(ss, 'Exam_Attempts', [
      'Attempt ID', 'Exam ID', 'Student Email', 'Student Name',
      'Start Time', 'End Time', 'Status', 'Time Spent (seconds)',
      'Score', 'Total Marks', 'Percentage', 'Violations Count',
      'Proctoring Folder Link', 'Screenshots Folder Link', 'Camera Folder Link',
      'Created At'
    ]);

    const timestamp = formatTimestampForSheets();

    // Check for existing IN_PROGRESS attempt
    const attemptsData = attemptsSheet.getDataRange().getValues();
    const attemptsHeaders = attemptsData[0];
    const attemptIdColIndex = attemptsHeaders.indexOf('Attempt ID');
    const examIdColIndex = attemptsHeaders.indexOf('Exam ID');
    const emailColIndex = attemptsHeaders.indexOf('Student Email');
    const statusColIndex = attemptsHeaders.indexOf('Status');
    const startTimeColIndex = attemptsHeaders.indexOf('Start Time');
    const proctoringFolderColIndex = attemptsHeaders.indexOf('Proctoring Folder Link');
    const screenshotsFolderColIndex = attemptsHeaders.indexOf('Screenshots Folder Link');
    const cameraFolderColIndex = attemptsHeaders.indexOf('Camera Folder Link');

    // Check if exam is already completed or disqualified (not allowed to reattempt)
    for (let i = 1; i < attemptsData.length; i++) {
      if (attemptsData[i][examIdColIndex] === examId &&
          attemptsData[i][emailColIndex] === studentEmail &&
          (attemptsData[i][statusColIndex] === 'COMPLETED' || attemptsData[i][statusColIndex] === 'DISQUALIFIED')) {
        return {
          success: false,
          alreadySubmitted: true,
          status: attemptsData[i][statusColIndex],
          message: 'You have already submitted this exam and cannot reattempt it.'
        };
      }
    }

    // Find existing in-progress attempt (allowed to resume)
    let existingAttempt = null;
    for (let i = 1; i < attemptsData.length; i++) {
      if (attemptsData[i][examIdColIndex] === examId &&
          attemptsData[i][emailColIndex] === studentEmail &&
          attemptsData[i][statusColIndex] === 'IN_PROGRESS') {
        existingAttempt = {
          attemptId: attemptsData[i][attemptIdColIndex],
          startTime: attemptsData[i][startTimeColIndex],
          proctoringFolderLink: attemptsData[i][proctoringFolderColIndex] || '',
          screenshotsFolderLink: attemptsData[i][screenshotsFolderColIndex] || '',
          cameraFolderLink: attemptsData[i][cameraFolderColIndex] || ''
        };
        break;
      }
    }

    // If existing attempt found, get saved answers and generate fresh URIs
    if (existingAttempt) {
      const savedAnswers = getSavedAnswersForAttempt(ss, existingAttempt.attemptId);

      // Generate fresh batch of URIs for resumed attempt
      let webcamUploadUris = [];
      let screenUploadUris = [];

      // Get the student's screenshot folders and generate URIs
      const masterSheet = ss.getSheetByName('Exams_Master');
      if (masterSheet) {
        const data = masterSheet.getDataRange().getValues();
        const headers = data[0];
        const examIdIndex = headers.indexOf('Exam ID');
        const driveLinkIndex = headers.indexOf('Drive Folder Link');
        const examRow = data.findIndex(row => row[examIdIndex] === examId);

        if (examRow !== -1) {
          const driveFolderUrl = data[examRow][driveLinkIndex];
          if (driveFolderUrl) {
            const folderIdMatch = driveFolderUrl.match(/[-\w]{25,}/);
            if (folderIdMatch) {
              const examFolder = DriveApp.getFolderById(folderIdMatch[0]);
              const sanitizedEmail = studentEmail.replace(/[@.]/g, '_');

              // Find or create student screenshot folders
              const proctoringFolders = examFolder.getFoldersByName('Proctoring_Screenshots');
              if (proctoringFolders.hasNext()) {
                const proctoringFolder = proctoringFolders.next();
                const studentFolders = proctoringFolder.getFoldersByName(sanitizedEmail);
                if (studentFolders.hasNext()) {
                  const studentFolder = studentFolders.next();

                  // Get or create Webcam folder
                  let webcamFolder;
                  const webcamFolders = studentFolder.getFoldersByName('Webcam');
                  if (webcamFolders.hasNext()) {
                    webcamFolder = webcamFolders.next();
                  } else {
                    webcamFolder = studentFolder.createFolder('Webcam');
                  }

                  // Get or create Screen_Share folder
                  let screenShareFolder;
                  const screenShareFolders = studentFolder.getFoldersByName('Screen_Share');
                  if (screenShareFolders.hasNext()) {
                    screenShareFolder = screenShareFolders.next();
                  } else {
                    screenShareFolder = studentFolder.createFolder('Screen_Share');
                  }

                  // Generate batch URIs for resumed attempt
                  webcamUploadUris = generateBatchUris(webcamFolder.getId(), 20, 'webcam');
                  screenUploadUris = generateBatchUris(screenShareFolder.getId(), 10, 'screen');
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        resumed: true,
        attemptId: existingAttempt.attemptId,
        startTime: existingAttempt.startTime,
        proctoringFolderLink: existingAttempt.proctoringFolderLink,
        screenshotsFolderLink: existingAttempt.screenshotsFolderLink,
        cameraFolderLink: existingAttempt.cameraFolderLink,
        savedAnswers: savedAnswers,
        webcamUploadUris: webcamUploadUris,
        screenUploadUris: screenUploadUris
      };
    }

    // No existing attempt, create a new one
    const attemptId = 'ATTEMPT_' + Date.now();

    // Get exam folder from Exams_Master
    const masterSheet = ss.getSheetByName('Exams_Master');
    let proctoringFolderLink = '';
    let screenshotsFolderLink = '';
    let cameraFolderLink = '';
    let webcamUploadUris = [];
    let screenUploadUris = [];

    if (masterSheet) {
      const data = masterSheet.getDataRange().getValues();
      const headers = data[0];
      const examIdIndex = headers.indexOf('Exam ID');
      const driveLinkIndex = headers.indexOf('Drive Folder Link');

      const examRow = data.findIndex(row => row[examIdIndex] === examId);

      if (examRow !== -1) {
        const driveFolderUrl = data[examRow][driveLinkIndex];
        if (driveFolderUrl) {
          const folderIdMatch = driveFolderUrl.match(/[-\w]{25,}/);
          if (folderIdMatch) {
            const examFolder = DriveApp.getFolderById(folderIdMatch[0]);
            const sanitizedEmail = studentEmail.replace(/[@.]/g, '_');

            // Create student folder in Proctoring_Screenshots
            let proctoringFolder;
            const proctoringFolders = examFolder.getFoldersByName('Proctoring_Screenshots');
            if (proctoringFolders.hasNext()) {
              proctoringFolder = proctoringFolders.next();
            } else {
              proctoringFolder = examFolder.createFolder('Proctoring_Screenshots');
            }

            let studentScreenshotsFolder;
            const studentScreenshotsFolders = proctoringFolder.getFoldersByName(sanitizedEmail);
            if (studentScreenshotsFolders.hasNext()) {
              studentScreenshotsFolder = studentScreenshotsFolders.next();
            } else {
              studentScreenshotsFolder = proctoringFolder.createFolder(sanitizedEmail);
            }
            screenshotsFolderLink = studentScreenshotsFolder.getUrl();

            // Create Webcam and Screen_Share subfolders for batch URI uploads
            let webcamFolder;
            const webcamFolders = studentScreenshotsFolder.getFoldersByName('Webcam');
            if (webcamFolders.hasNext()) {
              webcamFolder = webcamFolders.next();
            } else {
              webcamFolder = studentScreenshotsFolder.createFolder('Webcam');
            }

            let screenShareFolder;
            const screenShareFolders = studentScreenshotsFolder.getFoldersByName('Screen_Share');
            if (screenShareFolders.hasNext()) {
              screenShareFolder = screenShareFolders.next();
            } else {
              screenShareFolder = studentScreenshotsFolder.createFolder('Screen_Share');
            }

            // Generate batch resumable upload URIs for direct browser uploads
            // Start with fewer URIs to reduce initial load time (30 URIs ~= 5 seconds)
            // The frontend will request more URIs as needed via requestMoreUris endpoint
            // Webcam: 20 URIs (enough for ~20 minutes at 60s intervals)
            // Screen: 10 URIs (enough for ~30 minutes at 3-min intervals)
            webcamUploadUris = generateBatchUris(webcamFolder.getId(), 20, 'webcam');
            screenUploadUris = generateBatchUris(screenShareFolder.getId(), 10, 'screen');

            // Create student folder in Camera_Recordings
            let cameraFolder;
            const cameraFolders = examFolder.getFoldersByName('Camera_Recordings');
            if (cameraFolders.hasNext()) {
              cameraFolder = cameraFolders.next();
            } else {
              cameraFolder = examFolder.createFolder('Camera_Recordings');
            }

            let studentCameraFolder;
            const studentCameraFolders = cameraFolder.getFoldersByName(sanitizedEmail);
            if (studentCameraFolders.hasNext()) {
              studentCameraFolder = studentCameraFolders.next();
            } else {
              studentCameraFolder = cameraFolder.createFolder(sanitizedEmail);
            }
            cameraFolderLink = studentCameraFolder.getUrl();

            proctoringFolderLink = examFolder.getUrl();
          }
        }
      }
    }

    attemptsSheet.appendRow([
      attemptId,
      examId,
      studentEmail,
      studentName || '',
      timestamp,
      '', // End Time
      'IN_PROGRESS',
      0, // Time Spent
      0, // Score
      0, // Total Marks
      0, // Percentage
      0, // Violations Count
      proctoringFolderLink,
      screenshotsFolderLink,
      cameraFolderLink,
      timestamp
    ]);

    return {
      success: true,
      attemptId: attemptId,
      startTime: timestamp,
      proctoringFolderLink: proctoringFolderLink,
      screenshotsFolderLink: screenshotsFolderLink,
      cameraFolderLink: cameraFolderLink,
      // Batch resumable URIs for direct browser-to-Drive uploads
      webcamUploadUris: webcamUploadUris,
      screenUploadUris: screenUploadUris
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Save student answer
 * @param {string} attemptId - The attempt ID
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 * @param {string} answer - The student's answer
 * @param {boolean} submitted - Whether the answer is submitted (final) or just saved as progress
 */
function saveAnswer(attemptId, examId, questionId, answer, submitted) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const answersSheet = getOrCreateSheet(ss, 'Exam_Answers', [
      'Attempt ID', 'Exam ID', 'Question ID', 'Answer', 'Submitted',
      'Is Correct', 'Marks Awarded', 'Timestamp'
    ]);

    const timestamp = formatTimestampForSheets();
    const isSubmitted = submitted === true;

    // Check if answer already exists for this attempt and question
    const data = answersSheet.getDataRange().getValues();
    const headers = data[0];
    const attemptIdIndex = headers.indexOf('Attempt ID');
    const questionIdIndex = headers.indexOf('Question ID');
    const answerIndex = headers.indexOf('Answer');
    const submittedIndex = headers.indexOf('Submitted');
    const timestampIndex = headers.indexOf('Timestamp');

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][attemptIdIndex] === attemptId && data[i][questionIdIndex] === questionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // Update existing answer
      answersSheet.getRange(rowIndex, answerIndex + 1).setValue(answer);
      // Only update submitted to TRUE, never back to FALSE (once submitted, always submitted)
      if (isSubmitted && submittedIndex !== -1) {
        answersSheet.getRange(rowIndex, submittedIndex + 1).setValue(true);
      }
      answersSheet.getRange(rowIndex, timestampIndex + 1).setValue(timestamp);
    } else {
      // Add new answer
      answersSheet.appendRow([
        attemptId,
        examId,
        questionId,
        answer,
        isSubmitted, // Submitted flag
        '', // Is Correct - to be filled on final exam submission
        '', // Marks Awarded - to be filled on final exam submission
        timestamp
      ]);
    }

    return { success: true, message: 'Answer saved', submitted: isSubmitted };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Log proctoring violation
 */
function logViolation(attemptId, examId, studentEmail, violationType, details) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const proctoringSheet = getOrCreateSheet(ss, 'Exam_Proctoring', [
      'Attempt ID', 'Exam ID', 'Student Email', 'Violation Type',
      'Details', 'Timestamp', 'Severity'
    ]);

    const timestamp = formatTimestampForSheets();

    // Determine severity based on violation type
    let severity = 'MEDIUM';
    if (['fullscreen_exit', 'tab_switch', 'window_blur'].includes(violationType)) {
      severity = 'HIGH';
    } else if (['copy', 'paste', 'right_click'].includes(violationType)) {
      severity = 'MEDIUM';
    } else {
      severity = 'LOW';
    }

    proctoringSheet.appendRow([
      attemptId,
      examId,
      studentEmail,
      violationType,
      details,
      timestamp,
      severity
    ]);

    // Update violation count in Exam_Attempts
    const attemptsSheet = ss.getSheetByName('Exam_Attempts');
    if (attemptsSheet) {
      const attemptsData = attemptsSheet.getDataRange().getValues();
      const attemptsHeaders = attemptsData[0];
      const attemptsIdIndex = attemptsHeaders.indexOf('Attempt ID');
      const violationsCountIndex = attemptsHeaders.indexOf('Violations Count');

      const attemptRow = attemptsData.findIndex(row => row[attemptsIdIndex] === attemptId);
      if (attemptRow > 0) {
        const currentCount = attemptsData[attemptRow][violationsCountIndex] || 0;
        attemptsSheet.getRange(attemptRow + 1, violationsCountIndex + 1).setValue(currentCount + 1);
      }
    }

    return { success: true, message: 'Violation logged' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Upload screenshot
 */
function uploadScreenshot(attemptId, examId, studentEmail, screenshotBase64, type, source) {
  try {
    // Default source to 'webcam' for backward compatibility
    const screenshotSource = source || 'webcam';

    // Get exam folder from Exams_Master
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');

    if (!masterSheet) {
      return { success: false, message: 'Exams sheet not found' };
    }

    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');
    const driveLinkIndex = headers.indexOf('Drive Folder Link');

    const examRow = data.findIndex(row => row[examIdIndex] === examId);

    if (examRow === -1) {
      return { success: false, message: 'Exam not found' };
    }

    const driveFolderUrl = data[examRow][driveLinkIndex];
    if (!driveFolderUrl) {
      return { success: false, message: 'Exam folder not found' };
    }

    // Extract folder ID from URL
    const folderIdMatch = driveFolderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      return { success: false, message: 'Invalid folder URL' };
    }

    const examFolder = DriveApp.getFolderById(folderIdMatch[0]);

    // Get or create Proctoring_Screenshots folder (should exist from exam creation)
    let proctoringFolder;
    const proctoringFolders = examFolder.getFoldersByName('Proctoring_Screenshots');
    if (proctoringFolders.hasNext()) {
      proctoringFolder = proctoringFolders.next();
    } else {
      // Fallback: create if it doesn't exist
      proctoringFolder = examFolder.createFolder('Proctoring_Screenshots');
    }

    // Create student subfolder within Proctoring_Screenshots
    const sanitizedEmail = studentEmail.replace(/[@.]/g, '_');
    let studentFolder;
    const studentFolders = proctoringFolder.getFoldersByName(sanitizedEmail);
    if (studentFolders.hasNext()) {
      studentFolder = studentFolders.next();
    } else {
      studentFolder = proctoringFolder.createFolder(sanitizedEmail);
    }

    // Create separate subfolders for webcam and screen share screenshots
    let targetFolder;
    if (screenshotSource === 'screen') {
      const screenFolders = studentFolder.getFoldersByName('Screen_Share');
      if (screenFolders.hasNext()) {
        targetFolder = screenFolders.next();
      } else {
        targetFolder = studentFolder.createFolder('Screen_Share');
      }
    } else {
      const webcamFolders = studentFolder.getFoldersByName('Webcam');
      if (webcamFolders.hasNext()) {
        targetFolder = webcamFolders.next();
      } else {
        targetFolder = studentFolder.createFolder('Webcam');
      }
    }

    // Decode base64 and save image with source prefix
    const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
    const filename = screenshotSource + '_' + type + '_' + Date.now() + '.jpg';
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      filename
    );

    const file = targetFolder.createFile(blob);
    const fileUrl = file.getUrl();

    // Log in Exam_Screenshots sheet with source
    const screenshotsSheet = getOrCreateSheet(ss, 'Exam_Screenshots', [
      'Attempt ID', 'Exam ID', 'Student Email', 'Screenshot URL',
      'Timestamp', 'Type', 'Source'
    ]);

    screenshotsSheet.appendRow([
      attemptId,
      examId,
      studentEmail,
      fileUrl,
      formatTimestampForSheets(),
      type || 'PERIODIC',
      screenshotSource.toUpperCase()
    ]);

    return {
      success: true,
      screenshotUrl: fileUrl
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// OPTIMIZED SCREENSHOT UPLOAD - BATCH RESUMABLE URIs
// ============================================================================
// This approach bypasses Apps Script for actual uploads by generating
// pre-authorized Google Drive resumable upload URIs. The browser can then
// upload directly to Drive without authentication.
//
// Benefits:
// - Reduces Apps Script API calls from 252,000 to ~400 (for 200 students)
// - Browser uploads directly to Drive (no base64 encoding overhead)
// - Scales to unlimited students
// ============================================================================

/**
 * Create a single resumable upload URI for Google Drive
 * This URI can be used by the browser to upload directly without authentication
 * @param {string} folderId - The Drive folder ID to upload to
 * @param {string} filename - The filename for the uploaded file
 * @returns {string|null} - The resumable upload URI or null on error
 */
function createResumableUri(folderId, filename) {
  try {
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

    const metadata = {
      name: filename,
      parents: [folderId]
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'image/jpeg'
      },
      payload: JSON.stringify(metadata),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      // The resumable URI is in the Location header
      const headers = response.getAllHeaders();
      return headers['Location'] || headers['location'] || null;
    }

    console.log('Failed to create resumable URI:', response.getContentText());
    return null;
  } catch (error) {
    console.log('Error creating resumable URI:', error.toString());
    return null;
  }
}

/**
 * Generate a batch of resumable upload URIs
 * @param {string} folderId - The Drive folder ID
 * @param {number} count - Number of URIs to generate
 * @param {string} prefix - Filename prefix (e.g., 'webcam', 'screen')
 * @returns {string[]} - Array of resumable upload URIs
 */
function generateBatchUris(folderId, count, prefix) {
  const uris = [];
  const timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    const filename = prefix + '_' + timestamp + '_' + i + '.jpg';
    const uri = createResumableUri(folderId, filename);
    if (uri) {
      uris.push(uri);
    }
  }

  return uris;
}

/**
 * Request additional upload URIs when the initial batch runs out
 * Called by frontend when URIs are exhausted during a long exam
 */
function requestMoreUris(examId, studentEmail, type, count) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);

    // Get exam folder from Exams_Master
    const masterSheet = ss.getSheetByName('Exams_Master');
    if (!masterSheet) {
      return { success: false, message: 'Exams sheet not found' };
    }

    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const examIdIndex = headers.indexOf('Exam ID');
    const driveLinkIndex = headers.indexOf('Drive Folder Link');

    const examRow = data.findIndex(row => row[examIdIndex] === examId);
    if (examRow === -1) {
      return { success: false, message: 'Exam not found' };
    }

    const driveFolderUrl = data[examRow][driveLinkIndex];
    if (!driveFolderUrl) {
      return { success: false, message: 'Exam folder not found' };
    }

    // Extract folder ID from URL
    const folderIdMatch = driveFolderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) {
      return { success: false, message: 'Invalid folder URL' };
    }

    const examFolder = DriveApp.getFolderById(folderIdMatch[0]);
    const sanitizedEmail = studentEmail.replace(/[@.]/g, '_');

    // Get Proctoring_Screenshots folder
    const proctoringFolders = examFolder.getFoldersByName('Proctoring_Screenshots');
    if (!proctoringFolders.hasNext()) {
      return { success: false, message: 'Proctoring folder not found' };
    }
    const proctoringFolder = proctoringFolders.next();

    // Get student folder
    const studentFolders = proctoringFolder.getFoldersByName(sanitizedEmail);
    if (!studentFolders.hasNext()) {
      return { success: false, message: 'Student folder not found' };
    }
    const studentFolder = studentFolders.next();

    // Get target folder (Webcam or Screen_Share)
    let targetFolder;
    if (type === 'screen') {
      const screenFolders = studentFolder.getFoldersByName('Screen_Share');
      if (screenFolders.hasNext()) {
        targetFolder = screenFolders.next();
      } else {
        targetFolder = studentFolder.createFolder('Screen_Share');
      }
    } else {
      const webcamFolders = studentFolder.getFoldersByName('Webcam');
      if (webcamFolders.hasNext()) {
        targetFolder = webcamFolders.next();
      } else {
        targetFolder = studentFolder.createFolder('Webcam');
      }
    }

    // Generate new batch of URIs
    const uris = generateBatchUris(targetFolder.getId(), count || 50, type);

    return {
      success: true,
      uris: uris,
      count: uris.length
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Submit exam - Calculate score and finalize
 */
function submitExam(attemptId, examId, studentEmail, answers, violations, timeSpent) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    
    // Get exam details
    const masterSheet = ss.getSheetByName('Exams_Master');
    const questionsSheet = ss.getSheetByName('Exam_Questions');
    const attemptsSheet = ss.getSheetByName('Exam_Attempts');
    
    if (!masterSheet || !questionsSheet || !attemptsSheet) {
      return { success: false, message: 'Required sheets not found' };
    }

    // Get exam data
    const masterData = masterSheet.getDataRange().getValues();
    const masterHeaders = masterData[0];
    const examIdIndex = masterHeaders.indexOf('Exam ID');
    const totalMarksIndex = masterHeaders.indexOf('Total Marks');
    const settingsIndex = masterHeaders.indexOf('Settings JSON');
    
    const examRow = masterData.findIndex(row => row[examIdIndex] === examId);
    if (examRow === -1) {
      return { success: false, message: 'Exam not found' };
    }

    const totalMarks = masterData[examRow][totalMarksIndex] || 0;
    const settingsJson = masterData[examRow][settingsIndex];
    let settings = {};
    try {
      settings = JSON.parse(settingsJson);
    } catch (e) {
      settings = {};
    }

    // Get all questions for this exam
    const questionsData = questionsSheet.getDataRange().getValues();
    const questionsHeaders = questionsData[0];
    const qExamIdIndex = questionsHeaders.indexOf('Exam ID');
    const qQuestionIdIndex = questionsHeaders.indexOf('Question ID');
    const qQuestionTypeIndex = questionsHeaders.indexOf('Question Type');
    const qCorrectAnswerIndex = questionsHeaders.indexOf('Correct Answer');
    const qMarksIndex = questionsHeaders.indexOf('Marks');
    const qNegativeMarksIndex = questionsHeaders.indexOf('Negative Marks');
    const qHasMultipleAnswersIndex = questionsHeaders.indexOf('More than 1 Answer?');

    const examQuestions = questionsData.slice(1).filter(row => row[qExamIdIndex] === examId);

    // Calculate score
    let totalScore = 0;
    const answersSheet = ss.getSheetByName('Exam_Answers');
    
    // Save all answers and calculate score
    if (answers && Array.isArray(answers)) {
      answers.forEach(function(ans) {
        // Find question details
        const questionRow = examQuestions.find(q => q[qQuestionIdIndex] === ans.questionId);
        if (!questionRow) return;

        const questionType = questionRow[qQuestionTypeIndex];
        const correctAnswer = questionRow[qCorrectAnswerIndex];
        const marks = questionRow[qMarksIndex] || 0;
        const negativeMarks = questionRow[qNegativeMarksIndex] || 0;
        const hasMultipleAnswers = questionRow[qHasMultipleAnswersIndex] === 'Yes';

        let isCorrect = false;
        let marksAwarded = 0;

        // Only auto-grade MCQ questions
        if (questionType === 'MCQ' || questionType === 'MCQ_IMAGE') {
          if (ans.answer) {
            if (hasMultipleAnswers) {
              // For multiple correct answers, compare sorted arrays
              const studentAnswers = ans.answer.split(',').map(a => a.trim().toUpperCase()).sort().join(',');
              const correctAnswers = correctAnswer.split(',').map(a => a.trim().toUpperCase()).sort().join(',');

              if (studentAnswers === correctAnswers) {
                isCorrect = true;
                marksAwarded = marks;
                totalScore += marks;
              } else if (settings.enableNegativeMarking) {
                marksAwarded = -negativeMarks;
                totalScore -= negativeMarks;
              }
            } else {
              // Single correct answer
              if (ans.answer.toUpperCase() === correctAnswer.toUpperCase()) {
                isCorrect = true;
                marksAwarded = marks;
                totalScore += marks;
              } else if (settings.enableNegativeMarking) {
                marksAwarded = -negativeMarks;
                totalScore -= negativeMarks;
              }
            }
          }
        }

        // Save or update answer with grading (including submitted status)
        saveAnswerWithGrading(ss, attemptId, examId, ans.questionId, ans.answer, ans.submitted, isCorrect, marksAwarded);
      });
    }

    // Save violations
    if (violations && Array.isArray(violations)) {
      violations.forEach(function(v) {
        logViolation(attemptId, examId, studentEmail, v.type, v.details);
      });
    }

    // Determine if student is disqualified based on violations
    let isDisqualified = false;
    const violationCount = violations ? violations.length : 0;
    const maxViolations = settings?.proctoring?.maxViolationsBeforeAction || 5;
    const disqualifyOnViolation = settings?.proctoring?.disqualifyOnViolation || false;

    if (disqualifyOnViolation && violationCount >= maxViolations) {
      isDisqualified = true;
    }

    // Update attempt record
    const attemptsData = attemptsSheet.getDataRange().getValues();
    const attemptsHeaders = attemptsData[0];
    const attemptIdIndex = attemptsHeaders.indexOf('Attempt ID');
    const endTimeIndex = attemptsHeaders.indexOf('End Time');
    const statusIndex = attemptsHeaders.indexOf('Status');
    const timeSpentIndex = attemptsHeaders.indexOf('Time Spent (seconds)');
    const scoreIndex = attemptsHeaders.indexOf('Score');
    const totalMarksColIndex = attemptsHeaders.indexOf('Total Marks');
    const percentageIndex = attemptsHeaders.indexOf('Percentage');

    const attemptRow = attemptsData.findIndex(row => row[attemptIdIndex] === attemptId);
    if (attemptRow > 0) {
      const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
      const attemptStatus = isDisqualified ? 'DISQUALIFIED' : 'COMPLETED';

      attemptsSheet.getRange(attemptRow + 1, endTimeIndex + 1).setValue(formatTimestampForSheets());
      attemptsSheet.getRange(attemptRow + 1, statusIndex + 1).setValue(attemptStatus);
      attemptsSheet.getRange(attemptRow + 1, timeSpentIndex + 1).setValue(timeSpent || 0);
      attemptsSheet.getRange(attemptRow + 1, scoreIndex + 1).setValue(totalScore);
      attemptsSheet.getRange(attemptRow + 1, totalMarksColIndex + 1).setValue(totalMarks);
      attemptsSheet.getRange(attemptRow + 1, percentageIndex + 1).setValue(Math.round(percentage * 100) / 100);
    }

    // Update exam statistics
    updateExamStatistics(examId);

    // Write responses to Response Sheet Link
    try {
      const responseSheetLinkIndex = masterHeaders.indexOf('Response Sheet Link');
      const responseSheetUrl = masterData[examRow][responseSheetLinkIndex];

      if (responseSheetUrl && responseSheetUrl.trim() !== '') {
        // Get student info from attempt
        const studentEmailIndex = attemptsHeaders.indexOf('Student Email');
        const studentNameIndex = attemptsHeaders.indexOf('Student Name');
        const proctoringFolderIndex = attemptsHeaders.indexOf('Proctoring Folder Link');
        const screenshotsFolderIndex = attemptsHeaders.indexOf('Screenshots Folder Link');
        const cameraFolderIndex = attemptsHeaders.indexOf('Camera Folder Link');

        const studentEmail = attemptsData[attemptRow][studentEmailIndex] || '';
        const studentName = attemptsData[attemptRow][studentNameIndex] || '';
        const studentId = studentEmail.split('@')[0]; // Extract student ID from email
        const proctoringFolderLink = attemptsData[attemptRow][proctoringFolderIndex] || '';
        const screenshotsFolderLink = attemptsData[attemptRow][screenshotsFolderIndex] || '';
        const cameraFolderLink = attemptsData[attemptRow][cameraFolderIndex] || '';

        // Get all screenshot URLs for this attempt
        const screenshotsSheet = ss.getSheetByName('Exam_Screenshots');
        let screenshotUrls = [];
        if (screenshotsSheet) {
          const screenshotsData = screenshotsSheet.getDataRange().getValues();
          const screenshotsHeaders = screenshotsData[0];
          const sAttemptIdIndex = screenshotsHeaders.indexOf('Attempt ID');
          const sUrlIndex = screenshotsHeaders.indexOf('Screenshot URL');

          screenshotUrls = screenshotsData
            .slice(1)
            .filter(row => row[sAttemptIdIndex] === attemptId)
            .map(row => row[sUrlIndex])
            .filter(url => url);
        }

        writeResponsesToSheet(
          responseSheetUrl,
          attemptId,
          studentId,
          studentName,
          answers,
          examQuestions,
          questionsHeaders,
          isDisqualified,
          proctoringFolderLink,
          screenshotsFolderLink,
          cameraFolderLink,
          screenshotUrls
        );
      }
    } catch (responseError) {
      // Don't fail the whole submission if Response Sheet writing fails
      Logger.log('Error writing to Response Sheet: ' + responseError.toString());
    }

    // End the exam session so student can take other exams on different devices
    try {
      endExamSessionByStudent(examId, studentEmail);
    } catch (sessionError) {
      // Don't fail submission if session ending fails
      Logger.log('Error ending exam session: ' + sessionError.toString());
    }

    return {
      success: true,
      score: totalScore,
      totalMarks: totalMarks,
      percentage: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100 * 100) / 100 : 0,
      message: 'Exam submitted successfully'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Write student responses to the exam's Response Sheet
 */
function writeResponsesToSheet(responseSheetUrl, attemptId, studentId, studentName, answers, examQuestions, questionsHeaders, isDisqualified, proctoringFolderLink, screenshotsFolderLink, cameraFolderLink, screenshotUrls) {
  try {
    // Extract spreadsheet ID from URL
    const match = responseSheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return;
    }

    const spreadsheetId = match[1];
    const responseSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const responseSheet = responseSpreadsheet.getSheetByName('Responses');

    if (!responseSheet) {
      return;
    }

    // Get question header indices
    const qQuestionIdIndex = questionsHeaders.indexOf('Question ID');
    const qQuestionNumberIndex = questionsHeaders.indexOf('Question Number');
    const qQuestionTypeIndex = questionsHeaders.indexOf('Question Type');
    const qQuestionTextIndex = questionsHeaders.indexOf('Question Text');
    const qCorrectAnswerIndex = questionsHeaders.indexOf('Correct Answer');
    const qMarksIndex = questionsHeaders.indexOf('Marks');

    // Response Sheet headers:
    // 'Response ID', 'Student ID', 'Student Name', 'Question ID', 'Question Number',
    // 'Question Type', 'Question Text', 'Student Answer', 'Correct Answer', 'Is Correct',
    // 'Marks Awarded', 'Time Taken (seconds)', 'Marked For Review', 'Rough Work', 'Answered At'

    const timestamp = formatTimestampForSheets();

    // Write each answer as a row
    if (answers && Array.isArray(answers)) {
      answers.forEach(function(ans) {
        // Find question details
        const questionRow = examQuestions.find(q => q[qQuestionIdIndex] === ans.questionId);
        if (!questionRow) return;

        const questionType = questionRow[qQuestionTypeIndex] || '';
        const questionText = questionRow[qQuestionTextIndex] || '';
        const questionNumber = questionRow[qQuestionNumberIndex] || '';
        const correctAnswer = questionRow[qCorrectAnswerIndex] || '';
        const marks = questionRow[qMarksIndex] || 0;

        // Check if correct
        let isCorrect = false;
        let marksAwarded = 0;
        if (questionType === 'MCQ' || questionType === 'MCQ_IMAGE') {
          if (ans.answer && ans.answer.toUpperCase() === correctAnswer.toUpperCase()) {
            isCorrect = true;
            marksAwarded = marks;
          }
        }

        const responseId = attemptId + '_' + ans.questionId;

        responseSheet.appendRow([
          responseId,
          studentId,
          studentName,
          ans.questionId,
          questionNumber,
          questionType,
          questionText,
          ans.answer || '',
          correctAnswer,
          isCorrect ? 'Yes' : 'No',
          marksAwarded,
          ans.timeSpent || 0,
          ans.markedForReview ? 'Yes' : 'No',
          ans.roughWork || '',
          timestamp
        ]);
      });
    }

    // Update Status subsheet
    try {
      let statusSheet = responseSpreadsheet.getSheetByName('Status');

      // Create Status sheet if it doesn't exist
      if (!statusSheet) {
        statusSheet = responseSpreadsheet.insertSheet('Status');
        statusSheet.appendRow([
          'Student ID', 'Student Name', 'Status', 'Timestamp',
          'Proctoring Folder', 'Screenshots Folder', 'Camera Folder',
          'Screenshot Count', 'Screenshot URLs'
        ]);
        // Format header row
        const headerRange = statusSheet.getRange(1, 1, 1, 9);
        headerRange.setBackground('#34D399');
        headerRange.setFontWeight('bold');
        headerRange.setFontColor('#FFFFFF');
      }

      // Check if student already has a status entry
      const statusData = statusSheet.getDataRange().getValues();
      const statusHeaders = statusData[0];
      const statusStudentIdIndex = statusHeaders.indexOf('Student ID');
      const statusNameIndex = statusHeaders.indexOf('Student Name');
      const statusStatusIndex = statusHeaders.indexOf('Status');
      const statusTimestampIndex = statusHeaders.indexOf('Timestamp');
      const statusProctoringIndex = statusHeaders.indexOf('Proctoring Folder');
      const statusScreenshotsIndex = statusHeaders.indexOf('Screenshots Folder');
      const statusCameraIndex = statusHeaders.indexOf('Camera Folder');
      const statusScreenshotCountIndex = statusHeaders.indexOf('Screenshot Count');
      const statusScreenshotUrlsIndex = statusHeaders.indexOf('Screenshot URLs');

      let existingRow = -1;
      for (let i = 1; i < statusData.length; i++) {
        if (statusData[i][statusStudentIdIndex] === studentId) {
          existingRow = i + 1; // Sheet rows are 1-indexed
          break;
        }
      }

      const statusTimestamp = formatTimestampForSheets();
      const status = isDisqualified ? 'Disqualified' : 'Completed';
      const screenshotCount = screenshotUrls ? screenshotUrls.length : 0;
      const screenshotUrlsString = screenshotUrls ? screenshotUrls.join('\n') : '';

      if (existingRow !== -1) {
        // Update existing row
        statusSheet.getRange(existingRow, statusStatusIndex + 1).setValue(status);
        statusSheet.getRange(existingRow, statusTimestampIndex + 1).setValue(statusTimestamp);

        // Update proctoring folder links if columns exist
        if (statusProctoringIndex !== -1) {
          statusSheet.getRange(existingRow, statusProctoringIndex + 1).setValue(proctoringFolderLink || '');
        }
        if (statusScreenshotsIndex !== -1) {
          statusSheet.getRange(existingRow, statusScreenshotsIndex + 1).setValue(screenshotsFolderLink || '');
        }
        if (statusCameraIndex !== -1) {
          statusSheet.getRange(existingRow, statusCameraIndex + 1).setValue(cameraFolderLink || '');
        }
        if (statusScreenshotCountIndex !== -1) {
          statusSheet.getRange(existingRow, statusScreenshotCountIndex + 1).setValue(screenshotCount);
        }
        if (statusScreenshotUrlsIndex !== -1) {
          statusSheet.getRange(existingRow, statusScreenshotUrlsIndex + 1).setValue(screenshotUrlsString);
        }
      } else {
        // Add new row
        statusSheet.appendRow([
          studentId,
          studentName,
          status,
          statusTimestamp,
          proctoringFolderLink || '',
          screenshotsFolderLink || '',
          cameraFolderLink || '',
          screenshotCount,
          screenshotUrlsString
        ]);
      }

    } catch (statusError) {
      // Don't fail the whole operation if Status update fails
    }

  } catch (error) {
    throw error;
  }
}

/**
 * Helper: Save answer with grading info
 * @param {object} ss - Spreadsheet instance
 * @param {string} attemptId - The attempt ID
 * @param {string} examId - The exam ID
 * @param {string} questionId - The question ID
 * @param {string} answer - The student's answer
 * @param {boolean} submitted - Whether the answer was submitted (final) or just saved
 * @param {boolean} isCorrect - Whether the answer is correct (for MCQ)
 * @param {number} marksAwarded - Marks awarded for this answer
 */
function saveAnswerWithGrading(ss, attemptId, examId, questionId, answer, submitted, isCorrect, marksAwarded) {
  const answersSheet = ss.getSheetByName('Exam_Answers');
  if (!answersSheet) return;

  const data = answersSheet.getDataRange().getValues();
  const headers = data[0];
  const attemptIdIndex = headers.indexOf('Attempt ID');
  const questionIdIndex = headers.indexOf('Question ID');
  const answerIndex = headers.indexOf('Answer');
  const submittedIndex = headers.indexOf('Submitted');
  const isCorrectIndex = headers.indexOf('Is Correct');
  const marksAwardedIndex = headers.indexOf('Marks Awarded');
  const timestampIndex = headers.indexOf('Timestamp');

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][attemptIdIndex] === attemptId && data[i][questionIdIndex] === questionId) {
      rowIndex = i + 1;
      break;
    }
  }

  const timestamp = formatTimestampForSheets();
  const isSubmitted = submitted === true;

  if (rowIndex > 0) {
    // Update existing
    answersSheet.getRange(rowIndex, answerIndex + 1).setValue(answer || '');
    if (submittedIndex !== -1) {
      // Only update submitted to TRUE, never back to FALSE
      if (isSubmitted) {
        answersSheet.getRange(rowIndex, submittedIndex + 1).setValue(true);
      }
    }
    answersSheet.getRange(rowIndex, isCorrectIndex + 1).setValue(isCorrect ? 'YES' : 'NO');
    answersSheet.getRange(rowIndex, marksAwardedIndex + 1).setValue(marksAwarded);
    answersSheet.getRange(rowIndex, timestampIndex + 1).setValue(timestamp);
  } else {
    // Add new - column order: Attempt ID, Exam ID, Question ID, Answer, Submitted, Is Correct, Marks Awarded, Timestamp
    answersSheet.appendRow([
      attemptId,
      examId,
      questionId,
      answer || '',
      isSubmitted,
      isCorrect ? 'YES' : 'NO',
      marksAwarded,
      timestamp
    ]);
  }
}

/**
 * Get exam result for student
 */
function getExamResult(attemptId, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const attemptsSheet = ss.getSheetByName('Exam_Attempts');
    const answersSheet = ss.getSheetByName('Exam_Answers');
    const proctoringSheet = ss.getSheetByName('Exam_Proctoring');
    
    if (!attemptsSheet) {
      return { success: false, message: 'Attempts sheet not found' };
    }

    // Get attempt details
    const attemptsData = attemptsSheet.getDataRange().getValues();
    const attemptsHeaders = attemptsData[0];
    const attemptIdIndex = attemptsHeaders.indexOf('Attempt ID');
    const studentEmailIndex = attemptsHeaders.indexOf('Student Email');
    
    const attemptRow = attemptsData.findIndex(row => 
      row[attemptIdIndex] === attemptId && row[studentEmailIndex] === studentEmail
    );

    if (attemptRow === -1) {
      return { success: false, message: 'Attempt not found' };
    }

    // Get exam details to check if it's a practice exam
    const examId = attemptsData[attemptRow][attemptsHeaders.indexOf('Exam ID')];
    const masterSheet = ss.getSheetByName('Exams_Master');
    let isPractice = false;
    if (masterSheet) {
      const masterData = masterSheet.getDataRange().getValues();
      const masterHeaders = masterData[0];
      const examIdIndex = masterHeaders.indexOf('Exam ID');
      const isPracticeIndex = masterHeaders.indexOf('Is Practice');
      const examRow = masterData.findIndex(row => row[examIdIndex] === examId);
      if (examRow !== -1 && isPracticeIndex !== -1) {
        isPractice = masterData[examRow][isPracticeIndex] === 'Yes';
      }
    }

    // Build result object
    const result = {
      attemptId: attemptsData[attemptRow][attemptIdIndex],
      examId: examId,
      isPractice: isPractice,
      studentEmail: attemptsData[attemptRow][studentEmailIndex],
      studentName: attemptsData[attemptRow][attemptsHeaders.indexOf('Student Name')],
      startTime: attemptsData[attemptRow][attemptsHeaders.indexOf('Start Time')],
      endTime: attemptsData[attemptRow][attemptsHeaders.indexOf('End Time')],
      status: attemptsData[attemptRow][attemptsHeaders.indexOf('Status')],
      timeSpent: attemptsData[attemptRow][attemptsHeaders.indexOf('Time Spent (seconds)')],
      score: attemptsData[attemptRow][attemptsHeaders.indexOf('Score')],
      totalMarks: attemptsData[attemptRow][attemptsHeaders.indexOf('Total Marks')],
      percentage: attemptsData[attemptRow][attemptsHeaders.indexOf('Percentage')],
      violationsCount: attemptsData[attemptRow][attemptsHeaders.indexOf('Violations Count')]
    };

    // Get Response Sheet Link from Exams_Master
    let responseSheetLink = null;
    if (masterSheet) {
      const masterData = masterSheet.getDataRange().getValues();
      const masterHeaders = masterData[0];
      const mExamIdIndex = masterHeaders.indexOf('Exam ID');
      const mResponseSheetIndex = masterHeaders.indexOf('Response Sheet Link');


      const examRow = masterData.findIndex(row => row[mExamIdIndex] === examId);
      if (examRow !== -1 && mResponseSheetIndex !== -1) {
        responseSheetLink = masterData[examRow][mResponseSheetIndex];
      } else {
      }
    }

    // Get questions from Exam_Questions sheet
    const questionsSheet = ss.getSheetByName('Exam_Questions');
    let questionsMap = {};
    if (questionsSheet) {
      const questionsData = questionsSheet.getDataRange().getValues();
      const questionsHeaders = questionsData[0];
      const qExamIdIndex = questionsHeaders.indexOf('Exam ID');
      const qQuestionIdIndex = questionsHeaders.indexOf('Question ID');
      const qQuestionNumberIndex = questionsHeaders.indexOf('Question Number');
      const qQuestionTextIndex = questionsHeaders.indexOf('Question Text');
      const qQuestionTypeIndex = questionsHeaders.indexOf('Question Type');
      const qCorrectAnswerIndex = questionsHeaders.indexOf('Correct Answer');
      const qMarksIndex = questionsHeaders.indexOf('Marks');

      questionsData.slice(1)
        .filter(row => row[qExamIdIndex] === examId)
        .forEach(row => {
          questionsMap[row[qQuestionIdIndex]] = {
            questionNumber: row[qQuestionNumberIndex],
            questionText: row[qQuestionTextIndex],
            questionType: row[qQuestionTypeIndex],
            correctAnswer: row[qCorrectAnswerIndex],
            marks: row[qMarksIndex]
          };
        });
    }

    // Get student answers from Response Sheet (filtered by Attempt ID)
    result.answers = [];
    if (responseSheetLink) {
      try {
        const responseSheet = SpreadsheetApp.openByUrl(responseSheetLink).getSheets()[0];
        const responseData = responseSheet.getDataRange().getValues();
        const responseHeaders = responseData[0];


        const rResponseIdIndex = responseHeaders.indexOf('Response ID');
        const rStudentIdIndex = responseHeaders.indexOf('Student ID');
        const rQuestionIdIndex = responseHeaders.indexOf('Question ID');
        const rQuestionNumberIndex = responseHeaders.indexOf('Question Number');
        const rQuestionTypeIndex = responseHeaders.indexOf('Question Type');
        const rQuestionTextIndex = responseHeaders.indexOf('Question Text');
        const rStudentAnswerIndex = responseHeaders.indexOf('Student Answer');
        const rCorrectAnswerIndex = responseHeaders.indexOf('Correct Answer');
        const rIsCorrectIndex = responseHeaders.indexOf('Is Correct');
        const rMarksAwardedIndex = responseHeaders.indexOf('Marks Awarded');


        // Filter by Response ID (Response ID format: ATTEMPT_ID_QUESTION_ID)
        const filteredRows = responseData.slice(1).filter(row => {
          const responseId = row[rResponseIdIndex];
          return responseId && responseId.toString().startsWith(attemptId);
        });

        result.answers = filteredRows.map(row => {
            const questionId = row[rQuestionIdIndex];
            const questionInfo = questionsMap[questionId] || {};
            return {
              questionId: questionId,
              questionNumber: row[rQuestionNumberIndex] || questionInfo.questionNumber || 0,
              questionText: row[rQuestionTextIndex] || questionInfo.questionText || '',
              questionType: row[rQuestionTypeIndex] || questionInfo.questionType || '',
              answer: row[rStudentAnswerIndex] || '',
              correctAnswer: row[rCorrectAnswerIndex] || questionInfo.correctAnswer || '',
              isCorrect: row[rIsCorrectIndex] === 'Yes' || row[rIsCorrectIndex] === true,
              marks: questionInfo.marks || 0,
              marksAwarded: row[rMarksAwardedIndex] || 0,
              flagged: false
            };
          });

      } catch (error) {
      }
    } else {
    }

    // Get violations
    if (proctoringSheet) {
      const proctoringData = proctoringSheet.getDataRange().getValues();
      const proctoringHeaders = proctoringData[0];
      const pAttemptIdIndex = proctoringHeaders.indexOf('Attempt ID');
      
      result.violations = proctoringData.slice(1)
        .filter(row => row[pAttemptIdIndex] === attemptId)
        .map(row => ({
          type: row[proctoringHeaders.indexOf('Violation Type')],
          details: row[proctoringHeaders.indexOf('Details')],
          timestamp: row[proctoringHeaders.indexOf('Timestamp')],
          severity: row[proctoringHeaders.indexOf('Severity')]
        }));
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get student's exam attempts
 */
function getStudentAttempts(studentEmail, examId) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const attemptsSheet = ss.getSheetByName('Exam_Attempts');

    if (!attemptsSheet) {
      return { success: true, data: [] };
    }

    const data = attemptsSheet.getDataRange().getValues();
    const headers = data[0];
    const attempts = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const attemptObj = {};

      // Map columns to object
      headers.forEach((header, index) => {
        attemptObj[header] = row[index];
      });

      // Filter by student email and optionally by examId
      if (attemptObj['Student Email'] === studentEmail) {
        if (!examId || attemptObj['Exam ID'] === examId) {
          attempts.push(attemptObj);
        }
      }
    }

    return { success: true, data: attempts };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get student exam status from Status subsheet in Response sheet
 * @param {string} examId - The exam ID
 * @param {string} studentEmail - Student's email address
 * @return {Object} Status data with status and timestamp
 */
function getStudentExamStatus(examId, studentEmail) {
  try {

    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const masterSheet = ss.getSheetByName('Exams_Master');

    if (!masterSheet) {
      return { success: false, message: 'Exams_Master sheet not found' };
    }

    // Get Response Sheet Link from Exams_Master
    const masterData = masterSheet.getDataRange().getValues();
    const masterHeaders = masterData[0];
    const examIdIndex = masterHeaders.indexOf('Exam ID');
    const responseSheetLinkIndex = masterHeaders.indexOf('Response Sheet Link');

    if (examIdIndex === -1 || responseSheetLinkIndex === -1) {
      return { success: false, message: 'Required columns not found in Exams_Master' };
    }

    const examRow = masterData.findIndex(row => row[examIdIndex] === examId);
    if (examRow === -1) {
      return { success: false, message: 'Exam not found' };
    }

    const responseSheetUrl = masterData[examRow][responseSheetLinkIndex];

    if (!responseSheetUrl || responseSheetUrl.trim() === '') {
      // No response sheet means no status yet
      return { success: true, data: { status: null, timestamp: null } };
    }

    // Open the Response Sheet
    let responseSpreadsheet;
    try {
      responseSpreadsheet = SpreadsheetApp.openByUrl(responseSheetUrl);
    } catch (error) {
      return { success: true, data: { status: null, timestamp: null } };
    }

    // Look for Status subsheet
    const statusSheet = responseSpreadsheet.getSheetByName('Status');

    if (!statusSheet) {
      // Status sheet doesn't exist yet
      return { success: true, data: { status: null, timestamp: null } };
    }

    const statusData = statusSheet.getDataRange().getValues();
    if (statusData.length <= 1) {
      // Only headers, no data
      return { success: true, data: { status: null, timestamp: null } };
    }

    const statusHeaders = statusData[0];
    const studentIdIndex = statusHeaders.indexOf('Student ID');
    const statusIndex = statusHeaders.indexOf('Status');
    const timestampIndex = statusHeaders.indexOf('Timestamp');

    if (studentIdIndex === -1 || statusIndex === -1) {
      return { success: false, message: 'Required columns not found in Status sheet' };
    }

    // Find student's status row
    const statusRow = statusData.findIndex(row => row[studentIdIndex] === studentEmail);

    if (statusRow === -1) {
      // Student hasn't completed or been disqualified yet
      return { success: true, data: { status: null, timestamp: null } };
    }

    const status = statusData[statusRow][statusIndex];
    const timestamp = timestampIndex !== -1 ? statusData[statusRow][timestampIndex] : null;

    return {
      success: true,
      data: {
        status: status,
        timestamp: timestamp
      }
    };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Helper: Get or create sheet with headers
 */
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    formatExamHeaderRow(sheet, headers.length, '#2D6A4F');
  }
  return sheet;
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


    // Get the main placement resume folder
    const mainFolder = DriveApp.getFolderById(PLACEMENT_RESUME_FOLDER_ID);

    // Create or get Batch folder
    const batchFolder = getOrCreateFolder(mainFolder, batch);

    // Create or get Student Name folder
    const studentFolder = getOrCreateFolder(batchFolder, studentName);

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


    // Decode base64 data
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, 'application/pdf', newFileName);

    // Check if file already exists and delete it (check for the new filename pattern)
    const existingFiles = studentFolder.getFilesByName(newFileName);
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      file.setTrashed(true);
    }

    // Upload the new file
    const uploadedFile = studentFolder.createFile(blob);

    // Set sharing permissions - anyone with link can view
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the file URL
    const fileUrl = uploadedFile.getUrl();

    // Update the student profile with the new resume URL
    const updateData = {};
    updateData[`domain${domainNumber}ResumeURL`] = fileUrl;

    const updateResult = updateStudentProfile(studentEmail, updateData);
    if (!updateResult.success) {
    }

    return {
      success: true,
      fileUrl: fileUrl,
      message: 'Resume uploaded successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ================================================================================================
// EXAM DROPDOWN DATA APIs
// ================================================================================================

/**
 * Get term structure from Exam Term sheet (for Exam Builder)
 * Returns: { terms: [], domains: [], subjects: [], batches: [], mappings: [] }
 */
function getTermStructureExam() {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const termSheet = ss.getSheetByName('Exam Term');

    if (!termSheet || termSheet.getLastRow() < 2) {
      return {
        success: true,
        data: {
          terms: [],
          domains: [],
          subjects: [],
          batches: [],
          mappings: []
        }
      };
    }

    const data = termSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Extract unique values
    const terms = new Set();
    const domains = new Set();
    const subjects = new Set();
    const batches = new Set();
    const mappings = [];

    // Find column indices
    const batchIdx = headers.indexOf('Batch');
    const termIdx = headers.indexOf('Term');
    const domainIdx = headers.indexOf('Domain');
    const subjectIdx = headers.indexOf('Subject');

    rows.forEach(function(row) {
      const batch = row[batchIdx];
      const term = row[termIdx];
      const domain = row[domainIdx];
      const subject = row[subjectIdx];

      if (term) terms.add(term);
      if (domain) domains.add(domain);
      if (subject) subjects.add(subject);
      if (batch) batches.add(batch);

      if (term && domain && subject) {
        mappings.push({
          batch: batch || '',
          term: term,
          domain: domain,
          subject: subject
        });
      }
    });

    return {
      success: true,
      data: {
        terms: Array.from(terms).sort(),
        domains: Array.from(domains).sort(),
        subjects: Array.from(subjects).sort(),
        batches: Array.from(batches).sort(),
        mappings: mappings
      }
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get exam types from CATEGORY&TYPE sheet
 */
function getExamTypes() {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const categorySheet = ss.getSheetByName('Exam Category');

    if (!categorySheet || categorySheet.getLastRow() < 2) {
      // Return default exam types if sheet doesn't exist
      return {
        success: true,
        data: ['Quiz', 'Mid-Term', 'End-Term', 'Practice Test']
      };
    }

    const data = categorySheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Find "Category" and "Type" columns
    const categoryIdx = headers.findIndex(h =>
      h && h.toString().toLowerCase().includes('category')
    );
    const typeIdx = headers.findIndex(h =>
      h && h.toString().toLowerCase().includes('type')
    );

    if (categoryIdx === -1 || typeIdx === -1) {
      // If columns not found, return default types
      return {
        success: true,
        data: ['Quiz', 'Mid-Term', 'End-Term', 'Practice Test']
      };
    }

    // Filter rows where Category = "EXAM" and extract Type values
    const examTypes = rows
      .filter(row => {
        const category = row[categoryIdx];
        return category && category.toString().trim().toUpperCase() === 'EXAM';
      })
      .map(row => row[typeIdx])
      .filter(type => type && type.toString().trim() !== '')
      .map(type => type.toString().trim());

    const uniqueTypes = Array.from(new Set(examTypes)).sort();

    return { success: true, data: uniqueTypes.length > 0 ? uniqueTypes : ['Quiz', 'Mid-Term', 'End-Term', 'Practice Test'] };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ================================================================================================
// EXAM SESSION MANAGEMENT - Single Sign-In & Device Verification
// ================================================================================================

/**
 * Generate a unique session token
 */
function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token + '_' + Date.now();
}

/**
 * Create exam session after password verification
 * Implements single sign-in by device hash matching
 */
function createExamSession(examId, password, studentEmail, studentName, deviceInfo) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);

    // First verify the password
    const passwordResult = verifyExamPassword(examId, password, studentEmail);
    if (!passwordResult.success) {
      return passwordResult;
    }

    const verifySheet = ss.getSheetByName('Exam_Verify');
    if (!verifySheet) {
      return { success: false, message: 'Exam_Verify sheet not found. Please run initializeExamSheets.' };
    }

    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];

    // Column indices
    const colExamId = headers.indexOf('Exam ID');
    const colEmail = headers.indexOf('Student Email');
    const colSessionActive = headers.indexOf('Session Active');
    const colDeviceHash = headers.indexOf('Device Hash');
    const colSessionToken = headers.indexOf('Session Token');
    const colLastActivity = headers.indexOf('Last Activity');
    const colLoginBlocked = headers.indexOf('Login Blocked');
    const colBlockedReason = headers.indexOf('Blocked Reason');
    const colBlockedDeviceHash = headers.indexOf('Blocked Device Hash');
    const colBlockedIP = headers.indexOf('Blocked IP');
    const colBlockedTime = headers.indexOf('Blocked Time');
    const colPrevInvalidated = headers.indexOf('Previous Session Invalidated');

    // Check for existing active session
    let existingRowIndex = -1;
    let existingDeviceHash = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][colExamId] === examId &&
          data[i][colEmail] === studentEmail &&
          data[i][colSessionActive] === 'Yes') {
        existingRowIndex = i;
        existingDeviceHash = data[i][colDeviceHash];
        break;
      }
    }

    const currentDeviceHash = deviceInfo.deviceHash;
    const timestamp = formatTimestampForSheets();

    // If there's an existing active session
    if (existingRowIndex !== -1) {
      // Check if it's the same device (normalize both for comparison to handle legacy data)
      if (normalizeDeviceHash(existingDeviceHash) === normalizeDeviceHash(currentDeviceHash)) {
        // Same device - allow login, update session
        const existingToken = data[existingRowIndex][colSessionToken];

        // Update last activity
        verifySheet.getRange(existingRowIndex + 1, colLastActivity + 1).setValue(timestamp);

        // Get exam end time for session expiry
        const examSheet = ss.getSheetByName('Exams_Master');
        const examData = examSheet.getDataRange().getValues();
        const examHeaders = examData[0];
        const examIdCol = examHeaders.indexOf('Exam ID');
        const endDateCol = examHeaders.indexOf('End DateTime');

        let expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours default
        for (let i = 1; i < examData.length; i++) {
          if (examData[i][examIdCol] === examId) {
            const endDate = examData[i][endDateCol];
            if (endDate) {
              expiresAt = new Date(endDate).toISOString();
            }
            break;
          }
        }

        return {
          success: true,
          sessionToken: existingToken,
          expiresAt: expiresAt,
          message: 'Session resumed on same device'
        };
      } else {
        // Different device - BLOCK login
        // Log the blocked attempt
        verifySheet.getRange(existingRowIndex + 1, colLoginBlocked + 1).setValue('Yes');
        verifySheet.getRange(existingRowIndex + 1, colBlockedReason + 1).setValue('Different device attempted login');
        verifySheet.getRange(existingRowIndex + 1, colBlockedDeviceHash + 1).setValue(formatDeviceHashForStorage(currentDeviceHash));
        verifySheet.getRange(existingRowIndex + 1, colBlockedIP + 1).setValue(deviceInfo.ipAddress || '');
        verifySheet.getRange(existingRowIndex + 1, colBlockedTime + 1).setValue(timestamp);

        return {
          success: false,
          blocked: true,
          blockedReason: 'This exam is already in progress on another device. Please use the original device to continue.'
        };
      }
    }

    // No existing active session - create new one
    const sessionToken = generateSessionToken();

    // Get exam end time for session expiry
    const examSheet = ss.getSheetByName('Exams_Master');
    const examData = examSheet.getDataRange().getValues();
    const examHeaders = examData[0];
    const examIdCol = examHeaders.indexOf('Exam ID');
    const endDateCol = examHeaders.indexOf('End DateTime');

    let expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours default
    for (let i = 1; i < examData.length; i++) {
      if (examData[i][examIdCol] === examId) {
        const endDate = examData[i][endDateCol];
        if (endDate) {
          expiresAt = new Date(endDate).toISOString();
        }
        break;
      }
    }

    // Create new session row
    const newRow = [
      examId,                                    // Exam ID
      studentEmail,                              // Student Email
      studentName || '',                         // Student Name
      '',                                        // Roll Number (can be populated later)
      'Success',                                 // Password Status
      timestamp,                                 // Verification Time
      sessionToken,                              // Session Token
      'Yes',                                     // Session Active
      expiresAt,                                 // Session Expiry
      formatDeviceHashForStorage(deviceInfo.deviceHash),  // Device Hash (prefixed to prevent Sheets number conversion)
      deviceInfo.ipAddress || '',                // IP Address
      deviceInfo.deviceType || '',               // Device Type
      deviceInfo.os || '',                       // OS
      deviceInfo.browser || '',                  // Browser
      deviceInfo.browserVersion || '',           // Browser Version
      deviceInfo.userAgent || '',                // User Agent
      deviceInfo.screenResolution || '',         // Screen Resolution
      deviceInfo.latitude || '',                 // Latitude
      deviceInfo.longitude || '',                // Longitude
      deviceInfo.city || '',                     // City
      deviceInfo.country || '',                  // Country
      1,                                         // Attempt Count
      timestamp,                                 // Last Activity
      'No',                                      // Login Blocked
      '',                                        // Blocked Reason
      '',                                        // Blocked Device Hash
      '',                                        // Blocked IP
      '',                                        // Blocked Time
      'No'                                       // Previous Session Invalidated
    ];

    verifySheet.appendRow(newRow);

    return {
      success: true,
      sessionToken: sessionToken,
      expiresAt: expiresAt,
      message: 'Session created successfully'
    };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Validate exam session
 * Checks if session exists, is active, not expired, and device matches
 */
function validateExamSession(examId, sessionToken, deviceHash, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const verifySheet = ss.getSheetByName('Exam_Verify');

    if (!verifySheet) {
      return { success: false, valid: false, sessionNotFound: true };
    }

    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];

    // Column indices
    const colExamId = headers.indexOf('Exam ID');
    const colEmail = headers.indexOf('Student Email');
    const colSessionToken = headers.indexOf('Session Token');
    const colSessionActive = headers.indexOf('Session Active');
    const colSessionExpiry = headers.indexOf('Session Expiry');
    const colDeviceHash = headers.indexOf('Device Hash');

    for (let i = 1; i < data.length; i++) {
      if (data[i][colExamId] === examId &&
          data[i][colEmail] === studentEmail &&
          data[i][colSessionToken] === sessionToken) {

        // Found the session
        const isActive = data[i][colSessionActive] === 'Yes';
        const storedDeviceHash = data[i][colDeviceHash];
        const expiryTime = new Date(data[i][colSessionExpiry]).getTime();
        const now = Date.now();

        if (!isActive) {
          return { success: false, valid: false, expired: true, message: 'Session is no longer active' };
        }

        if (now > expiryTime) {
          return { success: false, valid: false, expired: true, message: 'Session has expired' };
        }

        // Normalize both hashes for comparison to handle legacy data and prefixed data
        if (normalizeDeviceHash(storedDeviceHash) !== normalizeDeviceHash(deviceHash)) {
          return { success: false, valid: false, invalidDevice: true, message: 'Device mismatch detected' };
        }

        // Session is valid
        return { success: true, valid: true };
      }
    }

    // Session not found
    return { success: false, valid: false, sessionNotFound: true, message: 'Session not found' };

  } catch (error) {
    return { success: false, valid: false, error: error.toString() };
  }
}

/**
 * Update session activity timestamp
 */
function updateSessionActivity(examId, sessionToken, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const verifySheet = ss.getSheetByName('Exam_Verify');

    if (!verifySheet) {
      return { success: false };
    }

    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];

    const colExamId = headers.indexOf('Exam ID');
    const colEmail = headers.indexOf('Student Email');
    const colSessionToken = headers.indexOf('Session Token');
    const colLastActivity = headers.indexOf('Last Activity');

    for (let i = 1; i < data.length; i++) {
      if (data[i][colExamId] === examId &&
          data[i][colEmail] === studentEmail &&
          data[i][colSessionToken] === sessionToken) {

        verifySheet.getRange(i + 1, colLastActivity + 1).setValue(formatTimestampForSheets());
        return { success: true };
      }
    }

    return { success: false };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * End exam session
 */
function endExamSession(examId, sessionToken, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const verifySheet = ss.getSheetByName('Exam_Verify');

    if (!verifySheet) {
      return { success: false };
    }

    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];

    const colExamId = headers.indexOf('Exam ID');
    const colEmail = headers.indexOf('Student Email');
    const colSessionToken = headers.indexOf('Session Token');
    const colSessionActive = headers.indexOf('Session Active');

    for (let i = 1; i < data.length; i++) {
      if (data[i][colExamId] === examId &&
          data[i][colEmail] === studentEmail &&
          data[i][colSessionToken] === sessionToken) {

        verifySheet.getRange(i + 1, colSessionActive + 1).setValue('No');
        return { success: true };
      }
    }

    return { success: false };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * End exam session by examId and studentEmail only
 * Used when submitting exam (sessionToken not available in submitExam context)
 */
function endExamSessionByStudent(examId, studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(EXAM_SHEET_ID);
    const verifySheet = ss.getSheetByName('Exam_Verify');

    if (!verifySheet) {
      return { success: false };
    }

    const data = verifySheet.getDataRange().getValues();
    const headers = data[0];

    const colExamId = headers.indexOf('Exam ID');
    const colEmail = headers.indexOf('Student Email');
    const colSessionActive = headers.indexOf('Session Active');

    let ended = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][colExamId] === examId &&
          data[i][colEmail] === studentEmail &&
          data[i][colSessionActive] === 'Yes') {

        verifySheet.getRange(i + 1, colSessionActive + 1).setValue('No');
        ended = true;
        // Don't break - end all active sessions for this exam+student combination
      }
    }

    return { success: ended };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ================================================================================================
// WEB APP API ENDPOINTS
// ================================================================================================

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getTermStructureExam':
        return createJsonResponse(getTermStructureExam());

      case 'getExamTypes':
        return createJsonResponse(getExamTypes());

      case 'getAllExams':
        return createJsonResponse(getAllExams(e.parameter));

      case 'getExamById':
        return createJsonResponse(getExamById(e.parameter.examId));

      case 'validateExamSession':
        return createJsonResponse(validateExamSession(
          e.parameter.examId,
          e.parameter.sessionToken,
          e.parameter.deviceHash,
          e.parameter.studentEmail
        ));

      default:
        return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'createExam':
        return createJsonResponse(createExam(body.examData));

      case 'updateExam':
        return createJsonResponse(updateExam(body.examId, body.updates));

      case 'deleteExam':
        return createJsonResponse(deleteExam(body.examId));

      case 'addQuestion':
        return createJsonResponse(addQuestion(body.examId, body.questionData));

      case 'updateExamQuestion':
        return createJsonResponse(updateExamQuestion(body.examId, body.questionId, body.updates));

      case 'deleteExamQuestion':
        return createJsonResponse(deleteExamQuestion(body.examId, body.questionId));

      case 'reorderQuestions':
        return createJsonResponse(reorderQuestions(body.examId, body.questionOrder));

      case 'verifyExamPassword':
        return createJsonResponse(verifyExamPassword(body.examId, body.password, body.studentEmail));

      case 'startExamAttempt':
        return createJsonResponse(startExamAttempt(body.examId, body.studentEmail, body.studentName));

      case 'saveAnswer':
        return createJsonResponse(saveAnswer(body.attemptId, body.examId, body.questionId, body.answer, body.submitted));

      case 'submitExam':
        return createJsonResponse(submitExam(body.attemptId, body.examId, body.studentEmail, body.answers, body.violations, body.timeSpent));

      case 'getExamResult':
        return createJsonResponse(getExamResult(body.attemptId, body.studentEmail));

      case 'logViolation':
        return createJsonResponse(logViolation(body.attemptId, body.examId, body.studentEmail, body.violationType, body.details, body.severity));

      case 'uploadScreenshot':
        // DEPRECATED: Use direct browser uploads with batch URIs instead
        // Kept for backward compatibility
        return createJsonResponse(uploadScreenshot(body.attemptId, body.examId, body.studentEmail, body.screenshot, body.type, body.source));

      case 'requestMoreUris':
        // Request additional upload URIs when batch runs out during long exams
        return createJsonResponse(requestMoreUris(body.examId, body.studentEmail, body.type, body.count));

      case 'createExamSession':
        return createJsonResponse(createExamSession(
          body.examId,
          body.password,
          body.studentEmail,
          body.studentName,
          body.deviceInfo
        ));

      case 'updateSessionActivity':
        return createJsonResponse(updateSessionActivity(
          body.examId,
          body.sessionToken,
          body.studentEmail
        ));

      case 'endExamSession':
        return createJsonResponse(endExamSession(
          body.examId,
          body.sessionToken,
          body.studentEmail
        ));

      default:
        return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================================================
// JOB PORTAL FUNCTIONS - SSB Placement Management
