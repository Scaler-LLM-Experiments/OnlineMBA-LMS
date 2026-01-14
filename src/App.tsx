/**
 * App Router
 * Online MBA - Main application entry with code splitting
 */

import React, { Suspense, lazy, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ErrorBoundary, RouteErrorBoundary } from './core/errors/ErrorBoundary';
import { DashboardLayout, LoadingState } from './shared/components/layout/DashboardLayout';
import { ToastProvider } from './shared/components/ui/Toast';
import { useAuth, AuthProvider } from './features/auth/hooks/useAuth';

// ============================================
// Lazy-loaded Pages (Code Splitting)
// ============================================

// Auth
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));

// Dashboard
const OverviewPage = lazy(() => import('./features/dashboard/pages/OverviewPage'));

// Sessions/Zoom
const SessionsPage = lazy(() => import('./zoom/pages/SessionsPage'));
const LiveSessionsPage = lazy(() => import('./zoom/pages/LiveSessionsPage'));
const RecordingsPage = lazy(() => import('./zoom/pages/RecordingsPage'));
const VideoPlayerPage = lazy(() => import('./zoom/pages/VideoPlayerPage'));
const NotesPage = lazy(() => import('./zoom/pages/NotesPage'));

// Exams
const ExamsPage = lazy(() => import('./exam/pages/Exams'));
const ExamPasswordEntry = lazy(() => import('./exam/pages/ExamPasswordEntry'));
const ExamConsent = lazy(() => import('./exam/pages/ExamConsent'));
const ExamAttempt = lazy(() => import('./exam/pages/ExamAttempt'));
const PracticeExamAttempt = lazy(() => import('./exam/pages/PracticeExamAttempt'));
const ExamResultPage = lazy(() => import('./exam/pages/ExamResultPage'));

// Assignments
const AssignmentDashboard = lazy(() => import('./pages/assignment/AssignmentDashboard'));
const AssignmentListPage = lazy(() => import('./pages/assignment/AssignmentListPage'));

// Content - Use new pages where available, fallback to old ones
const AnnouncementsPage = lazy(() => import('./features/announcements/pages/AnnouncementsPage'));
const ResourcesPage = lazy(() => import('./features/resources/pages/ResourcesPage'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const PoliciesPage = lazy(() => import('./pages/Policies'));
const FormsPage = lazy(() => import('./pages/Forms'));
const FormFillPage = lazy(() => import('./pages/FormFillPage'));
const FormSubmissionPage = lazy(() => import('./pages/FormSubmissionPage'));
const FormResponseView = lazy(() => import('./pages/FormResponseView'));

// Community
const StudentsCornerPage = lazy(() => import('./pages/StudentsCorner'));

// Profile
const ProfilePage = lazy(() => import('./pages/Profile'));

// Placement
const PlacementDashboard = lazy(() => import('./pages/placement/PlacementDashboard'));
const PlacementProfilePage = lazy(() => import('./pages/PlacementProfile'));

// Admin
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ExamManagementPage = lazy(() => import('./exam/pages/admin/ExamManagementPage'));
const ExamBuilderPage = lazy(() => import('./exam/pages/admin/ExamBuilderPage'));
const ExamViewPage = lazy(() => import('./exam/pages/admin/ExamViewPage'));
const AssignmentManagementPage = lazy(() => import('./pages/admin/AssignmentManagementPage'));
const AssignmentActionsTrackerPage = lazy(() => import('./pages/admin/AssignmentActionsTrackerPage'));
const FormsManagementPage = lazy(() => import('./pages/admin/FormsManagementPage'));
const FormBuilderPage = lazy(() => import('./pages/admin/FormBuilderPage'));
const FormResponsesPage = lazy(() => import('./pages/admin/FormResponsesPage'));
const EventsManagementPage = lazy(() => import('./pages/admin/EventsManagementPage'));
const ResourcesManagementPage = lazy(() => import('./pages/admin/ResourcesManagementPage'));
const PoliciesManagementPage = lazy(() => import('./pages/admin/PoliciesManagementPage'));
const ZoomManagementPage = lazy(() => import('./pages/admin/ZoomManagementPage'));
const JobPortalManagementPage = lazy(() => import('./pages/admin/JobPortalManagementPage'));
const JobBuilderPage = lazy(() => import('./pages/admin/JobBuilderPage'));
const JobResponsesPage = lazy(() => import('./pages/admin/JobResponsesPage'));
const PlacementManagementPage = lazy(() => import('./pages/admin/PlacementManagementPage'));
const PortalUsageTracker = lazy(() => import('./pages/admin/PortalUsageTracker'));

// ============================================
// Loading Fallback
// ============================================

function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingState text="Loading..." />
    </div>
  );
}

// ============================================
// Protected Route Component
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/overview" replace />;
  }

  return <>{children}</>;
}

// ============================================
// Admin Route Guard Component
// ============================================

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/overview" replace />;
  }

  return <>{children}</>;
}

// ============================================
// Main App Component
// ============================================

