# SSB Placement Backend

This is a separate Google Apps Script project dedicated to all placement-related functionality for the SSB Student Portal.

## Project Structure

- `Code.js` - Main entry point with doGet/doPost handlers and utility functions
- `Job Portal Functions.js` - Complete CRUD operations for job postings and applications
- `appsscript.json` - Apps Script configuration
- `.clasp.json` - Clasp deployment configuration

## Configuration

This backend is deployed under a different Google account from the main SSB backend.

**Script ID:** `1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD`

## Google Sheets Used

### 1. Job Portal Sheet
- **Sheet ID:** `1vXdIk5vpIA-HhocHXidwuzA5H4SIzhRHpRKh7Q-s1PM`
- **Sheet Name:** `Placement Data`
- **Purpose:** Stores all job postings (222 columns)

### 2. Student Profile Sheet
- **Sheet ID:** `1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk`
- **Sheet Name:** `Student Profile`
- **Purpose:** Used for admin verification and student data

## Google Drive Folders

### 1. Job Portal Main Folder
- **Folder ID:** `1W2n637zOPD0tirr4PQfGiD672kK36Sin`
- **Structure:**
  ```
  SSB PLACEMENT JOB PORTAL FOLDER/
  ├── Batch 2024-26/
  │   ├── Company - Role - JobID/
  │   │   ├── JobFileUploads/
  │   │   ├── StudentResumes/
  │   │   └── JobID - Applications.xlsx (Response Sheet)
  ```

### 2. Placement Resume Folder
- **Folder ID:** `1NHHb4_tAQmYagpCH50-qcvPNel6yeDJX`
- **Purpose:** Student resume uploads

## API Actions

### Job Portal CRUD
- `createJobPosting` - Create new job posting
- `getAllJobPostings` - Get all jobs (with optional filters)
- `getJobPosting` - Get single job by ID
- `updateJobPosting` - Update existing job
- `deleteJobPosting` - Delete job posting

### Student Applications
- `submitJobApplication` - Submit student application
- `getStudentApplications` - Get all applications for a student

### Admin
- `isAdmin` - Check if user is admin

## Deployment Steps

### 1. Login to Google Account
Make sure you're logged into the Google account that owns the script:

```bash
cd "Placement SSB Backend"
clasp login
```

### 2. Pull Current Code (Optional)
If you want to see what's currently deployed:

```bash
clasp pull
```

### 3. Push Changes
Deploy your local code to Google Apps Script:

```bash
clasp push
```

### 4. Deploy as Web App
After pushing, you need to deploy the script as a web app:

```bash
clasp deploy --description "Placement Backend v1.0"
```

Or deploy via the Apps Script web interface:
1. Go to https://script.google.com/home/projects/1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD/edit
2. Click "Deploy" > "New deployment"
3. Select type: "Web app"
4. Set "Execute as": User accessing the web app
5. Set "Who has access": Anyone
6. Click "Deploy"
7. Copy the Web App URL

### 5. Update Frontend

Update your React frontend to use the new Web App URL for placement-related API calls:

```typescript
// In your frontend config
const PLACEMENT_BACKEND_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Example API call
const response = await fetch(PLACEMENT_BACKEND_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'getAllJobPostings',
    filters: { batch: '2024-26', status: 'Open' }
  })
});
```

## Important Notes

1. **Separate Account:** This backend runs under a different Google account, so make sure you're logged into the correct account when using clasp commands.

2. **Permissions:** The web app is deployed with "Anyone" access, meaning no authentication is required. Security is handled at the application level via the `isAdmin()` function.

3. **Quotas:** Each Apps Script project has separate execution quotas (6 min per execution, daily limits). This separation helps distribute the load.

4. **Sheet Access:** Ensure the deployment account has edit access to:
   - Job Portal Sheet (`1vXdIk5vpIA-HhocHXidwuzA5H4SIzhRHpRKh7Q-s1PM`)
   - Student Profile Sheet (`1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk`)
   - All Drive folders listed above

5. **Email Sending:** The `sendJobNotificationEmail()` function uses `GmailApp`, which sends from the deployment account's Gmail address.

## Testing

Test the deployment with a simple GET request:

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=isAdmin&email=test@example.com"
```

## Maintenance

- **View Logs:** Go to Apps Script editor > Executions
- **Update Code:** Make changes locally, then `clasp push` and redeploy
- **Rollback:** Use Apps Script editor to manage deployments and roll back if needed
