import React from 'react';
import { Session } from '../../types';
import { Calendar, Clock, Video, Film } from 'lucide-react';
import { formatDate, formatTime, cn } from '../../utils/helpers';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  showStatus?: boolean;
}

export function SessionCard({ session, onClick, showStatus = true }: SessionCardProps) {
  const hasGmeet = !!(session.gmeetLive || session.gmeetRecording);
  const hasScaler = !!(session.scalerLive || session.scalerRecording);

  return (
    <div
      onClick={onClick}
      className={cn(
        'ultimate-glass rounded-xl p-6 transition-all hover:shadow-ssb-lg cursor-pointer group',
        session.isLive && 'live-glow'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-ssb-green transition-colors">
            {session.sessionName}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {session.domain} • {session.subject}
          </p>
        </div>
        {showStatus && (
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold',
            session.isLive && 'status-glow bg-green-500 text-white',
            !session.isLive && session.status === 'scheduled' && 'bg-yellow-500/20 text-yellow-500',
            !session.isLive && session.status === 'ended' && 'bg-blue-500/20 text-blue-500'
          )}>
            {session.isLive ? '🔴 Live' : session.status}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(session.date)} • {session.day}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock className="w-4 h-4" />
          <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
          <span className="text-gray-500">({session.duration})</span>
        </div>
      </div>

      {/* Platform Badges */}
      <div className="flex items-center gap-2">
        {hasGmeet && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium flex items-center gap-1">
            <Video className="w-3 h-3" />
            Google Meet
          </span>
        )}
        {hasScaler && (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium flex items-center gap-1">
            <Film className="w-3 h-3" />
            Scaler
          </span>
        )}
        {session.hasRecording && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            📹 Recording Available
          </span>
        )}
      </div>
    </div>
  );
}
