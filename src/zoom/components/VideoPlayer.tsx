import React, { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { isValidUrl } from '../../utils/helpers';
import { ZoomPlayer } from './ZoomPlayer';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface VideoPlayerProps {
  url: string | undefined;
  type: 'gmeet' | 'scaler' | 'zoom';
  title?: string;
  className?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
}

export function VideoPlayer({ url, type, title, className = '', zoomMeetingId, zoomPassword }: VideoPlayerProps) {
  const { student } = useAuth();
  const [iframeError, setIframeError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // For Google Meet and Scaler, we know they block iframes
    // Show fallback after a short delay if iframe doesn't load
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [url]);

  // If Zoom meeting, use ZoomPlayer component
  if (type === 'zoom' && zoomMeetingId && student) {
    return (
      <ZoomPlayer
        meetingNumber={zoomMeetingId}
        password={zoomPassword || ''}
        userName={student.name || student.email}
        userEmail={student.email}
        title={title}
        className={className}
      />
    );
  }

  if (!url || !isValidUrl(url)) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl p-8 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📹</div>
          <p className="text-gray-400">No video available</p>
        </div>
      </div>
    );
  }

  const platformLabel = type === 'gmeet' ? 'Google Meet' : 'Scaler';
  const platformColor = type === 'gmeet' ? 'bg-blue-500' : 'bg-purple-500';

  // Open in popup window (more embedded feeling than new tab)
  const handleOpenPopup = (e: React.MouseEvent) => {
    e.preventDefault();
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      url,
      'meetingWindow',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=yes,scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${platformColor}`}>
            {platformLabel}
          </span>
          {title && <span className="text-sm text-gray-300 truncate">{title}</span>}
        </div>
        <button
          onClick={handleOpenPopup}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Popup</span>
        </button>
      </div>

      {/* Video Container */}
      <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
        {!showFallback ? (
          <iframe
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            allow="camera; microphone; fullscreen; speaker; display-capture"
            allowFullScreen
            title={title || `${platformLabel} Video`}
            onError={() => setIframeError(true)}
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-red-900/20 to-orange-900/20">
            <AlertCircle className="w-16 h-16 text-orange-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {platformLabel} cannot be embedded
            </h3>
            <p className="text-sm text-gray-300 mb-6 max-w-md">
              {platformLabel} blocks iframe embedding for security. Click below to open in a popup window where you can login and join.
            </p>
            <button
              onClick={handleOpenPopup}
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-medium text-white ${platformColor} hover:opacity-90 transition-opacity`}
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open {platformLabel} Meeting</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
