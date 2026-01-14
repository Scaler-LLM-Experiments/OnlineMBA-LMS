# SSB Student Portal - Backend Organization

This directory contains all Google Apps Script backends for the SSB Student Portal.

## 📁 Directory Structure

```
backend/
├── Main Backend/               # Primary backend (student portal)
│   ├── Code.js                # Main API handler (14,000+ lines)
│   ├── Backend Zoom.js        # Zoom integration
│   ├── Content Management.js  # Content delivery
│   ├── Conditional_Logic_Functions.js
│   ├── Job Portal Functions.js  # ⚠️ DEPRECATED - Use Placement Backend
│   ├── appsscript.json
│   ├── .clasp.json
│   ├── .claspignore
│   └── README.md              # Full documentation
│
└── Placement SSB Backend/      # Placement-only backend (separate account)
    ├── Code.js                # API handler & routing
    ├── Job Portal Functions.js # Job CRUD + email notifications
    ├── appsscript.json
    ├── .clasp.json
    ├── .claspignore
    └── README.md              # Full documentation
```

## 🎯 Backend Separation

### Main Backend
**Account:** Main SSB account
**Purpose:** All student portal functionality except placements
**Features:**
- Student authentication & profiles
- Content management (assignments, resources, deadlines)
- Students Corner (posts, engagement, leaderboard)
- Zoom integration (live sessions, recordings, notes)
- Forms & assessments
- Admin functions

**Status:** ✅ Active and deployed

### Placement SSB Backend
**Account:** placement.ssb@scaler.com
**Purpose:** All placement-related functionality
**Features:**
- Job posting CRUD operations
- Email notifications (with Drive link removal)
- Drive folder auto-creation
- Response sheet generation
- Admin verification
- 30 questions support
- Assignment handling

**Status:** ✅ Deployed and ready

**Web App URL:**
```
https://script.google.com/macros/s/AKfycbzAY1VyLRXACxEhuMdJKpDTOCFyDPcGwgO67TLIgVv-XX6x6dhAdJrrZ2Wtawh9Dlxp/exec
```

## 🗑️ Cleaned Up

The following files have been **deleted**:
- ❌ `Code.js.bak` (389KB)
- ❌ `Code.js.bak2` (378KB)
- ❌ `Code.js.bak3` (337KB)

**Total space saved:** ~1.1MB

## 🚀 Deployment

### Deploy Main Backend
```bash
cd "Main Backend"
clasp login  # Use main SSB account
clasp push
clasp deploy --description "Main Backend Update"
```

### Deploy Placement Backend
```bash
cd "Placement SSB Backend"
clasp login  # Use placement.ssb@scaler.com
clasp push
clasp deploy --description "Placement Backend Update"
```

## 📊 Current Architecture

```
Frontend (React App)
    │
    ├──► Main Backend URL
    │    └─ Student portal features
    │    └─ ⚠️ Also has job portal (DEPRECATED)
    │
    └──► Placement Backend URL
         └─ Job portal features (NEW)
```

## 🔄 Migration Status

| Feature | Main Backend | Placement Backend | Frontend Uses |
|---------|--------------|-------------------|---------------|
| Student Auth | ✅ Active | - | Main Backend |
| Content | ✅ Active | - | Main Backend |
| Students Corner | ✅ Active | - | Main Backend |
| Zoom | ✅ Active | - | Main Backend |
| Forms | ✅ Active | - | Main Backend |
| **Job Portal** | ⚠️ Present | ✅ Active | **Main (need to switch)** |

## ⚡ Next Steps

1. **Update Frontend Config**
   - Add Placement Backend URL to environment variables
   - Switch job-related API calls to use Placement Backend

2. **Clean Main Backend** (After frontend migration)
   - Remove Job Portal Functions.js
   - Remove job functions from Code.js (lines 14340-14920)
   - This will reduce Code.js by ~600 lines

3. **Test Both Backends**
   - Ensure no breaking changes
   - Verify email notifications work
   - Test Drive folder creation

## 📝 Notes

- Both backends currently have job portal code (duplication is OK for now)
- Frontend still uses Main Backend for everything
- Placement Backend is ready but not being used yet
- No breaking changes - everything continues to work

## 📖 Documentation

See README.md in each backend folder for detailed documentation:
- `Main Backend/README.md` - Main backend API reference
- `Placement SSB Backend/README.md` - Placement backend API reference
