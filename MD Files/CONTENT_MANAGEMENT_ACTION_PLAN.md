# SSB Student Portal - Content Management Action Plan
## Resources, Events & Announcements, Policy & Documents - Admin Interface

---

## 📋 EXECUTIVE SUMMARY

This document outlines the comprehensive action plan for building an admin interface to manage:
1. **Resources** (Course Materials)
2. **Events & Announcements**
3. **Policy & Documents**

The system will use **Google Drive folder structures** (similar to Zoom recordings) and **centralized Google Sheets** for metadata management.

---

## 🔍 CURRENT STATE ANALYSIS

### 1. **Resources (Course Materials)**

#### Current Implementation:
- **Frontend**: `/src/pages/Resources.tsx`
- **Backend API**: `getCourseResources(studentEmail)` in `Code.js:2101-2340`
- **Data Source**: Main sheet (`ALLINONE`) with category filter `COURSE MATERIAL`
- **Structure**: Term > Domain > Subject hierarchy

#### Existing Column Headers (from ALLINONE sheet):
```javascript
Required for Resources:
- S.Category: "COURSE MATERIAL"
- S.Publish: "Yes"
- S.Target Batch: student batch filter
- S.Title: Resource title
- S.SubTitle: Description
- CM.Term: Term folder (e.g., "Term 1", "Term 2")
- CM.Domain: Domain folder (e.g., "Strategy", "Finance")
- CM.Subject: Subject folder (e.g., "Marketing 101")
- CM.Topic: Specific topic/session
- CM.Learning Objectives: HTML content
- CM.Prerequisites: HTML content
- S.Priority: "High", "Medium", "Low"
- S.Event Type: Resource type
- S.FileURL: File link
- S.Drive Link: Google Drive link
- S.Sheets Link: Google Sheets link
- S.File upload Link: Upload link
- S.StartDateTime: Added/published date
- S.Created at: Timestamp
```

#### Current Resource Types (observed):
- PDFs (Reading materials)
- Videos (MP4, YouTube, Vimeo)
- Links (Web resources)
- Images
- Documents (Docs, Slides)

---

### 2. **Events & Announcements**

#### Current Implementation:
- **Frontend**: `/src/pages/Announcements.tsx`
- **Backend APIs**:
  - Dashboard content from `ALLINONE` with categories `EVENTS` & `ANNOUNCEMENTS`
  - SSB Calendar events via `getCalendarEvents()`
- **Data Sources**:
  - Main sheet (`ALLINONE`)
  - SSB Calendar sheet (separate sheet with columns: Batch, Event Type, Event Name, Start Date, Start Time, End Date, End Time, Link, Description, Attendees, Event ID, Updated?)

#### Existing Column Headers (from ALLINONE sheet):
```javascript
Events & Announcements:
- S.Category: "EVENTS" or "ANNOUNCEMENTS"
- S.Publish: "Yes"
- S.Target Batch: Target batch
- S.Title: Title
- S.SubTitle: Subtitle/Description
- S.Content: Full content
- S.Event Type: Event type
- S.Posted By: Creator name
- S.Priority: Priority level
- S.StartDateTime: Event start
- S.EndDateTime: Event end
- S.FileURL: File attachments
- S.Drive Link: Drive links
- S.Sheets Link: Sheets links
- S.File upload Link: Upload links
- E.Title: Event title
- E.Location/Link: Event location
- E.Agenda: Event agenda
- E.Speaker Info (if any): Speaker information
- S.Requires Acknowledgement: Yes/No
- S.Created at: Timestamp
```

#### SSB Calendar Sheet Structure:
```
- Batch
- Event Type (e.g., "Event", "Session", "Assessment", "Others")
- Event Name
- Start Date (DD-MMM-YYYY format)
- Start Time (HH:MM AM/PM)
- End Date
- End Time
- Link
- Description
- Attendees
- Event ID
- Updated? (Yes/No)
```

---

### 3. **Policy & Documents**

