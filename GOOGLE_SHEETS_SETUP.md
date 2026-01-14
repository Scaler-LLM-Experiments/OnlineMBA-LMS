# Google Sheets Integration Guide for Online MBA LMS

This guide explains how to set up Google Sheets as the backend database for the Online MBA LMS.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
│                 (Online MBA Portal)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (Web App)                   │
│           Acts as API server - handles requests             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheets                            │
│              (Database - stores all data)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Required Google Sheets

You need to create **5 Google Sheets** (one for each backend):

### 1. Main Portal Sheet
**Purpose:** Core student data, sessions, resources, announcements

**Required Tabs/Sheets:**
| Sheet Name | Columns |
|------------|---------|
| `STUDENT_DATA` | Email, Full Name, Roll Number, Batch, isAdmin, Phone, LinkedIn, GitHub, Portfolio, About, Location, Profile Picture URL |
| `LIVE_SESSIONS` | ID, Meeting Number, Password, Session Name, Batch, Term, Domain, Subject, Start Time, End Time, Status |
| `RECORDINGS` | ID, Session Name, Batch, Term, Domain, Subject, Speaker View URL, Gallery View URL, Screen Share URL, Duration, Date |
| `ANNOUNCEMENTS` | ID, Title, Subtitle, Description, Type, Priority, Batch, Start Date, End Date, Posted By, Status |
| `EVENTS` | ID, Title, Description, Type, Batch, Start DateTime, End DateTime, Location, Registration Link, Status |
| `RESOURCES` | ID, Title, Description, Type, Level, Batch, Term, Domain, Subject, File URLs, Status |
| `POLICIES` | ID, Title, Description, Full Content, Category, Batch, Requires Acknowledgement, Status |
| `SESSION_NOTES` | ID, Student Email, Session ID, Content (Base64), Tags, Is Pinned, Created At, Updated At |
| `STUDENTS_CORNER` | ID, Author Email, Author Name, Type, Title, Content, Likes, Created At |
| `ACKNOWLEDGEMENTS` | ID, Student Email, Content ID, Content Type, Acknowledged At |
| `BATCHES` | Batch Name, Status, Created At |
| `TERMS` | Term Name, Batch, Order |
| `DOMAINS` | Domain Name, Term, Batch |
| `SUBJECTS` | Subject Name, Domain, Term, Batch |

### 2. Exam Sheet
**Purpose:** Exam management and proctoring

**Required Tabs/Sheets:**
| Sheet Name | Columns |
|------------|---------|
| `EXAMS` | ID, Title, Type, Term, Domain, Subject, Batch, Duration, Total Marks, Passing Marks, Status, Password Config, Proctoring Settings, Created At |
| `QUESTIONS` | ID, Exam ID, Type, Question Text, Options (A-J), Correct Answer, Marks, Negative Marks, Explanation, Order |
| `EXAM_RESPONSES` | Attempt ID, Exam ID, Student Email, Start Time, End Time, Status, Score, Violations, Answers (JSON) |
| `EXAM_SESSIONS` | Session Token, Exam ID, Student Email, Device Hash, IP Address, Created At, Expires At |
| `EXAM_PASSWORDS` | Exam ID, Student Email, Password, Used |
| `CATEGORY_TYPE` | Type, Value |

### 3. Assignment Sheet
**Purpose:** Assignment submissions and peer reviews

**Required Tabs/Sheets:**
| Sheet Name | Columns |
|------------|---------|
| `ASSIGNMENTS` | ID, Title, Description, Instructions, Batch, Term, Domain, Subject, Start Date, End Date, Max File Size, Allowed File Types, Is Group, Group Size, Status |
| `SUBMISSIONS` | ID, Assignment ID, Student Email, Group ID, Files (JSON), Submitted At, Status |
| `PEER_RATINGS` | ID, Submission ID, Rater Email, Rating, Remarks, Created At |
| `GROUPS` | Group ID, Assignment ID, Members (JSON), Created At |
| `SUBJECTS` | Subject Name, Domain, Term, Batch |

### 4. Placement Sheet
**Purpose:** Job portal and placement profiles

**Required Tabs/Sheets:**
| Sheet Name | Columns |
|------------|---------|
| `JOB_POSTINGS` | ID, Title, Company, Description, Requirements, Location, Type, Salary Range, Deadline, Batch, Status, Created At |
| `APPLICATIONS` | ID, Job ID, Student Email, Resume URL, Cover Letter, Status, Applied At |
| `PLACEMENT_PROFILES` | Student Email, Experience (JSON), Internships (JSON), Projects (JSON), Domains (JSON), Preferred Locations, Resume URLs |

### 5. Forms Sheet
**Purpose:** Dynamic forms and surveys

**Required Tabs/Sheets:**
| Sheet Name | Columns |
|------------|---------|
| `FORMS` | ID, Title, Type, Description, Batch, Term, Questions Config (JSON), Is Required, Deadline, Status |
| `FORM_QUESTIONS` | ID, Form ID, Type, Label, Options (JSON), Validation (JSON), Order |
| `FORM_RESPONSES` | ID, Form ID, Student Email, Responses (JSON), Submitted At |

