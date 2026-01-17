import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, GraduationCap, Download, ExternalLink, Users, FileText, Upload, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { AssignmentData, assignmentApiService, PeerRating } from '../../services/assignmentApi';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StarRating } from '../../components/assignment/StarRating';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useAssignmentTracking } from '../../hooks/useAssignmentTracking';

interface AssignmentDetailsModalProps {
  assignment: AssignmentData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (isUpdate: boolean) => void; // Callback after successful submission, passes whether it was an update
  activeTab: 'active' | 'upcoming' | 'expired' | 'completed';
}

interface FileUpload {
  id: string; // Unique ID to track files
  file: File;
  displayName: string; // Custom name like "Deck", "Assignment File"
  progress: number;
  status: 'ready' | 'uploading' | 'complete' | 'error' | 'cancelled';
  uploadedSize?: number;
  error?: string;
  // For large files uploaded to Drive
  uploadUrl?: string; // Resumable upload URL from backend
  fileUrl?: string; // Final Drive URL after upload complete
  fileId?: string; // Drive file ID
  mimeType?: string; // MIME type
  // Upload cancellation
  abortController?: AbortController; // To cancel ongoing uploads
}

interface URLSubmission {
  name: string; // URL display name
  link: string; // Actual URL
}

// Force recompilation to clear cache
export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSubmit,
  activeTab
}) => {
  const user = auth.currentUser;
  const tracking = useAssignmentTracking();
  const modalOpenTime = useRef<number>(Date.now());
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<{ email: string; fullName: string; rollNo: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [urls, setUrls] = useState<URLSubmission[]>(
    Array(5).fill(null).map(() => ({ name: '', link: '' }))
  );
  const [visibleUrlCount, setVisibleUrlCount] = useState(1); // Show 1 URL field by default
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionCount, setSubmissionCount] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [previousSubmission, setPreviousSubmission] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const isSubmittingRef = useRef(false); // Ref-based guard for synchronous check

  // Peer Rating & Remarks state
  const [peerRatings, setPeerRatings] = useState<Record<string, { rating: number; remark: string }>>({});
  const [ratingsLocked, setRatingsLocked] = useState(false);
  const [loadingPeerRatings, setLoadingPeerRatings] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [peerRemarks, setPeerRemarks] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState<string>('');


  // Update time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Track modal open
      modalOpenTime.current = Date.now();
      tracking.trackModalOpen('Assignment Details', {
        assignment,
        pageSection: 'assignment_details',
        metadata: {
          tab: activeTab,
          assignment_id: assignment.assignmentId,
          is_group: assignment.groupAssignment === 'Yes',
          has_peer_ratings: assignment.groupRatingRemarkEnabled === 'Yes',
        }
      });

      // Reset states when modal opens
      if (activeTab === 'completed') {
        setLoadingSubmission(true); // Set loading immediately for completed tab
        fetchFullSubmissionData();
      } else {
        setLoadingSubmission(false);
        checkSubmissionStatus();
      }
      // Fetch students for group assignments
      if (assignment.groupAssignment === 'Yes') {
        fetchStudentsForSubject();
      }
    } else {
      // Reset loading state when modal closes
      setLoadingSubmission(false);
    }
  }, [isOpen, assignment.assignmentId, activeTab]);

  // Convert group member names to emails when both availableStudents and previousSubmission are loaded
  useEffect(() => {
    if (previousSubmission && availableStudents.length > 0 && assignment.groupAssignment === 'Yes') {
      const memberNames = previousSubmission.groupMembers || [];
      if (memberNames.length > 0) {
        const memberEmails = memberNames
          .map((memberName: string) => {
            const student = availableStudents.find(s => s.fullName === memberName);
            return student ? student.email : null;
          })
          .filter((email: string | null): email is string => email !== null);
        setGroupMembers(memberEmails);
      }
    }
  }, [previousSubmission, availableStudents, assignment.groupAssignment]);

  // Fetch peer ratings when submission ID is available
  useEffect(() => {
    if (submissionId && assignment.groupAssignment === 'Yes' && assignment.groupRatingRemarkEnabled === 'Yes') {
      fetchPeerRatings();
      fetchAverageRatings();
    }
  }, [submissionId, assignment.groupAssignment, assignment.groupRatingRemarkEnabled]);

  const fetchPeerRatings = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email || !submissionId) return;

      setLoadingPeerRatings(true);
      const result = await assignmentApiService.getPeerRatings(user.email, submissionId);

      if (result.success && result.data) {
        setRatingsLocked(result.data.hasSubmitted);

        // Convert ratings array to object keyed by member name
        if (result.data.ratings && result.data.ratings.length > 0) {
          const ratingsObj: Record<string, { rating: number; remark: string }> = {};
          result.data.ratings.forEach((r: PeerRating) => {
            ratingsObj[r.memberName] = { rating: r.rating, remark: r.remark };
          });
          setPeerRatings(ratingsObj);
        }
      }
    } catch (error) {
      console.error('Error fetching peer ratings:', error);
    } finally {
      setLoadingPeerRatings(false);
    }
  };

  const fetchAverageRatings = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email || !assignment.assignmentId) return;

      const result = await assignmentApiService.getAverageRatings(user.email, assignment.assignmentId);

      if (result.success && result.data) {
        setAverageRating(result.data.averageRating);
        setPeerRemarks(result.data.remarks);
      }
    } catch (error) {
      console.error('Error fetching average ratings:', error);
    }
  };

  // Handle modal close with tracking
  const handleClose = () => {
    const timeSpent = Date.now() - modalOpenTime.current;
    tracking.trackModalClose('Assignment Details', {
      assignment,
      pageSection: 'assignment_details',
      metadata: {
        time_spent_ms: timeSpent,
        tab: activeTab,
        did_submit: hasSubmitted,
        file_count: files.filter(f => f.status !== 'cancelled').length,
      }
    });
    // Reset update mode when closing
    setIsUpdating(false);
    onClose();
  };

  const handlePeerRatingsSubmit = async (currentSubmissionId?: string) => {
    try {
      const user = auth.currentUser;
      if (!user?.email || !user?.displayName) {
        toast.error('User not authenticated');
        return;
      }

      const targetSubmissionId = currentSubmissionId || submissionId;
      if (!targetSubmissionId) {
        toast.error('Submission ID not found');
        return;
      }

      // Get all group members that should be rated - EXCLUDING CURRENT USER
      const groupMembersToRate = availableStudents.filter(s => {
        const isInGroup = previousSubmission?.groupMembers?.includes(s.fullName) ||
                         previousSubmission?.groupMembers?.includes(s.email);
        const isCurrentUserByEmail = s.email === user?.email;
        const isCurrentUserByName = s.fullName === user?.displayName;

        return isInGroup && !isCurrentUserByEmail && !isCurrentUserByName;
      });

      // Peer ratings are MANDATORY - ALL members must be rated
      const unratedMembers: string[] = [];
      const incompleteMembers: string[] = [];

      groupMembersToRate.forEach(member => {
        const memberRating = peerRatings[member.fullName];

        if (!memberRating || memberRating.rating === 0) {
          unratedMembers.push(member.fullName);
        } else if (memberRating.rating > 0 && !memberRating.remark.trim()) {
          incompleteMembers.push(member.fullName);
        }
      });

      if (unratedMembers.length > 0) {
        toast.error(
          `Peer ratings are mandatory. Please rate all group members. Missing ratings for: ${unratedMembers.join(', ')}`,
          { duration: 5000 }
        );
        return;
      }

      if (incompleteMembers.length > 0) {
        toast.error(
          `Please provide remarks for all rated members: ${incompleteMembers.join(', ')}`,
          { duration: 5000 }
        );
        return;
      }

      // Prepare ratings data
      const ratingsToSubmit = Object.entries(peerRatings)
        .filter(([_, data]) => data.rating > 0 && data.remark.trim() !== '')
        .map(([memberName, data]) => ({
          memberName,
          rating: data.rating,
          remark: data.remark
        }));

      if (ratingsToSubmit.length === 0) {
        toast.error('Please provide at least one rating with remarks');
        return;
      }

      const loadingToast = toast.loading('Submitting peer ratings...');

      const result = await assignmentApiService.submitPeerRatings(
        user.email,
        {
          submissionId: targetSubmissionId,
          studentName: user.displayName,
          ratings: ratingsToSubmit
        }
      );

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success('Peer ratings submitted successfully!');
        setRatingsLocked(true);
        fetchAverageRatings(); // Refresh average ratings

        // Track peer ratings submission success
        tracking.trackPeerRatingsSubmit(ratingsToSubmit.length, {
          assignment,
          pageSection: 'peer_ratings',
          metadata: {
            submission_id: targetSubmissionId,
            ratings_count: ratingsToSubmit.length,
          }
        });
      } else {
        toast.error(`Failed to submit peer ratings: ${result.error}`);

        // Track error
        tracking.trackError('peer_ratings_submission', result.error || 'Failed to submit peer ratings', {
          assignment,
          pageSection: 'peer_ratings',
          metadata: {
            submission_id: targetSubmissionId,
            ratings_count: ratingsToSubmit.length,
          }
        });
      }
    } catch (error) {
      console.error('Error submitting peer ratings:', error);
      toast.error('Failed to submit peer ratings');

      // Track error
      tracking.trackError('peer_ratings_submission', error instanceof Error ? error.message : 'Unknown error', {
        assignment,
        pageSection: 'peer_ratings',
      });
    }
  };

  const fetchStudentsForSubject = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email || !assignment.batch || !assignment.subject) return;

      setLoadingStudents(true);
      // Use getGroupMembersBySubjectGroup for pre-filling based on SubjectGroup
      const result = await assignmentApiService.getGroupMembersBySubjectGroup(
        user.email,
        assignment.batch,
        assignment.subject
      );

      if (result.success && result.data) {
        setAvailableStudents(result.data);
        // Pre-select group members (exclude self)
        const preSelectedEmails = result.data
          .filter(student => student.email !== user.email)
          .map(student => student.email);
        setGroupMembers(preSelectedEmails);
        // Set group name if available
        if (result.groupName) {
          setGroupName(result.groupName);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchFullSubmissionData = async () => {
    try {
      setLoadingSubmission(true);
      const user = auth.currentUser;
      if (!user?.email || !assignment.assignmentId) {
        setLoadingSubmission(false);
        return;
      }

      const result = await assignmentApiService.getStudentSubmissions(
        user.email,
        assignment.assignmentId
      );

      if (result.success && result.data) {
        const submissions = result.data.submissions || [];
        setSubmissionCount(result.data.count || 0);

        if (submissions.length > 0) {
          const lastSubmission = submissions[submissions.length - 1];
          setHasSubmitted(true);
          setPreviousSubmission(lastSubmission);

          // Extract and store submission ID
          if (lastSubmission.submissionId) {
            setSubmissionId(lastSubmission.submissionId);
          }

          // Pre-populate form with submission data for viewing/updating
          if (lastSubmission.answers) {
            setAnswers(lastSubmission.answers);
          }
          if (lastSubmission.groupName) {
            setGroupName(lastSubmission.groupName);
          }
          // Don't pre-populate group members here yet - will be done in a separate useEffect
          // when availableStudents is loaded
          if (lastSubmission.urls && lastSubmission.urls.length > 0) {
            const urlsArray = Array(5).fill(null).map(() => ({ name: '', link: '' }));
            lastSubmission.urls.forEach((url: any, index: number) => {
              if (index < 5) {
                urlsArray[index] = {
                  name: url.name || '',
                  link: url.link || url.url || ''
                };
              }
            });
            setUrls(urlsArray);
            setVisibleUrlCount(Math.max(1, lastSubmission.urls.length));
          }
        } else {
          setHasSubmitted(false);
        }
      }
    } catch (error) {
      console.error('Error fetching submission data:', error);
      toast.error('Failed to load submission data');
    } finally {
      // Keep loading banner visible for at least 1.5 seconds to ensure visibility
      setTimeout(() => {
        setLoadingSubmission(false);
      }, 1500);
    }
  };

  const checkSubmissionStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email || !assignment.assignmentId) return;

      const result = await assignmentApiService.checkSubmissionStatus(
        user.email,
        assignment.assignmentId
      );

      if (result.success && result.data) {
        setHasSubmitted(result.data.hasSubmitted);
        setSubmissionCount(result.data.submissionCount);
        if (result.data.hasSubmitted && result.data.lastSubmission) {
          setPreviousSubmission(result.data.lastSubmission);

          // Extract and store submission ID for peer ratings
          if (result.data.lastSubmission.submissionId) {
            setSubmissionId(result.data.lastSubmission.submissionId);
          }
        }
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    // Track file selection
    selectedFiles.forEach(file => {
      tracking.trackFileUploadStart(file.name, file.size, {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          file_type: file.type,
          is_large: file.size >= 20 * 1024 * 1024,
        }
      });
    });

    // Validate file types if FileTypes is specified
    if (assignment.fileTypes) {
      const allowedTypes = assignment.fileTypes.toLowerCase().split(',').map(t => t.trim());
      const invalidFiles = selectedFiles.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext && !allowedTypes.includes(ext);
      });

      if (invalidFiles.length > 0) {
        // Track validation error
        invalidFiles.forEach(file => {
          tracking.trackValidationError(
            'File Type',
            `Invalid file type: ${file.name}`,
            {
              assignment,
              pageSection: 'submission_form',
              metadata: {
                file_name: file.name,
                file_type: file.type,
                allowed_types: allowedTypes.join(', '),
              }
            }
          );
        });

        alert(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}\n\nAllowed types: ${allowedTypes.join(', ')}`);
        return;
      }
    }

    const newUploads: FileUpload[] = selectedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`, // Generate unique ID
      file,
      displayName: '', // Will be filled by user in UI
      progress: 0,
      status: file.size >= 20 * 1024 * 1024 ? 'uploading' : 'ready'
    }));

    setFiles(prev => [...prev, ...newUploads]);

    // Start uploading large files immediately
    newUploads.forEach((upload) => {
      if (upload.file.size >= 20 * 1024 * 1024) {
        uploadLargeFile(upload);
      }
    });
  };

  const uploadLargeFile = async (upload: FileUpload) => {
    const user = auth.currentUser;
    if (!user?.email || !user?.displayName) {
      updateFileStatusById(upload.id, 'error', 'User not authenticated');
      return;
    }

    // Create AbortController for this upload
    const abortController = new AbortController();

    // Store abort controller in file state
    setFiles(prev => prev.map(f =>
      f.id === upload.id ? { ...f, abortController } : f
    ));

    let uploadedBytes = 0; // Declare outside try block so catch can access it
    let sessionUploadUrl = ''; // Store upload URL in local variable to avoid React state closure issues

    try {
      // Check if upload was cancelled
      if (abortController.signal.aborted) {
//         console.log(`⚠️ Upload cancelled before start: ${upload.file.name}`);
        return;
      }
      // Step 1: Initiate resumable upload session
//       console.log(`🚀 Initiating resumable upload for ${upload.file.name}...`);
      updateFileStatusById(upload.id, 'uploading');

      const initResult = await assignmentApiService.initiateResumableUpload(
        user.email,
        {
          assignmentId: assignment.assignmentId || '',
          fileName: upload.displayName || upload.file.name,
          fileSize: upload.file.size,
          mimeType: upload.file.type,
          studentName: user.displayName
        }
      );

      if (!initResult.success || !initResult.data?.uploadUrl) {
        throw new Error(initResult.error || 'Failed to initiate upload');
      }

      const uploadUrl = initResult.data.uploadUrl;
      sessionUploadUrl = uploadUrl; // Store in local variable for use in catch block
//       console.log(`📍 Upload URL received, starting chunked upload...`);

      // Store upload URL in file state
      setFiles(prev => prev.map(f =>
        f.id === upload.id ? { ...f, uploadUrl } : f
      ));

      // Step 2: Upload file in chunks
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(upload.file.size / chunkSize);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Check if upload was cancelled
        if (abortController.signal.aborted) {
//           console.log(`⚠️ Upload cancelled during chunk ${chunkIndex + 1}: ${upload.file.name}`);
          updateFileStatusById(upload.id, 'cancelled', 'Upload cancelled by user');

          // Track upload cancellation
          tracking.trackFileUploadCancelled(upload.file.name, upload.file.size, {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              uploaded_bytes: uploadedBytes,
              upload_progress: Math.round((uploadedBytes / upload.file.size) * 100),
              chunk_index: chunkIndex,
            }
          });
          return;
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, upload.file.size);
        const chunk = upload.file.slice(start, end);

        const maxRetries = 5;
        let retryCount = 0;
        let chunkUploaded = false;

        while (!chunkUploaded && retryCount < maxRetries) {
          // Check if upload was cancelled before retry
          if (abortController.signal.aborted) {
//             console.log(`⚠️ Upload cancelled: ${upload.file.name}`);
            updateFileStatusById(upload.id, 'cancelled', 'Upload cancelled by user');
            return;
          }

          try {
            await uploadChunkToDrive(chunk, uploadUrl, start, end - 1, upload.file.size);
            chunkUploaded = true;
            uploadedBytes = end;

            const progress = Math.round((uploadedBytes / upload.file.size) * 100);
            updateFileProgressById(upload.id, progress);
            updateFileStatusById(upload.id, 'uploading', undefined, uploadedBytes);

//             console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded (${Math.round(uploadedBytes / 1024 / 1024)}MB / ${Math.round(upload.file.size / 1024 / 1024)}MB)`);
          } catch (error: any) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.warn(`⚠️ Chunk ${chunkIndex + 1} failed, retrying (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            } else {
              throw new Error(`Chunk ${chunkIndex + 1} failed after ${maxRetries} retries: ${error.message}`);
            }
          }
        }
      }

      // Step 3: Finalize upload
//       console.log(`✅ All chunks uploaded, finalizing...`);

      let finalizeResult: { success: boolean; data?: any; error?: string } | undefined;
      let finalizeRetryCount = 0;
      const maxFinalizeRetries = 3;

      while (finalizeRetryCount < maxFinalizeRetries) {
        try {
          finalizeResult = await assignmentApiService.finalizeResumableUpload(
            user.email,
            {
              uploadUrl,
              fileSize: upload.file.size
            }
          );

          if (finalizeResult.success && finalizeResult.data) {
            break; // Success!
          }

          finalizeRetryCount++;
          if (finalizeRetryCount < maxFinalizeRetries) {
//             console.log(`⚠️ Finalization attempt ${finalizeRetryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * finalizeRetryCount));
          }
        } catch (finalizeError: any) {
          finalizeRetryCount++;
          if (finalizeRetryCount >= maxFinalizeRetries) {
            // Last attempt failed - but file might still be in Drive
            console.warn('⚠️ Finalization failed, but file may be in Drive. Checking...');
            finalizeResult = { success: false, error: finalizeError.message };
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000 * finalizeRetryCount));
          }
        }
      }

      // If finalization failed but all chunks were uploaded, try to recover file from Drive
      if (!finalizeResult?.success || !finalizeResult?.data) {
        console.warn(`⚠️ Finalization failed. Attempting to recover file from Drive...`);

        try {
          // Try to recover the file URL from Drive
          const recoveryResult = await assignmentApiService.recoverUploadedFile(
            user.email,
            {
              assignmentId: assignment.assignmentId || '',
              studentName: user.displayName,
              fileName: upload.displayName || upload.file.name
            }
          );

          if (recoveryResult.success && recoveryResult.data) {
            // Successfully recovered!
//             console.log(`✅ File recovered from Drive: ${recoveryResult.data.fileName}`);

            setFiles(prev => prev.map(f =>
              f.id === upload.id ? {
                ...f,
                fileUrl: recoveryResult.data.fileUrl,
                fileId: recoveryResult.data.fileId,
                mimeType: recoveryResult.data.mimeType
              } : f
            ));

            updateFileStatusById(upload.id, 'complete', undefined, upload.file.size);
            return;
          }
        } catch (recoveryError: any) {
          console.warn('Recovery attempt failed:', recoveryError.message);
        }

        // If recovery failed, mark with temporary reference
        console.warn(`⚠️ Could not recover file. Marking as complete with warning.`);

        const tempFileData = {
          fileUrl: `Upload complete (${Math.round(upload.file.size / 1024 / 1024)}MB) - URL pending verification`,
          fileId: 'pending_' + upload.id,
          mimeType: upload.file.type,
          fileName: upload.displayName || upload.file.name
        };

        setFiles(prev => prev.map(f =>
          f.id === upload.id ? {
            ...f,
            fileUrl: tempFileData.fileUrl,
            fileId: tempFileData.fileId,
            mimeType: tempFileData.mimeType
          } : f
        ));

        updateFileStatusById(upload.id, 'complete', undefined, uploadedBytes);
//         console.log(`⚠️ Upload marked complete (verification pending): ${upload.file.name}`);
        return;
      }

      // Store file URL and ID - only reached if finalization was successful
      // At this point, we know finalizeResult exists and has data (from line 273 check)
      // Using non-null assertion because TypeScript doesn't track the control flow
      const fileUrl = finalizeResult!.data!.fileUrl;
      const fileId = finalizeResult!.data!.fileId;
      const fileMimeType = finalizeResult!.data!.mimeType;
      const fileName = finalizeResult!.data!.fileName;

      setFiles(prev => prev.map(f =>
        f.id === upload.id ? {
          ...f,
          fileUrl: fileUrl,
          fileId: fileId,
          mimeType: fileMimeType
        } : f
      ));

      updateFileStatusById(upload.id, 'complete', undefined, upload.file.size);