#### Current Implementation:
- **Frontend**: No dedicated page found (likely to be created)
- **Backend API**: `getPoliciesAndDocuments(studentEmail)` in `Code.js:1931-2094`
- **Data Source**: Main sheet (`ALLINONE`) with category filter `POLICY & DOCUMENTS`

#### Existing Column Headers:
```javascript
Policy & Documents:
- S.Category: "POLICY & DOCUMENTS"
- S.Publish: "Yes"
- S.Target Batch: Target batch
- S.Title: Policy/Document title
- S.SubTitle: Description
- S.Content: Full content
- PD.Type: Policy type (e.g., "Academic Policy", "Code of Conduct", "Grievance")
- PD.Policy Name: Official policy name
- PD.Content: Policy content (HTML)
- S.Priority: Priority level
- S.FileURL: File link
- S.Drive Link: Google Drive link
- S.Sheets Link: Google Sheets link
- S.File upload Link: Upload link
- S.Created at: Timestamp
- S.Edited at: Last edit timestamp
- S.Edited by: Editor name
```

---

## 🏗️ ZOOM RECORDINGS FOLDER STRUCTURE (Reference Model)

The Zoom recordings system creates the following hierarchy:

```
SSB Zoom Recordings/
├── {Batch}/                    (e.g., "MBA 2024")
│   ├── {Term}/                 (e.g., "Term 1")
│   │   ├── {Domain}/           (e.g., "Strategy")
│   │   │   ├── {Subject}/      (e.g., "Business Strategy 101")
│   │   │   │   ├── {Session}/  (e.g., "Week 1 - Introduction")
│   │   │   │   │   ├── 01 - Videos/
│   │   │   │   │   ├── 02 - Audio/
│   │   │   │   │   ├── 03 - Transcripts/
│   │   │   │   │   ├── 04 - Chat/
│   │   │   │   │   ├── 05 - Whiteboards/
│   │   │   │   │   └── 06 - Polls/
```

**Key Implementation**:
- Main Folder ID: `1fm5W7aHG8ad0GNCyluUwBLtkRMioEkQG`
- Function: `getOrCreateFolder(parentFolder, folderName)`
- Creates folders on-demand during session creation

---

## 🎯 PROPOSED SOLUTION

### **Option A: Unified Folder Structure (RECOMMENDED)**

Leverage existing Zoom recording folders and add content at appropriate levels:

```
SSB Zoom Recordings/
├── {Batch}/
│   ├── {Term}/
│   │   ├── {Domain}/
│   │   │   ├── {Subject}/
│   │   │   │   ├── {Session}/
│   │   │   │   │   ├── 01 - Videos/ (Zoom recordings)
│   │   │   │   │   ├── 02 - Audio/
│   │   │   │   │   ├── 03 - Transcripts/
│   │   │   │   │   ├── 04 - Chat/
│   │   │   │   │   ├── 05 - Whiteboards/
│   │   │   │   │   ├── 06 - Polls/
│   │   │   │   │   └── 07 - Resources/  ⭐ NEW - Session-level resources
│   │   │   │   │       ├── PPT/
│   │   │   │   │       ├── Videos/
│   │   │   │   │       ├── Decks/
│   │   │   │   │       ├── Case Studies/
│   │   │   │   │       ├── Reading Materials/
│   │   │   │   │       └── Others/
│   │   │   │   │
│   │   │   │   └── _Subject Resources/  ⭐ NEW - Subject-level resources
│   │   │   │       ├── PPT/
│   │   │   │       ├── Videos/
│   │   │   │       ├── Case Studies/
│   │   │   │       └── Others/
│   │   │
│   │   └── _Policy & Documents/  ⭐ NEW - Batch + Term level
│   │       ├── Academic Policies/
│   │       ├── Code of Conduct/
│   │       ├── Grievance Procedures/
│   │       ├── Handbooks/
│   │       └── Others/
│   │
│   └── _Events & Announcements/  ⭐ NEW - Batch level
│       ├── {YYYY-MM}/              (Organized by month)
│       │   ├── Event Name 1/
│       │   │   ├── Attachments/
│       │   │   └── Photos/
│       │   └── Event Name 2/
│       └── Announcements/
```

