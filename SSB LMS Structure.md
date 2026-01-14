# SSB LMS (Learning Management System) - Architecture Documentation

> Scaler School of Business - Student Portal

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Authentication System](#6-authentication-system)
7. [Feature Modules](#7-feature-modules)
8. [Data Layer](#8-data-layer)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Build & Deployment](#10-build--deployment)

---

## 1. Overview

This is a comprehensive **Learning Management System (LMS)** for Scaler School of Business. The platform enables students to access educational content, take exams, submit assignments, apply for placements, and engage with the community.

### Key Capabilities

| Module | Description |
|--------|-------------|
| **Exams** | Create & take exams with 10 question types, proctoring, and analytics |
| **Forms** | Dynamic form builder with conditional logic and response tracking |
| **Assignments** | Assignment management with file uploads, grading, and peer reviews |
| **Placements** | Job portal with applications, interview scheduling, and notifications |
| **Zoom Integration** | Live sessions, recordings, transcripts, and note-taking |
| **Content Management** | Announcements, events, resources, and policies |
| **Students Corner** | Community features with posts, leaderboards, and engagement |

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| TypeScript | 4.9.5 | Type Safety |
| React Router | 7.8.2 | Routing |
| TailwindCSS | 3.4.19 | Styling |
| Radix UI | Latest | Accessible Components |
| Lucide React | Latest | Icons |
| TipTap + Quill | Latest | Rich Text Editing |

### Backend
| Technology | Purpose |
|------------|---------|
| Google Apps Script | Server-side Logic |
| Google Sheets | Primary Database |
| Google Drive | File Storage |
| Supabase | Activity Tracking (Optional) |

### Authentication & Hosting
| Technology | Purpose |
|------------|---------|
| Firebase Auth | Google Sign-In |
| Firebase Hosting | Web Hosting |
| Service Worker | PWA Support |

---

## 3. Project Structure

```
ssb-student-portal/
├── src/                              # React Frontend (112 TSX + 27 TS files)
│   ├── pages/                        # Main application pages
│   │   ├── admin/                    # Admin pages (17 files)
│   │   ├── placement/                # Placement dashboard (standalone app)
│   │   └── assignment/               # Assignment dashboard (standalone app)
│   ├── exam/                         # Exam module (standalone)
│   │   ├── pages/                    # Exam pages
│   │   ├── components/               # Exam-specific components
│   │   ├── services/                 # Exam API
│   │   └── types/                    # Exam types
│   ├── zoom/                         # Zoom integration module
│   │   ├── pages/                    # Session & recording pages
│   │   ├── components/               # Video player, notes
│   │   └── services/                 # Zoom API
│   ├── components/                   # Shared components
│   │   ├── layout/                   # Header, Sidebar, DashboardLayout
│   │   ├── ui/                       # Shadcn/Radix components
│   │   └── admin/                    # Admin-specific components
│   ├── services/                     # API service layer
│   │   ├── api.ts                    # Main backend API (52KB)
│   │   ├── formsApi.ts               # Forms API (33KB)
│   │   ├── assignmentApi.ts          # Assignment API
│   │   └── supabaseClient.ts         # Activity tracking
│   ├── contexts/                     # React Context providers
│   │   └── AuthContext.tsx           # Authentication state
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # Global TypeScript types
│   ├── utils/                        # Utility functions
│   ├── firebase/                     # Firebase configuration
│   └── App.tsx                       # Main router
│
├── backend/                          # Google Apps Script backends
│   ├── Main Backend/                 # Primary backend
│   │   ├── Code.js                   # Main API (460KB, 14,000+ lines)
│   │   ├── Backend Zoom.js           # Zoom management (83KB)
│   │   └── Content Management.js     # Content APIs (42KB)
│   ├── Exam Backend/                 # Exam management
│   │   └── Exam_Management.js        # Exam engine (139KB)
│   ├── Assignment Backend/           # Assignment management
│   │   ├── Assignment_Management.js  # Core logic (115KB)
│   │   └── Master_Sheet_Sync.js      # Data sync (45KB)
│   └── Placement SSB Backend/        # Job portal
│       └── Job Portal Functions.js   # Job management (43KB)
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   └── service-worker.js             # Update handling
│
├── supabase_migrations/              # Supabase schema migrations
├── firebase.json                     # Firebase hosting config
├── tailwind.config.js                # Tailwind configuration
├── craco.config.js                   # CRA config override
└── package.json                      # Dependencies & scripts
```

---

## 4. Frontend Architecture

### 4.1 Routing Structure

The app uses **two routing patterns**:

#### Dashboard Layout Routes (with Header/Sidebar)
```
/overview              → Dashboard home
/dashboards            → Analytics
/sessions              → Live sessions & recordings
/my-notes              → Student notes
/announcements         → Announcements list
/resources             → Learning resources
/calendar              → Event calendar
/forms                 → Forms list
/forms/:formId         → Form submission
/policies              → Policy documents
/exams                 → Exam list
/students-corner       → Community features
/profile               → Student profile
/admin/*               → Admin pages
```

#### Standalone Routes (full-screen, no layout)
```
/exams/:examId/verify     → Exam password entry
/exams/:examId/consent    → Consent form
/exams/:examId/attempt    → Taking exam (proctored)
/exams/:examId/practice   → Practice exam
/exams/result/:attemptId  → Exam results
/video-player             → Video player window
/notes-popup              → Floating notes window
/placement/*              → Placement dashboard
/assignments-platform/*   → Assignment dashboard
```

### 4.2 Component Hierarchy

```
App.tsx
├── AuthContext.Provider
│   ├── Login (unauthenticated)
│   └── BrowserRouter (authenticated)
│       ├── DashboardLayout
│       │   ├── Header
│       │   ├── Sidebar
│       │   └── <Outlet /> (page content)
│       └── Standalone Routes
```

### 4.3 State Management

| Approach | Usage |
|----------|-------|
| **AuthContext** | User authentication, profile, admin status |
| **Local State** | Component-level state with useState |
| **LocalStorage** | Persistence (user, theme, version) |
| **URL State** | Filters, pagination via query params |

---

## 5. Backend Architecture

### 5.1 Multi-Backend Design

The system uses **4 separate Google Apps Script backends** deployed as web apps:

```
                    ┌─────────────────────────────────────┐
                    │         React Frontend              │
                    └─────────────┬───────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐         ┌───────────────┐
│ MAIN BACKEND  │       │ EXAM BACKEND  │         │  ASSIGNMENT   │
│               │       │               │         │   BACKEND     │
│ • Dashboard   │       │ • Exam CRUD   │         │ • Assignment  │
│ • Zoom        │       │ • Questions   │         │   CRUD        │
│ • Forms       │       │ • Attempts    │         │ • Submissions │
│ • Content     │       │ • Results     │         │ • Grading     │
│ • Community   │       │ • Proctoring  │         │ • Master Sync │
└───────────────┘       └───────────────┘         └───────────────┘
                                                          │
                                                          │
                                                  ┌───────────────┐
                                                  │  PLACEMENT    │
                                                  │   BACKEND     │
                                                  │               │
                                                  │ • Job Posts   │
                                                  │ • Applications│
                                                  │ • Emails      │
                                                  └───────────────┘
```

### 5.2 Environment Variables

```env
# Backend URLs
REACT_APP_BACKEND_API_URL=<Main Backend URL>
REACT_APP_EXAM_BACKEND_URL=<Exam Backend URL>
REACT_APP_ASSIGNMENT_BACKEND_URL=<Assignment Backend URL>
REACT_APP_PLACEMENT_BACKEND_URL=<Placement Backend URL>

# Supabase (Activity Tracking)
REACT_APP_SUPABASE_URL=<Supabase Project URL>
REACT_APP_SUPABASE_ANON_KEY=<Supabase Anon Key>

# Assignment Supabase
REACT_APP_ASSIGNMENT_SUPABASE_URL=<Assignment Supabase URL>
REACT_APP_ASSIGNMENT_SUPABASE_ANON_KEY=<Assignment Supabase Key>
```

### 5.3 API Communication Pattern

```typescript
// CORS-safe request pattern (avoids preflight)
const response = await fetch(BACKEND_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' }, // Avoids CORS preflight
  body: JSON.stringify({ action: 'getExams', params: { batch: 'MBA2024' } })
});

// Standard response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## 6. Authentication System

### 6.1 Auth Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login Page  │────▶│ Google OAuth │────▶│ Firebase Auth│
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  AuthContext │◀────│  Fetch User  │◀────│   Backend    │
│   Updated    │     │   Profile    │     │   API Call   │
└──────────────┘     └──────────────┘     └──────────────┘
        │
        ▼
┌──────────────┐
│ LocalStorage │
│   Persist    │
└──────────────┘
```

### 6.2 AuthContext Interface

```typescript
interface AuthContextType {
  user: Student | null;
  student: Student | null;      // Alias for user
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface Student {
  studentId: string;
  email: string;
  name: string;
  batch: string;
  isAdmin?: boolean;
  lastLogin?: string;
}
```

### 6.3 Role-Based Access

| Role | Access |
|------|--------|
| **Student** | Dashboard, Forms, Exams, Assignments, Profile |
| **Admin** | All student features + Management pages, Builders, Analytics |

Admin detection is done by checking against an admin sheet in the backend.

---

## 7. Feature Modules

### 7.1 Exams Module

**Location:** `src/exam/`

| Feature | Description |
|---------|-------------|
| Question Types | MCQ, MCQ with images, Short answer, Long answer (10 types) |
| Proctoring | Webcam, screen share, tab detection, copy/paste block |
| Settings | Time limits, negative marking, randomization |
| Answer Tools | Calculator, scientific calculator, table editor, spreadsheet |
| Practice Mode | Unlimited attempts, no grading |

**Question Structure:**
```typescript
interface Question {
  questionId: string;
  questionText: string;
  questionType: 'mcq' | 'mcq-multi' | 'short' | 'long' | ...;
  options?: Option[];
  correctAnswer?: string | string[];
  marks: number;
  negativeMarks?: number;
  image?: string;
}
```

### 7.2 Forms Module

**Location:** `src/pages/Forms.tsx`, `src/pages/FormFillPage.tsx`, `src/services/formsApi.ts`

| Feature | Description |
|---------|-------------|
| Field Types | Text, textarea, dropdown, radio, checkbox, file, date, rating |
| Conditional Logic | Show/hide questions based on answers |
| Targeting | Batch-specific forms |
| Required Forms | "Show at start until filled" flag blocks access |
| Responses | Real-time response tracking, CSV export |

### 7.3 Assignments Module

**Location:** `src/services/assignmentApi.ts`, `src/pages/assignment/`

| Feature | Description |
|---------|-------------|
| Submission Types | File upload, URL, form questions |
| Group Assignments | Team submissions with peer ratings |
| Tracking | Real-time submission tracking |
| Master Sync | Synchronizes with master data sheet |

### 7.4 Placement Module

**Location:** `src/pages/placement/`, `backend/Placement SSB Backend/`

| Feature | Description |
|---------|-------------|
| Job Listings | Browse and filter job openings |
| Applications | Apply with custom questions (up to 30) |
| Notifications | Email alerts for new jobs and status updates |
| Dashboard | Separate app at `/placement/*` route |

### 7.5 Zoom Integration

**Location:** `src/zoom/`

| Feature | Description |
|---------|-------------|
| Live Sessions | View upcoming sessions, join links |
| Recordings | Browse by term/domain/subject |
| Video Player | Custom player with quality selection |
| Notes | Create, tag, and search notes while watching |

### 7.6 Content Management

**Location:** `src/services/api.ts`, `src/pages/admin/`

| Content Type | Description |
|--------------|-------------|
| Announcements | General announcements with priority levels |
| Events | Classes, webinars, exams with calendar integration |
| Resources | Documents, videos, links organized by hierarchy |
| Policies | Policy documents with acknowledgement tracking |

---

## 8. Data Layer

### 8.1 Primary Storage: Google Sheets

All data is stored in Google Sheets, accessed via Google Apps Script:

| Sheet Type | Purpose |
|------------|---------|
| Students Master | Student profiles, batches |
| Content Sheets | Announcements, events, resources |
| Form Sheets | One sheet per form (responses) |
| Exam Sheets | Questions, attempts, results |
| Assignment Sheets | Submissions, grades |
| Job Sheets | Job postings, applications |

### 8.2 Secondary Storage: Supabase

Optional PostgreSQL database for analytics:

```sql
-- Activity tracking table
CREATE TABLE user_activity (
  id UUID PRIMARY KEY,
  student_email TEXT,
  batch TEXT,
  action_type TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_student_email ON user_activity(student_email);
CREATE INDEX idx_action_type ON user_activity(action_type);
CREATE INDEX idx_timestamp ON user_activity(timestamp);
```

### 8.3 File Storage: Google Drive

- Form response attachments
- Assignment submissions
- Exam resources
- Recording files
- Auto-created folders per form/assignment

---

## 9. Third-Party Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Firebase** | Authentication, Hosting | `src/firebase/config.ts` |
| **Google Apps Script** | Backend APIs | `.clasp.json` |
| **Google Sheets** | Database | Accessed via Apps Script |
| **Google Drive** | File Storage | Accessed via Apps Script |
| **Supabase** | Activity Tracking | `.env` variables |
| **Quill/TipTap** | Rich Text Editing | Component imports |
| **Handsontable** | Spreadsheet Editor | Used in exam tools |

---

## 10. Build & Deployment

### 10.1 Development

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### 10.2 Backend Deployment

```bash
# Push to Google Apps Script
npm run backend:push

# Deploy new version
npm run backend:deploy

# View logs
npm run backend:logs
```

### 10.3 Production Deployment

```bash
# Build frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 10.4 PWA & Service Worker

The app is configured as a Progressive Web App:

- **Manifest:** `public/manifest.json`
- **Service Worker:** `public/service-worker.js`
- **Update Detection:** Checks every 60 seconds
- **Cache Strategy:** No-cache for HTML, long-cache for static assets

### 10.5 Version Management

| Location | Purpose |
|----------|---------|
| `package.json` version | NPM package version |
| `manifest.json` version | PWA version |
| LocalStorage `app_version` | Client-side version tracking |

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Authentication Layer                       │  │
│  │  Firebase Auth → AuthContext → Protected Routes               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │Dashboard │ │  Exams   │ │  Forms   │ │ Assign.  │ │Placement│  │
│  │  Pages   │ │  Module  │ │  Module  │ │  Module  │ │ Module  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘  │
│       │            │            │            │            │        │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴────┐  │
│  │                      Service Layer                           │  │
│  │  api.ts │ examApi.ts │ formsApi.ts │ assignmentApi.ts       │  │
│  └────────────────────────────────┬─────────────────────────────┘  │
└───────────────────────────────────┼────────────────────────────────┘
                                    │ HTTPS (text/plain)
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Google Apps Script)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │    Main      │ │    Exam      │ │  Assignment  │ │ Placement │ │
│  │   Backend    │ │   Backend    │ │   Backend    │ │  Backend  │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────┬─────┘ │
│         │                │                │               │        │
│  ┌──────┴────────────────┴────────────────┴───────────────┴────┐  │
│  │                    Google Workspace                          │  │
│  │           Google Sheets │ Google Drive │ Gmail               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                    OPTIONAL: Supabase                               │
│                    (Activity Tracking & Analytics)                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Summary

The SSB LMS is a modular, scalable learning management system built with:

- **Frontend:** React 19 + TypeScript + TailwindCSS
- **Backend:** 4 Google Apps Script web apps
- **Database:** Google Sheets (primary) + Supabase (analytics)
- **Auth:** Firebase with Google Sign-In
- **Hosting:** Firebase Hosting with PWA support

The architecture supports multiple standalone applications (Exams, Placement, Assignments) while maintaining a unified dashboard experience. The Google Workspace integration provides cost-effective storage and automation capabilities.