function AppRoutes() {
  const { user, isAuthenticated, isLoading, signInWithGoogle, signOut } = useAuth();

  const handleLogout = useCallback(() => {
    signOut();
  }, [signOut]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <LoadingState text="Initializing Online MBA..." />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/overview" replace />
            ) : (
              <LoginPage onGoogleSignIn={signInWithGoogle} isLoading={isLoading} />
            )
          }
        />

        {/* Protected Routes with Dashboard Layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout
                user={user}
                isAdmin={user?.isAdmin}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/overview" element={<OverviewPage user={user} />} />
          <Route path="/dashboards" element={<OverviewPage user={user} />} />

          {/* Sessions */}
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:term" element={<SessionsPage />} />
          <Route path="/sessions/:term/:domain" element={<SessionsPage />} />
          <Route path="/sessions/:term/:domain/:subject" element={<SessionsPage />} />
          <Route path="/sessions/live" element={<LiveSessionsPage />} />
          <Route path="/sessions/recordings" element={<RecordingsPage />} />
          <Route path="/my-notes" element={<NotesPage />} />
          <Route path="/my-notes/:term" element={<NotesPage />} />
          <Route path="/my-notes/:term/:domain" element={<NotesPage />} />
          <Route path="/my-notes/:term/:domain/:subject" element={<NotesPage />} />

          {/* Exams */}
          <Route path="/exams" element={<ExamsPage />} />

          {/* Assignments */}
          <Route path="/assignments-platform/*" element={<AssignmentDashboard />} />
          <Route path="/assignments" element={<AssignmentListPage />} />

          {/* Content */}
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/*" element={<ResourcesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/:formId" element={<FormFillPage />} />
          <Route path="/forms/:formId/responses" element={<FormResponseView />} />
          <Route path="/forms/:formId/submission/:submissionId" element={<FormSubmissionPage />} />

          {/* Community */}
          <Route path="/students-corner" element={<StudentsCornerPage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/placement" element={<PlacementProfilePage />} />

          {/* Placement */}
          <Route path="/placement/*" element={<PlacementDashboard />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="/admin/exams" element={<AdminGuard><ExamManagementPage /></AdminGuard>} />
          <Route path="/admin/exams/create" element={<AdminGuard><ExamBuilderPage /></AdminGuard>} />
          <Route path="/admin/exams/view/:examId" element={<AdminGuard><ExamViewPage /></AdminGuard>} />
          <Route path="/admin/exams/edit/:examId" element={<AdminGuard><ExamBuilderPage /></AdminGuard>} />
          <Route path="/admin/assignments" element={<AdminGuard><AssignmentManagementPage /></AdminGuard>} />
          <Route path="/admin/assignments/track-actions" element={<AdminGuard><AssignmentActionsTrackerPage /></AdminGuard>} />
          <Route path="/admin/forms" element={<AdminGuard><FormsManagementPage /></AdminGuard>} />
          <Route path="/admin/forms/new" element={<AdminGuard><FormBuilderPage /></AdminGuard>} />
          <Route path="/admin/forms/:formId/edit" element={<AdminGuard><FormBuilderPage /></AdminGuard>} />
          <Route path="/admin/forms/:formId/responses" element={<AdminGuard><FormResponsesPage /></AdminGuard>} />
          <Route path="/admin/events" element={<AdminGuard><EventsManagementPage /></AdminGuard>} />
          <Route path="/admin/resources" element={<AdminGuard><ResourcesManagementPage /></AdminGuard>} />
          <Route path="/admin/policies" element={<AdminGuard><PoliciesManagementPage /></AdminGuard>} />
          <Route path="/admin/zoom" element={<AdminGuard><ZoomManagementPage /></AdminGuard>} />
          <Route path="/admin/jobs" element={<AdminGuard><JobPortalManagementPage /></AdminGuard>} />
          <Route path="/admin/jobs/new" element={<AdminGuard><JobBuilderPage /></AdminGuard>} />
          <Route path="/admin/jobs/:jobId/edit" element={<AdminGuard><JobBuilderPage /></AdminGuard>} />
          <Route path="/admin/jobs/:jobId/responses" element={<AdminGuard><JobResponsesPage /></AdminGuard>} />
          <Route path="/admin/placement" element={<AdminGuard><PlacementManagementPage /></AdminGuard>} />
          <Route path="/admin/usage-tracker" element={<AdminGuard><PortalUsageTracker /></AdminGuard>} />
        </Route>

        {/* Standalone Routes (No Dashboard Layout) */}
        <Route
          path="/exams/:examId/verify"
          element={
            <ProtectedRoute>
              <ExamPasswordEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/consent"
          element={
            <ProtectedRoute>
              <ExamConsent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/attempt"
          element={
            <ProtectedRoute>
              <ExamAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/practice"
          element={
            <ProtectedRoute>
              <PracticeExamAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/result/:attemptId"
          element={
            <ProtectedRoute>
              <ExamResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-player"
          element={
            <ProtectedRoute>
              <VideoPlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Suspense>
  );
}

// ============================================
// App with Providers
// ============================================

export default function App() {
  return (
    <ErrorBoundary level="page">
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider position="top-right" maxToasts={5}>
            <RouteErrorBoundary>
              <AppRoutes />
            </RouteErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
