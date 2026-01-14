# Group Selection Feature - Complete Implementation Guide

## ✅ COMPLETED (Backend + API Layer)

### Backend Changes (Google Apps Script)
**File:** `/backend/Code.js`

**Deployed:** ✅ Yes (clasp push --force successful)

**Changes Made:**
1. Added 3 new API endpoints (lines 595-604):
   - `getAllStudents`
   - `getAvailableStudentsForQuestion`
   - `getStudentGroupStatus`

2. Added 3 new functions (lines 8616-8864):
   - `getAllStudents()` - Gets all students from STUDENT_DATA sheet
   - `getAvailableStudentsForQuestion(formId, questionId)` - Returns students not yet in groups
   - `getStudentGroupStatus(formId, questionId, studentEmail)` - Checks if student is in a group

3. Updated `getOrCreateFormResponseSheet()` (lines 10351-10371):
   - Detects if form has `group_selection` questions
   - Adds 3 group columns if Group Selection present:
     * `Group_Member_IDs` (JSON array of student IDs)
     * `Group_Member_Names` (comma-separated names)
     * `Filled_By_Name` (who submitted the form)

4. Updated `submitFormResponse()` (lines 8928-9005):
   - Detects Group Selection question type
   - Extracts student IDs from answer
   - Looks up student names
   - Saves group data to response sheet

### Google Sheets Schema Updates
**Sheet:** Form_Questions
**Columns Added:** ✅ Manually added by user
- Column BJ: `Min_Group_Size`
- Column BK: `Max_Group_Size`

### Frontend API Layer
**File:** `/src/services/formsApi.ts`

**Changes Made:**
1. Added to Question interface (lines 131-133):
   ```typescript
   minGroupSize?: number;
   maxGroupSize?: number;
   ```

2. Added new interfaces (lines 818-828):
   ```typescript
   export interface Student {
     id: string;
     name: string;
     email: string;
     batch: string;
   }

   export interface GroupStatus {
     isFilled: boolean;
     filledBy: string | null;
   }
   ```

3. Added 3 new API functions (lines 833-915):
   - `getAllStudents()`
   - `getAvailableStudentsForQuestion(formId, questionId)`
   - `getStudentGroupStatus(formId, questionId, studentEmail)`

---

## 🚧 REMAINING FRONTEND WORK

### 1. Add Group Selection Question Type to Form Builder

**File to Modify:** `src/pages/admin/FormBuilderPage.tsx` or Form Builder components

**What to Do:**
- Add `'group_selection'` to the question type dropdown options
- When `group_selection` is selected, show:
  - Min Group Size input (number)
  - Max Group Size input (number)
- Save these values to the question object

**Example:**
```tsx
{questionType === 'group_selection' && (
  <>
    <div>
      <label>Minimum Group Size</label>
      <input
        type="number"
        value={minGroupSize || 3}
        onChange={(e) => setMinGroupSize(Number(e.target.value))}
        min={1}
      />
    </div>
    <div>
      <label>Maximum Group Size</label>
      <input
        type="number"
        value={maxGroupSize || 5}
        onChange={(e) => setMaxGroupSize(Number(e.target.value))}
        min={minGroupSize || 1}
      />
    </div>
  </>
)}
```

---

### 2. Render Group Selection in Form Fill Page

**File to Modify:** `src/pages/FormFillPage.tsx`

**What to Do:**
- When rendering questions, check if `question.questionType === 'group_selection'`
- Render a multi-select dropdown with these features:
  - Fetch available students using `getAvailableStudentsForQuestion(formId, questionId)`
  - Auto-select current student (cannot be removed)
  - Allow selecting other students
  - Show validation: min/max group size
  - Disable dropdown if student is already in a group (check using `getStudentGroupStatus()`)

**Example:**
```tsx
import { getAvailableStudentsForQuestion, Student } from '../services/formsApi';

// In component:
const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
const [selectedStudents, setSelectedStudents] = useState<string[]>([currentStudentId]);

useEffect(() => {
  if (question.questionType === 'group_selection') {
    loadAvailableStudents();
  }
}, [question]);

async function loadAvailableStudents() {
  const result = await getAvailableStudentsForQuestion(formId, question.id);
  if (result.success) {
    setAvailableStudents(result.data || []);
  }
}

// Render:
{question.questionType === 'group_selection' && (
  <div>
    <label>{question.questionText}</label>
    <select
      multiple
      value={selectedStudents}
      onChange={(e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        if (selected.includes(currentStudentId)) {
          setSelectedStudents(selected);
        }
      }}
    >
      {availableStudents.map(student => (
        <option
          key={student.id}
          value={student.id}
          disabled={student.id === currentStudentId}
        >
          {student.name} {student.id === currentStudentId ? '(You)' : ''}
        </option>
      ))}
    </select>
    <p>
      Select {question.minGroupSize}-{question.maxGroupSize} students
    </p>
  </div>
)}
```

