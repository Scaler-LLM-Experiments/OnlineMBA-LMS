export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  subject: string;
  category: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  category: string;
  author: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Document' | 'Video' | 'Link' | 'Image';
  url: string;
  category: string;
  dateAdded: string;
  size?: string;
  downloads: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'Class' | 'Assignment' | 'Exam' | 'Event';
  location?: string;
  duration: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  batch: string;
  rollNo: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
}

export interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number;
  upcomingDeadlines: number;
  unreadAnnouncements: number;
  totalResources: number;
  upcomingEvents: number;
}

// Zoom Integration Types
export interface Session {
  sessionId: string;
  topic: string;
  sessionName: string;
  startTime: string;
  endTime: string; // Now required - calculated from startTime + duration
  date?: string;
  day?: string;
  duration: number | string; // Duration in minutes
  joinUrl: string;
  recordingUrl?: string;
  batch: string;
  term?: string;
  domain?: string;
  subject?: string;
  type: 'live' | 'recording';
  status?: 'scheduled' | 'live' | 'ended';
  isLive?: boolean;
  hasRecording?: boolean;
  gmeetLive?: string;
  gmeetRecording?: string;
  scalerLive?: string;
  scalerRecording?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  fullSynced?: boolean; // TRUE if recordings have been synced
  // Recording view Drive links
  speakerViewLink?: string; // Google Drive link for Speaker View
  galleryViewLink?: string; // Google Drive link for Gallery View
  screenShareLink?: string; // Google Drive link for Screen Share
  activeSpeakerLink?: string; // Google Drive link for Active Speaker
  // Additional assets
  transcriptLink?: string; // Google Drive link for Transcript
  audioLink?: string; // Google Drive link for Audio
  chatLink?: string; // Google Drive link for Chat
  // Additional files
  file1Name?: string; // Name for file 1
  file1?: string; // Additional file 1
  file2Name?: string; // Name for file 2
  file2?: string; // Additional file 2
  file3Name?: string; // Name for file 3
  file3?: string; // Additional file 3
  file4Name?: string; // Name for file 4
  file4?: string; // Additional file 4
  file5Name?: string; // Name for file 5
  file5?: string; // Additional file 5
  // Control flags
  manualDownload?: string; // "Yes" or "No"
  publish?: string; // "Yes" or "No"
  // Legacy fields (kept for backward compatibility)
  downloadGalleryView?: string; // "Yes" or "No"
  downloadSpeakerView?: string; // "Yes" or "No"
  downloadScreenShareSpeaker?: string; // "Yes" or "No"
  downloadScreenShare?: string; // "Yes" or "No"
  screenShareSpeakerLink?: string; // Google Drive link for Screen Share + Speaker (legacy)
  screenShareOnlyLink?: string; // Google Drive link for Screen Share Only (legacy)
}

export interface SessionFilters {
  type?: 'live' | 'recording';
  batch?: string;
  domain?: string;
  subject?: string;
  term?: string;
}

export interface Note {
  noteId: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  sessionId?: string;
  sessionTopic?: string;
  sessionName?: string;
  sessionDate?: string;
  batch?: string;
  term?: string;
  domain?: string;
  subject?: string;
  date?: string;
  startTime?: string;
  meetingId?: string;
  noteContent: string;
  noteTitle?: string;
  noteTimestamp?: string;
  timestamp?: string;
  noteTags?: string;
  isPinned: boolean | string;
  lastModified: string;
  updatedAt?: string;
  type?: string; // 'Live Session' or 'Recording' or 'Quick Note'
  images?: string; // Comma-separated image URLs or base64
}

export interface NoteInput {
  studentId: string;
  sessionId: string;
  noteContent: string;
  noteTags?: string;
  noteTitle?: string;
  noteId?: string;
  batch?: string;
  term?: string;
  domain?: string;
  subject?: string;
  sessionName?: string;
  isPinned?: boolean;
}

export interface Student {
  studentId: string;
  email: string;
  name: string;
  batch: string;
  lastLogin?: string;
  isAdmin?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SSB Calendar Events from "Info.ssb Calendar" subsheet
export interface SSBCalendarEvent {
  eventId: string;
  batch: string;
  publish: string; // "Yes" or "No"
  eventType: string; // "Session", "Assessment", "Others", "Masterclass", "Hustle", etc.
  studentLevelShow?: string; // "Yes" or "No" - if "Yes", only show to attendees
  eventName: string;
  startDate: string; // Format: DD-MMM-YYYY
  startTime: string; // Format: HH:MM AM/PM
  endDate: string; // Format: DD-MMM-YYYY
  endTime: string; // Format: HH:MM AM/PM
  link?: string;
  description?: string;
  attendees?: string; // Comma-separated email addresses
  updated?: string; // "Yes" or "No"
  updatedAt?: string; // Format: DD-MMM-YYYY HH:MM AM/PM
  location?: string;
}