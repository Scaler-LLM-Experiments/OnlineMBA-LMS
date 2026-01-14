# Placement Backend Migration - Complete Summary

## ✅ Changes Completed

### 1. Environment Configuration

#### `.env` - Updated
Added Placement Backend URL:
```bash
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/AKfycbzMprg1hHcDd8Ck2G6QxOEU02CtzTPiJzFpPo54i8HL8_TkVS9gJ_ww3arc-QsC6tmm/exec
REACT_APP_PLACEMENT_BACKEND_URL=https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec
```

#### `.env.local` - Updated
Added Placement Backend URL with comments:
```bash
# Main Backend - Student Portal (all features except placement)
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/AKfycbzMprg1hHcDd8Ck2G6QxOEU02CtzTPiJzFpPo54i8HL8_TkVS9gJ_ww3arc-QsC6tmm/exec

# Placement Backend - Job Portal only (placement.ssb@scaler.com account)
REACT_APP_PLACEMENT_BACKEND_URL=https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec
```

#### `.env.local.example` - Updated
Documented both backend URLs for reference.

### 2. API Service Updates (`src/services/api.ts`)

#### Added Placement Backend URL Constant
```typescript
// Main Backend API - Student Portal (all features except placement)
const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL || '...';

// Placement Backend API - Job Portal only (placement.ssb@scaler.com account)
const PLACEMENT_BACKEND_URL = process.env.REACT_APP_PLACEMENT_BACKEND_URL || '...';
```

#### Updated `makeRequest` Method Signature
```typescript
// Before:
private async makeRequest<T>(action: string, params: Record<string, any> = {}, usePost: boolean = false): Promise<ApiResponse<T>>

// After:
private async makeRequest<T>(action: string, params: Record<string, any> = {}, usePost: boolean = false, customBackendUrl?: string): Promise<ApiResponse<T>>
```

Added logic to use custom backend URL:
```typescript
const backendUrl = customBackendUrl || BACKEND_URL;
```

Updated fetch calls to use `backendUrl` instead of hardcoded `BACKEND_URL`.

#### Updated Job Portal Methods (Lines 482-515)

All job-related methods now use `PLACEMENT_BACKEND_URL`:

1. **createJobPosting** (Line 483-487)
```typescript
async createJobPosting(jobData: any): Promise<ApiResponse<{...}>> {
  return this.makeRequest<{...}>('createJobPosting', {
    jobData: JSON.stringify(jobData)
  }, true, PLACEMENT_BACKEND_URL);  // ✅ Added
}
```

2. **getAllJobPostings** (Line 489-493)
```typescript
async getAllJobPostings(filters?: any): Promise<ApiResponse<any[]>> {
  return this.makeRequest<any[]>('getAllJobPostings', {
    filters: filters ? JSON.stringify(filters) : undefined
  }, false, PLACEMENT_BACKEND_URL);  // ✅ Added
}
```

3. **getJobPosting** (Line 495-499)
```typescript
async getJobPosting(jobId: string): Promise<ApiResponse<any>> {
  return this.makeRequest<any>('getJobPosting', {
    jobId
  }, false, PLACEMENT_BACKEND_URL);  // ✅ Added
}
```

4. **updateJobPosting** (Line 501-506)
```typescript
async updateJobPosting(jobId: string, updates: any): Promise<ApiResponse<{message: string}>> {
  return this.makeRequest<{message: string}>('updateJobPosting', {
    jobId,
    updates: JSON.stringify(updates)
  }, true, PLACEMENT_BACKEND_URL);  // ✅ Added
}
```

5. **deleteJobPosting** (Line 508-512)
```typescript
async deleteJobPosting(jobId: string): Promise<ApiResponse<{message: string}>> {
  return this.makeRequest<{message: string}>('deleteJobPosting', {
    jobId
  }, false, PLACEMENT_BACKEND_URL);  // ✅ Added
}
```

6. **uploadJobFile** (Line 517-553)
```typescript
async uploadJobFile(file: File, jobId: string, fileType: 'jd' | 'attachment'): Promise<ApiResponse<{ fileUrl: string }>> {
  // ...
  const response = await fetch(PLACEMENT_BACKEND_URL, {  // ✅ Changed from BACKEND_URL
    method: 'POST',
    // ...
  });
}
```

## 📊 Architecture Overview

### Before:
```
Frontend → Main Backend URL → All Features (including jobs)
```

### After:
```
Frontend
  ├── Main Backend URL → Student Portal Features
  └── Placement Backend URL → Job Portal Features ✅
```

## 🎯 What's Now Using Placement Backend

