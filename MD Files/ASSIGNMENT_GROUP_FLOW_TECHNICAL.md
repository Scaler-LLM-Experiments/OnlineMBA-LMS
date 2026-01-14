# Assignment Portal - Group Assignment Flow (Technical Documentation)

## Complete Flow: Frontend → Backend → Google Sheets

---

## Table of Contents
1. [Overview](#overview)
2. [Group Members Sheet Structure](#group-members-sheet-structure)
3. [Initial Submission Flow](#initial-submission-flow)
4. [Viewing/Updating Submission Flow](#viewingupdating-submission-flow)
5. [Key Differences](#key-differences)
6. [Code References](#code-references)

---

## Overview

The assignment portal uses a **"Group Members" Google Sheet** to automatically pre-populate group information based on:
- Student's Batch
- Assignment Subject
- SubjectGroup (optional grouping within a subject)

**Key Insight**: Group members and group name ARE automatically filled for initial submissions using data from the "Group Members" sheet!

---

## Group Members Sheet Structure

### Location
Google Sheets spreadsheet configured in `ASSIGNMENT_CONFIG.SHEET_ID`
Sheet name: **"Group Members"**

### Column Structure
```
| Student Email | Full Name | Roll No | Batch | Subject 1 | SubjectGroup 1 | Subject 2 | SubjectGroup 2 | ... |
|---------------|-----------|---------|-------|-----------|----------------|-----------|----------------|-----|
| student@...   | John Doe  | 12345   | B1    | Math      | Group A        | Physics   | Group B        | ... |
```

### How It Works
- **Subject columns**: `Subject 1`, `Subject 2`, `Subject 3`, etc.
- **SubjectGroup columns**: `SubjectGroup 1`, `SubjectGroup 2`, `SubjectGroup 3`, etc.
- **Pairing**: Each Subject has a corresponding SubjectGroup in the next column
- **SubjectGroup value**: Can be:
  - A group name (e.g., "Group A", "Team 1") → students are grouped by this
  - Empty/blank → all students with same Batch + Subject are grouped together

---

## Initial Submission Flow

### Step 1: Student Opens Assignment (Active Tab)

**Frontend: `/src/pages/assignment/AssignmentDetailsModal.tsx`**

```typescript
// Line 95-96: When modal opens for group assignment
if (assignment.groupAssignment === 'Yes') {
  fetchStudentsForSubject();
}
```

### Step 2: Fetch Group Members API Call

**Frontend: Line 265-295**
```typescript
const fetchStudentsForSubject = async () => {
  const result = await assignmentApiService.getGroupMembersBySubjectGroup(
    user.email,
    assignment.batch,
    assignment.subject
  );

  if (result.success && result.data) {
    setAvailableStudents(result.data);

    // ✅ PRE-SELECT GROUP MEMBERS (exclude current user)
    const preSelectedEmails = result.data
      .filter(student => student.email !== user.email)
      .map(student => student.email);
    setGroupMembers(preSelectedEmails);

    // ✅ SET GROUP NAME (if returned from backend)
    if (result.groupName) {
      setGroupName(result.groupName);
    }
  }
}
```

**API Service: `/src/services/assignmentApi.ts` Line 543-553**
```typescript
async getGroupMembersBySubjectGroup(
  studentEmail: string,
  batch: string,
  subject: string
): Promise<{
  success: boolean;
  data?: { email: string; fullName: string; rollNo: string }[];
  groupName?: string | null;
  error?: string
}> {
  return this.makeRequest(
    'getGroupMembersBySubjectGroup',
    { batch, subject },
    studentEmail
  );
}
```

### Step 3: Backend Processing

**Backend: `/backend/Assignment Backend/Assignment_Code.js` Line 146-147**
```javascript
case 'getGroupMembersBySubjectGroup':
  result = getGroupMembersBySubjectGroup(params.batch, params.subject, studentEmail);
  break;
```

**Backend: `/backend/Assignment Backend/Assignment_Management.js` Line 2676-2826**

#### Algorithm:

1. **Open "Group Members" sheet** (Line 2681)
   ```javascript
   const groupMembersSheet = ss.getSheetByName('Group Members');
   ```

2. **Find current student's row** (Line 2712-2717)
   ```javascript
   for (let i = 1; i < data.length; i++) {
     if (data[i][emailCol].toLowerCase() === studentEmail.toLowerCase()) {
       studentRow = data[i];
       break;
     }
   }
   ```

3. **Find student's SubjectGroup for this subject** (Line 2729-2748)
   ```javascript
   // Headers: Subject 1, SubjectGroup 1, Subject 2, SubjectGroup 2, ...
   for (let i = 0; i < headers.length; i++) {
     if (headers[i].match(/^Subject \d+$/)) {
       if (studentRow[i] === subject) {
         // Found subject, get SubjectGroup from next column
         studentSubjectGroup = studentRow[i + 1];
         break;
       }
     }
   }
   ```

4. **Find all students with matching criteria** (Line 2762-2805)
   ```javascript
   for (let i = 1; i < data.length; i++) {
     const row = data[i];

     if (row[batchCol] === batch) {
       // Find students with same subject
       if (row[subjectCol] === subject) {

         // If SubjectGroup exists, also match by SubjectGroup
         if (studentSubjectGroup) {
           if (row[subjectGroupCol] === studentSubjectGroup) {
             groupMembers.push({
               email: row[emailCol],
               fullName: row[nameCol],
               rollNo: row[rollNoCol]
             });
           }
         } else {
           // No SubjectGroup - include all students with Batch + Subject
           groupMembers.push({
             email: row[emailCol],
             fullName: row[nameCol],
             rollNo: row[rollNoCol]
           });
         }
       }
     }
   }
   ```

5. **Return data** (Line 2813-2817)
   ```javascript
   return {
     success: true,
     data: groupMembers,              // Array of all group members
     groupName: studentSubjectGroup   // Group name (e.g., "Group A") or null
   };
   ```

### Step 4: Frontend UI Update

**Result:**
- ✅ **Group Name field**: Auto-filled with SubjectGroup value (e.g., "Group A")
- ✅ **Group Members**: Automatically pre-selected (checkboxes ticked) for all students EXCEPT current user
- ✅ **Available Students dropdown**: Shows all students in the group for manual adjustments

**Frontend: Line 1872-1882**
```typescript
{availableStudents.map((student) => (
  <Checkbox
    checked={groupMembers.includes(student.email)}  // ✅ Auto-ticked
    onChange={(e) => {
      if (e.target.checked) {
        setGroupMembers(prev => [...prev, student.email]);
      } else {
        setGroupMembers(prev => prev.filter(email => email !== student.email));
      }
    }}
  />
))}
```

---

## Viewing/Updating Submission Flow

### When Student Clicks "Completed" Tab or "Update Submission?"

**Frontend: Line 297-360**
```typescript
const fetchFullSubmissionData = async () => {
  const result = await assignmentApiService.getStudentSubmissions(
    user.email,
    assignment.assignmentId
  );

  if (result.success && result.data) {
    const lastSubmission = result.data.submissions[0];

    // ✅ Pre-populate from PREVIOUS SUBMISSION
    if (lastSubmission.answers) {
      setAnswers(lastSubmission.answers);
    }
    if (lastSubmission.groupName) {
      setGroupName(lastSubmission.groupName);  // ✅ From submission
    }
    // Group members populated by separate useEffect (Line 105-118)
  }
}
```

**Frontend: Line 105-118**
```typescript
// Convert group member names to emails when both loaded
useEffect(() => {
  if (previousSubmission && availableStudents.length > 0) {
    const memberNames = previousSubmission.groupMembers || [];
    const memberEmails = memberNames
      .map(memberName => {
        const student = availableStudents.find(s => s.fullName === memberName);
        return student ? student.email : null;
      })
      .filter(email => email !== null);

    setGroupMembers(memberEmails);  // ✅ Pre-select from submission
  }
}, [previousSubmission, availableStudents]);
```

**Result:**
- ✅ **Group Name**: Taken from PREVIOUS SUBMISSION (not from Group Members sheet)
- ✅ **Group Members**: Taken from PREVIOUS SUBMISSION (not from Group Members sheet)
- ✅ **All fields**: Pre-filled with previously submitted data

---

## Key Differences

### Initial Submission (First Time)

| Field | Source | Behavior |
|-------|--------|----------|
| **Group Name** | "Group Members" sheet → `studentSubjectGroup` | ✅ Auto-filled from SubjectGroup column |
| **Group Members** | "Group Members" sheet → all students in same SubjectGroup | ✅ Auto-selected (checkboxes pre-ticked), EXCLUDING current user |
| **Available Students** | "Group Members" sheet | Shows all students in group for manual changes |

**Logic Flow:**
1. Backend finds student's SubjectGroup from "Group Members" sheet
2. Backend finds all students with same Batch + Subject + SubjectGroup
3. Frontend pre-selects all those students (minus current user)
4. Frontend pre-fills group name with SubjectGroup value

### Viewing/Updating (After Submission)

| Field | Source | Behavior |
|-------|--------|----------|
| **Group Name** | Previous submission in Google Sheets | ✅ Auto-filled from what was submitted |
| **Group Members** | Previous submission in Google Sheets | ✅ Auto-selected from previous submission |
| **Available Students** | "Group Members" sheet | Shows all possible students for changes |
| **Answers** | Previous submission | ✅ All answers pre-filled |
| **Files** | Previous submission | ✅ Previously uploaded files shown |

**Logic Flow:**
1. Backend fetches previous submission data
2. Frontend pre-fills group name from submission
3. Frontend pre-selects group members from submission
4. Student can modify if needed (before deadline)

---

## Code References

### Frontend

**File:** `/src/pages/assignment/AssignmentDetailsModal.tsx`

| Line | Function | Purpose |
|------|----------|---------|
| 95-96 | Modal open effect | Triggers `fetchStudentsForSubject()` for group assignments |
| 265-295 | `fetchStudentsForSubject()` | Fetches group members from backend and pre-fills UI |
| 281-284 | Pre-selection logic | Auto-selects all group members except current user |
| 286-288 | Group name setting | Sets group name if returned from backend |
| 105-118 | useEffect | Converts member names to emails for viewing/updating |
| 297-360 | `fetchFullSubmissionData()` | Fetches previous submission for completed tab |
| 330 | Group name from submission | Pre-fills group name from previous submission |
| 1872-1882 | Checkbox rendering | Shows pre-selected checkboxes |

**File:** `/src/services/assignmentApi.ts`

| Line | Function | Purpose |
|------|----------|---------|
| 543-553 | `getGroupMembersBySubjectGroup()` | API call to fetch group members by subject group |

### Backend

**File:** `/backend/Assignment Backend/Assignment_Code.js`

| Line | Code | Purpose |
|------|------|---------|
| 146-147 | Case statement | Routes request to `getGroupMembersBySubjectGroup()` |

**File:** `/backend/Assignment Backend/Assignment_Management.js`

| Line | Function/Logic | Purpose |
|------|----------------|---------|
| 2676-2826 | `getGroupMembersBySubjectGroup()` | Main function to fetch group members |
| 2681 | Open sheet | Opens "Group Members" Google Sheet |
| 2712-2717 | Find student | Locates current student's row by email |
| 2729-2748 | Find SubjectGroup | Finds student's SubjectGroup for the given subject |
| 2762-2805 | Find all members | Finds all students with matching Batch + Subject + SubjectGroup |
| 2813-2817 | Return data | Returns group members array and group name |

---

## Summary

**Initial Submission:**
✅ Group name and members **ARE automatically filled** from "Group Members" Google Sheet
- Source: `getGroupMembersBySubjectGroup()` backend API
- Based on: Batch + Subject + SubjectGroup
- Current user: Excluded from pre-selection

**Viewing/Updating:**
✅ Group name and members **ARE automatically filled** from previous submission
- Source: `getStudentSubmissions()` backend API
- Based on: What was previously submitted
- Can be modified during update (before deadline)

**The "Group Members" sheet is the master data source for initial grouping!**
