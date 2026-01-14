/**
 * Features Module Exports
 * Online MBA - Central export point for all features
 */

// Auth
export { AuthProvider, useAuth, useUser, useIsAdmin } from './auth/hooks/useAuth';
export { default as LoginPage } from './auth/pages/LoginPage';

// Dashboard
export { default as OverviewPage } from './dashboard/pages/OverviewPage';

// Announcements
export { default as AnnouncementsPage } from './announcements/pages/AnnouncementsPage';

// Resources
export { default as ResourcesPage } from './resources/pages/ResourcesPage';
