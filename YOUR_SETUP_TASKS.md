# YOUR SETUP TASKS - Online MBA LMS

This is a simplified checklist of exactly what YOU need to do. I've done all the code setup.

---

## SUMMARY

| What | Where | Time |
|------|-------|------|
| Create 1 Google Sheet | Google Sheets | 20 mins |
| Create 1 Google Drive Folder | Google Drive | 2 mins |
| Deploy 1 Backend | Google Apps Script | 15 mins |
| Update 1 File | .env in project | 2 mins |

**Total Time: ~40 minutes**

---

## STEP 1: Create Google Sheet (20 mins)

### 1.1 Go to Google Sheets
Open: https://sheets.google.com

### 1.2 Create New Spreadsheet
- Click **"+ Blank"**
- Name it: **"Online MBA Portal"**

### 1.3 Copy the Sheet ID
From URL: `https://docs.google.com/spreadsheets/d/`**THIS_IS_YOUR_SHEET_ID**`/edit`

**Save this ID somewhere - you'll need it!**

### 1.4 Create These Tabs (Sheets)

Click the **"+"** button at bottom to add new sheets. Create these:

---

#### Tab 1: "Student Data"
Add these headers in Row 1:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Email | Name | Roll No | Batch | Phone | Status | isAdmin |

Add yourself in Row 2:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| mohit000pareek@gmail.com | Mohit Pareek | ADMIN001 | MBA-2024 | 9999999999 | Active | Yes |

---

#### Tab 2: "Term"
Add these headers in Row 1:

| A | B | C | D |
|---|---|---|---|
| Batch | Term | Domain | Subject |

Add sample data:

| Batch | Term | Domain | Subject |
|-------|------|--------|---------|
| MBA-2024 | Term-1 | Finance | Accounting |
| MBA-2024 | Term-1 | Finance | Economics |
| MBA-2024 | Term-1 | Marketing | Digital Marketing |
| MBA-2024 | Term-1 | Marketing | Brand Management |
| MBA-2024 | Term-2 | Operations | Supply Chain |
| MBA-2024 | Term-2 | HR | Organizational Behavior |

---

#### Tab 3: "Zoom Live"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Batch | Term | Domain | Subject | Session Name | Date | Start Time | Duration | Zoom Live Link | Meeting ID | Meeting Password | Topic |

(Leave empty for now - add sessions later)

---

#### Tab 4: "Zoom Recordings"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Session ID | Batch | Term | Domain | Subject | Session Name | Topic | Date | Start Time | Duration | Speaker View URL | Gallery View URL | Thumbnail |

(Leave empty for now)

---

#### Tab 5: "Resources Material"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID_RES | Publish_RES | Posted By_RES | Created at_RES | Title_RES | Description_RES | Term_RES | Domain_RES | Subject_RES | Level_RES | Resource Type_RES | File 1 Name_RES | File 1 URL_RES | Status_RES |

(Leave empty for now)

---

#### Tab 6: "Events & Announcements"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| ID | Category Type | Event Type | Title | Description | Batch | Start DateTime | End DateTime | Status | Publish |

(Leave empty for now)

---

#### Tab 7: "Notes"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Note ID | Student Email | Session ID | Content | Tags | Is Pinned | Created At | Updated At |

(Leave empty for now)

---

#### Tab 8: "SSB Calendar"
Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Event ID | Batch | Event Type | Event Name | Start Date | Start Time | End Date | End Time | Location | Link |

(Leave empty for now)

---

## STEP 2: Create Google Drive Folder (2 mins)

### 2.1 Go to Google Drive
Open: https://drive.google.com

### 2.2 Create Folder
- Right-click → **New Folder**
- Name it: **"LMS-Resources"**

### 2.3 Copy the Folder ID
Open the folder, then from URL:
`https://drive.google.com/drive/folders/`**THIS_IS_YOUR_FOLDER_ID**

**Save this ID!**

---

## STEP 3: Deploy Backend (15 mins)

### 3.1 Go to Google Apps Script
Open: https://script.google.com

### 3.2 Create New Project
- Click **"New Project"**
- Click on "Untitled project" at top
- Name it: **"Online MBA Backend"**

### 3.3 Copy Backend Code

Delete everything in the editor, then:

1. Open this file in your project: `backend/Main Backend/Code.js`
2. Copy ALL the code
3. Paste into the Apps Script editor

### 3.4 Update Configuration

Find these lines near the top of the code and update:

```javascript
// FIND THIS SECTION AND UPDATE:
const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";  // From Step 1.3
const MAIN_DRIVE_FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";  // From Step 2.3
```

### 3.5 Save
Press **Ctrl+S** or click the disk icon

### 3.6 Deploy

1. Click **"Deploy"** button (top right)
2. Click **"New deployment"**
3. Click the **gear icon** next to "Select type"
4. Choose **"Web app"**
5. Fill in:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **"Deploy"**

### 3.7 Authorize

1. Click **"Authorize access"**
2. Choose your Google account
3. Click **"Advanced"** (bottom left)
4. Click **"Go to Online MBA Backend (unsafe)"**
5. Click **"Allow"**

### 3.8 Copy the Web App URL

You'll see a URL like:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

**Copy this entire URL!**

---

## STEP 4: Update .env File (2 mins)

### 4.1 Open .env file
In your project folder, open or create `.env` file

### 4.2 Add your URL
```env
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Replace `YOUR_DEPLOYMENT_ID/exec` with the URL you copied in Step 3.8

### 4.3 Save the file

---

## STEP 5: Test It!

### 5.1 Restart Server
In terminal:
```bash
cd /Users/mohitpareek/Online\ MBA1/SSB-x-Online-LMS
npm start
```

### 5.2 Open Browser
Go to: http://localhost:3000

### 5.3 Login
- Click "Sign in with Google"
- Use: mohit000pareek@gmail.com

### 5.4 Verify
- You should see the Overview page
- Sidebar should work
- No API errors

---

## DONE!

You now have a working LMS with:
- ✅ Student login
- ✅ Overview dashboard
- ✅ Sessions page (empty until you add data)
- ✅ Resources page (empty until you add data)
- ✅ Calendar page
- ✅ Admin panel access

---

## NEXT: Adding Content

Once basic setup works, add content:

### Add a Live Session
Go to "Zoom Live" sheet and add:
```
MBA-2024 | Term-1 | Finance | Accounting | Session 1 | 20-Jan-2025 | 10:00 AM | 60 | https://zoom.us/j/123 | 123456789 | pass123 | Introduction
```

### Add a Recording
Go to "Zoom Recordings" sheet and add:
```
REC001 | MBA-2024 | Term-1 | Finance | Accounting | Session 1 | Introduction | 15-Jan-2025 | 10:00 AM | 60 | https://drive.google.com/file/xxx | | https://img.youtube.com/thumb.jpg
```

### Add an Event
Go to "Events & Announcements" sheet and add:
```
EVT001 | EVENTS | Workshop | Career Fair | Join us for career fair | MBA-2024 | 2025-01-25 10:00 | 2025-01-25 16:00 | Published | Yes
```

---

## TROUBLESHOOTING

### White screen / No data
1. Check .env has correct URL
2. Check Google Sheet has your email in Student Data
3. Restart server after changing .env

### "Not authorized" error
1. Make sure "Who has access" is "Anyone" in deployment
2. Redeploy if needed

### API errors in console
1. Open Apps Script → View → Executions
2. Check error logs

---

## IDs YOU NEED TO SAVE

Keep these somewhere safe:

```
Google Sheet ID: ____________________

Google Drive Folder ID: ____________________

Backend URL: ____________________
```
