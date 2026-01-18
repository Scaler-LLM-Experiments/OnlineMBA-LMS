/**
 * Course Access Management - Google Apps Script Backend Functions
 *
 * Add these functions to your existing Google Apps Script backend.
 * Make sure to also add the switch cases to your doPost/doGet handler.
 *
 * Required Sheet: "Student Login" with columns:
 * - Email (Column A)
 * - Full Name (Column B)
 * - Roll No (Column C)
 * - Batch (Column D)
 * - Role (Column E) - Add this column if it doesn't exist
 * - isAdmin (Column F) - Optional, for admin privileges
 * - Created At (Column G) - Optional
 * - Created By (Column H) - Optional
 */

// ==================== Course Access Management ====================

/**
 * Get all enrolled students from Student Login sheet
 */
function getEnrolledStudents(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices (case-insensitive)
    const emailCol = headers.findIndex(h => h === 'email');
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
        const isAdmin = String(row[isAdminCol]).toLowerCase();
        if (isAdmin === 'true' || isAdmin === 'yes' || isAdmin === '1') {
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices
    const emailCol = headers.findIndex(h => h === 'email');
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    // Find column indices
    const emailCol = headers.findIndex(h => h === 'email');
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Student Login');

    if (!sheet) {
      return { success: false, error: 'Student Login sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailCol = headers.findIndex(h => h === 'email');

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


// ==================== ADD TO YOUR doPost HANDLER ====================
// Add these cases to your existing switch statement in doPost or doGet:

/*
    case 'getEnrolledStudents':
      return ContentService.createTextOutput(JSON.stringify(getEnrolledStudents(params)))
        .setMimeType(ContentService.MimeType.JSON);

    case 'enrollStudent':
      return ContentService.createTextOutput(JSON.stringify(enrollStudent(params)))
        .setMimeType(ContentService.MimeType.JSON);

    case 'updateEnrolledStudent':
      return ContentService.createTextOutput(JSON.stringify(updateEnrolledStudent(params)))
        .setMimeType(ContentService.MimeType.JSON);

    case 'removeStudentAccess':
      return ContentService.createTextOutput(JSON.stringify(removeStudentAccess(params)))
        .setMimeType(ContentService.MimeType.JSON);

    case 'getNextRollNumber':
      return ContentService.createTextOutput(JSON.stringify(getNextRollNumber(params)))
        .setMimeType(ContentService.MimeType.JSON);
*/
