export interface Session {
  sessionId: string;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  sessionName: string;
  date: Date | string;
  day: string;
  startTime: string;
  endTime: string;
  gmeetLive: string;
  gmeetRecording: string;
  scalerLive: string;
  scalerRecording: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
  duration: string;
  isLive: boolean;
  hasRecording: boolean;
}

export interface SessionFilters {
  type?: 'live' | 'recorded' | 'scheduled';
  batch?: string;
  domain?: string;
  subject?: string;
  term?: string;
}

export interface VideoSource {
  type: 'gmeet' | 'scaler' | 'zoom';
  url: string;
  label: string;
}
