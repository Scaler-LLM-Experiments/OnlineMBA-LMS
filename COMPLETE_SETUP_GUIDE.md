# COMPLETE SETUP GUIDE - Online MBA LMS

## OVERVIEW: How Everything Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR USERS                                   │
│                    (Students & Admins)                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                                  │
│              (Your App - localhost:3000)                            │
│                                                                      │
│   Login (Firebase) → API Calls → Display Data                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT BACKENDS                             │
│                  (4 Web App URLs)                                    │
│                                                                      │
│   Main Backend ──────► Student, Sessions, Resources, Events         │
│   Assignment Backend ► Assignments, Submissions                      │
│   Exam Backend ──────► Exams, Questions, Proctoring                 │
│   Placement Backend ─► Jobs, Applications (Optional)                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE SHEETS                                     │
│              (Your Database - 3 Spreadsheets)                       │
│                                                                      │
│   Main Portal Sheet ─► Students, Sessions, Resources                │
│   Exam Sheet ────────► Exams, Questions, Responses                  │
│   Assignment Sheet ──► Assignments, Submissions                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE DRIVE                                      │
│              (File Storage - Folders)                               │
│                                                                      │
│   Resources Folder ──► PDFs, Videos, Materials                      │
│   Assignments Folder ► Student Submissions                           │
│   Exams Folder ──────► Proctoring Screenshots                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WHAT YOU NEED TO CREATE

### 1. Google Spreadsheets (3 Total)

| Spreadsheet | Purpose | Est. Setup Time |
|-------------|---------|-----------------|
| Main Portal | Students, Sessions, Resources, Events | 30 mins |
| Exams | Exam management | 15 mins |
| Assignments | Assignment tracking | 15 mins |

### 2. Google Drive Folders (3 Total)

| Folder | Purpose |
|--------|---------|
| LMS-Resources | Store course materials |
| LMS-Assignments | Store student submissions |
| LMS-Exams | Store proctoring data |

### 3. Google Apps Script Backends (4 Total)

| Backend | Handles |
|---------|---------|
| Main Backend | Students, Sessions, Resources, Events, Notes |
| Assignment Backend | Assignments, Submissions |
| Exam Backend | Exams, Proctoring |
| Placement Backend | Jobs (Optional - skip for now) |

---

## STEP-BY-STEP SETUP

### STEP 1: Create Main Portal Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new spreadsheet → Name it **"Online MBA - Main Portal"**
3. Copy the **Spreadsheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_ID/edit
   ```

4. Create these sheets (tabs) with headers:

#### Sheet: "Student Data"
```
Row 1: Email | Name | Roll No | Batch | Phone | Status | isAdmin
```
Add yourself:
```
Row 2: mohit000pareek@gmail.com | Mohit Pareek | ADMIN001 | MBA-2024 | 9999999999 | Active | Yes
```

#### Sheet: "Term"
```
Row 1: Batch | Term | Domain | Subject
```
Add sample data:
```
Row 2: MBA-2024 | Term-1 | Finance | Accounting
Row 3: MBA-2024 | Term-1 | Finance | Economics
Row 4: MBA-2024 | Term-1 | Marketing | Digital Marketing
Row 5: MBA-2024 | Term-2 | Operations | Supply Chain
```

#### Sheet: "Zoom Live"
```
Row 1: Batch | Term | Domain | Subject | Session Name | Date | Start Time | Duration | Zoom Live Link | Meeting ID | Meeting Password | Topic
```

#### Sheet: "Zoom Recordings"
```
Row 1: Session ID | Batch | Term | Domain | Subject | Session Name | Topic | Date | Start Time | Duration | Speaker View URL | Gallery View URL | Thumbnail
```

#### Sheet: "Resources Material"
```
Row 1: ID_RES | Publish_RES | Posted By_RES | Created at_RES | Title_RES | Description_RES | Term_RES | Domain_RES | Subject_RES | Level_RES | Resource Type_RES | File 1 Name_RES | File 1 URL_RES | Status_RES
```

#### Sheet: "Events & Announcements"
```
Row 1: ID | Category Type | Event Type | Title | Description | Batch | Start DateTime | End DateTime | Status | Publish
```

#### Sheet: "Policy & Documents"
```
Row 1: ID | Policy Name | Description | Category | Batch | Status | Requires Acknowledgement
```

#### Sheet: "Notes"
```
Row 1: Note ID | Student Email | Session ID | Content | Tags | Is Pinned | Created At | Updated At
```

#### Sheet: "SSB Calendar"
```
Row 1: Event ID | Batch | Event Type | Event Name | Start Date | Start Time | End Date | End Time | Location | Link
```

---

### STEP 2: Create Google Drive Folders

1. Go to [drive.google.com](https://drive.google.com)
2. Create folder **"LMS-Resources"** → Copy Folder ID from URL
3. Create folder **"LMS-Assignments"** → Copy Folder ID
4. Create folder **"LMS-Exams"** → Copy Folder ID

Folder ID is in URL: `https://drive.google.com/drive/folders/COPY_THIS_ID`