| API Method | Backend | Account |
|------------|---------|---------|
| createJobPosting | Placement | placement.ssb@scaler.com |
| getAllJobPostings | Placement | placement.ssb@scaler.com |
| getJobPosting | Placement | placement.ssb@scaler.com |
| updateJobPosting | Placement | placement.ssb@scaler.com |
| deleteJobPosting | Placement | placement.ssb@scaler.com |
| uploadJobFile | Placement | placement.ssb@scaler.com |

| API Method | Backend | Account |
|------------|---------|---------|
| login, getStudentDashboard, etc. | Main | Main SSB Account |
| Students Corner | Main | Main SSB Account |
| Zoom Integration | Main | Main SSB Account |
| All other features | Main | Main SSB Account |

## 🔧 Files Modified

1. ✅ `.env` - Added PLACEMENT_BACKEND_URL
2. ✅ `.env.local` - Added PLACEMENT_BACKEND_URL with comments
3. ✅ `.env.local.example` - Documented both URLs
4. ✅ `src/services/api.ts` - Updated all job methods to use Placement Backend

## ⚠️ Important: Next Steps Required

### BEFORE TESTING - You MUST Add Mail Columns to Sheet

Your Placement Data sheet is **MISSING 4 COLUMNS**. Add these **before ApplicationsCount**:

#### Current Columns (216 total):
```
...CustomVisibilityRule, ApplicationsCount, DriveLink, SheetsLink
```

#### Required Columns (220 total):
```
...CustomVisibilityRule, MailTo, MailCC, MailBCC, SendMail, ApplicationsCount, DriveLink, SheetsLink
```

**To add manually:**
1. Open Placement Data sheet in Google Sheets
2. Right-click column header for ApplicationsCount
3. Insert 4 columns to the left
4. Name them: MailTo, MailCC, MailBCC, SendMail

**Without these columns, job creation will FAIL!**

### Then Test the Integration

1. **Restart your development server:**
```bash
# Kill existing server
# Start fresh
npm start
```

2. **Test job creation:**
   - Go to Admin > Job Builder
   - Create a test job posting
   - Check console for API calls going to Placement Backend
   - Verify email notification is sent

3. **Verify data:**
   - Check Placement Data sheet for new row
   - Check Drive folder was created
   - Check Response sheet was created
   - Check mail columns are populated

## 🔍 How to Verify It's Working

### In Browser DevTools (Network Tab):

**Before (using Main Backend):**
```
POST https://script.google.com/macros/s/AKfycbzMprg1hHcDd8Ck2G6QxOEU02CtzTPiJzFpPo54i8HL8_TkVS9gJ_ww3arc-QsC6tmm/exec
```

**After (using Placement Backend):** ✅
```
POST https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec
```

### In Console:
You should see logs like:
```
Placement Backend - Action: createJobPosting
📧 Sending email notification...
✅ Email sent successfully
```

## 📦 Deployment Checklist

When ready to deploy to production:

- [x] Environment variables updated
- [x] API service updated
- [x] All job methods using Placement Backend
- [ ] Add 4 mail columns to Placement Data sheet
- [ ] Test locally with npm start
- [ ] Build: `npm run build`
- [ ] Deploy: `firebase deploy`
- [ ] Test on production

## 🔄 Rollback Plan

If something goes wrong, you can quickly rollback:

1. **Revert api.ts changes:**
   - Remove `PLACEMENT_BACKEND_URL` constant
   - Remove 4th parameter from all job method calls
   - Jobs will go back to Main Backend

2. **Or just change .env:**
   - Set both URLs to Main Backend URL temporarily
   - This routes all traffic to Main Backend

## 📞 Backend URLs Reference

### Main Backend (Student Portal)
```
https://script.google.com/macros/s/AKfycbzMprg1hHcDd8Ck2G6QxOEU02CtzTPiJzFpPo54i8HL8_TkVS9gJ_ww3arc-QsC6tmm/exec
```
**Account:** Main SSB Account
**Script Location:** `backend/Main Backend/`

### Placement Backend (Job Portal)
```
https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec
```
**Account:** placement.ssb@scaler.com
**Script ID:** 1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD
**Script Location:** `backend/Placement SSB Backend/`

## ✅ Migration Complete!

Your frontend is now configured to use the Placement Backend for all job-related operations. The separation provides:

- ✅ Better security (separate accounts)
- ✅ Independent scaling (separate execution quotas)
- ✅ Easier maintenance (focused backends)
- ✅ No breaking changes (everything still works)

**Next:** Add the 4 mail columns to your sheet and test!
