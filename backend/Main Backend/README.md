# SSB Main Backend

This is the primary Google Apps Script backend for the SSB Student Portal, handling all non-placement functionality.

## Project Structure

### Core Files
- `Code.js` - Main entry point with doGet/doPost handlers and core API logic (14,000+ lines)
- `appsscript.json` - Apps Script configuration
- `.clasp.json` - Clasp deployment configuration
- `.claspignore` - Files to ignore during deployment

### Feature Modules
- `Backend Zoom.js` - Zoom integration (meetings, recordings, notes)
- `Content Management.js` - Content delivery and management
- `Conditional_Logic_Functions.js` - Forms conditional logic
- `Job Portal Functions.js` - Job portal logic (DEPRECATED - moved to Placement Backend)

### Documentation
- `Conditional_Logic_Integration.md` - Forms logic documentation
- `FORMS_API_IMPLEMENTATION_SUMMARY.md` - Forms API documentation
- `FORMS_SHEETS_COMPLETE_SCHEMA.md` - Forms data schema

## What This Backend Handles

### ✅ Active Features
1. **Student Authentication & Profiles**
   - Login/registration
   - Profile management
   - Profile picture uploads

2. **Content Management**
   - Dashboard content
   - Assignments
   - Resources
   - Deadlines
   - Acknowledgements

3. **Students Corner**
   - Activity posts
   - Engagement (likes, comments)
   - Leaderboard
   - Points system

4. **Zoom Integration**
   - Live sessions
   - Recordings
   - Session notes
   - Calendar events

5. **Forms & Assessments**
   - Form submissions
   - Conditional logic
   - Form responses

6. **Admin Functions**
   - Batch management
   - Placement view toggle
   - Analytics
   - Bulk operations

### ⚠️ Deprecated Features (Moved to Placement Backend)
- Job posting CRUD (still present but should use Placement Backend)
- Job applications

## Google Sheets Used

### Main Sheets (ID: 1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk)
- `ALLINONE` - Main content sheet
- `Student Login` - Login credentials
- `Student Data` - Student information
- `Student Profile` - Extended profiles
- `Acknowledgement Data` - Content acknowledgements
- `Students Corner - Activity` - Activity posts
- `Students Corner - Engagement` - Likes/comments
- `Access` - Access control
- `Notes` - Zoom session notes

### Other Sheets
- Job Portal Sheet (ID: 1vXdIk5vpIA-HhocHXidwuzA5H4SIzhRHpRKh7Q-s1PM) - **Use Placement Backend instead**

## Google Drive Folders

- **Main Drive:** `1nBvZpPA_pA4-LVd1xV7rnzRI5j1ikAfv` (SSB ALL IN ONE CREATOR)
- **Notes Drive:** `1Z2lsx8VNaOPo6Ivv0Mfmp5cAWyYWPXPC`
- **Placement Resume:** `1NHHb4_tAQmYagpCH50-qcvPNel6yeDJX`
- **Job Portal Drive:** `1W2n637zOPD0tirr4PQfGiD672kK36Sin` (SSB PLACEMENT JOB PORTAL FOLDER) - **Use Placement Backend**

## Deployment

### Current Deployment
This backend is deployed under the main SSB Google account.

### Deploy Steps

```bash
cd "Main Backend"
clasp login  # Login with main SSB account
clasp push   # Push code changes
clasp deploy --description "Main Backend v1.0"
```

### Web App URL
After deployment, you'll get a URL like:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

This is the main backend URL your frontend currently uses.

## API Actions

### Student Actions
- `login`, `validateSession`, `logout`
- `getStudentDashboard`, `getContentDetails`
- `submitAcknowledgment`, `markContentAsRead`
- `getStudentProfile`, `getFullStudentProfile`, `updateStudentProfile`
- `uploadProfilePicture`
- `getUpcomingDeadlines`, `getStudentSchedule`
- `getPoliciesAndDocuments`, `getCourseResources`
- `getStudentAnalytics`, `getFilteredStudentContent`

### Students Corner
- `getStudentsCornerActivity`, `createStudentsCornerPost`
- `getStudentsCornerLeaderboard`, `updateActivityStatus`
- `getStudentsCornerDashboard`
- `getStudentsCornerEngagements`, `createStudentsCornerEngagement`
- `removeStudentsCornerEngagement`
- `getStudentEngagementPoints`, `getStudentsForMentions`

### Zoom Integration
- `getZoomLiveSessions`, `getZoomRecordings`
- `getZoomSession`, `getCalendarEvents`
- `getZoomNotes`, `getZoomNote`, `saveZoomNote`
- `deleteZoomNote`, `togglePinZoomNote`
- `updateNoteTags`, `updateNoteContent`

### Admin Actions
- `isAdmin`
- `getBatches`, `enablePlacementViewForBatch`
- `getBulkStudentSummary`, `getContentInteractionSummary`
- `getAPIHealth`, `getAvailableFilters`

### ⚠️ Job Portal Actions (Use Placement Backend Instead)
- `createJobPosting`, `getAllJobPostings`, `getJobPosting`
- `updateJobPosting`, `deleteJobPosting`

## Configuration

### External APIs
- **ImgBB:** Image hosting for profile pictures
  - API Key: `bcfa113ac09271460674c2e617d293a2`

- **Zoom:** Meeting and recording access
  - Account ID: `XOzfPngYTv2BfV822nKjhw`
  - Uses Server-to-Server OAuth

- **Firebase:** Webhooks for notifications
  - Project: `scaler-school-of-business`
  - Webhook URL: `https://scaler-school-of-business.firebaseapp.com/api/webhook`

## Important Notes

1. **Separation from Placement Backend:**
   - Job portal functionality exists in both backends currently
   - Frontend should be updated to use Placement Backend for all job-related calls
   - Job Portal Functions.js can be removed once migration is complete

2. **Timezone:**
   - All timestamps use `Asia/Kolkata` timezone

3. **File Size:**
   - Code.js is 500KB+ (14,000+ lines)
   - Consider breaking into smaller modules if adding more features

4. **Security:**
   - API keys and secrets are hardcoded (consider moving to Script Properties)
   - Admin checks are done per-request via Google Sheets

## Maintenance

### View Logs
Go to Apps Script editor > Executions

### Update Code
1. Make changes locally
2. `clasp push`
3. Redeploy if needed

### Script Management
Access the script at:
```
https://script.google.com/home
```

## Migration Plan

### To Complete Separation:
1. ✅ Create Placement Backend (Done)
2. ⬜ Update frontend to use Placement Backend URL for job actions
3. ⬜ Remove job portal functions from Code.js (lines 14340-14920)
4. ⬜ Remove Job Portal Functions.js file
5. ⬜ Push cleaned code to Apps Script

This will reduce Code.js size by ~600 lines and fully separate concerns.
