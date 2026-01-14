/**
 * useAssignmentTracking Hook
 *
 * Custom React hook for comprehensive action tracking in the Assignment Platform.
 * Provides easy-to-use methods for tracking every student action.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { assignmentTrackingService, AssignmentAction, ActionCategory } from '../services/assignmentTrackingService';
import { AssignmentData } from '../services/assignmentApi';

interface TrackOptions {
  assignment?: AssignmentData;
  metadata?: Record<string, any>;
  pageSection?: string;
  loadTimeMs?: number;
}

export function useAssignmentTracking() {
  const { student } = useAuth();
  const pageLoadTime = useRef<number>(Date.now());

  // Track page load on mount
  useEffect(() => {
    const loadTime = Date.now() - pageLoadTime.current;
    if (student?.email) {
      trackPageLoad(loadTime);
    }
  }, [student?.email]);

  /**
   * Base tracking method - all other methods use this
   */
  const track = useCallback(
    (
      actionType: string,
      actionCategory: ActionCategory,
      actionDescription: string,
      options?: TrackOptions
    ) => {
      if (!student?.email) {
        console.warn('⚠️ Cannot track action: User not authenticated');
        return;
      }

      const action: AssignmentAction = {
        student_email: student.email,
        student_name: student?.name || undefined,
        batch: student?.batch || undefined,
        action_type: actionType,
        action_category: actionCategory,
        action_description: actionDescription,
        assignment_id: options?.assignment?.assignmentId,
        assignment_name: options?.assignment?.assignmentHeader,
        assignment_subject: options?.assignment?.subject,
        term: options?.assignment?.term,
        page_section: options?.pageSection,
        metadata: options?.metadata,
        load_time_ms: options?.loadTimeMs,
      };

      assignmentTrackingService.trackAction(action);
    },
    [student]
  );

  // ==========================================
  // CLICK TRACKING
  // ==========================================

  const trackButtonClick = useCallback(
    (buttonName: string, options?: TrackOptions) => {
      track(
        'button_click',
        'click',
        `Clicked "${buttonName}" button`,
        {
          ...options,
          metadata: { button_name: buttonName, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackLinkClick = useCallback(
    (linkName: string, linkUrl: string, options?: TrackOptions) => {
      track(
        'link_click',
        'click',
        `Clicked link "${linkName}"`,
        {
          ...options,
          metadata: { link_name: linkName, link_url: linkUrl, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackAssignmentCardClick = useCallback(
    (assignment: AssignmentData, options?: TrackOptions) => {
      track(
        'assignment_card_click',
        'click',
        `Opened assignment "${assignment.assignmentHeader}"`,
        {
          ...options,
          assignment,
          metadata: { assignment_id: assignment.assignmentId, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // NAVIGATION TRACKING
  // ==========================================

  const trackTabSwitch = useCallback(
    (fromTab: string, toTab: string, options?: TrackOptions) => {
      track(
        `tab_switch_to_${toTab}`,
        'navigation',
        `Switched from "${fromTab}" tab to "${toTab}" tab`,
        {
          ...options,
          metadata: { from_tab: fromTab, to_tab: toTab, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackPageLoad = useCallback(
    (loadTimeMs: number) => {
      track(
        'page_load',
        'navigation',
        `Page loaded`,
        {
          loadTimeMs,
          metadata: { load_time_ms: loadTimeMs },
        }
      );
    },
    [track]
  );

  // ==========================================
  // MODAL TRACKING
  // ==========================================

  const trackModalOpen = useCallback(
    (modalName: string, options?: TrackOptions) => {
      track(
        'modal_open',
        'modal',
        `Opened "${modalName}" modal`,
        {
          ...options,
          metadata: { modal_name: modalName, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackModalClose = useCallback(
    (modalName: string, options?: TrackOptions) => {
      track(
        'modal_close',
        'modal',
        `Closed "${modalName}" modal`,
        {
          ...options,
          metadata: { modal_name: modalName, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // FILE UPLOAD TRACKING
  // ==========================================

  const trackFileUploadStart = useCallback(
    (fileName: string, fileSize: number, options?: TrackOptions) => {
      track(
        'file_upload_start',
        'upload',
        `Started uploading file "${fileName}"`,
        {
          ...options,
          metadata: { file_name: fileName, file_size: fileSize, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackFileUploadSuccess = useCallback(
    (fileName: string, fileSize: number, uploadTimeMs: number, options?: TrackOptions) => {
      track(
        'file_upload_success',
        'upload',
        `Successfully uploaded file "${fileName}"`,
        {
          ...options,
          metadata: {
            file_name: fileName,
            file_size: fileSize,
            upload_time_ms: uploadTimeMs,
            ...options?.metadata,
          },
        }
      );
    },
    [track]
  );

  const trackFileUploadError = useCallback(
    (fileName: string, fileSize: number, errorMessage: string, options?: TrackOptions) => {
      track(
        'file_upload_error',
        'error',
        `File upload failed: ${errorMessage}`,
        {
          ...options,
          metadata: {
            file_name: fileName,
            file_size: fileSize,
            error_message: errorMessage,
            ...options?.metadata,
          },
        }
      );
    },
    [track]
  );

  const trackFileUploadCancelled = useCallback(
    (fileName: string, fileSize: number, options?: TrackOptions) => {
      track(
        'file_upload_cancelled',
        'upload',
        `Cancelled file upload for "${fileName}"`,
        {
          ...options,
          metadata: { file_name: fileName, file_size: fileSize, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // FORM TRACKING
  // ==========================================

  const trackFormFieldChange = useCallback(
    (fieldName: string, fieldValue: any, options?: TrackOptions) => {
      track(
        'form_field_change',
        'form',
        `Changed form field "${fieldName}"`,
        {
          ...options,
          metadata: { field_name: fieldName, field_value: fieldValue, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackSubmissionStart = useCallback(
    (options?: TrackOptions) => {
      track(
        'submission_start',
        'form',
        `Started submitting assignment`,
        options
      );
    },
    [track]
  );

  const trackSubmissionSuccess = useCallback(
    (submissionId: string, options?: TrackOptions) => {
      track(
        'submission_success',
        'form',
        `Successfully submitted assignment`,
        {
          ...options,
          metadata: { submission_id: submissionId, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackSubmissionError = useCallback(
    (errorMessage: string, options?: TrackOptions) => {
      track(
        'submission_error',
        'error',
        `Assignment submission failed: ${errorMessage}`,
        {
          ...options,
          metadata: { error_message: errorMessage, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackValidationError = useCallback(
    (fieldName: string, errorMessage: string, options?: TrackOptions) => {
      track(
        'validation_error',
        'error',
        `Validation error in "${fieldName}": ${errorMessage}`,
        {
          ...options,
          metadata: { field_name: fieldName, error_message: errorMessage, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // PEER RATING TRACKING
  // ==========================================

  const trackPeerRatingChange = useCallback(
    (memberName: string, rating: number, options?: TrackOptions) => {
      track(
        'peer_rating_change',
        'rating',
        `Rated "${memberName}" with ${rating} stars`,
        {
          ...options,
          metadata: { member_name: memberName, rating, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackPeerRemarkChange = useCallback(
    (memberName: string, remarkLength: number, options?: TrackOptions) => {
      track(
        'peer_remark_change',
        'rating',
        `Added remark for "${memberName}"`,
        {
          ...options,
          metadata: { member_name: memberName, remark_length: remarkLength, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackPeerRatingsSubmit = useCallback(
    (ratingsCount: number, options?: TrackOptions) => {
      track(
        'peer_ratings_submit',
        'rating',
        `Submitted peer ratings for ${ratingsCount} members`,
        {
          ...options,
          metadata: { ratings_count: ratingsCount, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // ERROR TRACKING
  // ==========================================

  const trackError = useCallback(
    (errorType: string, errorMessage: string, options?: TrackOptions) => {
      track(
        `error_${errorType}`,
        'error',
        errorMessage,
        {
          ...options,
          metadata: { error_type: errorType, error_message: errorMessage, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackAssignmentExpired = useCallback(
    (options?: TrackOptions) => {
      track(
        'assignment_expired_during_submission',
        'error',
        `Assignment expired while student was submitting`,
        options
      );
    },
    [track]
  );

  // ==========================================
  // FILTER & SEARCH TRACKING
  // ==========================================

  const trackFilterApplied = useCallback(
    (filterType: string, filterValue: string, options?: TrackOptions) => {
      track(
        'filter_applied',
        'filter',
        `Applied ${filterType} filter: ${filterValue}`,
        {
          ...options,
          metadata: { filter_type: filterType, filter_value: filterValue, ...options?.metadata },
        }
      );
    },
    [track]
  );

  const trackSearchQuery = useCallback(
    (searchQuery: string, resultsCount: number, options?: TrackOptions) => {
      track(
        'search_query',
        'search',
        `Searched for "${searchQuery}"`,
        {
          ...options,
          metadata: { search_query: searchQuery, results_count: resultsCount, ...options?.metadata },
        }
      );
    },
    [track]
  );

  // ==========================================
  // RETURN ALL TRACKING METHODS
  // ==========================================

  return {
    // Base method
    track,

    // Click tracking
    trackButtonClick,
    trackLinkClick,
    trackAssignmentCardClick,

    // Navigation tracking
    trackTabSwitch,
    trackPageLoad,

    // Modal tracking
    trackModalOpen,
    trackModalClose,

    // File upload tracking
    trackFileUploadStart,
    trackFileUploadSuccess,
    trackFileUploadError,
    trackFileUploadCancelled,

    // Form tracking
    trackFormFieldChange,
    trackSubmissionStart,
    trackSubmissionSuccess,
    trackSubmissionError,
    trackValidationError,

    // Peer rating tracking
    trackPeerRatingChange,
    trackPeerRemarkChange,
    trackPeerRatingsSubmit,

    // Error tracking
    trackError,
    trackAssignmentExpired,

    // Filter & search tracking
    trackFilterApplied,
    trackSearchQuery,
  };
}
