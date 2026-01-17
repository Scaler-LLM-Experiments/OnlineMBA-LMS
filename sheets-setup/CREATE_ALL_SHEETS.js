/**
 * GOOGLE SHEETS AUTO-SETUP SCRIPT - COMPLETE VERSION
 *
 * This creates ALL sheets required by the Main Backend
 *
 * HOW TO USE:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete all code and paste this entire file
 * 4. Click Run > Run function > createAllSheets
 * 5. Authorize when prompted
 * 6. All sheets will be created automatically!
 *
 * SHEETS CREATED (18 total) - Matches your Google Sheet structure:
 * 1. Student Login - Authentication/login tracking
 * 2. Student Data - User accounts with admin flag
 * 3. Student Profile - Extended profile info
 * 4. Access - Role-based access control
 * 5. Term - Batch/Term/Domain/Subject hierarchy
 * 6. Zoom Live - Live session schedules
 * 7. Zoom Recordings - Recorded sessions
 * 8. Resources Material - Learning materials
 * 9. Events & Announcements Management - Events and announcements
 * 10. Policy & Documents Management - Policies
 * 11. Notes - Student notes
 * 12. Info.ssb Calendar - Calendar events (NOT "SSB Calendar")
 * 13. Acknowledgement Data - Policy acknowledgements
 * 14. Students Corner - Activity - Community posts
 * 15. Students Corner - Engagement - Likes/comments
 * 16. Forms - Dynamic forms
 * 17. Form Responses - Form submissions
 * 18. Create Zoom + Google Calendar - Zoom session creation
 */