//       console.log(`🎉 Upload complete: ${fileName}`);

      // Track successful upload
      const uploadTime = Date.now() - modalOpenTime.current;
      tracking.trackFileUploadSuccess(fileName, upload.file.size, uploadTime, {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          file_type: fileMimeType,
          file_id: fileId,
          is_large: true,
        }
      });

    } catch (error: any) {
      console.error(`❌ Upload failed for ${upload.file.name}:`, error);

      // Check if error is due to network issues after most chunks uploaded
      if (uploadedBytes > upload.file.size * 0.9) {
        console.warn(`⚠️ Network error but 90%+ uploaded (${Math.round(uploadedBytes / 1024 / 1024)}MB / ${Math.round(upload.file.size / 1024 / 1024)}MB). Attempting double-fallback recovery...`);

        // RECOVERY STRATEGY 1: Query upload session URL for completion status
        // Google Drive completes upload before sending response, so URL can be queried
        // Using sessionUploadUrl (local variable) instead of files state to avoid closure issues

        if (sessionUploadUrl) {
//           console.log(`🔍 Try 1: Querying upload session URL for file status...`);
          try {
            const finalizeResult = await assignmentApiService.finalizeResumableUpload(
              user.email,
              {
                uploadUrl: sessionUploadUrl,
                fileSize: upload.file.size
              }
            );

            if (finalizeResult.success && finalizeResult.data) {
//               console.log(`✅ SUCCESS: File ID recovered from upload session URL: ${finalizeResult.data.fileId}`);

              const fileId = finalizeResult.data.fileId;
              const fileName = finalizeResult.data.fileName || upload.displayName || upload.file.name;
              const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
              const mimeType = finalizeResult.data.mimeType || upload.file.type;

              setFiles(prev => prev.map(f =>
                f.id === upload.id ? {
                  ...f,
                  fileUrl,
                  fileId,
                  mimeType
                } : f
              ));

              updateFileStatusById(upload.id, 'complete', undefined, upload.file.size);
              return;
            }
          } catch (finalizeError: any) {
            console.warn(`⚠️ Upload session URL query failed: ${finalizeError.message}. Trying fallback...`);
          }
        } else {
          console.warn(`⚠️ No upload session URL found in state. Skipping to fallback...`);
        }

        // RECOVERY STRATEGY 2: Search Drive folder for the file
//         console.log(`🔍 Try 2: Searching Drive folder for uploaded file...`);
        try {
          const recoveryResult = await assignmentApiService.recoverUploadedFile(
            user.email,
            {
              assignmentId: assignment.assignmentId || '',
              studentName: user.displayName,
              fileName: upload.displayName || upload.file.name
            }
          );

          if (recoveryResult.success && recoveryResult.data) {
//             console.log(`✅ SUCCESS: File recovered from Drive folder search: ${recoveryResult.data.fileName}`);

            setFiles(prev => prev.map(f =>
              f.id === upload.id ? {
                ...f,
                fileUrl: recoveryResult.data.fileUrl,
                fileId: recoveryResult.data.fileId,
                mimeType: recoveryResult.data.mimeType
              } : f
            ));

            updateFileStatusById(upload.id, 'complete', undefined, upload.file.size);
            return;
          }
        } catch (recoveryError: any) {
          console.warn(`⚠️ Drive folder search failed: ${recoveryError.message}`);
        }

        // Both recovery strategies failed
        console.error(`❌ BOTH recovery strategies failed. File uploaded but URL could not be recovered.`);
        updateFileStatusById(upload.id, 'complete', undefined, uploadedBytes);
      } else {
        updateFileStatusById(upload.id, 'error', error.message || 'Upload failed');

        // Track upload error
        tracking.trackFileUploadError(upload.file.name, upload.file.size, error.message || 'Upload failed', {
          assignment,
          pageSection: 'submission_form',
          metadata: {
            uploaded_bytes: uploadedBytes,
            upload_progress: Math.round((uploadedBytes / upload.file.size) * 100),
            error_type: 'UPLOAD_FAILED',
          }
        });
      }
    }
  };

  /**
   * Upload a single chunk to Google Drive using resumable upload URL
   */
  const uploadChunkToDrive = async (
    chunk: Blob,
    uploadUrl: string,
    startByte: number,
    endByte: number,
    totalSize: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', chunk.type || 'application/octet-stream');
      xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte}/${totalSize}`);

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201 || xhr.status === 308) {
          // 200/201 = upload complete, 308 = resume incomplete (more chunks expected)
          resolve();
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during chunk upload'));
      xhr.ontimeout = () => reject(new Error('Chunk upload timeout'));

      xhr.timeout = 60000; // 60 second timeout per chunk
      xhr.send(chunk);
    });
  };

  const updateFileProgressById = (id: string, progress: number) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, progress } : f
    ));
  };

  const updateFileStatusById = (id: string, status: FileUpload['status'], error?: string, uploadedSize?: number) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status, error, uploadedSize, progress: status === 'complete' ? 100 : f.progress } : f
    ));
  };

  const removeFile = (id: string) => {
    // Find the file and abort its upload if in progress
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.abortController) {
//       console.log(`🛑 Aborting upload for: ${fileToRemove.file.name}`);
      fileToRemove.abortController.abort();
    }

    // Remove from state
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Handler for confirmation modal close
  const handleConfirmationClose = useCallback(() => {
    setShowConfirmationModal(false);
    setConfirmationDetails(null);
    handleClose(); // Close the main assignment modal
  }, []);

  const handleSubmit = async (isUpdate = false) => {
    // Prevent double submission with both ref and state check
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }

    try {
      // Set both ref and state immediately
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      // Track submission start
      tracking.trackSubmissionStart({
        assignment,
        pageSection: 'submission_form',
        metadata: {
          is_update: isUpdate,
          file_count: files.filter(f => f.status !== 'cancelled').length,
          is_group: assignment.groupAssignment === 'Yes',
        }
      });

      // Check if user is authenticated
      if (!user?.email || !user?.displayName) {
        toast.error('User not authenticated');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Check if deadline has passed before allowing submission
      const isPastDeadline = assignment.endDateTime ? new Date(assignment.endDateTime).getTime() < new Date().getTime() : false;
      if (isPastDeadline && !isUpdate) {
        toast.error('Assignment deadline has passed. Submission is no longer allowed.');
        // Cancel any ongoing uploads
        setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: 'Deadline passed' })));

        // Track assignment expired during submission
        tracking.trackAssignmentExpired({
          assignment,
          pageSection: 'submission_form',
          metadata: {
            attempted_at: new Date().toISOString(),
            deadline: assignment.endDateTime,
            minutes_late: Math.floor((new Date().getTime() - new Date(assignment.endDateTime).getTime()) / 60000),
          }
        });
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // For updates, check if deadline has passed (updates not allowed after deadline)
      if (isUpdate && isPastDeadline) {
        toast.error('Cannot update submission after deadline has passed.');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Validate required questions (check for empty or whitespace-only answers)
      const missingRequired: string[] = [];
      for (let qNum = 1; qNum <= 20; qNum++) {
        const question = assignment[`q${qNum}` as keyof AssignmentData];
        const isMandatory = assignment[`q${qNum}Mandatory` as keyof AssignmentData] === 'Yes';

        if (question && isMandatory) {
          const answer = answers[`q${qNum}`];
          if (!answer || answer.trim() === '') {
            missingRequired.push(`Q${qNum}`);
          }
        }
      }

      if (missingRequired.length > 0) {
        toast.error(`Please answer the following required questions: ${missingRequired.join(', ')}`);

        // Track validation error
        tracking.trackValidationError(
          'Required Questions',
          `Missing required questions: ${missingRequired.join(', ')}`,
          {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              missing_questions: missingRequired,
              missing_count: missingRequired.length,
            }
          }
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Validate group name if it's a group assignment
      if (assignment.groupAssignment === 'Yes' && (!groupName || groupName.trim() === '')) {
        toast.error('Please enter a group name.');

        // Track validation error
        tracking.trackValidationError(
          'Group Name',
          'Group name is required',
          {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              is_group: true,
            }
          }
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Validate peer ratings only for updates (initial submission is optional)
      // Skip validation if ratings are already locked (already submitted)
      if (assignment.groupAssignment === 'Yes' && assignment.groupRatingRemarkEnabled === 'Yes' && !ratingsLocked && isUpdate) {
        // Get all group members that should be rated
        let groupMembersToRate: { email: string; fullName: string; rollNo: string }[] = [];

        if (previousSubmission) {
          // For updates, use previousSubmission group members (exclude self)
          groupMembersToRate = availableStudents.filter(s => {
            const inGroupMembers = previousSubmission?.groupMembers?.includes(s.fullName) || previousSubmission?.groupMembers?.includes(s.email);
            const emailMatch = s.email === user?.email;
            const nameMatch = s.fullName === user?.displayName;

            return inGroupMembers && !emailMatch && !nameMatch;
          });
        }

        // Peer ratings are MANDATORY for updates - ALL members must be rated
        const unratedMembers: string[] = [];
        const incompleteMembers: string[] = [];

        groupMembersToRate.forEach(member => {
          const memberRating = peerRatings[member.fullName];

          if (!memberRating || memberRating.rating === 0) {
            unratedMembers.push(member.fullName);
          } else if (memberRating.rating > 0 && (!memberRating.remark || memberRating.remark.trim() === '')) {
            incompleteMembers.push(member.fullName);
          }
        });

        if (unratedMembers.length > 0) {
          toast.error(
            `Peer ratings are mandatory. Please rate all group members. Missing ratings for: ${unratedMembers.join(', ')}`,
            { duration: 5000 }
          );

          // Track validation error
          tracking.trackValidationError(
            'Peer Ratings',
            `Missing peer ratings for: ${unratedMembers.join(', ')}`,
            {
              assignment,
              pageSection: 'peer_ratings',
              metadata: {
                unrated_members: unratedMembers,
                unrated_count: unratedMembers.length,
              }
            }
          );
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (incompleteMembers.length > 0) {
          toast.error(
            `Please provide remarks for all rated members: ${incompleteMembers.join(', ')}`,
            { duration: 5000 }
          );

          // Track validation error
          tracking.trackValidationError(
            'Peer Remarks',
            `Missing remarks for: ${incompleteMembers.join(', ')}`,
            {
              assignment,
              pageSection: 'peer_ratings',
              metadata: {
                incomplete_members: incompleteMembers,
                incomplete_count: incompleteMembers.length,
              }
            }
          );
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // For initial submissions: Validate IF any peer rating was started (partial validation)
      if (assignment.groupAssignment === 'Yes' && assignment.groupRatingRemarkEnabled === 'Yes' && !ratingsLocked && !isUpdate) {
        // Only validate if user has started rating
        const hasAnyRating = Object.values(peerRatings).some(data => data.rating > 0);

        if (hasAnyRating) {
          // If ANY rating started, validate remarks are provided for those ratings
          const incompleteMembers: string[] = [];

          Object.entries(peerRatings).forEach(([memberName, data]) => {
            if (data.rating > 0 && (!data.remark || data.remark.trim() === '')) {
              incompleteMembers.push(memberName);
            }
          });

          if (incompleteMembers.length > 0) {
            toast.error(
              `Please provide remarks for: ${incompleteMembers.join(', ')}`,
              { duration: 5000 }
            );
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Validate file upload if mandatory (exclude cancelled files)
      const activeFiles = files.filter(f => f.status !== 'cancelled');
      if (assignment.attachmentMandatory === 'Yes' && activeFiles.length === 0) {
        toast.error('Please upload at least one file.');

        // Track validation error
        tracking.trackValidationError(
          'File Upload',
          'File attachment is mandatory',
          {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              attachment_mandatory: true,
              file_count: 0,
            }
          }
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Validate that all active files have display names
      const filesWithoutNames = activeFiles.filter(f => !f.displayName || f.displayName.trim() === '');
      if (filesWithoutNames.length > 0) {
        toast.error('Please provide a description for all uploaded files.');

        // Track validation error
        tracking.trackValidationError(
          'File Description',
          'File descriptions are required',
          {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              files_without_names: filesWithoutNames.length,
              total_files: activeFiles.length,
            }
          }
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(isUpdate ? 'Updating submission...' : 'Submitting assignment...');

      // Check that all large files have completed uploading (exclude cancelled)
      const pendingLargeFiles = files.filter(f =>
        f.file.size >= 20 * 1024 * 1024 &&
        f.status !== 'complete' &&
        f.status !== 'cancelled'
      );
      if (pendingLargeFiles.length > 0) {
        toast.error(`Please wait for all large files to finish uploading. ${pendingLargeFiles.length} file(s) still uploading.`);
        toast.dismiss(loadingToast);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Upload small files first (files less than 20MB that haven't been uploaded yet)
      for (const upload of files) {
        if (upload.status === 'ready') {
          toast.loading(`Uploading ${upload.file.name}...`, { id: loadingToast });
          await uploadSmallFile(upload);
        }
      }

      // Separate small files and large files (exclude cancelled files)
      // Small files (<20MB): Send as base64
      // Large files (≥20MB): Send Drive URLs (already uploaded)
      const smallFiles = files.filter(f => f.file.size < 20 * 1024 * 1024 && f.status !== 'cancelled');
      const largeFiles = files.filter(f => f.file.size >= 20 * 1024 * 1024 && f.status !== 'cancelled');

//       console.log(`📊 Submission: ${smallFiles.length} small files, ${largeFiles.length} large files`);

      // Convert small files to base64
      const smallFileData = await Promise.all(
        smallFiles.map(async (upload) => {
          const base64 = await fileToBase64(upload.file);
          return {
            name: upload.file.name,
            displayName: upload.displayName || upload.file.name,
            data: base64,
            mimeType: upload.file.type
          };
        })
      );

      // Extract Drive URLs from large files (already uploaded)
      const largeFileUrls = largeFiles.map(upload => ({
        name: upload.displayName || upload.file.name,
        fileName: upload.displayName || upload.file.name,
        url: upload.fileUrl || '',
        fileUrl: upload.fileUrl || '',
        fileId: upload.fileId || '',
        id: upload.fileId || '',
        mimeType: upload.mimeType || upload.file.type
      }));

      // Filter URLs to only include those with both name and link
      const validUrls = urls.filter(url => url.name.trim() !== '' && url.link.trim() !== '');

      // For group assignments, include current user in group members list
      const finalGroupMembers = assignment.groupAssignment === 'Yes'
        ? [...groupMembers, user.email] // Add current user to the list
        : undefined;

      // IMMEDIATELY show confirmation and close modal - don't wait for API
      // This provides instant feedback to the user
      toast.dismiss(loadingToast);

      // Notify parent component to show confirmation modal immediately
      if (onSubmit) {
        onSubmit(isUpdate);
      }

      // Close the modal immediately
      handleClose();

      // Reset state
      setIsUpdating(false);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      // Submit to backend in background (fire and forget)
      // The user already sees the confirmation - we trust the submission will succeed
      assignmentApiService.submitAssignment(
        user.email,
        {
          assignmentId: assignment.assignmentId || '',
          studentName: user.displayName,
          answers,
          files: smallFileData, // Small files as base64
          uploadedFileUrls: largeFileUrls, // Large files as Drive URLs
          urls: validUrls,
          groupName: assignment.groupAssignment === 'Yes' ? groupName : undefined,
          groupMembers: finalGroupMembers,
          isUpdate: isUpdate // Mark if this is an update
        }
      ).then(result => {
        if (result && result.success) {
          console.log('✅ Background submission successful');
          // Track submission success
          tracking.trackSubmissionSuccess(result.data?.submissionId || 'unknown', {
            assignment,
            pageSection: 'submission_form',
            metadata: {
              is_update: isUpdate,
              file_count: activeFiles.length,
              url_count: validUrls.length,
              is_group: assignment.groupAssignment === 'Yes',
            }
          });
        } else if (result && result.networkError) {
          // Network error but likely succeeded - don't show error toast
          console.log('⚠️ Network error but submission likely succeeded');
        } else {
          // Actual error - show toast
          console.error('❌ Background submission failed:', result?.error);
          toast.error(isUpdate ? 'Update may have failed. Please check your submission.' : 'Submission may have failed. Please check your submission.');
        }
      }).catch(submitError => {
        console.error('❌ Background submission error:', submitError);
        // Don't show error toast for network errors as the submission likely succeeded
      });

    } catch (error) {
      console.error('Error preparing assignment submission:', error);
      toast.error('Failed to prepare submission. Please try again.');

      // Track submission error
      tracking.trackSubmissionError(error instanceof Error ? error.message : 'Unknown error', {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          error_type: 'PREPARATION_ERROR',
        }
      });

      // Reset state on error
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadSmallFile = async (upload: FileUpload) => {
    const stages = [
      { progress: 30, status: 'Reading...' },
      { progress: 80, status: 'Converting...' },
      { progress: 90, status: 'Processing...' },
      { progress: 95, status: 'Uploading...' },
      { progress: 100, status: 'Complete' }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 300));
      updateFileProgressById(upload.id, stage.progress);
    }

    updateFileStatusById(upload.id, 'complete', undefined, upload.file.size);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      let date: Date;

      // Check if it's ISO format (e.g., "2025-12-06T11:36:06.000Z")
      if (dateStr.includes('T') && dateStr.includes('Z')) {
        date = new Date(dateStr);
      } else {
        // Handle DD-MMM-YYYY HH:mm:ss format (e.g., "06-Dec-2025 17:06:06")
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');

        // Convert month abbreviation to number
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        date = new Date(parseInt(year), monthMap[month], parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
      }

      // Extract components for formatting
      const dayNum = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const hours24 = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      // Convert to 12-hour format
      const hour12 = hours24 % 12 || 12;
      const ampm = hours24 >= 12 ? 'PM' : 'AM';

      // Add ordinal suffix to day
      const ordinal = (num: number): string => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = num % 100;
        return num + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      return `${ordinal(dayNum)} ${month} ${hour12}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return dateStr;
    }
  };

  const getTimeRemaining = (endDateTime: string) => {
    if (!endDateTime) return null;
    const endDate = new Date(endDateTime);
    const diff = endDate.getTime() - currentTime.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const getTimeRemainingColor = (endDateTime: string) => {
    if (!endDateTime) return { bg: '', border: '', text: '' };
    const endDate = new Date(endDateTime);
    const diff = endDate.getTime() - currentTime.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);

    if (hoursRemaining <= 6) {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-600 dark:text-red-400'
      };
    } else if (hoursRemaining <= 24) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-600 dark:text-yellow-400'
      };
    } else {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-600 dark:text-orange-400'
      };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileStatusDisplay = (upload: FileUpload) => {
    if (upload.status === 'error') {
      return <span className="text-red-600">Error: {upload.error}</span>;
    }
    if (upload.status === 'complete') {
      return (
        <span className="text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Complete (100%)
        </span>
      );
    }
    if (upload.status === 'uploading') {
      const isLarge = upload.file.size >= 20 * 1024 * 1024;
      if (isLarge) {
        const uploadedMB = ((upload.progress / 100) * upload.file.size) / (1024 * 1024);
        const totalMB = upload.file.size / (1024 * 1024);
        return (
          <span className="text-blue-600">
            {upload.progress}% ({uploadedMB.toFixed(1)} MB / {totalMB.toFixed(1)} MB)
          </span>
        );
      }
      return <span className="text-blue-600">Uploading... {upload.progress}%</span>;
    }
    return <span className="text-orange-600">Ready (Uploads when you submit)</span>;
  };

  const getDownloadUrl = (url: string) => {
    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      let fileId = null;

      // Format: https://drive.google.com/file/d/FILE_ID/view
      const viewMatch = url.match(/\/file\/d\/([^\/]+)/);
      if (viewMatch) {
        fileId = viewMatch[1];
      }

      // Format: https://drive.google.com/open?id=FILE_ID
      const openMatch = url.match(/[?&]id=([^&]+)/);
      if (openMatch) {
        fileId = openMatch[1];
      }

      // If we found a file ID, construct the download URL
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    // For non-Google Drive URLs, return the original URL with download attribute
    return url;
  };

  if (!isOpen) return null;

  // Check if deadline has actually passed (based on current time, not activeTab)
  const isPastDeadline = assignment.endDateTime ? new Date(assignment.endDateTime).getTime() < currentTime.getTime() : false;

  const isUpcoming = activeTab === 'upcoming';
  const isCompleted = hasSubmitted;
  const canSubmit = activeTab === 'active' && !isPastDeadline && !isCompleted;  // Can't submit if deadline passed
  const canEdit = isCompleted && !isPastDeadline;  // Can't edit after deadline

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-700 p-6 border-b border-gray-200 dark:border-gray-600 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {assignment.assignmentHeader}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{assignment.subject}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Remaining Badge */}
            {(() => {
              const timeRemaining = getTimeRemaining(assignment.endDateTime || '');
              const colors = getTimeRemainingColor(assignment.endDateTime || '');
              const endDate = new Date(assignment.endDateTime || '');
              const diff = endDate.getTime() - currentTime.getTime();
              const hoursRemaining = diff / (1000 * 60 * 60);

              return timeRemaining ? (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <Clock className={`w-4 h-4 ${colors.text}`} />
                  <span className={`font-bold ${colors.text} ${hoursRemaining <= 6 ? 'animate-pulse' : ''}`}>
                    {timeRemaining}
                  </span>
                </div>
              ) : null;
            })()}

            {/* Status Badge */}
            <Badge className={`${
              activeTab === 'active' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
              activeTab === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              activeTab === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Badge>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meta Information */}
        <div className="bg-gray-50 dark:bg-gray-750 p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Subject</p>
              <p className="font-medium text-gray-900 dark:text-white">{assignment.subject}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
              <p className="font-medium text-red-600 dark:text-red-400">{formatDateTime(assignment.endDateTime || '')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
              <p className="font-medium text-gray-900 dark:text-white">{assignment.totalMarks || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading Submission Data - Nice Banner - SHOW FIRST for completed assignments */}
          {activeTab === 'completed' && loadingSubmission && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-5 shadow-lg animate-pulse">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Loading Your Submission...
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    Please wait while we retrieve your assignment submission details.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Fetching data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming State */}
          {isUpcoming && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                This assignment is not yet available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Will become available on {formatDateTime(assignment.startDateTime || '')}
              </p>
            </div>
          )}

          {/* Expired State (Deadline Passed) - View Only Mode */}
          {(isPastDeadline || activeTab === 'expired') && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-600 rounded-lg p-5 mb-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                    Assignment Can Only Be Viewed
                  </h3>
                  <p className="text-red-800 dark:text-red-300 font-medium">
                    The submission deadline for this assignment has passed.
                  </p>
                  <p className="text-red-700 dark:text-red-400 text-sm mt-2">
                    You can view the assignment details, but cannot make new submissions or upload files.
                  </p>
                  {assignment.endDateTime && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                      Deadline was: {formatDateTime(assignment.endDateTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OLD loading banner removed from here - moved to top */}
          {false && isCompleted && loadingSubmission && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-5 mb-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Loading Your Submission...
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    Please wait while we retrieve your assignment submission details.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Fetching data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Previous Submission (if exists) */}
          {isCompleted && !loadingSubmission && previousSubmission && (() => {
            // Check if there's any actual data to show
            const hasGroupData = previousSubmission.groupName || (previousSubmission.groupMembers && previousSubmission.groupMembers.length > 0);
            const hasAnswers = previousSubmission.answers && Object.entries(previousSubmission.answers).some(([_, answer]: [string, any]) =>
              answer !== null && answer !== undefined && answer !== ''
            );
            const hasFiles = previousSubmission.files && previousSubmission.files.length > 0;
            const hasUrls = previousSubmission.urls && previousSubmission.urls.length > 0;
            const hasAnyData = hasGroupData || hasAnswers || hasFiles || hasUrls;

            return (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-5">
                <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2 text-lg">
                  <CheckCircle className="w-6 h-6" />
                  Your Submission Details
                </h3>

                {/* Submission Metadata */}
                <div className="mb-4 pb-3 border-b border-orange-200 dark:border-orange-700">
                  {/* Show submission info based on count */}
                  {submissionCount === 1 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Submitted by:</span>{' '}
                        {previousSubmission.submitterName || 'Unknown'}
                        {previousSubmission.timestamp && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            on {formatDateTime(previousSubmission.timestamp)}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Current submission by:</span>{' '}
                        {previousSubmission.submitterName || 'Unknown'}
                        {previousSubmission.timestamp && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            on {formatDateTime(previousSubmission.timestamp)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total submissions: {submissionCount} times
                      </p>
                      {previousSubmission.responseUpdated === 'Yes' && (
                        <span className="inline-block text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full font-semibold">
                          Updated
                        </span>
                      )}
                    </div>
                  )}

                  {/* Show info banner if current user is not the submitter */}
                  {assignment.groupAssignment === 'Yes' && previousSubmission.submitterEmail &&
                   previousSubmission.submitterEmail.toLowerCase() !== auth.currentUser?.email?.toLowerCase() && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ℹ️ This submission was made by your group member
                      </p>
                    </div>
                  )}
                </div>

                {/* Show message if no data */}
                {!hasAnyData && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded border border-orange-200 dark:border-orange-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your submission was recorded, but no detailed data is available to display.
                    </p>
                  </div>
                )}

              {/* Group Information (if group assignment and has group data) */}
              {(previousSubmission.groupName || (previousSubmission.groupMembers && previousSubmission.groupMembers.length > 0)) && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Group Information
                  </h4>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-orange-200 dark:border-orange-700">
                    {previousSubmission.groupName && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Group Name:</span> {previousSubmission.groupName}
                      </p>
                    )}
                    {previousSubmission.groupMembers && previousSubmission.groupMembers.length > 0 && (
                      <div className={previousSubmission.groupName ? "mt-2" : ""}>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Members:</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {previousSubmission.groupMembers.map((member: string, idx: number) => (
                            <li key={idx}>{member}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Answers to Questions */}
              {previousSubmission.answers && Object.keys(previousSubmission.answers).length > 0 && (() => {
                // Filter out empty/null/undefined answers
                const answeredQuestions = Object.entries(previousSubmission.answers).filter(([_, answer]: [string, any]) =>
                  answer !== null && answer !== undefined && answer !== ''
                );

                return answeredQuestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Answers</h4>
                    <div className="space-y-3">
                      {answeredQuestions.map(([question, answer]: [string, any], idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded border border-orange-200 dark:border-orange-700">
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-500">
                            {question}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap pl-2">
                            {answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Submitted Files */}
              {previousSubmission.files && previousSubmission.files.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Submitted Files
                  </h4>
                  <div className="space-y-2">
                    {previousSubmission.files.map((file: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 p-3 rounded border border-orange-200 dark:border-orange-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.name}</span>
                        </div>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted URLs */}
              {previousSubmission.urls && previousSubmission.urls.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Submitted URLs
                  </h4>
                  <div className="space-y-2">
                    {previousSubmission.urls.map((urlItem: any, idx: number) => (
                      <a
                        key={idx}
                        href={urlItem.link || urlItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white dark:bg-gray-800 p-3 rounded border border-orange-200 dark:border-orange-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{urlItem.name}</span>
                        <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Peer Rating Input Form - Within Submission Details (only when NOT updating) */}
              {assignment.groupAssignment === 'Yes' &&
               assignment.groupRatingRemarkEnabled === 'Yes' &&
               !isUpdating &&
               previousSubmission?.groupMembers && previousSubmission.groupMembers.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                      Rate Your Group Members <span className="text-red-600 dark:text-red-400">(Mandatory)</span>
                    </h4>
                  </div>

                  {ratingsLocked && (
                    <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-300">
                      ✓ Peer ratings submitted and locked. You cannot edit them.
                    </div>
                  )}

                  <div className="space-y-4">
                    {availableStudents
                      .filter(s => (previousSubmission.groupMembers.includes(s.fullName) || previousSubmission.groupMembers.includes(s.email)) && s.email !== user?.email && s.fullName !== user?.displayName)
                      .map((member) => {
                        const memberRating = peerRatings[member.fullName] || { rating: 0, remark: '' };
                        const hasRating = memberRating.rating > 0;

                        return (
                          <div key={member.email} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="font-medium text-gray-900 dark:text-white mb-2">
                              {member.fullName} {member.rollNo && `(${member.rollNo})`}
                            </div>

                            {/* Star Rating */}
                            <div className="mb-2">
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Rating
                              </label>
                              <StarRating
                                rating={memberRating.rating}
                                onRatingChange={(rating) => {
                                  if (!ratingsLocked) {
                                    setPeerRatings(prev => ({
                                      ...prev,
                                      [member.fullName]: { ...prev[member.fullName], rating }
                                    }));
                                  }
                                }}
                                disabled={ratingsLocked}
                                size="md"
                              />
                            </div>

                            {/* Remarks */}
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Remarks {hasRating && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                value={memberRating.remark}
                                onChange={(e) => {
                                  if (!ratingsLocked) {
                                    setPeerRatings(prev => ({
                                      ...prev,
                                      [member.fullName]: { ...prev[member.fullName], remark: e.target.value }
                                    }));
                                  }
                                }}
                                disabled={ratingsLocked || !hasRating}
                                placeholder={hasRating ? "Enter your remarks..." : "Please provide a rating first"}
                                className={`w-full px-3 py-2 text-sm border rounded-lg ${
                                  ratingsLocked || !hasRating
                                    ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-800'
                                } border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
                                rows={2}
                              />
                              {hasRating && !memberRating.remark && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                  Remarks are mandatory when you provide a rating
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {!ratingsLocked && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-600 rounded">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                        ⚠️ Important: If you rate ANY group member, you must rate ALL group members.
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Remarks are mandatory for each rating. Once submitted, ratings cannot be edited.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })()
          }

          {/* Assignment Details */}
          {!isUpcoming && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment Details</h3>
                {assignment.assignmentDetails && (
                  <div
                    className="dynamic-html-content prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: assignment.assignmentDetails }}
                  />
                )}
              </div>

              {/* Assignment URLs */}
              {assignment.assignmentURLs && assignment.assignmentURLs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment URLs</h3>
                  <div className="space-y-2">
                    {assignment.assignmentURLs.map((urlItem, index) => (
                      <a
                        key={index}
                        href={urlItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{urlItem.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor Files */}
              {assignment.instructorFiles && assignment.instructorFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment Resources</h3>
                  <div className="space-y-2">
                    {assignment.instructorFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            View
                          </a>
                          <a
                            href={getDownloadUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Form */}
              {((canSubmit && !isCompleted) || (isCompleted && isUpdating && !isPastDeadline)) && (
                <div className="space-y-6" data-submit-section>
                  {isUpdating && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 dark:border-orange-600 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <h4 className="font-semibold text-orange-800 dark:text-orange-300">Update Mode Active</h4>
                          <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                            You can now modify your previous answers, upload new files, or change URLs. Click "Update Submission" when done.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isUpdating ? 'Update Your Assignment' : 'Submit Your Assignment'}
                  </h3>

                  {/* Group Assignment Fields */}
                  {assignment.groupAssignment === 'Yes' && (
                    <div className="space-y-4">
                      {/* Group Name - Auto-populated from SubjectGroup */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Group Name
                        </label>
                        <input
                          type="text"
                          value={groupName || 'Loading...'}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Auto-populated from your Subject Group
                        </p>
                      </div>

                      {/* Student Selection for Group Members */}
                      <div>
                        <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span>Select Group Members</span>
                        </div>

                        {/* Search Box */}
                        {!loadingStudents && availableStudents.length > 0 && (
                          <div className="mb-2">
                            <input
                              type="text"
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                              placeholder="Search students by name or roll number..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                              disabled={isPastDeadline}
                            />
                          </div>
                        )}

                        {loadingStudents ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">Loading students...</div>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-60 overflow-y-auto">
                            {availableStudents.length === 0 ? (
                              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                No students found for this subject
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                {availableStudents
                                  .filter(student => {
                                    // Exclude current user from the list
                                    if (student.email === user?.email) return false;
                                    // Apply search filter
                                    if (!studentSearchTerm) return true;
                                    const searchLower = studentSearchTerm.toLowerCase();
                                    return (
                                      student.fullName.toLowerCase().includes(searchLower) ||
                                      student.rollNo.toLowerCase().includes(searchLower)
                                    );
                                  })
                                  .map((student) => (
                                    <label
                                      key={student.email}
                                      className={`flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer ${
                                        isPastDeadline ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={groupMembers.includes(student.email)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setGroupMembers(prev => [...prev, student.email]);
                                          } else {
                                            setGroupMembers(prev => prev.filter(email => email !== student.email));
                                          }
                                        }}
                                        disabled={isPastDeadline}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                                        {student.fullName}
                                        {student.rollNo && (
                                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                                            ({student.rollNo})
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Selected Students Summary */}
                        {groupMembers.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Selected: {groupMembers.length} student{groupMembers.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-400">
                              {availableStudents
                                .filter(s => groupMembers.includes(s.email))
                                .map(s => s.fullName)
                                .join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Peer Rating & Remarks */}
                      {assignment.groupRatingRemarkEnabled === 'Yes' && groupMembers.length > 0 && (
                        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                              Peer Rating & Remarks <span className="text-blue-600 dark:text-blue-400">(Can be filled now or once submission is made)</span>
                            </h4>
                          </div>

                          {ratingsLocked && (
                            <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-300">
                              ✓ Peer ratings submitted and locked. You cannot edit them.
                            </div>
                          )}

                          <div className="space-y-4">
                            {availableStudents
                              .filter(s => groupMembers.includes(s.email) && s.email !== user?.email && s.fullName !== user?.displayName)
                              .map((member) => {
                                const memberRating = peerRatings[member.fullName] || { rating: 0, remark: '' };
                                const hasRating = memberRating.rating > 0;

                                return (
                                  <div key={member.email} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                                      {member.fullName} {member.rollNo && `(${member.rollNo})`}
                                    </div>

                                    {/* Star Rating */}
                                    <div className="mb-2">
                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Rating
                                      </label>
                                      <StarRating
                                        rating={memberRating.rating}
                                        onRatingChange={(rating) => {
                                          if (!ratingsLocked) {
                                            setPeerRatings(prev => ({
                                              ...prev,
                                              [member.fullName]: { ...prev[member.fullName], rating }
                                            }));

                                            // Track peer rating change
                                            tracking.trackPeerRatingChange(member.fullName, rating, {
                                              assignment,
                                              pageSection: 'peer_ratings',
                                              metadata: {
                                                previous_rating: peerRatings[member.fullName]?.rating || 0,
                                                has_remark: !!peerRatings[member.fullName]?.remark,
                                              }
                                            });
                                          }
                                        }}
                                        disabled={ratingsLocked}
                                        size="md"
                                      />
                                    </div>

                                    {/* Remarks */}
                                    <div>
                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Remarks {hasRating && <span className="text-red-500">*</span>}
                                      </label>
                                      <textarea
                                        value={memberRating.remark}
                                        onChange={(e) => {
                                          if (!ratingsLocked) {
                                            const newRemark = e.target.value;
                                            setPeerRatings(prev => ({
                                              ...prev,
                                              [member.fullName]: { ...prev[member.fullName], remark: newRemark }
                                            }));

                                            // Track peer remark change (debounced - only track when user stops typing)
                                            if (newRemark.length > 0 && newRemark.length % 20 === 0) {
                                              tracking.trackPeerRemarkChange(member.fullName, newRemark.length, {
                                                assignment,
                                                pageSection: 'peer_ratings',
                                                metadata: {
                                                  rating: memberRating.rating,
                                                }
                                              });
                                            }
                                          }
                                        }}
                                        disabled={ratingsLocked || !hasRating}
                                        placeholder={hasRating ? "Enter your remarks..." : "Please provide a rating first"}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg ${
                                          ratingsLocked || !hasRating
                                            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-gray-800'
                                        } border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
                                        rows={2}
                                      />
                                      {hasRating && !memberRating.remark && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                          Remarks are mandatory when you provide a rating
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {!ratingsLocked && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-xs text-blue-800 dark:text-blue-300">
                              <p className="font-semibold mb-1">⚠️ Important:</p>
                              <p>Peer ratings are mandatory. You must rate ALL group members with remarks to submit this assignment. Once submitted, ratings cannot be edited. Ratings can also be filled once the assignment deadline is expired.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Questions */}
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(qNum => {
                    const question = assignment[`q${qNum}` as keyof AssignmentData];
                    const isMandatory = assignment[`q${qNum}Mandatory` as keyof AssignmentData] === 'Yes';

                    // Skip if question is empty or undefined
                    if (!question || (typeof question === 'string' && question.trim() === '')) return null;

                    return (
                      <div key={qNum}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {`Q${qNum}: ${question}`}
                          </span>
                          {isMandatory && (
                            <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <textarea
                          value={answers[`q${qNum}`] || ''}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [`q${qNum}`]: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24"
                          placeholder={isPastDeadline ? "Submission deadline has passed" : "Type your answer here..."}
                          required={isMandatory}
                          disabled={isPastDeadline}
                        />
                      </div>
                    );
                  })}

                  {/* File Upload */}
                  <div className="space-y-4">
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>File Upload</span>
                      {assignment.attachmentMandatory === 'Yes' && <span className="text-red-500"> *</span>}
                    </div>

                    {/* Info Box */}
                    {!isPastDeadline && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm">
                        <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📌 NOTE: File upload behavior:</p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                          <li>• Small files (&lt;20MB): Will remain "Ready" until you submit the form</li>
                          <li>• Large files (≥20MB): Will begin uploading immediately</li>
                          <li>• Multiple files: Maximum 5 files allowed</li>
                        </ul>
                      </div>
                    )}

                    {/* Upload Area */}
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isPastDeadline
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                    }`}>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {isPastDeadline ? 'File upload disabled - Deadline has passed' : 'Drag & drop files here or click to browse'}
                      </p>
                      {!isPastDeadline && (
                        <>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            accept={assignment.fileTypes ? assignment.fileTypes.split(',').map(ext => `.${ext.trim()}`).join(',') : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png'}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Allowed: {assignment.fileTypes ? assignment.fileTypes.toUpperCase().split(',').map(t => t.trim()).join(', ') : 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG'}
                          </p>
                        </>
                      )}
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Selected Files:</p>
                        {files.map((upload) => (
                          <div key={upload.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {upload.file.name}
                                </span>
                                <span className="text-xs text-gray-500">({formatFileSize(upload.file.size)})</span>
                                {upload.file.size >= 20 * 1024 * 1024 && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">Large File</Badge>
                                )}
                              </div>
                              <button
                                onClick={() => removeFile(upload.id)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {/* Display Name Input */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  File Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={upload.displayName}
                                  onChange={(e) => {
                                    setFiles(prev => prev.map(f =>
                                      f.id === upload.id ? { ...f, displayName: e.target.value } : f
                                    ));
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="e.g., Deck, Assignment File, Presentation"
                                  disabled={isPastDeadline}
                                  required
                                />
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    upload.status === 'complete' ? 'bg-green-500' :
                                    upload.status === 'error' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${upload.progress}%` }}
                                />
                              </div>
                              <div className="text-xs">{getFileStatusDisplay(upload)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* URL Submission Section - Always shown */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        URL Submissions (Optional)
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Up to 5 URLs
                      </span>
                    </div>

                    <div className="space-y-3">
                      {urls.slice(0, visibleUrlCount).map((url, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={url.name}
                            onChange={(e) => {
                              const newUrls = [...urls];
                              newUrls[index] = { ...newUrls[index], name: e.target.value };
                              setUrls(newUrls);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder={`URL ${index + 1} Name (e.g., Project Demo, GitHub Repo)`}
                            disabled={isPastDeadline}
                          />
                          <input
                            type="url"
                            value={url.link}
                            onChange={(e) => {
                              const newUrls = [...urls];
                              newUrls[index] = { ...newUrls[index], link: e.target.value };
                              setUrls(newUrls);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder={`URL ${index + 1} Link (https://...)`}
                            disabled={isPastDeadline}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add More URLs Button */}
                    {visibleUrlCount < 5 && !isPastDeadline && (
                      <button
                        onClick={() => setVisibleUrlCount(prev => Math.min(prev + 1, 5))}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                      >
                        <span>+ Add More URLs</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({5 - visibleUrlCount} more)
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (isUpdating) {
                setIsUpdating(false);
              } else {
                handleClose();
              }
            }}
            className="border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isUpdating ? 'Cancel Update' : 'Close'}
          </Button>
          {((canSubmit && !isCompleted) || (isCompleted && isUpdating && !isPastDeadline)) && (
            <Button
              onClick={() => handleSubmit(isUpdating)}
              className="bg-[#fd621b] hover:bg-[#fc9100] text-white flex items-center gap-2"
              disabled={isSubmitting || files.some(f => f.status === 'uploading' && f.file.size >= 20 * 1024 * 1024)}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isUpdating ? 'Updating...' : 'Submitting...'}
                </>
              ) : files.some(f => f.status === 'uploading' && f.file.size >= 20 * 1024 * 1024) ? (
                'Uploading large files...'
              ) : isUpdating ? (
                'Update Submission'
              ) : (
                'Submit Assignment'
              )}
            </Button>
          )}
          {canEdit && !isUpdating && (
            <Button
              onClick={() => setShowUpdateConfirmation(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Update Submission?
            </Button>
          )}

          {/* Peer Ratings Submit Button - Post Submission */}
          {activeTab === 'completed' &&
           assignment.groupAssignment === 'Yes' &&
           assignment.groupRatingRemarkEnabled === 'Yes' &&
           !ratingsLocked &&
           hasSubmitted && (
            <Button
              onClick={() => handlePeerRatingsSubmit()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Submit Peer Ratings
            </Button>
          )}
        </div>

        {/* Display Average Ratings and Remarks Received */}
        {activeTab === 'completed' &&
         assignment.groupAssignment === 'Yes' &&
         assignment.groupRatingRemarkEnabled === 'Yes' &&
         hasSubmitted && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                Your Peer Feedback
              </h4>
            </div>

            <div className="space-y-3">
              {/* Average Rating */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">Average Rating:</span>
                <StarRating rating={averageRating} disabled size="md" />
                {peerRemarks.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (from {peerRemarks.length} peer{peerRemarks.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>

              {/* Remarks Received */}
              {peerRemarks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remarks from Peers:
                  </label>
                  <div className="space-y-2">
                    {peerRemarks.map((remark, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      >
                        {remark}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {peerRemarks.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No peer feedback received yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Confirmation Dialog */}
      {showUpdateConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border-2 border-orange-500">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Update Your Submission?
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>You are about to update your previous submission. This will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Replace your previous answers and files</li>
                    <li>Mark the submission as "Updated" and this entry will be used as your final submission if you don't update again</li>
                  </ul>
                  <p className="font-medium text-orange-600 dark:text-orange-400 mt-3">
                    ⚠️ Note: You can only update before the deadline!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowUpdateConfirmation(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowUpdateConfirmation(false);
                  setIsUpdating(true);
                  // Scroll to submission form
                  setTimeout(() => {
                    const submitSection = document.querySelector('[data-submit-section]');
                    if (submitSection) {
                      submitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Yes, Update Submission
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
