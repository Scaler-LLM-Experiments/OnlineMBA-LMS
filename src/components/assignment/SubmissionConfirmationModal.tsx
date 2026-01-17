import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Clock, FileText, Link as LinkIcon, Users, Calendar } from 'lucide-react';
import { Button } from '../ui/button';

interface SubmissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUpdate: boolean;
  assignmentTitle: string;
  submissionDetails?: {
    filesCount?: number;
    urlsCount?: number;
    isGroupSubmission?: boolean;
    groupName?: string;
    submittedAt?: Date;
  };
  autoCloseDelay?: number; // milliseconds, default 5000
}

export const SubmissionConfirmationModal: React.FC<SubmissionConfirmationModalProps> = ({
  isOpen,
  onClose,
  isUpdate,
  assignmentTitle,
  submissionDetails,
  autoCloseDelay = 5000,
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));

  useEffect(() => {
    if (!isOpen) return;

    // Reset countdown when modal opens
    setCountdown(Math.ceil(autoCloseDelay / 1000));

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-close timer
    const closeTimer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(closeTimer);
    };
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop - covers everything including the assignment modal */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[101] bg-white dark:bg-gray-900 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-20 h-20 border-4 border-green-500 animate-ping opacity-20" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isUpdate ? 'Submission Updated!' : 'Submission Successful!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your {isUpdate ? 'updated ' : ''}assignment has been submitted successfully.
          </p>

          {/* Assignment Title */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 mb-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assignment</p>
            <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {assignmentTitle}
            </p>
          </div>

          {/* Submission Details */}
          {submissionDetails && (
            <div className="space-y-2 mb-6 text-left">
              {/* Submitted At */}
              {submissionDetails.submittedAt && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Submitted: {formatTime(submissionDetails.submittedAt)}</span>
                </div>
              )}

              {/* Files Count */}
              {submissionDetails.filesCount !== undefined && submissionDetails.filesCount > 0 && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{submissionDetails.filesCount} file{submissionDetails.filesCount !== 1 ? 's' : ''} uploaded</span>
                </div>
              )}

              {/* URLs Count */}
              {submissionDetails.urlsCount !== undefined && submissionDetails.urlsCount > 0 && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  <span>{submissionDetails.urlsCount} URL{submissionDetails.urlsCount !== 1 ? 's' : ''} submitted</span>
                </div>
              )}

              {/* Group Info */}
              {submissionDetails.isGroupSubmission && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Group: {submissionDetails.groupName || 'Group Submission'}</span>
                </div>
              )}
            </div>
          )}

          {/* Auto-close countdown */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Clock className="w-4 h-4" />
            <span>Closing automatically in {countdown}s</span>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
