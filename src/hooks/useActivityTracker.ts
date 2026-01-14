import { useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { activityService } from '../services/supabaseClient';

/**
 * Hook for tracking user activity
 */
export const useActivityTracker = () => {
  const { student } = useAuth();

  /**
   * Log a page view
   */
  const trackPageView = useCallback((pageName: string) => {
    if (!student?.email) return;

    activityService.logActivity({
      student_email: student.email,
      batch: student.batch,
      action_type: 'page_view',
      action_detail: pageName,
    });
  }, [student]);

  /**
   * Log form interaction
   */
  const trackFormInteraction = useCallback((formName: string, action: 'opened' | 'submitted') => {
    if (!student?.email) return;

    activityService.logActivity({
      student_email: student.email,
      batch: student.batch,
      action_type: 'form_interaction',
      action_detail: `${formName} - ${action}`,
    });
  }, [student]);

  /**
   * Log resource download
   */
  const trackResourceDownload = useCallback((resourceName: string) => {
    if (!student?.email) return;

    activityService.logActivity({
      student_email: student.email,
      batch: student.batch,
      action_type: 'resource_download',
      action_detail: resourceName,
    });
  }, [student]);

  /**
   * Log recording opened
   */
  const trackRecordingOpened = useCallback((
    recordingId: string,
    recordingName: string,
    videoDuration: number
  ) => {
    if (!student?.email) return;

    activityService.logActivity({
      student_email: student.email,
      batch: student.batch,
      action_type: 'recording_opened',
      action_detail: `Session: ${recordingName}`,
      recording_id: recordingId,
      recording_name: recordingName,
      video_duration_seconds: videoDuration,
      watch_duration_seconds: 0,
      watch_percentage: 0,
      completion_status: 'started',
    });
  }, [student]);

  /**
   * Log recording watch progress
   */
  const trackRecordingProgress = useCallback((
    recordingId: string,
    recordingName: string,
    watchDuration: number,
    videoDuration: number
  ) => {
    if (!student?.email) return;

    const percentage = (watchDuration / videoDuration) * 100;
    const status = percentage >= 90 ? 'completed' :
                   percentage >= 10 ? 'partial' : 'started';

    activityService.logActivity({
      student_email: student.email,
      batch: student.batch,
      action_type: status === 'completed' ? 'recording_completed' : 'recording_watched',
      action_detail: `Session: ${recordingName}`,
      recording_id: recordingId,
      recording_name: recordingName,
      video_duration_seconds: videoDuration,
      watch_duration_seconds: Math.floor(watchDuration),
      watch_percentage: parseFloat(percentage.toFixed(2)),
      completion_status: status,
    });
  }, [student]);

  /**
   * Track active session (every 6 hours)
   */
  const trackActiveSession = useCallback(() => {
    if (!student?.email) return;

    const lastActiveLog = localStorage.getItem('last_active_log');
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;

    if (!lastActiveLog || (now - parseInt(lastActiveLog)) > sixHours) {
      activityService.logActivity({
        student_email: student.email,
        batch: student.batch,
        action_type: 'session_active',
        action_detail: 'Active',
      });
      localStorage.setItem('last_active_log', now.toString());
    }
  }, [student]);

  // Track active session on mount and periodically
  useEffect(() => {
    trackActiveSession();

    // Check every 10 minutes if we need to log
    const interval = setInterval(() => {
      trackActiveSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [trackActiveSession]);

  return {
    trackPageView,
    trackFormInteraction,
    trackResourceDownload,
    trackRecordingOpened,
    trackRecordingProgress,
    trackActiveSession,
  };
};
