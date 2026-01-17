/**
 * Application Constants
 * Centralized configuration for Online MBA LMS
 */

// Application Branding
export const APP_CONFIG = {
  name: 'Online MBA',
  fullName: 'Online MBA - Learning Management System',
  tagline: 'Transform Your Career with World-Class Business Education',
  version: '1.0.0',
  company: 'Scaler',
  companyUrl: 'https://www.scaler.com',
  supportEmail: 'support@scaler.com',
} as const;

// API Configuration
export const API_CONFIG = {
  mainBackend: process.env.REACT_APP_BACKEND_API_URL || '',
  examBackend: process.env.REACT_APP_EXAM_BACKEND_URL || '',
  assignmentBackend: process.env.REACT_APP_ASSIGNMENT_BACKEND_URL || '',
  placementBackend: process.env.REACT_APP_PLACEMENT_BACKEND_URL || '',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  shortTTL: 1 * 60 * 1000, // 1 minute
  longTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 100,
  staleWhileRevalidate: true,
} as const;

// Pagination Defaults
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  displayWithTime: 'MMM dd, yyyy HH:mm',
  input: 'yyyy-MM-dd',
  api: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  user: 'omba_user',
  token: 'omba_token',
  theme: 'omba_theme',
  version: 'omba_version',
  lastActivity: 'omba_last_activity',
  cache: 'omba_cache',
} as const;

// Route Paths
export const ROUTES = {
  // Public
  login: '/login',

  // Dashboard
  overview: '/overview',
  dashboard: '/dashboards',

  // Learning
  sessions: '/sessions',
  recordings: '/recordings',
  notes: '/my-notes',
  resources: '/resources',

  // Assessments
  exams: '/exams',
  assignments: '/assignments',
  forms: '/forms',

  // Information
  announcements: '/announcements',
  calendar: '/calendar',
  policies: '/policies',

  // Community
  community: '/students-corner',

  // Career
  placement: '/placement',
  profile: '/profile',

  // Admin
  admin: '/admin',
} as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    path: ROUTES.overview,
    icon: 'LayoutDashboard',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    path: ROUTES.sessions,
    icon: 'Video',
    children: [
      { id: 'live', label: 'Live Sessions', path: '/sessions/live' },
      { id: 'recordings', label: 'Recordings', path: ROUTES.recordings },
      { id: 'notes', label: 'My Notes', path: ROUTES.notes },
    ],
  },
  {
    id: 'exams',
    label: 'Exams',
    path: ROUTES.exams,
    icon: 'FileText',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    path: ROUTES.assignments,
    icon: 'ClipboardList',
  },
  {
    id: 'resources',
    label: 'Resources',
    path: ROUTES.resources,
    icon: 'BookOpen',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    path: ROUTES.announcements,
    icon: 'Bell',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: ROUTES.calendar,
    icon: 'Calendar',
  },
  {
    id: 'forms',
    label: 'Forms',
    path: ROUTES.forms,
    icon: 'FileCheck',
  },
  {
    id: 'policies',
    label: 'Policies',
    path: ROUTES.policies,
    icon: 'Shield',
  },
  {
    id: 'community',
    label: 'Community',
    path: ROUTES.community,
    icon: 'Users',
  },
  {
    id: 'placement',
    label: 'Placement',
    path: ROUTES.placement,
    icon: 'Briefcase',
  },
] as const;

// Feature Flags
export const FEATURES = {
  darkMode: true,
  analytics: true,
  offlineSupport: true,
  pushNotifications: false,
  videoNotes: true,
  communityFeatures: true,
  placementPortal: true,
} as const;
