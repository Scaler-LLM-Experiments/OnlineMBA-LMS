# Zoom Sessions Integration Guide - SSB Student Portal

## 📁 **What Was Added**

### **Frontend - `/src/zoom` folder:**
```
src/zoom/
├── components/
│   ├── ZoomPlayer.tsx          # Embedded Zoom meeting player
│   ├── VideoPlayer.tsx         # Generic video player wrapper
│   ├── DualVideoView.tsx       # Side-by-side Zoom + Scaler view
│   ├── SessionCard.tsx         # Session card component
│   ├── NotesPanel.tsx          # Notes sidebar panel
│   └── NoteEditor.tsx          # Rich text note editor
├── pages/
│   ├── LiveSessionsPage.tsx    # Live sessions view
│   ├── RecordingsPage.tsx      # Recordings library
│   └── NotesPage.tsx           # All notes view
├── hooks/
│   ├── useSessions.ts          # Sessions data hook
│   └── useNotes.ts             # Notes data hook
├── types/
│   └── session.types.ts        # TypeScript types
└── services/
    └── api.ts                  # API service for backend calls
```

### **Backend - `/backend/Backend Zoom.js`:**
- Complete Zoom API integration
- Meeting creation & management
- Recording sync & download
- Google Calendar integration
- Google Drive organization

---

## 🚀 **Quick Integration Steps**

### **Step 1: Install Dependencies**

```bash
cd /Users/shan/Desktop/Projects/ssb-student-portal
npm install @zoom/meetingsdk
```

---

### **Step 2: Update Environment Variables**

Add to `.env` (or `.env.local`):

```env
# Zoom SDK
REACT_APP_ZOOM_SDK_KEY=hW7JTiE9TYewkWQ9DdQ4w

# Backend API (update with your Apps Script deployment URL)
REACT_APP_BACKEND_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

### **Step 3: Add Routes to App.tsx**

Update `/src/App.tsx`:

```typescript
// Add imports at top
import { LiveSessionsPage } from './zoom/pages/LiveSessionsPage';
import { RecordingsPage } from './zoom/pages/RecordingsPage';
import { NotesPage } from './zoom/pages/NotesPage';

// Add routes inside <DashboardLayout> (after /calendar, before /policies):
<Route path="/sessions">
  <Route path="live" element={<LiveSessionsPage />} />
  <Route path="recordings" element={<RecordingsPage />} />
  <Route path="notes" element={<NotesPage />} />
  <Route index element={<Navigate to="/sessions/live" replace />} />