### **Option B: Separate Root Folders**

Create three new root folder structures (simpler but less integrated):

```
SSB Content Files/
├── 1. Resources/
│   ├── {Batch}/
│   │   ├── {Term}/
│   │   │   ├── {Domain}/
│   │   │   │   ├── {Subject}/
│   │   │   │   │   ├── PPT/
│   │   │   │   │   ├── Videos/
│   │   │   │   │   ├── Case Studies/
│   │   │   │   │   └── Others/
│
├── 2. Events & Announcements/
│   ├── {Batch}/
│   │   ├── {YYYY-MM}/
│   │   │   ├── Events/
│   │   │   └── Announcements/
│
└── 3. Policy & Documents/
    ├── {Batch}/
    │   ├── Academic Policies/
    │   ├── Code of Conduct/
    │   ├── Handbooks/
    │   └── Others/
```

**Folder ID**: User provided `1I7EKvN0MpjIGZefOhXhgz2prKfn1XbCn` for Policy & Documents, Events & Announcements, and other content.

---

## 📊 DATA MODEL DESIGN

### **A. Resources Sheet Enhancements**

Add to existing ALLINONE sheet (or create dedicated "Resources Management" sheet):

```javascript
New/Enhanced Columns:
✅ Existing:
- S.Category (set to "COURSE MATERIAL")
- S.Publish
- S.Target Batch
- S.Title
- S.SubTitle
- CM.Term
- CM.Domain
- CM.Subject
- CM.Topic
- S.Priority
- S.Event Type (repurpose as "Resource Type")
- S.FileURL
- S.Drive Link

⭐ NEW:
- CM.Resource Type: "PPT" | "Video" | "Deck" | "Case Study" | "Reading Material" | "Others" | "Custom"
- CM.Resource Type Custom: If "Custom" or "Others", specify custom type
- CM.Level: "Session" | "Subject" | "Domain" | "Term"
- CM.Session Name: If Level="Session", link to session
- CM.File 1 Name: Name for file 1
- CM.File 1 URL: Google Drive URL for file 1
- CM.File 2 Name
- CM.File 2 URL
- CM.File 3 Name
- CM.File 3 URL
- CM.File 4 Name
- CM.File 4 URL
- CM.File 5 Name
- CM.File 5 URL
- CM.Drive Folder Link: Auto-generated folder link
- CM.File Count: Auto-calculated count
- S.Created at
- S.Edited at
- S.Edited by
```

### **B. Events & Announcements Sheet Enhancements**

```javascript
Enhanced Columns for Events & Announcements:
✅ Existing:
- S.Category ("EVENTS" or "ANNOUNCEMENTS")
- S.Publish
- S.Target Batch
- S.Title
- S.SubTitle
- S.Content
- S.Event Type
- S.Priority
- S.StartDateTime
- S.EndDateTime
- E.Title
- E.Location/Link
- E.Agenda
- E.Speaker Info (if any)
- S.Requires Acknowledgement

⭐ NEW:
- EA.Category Type: "Event" | "Announcement" (maps to S.Category)
- EA.Event Subtype: If Event - "Session" | "Assessment" | "Workshop" | "Guest Lecture" | "Social" | "Career" | "Others"
- EA.Announcement Subtype: If Announcement - "Academic" | "Administrative" | "Urgent" | "General"
- EA.Display in Calendar: "Yes" | "No"
- EA.File 1 Name
- EA.File 1 URL
- EA.File 2 Name
- EA.File 2 URL
- EA.File 3 Name
- EA.File 3 URL
- EA.Drive Folder Link: Auto-generated folder link
- EA.Cover Image URL: Optional cover image
- EA.Registration Required: "Yes" | "No"
- EA.Registration Link: If registration required
- EA.Max Attendees: Number limit
```

### **C. Policy & Documents Sheet Enhancements**

