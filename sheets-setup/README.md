# Google Sheets Auto-Setup

## ONE-CLICK SETUP (Recommended)

### Step 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Click **"+ Blank"** to create new spreadsheet
3. Name it: **"Online MBA Portal"**

### Step 2: Open Apps Script
1. In your new spreadsheet, go to **Extensions > Apps Script**
2. Delete all existing code

### Step 3: Paste Setup Script
1. Open the file `CREATE_ALL_SHEETS.js` in this folder
2. Copy ALL the code
3. Paste into the Apps Script editor
4. Click **Save** (disk icon)

### Step 4: Run Setup
1. Click **Run** > **Run function** > **createAllSheets**
2. Click **Review permissions**
3. Choose your Google account
4. Click **Advanced** > **Go to Untitled project (unsafe)**
5. Click **Allow**

### Step 5: Done!
All 13 sheets will be created with:
- Headers (colored)
- Sample data
- Your admin account (mohit000pareek@gmail.com)

---

## WHAT GETS CREATED

| Sheet Name | Purpose | Has Sample Data? |
|------------|---------|------------------|
| Student Data | User accounts | Yes (your admin) |
| Term | Batch/Term/Domain/Subject hierarchy | Yes |
| Zoom Live | Live sessions | Yes |
| Zoom Recordings | Recorded sessions | Yes |
| Resources Material | Learning materials | Yes |
| Events & Announcements | Events/announcements | Yes |
| Policy & Documents | Policies | Yes |
| Notes | Student notes | Headers only |
| SSB Calendar | Calendar events | Yes |
| Acknowledgement Data | Policy acknowledgements | Headers only |
| Students Corner - Activity | Community posts | Headers only |
| Forms | Dynamic forms | Headers only |
| Form Responses | Form submissions | Headers only |

---

## AFTER SETUP

1. Copy your **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

2. Create a Google Drive folder named **"LMS-Resources"** and copy its ID

3. Deploy the backend (see main setup guide)

4. Update your `.env` file

---

## MANUAL SETUP (Alternative)

If you prefer manual setup, use the CSV files in this folder:
- Import each CSV as a new sheet in Google Sheets
- File > Import > Upload > Select CSV > Replace current sheet
