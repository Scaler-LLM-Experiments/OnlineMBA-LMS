# Frontend-Backend Synchronization Summary

## ✅ Verified Synchronization Status

### Backend Schema (Assignment_Management.js)
```
Column Index | Field Name           | Type        | Frontend Field
-------------|---------------------|-------------|----------------
0            | AssignmentID        | String      | assignmentId
1            | Batch               | String      | batch
2            | Term                | String      | term
3            | Subject             | String      | subject
4            | Publish             | Yes/No      | publish (default: 'Yes')
5            | AssignmentHeader    | String      | assignmentHeader
6            | SubHeader           | String      | subHeader
7            | AssignmentDetails   | HTML        | assignmentDetails (Quill)
8            | AssignmentLink      | String      | (deprecated)
9            | StartDateTime       | DateTime    | startDateTime
10           | EndDateTime         | DateTime    | endDateTime
11           | TotalMarks          | Number      | totalMarks
12           | FolderName          | String      | folderName
13           | CreateInDrive       | Yes/No      | createInDrive (default: 'Yes')
14           | Created at          | Timestamp   | createdAt (auto)
15           | Status              | String      | status (Active/Disabled/Deleted)
16           | Edited Yes/No       | Yes/No      | edited (auto)
17           | Edited at           | Timestamp   | editedAt (auto)
18           | Edited By           | Email       | editedBy (auto)
19           | Drive Link          | URL         | driveLink (auto)
20           | Fileupload Link     | URL         | fileUploadLink (auto)
21           | SheetsLink          | URL         | sheetsLink (auto)
22           | GroupAssignment     | Yes/No      | groupAssignment (default: 'No')
23           | AttachmentMandatory | Yes/No      | attachmentMandatory (default: 'Yes')
24           | UrlMandatory        | Yes/No      | urlMandatory (default: 'No')
25           | FileTypes           | CSV String  | fileTypes (joined from array)
26-65        | Q1-Q20 + Mandatory  | Interleaved | q1-q20, q1Mandatory-q20Mandatory
66           | InstructorFiles     | JSON Array  | instructorFiles (auto-parsed)
67           | AssignmentURLs      | JSON Array  | assignmentURLs (name+url pairs)
```

### Frontend Default Values (AssignmentManagementCard.tsx)
```typescript
{
  publish: 'Yes',              // Always published (checkbox removed from UI)
  createInDrive: 'Yes',        // Create Drive structure by default
  groupAssignment: 'No',       // Individual assignment by default
  attachmentMandatory: 'Yes',  // File upload required by default
  urlMandatory: 'No',          // URL not required by default
  q1-q20Mandatory: 'No'        // Questions not mandatory by default
}
```

### API Endpoints (Assignment_Code.js)
- ✅ `createAssignment` - Creates assignment with Drive structure
- ✅ `updateAssignment` - Updates assignment preserving Drive links
- ✅ `getAssignments` - Fetches assignments with filters
- ✅ `deleteAssignment` - Soft delete (status = 'Deleted')
- ✅ `changeAssignmentStatus` - Changes Active/Disabled/Deleted
- ✅ `getAssignmentDropdowns` - Returns batches, terms, hierarchy, fileTypes
- ✅ `getSubjectsByBatch` - Returns subjects for batch+term
- ✅ `uploadAssignmentFile` - Uploads instructor files

### Data Transformations

**Frontend → Backend:**
1. Selected file types array → Comma-separated string
2. Assignment URLs array → JSON string
3. Uploaded files → Base64 + metadata → JSON string (after Drive upload)
4. Individual q1-q20 fields → Interleaved array (Q1, Q1Mandatory, Q2, Q2Mandatory...)

**Backend → Frontend:**
1. Comma-separated file types → Array
2. JSON instructor files → Array of {name, url}
3. JSON assignment URLs → Array of {name, url}
4. Interleaved questions → Individual q1-q20 fields

### UI Changes Reflected in Data
1. **Removed "Publish Assignment" checkbox** → Always sends `publish: 'Yes'`
2. **Group Assignment moved** → Still sends groupAssignment field
3. **Submission Requirements always visible** → attachmentMandatory defaults to 'Yes'
4. **File Attachments section** → Handles uploadedFiles array
5. **Assignment URLs (up to 5)** → Sends assignmentURLs array

### Drive Structure Created (when createInDrive='Yes')
```
Root Folder (DRIVE_ROOT_ID)
└── Batch (e.g., "2024-2025")
    └── Assignments
        └── Term (e.g., "Term 1")
            └── Subject (e.g., "Mathematics")
                ├── File uploaded Folder (Instructor files - VIEW)
                ├── Response file upload folder (Student submissions - EDIT)
                └── [AssignmentID] - Submissions.xlsx (Tracking sheet)
```

### Submission Sheet Structure (Dynamic based on assignment config)
```
Columns created dynamically:
- Timestamp
- Student Email
- Student Name
- [If groupAssignment='Yes'] Group Members (Emails)
- [If attachmentMandatory='Yes'] File Name, File URL
- [If urlMandatory='Yes'] Submission URL
- [For each question q1-q20] Q1: [question text], Q2: ...
- Status
- Grade
- Feedback
- Graded By
- Graded At
```

## ✅ All Systems Synchronized

**Last Updated:** December 6, 2025
**Status:** Frontend and Backend are fully synchronized