---

## Google Apps Script Setup

### Step 1: Create Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Name it "Online MBA - Main Backend"

### Step 2: Basic Script Structure

```javascript
// Code.gs - Main entry point

// Sheet IDs - Replace with your actual sheet IDs
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Get spreadsheet reference
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(sheetName);
}

// Main entry point for web requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Route to appropriate handler
    const handlers = {
      'test': () => ({ success: true, message: 'API is working!' }),
      'getStudentProfile': () => getStudentProfile(data),
      'getSessions': () => getSessions(data),
      'getLiveSessions': () => getLiveSessions(data),
      'getRecordings': () => getRecordings(data),
      'getAnnouncements': () => getAnnouncements(data),
      'getResources': () => getResources(data),
      // Add more handlers...
    };

    const handler = handlers[action];
    if (!handler) {
      return createResponse({ success: false, error: 'Unknown action: ' + action });
    }

    const result = handler();
    return createResponse(result);

  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

function doGet(e) {
  return createResponse({ success: true, message: 'Online MBA API is running' });
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Step 3: Handler Functions

```javascript
// handlers.gs - API handlers

function getStudentProfile(data) {
  const email = data.studentEmail;
  const sheet = getSheet('STUDENT_DATA');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) { // Email is first column
      const student = {};
      headers.forEach((header, index) => {
        student[header] = rows[i][index];
      });
      return { success: true, data: student };
    }
  }

  return { success: false, error: 'Student not found' };
}

function getSessions(data) {
  const { batch, term, domain, subject } = data;
  const sheet = getSheet('RECORDINGS');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const sessions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Filter by batch, term, domain, subject if provided
    if (batch && row[headers.indexOf('Batch')] !== batch) continue;
    if (term && row[headers.indexOf('Term')] !== term) continue;
    if (domain && row[headers.indexOf('Domain')] !== domain) continue;
    if (subject && row[headers.indexOf('Subject')] !== subject) continue;

    const session = {};
    headers.forEach((header, index) => {
      session[header] = row[index];
    });
    sessions.push(session);
  }

  return { success: true, data: sessions };
}

function getLiveSessions(data) {
  const sheet = getSheet('LIVE_SESSIONS');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const now = new Date();

  const liveSessions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const startTime = new Date(row[headers.indexOf('Start Time')]);
    const endTime = new Date(row[headers.indexOf('End Time')]);

    // Check if session is currently live
    if (now >= startTime && now <= endTime) {
      const session = {};
      headers.forEach((header, index) => {
        session[header] = row[index];
      });
      liveSessions.push(session);
    }
  }

  return { success: true, data: liveSessions };
}

function getAnnouncements(data) {
  const { batch, status } = data;
  const sheet = getSheet('ANNOUNCEMENTS');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const announcements = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (batch && row[headers.indexOf('Batch')] !== batch) continue;
    if (status && row[headers.indexOf('Status')] !== status) continue;

    const announcement = {};
    headers.forEach((header, index) => {
      announcement[header] = row[index];
    });
    announcements.push(announcement);
  }

  return { success: true, data: announcements };
}

function getResources(data) {
  const { batch, term, domain, subject, studentEmail } = data;
  const sheet = getSheet('RESOURCES');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const resources = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (batch && row[headers.indexOf('Batch')] !== batch) continue;
    if (term && row[headers.indexOf('Term')] !== term) continue;

    const resource = {};
    headers.forEach((header, index) => {
      resource[header] = row[index];
    });
    resources.push(resource);
  }

  return { success: true, data: resources };
}
```

### Step 4: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Select "Web app"
3. Set:
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. Copy the Web App URL

### Step 5: Update Frontend .env

```env
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
REACT_APP_EXAM_BACKEND_URL=https://script.google.com/macros/s/YOUR_EXAM_DEPLOYMENT_ID/exec
REACT_APP_ASSIGNMENT_BACKEND_URL=https://script.google.com/macros/s/YOUR_ASSIGNMENT_DEPLOYMENT_ID/exec
REACT_APP_PLACEMENT_BACKEND_URL=https://script.google.com/macros/s/YOUR_PLACEMENT_DEPLOYMENT_ID/exec
```

---

## Complete API Actions Reference

### Main Backend Actions

```javascript
// Student Management
'getStudentProfile'      // { studentEmail }
'getFullStudentProfile'  // { studentEmail }
'updateStudentProfile'   // { studentEmail, ...profileFields }
'getBatches'            // {}

// Sessions & Recordings
'getSessions'           // { batch, term, domain, subject }
'getLiveSessions'       // { batch }
'getRecordings'         // { batch, term, domain, subject }

// Content
'getAnnouncements'      // { batch, status }
'getResources'          // { batch, term, domain, subject, studentEmail }
'getPolicies'           // { batch }
'getEvents'             // { batch }

