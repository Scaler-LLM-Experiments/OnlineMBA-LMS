# Assignment Management System - Deployment Guide

## Overview
This guide will help you deploy the Assignment Management System backend to Google Apps Script.

## Backend Files Created
The following files have been created in `/backend/Assignment Backend/`:

1. **Assignment_Code.js** - Main entry point with doGet/doPost handlers
2. **Assignment_Management.js** - CRUD operations and business logic
3. **appsscript.json** - Apps Script configuration
4. **.clasp.json** - Clasp configuration with Script ID
5. **.claspignore** - Files to exclude from deployment

## Deployment Steps

### Option 1: Manual Copy (Recommended if clasp permissions issue)

1. **Open Google Apps Script Editor**
   - Go to: https://script.google.com
   - Open the project with Script ID: `1TEHDWIJmqdNxKSCTzGloecyoAqNp1-xCQ4SSrjSyAZuMCwPPXw6rDl1M`

2. **Copy Assignment_Code.js**
   - Create a new file named `Assignment_Code.js` in Apps Script
   - Copy the entire contents from `backend/Assignment Backend/Assignment_Code.js`
   - Paste into the Apps Script editor

3. **Copy Assignment_Management.js**
   - Create a new file named `Assignment_Management.js` in Apps Script
   - Copy the entire contents from `backend/Assignment Backend/Assignment_Management.js`
   - Paste into the Apps Script editor

4. **Update appsscript.json**
   - Open the `appsscript.json` file in Apps Script
   - Replace with contents from `backend/Assignment Backend/appsscript.json`

5. **Save and Deploy**
   - Click Save (💾)
   - Click Deploy > Test deployments
   - Copy the Web App URL (should match: https://script.google.com/macros/s/AKfycbyTCxWtX8WMJMROgCyqnyNPE-56afcGubcGquaw-QkI-BKn2hW4Uv_tkfKxAYsZbh8GgA/exec)

### Option 2: Using Clasp (If permissions resolved)

```bash
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Assignment Backend"
clasp login
clasp push --force
```

## Configuration

### Google Sheets Setup
The backend is configured to use the following Google Sheet:
- **Sheet ID**: `1hZe_BA6xZUgM1KDWaZudghxFqq--7-dSVTSl4zTDwxg`

**Sheet Names Required**:
1. **Assignment Ceator** - Main assignment data storage
2. **Subject Visible Data** - Student and admin email list
3. **Subject Term** - Batch, Term, Domain, Subject hierarchy

### Web App URL
The frontend is configured to use:
```
https://script.google.com/macros/s/AKfycbyTCxWtX8WMJMROgCyqnyNPE-56afcGubcGquaw-QkI-BKn2hW4Uv_tkfKxAYsZbh8GgA/exec
```

This URL is already configured in:
- `src/services/assignmentApi.ts` (line 7)

## Testing the Deployment

### 1. Test Admin Access
```javascript
// In Apps Script, run this test function:
function testAssignmentSystem() {
  Logger.log('Assignment Management System - Test');
  Logger.log('Sheet ID: ' + ASSIGNMENT_CONFIG.SHEET_ID);
  Logger.log('Generated ID: ' + generateAssignmentId());
}
```

### 2. Test from Frontend
1. Navigate to Admin Panel in the portal
2. Click on "Assignment Management" card
3. Try to:
   - View dropdown data (Batch, Term, Subject)
   - Create a test assignment
   - View assignments list

## Features Implemented

### Backend (Google Apps Script)
✅ **Assignment CRUD Operations**:
- Create Assignment
- Update Assignment
- Get Assignments (with filters)
- Delete Assignment (soft delete)
- Change Assignment Status

✅ **Drive Integration**:
- Auto-create folder structure
- Create submission tracking Google Sheet
- Upload instructor files

✅ **Dropdowns & Filters**:
- Get batches, terms from Subject Term sheet
- Get subjects by batch and term
- Support for up to 20 questions per assignment

### Frontend (React)
✅ **Assignment Management Card**:
- Create/Edit assignment form
- View all assignments
- Delete assignments
- Change status (Active/Disabled)
- Tab-based UI (View All / Create New)

✅ **Form Features**:
- Batch, Term, Subject dropdowns (cascading)
- Assignment details (title, subtitle, description, link)
- Timing (start/end datetime)
- Total marks configuration
- Drive folder auto-creation option
- Group assignment toggle
- Attachment/URL submission requirements
- Up to 20 questions with mandatory flags
- Publish toggle

✅ **Admin Panel Integration**:
- Card added to Admin Panel
- Route configured: `/admin/assignments`
- Cyan gradient theme

## Assignment ID Format
```
YYYY-SU-YYYYMMDD-XXX
```
Example: `2025-SU-20251206-001`

## Column Structure (Assignment Ceator Sheet)

The assignment data is stored with the following columns:
1. AssignmentID
2. Batch
3. Term
4. Subject
5. Publish (Yes/No)
6. AssignmentHeader
7. SubHeader
8. AssignmentDetails (HTML supported)
9. AssignmentLink
10. StartDateTime
11. EndDateTime
12. TotalMarks
13. FolderName
14. CreateInDrive Yes or No
15. Created at
16. Status (Active/Disabled/Deleted)
17. Edited Yes/No
18. Edited at
19. Edited By
20. Drive Link
21. Fileupload Link
22. SheetsLink
23. GroupAssignment
24. AttachmentMandatory
25. UrlMandatory
26. FileTypes
27-46. Q1 to Q20
47-66. Q1 Mandatory to Q20 Mandatory

## Next Steps

1. **Deploy Backend Files** (follow steps above)
2. **Test the System**:
   - Create a test assignment
   - Verify Drive folder creation
   - Check submission sheet generation
3. **Configure Permissions**:
   - Ensure admin emails are in "Subject Visible Data" sheet
   - Test with actual batch/term/subject data

## Troubleshooting

### Backend Issues
- **Error: "Admin access required"**
  - Check if user email exists in "Subject Visible Data" sheet
  - Verify email matches exactly (case-sensitive)

- **Error: "Assignment sheet not found"**
  - Check sheet name is exactly "Assignment Ceator" (note the typo in original spec)
  - Verify Sheet ID in ASSIGNMENT_CONFIG

### Frontend Issues
- **Dropdowns not loading**
  - Check browser console for API errors
  - Verify Web App URL is correct
  - Ensure backend is deployed

- **Cannot create assignment**
  - Check all required fields are filled
  - Verify user has admin access
  - Check browser console for errors

## Support
For issues or questions, check:
1. Browser console logs
2. Apps Script execution logs (View > Executions)
3. Google Sheet data structure