---

### 3. Show Group Status on Forms Page

**File to Modify:** `src/pages/Forms.tsx`

**What to Do:**
- For each form, check if it has Group Selection questions
- For each Group Selection question, call `getStudentGroupStatus(formId, questionId, studentEmail)`
- If `isFilled: true`, show a badge: "Filled by {filledBy}"
- Disable the form card click if student is already in a group

**Example:**
```tsx
import { getStudentGroupStatus } from '../services/formsApi';

const [groupStatuses, setGroupStatuses] = useState<Map<string, GroupStatus>>(new Map());

useEffect(() => {
  // For each form with group selection questions
  forms.forEach(async (form) => {
    const groupQuestions = form.questions?.filter(q => q.questionType === 'group_selection');
    if (groupQuestions && groupQuestions.length > 0) {
      for (const question of groupQuestions) {
        const status = await getStudentGroupStatus(form.id, question.id, userEmail);
        if (status.success && status.data.isFilled) {
          setGroupStatuses(prev => new Map(prev).set(`${form.id}-${question.id}`, status.data));
        }
      }
    }
  });
}, [forms]);

// In form card render:
{groupStatuses.has(`${form.id}-${question.id}`) && (
  <div className="badge">
    Filled by {groupStatuses.get(`${form.id}-${question.id}`)?.filledBy}
  </div>
)}
```

---

### 4. Display Group Members in Response View

**File to Modify:** `src/pages/FormResponseView.tsx`

**What to Do:**
- When viewing a form response, check if any questions are `group_selection` type
- Display the group members for those responses
- Show who filled the form

**Example:**
```tsx
{question.questionType === 'group_selection' && response.groupMemberNames && (
  <div>
    <strong>Group Members:</strong>
    <ul>
      {response.groupMemberNames.split(', ').map((name, idx) => (
        <li key={idx}>{name}</li>
      ))}
    </ul>
    <p><em>Filled by: {response.filledByName}</em></p>
  </div>
)}
```

---

## 📝 Testing Checklist

### Backend Testing (via Apps Script Logger)
- [ ] Call `getAllStudents()` - should return all students
- [ ] Call `getAvailableStudentsForQuestion()` - should return available students
- [ ] Call `getStudentGroupStatus()` - should return group status

### Frontend Testing
1. **Form Builder:**
   - [ ] Create form with Group Selection question
   - [ ] Set min=3, max=5
   - [ ] Save form
   - [ ] Verify columns BJ, BK saved to Google Sheets

2. **Form Fill:**
   - [ ] Student A opens form
   - [ ] Sees all students in dropdown
   - [ ] Current student auto-selected (disabled from removal)
   - [ ] Select 2 more students (total 3)
   - [ ] Submit form

3. **Response Sheet:**
   - [ ] Open form's response sheet
   - [ ] Verify columns exist: `Group_Member_IDs`, `Group_Member_Names`, `Filled_By_Name`
   - [ ] Verify group data saved correctly

4. **Group Status:**
   - [ ] Student B (who was selected) opens form
   - [ ] Should see "Filled by Student A" badge
   - [ ] Should NOT be able to fill the form again

5. **Response View:**
   - [ ] Student A or B views their response
   - [ ] Should see all group members listed
   - [ ] Should show who filled it

---

## 🐛 Known Issues / Edge Cases to Handle

1. **Race Condition:** Two students select each other simultaneously
   - **Solution:** Backend validates on submission - check if selected students are still available

2. **Group Editing:** What if student wants to change group?
   - **Current Behavior:** Cannot edit once submitted
   - **Future Enhancement:** Add edit functionality

3. **Partial Groups:** Only 2 students left but min=3
   - **Current Behavior:** Allowed (flexible validation)
   - **User confirmed this is acceptable**

---

## 📚 Question Type Value

The backend uses the string `'group_selection'` for the question type.

Make sure all frontend code uses this exact string when:
- Checking question type
- Saving question type
- Filtering questions

---

## 🎯 Summary

**Backend:** ✅ 100% Complete and Deployed
**Frontend API:** ✅ 100% Complete
**Frontend UI:** ⏳ 0% Complete (4 components need updates)

**Next Steps:**
1. Update Form Builder to support Group Selection
2. Update Form Fill Page to render multi-select
3. Update Forms Page to show group status
4. Update Response View to display group members

**Estimated Time:** 2-3 hours for all frontend work
