# SSB Backend Deployment Guide

This guide covers deploying both backend projects to Google Apps Script.

## Prerequisites

1. **clasp CLI** installed globally:
   ```bash
   npm install -g @google/clasp
   ```

2. **Google Account Access:**
   - Main SSB account (`notifications.ssb@scaler.com`) for Main Backend
   - Separate Google account for Placement Backend (confirm account email)

## Backend Structure

```
backend/
├── Main Backend/              # Primary backend (non-placement features)
│   └── Script ID: 1qk739eu7fCemaRC4VtJovLQ8Vuc5ZVGyXuQcOaSKEMwyD37Z4oVpvjhB
└── Placement SSB Backend/     # Placement & job portal features
    └── Script ID: 1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD
```

---

## 1. Main Backend Deployment

### Script ID
```
1qk739eu7fCemaRC4VtJovLQ8Vuc5ZVGyXuQcOaSKEMwyD37Z4oVpvjhB
```

### Files to Push
The following files are automatically pushed (controlled by `.claspignore`):
- ✅ `Code.js` - Main API logic (14,000+ lines)
- ✅ `Backend Zoom.js` - Zoom integration
- ✅ `Content Management.js` - Content delivery
- ✅ `Conditional_Logic_Functions.js` - Forms conditional logic
- ✅ `appsscript.json` - Apps Script config

**Excluded files** (ignored during push):
- ❌ `Config.js`
- ❌ `*.md` (all markdown documentation)
- ❌ `*.bak`, `*.bak2`, `*.bak3` (backup files)

### Deployment Steps

```bash
# 1. Navigate to Main Backend
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Main Backend"

# 2. Login with main SSB account (notifications.ssb@scaler.com)
clasp login

# 3. Verify .clasp.json points to correct script ID
cat .clasp.json
# Should show: "scriptId":"1qk739eu7fCemaRC4VtJovLQ8Vuc5ZVGyXuQcOaSKEMwyD37Z4oVpvjhB"

# 4. Push code to Apps Script
clasp push

# 5. (Optional) Deploy new version
clasp deploy --description "Main Backend - [Your description here]"

# 6. (Optional) Open script in browser
clasp open
```

### What This Backend Handles
- Student authentication & profiles
- Content management (dashboard, assignments, resources)
- Students Corner (posts, engagement, leaderboard)
- Zoom integration (live sessions, recordings, notes)
- Forms & assessments
- Admin functions (batch management, analytics)

---

## 2. Placement SSB Backend Deployment

### Script ID
```
1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD
```

### Files to Push
The following files are automatically pushed (controlled by `.claspignore`):
- ✅ `Code.js` - Entry point and utilities
- ✅ `Job Portal Functions.js` - Job CRUD operations
- ✅ `appsscript.json` - Apps Script config

**Only these files** are pushed (everything else is excluded via `**/**` rule).

### Deployment Steps

```bash
# 1. Navigate to Placement Backend
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Placement SSB Backend"

# 2. Login with placement account (if different from main account)
clasp login

# 3. Verify .clasp.json points to correct script ID
cat .clasp.json
# Should show: "scriptId":"1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD"

# 4. Push code to Apps Script
clasp push

# 5. (Optional) Deploy new version
clasp deploy --description "Placement Backend - [Your description here]"

# 6. (Optional) Open script in browser
clasp open
```

### What This Backend Handles
- Job posting CRUD (create, read, update, delete)
- Student job applications
- Placement admin functions

---

## Quick Deploy Commands

### Deploy Both Backends Sequentially

```bash
# Main Backend
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Main Backend" && clasp push

# Placement Backend
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Placement SSB Backend" && clasp push
```

### One-Line Deploy (Copy-Paste Ready)
```bash
cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Main Backend" && clasp push && echo "Main Backend deployed ✓" && cd "/Users/shan/Desktop/Projects/ssb-student-portal/backend/Placement SSB Backend" && clasp push && echo "Placement Backend deployed ✓"
```

---

## Verification Checklist

After deploying, verify:

### Main Backend
- [ ] Script ID in `.clasp.json` is `1qk739eu7fCemaRC4VtJovLQ8Vuc5ZVGyXuQcOaSKEMwyD37Z4oVpvjhB`
- [ ] 5 files pushed: Code.js, Backend Zoom.js, Content Management.js, Conditional_Logic_Functions.js, appsscript.json
- [ ] No `.md` or backup files pushed
- [ ] Web app URL works (test with `getAPIHealth` action)

### Placement Backend
- [ ] Script ID in `.clasp.json` is `1ZUIhyaJtopnbXlH-gWET_qhpQib64tE5bA7NCOCrpAL8_bDCOqlsu7rD`
- [ ] 3 files pushed: Code.js, Job Portal Functions.js, appsscript.json
- [ ] No other files pushed
- [ ] Web app URL works (test with `isAdmin` action)

---

## Troubleshooting

### Wrong Script ID
If `.clasp.json` shows wrong script ID:
```bash
# Edit .clasp.json manually or use:
echo '{"scriptId":"YOUR_CORRECT_SCRIPT_ID","rootDir":"/full/path/to/backend"}' > .clasp.json
```

### Login Issues
```bash
# Logout and login again
clasp logout
clasp login
```

### Permission Denied
Ensure the logged-in account has edit access to:
- The Apps Script project
- All Google Sheets used by the backend
- All Google Drive folders referenced in the code

### Files Not Pushing
Check `.claspignore`:
```bash
cat .claspignore
```

---

## Important Notes

1. **Separate Accounts:** Main Backend uses `notifications.ssb@scaler.com`. Confirm the account for Placement Backend.

2. **Script IDs Never Change:** The script IDs in this guide are permanent. Only update `.clasp.json` if it's wrong.

3. **No Config.js:** Configuration files are intentionally excluded from deployment for security.

4. **Markdown Files Stay Local:** Documentation (`.md` files) are never pushed to Apps Script.

5. **Backup Files Ignored:** `.bak`, `.bak2`, `.bak3` files are automatically excluded.

6. **Test Before Deploy:** Always test changes locally or in a staging environment before deploying to production.

---

## Web App URLs

After deployment, your web app URLs will look like:
```
Main Backend:
https://script.google.com/macros/s/DEPLOYMENT_ID_1/exec

Placement Backend:
https://script.google.com/macros/s/DEPLOYMENT_ID_2/exec
```

Update these URLs in your frontend configuration (`src/services/api.ts`).

---

## Support

For detailed information about each backend's functionality:
- Main Backend: See `Main Backend/README.md`
- Placement Backend: See `Placement SSB Backend/README.md`

For clasp documentation: https://github.com/google/clasp
