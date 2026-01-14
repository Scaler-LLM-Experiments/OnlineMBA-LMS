# Exam Management - Quick Reference Card

## 🎯 Two Files, Clear Separation

| File | Purpose | When to Use |
|------|---------|-------------|
| `Exam_Sheets_Setup.js` | Infrastructure setup | Run ONCE manually |
| `Exam_Management.js` | Business operations | Auto via API calls |

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Deploy
cd backend && clasp push && clasp open

# 2. In Apps Script Editor:
#    - Open: Exam_Sheets_Setup.js
#    - Run: initializeExamSheets()
#    - Check logs for ✓ success

# 3. Deploy Web App → Copy URL

# 4. Add to .env:
REACT_APP_EXAM_API_URL=YOUR_URL_HERE

# 5. Done! ✅
```

---

## 📊 What Gets Created

### 6 Constant Sheets:
1. **Exams_Master** 🟢 - All exams (30 columns)
2. **Exam_Questions** 🔵 - All questions (19 columns)
3. **Exam_Responses** 🟠 - All responses (27 columns)
4. **Exam_Passwords** 🟣 - Passwords (11 columns)
5. **Exam_Proctoring** 🔴 - Violations (13 columns)
6. **Exam_Analytics** 🟢 - Stats (13 columns)

### Per Exam:
- **Drive Folder**: `SSB Exam Management/EXAM_xxx/`
  - Proctoring_Screenshots/
  - Camera_Recordings/
- **Answer Sheet**: `EXAM_xxx_Answers`

---

## 🔒 18 Proctoring Options (All Included)

```javascript
proctoring: {
  // Security
  webcamRequired: true,           // ✅
  enforceScreensharing: true,     // ✅
  allowWindowSwitching: false,    // ✅
  allowTabSwitching: false,       // ✅
  allowTextSelection: false,      // ✅
  allowCopyPaste: false,          // ✅
  allowRightClick: false,         // ✅
  allowRestrictedEvents: false,   // ✅ (debug console, etc.)

  // Alerts
  alertsOnViolation: true,        // ✅
  beepAlerts: false,              // ✅
  exitCloseWarnings: true,        // ✅

  // Mode
  fullscreenMandatory: true,      // ✅
  singleSessionLogin: true,       // ✅

  // Actions
  logoutOnViolation: false,       // ✅
  disqualifyOnViolation: true,    // ✅
  maxViolationsBeforeAction: 5,   // ✅

  // IP
  allowedIPs: [],                 // ✅
  ipRestrictionEnabled: false     // ✅
}
```

---

## 📝 Key Fields in Exams_Master

| Field | Description |
|-------|-------------|
| **Drive Folder Link** | Stores proctoring files |
| **Response Sheet Link** | EXAM_xxx_Answers sheet |
| **Settings JSON** | All settings + 18 proctoring options |
| **Created By/At** | Who created, when |
| **Updated By/At** | Last update tracking |
| **Published By/At** | When DRAFT → ACTIVE |

---

## 🔄 Common Operations

### Create Exam
```javascript
createExam({
  examTitle: "Mid-Term",
  examType: "Mid-Term",
  term: "Term 1",
  domain: "Computer Science",
  subject: "DSA",
  duration: 90,
  totalMarks: 100
});
// ✅ Creates row + Drive folder + Answer sheet
```

### Add Question
```javascript
addQuestion(examId, {
  questionType: "MCQ",
  questionText: "What is O(n)?",
  optionA: "Linear",
  optionB: "Constant",
  correctAnswer: "A",
  marks: 2
});
// ✅ Adds to Exam_Questions + updates count
```

### Publish Exam
```javascript
updateExam(examId, {
  status: "ACTIVE",
  updatedBy: "Prof. Smith"
});
// ✅ Sets Published By/At automatically
```

### Delete Exam
```javascript
deleteExam(examId);
// ✅ Deletes:
// - Row from Exams_Master
// - All questions
// - All responses
// - All passwords
// - All violations
// - Answer sheet
// - Drive folder (to trash)
```

---

## 🛠️ Maintenance Functions

### Check Health
```javascript
// In Apps Script, run from Exam_Sheets_Setup.js
verifyExamSheets()
// Shows: ✓ OK or ✗ MISSING for each sheet
```

### Get Statistics
```javascript
getExamSheetsStats()
// Returns: row counts, column counts
```

### Reset Everything (⚠️ DANGER)
```javascript
deleteAllExamSheets()  // With confirmation
initializeExamSheets() // Recreate structure
```

---

## 📁 What's Been Built

### ✅ Complete:
- Backend (2 files, clean separation)
- Sheet structure (6 constant + dynamic)
- Drive integration
- Audit trail
- 18 proctoring settings
- API service (TypeScript)
- Exam list page
- Exam builder shell
- Basic Details tab

### 🔨 TODO (4 tabs):
- Questions Tab + Modal
- Settings Tab (with 18 proctoring options UI)
- Password Tab
- Preview Tab

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Exams_Master not found" | Run `initializeExamSheets()` |
| Can't see sheets | Check spreadsheet ID is correct |
| API not responding | Verify Web App URL in .env |
| Functions not found | Check you're in correct .js file |

---

## 📚 Documentation Files

| File | What It Has |
|------|-------------|
| `EXAM_BACKEND_STRUCTURE.md` | 2-file architecture explained |
| `EXAM_COMPLETE_STRUCTURE.md` | All fields, complete schema |
| `EXAM_FINAL_SUMMARY.md` | Everything at a glance |
| `EXAM_QUICKSTART.md` | 5-minute setup guide |
| `EXAM_QUICK_REFERENCE.md` | This file! |

---

## 🎯 Sheet Link

https://docs.google.com/spreadsheets/d/1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14

---

## ⚡ TL;DR

1. Run `initializeExamSheets()` once from `Exam_Sheets_Setup.js`
2. Deploy as Web App
3. Use `Exam_Management.js` for all operations
4. Frontend: `/admin/exams` works, complete the 4 remaining tabs
5. All 18 proctoring options stored in Settings JSON
6. Drive folders + Answer sheets created automatically
7. Full audit trail: Created/Updated/Published By/At

**That's it! You're ready to build.** 🚀