```javascript
Enhanced Columns for Policy & Documents:
✅ Existing:
- S.Category (set to "POLICY & DOCUMENTS")
- S.Publish
- S.Target Batch
- S.Title
- S.SubTitle
- S.Content
- PD.Type
- PD.Policy Name
- PD.Content
- S.Priority

⭐ NEW:
- PD.Document Category: "Academic Policy" | "Code of Conduct" | "Grievance Procedure" | "Handbook" | "Form" | "Template" | "Guidelines" | "Others"
- PD.Version: Version number (e.g., "1.0", "2.1")
- PD.Effective Date: When policy takes effect
- PD.Review Date: When policy should be reviewed
- PD.Supersedes: Previous version/document ID
- PD.File 1 Name
- PD.File 1 URL
- PD.File 2 Name
- PD.File 2 URL
- PD.File 3 Name
- PD.File 3 URL
- PD.Drive Folder Link: Auto-generated folder link
- PD.Requires Acknowledgement: "Yes" | "No"
- PD.Mandatory Reading: "Yes" | "No"
```

---

## 🎨 ADMIN INTERFACE DESIGN

### **Location**: New Admin Tab in `/src/pages/AdminPage.tsx`

### **Structure**:

```typescript
Admin Page Tabs:
├── 1. Overview (Existing?)
├── 2. Zoom Management (Existing)
├── 3. Resources Management ⭐ NEW
├── 4. Events & Announcements ⭐ NEW
└── 5. Policy & Documents ⭐ NEW
```

### **Common Features for All Three Tabs**:

1. **Data Table with**:
   - Search/Filter (by batch, term, domain, subject, type, status)
   - Pagination
   - Bulk actions (delete, publish/unpublish, duplicate)
   - Export to CSV
   - Sort by columns

2. **Create/Edit Modal with**:
   - Form validation
   - Rich text editor for content (using existing HTML editor)
   - File upload interface
   - Preview mode
   - Save as draft / Publish options

3. **File Management**:
   - Drag & drop file upload
   - Multiple file support (up to 5 files per entry)
   - Auto-create Drive folders
   - Copy Drive link to clipboard
   - File preview modal

4. **Folder Structure Selector**:
   - Dropdown cascades for: Batch > Term > Domain > Subject > Session (for resources)
   - Auto-populate from existing Zoom recording folders
   - Option to create new folder if doesn't exist

---

### **Tab 3: Resources Management Interface**

#### **Features**:
1. **Folder Structure Browser**:
   - Visual tree view of existing folders (from Zoom recordings)
   - Click folder to see resources at that level
   - "Add Resource" button at each level

2. **Resource Creation Form**:
   ```
   [Select Existing Folder] or [Create New Folder]

   Batch: [Dropdown] *
   Term: [Dropdown] *
   Domain: [Dropdown] *
   Subject: [Dropdown] *
   Level: [Radio] Session | Subject | Domain | Term *
   Session Name: [Dropdown] (if Level = Session)

   Resource Details:
   Title: [Text Input] *
   Description: [Textarea]
   Resource Type: [Dropdown] PPT | Video | Deck | Case Study | Reading Material | Others *
   Custom Type: [Text Input] (if Others selected)

   Learning Objectives: [Rich Text Editor]
   Prerequisites: [Rich Text Editor]

   Priority: [Dropdown] High | Medium | Low

   Files (up to 5):
   [File 1] Name: [Text] URL: [Upload Button] [Browse Drive] ✅
   [File 2] Name: [Text] URL: [Upload Button] [Browse Drive]
   [File 3] Name: [Text] URL: [Upload Button] [Browse Drive]
   [File 4] Name: [Text] URL: [Upload Button] [Browse Drive]
   [File 5] Name: [Text] URL: [Upload Button] [Browse Drive]

   Target Batch: [Multi-select] (default: same as Batch above)
   Publish: [Toggle] Draft | Published

   [Save Draft] [Preview] [Publish]
   ```

3. **File Upload Flow**:
   - Upload file → Auto-upload to Drive folder → Get shareable link → Save to sheet
   - Or paste existing Drive link
   - Or select from existing Drive folders

---

### **Tab 4: Events & Announcements Interface**