---

### STEP 3: Deploy Main Backend

1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Name it **"Online MBA - Main Backend"**
4. Delete default code and paste the backend code

**Copy this file content:**
Read `/backend/Main Backend/Code.js` from your project

5. **Update Configuration** at the top:
```javascript
const SHEET_ID = "YOUR_MAIN_PORTAL_SHEET_ID";  // From Step 1
const MAIN_DRIVE_FOLDER_ID = "YOUR_LMS_RESOURCES_FOLDER_ID";  // From Step 2
```

6. **Deploy:**
   - Click **Deploy** → **New Deployment**
   - Click gear icon → Select **"Web app"**
   - Description: "Main Backend v1"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - **Authorize** when prompted (click Advanced → Go to unsafe)
   - **Copy the Web App URL**

---

### STEP 4: Create .env File

1. In your project root, create `.env` file:

```env
# Main Backend (from Step 3)
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/YOUR_MAIN_BACKEND_ID/exec

# Assignment Backend (leave empty for now)
REACT_APP_ASSIGNMENT_BACKEND_URL=

# Exam Backend (leave empty for now)
REACT_APP_EXAM_BACKEND_URL=

# Placement Backend (leave empty for now)
REACT_APP_PLACEMENT_BACKEND_URL=
```

---

### STEP 5: Test Your Setup

1. Restart the dev server:
```bash
npm start
```

2. Open browser: `http://localhost:3000`
3. Login with Google (use mohit000pareek@gmail.com)
4. You should see the Overview page

---

## YOUR TASKS CHECKLIST

### Phase 1: Basic Setup (Do This First)
- [ ] Create "Online MBA - Main Portal" Google Sheet
- [ ] Add sheets: Student Data, Term, Zoom Live, Zoom Recordings
- [ ] Add yourself to Student Data with isAdmin=Yes
- [ ] Add sample data to Term sheet
- [ ] Create LMS-Resources folder in Google Drive
- [ ] Deploy Main Backend to Google Apps Script
- [ ] Update .env with backend URL
- [ ] Test login and Overview page

### Phase 2: Add More Features (Later)
- [ ] Add Resources Material sheet
- [ ] Add Events & Announcements sheet
- [ ] Add Policy & Documents sheet
- [ ] Add Notes sheet
- [ ] Test Resources page
- [ ] Test Calendar page

### Phase 3: Exams & Assignments (Later)
- [ ] Create Exam Google Sheet
- [ ] Deploy Exam Backend
- [ ] Create Assignment Google Sheet
- [ ] Deploy Assignment Backend
- [ ] Update .env with new URLs

---

## QUICK REFERENCE

### Google Sheet IDs Location
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

### Google Drive Folder IDs Location
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

### Apps Script Deployment URL Format
```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

---

## WHAT I'VE ALREADY DONE FOR YOU

1. ✅ Made mohit000pareek@gmail.com an admin in code
2. ✅ Updated Overview page to match SSB repo layout
3. ✅ Removed Placement tab from sidebar
4. ✅ Created this setup guide
5. ✅ Firebase is already configured (online-mba-4b0b6)

---

## NEXT STEPS AFTER BASIC SETUP

Once Phase 1 is working:

1. **Add Sessions**: Add sample data to Zoom Live and Zoom Recordings sheets
2. **Add Resources**: Add files to Resources Material sheet
3. **Add Events**: Add events to Events & Announcements sheet
4. **Test Admin Panel**: Go to /admin to manage content

---

## TROUBLESHOOTING

### "API Error" or Blank Pages
- Check .env file has correct URL
- Check Google Sheet ID is correct
- Check backend is deployed as "Anyone can access"

### "Not Authorized"
- Make sure your email is in Student Data sheet
- Make sure isAdmin is set to "Yes"

### "CORS Error"
- Redeploy backend as Web App
- Make sure "Who has access" is "Anyone"

---

## CONTACT FOR HELP

If stuck, check:
1. Google Apps Script Executions log for errors
2. Browser Console (F12) for frontend errors
3. Network tab for API response errors
