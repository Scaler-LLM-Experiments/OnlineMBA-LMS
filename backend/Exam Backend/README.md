# Exam Management Backend - Google Apps Script

This folder contains the Google Apps Script backend for the SSB Student Portal Exam Management System.

## Overview

The Exam Management System provides comprehensive exam creation, proctoring, and grading functionality with the following features:

- **Exam Creation & Management**: Create exams with multiple question types (MCQ, Image MCQ, Short Answer, Long Answer)
- **Practice Mode**: Lightweight practice exams without proctoring
- **Proctoring Features**: Webcam monitoring, screen sharing, fullscreen enforcement, violation tracking
- **Auto-grading**: Automatic grading for MCQ questions
- **Result Management**: Comprehensive result display with answer breakdowns
- **Password Protection**: Single or unique passwords per student

## Files

- `Exam_Management.js` - Main exam management functions including exam CRUD, question management, proctoring, and results

## Google Sheets Structure

The system uses a dedicated Google Sheet (EXAM_SHEET_ID) with the following sheets:

### Main Sheets
1. **Exams** - Stores exam metadata (title, type, dates, settings, etc.)
2. **Questions** - Stores all exam questions with options and correct answers
3. **Passwords** - Stores exam passwords (SAME or UNIQUE per student)

### Response Sheets (Created per exam)
Each exam gets its own Response Sheet with subsheets:
1. **Attempts** - Student exam attempts with timing and metadata
2. **Answers** - Detailed answer tracking per question
3. **Status** - Student completion status (Completed/Disqualified)
4. **Violations** - Proctoring violations log
5. **Screenshots** - Webcam screenshot tracking

## Key APIs

### Dropdown Data APIs
- `getTermStructureExam()` - Get batches, terms, domains, subjects from "Exam Term" sheet (exam-specific)
- `getExamTypes()` - Get available exam types from "Exam Category" sheet (filters rows where Category="EXAM")

### Exam Management
- `initializeExamSheets()` - One-time setup to create sheet structure
- `createExam(examData)` - Create new exam with all settings
- `getAllExams(filters)` - Get exams with optional filtering
- `getExamById(examId)` - Get single exam details
- `updateExam(examId, updates)` - Update exam
- `deleteExam(examId)` - Delete exam and related data

### Question Management
- `addQuestion(examId, questionData)` - Add question to exam
- `updateExamQuestion(examId, questionId, updates)` - Update question
- `deleteExamQuestion(examId, questionId)` - Delete question
- `reorderQuestions(examId, questionOrder)` - Reorder questions

### Password Management
- `verifyExamPassword(examId, password, studentEmail)` - Verify password before exam
- `generatePasswords(examId, studentCount)` - Generate unique passwords
- `savePasswords(examId, passwordData)` - Save student passwords

### Student Exam Attempt
- `startExamAttempt(examId, studentEmail, studentName)` - Start exam attempt
- `saveAnswer(attemptId, examId, questionId, answer)` - Save answer (auto-save)
- `logViolation(attemptId, examId, studentEmail, violationType, details)` - Log proctoring violation
- `uploadScreenshot(attemptId, examId, studentEmail, screenshot, type)` - Upload webcam screenshot
- `submitExam(attemptId, examId, studentEmail, answers, violations, timeSpent)` - Submit exam
- `getExamResult(attemptId, studentEmail)` - Get exam result with answers
- `getStudentAttempts(studentEmail, examId?)` - Get student's exam attempts
- `getStudentExamStatus(examId, studentEmail)` - Get completion status

## Question Types

1. **MCQ** - Multiple choice (A-J options)
2. **MCQ_IMAGE** - MCQ with question image
3. **SHORT_ANSWER** - Text input
4. **LONG_ANSWER** - Textarea for detailed responses

## Proctoring Settings

The system supports comprehensive proctoring:
- Webcam monitoring (required/optional)
- Screen sharing enforcement
- Fullscreen mandatory mode
- Tab/window switching detection
- Copy/paste/right-click restrictions
- Violation counting and auto-disqualification
- Periodic screenshot capture
- IP restriction support

## Practice Mode

Practice exams have simplified flow:
- No password requirement
- No proctoring
- No restrictions
- Can be retaken unlimited times
- Always show answers in results

## Deployment

### Current Deployment
- **Script ID**: `1pmnwJrlKUUINhvrWX1f_0p7QFqQe8LpIryYVRF1ys6pbFTYHGNW3Shai`
- **Deployment URL**: `https://script.google.com/macros/s/AKfycbxmu4IczTJIGbRvlxT8vjYQ0mpbv3uWl33juTkMy4U-grvBmnycHwWjt-Unqcy7jBXMZg/exec`
- **Environment Variable**: `REACT_APP_EXAM_BACKEND_URL`
- **Latest Deployment**: @7 - Updated deployment URL

### Setup
1. Create a new Google Apps Script project
2. Copy `Exam_Management.js` to the project
3. Update `EXAM_SHEET_ID` constant with your Google Sheet ID
4. Deploy as web app with "Anyone" access
5. Update the script ID in `.clasp.json`
6. Update `REACT_APP_EXAM_BACKEND_URL` in frontend `.env` file

### Using clasp
```bash
# Login to clasp
clasp login

# Push code to Google Apps Script
clasp push

# Deploy as web app
clasp deploy --description "Exam Management Backend"
```

## Frontend Integration

The frontend connects via:
- API URL: Set in `REACT_APP_BACKEND_API_URL` environment variable
- Service: `src/exam/services/examApi.ts`
- Pages: `src/exam/pages/` (student) and `src/exam/pages/admin/` (admin)

## Security Features

1. **Password Protection**: Exam-level password verification
2. **Email Validation**: Student email from Firebase auth
3. **Single Session**: Prevent multiple simultaneous attempts
4. **Violation Tracking**: Log all proctoring violations
5. **Auto-disqualification**: Based on violation threshold
6. **Drive Folder Permissions**: Exam-specific folders with restricted access

## Grading

- **MCQ**: Auto-graded with correct/incorrect/unattempted
- **Negative Marking**: Configurable per exam
- **Descriptive Questions**: Manual grading required
- **Partial Marks**: Not supported (full marks or zero)

## Best Practices

1. Always test exams in Practice Mode first
2. Set appropriate violation thresholds
3. Configure grace periods for fullscreen
4. Use unique passwords for high-stakes exams
5. Review violation logs before final grading
6. Set proper start/end times with buffer
7. Test proctoring settings before live exams

## Support

For issues or questions, refer to the main project repository or contact the development team.
