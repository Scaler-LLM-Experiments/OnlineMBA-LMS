# Forms Column-by-Column Mapping Analysis

## Frontend to Backend Column Mapping

| Column | Header | Frontend Field Name | Frontend Sends? | Backend Receives (updateForm) | Backend Writes (updateRow) | Status |
|--------|--------|---------------------|-----------------|-------------------------------|----------------------------|--------|
| **A** | Form_ID | - | ❌ Never | - | `existingRow[0]` (keeps existing) | ✅ Correct |
| **B** | Batch | `batch` | ✅ Yes | `formData.batch` | `formData.batch \|\| existingRow[1]` | ✅ Correct |
| **C** | Term | `term` | ✅ Yes | `formData.term` | `formData.term \|\| existingRow[2]` | ✅ Correct |
| **D** | Domain | `domain` | ✅ Yes | `formData.domain` | `formData.domain \|\| existingRow[3]` | ✅ Correct |
| **E** | Subject | `subject` | ✅ Yes | `formData.subject` | `formData.subject \|\| existingRow[4]` | ✅ Correct |
| **F** | Form_Name | `name` | ✅ Yes | `formData.formName` | `formData.formName \|\| existingRow[5]` | ⚠️ **MISMATCH** |
| **G** | Form_Description | `description` | ✅ Yes | `formData.description` | `formData.description \|\| existingRow[6]` | ✅ Correct |
| **H** | Form_Type | `type` | ✅ Yes | `formData.formType` | `formData.formType \|\| existingRow[7]` | ⚠️ **MISMATCH** |
| **I** | Created_By | - | ❌ Never | - | `existingRow[8]` (keeps existing) | ✅ Correct |
| **J** | Created_At | - | ❌ Never | - | `existingRow[9]` (keeps existing) | ✅ Correct |
| **K** | Start_DateTime | `startDate` (formatted) | ✅ Yes | `formData.startDateTime` | `formData.startDateTime \|\| existingRow[10]` | ⚠️ **MISMATCH** |
| **L** | End_DateTime | `endDate` (formatted) | ✅ Yes | `formData.endDateTime` | `formData.endDateTime \|\| existingRow[11]` | ⚠️ **MISMATCH** |
| **M** | Uploaded_File | `uploadedFile` | ❌ Not sent | `formData.uploadedFile` | `formData.uploadedFile \|\| existingRow[12]` | ✅ Keeps existing |
| **N** | Drive_Link | - | ❌ Never | - | `existingRow[13]` (keeps existing) | ✅ Correct |
| **O** | Attachment_Required | `attachmentRequired` | ❌ Not sent | `formData.attachmentRequired` | `formData.attachmentRequired \|\| existingRow[14]` | ✅ Keeps existing |
| **P** | Response_Sheet_Link | - | ❌ Never | - | `existingRow[15]` (keeps existing) | ✅ Correct |
| **Q** | Is_Active | `isActive` | ✅ Yes ('Yes'/'No') | `formData.isActive` | `formData.isActive \|\| existingRow[16]` | ✅ Correct |
| **R** | Show_At_Start_Until_Filled | `showAtStartUntilFilled` | ✅ Yes ('Yes'/'No') | `formData.showAtStartUntilFilled` | `formData.showAtStartUntilFilled \|\| existingRow[17]` | ✅ Correct |
| **S** | Show_In_Tab | `showInTab` | ❌ Not sent | `formData.showInTab` | `formData.showInTab \|\| existingRow[18]` | ✅ Keeps existing |
| **T** | Visible_To | `visibleTo` | ❌ Not sent | `formData.visibleTo` | `formData.visibleTo \|\| existingRow[19]` | ✅ Keeps existing |
| **U** | Max_Responses_Per_User | `maxResponsesPerUser` | ✅ Yes (number) | `formData.maxResponsesPerUser` | `formData.maxResponsesPerUser \|\| existingRow[20]` | ✅ Correct |
| **V** | Show_Results_To_Respondents | `showResultsToRespondents` | ❌ Not sent | `formData.showResultsToRespondents` | `formData.showResultsToRespondents \|\| existingRow[21]` | ✅ Keeps existing |
| **W** | Thank_You_Message | `confirmationMessage` | ✅ Yes | `formData.thankYouMessage` | `formData.thankYouMessage \|\| existingRow[22]` | ⚠️ **MISMATCH** |
| **X** | Redirect_URL | `redirectUrl` | ❌ Not sent | `formData.redirectUrl` | `formData.redirectUrl \|\| existingRow[23]` | ✅ Keeps existing |
| **Y** | Allow_Edit_Response | `allowEditResponse` | ❌ Not sent | `formData.allowEditResponse` | `formData.allowEditResponse \|\| existingRow[24]` | ✅ Keeps existing |
| **Z** | Allow_Student_View_Response | `allowStudentViewResponse` | ✅ Yes ('Yes'/'No') | `formData.allowStudentViewResponse` | `formData.allowStudentViewResponse \|\| existingRow[25]` | ✅ Correct |
| **AA** | Require_Login | `requireLogin` | ❌ Not sent | `formData.requireLogin` | `formData.requireLogin \|\| existingRow[26]` | ✅ Keeps existing |
| **AB** | Collect_Email | `collectEmail` | ❌ Not sent | `formData.collectEmail` | `formData.collectEmail \|\| existingRow[27]` | ✅ Keeps existing |
| **AC** | Total_Responses | - | ❌ Never | - | `existingRow[28]` (keeps existing) | ✅ Correct |
| **AD** | Last_Updated_At | - | ❌ Never | - | `timestamp` (always updated) | ✅ Correct |
| **AE** | Last_Updated_By | - | ❌ Not sent | `formData.updatedBy` | `formData.updatedBy \|\| existingRow[29]` | ⚠️ **MISSING** |
| **AF** | Status | `status` | ❌ Not sent | `formData.status` | `formData.status \|\| existingRow[30]` | ✅ Keeps existing |
| **AG** | Notes | `notes` | ❌ Not sent | `formData.notes` | `formData.notes \|\| existingRow[31]` | ✅ Keeps existing |