#### **Features**:
1. **Calendar Integration**:
   - Month view calendar showing all events
   - Click date to create new event
   - Drag to reschedule

2. **Creation Form**:
   ```
   Type: [Radio] Event | Announcement *

   If Event:
     Event Subtype: [Dropdown] Session | Assessment | Workshop | Guest Lecture | Social | Career | Others *
     Event Name: [Text Input] *
     Start Date & Time: [DateTime Picker] *
     End Date & Time: [DateTime Picker] *
     Location/Link: [Text Input]
     Agenda: [Textarea]
     Speaker Info: [Text Input]
     Registration Required: [Toggle]
     Registration Link: [Text] (if toggle on)
     Max Attendees: [Number]

   If Announcement:
     Announcement Subtype: [Dropdown] Academic | Administrative | Urgent | General *
     Title: [Text Input] *

   Common Fields:
   Description: [Rich Text Editor] *
   Priority: [Dropdown] High | Medium | Low *
   Target Batch: [Multi-select] *
   Display in Calendar: [Toggle] (default: Yes for Events, No for Announcements)
   Requires Acknowledgement: [Toggle]

   Attachments (up to 3):
   [File 1] Name: [Text] URL: [Upload Button]
   [File 2] Name: [Text] URL: [Upload Button]
   [File 3] Name: [Text] URL: [Upload Button]

   Cover Image: [Upload Button] (optional)

   Publish: [Toggle] Draft | Published

   [Save Draft] [Preview] [Publish] [Schedule]
   ```

3. **Auto-folder Creation**:
   - Create folder: `{Batch}/{YYYY-MM}/{Event Name}/`
   - Sub-folders: `Attachments/`, `Photos/`

---

### **Tab 5: Policy & Documents Interface**

#### **Features**:
1. **Category Tree View**:
   - Academic Policies
   - Code of Conduct
   - Grievance Procedures
   - Handbooks
   - Forms & Templates
   - Guidelines
   - Others

2. **Creation Form**:
   ```
   Document Category: [Dropdown] Academic Policy | Code of Conduct | Grievance Procedure | Handbook | Form | Template | Guidelines | Others *

   Policy/Document Name: [Text Input] *
   Short Description: [Textarea]
   Full Content: [Rich Text Editor]

   Version: [Text Input] (e.g., "1.0", "2.1") *
   Effective Date: [Date Picker]
   Review Date: [Date Picker]
   Supersedes: [Dropdown of previous versions] (optional)

   Target Batch: [Multi-select] *
   Priority: [Dropdown] High | Medium | Low

   Files (up to 3):
   [File 1] Name: [Text] URL: [Upload Button]
   [File 2] Name: [Text] URL: [Upload Button]
   [File 3] Name: [Text] URL: [Upload Button]

   Requires Acknowledgement: [Toggle]
   Mandatory Reading: [Toggle]

   Publish: [Toggle] Draft | Published

   [Save Draft] [Preview] [Publish]
   ```

3. **Version Control**:
   - Track document versions
   - Show version history
   - Link to superseded documents

---

## 🔧 IMPLEMENTATION PHASES

### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up new Drive folder structure (Option A or B)
- [ ] Create/enhance Google Sheets columns for all three content types
- [ ] Add backend APIs for CRUD operations
- [ ] Implement folder creation utilities (similar to Zoom recordings)

### **Phase 2: Resources Tab (Week 3-4)**
- [ ] Build Resources Management admin interface
- [ ] Implement folder structure browser
- [ ] Create resource creation/edit form
- [ ] Add file upload to Drive functionality
- [ ] Test with sample resources

### **Phase 3: Events & Announcements Tab (Week 5-6)**
- [ ] Build Events & Announcements admin interface
- [ ] Implement calendar view
- [ ] Create event/announcement creation form
- [ ] Add file upload and scheduling features
- [ ] Test with sample events

### **Phase 4: Policy & Documents Tab (Week 7-8)**
- [ ] Build Policy & Documents admin interface
- [ ] Implement category tree view
- [ ] Create policy creation/edit form with version control
- [ ] Add acknowledgement tracking
- [ ] Test with sample policies

