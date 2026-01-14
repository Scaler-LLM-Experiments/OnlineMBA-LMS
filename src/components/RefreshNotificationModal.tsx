import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RefreshNotificationModalProps {
  message: string;
  onRefresh: () => void;
  loading: boolean;
}

export function RefreshNotificationModal({
  message,
  onRefresh,
  loading,
}: RefreshNotificationModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card border-2 border-orange-500 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Platform Update Required</h2>
              <p className="text-white/90 text-sm mt-1">
                Please refresh to see the latest changes
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-orange-900 dark:text-orange-200 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Your page will automatically reload after clicking the button
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
