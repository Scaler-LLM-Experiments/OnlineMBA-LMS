import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  ClipboardList,
  Clock,
  Megaphone,
  FolderOpen,
  Calendar,
  TrendingUp,
  BookOpen,
  Users,
  AtSign,
  Video,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { apiService, type DashboardData, type ContentItem } from '../services/api';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { formatDateTime, parseDate } from '../utils/dateUtils';
import { Session, SSBCalendarEvent } from '../types';
import { api as zoomApiService } from '../zoom/services/api';
import { useActivityTracker } from '../hooks/useActivityTracker';

// Union type for display items
type DisplayItem = ContentItem | {
  id: string;
  title: string;
  subTitle: string;
  startDateTime: string;
  createdAt?: string;
  category: string;
  status: string;
  session?: Session;
  eventType?: string;
  eventTitle?: string;
  policyName?: string;
  groups?: string;
  location?: string;
  fileURL?: string;
  content?: string;
};

const Overview: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [recordings, setRecordings] = useState<Session[]>([]);
  const [ssbCalendarEvents, setSsbCalendarEvents] = useState<SSBCalendarEvent[]>([]);
  const [managementEvents, setManagementEvents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Overview');
  }, [trackPageView]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchSessionsData(),
        fetchCalendarEvents(),
        fetchManagementEvents()
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  const fetchSessionsData = async () => {
    try {
      if (!user?.email) return;

      // Fetch all live sessions from Zoom Live sheet
      const liveResult = await zoomApiService.getLiveSessions();
      if (liveResult.success && liveResult.data) {
        const allSessions = liveResult.data.sessions || [];

        // Separate into live and upcoming based on current time
        const now = new Date();
        const live: Session[] = [];
        const upcoming: Session[] = [];

        allSessions.forEach((session: Session) => {
          if (!session.date || !session.startTime) return;

          try {
            // Parse session date and time
            const dateParts = session.date.split('-');
            const monthMap: { [key: string]: number } = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };

            if (dateParts.length !== 3) return;

            const day = parseInt(dateParts[0]);
            const month = monthMap[dateParts[1]];
            const year = parseInt(dateParts[2]);

            // Parse start time
            const timeMatch = session.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!timeMatch) return;

            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();

            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const startDate = new Date(year, month, day, hours, minutes);
            const durationMinutes = typeof session.duration === 'number'
              ? session.duration
              : parseInt(String(session.duration)) || 0;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

            // Check if session is live or upcoming
            if (now >= startDate && now <= endDate) {
              live.push(session);
            } else if (now < startDate) {
              upcoming.push(session);
            }
          } catch (error) {
            console.error('Error parsing session time:', error);
          }
        });

        setLiveSessions(live);
        setUpcomingSessions(upcoming);
      }

      // Fetch recordings
      const recordingsResult = await zoomApiService.getRecordings();
      if (recordingsResult.success && recordingsResult.data) {
        setRecordings(recordingsResult.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions data:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      if (!user?.email) return;

      // Get student batch for filtering
      let studentBatch: string | undefined;
      try {
        const studentResult = await zoomApiService.getStudent(user.email);
        if (studentResult.success && studentResult.data?.student) {
          studentBatch = studentResult.data.student.batch;
        }
      } catch (err) {
        console.warn('Overview: Could not fetch student batch:', err);
      }

      // Fetch SSB calendar events
      const calendarResult = await zoomApiService.getCalendarEvents(studentBatch);
      if (calendarResult.success && calendarResult.data) {
        setSsbCalendarEvents(calendarResult.data.events || []);
        console.log('Overview: SSB calendar events loaded:', calendarResult.data.events.length);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchManagementEvents = async () => {
    try {
      if (!user?.email) return;

      // Fetch Events & Announcements from Management sheet
      const eventsResult = await apiService.getEvents(user.email, { status: 'Published', publish: 'Yes' });

      if (eventsResult.success && eventsResult.data) {
        console.log('Overview: Events & Announcements from Management sheet:', eventsResult.data.length);

        // Convert EventData to ContentItem format
        const managementEventItems: ContentItem[] = eventsResult.data.map(event => {
          // Convert datetime format from "2025-12-12 11:30" to ISO format
          const startDate = event.startDateTime ? new Date(event.startDateTime.replace(' ', 'T')).toISOString() : '';
          const endDate = event.endDateTime ? new Date(event.endDateTime.replace(' ', 'T')).toISOString() : '';

          // Determine if event is live, upcoming, or ended
          const now = new Date();
          const start = new Date(startDate);
          const end = new Date(endDate);
          const isLive = now >= start && now <= end;
          const hasEnded = now > end;
          const isUpcoming = now < start;

          return {
            id: event.id || '',
            category: event.categoryType === 'ANNOUNCEMENTS' ? 'ANNOUNCEMENTS' : 'EVENTS',
            eventType: event.eventType || event.announcementType || '',
            title: event.title || 'Untitled Event',
            subTitle: event.subtitle || '',
            content: event.description || '',
            priority: event.priority || 'Medium',
            status: isLive ? 'Active' : hasEnded ? 'Expired' : 'Upcoming',
            postedBy: event.postedBy || '',
            createdAt: startDate,
            startDateTime: startDate,
            endDateTime: endDate,
            requiresAcknowledgment: event.requiresAcknowledgement === 'Yes',
            hasFiles: (event.files && event.files.length > 0) || false,
            isNew: !hasEnded && (now.getTime() - start.getTime()) < 7 * 24 * 60 * 60 * 1000,
            daysUntilDeadline: null
          };
        });

        setManagementEvents(managementEventItems);
        console.log('Overview: Processed management events:', managementEventItems.length);
      }
    } catch (error) {
      console.error('Error fetching management events:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Starting to load data...');

      if (!user?.email) {
        console.log('Dashboard: No user email found');
        toast.error('No user email found');
        return;
      }

      const result = await apiService.getStudentDashboard(user.email);

      if (!result.success) {
        console.log('Dashboard: API call failed:', result.error);
        toast.error(`Dashboard error: ${result.error || 'Unknown error'}`);
        return;
      }

      setDashboardData(result.data!);
      console.log('Dashboard: Data loaded successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    }
  };

  // Show skeleton loading directly
  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-muted rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Content Cards Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-5 bg-muted rounded w-4/5"></div>
                      <div className="h-4 bg-muted rounded w-3/5"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Helper function to check if item is within 72 hours from start time
  const isWithin72Hours = (startDateTime: string): boolean => {
    const startDate = parseDate(startDateTime);
    if (!startDate) return false;

    const now = new Date();
    const hoursDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 72;
  };

  // Helper function to check if Policy & Documents item is within 5 days from StartDateTime
  const isWithin5DaysFromStart = (startDateTime: string): boolean => {
    const startDate = parseDate(startDateTime);
    if (!startDate) return false;

    const now = new Date();
    const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    // Show for 5 days from start (can be negative if future date, or positive if past date)
    return daysDiff >= 0 && daysDiff <= 5;
  };

  // Helper to check if an item ended within the last 7 days
  const endedWithinLast7Days = (item: any): boolean => {
    const now = new Date();

    // For items with endDateTime
    if (item.endDateTime) {
      const endDate = parseDate(item.endDateTime);
      if (endDate) {
        const daysDiff = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 7; // Ended in last 7 days
      }
    }

    // For items with startDateTime but no endDateTime (fallback)
    if (item.startDateTime || item.createdAt) {
      const dateToCheck = parseDate(item.startDateTime || item.createdAt);
      if (dateToCheck) {
        const daysDiff = (now.getTime() - dateToCheck.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 7;
      }
    }

    return false;
  };

  // Convert Session to a display item format
  const convertSessionToDisplayItem = (session: Session, isLive: boolean = false) => {
    // Combine date and time into a single datetime string
    // Backend provides date in "DD-MMM-YYYY" format (e.g., "10-Nov-2025")
    // Backend provides startTime in "HH:MM AM/PM" format (e.g., "11:00 AM")
    let combinedDateTime = '';
    if (session.date && session.startTime) {
      // Convert "10-Nov-2025" to "10/11/2025" and combine with time
      const dateParts = session.date.split('-');
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = monthMap[dateParts[1]] || '01';
        const year = dateParts[2];
        combinedDateTime = `${day}/${month}/${year} ${session.startTime}`;
      }
    }

    return {
      id: session.sessionId,
      title: session.topic || session.sessionName,
      subTitle: `${session.batch || ''} ${session.subject || ''}`.trim(),
      startDateTime: combinedDateTime || session.startTime || session.date || '',
      category: 'SESSIONS',
      status: isLive ? 'Active' : 'Upcoming',
      session: session
    };
  };

  // Helper to check if a session is currently live
  const isSessionLiveNow = (session: Session): boolean => {
    if (!session.date || !session.startTime) return false;

    try {
      // Parse the date and time
      const dateParts = session.date.split('-');
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      if (dateParts.length !== 3) return false;

      const day = parseInt(dateParts[0]);
      const month = monthMap[dateParts[1]];
      const year = parseInt(dateParts[2]);

      // Parse start time (e.g., "11:00 AM")
      const timeMatch = session.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      // Create start date object
      const startDate = new Date(year, month, day, hours, minutes);

      // Calculate end date by adding duration
      const durationMinutes = typeof session.duration === 'number'
        ? session.duration
        : parseInt(String(session.duration)) || 0;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

      // Check if current time is between start and end
      const now = new Date();
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.error('Error checking if session is live:', error);
      return false;
    }
  };

  // Get 1 live session + 2 upcoming sessions from Zoom
  // Find the session that's actually live right now
  const actuallyLiveSession = liveSessions.find(session => isSessionLiveNow(session));
  const liveSessionItem = actuallyLiveSession
    ? [convertSessionToDisplayItem(actuallyLiveSession, true)]
    : [];

  // Sort upcoming sessions by start time (earliest first) and take first 2
  const sortedUpcoming = [...upcomingSessions].sort((a, b) => {
    try {
      const parseSessionDateTime = (session: Session): Date | null => {
        if (!session.date || !session.startTime) return null;

        const dateParts = session.date.split('-');
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        if (dateParts.length !== 3) return null;

        const day = parseInt(dateParts[0]);
        const month = monthMap[dateParts[1]];
        const year = parseInt(dateParts[2]);

        const timeMatch = session.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return null;

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return new Date(year, month, day, hours, minutes);
      };

      const dateA = parseSessionDateTime(a);
      const dateB = parseSessionDateTime(b);

      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime(); // Ascending order (earliest first)
    } catch (error) {
      return 0;
    }
  });

  const upcomingSessionItems = sortedUpcoming.slice(0, 2).map(s => convertSessionToDisplayItem(s, false));

  // Filter content items within 72 hours (or 5 days for Policy & Documents)
  const contentItems = dashboardData.content
    .filter(item => {
      if (!item.startDateTime) return false;
      if (item.category === 'STUDENTS CORNER') return false;

      // For Policy & Documents, check if within 5 days from StartDateTime
      if (item.category === 'POLICY & DOCUMENTS') {
        return isWithin5DaysFromStart(item.startDateTime);
      }

      // For other items, check if within 72 hours
      if (!isWithin72Hours(item.startDateTime)) return false;

      // Include Active or Upcoming items
      return item.status === 'Active' || item.status === 'Upcoming';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

  // Helper to parse SSB Calendar start date/time
  const parseSSBCalendarStartDateTime = (event: SSBCalendarEvent): Date | null => {
    if (!event.startDate || !event.startTime) return null;

    try {
      const dateParts = event.startDate.split('-');
      if (dateParts.length !== 3) return null;

      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      const day = parseInt(dateParts[0]);
      const month = monthMap[dateParts[1]];
      const year = parseInt(dateParts[2]);

      const timeMatch = event.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return null;

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return new Date(year, month, day, hours, minutes);
    } catch (error) {
      return null;
    }
  };

  // Helper to parse SSB Calendar end date/time
  const parseSSBCalendarEndDateTime = (event: SSBCalendarEvent): Date | null => {
    if (!event.endDate || !event.endTime) {
      // If no end date, fallback to start date
      return parseSSBCalendarStartDateTime(event);
    }

    try {
      const dateParts = event.endDate.split('-');
      if (dateParts.length !== 3) return null;

      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      const day = parseInt(dateParts[0]);
      const month = monthMap[dateParts[1]];
      const year = parseInt(dateParts[2]);

      const timeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return null;

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return new Date(year, month, day, hours, minutes);
    } catch (error) {
      return null;
    }
  };

  // Helper to generate unique ID from event fields
  const generateUniqueEventId = (event: SSBCalendarEvent): string => {
    const fields = [
      event.batch || '',
      event.eventType || '',
      event.eventName || '',
      event.startDate || '',
      event.startTime || '',
      event.eventId || ''
    ];

    // Take last 4 chars of each field and combine
    const uniqueParts = fields
      .map(field => field.toString().slice(-4).replace(/[^a-zA-Z0-9]/g, ''))
      .filter(part => part.length > 0)
      .join('-');

    return `ssb-cal-${uniqueParts}`;
  };

  // Convert SSB Calendar Events to DisplayItems
  const convertCalendarEventToDisplayItem = (event: SSBCalendarEvent): DisplayItem | null => {
    const parseEventDateTime = (dateStr: string, timeStr: string): Date | null => {
      try {
        if (!dateStr || !timeStr) return null;

        const dateParts = dateStr.split('-');
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        if (dateParts.length !== 3) return null;

        const day = parseInt(dateParts[0]);
        const month = monthMap[dateParts[1]];
        const year = parseInt(dateParts[2]);

        if (isNaN(day) || month === undefined || isNaN(year)) return null;

        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeMatch) return null;

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const dateObj = new Date(year, month, day, hours, minutes);
        if (isNaN(dateObj.getTime())) return null;

        return dateObj;
      } catch (error) {
        return null;
      }
    };

    const startDate = parseEventDateTime(event.startDate, event.startTime);
    const endDate = parseEventDateTime(event.endDate, event.endTime);

    if (!startDate || !endDate) return null;

    // Determine status
    const now = new Date();
    let status = 'Upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'Active';
    } else if (now > endDate) {
      status = 'Expired';
    }

    // Determine category based on event type
    let category = 'SSB EVENT';
    const type = event.eventType.toLowerCase();
    if (type.includes('session')) category = 'SSB SESSION';
    else if (type.includes('assessment') || type.includes('quiz')) category = 'SSB ASSESSMENT';
    else if (type.includes('others') || type.includes('other')) category = 'SSB OTHERS';

    return {
      id: generateUniqueEventId(event), // Generate unique ID from multiple fields
      title: event.eventName,
      subTitle: event.eventType,
      startDateTime: startDate.toISOString(),
      category,
      status,
      eventType: event.eventType,
      eventTitle: event.eventName,
      location: event.location,
      fileURL: event.link,
      content: event.description
    };
  };

  // Helper function to check if student email is in attendees list
  const isStudentInAttendees = (attendees: string | undefined, studentEmail: string): boolean => {
    if (!attendees || !studentEmail) return false;
    // Split by comma and trim whitespace, then check if student email exists
    const attendeeList = attendees.split(',').map(email => email.trim().toLowerCase());
    return attendeeList.includes(studentEmail.toLowerCase());
  };

  // Filter SSB calendar events for live/upcoming within 72 hours
  const ssbCalendarItems = ssbCalendarEvents
    .filter(event => {
      // If Student Level Show is "Yes", only show if student email is in attendees
      if (event.studentLevelShow === 'Yes') {
        return user?.email && isStudentInAttendees(event.attendees, user.email);
      }
      // Otherwise, show to all students
      return true;
    })
    .map(convertCalendarEventToDisplayItem)
    .filter((item): item is DisplayItem => {
      if (!item) return false;
      if (!item.startDateTime) return false;
      if (!isWithin72Hours(item.startDateTime)) return false;
      return item.status === 'Active' || item.status === 'Upcoming';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

  // Filter management events for live/upcoming within 72 hours
  const managementEventItems = managementEvents
    .filter(item => {
      if (!item.startDateTime) return false;
      if (!isWithin72Hours(item.startDateTime)) return false;
      return item.status === 'Active' || item.status === 'Upcoming';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

  // Combine all sources and sort by start time (chronologically)
  // This ensures all types of items are mixed based on when they happen, not by source priority
  // NOTE: Removed Zoom Live sessions (liveSessionItem and upcomingSessionItems) since they lead to Sessions tab
  const liveAndUpcomingItems = [
    ...ssbCalendarItems,
    ...managementEventItems,
    ...contentItems
  ]
    .sort((a, b) => {
      // First, prioritize live items
      const aIsLive = a.status === 'Active';
      const bIsLive = b.status === 'Active';
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Then sort by start time
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 10);

  // Helper to combine date and time for checking 72-hour window
  const getCombinedDateTime = (session: Session): string => {
    if (!session.date || !session.startTime) {
      return session.startTime || session.date || '';
    }

    // Check if date is in ISO format (from recordings) or DD-MMM-YYYY format (from live sessions)
    try {
      // Try parsing as ISO date first (recordings format)
      const isoDate = new Date(session.date);
      if (!isNaN(isoDate.getTime()) && session.date.includes('T')) {
        // It's an ISO date, format it to DD/MM/YYYY
        const day = isoDate.getDate().toString().padStart(2, '0');
        const month = (isoDate.getMonth() + 1).toString().padStart(2, '0');
        const year = isoDate.getFullYear();
        return `${day}/${month}/${year} ${session.startTime}`;
      }
    } catch (error) {
      // Not an ISO date, continue with DD-MMM-YYYY parsing
    }

    // Parse DD-MMM-YYYY format (live sessions format)
    const dateParts = session.date.split('-');
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    if (dateParts.length === 3) {
      const day = dateParts[0];
      const month = monthMap[dateParts[1]] || '01';
      const year = dateParts[2];
      return `${day}/${month}/${year} ${session.startTime}`;
    }

    return session.startTime || session.date || '';
  };

  // Recent Postings: Items that ended within last 7 days
  const recentRecordingItems = recordings
    .filter(r => endedWithinLast7Days(r))
    .sort((a, b) => {
      const dateA = parseDate(getCombinedDateTime(a));
      const dateB = parseDate(getCombinedDateTime(b));
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    })
    .map(r => ({
      id: r.sessionId,
      title: r.topic || r.sessionName,
      subTitle: `${r.batch || ''} ${r.subject || ''}`.trim(),
      startDateTime: getCombinedDateTime(r),
      createdAt: getCombinedDateTime(r),
      category: 'RECORDING',
      status: 'Completed',
      session: r
    }));

  const otherRecentContent = dashboardData.content
    .filter(item => {
      if (item.category === 'STUDENTS CORNER') return false;
      return endedWithinLast7Days(item);
    })
    .sort((a, b) => {
      const dateA = parseDate(a.createdAt || a.startDateTime);
      const dateB = parseDate(b.createdAt || b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  // Filter management events for recent postings (ended within last 7 days, ONLY past/expired events)
  const recentManagementEvents = managementEvents
    .filter(item => {
      // Only show expired/completed events in Recent Postings
      if (item.status === 'Active' || item.status === 'Upcoming') return false;
      return endedWithinLast7Days(item);
    })
    .sort((a, b) => {
      const dateA = parseDate(a.endDateTime || a.createdAt || a.startDateTime);
      const dateB = parseDate(b.endDateTime || b.createdAt || b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  // Filter SSB Calendar events for recent postings (ended within last 7 days, ONLY past/expired events)
  const recentSSBCalendarEvents = ssbCalendarEvents
    .filter(event => {
      // If Student Level Show is "Yes", only show if student email is in attendees
      if (event.studentLevelShow === 'Yes') {
        if (!user?.email || !isStudentInAttendees(event.attendees, user.email)) {
          return false;
        }
      }

      const now = new Date();
      const endDate = parseSSBCalendarEndDateTime(event);
      if (!endDate) return false;

      // Only show events that have ended
      if (now <= endDate) return false;

      // Check if ended within last 7 days
      const daysDiff = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    })
    .map(event => {
      const startDate = parseSSBCalendarStartDateTime(event);
      const endDate = parseSSBCalendarEndDateTime(event);

      return {
        id: generateUniqueEventId(event),
        title: event.eventName,
        subTitle: event.eventType,
        startDateTime: startDate?.toISOString() || '',
        endDateTime: endDate?.toISOString() || '',
        createdAt: startDate?.toISOString() || '',
        category: event.eventType.toLowerCase().includes('session') ? 'SSB SESSION' : 'SSB EVENT',
        status: 'Expired',
        location: event.location,
        fileURL: event.link,
        content: event.description
      };
    })
    .sort((a, b) => {
      const dateA = parseDate(a.endDateTime || a.startDateTime);
      const dateB = parseDate(b.endDateTime || b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  let recentPostings = [...recentRecordingItems, ...recentManagementEvents, ...recentSSBCalendarEvents, ...otherRecentContent].slice(0, 10);

  // Fallback: If no items within last 7 days, show recent items without time restriction
  if (recentPostings.length === 0) {
    const fallbackRecordingItems = recordings.slice(0, 2).map(r => ({
      id: r.sessionId,
      title: r.topic || r.sessionName,
      subTitle: `${r.batch || ''} ${r.subject || ''}`.trim(),
      startDateTime: getCombinedDateTime(r),
      createdAt: getCombinedDateTime(r),
      category: 'RECORDING',
      status: 'Completed',
      session: r
    }));

    const fallbackOtherContent = dashboardData.content
      .filter(item => {
        if (item.category === 'STUDENTS CORNER') return false;
        return !!(item.startDateTime || item.createdAt);
      })
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt || a.startDateTime);
        const dateB = parseDate(b.createdAt || b.startDateTime);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    const fallbackManagementEvents = managementEvents
      .filter(item => {
        // Only show expired/completed events in Recent Postings fallback
        if (item.status === 'Active' || item.status === 'Upcoming') return false;
        return !!(item.startDateTime || item.createdAt);
      })
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt || a.startDateTime);
        const dateB = parseDate(b.createdAt || b.startDateTime);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    recentPostings = [...fallbackRecordingItems, ...fallbackManagementEvents, ...fallbackOtherContent].slice(0, 10);
  }

  // Navigation handler based on category
  const handleItemClick = (item: DisplayItem) => {
    switch (item.category) {
      case 'SESSIONS':
      case 'SSB SESSION':
        // Navigate to Live & Upcoming tab (default)
        navigate('/sessions');
        break;
      case 'RECORDING':
        // Navigate to Recordings tab
        navigate('/sessions?tab=recordings');
        break;
      case 'EVENTS':
      case 'SSB EVENT':
      case 'SSB ASSESSMENT':
      case 'SSB OTHERS':
        navigate('/calendar');
        break;
      case 'ANNOUNCEMENTS':
        navigate('/announcements');
        break;
      case 'ASSIGNMENTS & TASKS':
        navigate('/assignments');
        break;
      case 'STUDENTS CORNER':
        navigate('/students-corner');
        break;
      case 'POLICY & DOCUMENTS':
        navigate('/policies');
        break;
      default:
        navigate('/overview');
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Not Started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions and Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              className="w-full flex items-center p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/assignments')}
            >
              <ClipboardList className="mr-3 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">View All Assignments</p>
                <p className="text-xs text-muted-foreground">Manage your tasks</p>
              </div>
            </button>
            <button 
              className="w-full flex items-center p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/resources')}
            >
              <FolderOpen className="mr-3 h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Browse Resources</p>
                <p className="text-xs text-muted-foreground">Study materials</p>
              </div>
            </button>
            <button 
              className="w-full flex items-center p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="mr-3 h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Check Calendar</p>
                <p className="text-xs text-muted-foreground">Upcoming events</p>
              </div>
            </button>
            <button 
              className="w-full flex items-center p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/students-corner')}
            >
              <Users className="mr-3 h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Students Corner</p>
                <p className="text-xs text-muted-foreground">Community activities</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Live & Upcoming Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Live & Upcoming Items
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60 overflow-y-auto space-y-4">
            {liveAndUpcomingItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-4 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                  item.status === 'Active'
                    ? 'bg-green-500/10 dark:bg-green-500/20 border-green-500/50 dark:border-green-500/60'
                    : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {item.category === 'SESSIONS' || item.category === 'RECORDING' || item.category === 'SSB SESSION' ? (
                      <Video className="h-5 w-5 text-blue-600" />
                    ) : item.category === 'EVENTS' || item.category === 'SSB EVENT' ? (
                      <Calendar className="h-5 w-5 text-purple-600" />
                    ) : item.category === 'SSB ASSESSMENT' ? (
                      <ClipboardList className="h-5 w-5 text-orange-600" />
                    ) : item.category === 'SSB OTHERS' ? (
                      <Calendar className="h-5 w-5 text-gray-600" />
                    ) : item.category === 'ANNOUNCEMENTS' ? (
                      <Megaphone className="h-5 w-5 text-blue-600" />
                    ) : item.category === 'ASSIGNMENTS & TASKS' ? (
                      <ClipboardList className="h-5 w-5 text-green-600" />
                    ) : item.category === 'STUDENTS CORNER' && ('eventType' in item) && item.eventType === 'MENTION' ? (
                      <AtSign className="h-5 w-5 text-red-600" />
                    ) : item.category === 'STUDENTS CORNER' ? (
                      <Users className="h-5 w-5 text-orange-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium">
                      {item.category === 'SESSIONS' || item.category === 'RECORDING'
                        ? item.title
                        : item.category === 'EVENTS' && 'eventTitle' in item
                        ? (item.eventTitle || ('eventType' in item ? item.eventType : '') || item.title)
                        : item.category === 'POLICY & DOCUMENTS' && 'policyName' in item
                        ? (item.policyName || item.title)
                        : item.title}
                    </p>
                    {item.category === 'POLICY & DOCUMENTS' ? (
                      <Badge variant="outline" className="bg-purple-500 text-white border-0 text-xs">
                        NEW
                      </Badge>
                    ) : item.status === 'Active' ? (
                      <Badge variant="outline" className="bg-green-500 text-white border-0 animate-pulse text-xs">
                        LIVE NOW
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500 text-white border-0 text-xs">
                        UPCOMING
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.subTitle}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.startDateTime)}
                    </span>
                    {'groups' in item && item.groups && (
                      <span className="text-xs text-muted-foreground">
                        {item.groups}
                      </span>
                    )}
                    {item.location && (
                      // Check if location is a URL
                      item.location.startsWith('http://') || item.location.startsWith('https://') ? (
                        <a
                          href={item.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Link
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground flex items-center font-medium">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location: {item.location}
                        </span>
                      )
                    )}
                    {item.fileURL && (
                      <a
                        href={item.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Link
                      </a>
                    )}
                  </div>
                </div>
                <Badge variant="outline">
                  {item.category === 'RECORDING' ? 'Recording' : item.category === 'SESSIONS' ? 'Sessions' : item.category}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Postings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Recent Postings
            <span className="ml-2 text-sm font-normal text-muted-foreground">(Latest Activity)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {recentPostings.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {item.category === 'SESSIONS' || item.category === 'RECORDING' ? (
                      <Video className="h-4 w-4 text-red-600" />
                    ) : item.category === 'EVENTS' ? (
                      <Calendar className="h-4 w-4 text-purple-600" />
                    ) : item.category === 'ANNOUNCEMENTS' ? (
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    ) : item.category === 'ASSIGNMENTS & TASKS' ? (
                      <ClipboardList className="h-4 w-4 text-green-600" />
                    ) : item.category === 'STUDENTS CORNER' && ('eventType' in item) && item.eventType === 'MENTION' ? (
                      <AtSign className="h-4 w-4 text-red-600" />
                    ) : item.category === 'STUDENTS CORNER' ? (
                      <Users className="h-4 w-4 text-orange-600" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {item.category === 'SESSIONS' || item.category === 'RECORDING'
                        ? item.title
                        : item.category === 'EVENTS' && 'eventTitle' in item
                        ? (item.eventTitle || ('eventType' in item ? item.eventType : '') || item.title)
                        : item.category === 'POLICY & DOCUMENTS' && 'policyName' in item
                        ? (item.policyName || item.title)
                        : item.title}
                    </h4>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.subTitle}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.category === 'RECORDING' ? 'Recording' : item.category === 'SESSIONS' ? 'Sessions' : item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt || item.startDateTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;