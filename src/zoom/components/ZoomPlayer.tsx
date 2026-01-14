import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface ZoomPlayerProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  title?: string;
  className?: string;
}

export function ZoomPlayer({
  meetingNumber,
  password = '',
  title,
  className = ''
}: ZoomPlayerProps) {
  // Construct Zoom web client URL
  const zoomWebUrl = `https://zoom.us/wc/join/${meetingNumber}${password ? `?pwd=${password}` : ''}`;

  const handleOpenZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      zoomWebUrl,
      'zoomMeeting',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=yes,scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-blue-500/10 border-blue-500/20 text-blue-400">
              Zoom Meeting
            </span>
            <span className="text-sm text-gray-300 truncate">{title}</span>
          </div>
        </div>
      )}

      {/* Zoom Meeting Info */}
      <div className="relative bg-black flex items-center justify-center" style={{ height: '600px' }}>
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Zoom Meeting Ready
          </h3>
          <p className="text-sm text-gray-300 mb-6">
            Click below to join the Zoom meeting in a popup window.
          </p>
          <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
            <div className="text-xs text-gray-400 mb-1">Meeting ID</div>
            <div className="text-sm font-mono text-white">{meetingNumber}</div>
            {password && (
              <>
                <div className="text-xs text-gray-400 mt-3 mb-1">Password</div>
                <div className="text-sm font-mono text-white">{password}</div>
              </>
            )}
          </div>
          <button
            onClick={handleOpenZoom}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Join Zoom Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
}
