# Exam Management System - Final Sheet Structure

## ✅ Refactored to Constant Sheets (Like Forms)

Similar to the Forms Management system, the Exam Management now uses **6 constant sheets** where rows are added for each exam/question/response instead of creating new sheets per exam.

---

## Sheet Structure

### Sheet ID: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`

---

## 1️⃣ Exams_Master
**Color**: Green (#34D399)
**Purpose**: Stores all exam metadata (one row per exam)

| Column | Description |
|--------|-------------|
| Exam ID | Unique identifier (EXAM_timestamp) |
| Exam Title | Display name |
| Exam Type | Quiz / Mid-Term / End-Term |
| Term | Term 1 / Term 2 / Term 3 |
| Domain | Computer Science, Math, etc. |
| Subject | Specific subject name |
| Description | Optional description |
| Duration (minutes) | Time limit |
| Total Marks | Maximum score |
| Passing Marks | Minimum to pass |
| Start DateTime | When exam opens |
| End DateTime | When exam closes |
| Instructions | Student instructions |
| Status | DRAFT / ACTIVE / COMPLETED / ARCHIVED |
| Password Type | SAME / UNIQUE |
| Master Password | If SAME type |
| Settings JSON | All exam settings as JSON |
| Created By | Admin name |
| Created At | Timestamp |
| Published At | When made ACTIVE |
| Total Questions | Auto-calculated count |
| Total Students Attempted | Auto-calculated |
| Average Score | Auto-calculated |
| Highest Score | Auto-calculated |
| Lowest Score | Auto-calculated |

---

## 2️⃣ Exam_Questions
**Color**: Blue (#60A5FA)
**Purpose**: Stores ALL questions from ALL exams (one row per question)

| Column | Description |
|--------|-------------|
| Question ID | Unique identifier (Q_timestamp) |
| **Exam ID** | Links to Exams_Master |
| Question Number | Sequential within exam |
| Question Type | MCQ / MCQ_IMAGE / SHORT_ANSWER / LONG_ANSWER |
| Question Text | The actual question |
| Question Image URL | For MCQ_IMAGE type |
| Option A | First option |
| Option B | Second option |
| Option C | Third option (optional) |
| Option D | Fourth option (optional) |
| Option E | Fifth option (optional) |
| Correct Answer | A/B/C/D/E or text for SHORT |
| Marks | Points awarded |
| Negative Marks | Points deducted for wrong |
| Difficulty | Easy / Medium / Hard |
| Explanation | Shown after submission |
| Enable Rough Space | Boolean |
| Created At | Timestamp |
| Updated At | Timestamp |

---

## 3️⃣ Exam_Responses
**Color**: Orange (#F59E0B)
**Purpose**: Stores ALL student responses for ALL exams (one row per response)

| Column | Description |
|--------|-------------|
| Response ID | Unique identifier (R_timestamp) |
| **Exam ID** | Links to Exams_Master |
| Student ID | Student identifier |
| Student Name | Full name |
| Student Email | Email address |
| Start Time | When exam started |
| Submit Time | When submitted |
| Time Taken (minutes) | Duration |
| Total Score | Calculated score |
| Percentage | Score percentage |
| Status | IN_PROGRESS / SUBMITTED / GRADED |
| IP Address | Student IP |
| Browser Info | User agent |
| Answers JSON | All answers as JSON object |
| Rough Work JSON | Notes per question |
| Proctoring Violations | Summary of violations |
| Violation Count | Number of violations |
| Auto Submitted | Boolean (if time ran out) |
| Graded | Boolean |
| Graded By | Instructor name |
| Graded At | Timestamp |
| Feedback | Instructor comments |

**Answers JSON Format**:
```json
{
  "Q_1699999999999": {
    "answer": "B",
    "timeTaken": 45,
    "markedForReview": false
  },
  "Q_1699999999998": {
    "answer": "This is my short answer",
    "timeTaken": 120,
    "markedForReview": true
  }
}
```

---

## 4️⃣ Exam_Passwords
**Color**: Purple (#8B5CF6)
**Purpose**: Stores ALL student passwords for ALL exams (one row per student per exam)

| Column | Description |
|--------|-------------|
| Password ID | Unique identifier (PWD_timestamp_random) |
| **Exam ID** | Links to Exams_Master |
| Student ID | Student identifier |
| Student Name | Full name |
| Student Email | For email delivery |
| Password | Generated password |
| Generated At | Timestamp |
| Sent At | When email sent |
| Email Status | PENDING / SENT / FAILED |
| Used | Boolean |
| Used At | Timestamp |

---

## 5️⃣ Exam_Proctoring
**Color**: Red (#EF4444)
**Purpose**: Stores ALL violation logs for ALL exams (one row per violation)

| Column | Description |
|--------|-------------|
| Log ID | Unique identifier (LOG_timestamp) |
| **Exam ID** | Links to Exams_Master |
| Response ID | Links to Exam_Responses |
| Student ID | Student identifier |
| Student Name | Full name |
| Timestamp | When violation occurred |
| Violation Type | TAB_SWITCH / EXIT_FULLSCREEN / CAMERA_LOST / etc. |
| Violation Details | Description |
| Question Number | Which question they were on |
| Severity | LOW / MEDIUM / HIGH / CRITICAL |
| Screenshot URL | If captured |
| Camera Frame URL | If captured |
| Action Taken | WARNING / AUTO_SUBMIT / FLAGGED |

**Violation Types**:
- `TAB_SWITCH` - Switched to another tab
- `EXIT_FULLSCREEN` - Exited full screen mode
- `CAMERA_LOST` - Camera feed disconnected
- `MULTIPLE_FACES` - More than one person detected
- `NO_FACE` - No face detected
- `SUSPICIOUS_MOVEMENT` - Unusual activity
- `NETWORK_DISCONNECT` - Internet lost

---

## 6️⃣ Exam_Analytics
**Color**: Green (#10B981)
**Purpose**: Question-wise performance analytics for ALL exams (one row per question)

| Column | Description |
|--------|-------------|
| Analytics ID | Unique identifier (ANAL_timestamp) |
| **Exam ID** | Links to Exams_Master |
| Question ID | Links to Exam_Questions |
| Question Number | For reference |
| Total Attempts | Number of students who saw it |
| Correct Answers | Number who got it right |
| Wrong Answers | Number who got it wrong |
| Skipped | Number who didn't answer |
| Accuracy % | (Correct / Total) * 100 |
| Average Time (seconds) | Avg time spent |
| Difficulty Index | Calculated difficulty |
| Discrimination Index | How well it separates students |
| Last Updated | Timestamp |

---

## Data Relationships

```
Exams_Master (Exam ID)
    ↓
    ├── Exam_Questions (filtered by Exam ID)
    ├── Exam_Responses (filtered by Exam ID)
    ├── Exam_Passwords (filtered by Exam ID)
    ├── Exam_Proctoring (filtered by Exam ID)
    └── Exam_Analytics (filtered by Exam ID)
```

---

## Key Differences from Old Structure

### ❌ OLD (Per-Exam Sheets)
```
Exams_Master
EXAM_1234567890_Questions
EXAM_1234567890_Responses
EXAM_1234567890_Passwords
EXAM_1234567890_Proctoring
EXAM_1234567890_Analytics
EXAM_9876543210_Questions
EXAM_9876543210_Responses
...
```
**Issues**: Too many sheets, hard to query across exams

### ✅ NEW (Constant Sheets)
```
Exams_Master
Exam_Questions (all exams)
Exam_Responses (all exams)
Exam_Passwords (all exams)
Exam_Proctoring (all exams)
Exam_Analytics (all exams)
```
**Benefits**: Clean structure, easy cross-exam queries, matches forms structure

---

## Initialization

Run once to create all 6 sheets:

```javascript
function initializeExamSheets()
```

This creates:
- ✓ Exams_Master (green header)
- ✓ Exam_Questions (blue header)
- ✓ Exam_Responses (orange header)
- ✓ Exam_Passwords (purple header)
- ✓ Exam_Proctoring (red header)
- ✓ Exam_Analytics (green header)

---

## Example Data Flow

### Creating an Exam:
1. **Add row to Exams_Master**
   - Exam ID: `EXAM_1699999999999`
   - Title: "Data Structures Mid-Term"
   - Status: DRAFT

2. **Add questions to Exam_Questions**
   - Row 1: Q_1699999999991, EXAM_1699999999999, 1, MCQ, ...
   - Row 2: Q_1699999999992, EXAM_1699999999999, 2, MCQ, ...
   - Row 3: Q_1699999999993, EXAM_1699999999999, 3, SHORT_ANSWER, ...

3. **Generate passwords in Exam_Passwords** (if UNIQUE type)
   - Row 1: PWD_xxx, EXAM_1699999999999, STU_001, password123
   - Row 2: PWD_xxx, EXAM_1699999999999, STU_002, password456
   - ...

4. **Publish exam**
   - Update Status in Exams_Master to ACTIVE

### Student Takes Exam:
1. **Create response in Exam_Responses**
   - Response ID: R_1699999999999
   - Exam ID: EXAM_1699999999999
   - Student ID: STU_001
   - Status: IN_PROGRESS

2. **Log violations in Exam_Proctoring**
   - LOG_xxx, EXAM_1699999999999, R_1699999999999, TAB_SWITCH, ...

3. **Submit exam**
   - Update Answers JSON in Exam_Responses
   - Change Status to SUBMITTED

4. **Auto-grade**
   - Calculate score
   - Update Total Score in Exam_Responses
   - Update analytics in Exam_Analytics

---

## Query Examples

### Get all questions for an exam:
```sql
SELECT * FROM Exam_Questions
WHERE "Exam ID" = 'EXAM_1699999999999'
ORDER BY "Question Number"
```

### Get all responses for an exam:
```sql
SELECT * FROM Exam_Responses
WHERE "Exam ID" = 'EXAM_1699999999999'
```

### Get violations for a student:
```sql
SELECT * FROM Exam_Proctoring
WHERE "Student ID" = 'STU_001'
  AND "Exam ID" = 'EXAM_1699999999999'
ORDER BY Timestamp
```

### Delete an exam (cascading):
```javascript
// Delete from Exams_Master
// Delete all questions with matching Exam ID
// Delete all responses with matching Exam ID
// Delete all passwords with matching Exam ID
// Delete all proctoring logs with matching Exam ID
// Delete all analytics with matching Exam ID
```

---

## Migration Notes

If you have the old structure:
1. The refactored code is backward compatible
2. Simply deploy the new `Exam_Management.js`
3. Run `initializeExamSheets()` to create new structure
4. Old per-exam sheets can be deleted if present

---

## Benefits of This Structure

1. ✅ **Consistent with Forms**: Same pattern as Forms_Master → Forms_Responses
2. ✅ **Scalable**: No limit on number of exams
3. ✅ **Easy Analytics**: Query across all exams easily
4. ✅ **Clean Organization**: 6 sheets instead of 5N sheets (where N = exam count)
5. ✅ **Better Performance**: Fewer sheets = faster queries
6. ✅ **Simpler Deletion**: Delete by Exam ID instead of sheet deletion
7. ✅ **Cross-Exam Reports**: Generate reports across multiple exams

---

This structure is production-ready and matches industry best practices for relational data in spreadsheets!
