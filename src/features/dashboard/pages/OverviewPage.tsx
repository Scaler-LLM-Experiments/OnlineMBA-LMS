/**
 * Overview Page
 * Online MBA - Main dashboard landing page
 * Matches original SSB Dashboard structure with Quick Actions, Live & Upcoming, Recent Postings
 */

import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FolderOpen,
  Calendar,
  TrendingUp,
  BookOpen,
  Users,
  AtSign,
  Video,
  MapPin,
  ExternalLink,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { apiService, type DashboardData, type ContentItem } from '../../../services/api';
import { api as zoomApiService } from '../../../zoom/services/api';
import { formatDateTime, parseDate } from '../../../utils/dateUtils';
import { Session, SSBCalendarEvent } from '../../../types';
import toast from 'react-hot-toast';
import { User } from '../../../core/types';

// ============================================
// Types
// ============================================

interface OverviewPageProps {
  user: User | null;
}

// Union type for display items
type DisplayItem = ContentItem | {
  id: string;
  title: string;
  subTitle: string;
  startDateTime: string;
  endDateTime?: string;
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

// ============================================
// Overview Page Component
// ============================================

export const OverviewPage = memo(function OverviewPage({ user }: OverviewPageProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [recordings, setRecordings] = useState<Session[]>([]);
  const [ssbCalendarEvents, setSsbCalendarEvents] = useState<SSBCalendarEvent[]>([]);
  const [managementEvents, setManagementEvents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) {
      loadAllData();
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([
        fetchDashboardData(),
        fetchSessionsData(),
        fetchCalendarEvents(),
        fetchManagementEvents()
      ]);

      if (showRefreshToast) {
        toast.success('Dashboard refreshed!');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (showRefreshToast) {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAllData(true);
  };

  const fetchDashboardData = async () => {
    try {
      if (!user?.email) return;

      const result = await apiService.getStudentDashboard(user.email);

      if (result.success && result.data) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Error fetching management events:', error);
    }
  };

  // ============================================
  // Helper Functions
  // ============================================

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
    return daysDiff >= 0 && daysDiff <= 5;
  };

  // Helper to check if an item ended within the last 7 days
  const endedWithinLast7Days = (item: any): boolean => {
    const now = new Date();

    if (item.endDateTime) {
      const endDate = parseDate(item.endDateTime);
      if (endDate) {
        const daysDiff = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 7;
      }
    }

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
  const convertSessionToDisplayItem = (session: Session, isLive: boolean = false): DisplayItem => {
    let combinedDateTime = '';
    if (session.date && session.startTime) {
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
      const dateParts = session.date.split('-');
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      if (dateParts.length !== 3) return false;

      const day = parseInt(dateParts[0]);
      const month = monthMap[dateParts[1]];
      const year = parseInt(dateParts[2]);

      const timeMatch = session.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const startDate = new Date(year, month, day, hours, minutes);
      const durationMinutes = typeof session.duration === 'number'
        ? session.duration
        : parseInt(String(session.duration)) || 0;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

      const now = new Date();
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.error('Error checking if session is live:', error);
      return false;
    }
  };

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

    const now = new Date();
    let status = 'Upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'Active';
    } else if (now > endDate) {
      status = 'Expired';
    }

    let category = 'SSB EVENT';
    const type = event.eventType.toLowerCase();
    if (type.includes('session')) category = 'SSB SESSION';
    else if (type.includes('assessment') || type.includes('quiz')) category = 'SSB ASSESSMENT';
    else if (type.includes('others') || type.includes('other')) category = 'SSB OTHERS';

    return {
      id: generateUniqueEventId(event),
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
    const attendeeList = attendees.split(',').map(email => email.trim().toLowerCase());
    return attendeeList.includes(studentEmail.toLowerCase());
  };

  // Helper to combine date and time for checking 72-hour window
  const getCombinedDateTime = (session: Session): string => {
    if (!session.date || !session.startTime) {
      return session.startTime || session.date || '';
    }

    try {
      const isoDate = new Date(session.date);
      if (!isNaN(isoDate.getTime()) && session.date.includes('T')) {
        const day = isoDate.getDate().toString().padStart(2, '0');
        const month = (isoDate.getMonth() + 1).toString().padStart(2, '0');
        const year = isoDate.getFullYear();
        return `${day}/${month}/${year} ${session.startTime}`;
      }
    } catch (error) {
      // Not an ISO date
    }

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

  // Navigation handler based on category
  const handleItemClick = (item: DisplayItem) => {
    switch (item.category) {
      case 'SESSIONS':
      case 'SSB SESSION':
        navigate('/sessions');
        break;
      case 'RECORDING':
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
        navigate('/assignments-platform');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'In Progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Expired': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // ============================================
  // Computed Data
  // ============================================

  // Get live and upcoming items
  const actuallyLiveSession = liveSessions.find(session => isSessionLiveNow(session));
  const liveSessionItem = actuallyLiveSession
    ? [convertSessionToDisplayItem(actuallyLiveSession, true)]
    : [];

  // Sort upcoming sessions by start time
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
      return dateA.getTime() - dateB.getTime();
    } catch (error) {
      return 0;
    }
  });

  const upcomingSessionItems = sortedUpcoming.slice(0, 2).map(s => convertSessionToDisplayItem(s, false));

  // Filter content items within 72 hours
  const contentItems = dashboardData?.content
    ?.filter(item => {
      if (!item.startDateTime) return false;
      if (item.category === 'STUDENTS CORNER') return false;

      if (item.category === 'POLICY & DOCUMENTS') {
        return isWithin5DaysFromStart(item.startDateTime);
      }

      if (!isWithin72Hours(item.startDateTime)) return false;

      return item.status === 'Active' || item.status === 'Upcoming';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    }) || [];

  // Filter SSB calendar events for live/upcoming within 72 hours
  const ssbCalendarItems = ssbCalendarEvents
    .filter(event => {
      if (event.studentLevelShow === 'Yes') {
        return user?.email && isStudentInAttendees(event.attendees, user.email);
      }
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

  // Combine all sources for Live & Upcoming section
  const liveAndUpcomingItems = [
    ...ssbCalendarItems,
    ...managementEventItems,
    ...contentItems
  ]
    .sort((a, b) => {
      const aIsLive = a.status === 'Active';
      const bIsLive = b.status === 'Active';
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 10);

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

  const otherRecentContent = dashboardData?.content
    ?.filter(item => {
      if (item.category === 'STUDENTS CORNER') return false;
      return endedWithinLast7Days(item);
    })
    .sort((a, b) => {
      const dateA = parseDate(a.createdAt || a.startDateTime);
      const dateB = parseDate(b.createdAt || b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    }) || [];

  const recentManagementEvents = managementEvents
    .filter(item => {
      if (item.status === 'Active' || item.status === 'Upcoming') return false;
      return endedWithinLast7Days(item);
    })
    .sort((a, b) => {
      const dateA = parseDate(a.endDateTime || a.createdAt || a.startDateTime);
      const dateB = parseDate(b.endDateTime || b.createdAt || b.startDateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  const recentSSBCalendarEvents = ssbCalendarEvents
    .filter(event => {
      if (event.studentLevelShow === 'Yes') {
        if (!user?.email || !isStudentInAttendees(event.attendees, user.email)) {
          return false;
        }
      }

      const now = new Date();
      const endDate = parseSSBCalendarEndDateTime(event);
      if (!endDate) return false;

      if (now <= endDate) return false;

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

  // Fallback if no items within last 7 days
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

    const fallbackOtherContent = dashboardData?.content
      ?.filter(item => {
        if (item.category === 'STUDENTS CORNER') return false;
        return !!(item.startDateTime || item.createdAt);
      })
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt || a.startDateTime);
        const dateB = parseDate(b.createdAt || b.startDateTime);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      }) || [];

    const fallbackManagementEvents = managementEvents
      .filter(item => {
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

  // ============================================
  // Loading State
  // ============================================

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Quick Actions and Live & Upcoming */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center p-3 border rounded-lg">
                  <div className="w-4 h-4 bg-muted rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-4/5 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Skeleton for Recent Postings */}
        <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center p-3 border rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-lg mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-4/5 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.batch || 'Online MBA'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Quick Actions and Live & Upcoming Items */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              className="w-full flex items-center p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/assignments-platform')}
            >
              <ClipboardList className="mr-3 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-foreground">View All Assignments</p>
                <p className="text-xs text-muted-foreground">Manage your tasks</p>
              </div>
            </button>
            <button
              className="w-full flex items-center p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/resources')}
            >
              <FolderOpen className="mr-3 h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Browse Resources</p>
                <p className="text-xs text-muted-foreground">Study materials</p>
              </div>
            </button>
            <button
              className="w-full flex items-center p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="mr-3 h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Check Calendar</p>
                <p className="text-xs text-muted-foreground">Upcoming events</p>
              </div>
            </button>
            <button
              className="w-full flex items-center p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
              onClick={() => navigate('/students-corner')}
            >
              <Users className="mr-3 h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Students Corner</p>
                <p className="text-xs text-muted-foreground">Community activities</p>
              </div>
            </button>
          </div>
        </div>

        {/* Live & Upcoming Items */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Live & Upcoming Items
          </h2>
          <div className="h-60 overflow-y-auto space-y-4">
            {liveAndUpcomingItems.length > 0 ? (
              liveAndUpcomingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-4 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    item.status === 'Active'
                      ? 'bg-green-500/10 dark:bg-green-500/20 border-green-500/50'
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
                      <p className="text-sm font-medium text-foreground">
                        {item.category === 'SESSIONS' || item.category === 'RECORDING'
                          ? item.title
                          : item.category === 'EVENTS' && 'eventTitle' in item
                          ? (item.eventTitle || ('eventType' in item ? item.eventType : '') || item.title)
                          : item.category === 'POLICY & DOCUMENTS' && 'policyName' in item
                          ? (item.policyName || item.title)
                          : item.title}
                      </p>
                      {item.category === 'POLICY & DOCUMENTS' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500 text-white">
                          NEW
                        </span>
                      ) : item.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white animate-pulse">
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                          UPCOMING
                        </span>
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground">
                    {item.category === 'RECORDING' ? 'Recording' : item.category === 'SESSIONS' ? 'Sessions' : item.category}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No live or upcoming items</p>
                <p className="text-sm text-muted-foreground">Check back later for new events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Postings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Recent Postings
          <span className="ml-2 text-sm font-normal text-muted-foreground">(Latest Activity)</span>
        </h2>
        <div className="space-y-4">
          {recentPostings.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentPostings.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
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
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {item.category === 'SESSIONS' || item.category === 'RECORDING'
                          ? item.title
                          : item.category === 'EVENTS' && 'eventTitle' in item
                          ? (item.eventTitle || ('eventType' in item ? item.eventType : '') || item.title)
                          : item.category === 'POLICY & DOCUMENTS' && 'policyName' in item
                          ? (item.policyName || item.title)
                          : item.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.subTitle}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
                        {item.category === 'RECORDING' ? 'Recording' : item.category === 'SESSIONS' ? 'Sessions' : item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt || item.startDateTime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recent postings</p>
              <p className="text-sm text-muted-foreground">Check back later for new content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default OverviewPage;