### **Phase 5: Integration & Testing (Week 9-10)**
- [ ] Update existing frontend pages (Resources.tsx, Announcements.tsx)
- [ ] Create Policy & Documents frontend page (if doesn't exist)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User acceptance testing

### **Phase 6: Polish & Launch (Week 11-12)**
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] Training materials for admins
- [ ] Production deployment
- [ ] Monitoring and support

---

## 📝 DETAILED TECHNICAL SPECIFICATIONS

### **Backend APIs to Create**

#### **Resources APIs**:
```javascript
// Code.js additions

function createResource(resourceData) {
  // Validate inputs
  // Create Drive folder if needed: Batch/Term/Domain/Subject/[Session]/07 - Resources/{Type}/
  // Upload files to Drive
  // Add row to sheet
  // Return success + drive links
}

function updateResource(resourceId, resourceData) {
  // Find existing row
  // Update metadata
  // Handle file updates
  // Update sheet
}

function deleteResource(resourceId) {
  // Mark as deleted (soft delete)
  // Or permanently delete files and row
}

function getResourcesByFolder(batch, term, domain, subject, sessionName = null) {
  // Query sheet for matching resources
  // Return structured data
}

function getAvailableFolders(batch = null) {
  // Scan existing Zoom recording folders
  // Return hierarchy: Terms > Domains > Subjects > Sessions
  // Use for dropdown population
}
```

#### **Events & Announcements APIs**:
```javascript
function createEventOrAnnouncement(data) {
  // Validate type and fields
  // Create Drive folder: Batch/{YYYY-MM}/{EventName}/
  // Upload files
  // Add to sheet (and optionally SSB Calendar sheet)
  // Return success
}

function updateEventOrAnnouncement(id, data) {
  // Update existing entry
  // Handle rescheduling
  // Update files
}

function deleteEventOrAnnouncement(id) {
  // Soft delete or permanent delete
}

function getEventsByMonth(batch, year, month) {
  // Return all events for calendar view
}
```

#### **Policy & Documents APIs**:
```javascript
function createPolicy(policyData) {
  // Create Drive folder: Batch/_Policy & Documents/{Category}/
  // Upload files
  // Add to sheet with version tracking
  // Return success
}

function updatePolicy(policyId, policyData, createNewVersion = false) {
  // If createNewVersion: increment version, link to previous
  // Otherwise: update existing
}

function deletePolicy(policyId) {
  // Soft delete
}

function getPolicyVersionHistory(policyId) {
  // Return all versions of a policy
}
```

### **Drive Folder Utilities**:
```javascript
function getOrCreateContentFolder(parentFolder, folderName) {
  // Same as Zoom recordings getOrCreateFolder
  // Check if exists, create if not
}

function createResourceFolderStructure(batch, term, domain, subject, sessionName, resourceType) {
  // Navigate: Batch > Term > Domain > Subject > [Session] > 07 - Resources > {Type}
  // Create folders as needed
  // Return folder object
}

function createEventFolder(batch, eventDate, eventName) {
  // Navigate: Batch > Events & Announcements > {YYYY-MM} > {EventName}
  // Create Attachments and Photos subfolders
  // Return folder object
}

function createPolicyFolder(batch, category) {
  // Navigate: Batch > Policy & Documents > {Category}
  // Return folder object
}
```

---

## 🎯 KEY DECISIONS REQUIRED FROM USER

### **1. Folder Structure Choice**:
- [ ] **Option A**: Integrate with existing Zoom folders (add `07 - Resources/` inside session folders)
- [ ] **Option B**: Create separate root folder structure

**Recommendation**: **Option A** - Better organization, all content for a session in one place.

### **2. File Upload Strategy**:
- [ ] **Upload to Drive automatically** (requires Drive API + permissions)
- [ ] **Manual Drive upload + paste link** (simpler, admin responsibility)
- [ ] **Hybrid**: Option to upload or paste link

**Recommendation**: **Hybrid** - Flexibility for admins.