</Route>
```

**Complete example:**
```typescript
<Route element={<DashboardLayout />}>
  <Route index element={<Navigate to="/overview" replace />} />
  <Route path="/overview" element={<OverviewPage />} />
  <Route path="/dashboards" element={<DashboardsPage />} />
  <Route path="/assignments" element={<AssignmentsPage />} />
  <Route path="/announcements" element={<AnnouncementsPage />} />
  <Route path="/resources/*" element={<ResourcesPage />} />
  <Route path="/students-corner" element={<StudentsCorner />} />
  <Route path="/calendar" element={<CalendarPage />} />

  {/* NEW: Zoom Sessions Routes */}
  <Route path="/sessions">
    <Route path="live" element={<LiveSessionsPage />} />
    <Route path="recordings" element={<RecordingsPage />} />
    <Route path="notes" element={<NotesPage />} />
    <Route index element={<Navigate to="/sessions/live" replace />} />
  </Route>

  <Route path="/policies" element={<PoliciesPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Route>
```

---

### **Step 4: Add Navigation to Sidebar**

Update `/src/components/layout/Sidebar.tsx`:

**Add import:**
```typescript
import { Video } from 'lucide-react';
```

**Add to navigation items array (after Calendar, before Policies):**

```typescript
{
  name: 'Sessions',
  icon: Video,
  path: '/sessions/live',
  subItems: [
    { name: 'Live Sessions', path: '/sessions/live' },
    { name: 'Recordings', path: '/sessions/recordings' },
    { name: 'My Notes', path: '/sessions/notes' }
  ]
}
```

**Complete navigation array example:**
```typescript
const navItems = [
  { name: 'Overview', icon: LayoutDashboard, path: '/overview' },
  { name: 'Dashboard', icon: BarChart3, path: '/dashboards' },
  { name: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { name: 'Events & Announcements', icon: Megaphone, path: '/announcements' },
  { name: 'Resources', icon: FolderOpen, path: '/resources' },
  { name: 'Students Corner', icon: Users, path: '/students-corner' },
  { name: 'Calendar', icon: Calendar, path: '/calendar' },

  // NEW: Sessions
  {
    name: 'Sessions',
    icon: Video,
    path: '/sessions/live',
    subItems: [
      { name: 'Live Sessions', path: '/sessions/live' },
      { name: 'Recordings', path: '/sessions/recordings' },
      { name: 'My Notes', path: '/sessions/notes' }
    ]
  },

  { name: 'Policy & Documents', icon: FileText, path: '/policies' },
  { name: 'Profile', icon: User, path: '/profile' }
];
```

---

### **Step 5: Update API Service**

Check if `/src/zoom/services/api.ts` uses the correct API URL:

```typescript
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL || '';
```

Make sure this points to your Apps Script deployment.

---

### **Step 6: Deploy Backend to Apps Script**

```bash
cd /Users/shan/Desktop/Projects/ssb-student-portal/backend

# If you haven't logged in to clasp yet:
clasp login

# Push to Apps Script
clasp push

# Open in browser to deploy
clasp open
```

In Apps Script editor:
1. Update CONFIG with your credentials in `Backend Zoom.js`
2. Deploy as Web App
3. Copy deployment URL
4. Add to `.env` as `REACT_APP_BACKEND_API_URL`

---

### **Step 7: Test the Integration**

```bash
npm start
```

Navigate to:
- http://localhost:3000/sessions/live
- http://localhost:3000/sessions/recordings
- http://localhost:3000/sessions/notes

---

## 🎨 **Expected UI Changes**

### **Sidebar (New Item):**
```
📊 Overview
📈 Dashboard
📋 Assignments
📢 Events & Announcements
📁 Resources
👥 Students Corner
📅 Calendar
🎥 Sessions              ← NEW!
   ├─ Live Sessions
   ├─ Recordings
   └─ My Notes
📄 Policy & Documents
👤 Profile
```

---

## 🔧 **Backend Configuration**

### **Update Backend Zoom.js**

In `/backend/Backend Zoom.js`, update the CONFIG section:

```javascript
const CONFIG = {
  SHEET_ID: "1WrMjYy2v_Ln6dH7gS86KvC4E79MfgMC5tkpUojlKve0",

  ZOOM: {
    ACCOUNT_ID: "XOzfPngYTv2BfV822nKjhw",
    CLIENT_ID: "xS5gKNgfQFGBrCgsDQCTNg",
    CLIENT_SECRET: "JJ1lBN7LEcTRs8YK2Q7R2KqeJASOeulT",
    SDK_KEY: "hW7JTiE9TYewkWQ9DdQ4w",
    SDK_SECRET: "iv628tejlub254TUjj1nAglYSfHu3ddi"
  },

  DRIVE: {
    MAIN_FOLDER_ID: "1fm5W7aHG8ad0GNCyluUwBLtkRMioEkQG",
    MAIN_FOLDER_NAME: "SSB Zoom Recordings"
  }
};
```

---

## 📋 **Integration Checklist**

```
☐ Install @zoom/meetingsdk
☐ Add ZOOM_SDK_KEY to .env
☐ Add BACKEND_API_URL to .env
☐ Import pages in App.tsx
☐ Add /sessions routes in App.tsx
☐ Add Sessions nav item in Sidebar.tsx
☐ Update Backend Zoom.js CONFIG
☐ Push Backend Zoom.js to Apps Script (clasp push)
☐ Deploy as Web App in Apps Script
☐ Test /sessions/live page
☐ Test /sessions/recordings page
☐ Test /sessions/notes page
```

---

## 🔍 **Troubleshooting**

### **"Module not found: @zoom/meetingsdk"**
```bash
npm install @zoom/meetingsdk
```

### **"Cannot read properties of undefined (reading 'getSessions')"**
- Check REACT_APP_BACKEND_API_URL in .env
- Verify Apps Script is deployed
- Check browser console for API errors

### **"Failed to load Zoom SDK"**
- Verify REACT_APP_ZOOM_SDK_KEY is correct
- Check Zoom SDK key is valid

### **Routes not working**
- Ensure routes are inside `<DashboardLayout>` wrapper
- Check exact path matching in App.tsx

---

## 🎯 **Next Steps After Integration**

1. **Test with real session data** from Google Sheets
2. **Add session data** to your sheets
3. **Test Zoom meeting creation** from "Create Zoom + Google Calendar" sheet
4. **Configure triggers** in Apps Script for automation
5. **Deploy to production**

---

## 📁 **Final File Structure**

```
ssb-student-portal/
├── backend/
│   ├── Backend Zoom.js         ← NEW (Zoom automation)
│   ├── Code.js                 ← Existing (Portal backend)
│   └── appsscript.json
├── src/
│   ├── zoom/                   ← NEW (All Zoom components)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── services/
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx     ← Update with Sessions nav
│   │       └── ...
│   ├── pages/
│   ├── App.tsx                 ← Update with routes
│   └── ...
├── .env                        ← Update with Zoom SDK key
└── package.json                ← Add @zoom/meetingsdk
```

---

## 🚀 **You're Ready!**

The Zoom sessions module is now integrated as a clean, self-contained feature in your SSB Student Portal!

**Time to complete:** ~15 minutes
**Difficulty:** Easy (just configuration changes)

---

**Need help? Check the existing components in `/src/zoom` for examples!**
