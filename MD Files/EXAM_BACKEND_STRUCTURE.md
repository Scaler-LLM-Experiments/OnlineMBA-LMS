# Exam Management Backend - File Structure

## 📁 Two-File Architecture

The backend is now split into **2 separate files** for better organization:

### 1️⃣ `Exam_Sheets_Setup.js` (Setup Only - Run Once)
### 2️⃣ `Exam_Management.js` (Operations - Main API)

---

## File 1: Exam_Sheets_Setup.js

**Purpose**: One-time initialization to create sheet structure
**Run**: Only ONCE when setting up the system
**Contains**:
- `initializeExamSheets()` - Creates all 6 constant sheets
- `verifyExamSheets()` - Checks if sheets exist
- `getExamSheetsStats()` - Shows sheet statistics
- `deleteAllExamSheets()` - Danger zone (with confirmation)

### Functions:

#### `initializeExamSheets()`
Creates 6 sheets with proper headers and colors:
1. ✅ Exams_Master (Green #34D399)
2. ✅ Exam_Questions (Blue #60A5FA)
3. ✅ Exam_Responses (Orange #F59E0B)
4. ✅ Exam_Passwords (Purple #8B5CF6)
5. ✅ Exam_Proctoring (Red #EF4444)
6. ✅ Exam_Analytics (Green #10B981)

**Returns**:
```javascript
{
  success: true,
  message: "All exam sheets initialized successfully",
  details: [
    "✓ Exams_Master sheet created",
    "✓ Exam_Questions sheet created",
    ...
  ]
}
```

#### `verifyExamSheets()`
Checks if all required sheets exist and have headers.

**Returns**:
```javascript
{
  success: true/false,
  details: [
    "✓ OK: Exams_Master (5 data rows)",
    "✓ OK: Exam_Questions (23 data rows)",
    ...
  ]
}
```

#### `getExamSheetsStats()`
Gets row/column counts for all sheets.

**Returns**:
```javascript
{
  "Exams_Master": { exists: true, rowCount: 5, columnCount: 30 },
  "Exam_Questions": { exists: true, rowCount: 23, columnCount: 19 },
  ...
}
```

#### `deleteAllExamSheets()`
⚠️ **DANGER**: Deletes all exam sheets
- Shows confirmation dialog
- Removes all 6 constant sheets
- Cannot be undone!

---

## File 2: Exam_Management.js

**Purpose**: All exam operations (CRUD, questions, passwords, etc.)
**Run**: This is your main API file
**Contains**: All business logic and API endpoints

### Key Functions:

#### Exam Operations:
- `createExam(examData)` - Create new exam
- `getAllExams(filters)` - Get exam list
- `getExamById(examId)` - Get single exam
- `updateExam(examId, updates)` - Update exam
- `deleteExam(examId)` - Delete exam + cleanup

#### Question Management:
- `addQuestion(examId, questionData)` - Add question
- `updateQuestion(examId, questionId, updates)` - Update question
- `deleteQuestion(examId, questionId)` - Delete question
- `reorderQuestions(examId, questionOrder)` - Reorder questions

#### Password Management:
- `generateStudentPasswords(examId, count)` - Generate passwords
- `saveStudentPasswords(examId, passwordData)` - Save to sheet

#### Helper Functions:
- `createExamDriveFolder(examId, title)` - Creates Drive folder
- `createExamResponseSheet(examId, title)` - Creates answer sheet
- `formatHeaderRow(sheet, count, color)` - Formats headers

#### Web App Handlers:
- `doPost(e)` - Handles POST requests
- `doGet(e)` - Handles GET requests
- `jsonResponse(data)` - Formats JSON response

---

## 🚀 Setup Instructions

### Step 1: Deploy Both Files

```bash
cd backend

# Make sure both files are in your backend folder
ls -la
# Should show:
# - Exam_Sheets_Setup.js
# - Exam_Management.js
# - Code.js (main backend)

# Push to Apps Script
clasp push
```

### Step 2: Initialize Sheets (One Time)

```bash
# Open Apps Script Editor
clasp open
```

In Apps Script Editor:
1. **Select**: `Exam_Sheets_Setup.js` from files list
2. **Function dropdown**: Select `initializeExamSheets`
3. **Click**: Run button (▶️)
4. **Grant permissions** if prompted
5. **Check logs**: View → Logs (Ctrl+Enter)

You should see:
```
=== EXAM SHEETS INITIALIZATION COMPLETE ===
✓ Exams_Master sheet created
✓ Exam_Questions sheet created
✓ Exam_Responses sheet created
✓ Exam_Passwords sheet created
✓ Exam_Proctoring sheet created
✓ Exam_Analytics sheet created
```

### Step 3: Verify Setup (Optional but Recommended)

In Apps Script Editor:
1. **Function dropdown**: Select `verifyExamSheets`
2. **Click**: Run button
3. **Check logs**: Should show all sheets OK

### Step 4: Deploy Web App

1. **Click**: Deploy → New Deployment
2. **Type**: Web App
3. **Execute as**: Me
4. **Who has access**: Anyone (or as needed)
5. **Deploy**
6. **Copy Web App URL**

### Step 5: Update Frontend

Add to `.env`:
```bash
REACT_APP_EXAM_API_URL=YOUR_WEB_APP_URL_HERE
```

---

## 📊 Sheet Structure Created

After running `initializeExamSheets()`, you'll have:

### Google Sheet: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`

**6 Constant Sheets**:

1. **Exams_Master** (Green)
   - 30 columns
   - Headers: Exam ID, Title, Type, Term, Domain, Subject, etc.
   - Includes: Drive Link, Response Sheet Link
   - Tracking: Created By/At, Updated By/At, Published By/At

2. **Exam_Questions** (Blue)
   - 19 columns
   - One row per question (all exams)
   - Links to Exams_Master via Exam ID

3. **Exam_Responses** (Orange)
   - 27 columns
   - One row per student response
   - Includes: Answer Sheet Link, Proctoring Links
   - Tracking: Created At, Updated At

4. **Exam_Passwords** (Purple)
   - 11 columns
   - One row per student per exam
   - Tracks password usage

5. **Exam_Proctoring** (Red)
   - 13 columns
   - One row per violation
   - Includes: Screenshots, Camera frames

6. **Exam_Analytics** (Green)
   - 13 columns
   - One row per question
   - Performance metrics

**Plus Dynamic Sheets** (created per exam):
- `EXAM_{examId}_Answers` - Individual answer rows

**Plus Drive Folders** (created per exam):
- `SSB Exam Management/EXAM_{examId}_Title/`

---

## 🔄 Typical Workflow

### First Time Setup:
```
1. Deploy both .js files to Apps Script
2. Run initializeExamSheets() from Exam_Sheets_Setup.js
3. Verify sheets created successfully
4. Deploy as Web App
5. Never touch Exam_Sheets_Setup.js again
```

### Daily Operations:
```
1. All operations use Exam_Management.js
2. Frontend calls Web App URL
3. Create/Read/Update/Delete exams
4. Add questions, manage passwords
5. Everything automatic
```

### Maintenance:
```
# Check if sheets are healthy
Run: verifyExamSheets()

# Get statistics
Run: getExamSheetsStats()

# Reset everything (DANGER!)
Run: deleteAllExamSheets()
Then: initializeExamSheets()
```

---

## 🎯 Benefits of Two-File Structure

### ✅ Separation of Concerns
- Setup code separate from business logic
- Cleaner, more maintainable
- Easier to understand

### ✅ Safety
- Can't accidentally initialize sheets via API
- Setup requires manual execution
- Prevents data loss

### ✅ Performance
- Exam_Management.js doesn't load unused setup code
- Faster API responses
- Better memory usage

### ✅ Clear Purpose
- `Exam_Sheets_Setup.js` = Infrastructure
- `Exam_Management.js` = Business Logic

---

## 📝 Function Reference Quick Guide

### Exam_Sheets_Setup.js (Run Manually)
```javascript
initializeExamSheets()      // Create all sheets
verifyExamSheets()          // Check sheet health
getExamSheetsStats()        // Get statistics
deleteAllExamSheets()       // ⚠️ Delete everything
```

### Exam_Management.js (API Calls)

**Exams**:
```javascript
createExam(examData)
getAllExams(filters)
getExamById(examId)
updateExam(examId, updates)
deleteExam(examId)
```

**Questions**:
```javascript
addQuestion(examId, questionData)
updateQuestion(examId, questionId, updates)
deleteQuestion(examId, questionId)
reorderQuestions(examId, questionOrder)
```

**Passwords**:
```javascript
generateStudentPasswords(examId, studentCount)
saveStudentPasswords(examId, passwordData)
```

---

## 🔧 Troubleshooting

### "Exams_Master sheet not found"
→ Run `initializeExamSheets()` from Exam_Sheets_Setup.js

### "Failed to create exam"
→ Check if sheets were initialized
→ Run `verifyExamSheets()` to check

### Want to reset everything?
→ Run `deleteAllExamSheets()` (will ask for confirmation)
→ Then run `initializeExamSheets()` again

### Can't find function in dropdown
→ Make sure you're viewing the correct .js file
→ Setup functions are in Exam_Sheets_Setup.js
→ API functions are in Exam_Management.js

---

## ✅ Checklist

Before going live:

- [ ] Both files pushed to Apps Script
- [ ] `initializeExamSheets()` executed successfully
- [ ] All 6 sheets visible in Google Sheet
- [ ] `verifyExamSheets()` returns success
- [ ] Web App deployed
- [ ] Web App URL added to .env
- [ ] Frontend can connect to API
- [ ] Test exam created successfully

---

This two-file structure is production-ready and follows best practices for Apps Script development! 🚀