### **3. Sheet Strategy**:
- [ ] **Use existing ALLINONE sheet** with new columns
- [ ] **Create separate sheets** (Resources, Events, Policies) for cleaner organization

**Recommendation**: **Separate sheets** - Easier to manage, better performance.

### **4. Zoom Recordings File Enhancement**:
- Should we add the File 1-5 columns to the existing Zoom Recordings sheet?
- [ ] Yes, add File 1 Name, File 1 URL, ... File 5 Name, File 5 URL to Zoom Recordings sheet
- [ ] No, keep Zoom Recordings separate

**Recommendation**: **Yes** - Allows attaching extra materials (slides, notes) to recorded sessions.

---

## ✅ NEXT STEPS

1. **Review this action plan** and provide feedback
2. **Make key decisions** (folder structure, upload strategy, sheet strategy)
3. **Approve Drive folder ID** (`1I7EKvN0MpjIGZefOhXhgz2prKfn1XbCn`) or provide new one
4. **Start Phase 1**: Set up foundation (folders, sheets, backend APIs)
5. **Iterative development**: Build one tab at a time, test, refine

---

## 📊 SUMMARY TABLE

| Content Type | Current Page | Backend API | Sheet/Subsheet | Columns Needed | Drive Folder Path |
|--------------|--------------|-------------|----------------|----------------|-------------------|
| **Resources** | Resources.tsx | getCourseResources() | ALLINONE or new "Resources" | 20+ (including File 1-5) | Batch/Term/Domain/Subject/[Session]/07-Resources/{Type}/ |
| **Events & Announcements** | Announcements.tsx | getStudentDashboard() + getCalendarEvents() | ALLINONE + SSB Calendar | 25+ (including File 1-3) | Batch/_Events & Announcements/{YYYY-MM}/{EventName}/ |
| **Policy & Documents** | (New page needed) | getPoliciesAndDocuments() | ALLINONE or new "Policies" | 18+ (including File 1-3) | Batch/_Policy & Documents/{Category}/ |

---

## 📌 FOLDER IDS & CONSTANTS

```javascript
// To be added to Code.js or Backend Zoom.js

const CONTENT_FOLDERS = {
  // Existing
  ZOOM_RECORDINGS: "1fm5W7aHG8ad0GNCyluUwBLtkRMioEkQG",

  // New (if Option B)
  CONTENT_ROOT: "1I7EKvN0MpjIGZefOhXhgz2prKfn1XbCn",

  // Or if Option A, use ZOOM_RECORDINGS as parent
};

const RESOURCE_TYPES = [
  "PPT",
  "Video",
  "Deck",
  "Case Study",
  "Reading Material",
  "Others"
];

const EVENT_SUBTYPES = [
  "Session",
  "Assessment",
  "Workshop",
  "Guest Lecture",
  "Social",
  "Career",
  "Others"
];

const POLICY_CATEGORIES = [
  "Academic Policy",
  "Code of Conduct",
  "Grievance Procedure",
  "Handbook",
  "Form",
  "Template",
  "Guidelines",
  "Others"
];
```

---

## 🚀 FINAL RECOMMENDATION

**Proceed with Option A (Integrated Folder Structure)** because:
1. ✅ All session content in one place
2. ✅ Leverages existing Zoom recording infrastructure
3. ✅ Easier navigation for admins and students
4. ✅ No duplicate batch/term/domain/subject folder hierarchies

**Hybrid file upload** because:
1. ✅ Flexibility - admins can upload directly or link existing Drive files
2. ✅ Faster for large files already in Drive
3. ✅ Auto-upload convenience for small files

**Separate sheets** for each content type because:
1. ✅ Cleaner data model
2. ✅ Better performance (smaller sheets)
3. ✅ Easier to maintain and extend

---

## 📞 READY TO START?

Let me know your decisions on:
1. Folder structure (A or B)?
2. Upload strategy?
3. Sheet strategy?
4. Add File 1-5 to Zoom Recordings?

Once confirmed, I'll begin implementation starting with Phase 1! 🚀