// Notes
'getSessionNotes'       // { sessionId, studentEmail }
'getAllNotes'           // { studentEmail }
'saveSessionNote'       // { sessionId, studentEmail, content, tags }
'deleteNote'            // { noteId }
'togglePinNote'         // { noteId }

// Community
'getStudentsCornerActivity'    // { batch, page, limit }
'createStudentsCornerPost'     // { authorEmail, type, title, content }
'getStudentsCornerLeaderboard' // { batch }

// Acknowledgements
'submitAcknowledgment'  // { studentEmail, contentId, contentType }
```

### Exam Backend Actions

```javascript
// Exam Management
'createExam'            // { ...examData }
'getAllExams'           // { batch, term, status }
'getExamById'           // { examId }
'updateExam'            // { examId, ...updateData }
'deleteExam'            // { examId }
'publishExam'           // { examId }

// Questions
'addQuestion'           // { examId, ...questionData }
'updateQuestion'        // { questionId, ...updateData }
'deleteQuestion'        // { questionId }

// Student Attempts
'verifyExamPassword'    // { examId, studentEmail, password }
'startExamAttempt'      // { examId, studentEmail, sessionToken }
'saveAnswer'            // { attemptId, questionId, answer }
'submitExam'            // { attemptId }
'getExamResult'         // { attemptId }

// Proctoring
'logViolation'          // { attemptId, violationType, details }
'uploadScreenshot'      // { attemptId, imageData }
```

### Assignment Backend Actions

```javascript
// Assignment Management
'createAssignment'      // { ...assignmentData }
'getAssignments'        // { batch, term, subject }
'updateAssignment'      // { assignmentId, ...updateData }
'deleteAssignment'      // { assignmentId }

// Submissions
'submitAssignment'      // { assignmentId, studentEmail, files }
'getStudentSubmissions' // { studentEmail }
'checkSubmissionStatus' // { assignmentId, studentEmail }

// Peer Rating
'submitPeerRatings'     // { submissionId, ratings }
'getPeerRatings'        // { submissionId }
```

---

## Zoom Integration

### How Live Sessions Work

1. **Admin creates session** in Google Sheet with:
   - Zoom Meeting ID
   - Zoom Password
   - Batch, Term, Domain, Subject
   - Start/End time

2. **Frontend fetches** `getLiveSessions` action

3. **Student joins** via:
   ```
   https://zoom.us/wc/join/{meetingNumber}?pwd={password}
   ```

### Recording Storage

1. After Zoom meeting ends, recording is uploaded to Google Drive
2. Admin adds recording URLs to `RECORDINGS` sheet:
   - Speaker View URL
   - Gallery View URL
   - Screen Share URL
3. Frontend fetches via `getRecordings` action

---

## Sample Google Sheet Templates

### STUDENT_DATA Sheet
| Email | Full Name | Roll Number | Batch | isAdmin | Phone | LinkedIn |
|-------|-----------|-------------|-------|---------|-------|----------|
| student@example.com | John Doe | MBA001 | Batch 2024 | FALSE | +1234567890 | linkedin.com/in/johndoe |

### LIVE_SESSIONS Sheet
| ID | Meeting Number | Password | Session Name | Batch | Term | Domain | Subject | Start Time | End Time |
|----|---------------|----------|--------------|-------|------|--------|---------|------------|----------|
| LS001 | 8521596679 | SSB0924! | Consumer Behaviour Session 6 | Batch 2024 | Term 1 | Marketing and Branding | Consumer Behaviour | 2026-01-09 14:35 | 2026-01-09 16:50 |

### RECORDINGS Sheet
| ID | Session Name | Batch | Term | Domain | Subject | Speaker View URL | Gallery View URL | Duration |
|----|--------------|-------|------|--------|---------|------------------|------------------|----------|
| REC001 | Business Strategy Session 1 | Batch 2024 | Term 1 | Management & Strategy | Business Strategy | https://drive.google.com/... | https://drive.google.com/... | 135 |

---

## Testing Your Setup

1. Deploy your Apps Script
2. Test with curl:
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

3. Expected response:
```json
{"success": true, "message": "API is working!"}
```

4. Test student profile:
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "getStudentProfile", "studentEmail": "student@example.com"}'
```

---

## Security Considerations

1. **Firebase Auth**: Frontend authenticates users before making API calls
2. **Email Validation**: Backend should verify student email exists in STUDENT_DATA
3. **Batch Filtering**: Always filter content by student's batch
4. **Admin Actions**: Check `isAdmin` field for admin-only operations
5. **Rate Limiting**: Consider adding rate limiting in Apps Script

---

## Troubleshooting

### CORS Issues
Apps Script handles CORS automatically when deployed as "Anyone" can access.

### Quota Limits
Google Apps Script has limits:
- 6 min execution time per call
- 20,000 URL fetch calls/day
- 50 MB attachment size

### Performance Tips
- Use batch operations for multiple reads
- Cache frequently accessed data
- Paginate large datasets
