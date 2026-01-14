import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { assignmentApiService } from '../../services/assignmentApi';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface RefreshStudentsPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefreshStudentsPlatformModal({ isOpen, onClose }: RefreshStudentsPlatformModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [bannerNotice, setBannerNotice] = useState('');
  const [requireFullScreen, setRequireFullScreen] = useState(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError('User email not found');
      return;
    }

    if (!reason.trim() || !bannerNotice.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate datetime fields if provided
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      if (end <= start) {
        setError('End date/time must be after start date/time');
        return;
      }
    } else if (startDateTime || endDateTime) {
      setError('Both start and end date/time must be provided, or leave both empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Fire the API request asynchronously (don't wait for completion)
      assignmentApiService.pushRefreshRequest(
        user.email,
        reason.trim(),
        bannerNotice.trim(),
        requireFullScreen,
        startDateTime || undefined,
        endDateTime || undefined
      ).then(result => {
        // Log the result but don't block the UI
        if (result.success) {
          console.log('✅ Refresh request sent successfully:', result.data);
        } else {
          console.error('⚠️ Refresh request may have failed:', result.error);
        }
      }).catch(err => {
        console.error('⚠️ Error sending refresh request:', err);
      });

      // Show success immediately and refresh the page
      setSuccess(true);

      // Refresh the page after a brief moment to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Error pushing refresh request:', err);
      setError('An error occurred while sending refresh request');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setBannerNotice('');
    setRequireFullScreen(false);
    setStartDateTime('');
    setEndDateTime('');
    setError('');
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Refresh Students Platform</h2>
              <p className="text-white/90 text-sm mt-1">
                Send a refresh notification to all students
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-200">
                  Refresh Request Sent Successfully!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  All students will receive the notification when they access the platform.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-200">Error</h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">About Refresh Notifications:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>Banner notification: Students see a dismissible banner at the top</li>
                  <li>Full-screen modal: Students must acknowledge before continuing</li>
                  <li>Students only see the notification once (tracked automatically)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason for Push */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason for Push <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Assignment deadline updated, New assignment added"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading || success}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Internal reason for tracking purposes (not shown to students)
              </p>
            </div>

            {/* Banner Notice */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Banner Notice to Students <span className="text-red-500">*</span>
              </label>
              <textarea
                value={bannerNotice}
                onChange={(e) => setBannerNotice(e.target.value)}
                placeholder="e.g., Important updates have been made to assignments. Please refresh your page to see the latest changes."
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                disabled={loading || success}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Message displayed to students in the notification
              </p>
            </div>

            {/* Require Full Screen Refresh */}
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-accent/50">
              <input
                type="checkbox"
                id="requireFullScreen"
                checked={requireFullScreen}
                onChange={(e) => setRequireFullScreen(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-600 border-border rounded focus:ring-orange-500"
                disabled={loading || success}
              />
              <label htmlFor="requireFullScreen" className="flex-1">
                <div className="font-medium text-foreground">
                  Require Full Screen Refresh
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  If checked, students will see a full-screen modal that requires acknowledgment.
                  Otherwise, they'll see a dismissible banner at the top of the page.
                </div>
              </label>
            </div>

            {/* Schedule Notification (Optional) */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
              <div>
                <h4 className="font-medium text-foreground mb-2">Schedule Notification (Optional)</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Set when the notification should appear and disappear. Leave empty to show immediately and indefinitely.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date/Time */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={loading || success}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When to start showing the notification
                  </p>
                </div>

                {/* End Date/Time */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={loading || success}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When to stop showing the notification
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-border rounded-lg font-medium text-muted-foreground hover:bg-accent transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Send Refresh Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
