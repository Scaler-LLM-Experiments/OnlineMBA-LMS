# Exam Management System - Setup Guide

## Quick Start

### Step 1: Deploy Backend to Google Apps Script

1. **Add file to clasp**
```bash
# Make sure backend/Exam_Management.js is in your clasp project
cd backend
clasp push
```

2. **Deploy as Web App**
   - Open script in Apps Script Editor: `clasp open`
   - Click **Deploy** > **New Deployment**
   - Select type: **Web App**
   - Settings:
     - Execute as: **Me**
     - Who has access: **Anyone** (or restrict as needed)
   - Click **Deploy**
   - Copy the **Web App URL**

3. **Update .env file**
```bash
# Add to your .env file in project root
REACT_APP_EXAM_API_URL=YOUR_COPIED_WEB_APP_URL_HERE
```

### Step 2: Initialize Google Sheets Structure

**Option A: Run from Apps Script Editor**
1. Open the script: `clasp open`
2. Select function: `initializeExamSheets`
3. Click **Run**
4. Check execution log for success

**Option B: Run via API Test**
```bash
# Use curl or Postman
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "initializeExamSheets"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Exam sheets initialized successfully",
  "details": [
    "✓ Exams_Master sheet created"
  ]
}
```

### Step 3: Verify Sheet Structure

Open the spreadsheet:
- Spreadsheet ID: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`
- URL: https://docs.google.com/spreadsheets/d/1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14

You should see:
- ✅ **Exams_Master** sheet with green header row
- Columns: Exam ID, Exam Title, Exam Type, Term, etc.

### Step 4: Add Routes to App

Add to `src/App.tsx`:

```typescript
// Import components
import ExamManagementPage from './pages/admin/ExamManagementPage';
import ExamBuilderPage from './pages/admin/ExamBuilderPage';

// Add routes
<Route path="/admin/exams" element={<ExamManagementPage />} />
<Route path="/admin/exams/create" element={<ExamBuilderPage />} />
<Route path="/admin/exams/edit/:examId" element={<ExamBuilderPage />} />
```

### Step 5: Add to Admin Dashboard

Update `src/pages/AdminPage.tsx`:

```typescript
const adminCards = [
  // ... existing cards ...
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'Exam Creation',
    onClick: () => navigate('/admin/exams'),
    description: 'Create and manage proctored exams'
  }
];
```

### Step 6: Test Basic Flow

1. **Navigate to Admin Exams**
   - Go to `/admin/exams`
   - Should see empty state

2. **Click "Create New Exam"**
   - Should navigate to `/admin/exams/create`
   - Should see 5 tabs with Basic Details active

3. **Fill Basic Details**
   - Exam Title: "Test Exam 1"
   - Type: Quiz
   - Term: Term 1
   - Domain: Computer Science
   - Subject: Testing
   - Duration: 30
   - Total Marks: 50
   - Start Date: [Future date]
   - End Date: [After start date]

4. **Click "Save as Draft"**
   - Should save to Google Sheets
   - Check `Exams_Master` sheet for new row
   - Should see new sheets created:
     - `EXAM_[timestamp]_Questions`
     - `EXAM_[timestamp]_Responses`
     - `EXAM_[timestamp]_Passwords`
     - `EXAM_[timestamp]_Proctoring`
     - `EXAM_[timestamp]_Analytics`

## API Testing with curl

### Create Exam
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createExam",
    "examData": {
      "examTitle": "Sample Quiz",
      "examType": "Quiz",
      "term": "Term 1",
      "domain": "Computer Science",
      "subject": "Data Structures",
      "duration": 60,
      "totalMarks": 100,
      "passingMarks": 40,
      "startDateTime": "2025-12-01T10:00:00",
      "endDateTime": "2025-12-01T12:00:00",
      "status": "DRAFT",
      "passwordType": "SAME",
      "masterPassword": "test123"
    }
  }'
```

### Get All Exams
```bash
curl "YOUR_WEB_APP_URL?action=getAllExams"
```

### Get Exam by ID
```bash
curl "YOUR_WEB_APP_URL?action=getExamById&examId=EXAM_1234567890"
```

### Add Question
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addQuestion",
    "examId": "EXAM_1234567890",
    "questionData": {
      "questionType": "MCQ",
      "questionText": "What is 2 + 2?",
      "optionA": "3",
      "optionB": "4",
      "optionC": "5",
      "optionD": "6",
      "correctAnswer": "B",
      "marks": 1,
      "negativeMarks": 0,
      "difficulty": "Easy"
    }
  }'
```

## Troubleshooting

### Issue: "Exams_Master sheet not found"
**Solution**: Run `initializeExamSheets()` function first

### Issue: "Failed to create exam sheets"
**Solution**:
- Check if spreadsheet ID is correct
- Ensure Apps Script has access to the spreadsheet
- Check execution logs for detailed error

### Issue: CORS errors in browser
**Solution**:
- Ensure Web App is deployed with correct permissions
- Use `doPost` for POST requests, `doGet` for GET requests
- Check that URL is the deployment URL, not the script URL

### Issue: "Permission denied"
**Solution**:
- Grant Apps Script necessary permissions
- Re-authorize if prompted
- Check sharing settings on the spreadsheet

### Issue: Empty response from API
**Solution**:
- Check Apps Script execution logs
- Verify Web App deployment is active
- Test with curl first before testing in browser

## Next Development Steps

Once basic setup is working:

1. ✅ Create Questions Tab component
2. ✅ Create Question Builder Modal (all 4 types)
3. ✅ Create Settings Tab
4. ✅ Create Password Tab
5. ✅ Create Preview Tab
6. ✅ Test complete admin flow
7. ⬜ Build student-side components
8. ⬜ Implement proctoring features
9. ⬜ Add grading interface
10. ⬜ Build analytics dashboard

## Production Checklist

Before going live:

- [ ] Change Web App access to restrict by domain
- [ ] Add authentication middleware
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Enable error logging
- [ ] Set up monitoring
- [ ] Create backup mechanism
- [ ] Test with real student load
- [ ] Document admin procedures
- [ ] Train instructors on system

## Support

For issues or questions:
1. Check execution logs in Apps Script
2. Verify sheet structure matches documentation
3. Test API endpoints with curl
4. Check browser console for frontend errors
5. Review EXAM_MANAGEMENT_SUMMARY.md for architecture details

---

**Sheet ID**: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`

**Backend File**: `backend/Exam_Management.js`

**Frontend Entry Point**: `/admin/exams`