function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Delete default Sheet1 if exists
  try {
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  // Create all sheets in order
  createStudentLogin(ss);        // 1. Authentication - REQUIRED for login
  createStudentData(ss);         // 2. User accounts
  createStudentProfile(ss);      // 3. Extended profiles
  createAccess(ss);              // 4. Role-based access
  createTerm(ss);                // 5. Course hierarchy
  createZoomLive(ss);            // 6. Live sessions
  createZoomRecordings(ss);      // 7. Recordings
  createResourcesMaterial(ss);   // 8. Learning materials
  createEventsAnnouncementsMgmt(ss); // 9. Events (note: "Management" suffix)
  createPolicyDocumentsMgmt(ss); // 10. Policies (note: "Management" suffix)
  createNotes(ss);               // 11. Student notes
  createSSBCalendar(ss);         // 12. Calendar
  createAcknowledgementData(ss); // 13. Acknowledgements
  createStudentsCornerActivity(ss);    // 14. Community posts
  createStudentsCornerEngagement(ss);  // 15. Likes/comments
  createForms(ss);               // 16. Dynamic forms
  createFormResponses(ss);       // 17. Form submissions
  createZoomGoogleCalendar(ss);  // 18. Zoom session creation

  // Delete Sheet1 if it still exists and we have other sheets
  try {
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  SpreadsheetApp.getUi().alert('All 18 sheets created successfully! ✓\n\nIMPORTANT: Replace YOUR_ADMIN_EMAIL@example.com with your actual admin email in the sheets.');
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ============================================================
// 1. STUDENT LOGIN - Required for authentication
// Backend constant: STUDENT_LOGIN_SHEET = "Student Login"
// Used by: isValidStudentEmail(), getStudentProfile(), isAdmin()
// IMPORTANT: isAdmin() checks Column E (index 4) for 'Admin' role!
// ============================================================
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

// ============================================================
// 2. STUDENT DATA - User accounts with admin flag
// Backend constant: STUDENT_DATA_SHEET = "Student Data"
// Used by: isAdmin(), getStudentDataByEmail()
// ============================================================
function createStudentData(ss) {
  const sheet = getOrCreateSheet(ss, 'Student Data');
  sheet.clear();

  // isAdmin column determines admin access
  const headers = ['Email', 'Name', 'Roll No', 'Batch', 'Phone', 'Status', 'isAdmin'];
  const data = [
    ['YOUR_ADMIN_EMAIL@example.com', 'Mohit Pareek', 'ADMIN001', 'MBA-2024', '9999999999', 'Active', 'Yes']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 3. STUDENT PROFILE - Extended profile information
// Backend constant: STUDENT_PROFILE_SHEET = "Student Profile"
// Used by: getFullStudentProfile(), updateStudentProfile()
// ============================================================
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

// ============================================================
// 4. ACCESS - Role-based access control
// Backend constant: ACCESS_SHEET = "Access"
// Used by: Role and permission management
// ============================================================
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

// ============================================================
// 5. TERM - Batch/Term/Domain/Subject hierarchy
// Used by: getTermDropdownsResMgmt(), getCourseResources()
// This defines the course structure for resources and recordings
// ============================================================
function createTerm(ss) {
  const sheet = getOrCreateSheet(ss, 'Term');
  sheet.clear();

  const headers = ['Batch', 'Term', 'Domain', 'Subject'];
  const data = [
    ['MBA-2024', 'Term-1', 'Finance', 'Financial Accounting'],
    ['MBA-2024', 'Term-1', 'Finance', 'Managerial Economics'],
    ['MBA-2024', 'Term-1', 'Finance', 'Corporate Finance'],
    ['MBA-2024', 'Term-1', 'Marketing', 'Marketing Management'],
    ['MBA-2024', 'Term-1', 'Marketing', 'Consumer Behavior'],
    ['MBA-2024', 'Term-1', 'Marketing', 'Digital Marketing'],
    ['MBA-2024', 'Term-1', 'Operations', 'Operations Management'],
    ['MBA-2024', 'Term-1', 'Operations', 'Supply Chain Management'],
    ['MBA-2024', 'Term-1', 'HR', 'Organizational Behavior'],
    ['MBA-2024', 'Term-1', 'HR', 'Human Resource Management'],
    ['MBA-2024', 'Term-1', 'Strategy', 'Business Strategy'],
    ['MBA-2024', 'Term-1', 'Analytics', 'Business Analytics'],
    ['MBA-2024', 'Term-2', 'Finance', 'Investment Analysis'],
    ['MBA-2024', 'Term-2', 'Finance', 'Financial Markets'],
    ['MBA-2024', 'Term-2', 'Marketing', 'Brand Management'],
    ['MBA-2024', 'Term-2', 'Operations', 'Project Management'],
    ['MBA-2024', 'Term-2', 'HR', 'Talent Management'],
    ['MBA-2024', 'Term-2', 'Analytics', 'Data Visualization'],
    ['MBA-2025', 'Term-1', 'Finance', 'Financial Accounting'],
    ['MBA-2025', 'Term-1', 'Marketing', 'Marketing Management']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#673ab7').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 6. ZOOM LIVE - Live session schedules
// Used by: getZoomLiveSessions(), getLiveSessions()
// ============================================================
function createZoomLive(ss) {
  const sheet = getOrCreateSheet(ss, 'Zoom Live');
  sheet.clear();

  const headers = ['Batch', 'Term', 'Domain', 'Subject', 'Session Name', 'Date', 'Start Time', 'Duration', 'Zoom Live Link', 'Meeting ID', 'Meeting Password', 'Topic'];
  const data = [
    ['MBA-2024', 'Term-1', 'Finance', 'Financial Accounting', 'Session 1', '20-Jan-2025', '10:00 AM', '60', 'https://zoom.us/j/123456789', '123456789', 'abc123', 'Introduction to Financial Accounting'],
    ['MBA-2024', 'Term-1', 'Finance', 'Financial Accounting', 'Session 2', '22-Jan-2025', '10:00 AM', '60', 'https://zoom.us/j/123456790', '123456790', 'abc124', 'Balance Sheet Fundamentals'],
    ['MBA-2024', 'Term-1', 'Marketing', 'Marketing Management', 'Session 1', '21-Jan-2025', '02:00 PM', '90', 'https://zoom.us/j/123456791', '123456791', 'mkt001', 'Marketing Concepts Overview']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 7. ZOOM RECORDINGS - Recorded sessions
// Used by: getZoomRecordings(), getRecordings()
// ============================================================
function createZoomRecordings(ss) {
  const sheet = getOrCreateSheet(ss, 'Zoom Recordings');
  sheet.clear();

  const headers = ['Session ID', 'Batch', 'Term', 'Domain', 'Subject', 'Session Name', 'Topic', 'Date', 'Start Time', 'Duration', 'Speaker View URL', 'Gallery View URL', 'Thumbnail'];
  const data = [
    ['REC001', 'MBA-2024', 'Term-1', 'Finance', 'Financial Accounting', 'Session 1', 'Introduction to Financial Accounting', '15-Jan-2025', '10:00 AM', '60', 'https://drive.google.com/file/d/sample1', 'https://drive.google.com/file/d/sample1g', 'https://i.ytimg.com/vi/sample/hqdefault.jpg'],
    ['REC002', 'MBA-2024', 'Term-1', 'Finance', 'Financial Accounting', 'Session 2', 'Balance Sheet Basics', '17-Jan-2025', '10:00 AM', '60', 'https://drive.google.com/file/d/sample2', 'https://drive.google.com/file/d/sample2g', 'https://i.ytimg.com/vi/sample/hqdefault.jpg'],
    ['REC003', 'MBA-2024', 'Term-1', 'Marketing', 'Marketing Management', 'Session 1', 'Marketing Fundamentals', '16-Jan-2025', '02:00 PM', '90', 'https://drive.google.com/file/d/sample3', 'https://drive.google.com/file/d/sample3g', 'https://i.ytimg.com/vi/sample/hqdefault.jpg']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#fbbc04').setFontColor('black');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 8. RESOURCES MATERIAL - Learning materials
// Used by: createResourceResMgmt(), getResourcesResMgmt()
// ============================================================
function createResourcesMaterial(ss) {
  const sheet = getOrCreateSheet(ss, 'Resources Material');
  sheet.clear();

  // Backend expects these exact column names with _RES suffix
  const headers = ['ID_RES', 'Publish_RES', 'Posted By_RES', 'Created at_RES', 'Title_RES', 'Description_RES', 'Term_RES', 'Domain_RES', 'Subject_RES', 'Level_RES', 'Resource Type_RES', 'File 1 Name_RES', 'File 1 URL_RES', 'Status_RES'];
  const data = [
    ['RES001', 'Yes', 'YOUR_ADMIN_EMAIL@example.com', '2025-01-15 10:00:00', 'Accounting Fundamentals', 'Introduction to basic accounting principles', 'Term-1', 'Finance', 'Financial Accounting', 'Subject', 'Lecture Slides', 'Accounting-Intro.pdf', 'https://drive.google.com/file/d/sample', 'Published'],
    ['RES002', 'Yes', 'YOUR_ADMIN_EMAIL@example.com', '2025-01-15 10:30:00', 'Marketing Case Studies', 'Collection of real-world marketing cases', 'Term-1', 'Marketing', 'Marketing Management', 'Subject', 'Case Study', 'Marketing-Cases.pdf', 'https://drive.google.com/file/d/sample2', 'Published'],
    ['RES003', 'Yes', 'YOUR_ADMIN_EMAIL@example.com', '2025-01-16 09:00:00', 'Excel for Finance', 'Learn Excel formulas for financial analysis', 'Term-1', 'Finance', 'Financial Accounting', 'Subject', 'Video Tutorial', 'Excel-Tutorial.mp4', 'https://drive.google.com/file/d/sample3', 'Published']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 9. EVENTS & ANNOUNCEMENTS MANAGEMENT
// Backend constant: EVENTS_ANNOUNCEMENTS_SHEET = "Events & Announcements Management"
// Note: Must have "Management" suffix!
// ============================================================
function createEventsAnnouncementsMgmt(ss) {
  const sheet = getOrCreateSheet(ss, 'Events & Announcements Management');
  sheet.clear();

  const headers = ['ID', 'Category Type', 'Event Type', 'Title', 'Description', 'Batch', 'Start DateTime', 'End DateTime', 'Status', 'Publish'];
  const data = [
    ['EVT001', 'EVENTS', 'Workshop', 'Career Development Workshop', 'Learn resume building and interview skills', 'MBA-2024', '2025-01-25 10:00', '2025-01-25 16:00', 'Published', 'Yes'],
    ['EVT002', 'EVENTS', 'Webinar', 'Industry Expert Talk', 'Guest lecture by Fortune 500 CEO', 'MBA-2024', '2025-01-28 14:00', '2025-01-28 15:30', 'Published', 'Yes'],
    ['EVT003', 'ANNOUNCEMENTS', 'Important', 'Mid-Term Exam Schedule', 'Check your exam dates and prepare', 'MBA-2024', '2025-01-20 09:00', '2025-02-15 23:59', 'Published', 'Yes'],
    ['EVT004', 'ANNOUNCEMENTS', 'General', 'Library Hours Extended', 'Library open till 10 PM during exams', 'MBA-2024', '2025-01-22 00:00', '2025-02-20 23:59', 'Published', 'Yes']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#ff5722').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 10. POLICY & DOCUMENTS MANAGEMENT
// Note: Backend references "Policy & Documents Management"
// ============================================================
function createPolicyDocumentsMgmt(ss) {
  const sheet = getOrCreateSheet(ss, 'Policy & Documents Management');
  sheet.clear();

  const headers = ['ID', 'Policy/Document Name', 'Description', 'Category', 'Batch', 'Status', 'Requires Acknowledgement', 'Start DateTime', 'End DateTime'];
  const data = [
    ['POL001', 'Academic Integrity Policy', 'Guidelines for academic honesty', 'Academic', 'MBA-2024', 'Published', 'Yes', '2025-01-01', '2025-12-31'],
    ['POL002', 'Attendance Policy', 'Minimum attendance requirements', 'Academic', 'MBA-2024', 'Published', 'Yes', '2025-01-01', '2025-12-31'],
    ['POL003', 'Code of Conduct', 'Professional conduct guidelines', 'General', 'MBA-2024', 'Published', 'Yes', '2025-01-01', '2025-12-31'],
    ['POL004', 'Examination Guidelines', 'Rules for examinations', 'Academic', 'MBA-2024', 'Published', 'Yes', '2025-01-01', '2025-12-31']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#607d8b').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 11. NOTES - Student notes for sessions
// Backend constant: NOTES_SHEET = "Notes"
// ============================================================
function createNotes(ss) {
  const sheet = getOrCreateSheet(ss, 'Notes');
  sheet.clear();

  const headers = ['Note ID', 'Student Email', 'Session ID', 'Content', 'Tags', 'Is Pinned', 'Created At', 'Updated At'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#00bcd4').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 12. INFO.SSB CALENDAR - Calendar events
// Backend uses: spreadsheet.getSheetByName('Info.ssb Calendar')
// ============================================================
function createSSBCalendar(ss) {
  const sheet = getOrCreateSheet(ss, 'Info.ssb Calendar');
  sheet.clear();

  // Headers from backend getCalendarEvents() column mapping
  const headers = ['Batch', 'Publish', 'Event Type', 'Student Level Show', 'Event Name', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Link', 'Description', 'Attendees', 'Event ID', 'Updated?', 'Updated at Timestamp', 'Location'];
  const data = [
    ['MBA-2024', 'Yes', 'Session', 'No', 'Finance Class - Week 1', '20-Jan-2025', '10:00 AM', '20-Jan-2025', '11:00 AM', 'https://zoom.us/j/123', 'Weekly finance lecture', '', 'CAL001', 'No', '', 'Online'],
    ['MBA-2024', 'Yes', 'Session', 'No', 'Marketing Class - Week 1', '21-Jan-2025', '02:00 PM', '21-Jan-2025', '03:30 PM', 'https://zoom.us/j/124', 'Weekly marketing lecture', '', 'CAL002', 'No', '', 'Online'],
    ['MBA-2024', 'Yes', 'Assessment', 'No', 'Mid-Term Quiz 1', '25-Jan-2025', '10:00 AM', '25-Jan-2025', '11:00 AM', 'https://exam.portal/quiz1', 'Finance mid-term assessment', '', 'CAL003', 'No', '', 'Online']
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#673ab7').setFontColor('white');
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 13. ACKNOWLEDGEMENT DATA - Policy acknowledgements
// Backend constant: ACKNOWLEDGEMENT_SHEET = "Acknowledgement Data"
// ============================================================
function createAcknowledgementData(ss) {
  const sheet = getOrCreateSheet(ss, 'Acknowledgement Data');
  sheet.clear();

  const headers = ['ID', 'Student Email', 'Content ID', 'Content Type', 'Acknowledged At'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#795548').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 14. STUDENTS CORNER - ACTIVITY - Community posts
// Backend constant: STUDENTS_CORNER_SHEET = "Students Corner - Activity"
// Backend creates these exact headers when sheet doesn't exist
// ============================================================
function createStudentsCornerActivity(ss) {
  const sheet = getOrCreateSheet(ss, 'Students Corner - Activity');
  sheet.clear();

  // Exact headers from backend createStudentsCornerPost() function
  const headers = ['S.ID', 'S.Type', 'S.Student Email', 'S.Full Name', 'S.Batch', 'S.Timestamp', 'S.Status', 'S.Points', 'S.Title', 'S.Content', 'S.Target Batch', 'S.Category', 'S.Metadata'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e91e63').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 15. STUDENTS CORNER - ENGAGEMENT - Likes/comments
// Backend constant: STUDENTS_CORNER_ENGAGEMENT_SHEET = "Students Corner - Engagement"
// Backend creates these exact headers in createEngagementSheetIfNeeded()
// ============================================================
function createStudentsCornerEngagement(ss) {
  const sheet = getOrCreateSheet(ss, 'Students Corner - Engagement');
  sheet.clear();

  // Exact headers from backend createEngagementSheetIfNeeded() function
  const headers = ['ID', 'ActivityID', 'StudentEmail', 'FullName', 'Batch', 'EngagementType', 'CommentText', 'Timestamp', 'Points'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e91e63').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 16. FORMS - Dynamic forms
// Headers from your Google Sheet Forms tab
// ============================================================
function createForms(ss) {
  const sheet = getOrCreateSheet(ss, 'Forms');
  sheet.clear();

  // Exact headers from your sheet
  const headers = [
    'Form_ID', 'Batch', 'Term', 'Domain', 'Subject', 'Form_Name', 'Form_Description',
    'Form_Type', 'Created_By', 'Created_At', 'Start_DateTime', 'End_DateTime',
    'Uploaded_File', 'Drive_Link', 'Attachment_Required', 'Response_Sheet_Link',
    'Is_Active', 'Show_At_Start_Until_Filled', 'Show_In_Tab', 'Visible_To',
    'Max_Responses_Per_User', 'Show_Results_To_Respondents', 'Thank_You_Message',
    'Redirect_URL', 'Allow_Edit_Response', 'Allow_Student_View_Response',
    'Require_Login', 'Collect_Email', 'Total_Responses', 'Last_Updated_At',
    'Last_Updated_By', 'Status', 'Notes'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#3f51b5').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 17. FORM RESPONSES - Form submissions
// ============================================================
function createFormResponses(ss) {
  const sheet = getOrCreateSheet(ss, 'Form Responses');
  sheet.clear();

  const headers = ['Response ID', 'Form ID', 'Student Email', 'Responses', 'Submitted At'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#009688').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// 18. CREATE ZOOM + GOOGLE CALENDAR - Zoom session creation
// Backend uses: spreadsheet.getSheetByName('Create Zoom + Google Calendar')
// ============================================================
function createZoomGoogleCalendar(ss) {
  const sheet = getOrCreateSheet(ss, 'Create Zoom + Google Calendar');
  sheet.clear();

  // Headers from backend Backend Zoom.js CREATE_COLUMNS
  const headers = [
    'Batch', 'Term', 'Domain', 'Subject', 'Session Name', 'Description',
    'Date', 'Start Time', 'Duration (mins)', 'Meeting ID', 'Meeting Password',
    'Zoom Join URL', 'Zoom Start URL', 'Calendar Event ID', 'Calendar Event Link',
    'Status', 'Created At', 'Created By'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}