---

## CRITICAL FIELD NAME MISMATCHES

### 1. Column F (Form_Name)
- **Frontend sends**: `name: "Strategy Club President - Interest Form"`
- **Backend expects**: `formName`
- **Problem**: Frontend sends `name`, backend expects `formName`
- **Fix needed**: Frontend should send `formName` instead of `name`

### 2. Column H (Form_Type)
- **Frontend sends**: `type: "Club & Student Body Election"`
- **Backend expects**: `formType`
- **Problem**: Frontend sends `type`, backend expects `formType`
- **Fix needed**: Frontend should send `formType` instead of `type`

### 3. Column K (Start_DateTime)
- **Frontend sends**: `startDate: "15/11/2025 00:00:00"` (formatted)
- **Backend expects**: `startDateTime`
- **Problem**: Frontend sends `startDate`, backend expects `startDateTime`
- **Fix needed**: Frontend should send `startDateTime` instead of `startDate`

### 4. Column L (End_DateTime)
- **Frontend sends**: `endDate: "17/12/2025 20:00:00"` (formatted)
- **Backend expects**: `endDateTime`
- **Problem**: Frontend sends `endDate`, backend expects `endDateTime`
- **Fix needed**: Frontend should send `endDateTime` instead of `endDate`

### 5. Column W (Thank_You_Message)
- **Frontend sends**: `confirmationMessage: "Thank you for your submission!"`
- **Backend expects**: `thankYouMessage`
- **Problem**: Frontend sends `confirmationMessage`, backend expects `thankYouMessage`
- **Fix needed**: Frontend should send `thankYouMessage` instead of `confirmationMessage`

### 6. Column AE (Last_Updated_By)
- **Frontend sends**: Nothing
- **Backend needs**: `updatedBy` (user email)
- **Problem**: Frontend doesn't send who is updating the form
- **Fix needed**: Frontend should send `updatedBy: user.email`

---

## What's Happening

When frontend sends:
```javascript
{
  name: "Strategy Club President - Interest Form",  // ❌ Backend expects formName
  description: "",
  type: "Club & Student Body Election",              // ❌ Backend expects formType
  batch: "SSB 2025",
  term: "Term 1",
  domain: "",
  subject: "",
  startDate: "15/11/2025 00:00:00",                  // ❌ Backend expects startDateTime
  endDate: "17/12/2025 20:00:00",                    // ❌ Backend expects endDateTime
  isActive: "Yes",
  showAtStartUntilFilled: "No",
  maxResponsesPerUser: 999,
  allowStudentViewResponse: "No",
  confirmationMessage: "Thank you for your submission!", // ❌ Backend expects thankYouMessage
}
```

Backend does:
```javascript
formData.formName || existingRow[5]    // formData.formName is UNDEFINED! Uses old value
formData.formType || existingRow[7]    // formData.formType is UNDEFINED! Uses old value
formData.startDateTime || existingRow[10]  // formData.startDateTime is UNDEFINED! Uses old value
formData.endDateTime || existingRow[11]    // formData.endDateTime is UNDEFINED! Uses old value
formData.thankYouMessage || existingRow[22] // formData.thankYouMessage is UNDEFINED! Uses old value
```

**Result**: When you save the form, these fields **never update** because the frontend is sending the wrong field names!

---

## Required Fixes

### Fix 1: FormBuilderPage.tsx - Update payload field names

**Current (line 843-851):**
```javascript
const updateResult = await updateForm(formId, {
  ...formData,
  startDate: formattedStartDate,
  endDate: formattedEndDate,
  isActive: formData.isActive ? 'Yes' : 'No',
  showAtStartUntilFilled: formData.showAtStartUntilFilled ? 'Yes' : 'No',
  maxResponsesPerUser: formData.maxResponsesPerUser,
  allowStudentViewResponse: formData.allowStudentViewResponse ? 'Yes' : 'No',
} as any);
```

**Should be:**
```javascript
const updateResult = await updateForm(formId, {
  formName: formData.name,                  // ✅ Map name → formName
  description: formData.description,
  formType: formData.type,                  // ✅ Map type → formType
  batch: formData.batch,
  term: formData.term,
  domain: formData.domain,
  subject: formData.subject,
  startDateTime: formattedStartDate,        // ✅ Map startDate → startDateTime
  endDateTime: formattedEndDate,            // ✅ Map endDate → endDateTime
  isActive: formData.isActive ? 'Yes' : 'No',
  showAtStartUntilFilled: formData.showAtStartUntilFilled ? 'Yes' : 'No',
  maxResponsesPerUser: formData.maxResponsesPerUser,
  allowStudentViewResponse: formData.allowStudentViewResponse ? 'Yes' : 'No',
  thankYouMessage: formData.confirmationMessage,  // ✅ Map confirmationMessage → thankYouMessage
  updatedBy: user.email,                    // ✅ Add updatedBy
} as any);
```

---

## Summary

**The root cause**: Frontend and backend are using **different field names** for the same columns. When frontend sends `name`, backend is looking for `formName`, doesn't find it, and keeps the old value.

This is why your form doesn't update when you save it!
