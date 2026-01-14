import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface RefreshNotificationBannerProps {
  message: string;
  onRefresh: () => void;
  onDismiss: () => void;
  loading: boolean;
}

export function RefreshNotificationBanner({
  message,
  onRefresh,
  onDismiss,
  loading,
}: RefreshNotificationBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            <button
              onClick={onDismiss}
              disabled={loading}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
