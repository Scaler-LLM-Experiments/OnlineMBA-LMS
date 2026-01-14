import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Session } from '../../types';
import { ArrowLeftRight, Maximize } from 'lucide-react';

interface DualVideoViewProps {
  session: Session;
}

export function DualVideoView({ session }: DualVideoViewProps) {
  const [swapped, setSwapped] = useState(false);
  const [singleView, setSingleView] = useState(false);

  const gmeetUrl = session.gmeetLive || session.gmeetRecording;
  const scalerUrl = session.scalerLive || session.scalerRecording;
  const zoomMeetingId = session.zoomMeetingId;

  const hasGmeet = !!gmeetUrl;
  const hasScaler = !!scalerUrl;
  const hasZoom = !!zoomMeetingId;
  const hasBothVideos = (hasGmeet || hasZoom) && hasScaler;

  const leftVideo = swapped ? scalerUrl : (hasZoom ? '' : gmeetUrl);
  const rightVideo = swapped ? (hasZoom ? '' : gmeetUrl) : scalerUrl;
  const leftType = swapped ? 'scaler' : (hasZoom ? 'zoom' : 'gmeet');
  const rightType = swapped ? (hasZoom ? 'zoom' : 'gmeet') : 'scaler';

  if (!hasGmeet && !hasScaler && !hasZoom) {
    return (
      <div className="ultimate-glass rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">📹</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Video Available</h3>
        <p className="text-gray-400">This session doesn't have any video links yet.</p>
      </div>
    );
  }

  // Single video mode or only one video available
  if (singleView || !hasBothVideos) {
    const url = hasZoom ? '' : (hasGmeet ? gmeetUrl : scalerUrl);
    const type = hasZoom ? 'zoom' : (hasGmeet ? 'gmeet' : 'scaler');

    return (
      <div className="space-y-4">
        {hasBothVideos && (
          <div className="flex justify-end">
            <button
              onClick={() => setSingleView(false)}
              className="px-4 py-2 ultimate-glass rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
            >
              Show Both Videos
            </button>
          </div>
        )}
        <VideoPlayer
          url={url}
          type={type as 'gmeet' | 'scaler' | 'zoom'}
          title={session.sessionName}
          zoomMeetingId={zoomMeetingId}
          zoomPassword={session.zoomPassword}
        />
      </div>
    );
  }

  // Dual video mode
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{session.sessionName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSwapped(!swapped)}
            className="px-4 py-2 ultimate-glass rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap Videos
          </button>
          <button
            onClick={() => setSingleView(true)}
            className="px-4 py-2 ultimate-glass rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Maximize className="w-4 h-4" />
            Single View
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VideoPlayer
          url={leftVideo}
          type={leftType as 'gmeet' | 'scaler' | 'zoom'}
          title={session.sessionName}
          zoomMeetingId={leftType === 'zoom' ? zoomMeetingId : undefined}
          zoomPassword={leftType === 'zoom' ? session.zoomPassword : undefined}
        />
        <VideoPlayer
          url={rightVideo}
          type={rightType as 'gmeet' | 'scaler' | 'zoom'}
          title={session.sessionName}
          zoomMeetingId={rightType === 'zoom' ? zoomMeetingId : undefined}
          zoomPassword={rightType === 'zoom' ? session.zoomPassword : undefined}
        />
      </div>
    </div>
  );
}
