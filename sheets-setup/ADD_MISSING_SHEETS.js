/**
 * ADD MISSING SHEETS
 * Run this in your Google Sheet's Apps Script to add the missing sheets
 *
 * Go to Extensions > Apps Script > Paste this > Run addMissingSheets
 */

function addMissingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Add Student Login sheet
  createStudentLogin(ss);

  // Add Student Profile sheet
  createStudentProfile(ss);

  // Add Access sheet
  createAccess(ss);

  // Add Students Corner - Engagement sheet
  createStudentsCornerEngagement(ss);

  // Rename "Events & Announcements" to "Events & Announcements Management"
  renameSheet(ss, 'Events & Announcements', 'Events & Announcements Management');

  SpreadsheetApp.getUi().alert('Missing sheets added successfully!');
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function renameSheet(ss, oldName, newName) {
  const sheet = ss.getSheetByName(oldName);
  if (sheet) {
    sheet.setName(newName);
  }
}

function createStudentLogin(ss) {
  const sheet = getOrCreateSheet(ss, 'Student Login');
  sheet.clear();

  // Backend isAdmin() checks Column E (index 4) for 'Admin' role
  // Columns: Email (A/0) | Full Name (B/1) | Roll No (C/2) | Batch (D/3) | Role (E/4) | Login Count (F) | Last Login (G)
  const headers = ['Email', 'Full Name', 'Roll No', 'Batch', 'Role', 'Login Count', 'Last Login'];
  const data = [
    ['YOUR_ADMIN_EMAIL@example.com', 'Mohit Pareek', 'ADMIN001', 'MBA-2024', 'Admin', '1', new Date().toISOString()]
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function createStudentProfile(ss) {
  const sheet = getOrCreateSheet(ss, 'Student Profile');
  sheet.clear();

  const headers = ['Email', 'Full Name', 'Roll No', 'Batch', 'Phone', 'LinkedIn', 'GitHub', 'Bio', 'Profile Picture', 'Created At'];
  const data = [
    ['YOUR_ADMIN_EMAIL@example.com', 'Mohit Pareek', 'ADMIN001', 'MBA-2024', '9999999999', '', '', 'Admin User', '', new Date().toISOString()]
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function createAccess(ss) {
  const sheet = getOrCreateSheet(ss, 'Access');
  sheet.clear();

  const headers = ['Email', 'Role', 'Batch', 'Permissions', 'Created At'];
  const data = [
    ['YOUR_ADMIN_EMAIL@example.com', 'Admin', 'MBA-2024', 'All', new Date().toISOString()]
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#ff5722').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function createStudentsCornerEngagement(ss) {
  const sheet = getOrCreateSheet(ss, 'Students Corner - Engagement');
  sheet.clear();

  // Exact headers from backend createEngagementSheetIfNeeded() function
  const headers = ['ID', 'ActivityID', 'StudentEmail', 'FullName', 'Batch', 'EngagementType', 'CommentText', 'Timestamp', 'Points'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e91e63').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}
