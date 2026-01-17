import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CalendarSkeleton } from '../components/ui/loading-skeletons';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  ClipboardList,
  Bell,
  FileText,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ContentItem } from '../services/api';
import { formatDate, formatDateTime as formatDateTimeUtil, formatTime, parseDate } from '../utils/dateUtils';
import { Session, SSBCalendarEvent } from '../types';
import { api as zoomApiService } from '../zoom/services/api';
import { useActivityTracker } from '../hooks/useActivityTracker';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Calendar');
  }, [trackPageView]);

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper function to convert Session to ContentItem
  const convertSessionToContentItem = (session: Session): ContentItem | null => {
    // Parse date from DD-MMM-YYYY format and time to create DateTime objects
    const parseSessionDateTime = (dateStr: string, timeStr: string): { start: Date; end: Date } | null => {
      try {
        if (!dateStr || !timeStr) {
          console.warn('Missing date or time for session:', session.sessionId);
          return null;
        }

        const dateParts = dateStr.split('-');
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        if (dateParts.length !== 3) {
          console.warn('Invalid date format for session:', session.sessionId, dateStr);
          return null;
        }

        const day = parseInt(dateParts[0]);
        const month = monthMap[dateParts[1]];
        const year = parseInt(dateParts[2]);

        if (isNaN(day) || month === undefined || isNaN(year)) {
          console.warn('Invalid date values for session:', session.sessionId, { day, month, year });
          return null;
        }

        // Parse time (format: "2:00 PM" or "14:00")
        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeMatch) {
          console.warn('Invalid time format for session:', session.sessionId, timeStr);
          return null;
        }

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const startDate = new Date(year, month, day, hours, minutes);

        // Validate the date is valid
        if (isNaN(startDate.getTime())) {
          console.warn('Invalid date object for session:', session.sessionId, { year, month, day, hours, minutes });
          return null;
        }

        // Calculate end time by adding duration
        const durationMinutes = typeof session.duration === 'string' ? parseInt(session.duration) : session.duration;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        return { start: startDate, end: endDate };
      } catch (error) {
        console.error('Error parsing session date/time:', error, session);
        return null;
      }
    };

    const dateTimes = parseSessionDateTime(session.date || '', session.startTime || '');

    // Skip sessions with invalid dates
    if (!dateTimes) {
      console.warn('Skipping session with invalid date/time:', session.sessionId, session.sessionName);
      return null;
    }

    const startDateTime = dateTimes.start.toISOString();
    const endDateTime = dateTimes.end.toISOString();

    return {
      id: session.sessionId,
      title: session.subject || session.topic || 'Class Session',
      subTitle: session.sessionName || session.topic,
      content: `${session.startTime || ''} • Duration: ${session.duration} min`,
      category: 'SESSIONS',
      eventType: 'SESSION',
      status: session.status || 'scheduled',
      priority: 'Medium',
      subject: session.subject,
      domain: session.domain,
      targetBatch: session.batch,
      term: session.term,
      startDateTime,
      endDateTime,
      createdAt: new Date().toISOString(),
      requiresAcknowledgment: false,
      hasFiles: false,
      isNew: false,
      daysUntilDeadline: null
    };
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

  // Helper function to convert SSBCalendarEvent to ContentItem
  const convertCalendarEventToContentItem = (event: SSBCalendarEvent): ContentItem | null => {
    // Parse date from DD-MMM-YYYY format and time to create DateTime objects
    const parseEventDateTime = (dateStr: string, timeStr: string): Date | null => {
      try {
        if (!dateStr || !timeStr) {
          console.warn('Missing date or time for event:', event.eventId);
          return null;
        }

        const dateParts = dateStr.split('-');
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        if (dateParts.length !== 3) {
          console.warn('Invalid date format for event:', event.eventId, dateStr);
          return null;
        }

        const day = parseInt(dateParts[0]);
        const month = monthMap[dateParts[1]];
        const year = parseInt(dateParts[2]);

        if (isNaN(day) || month === undefined || isNaN(year)) {
          console.warn('Invalid date values for event:', event.eventId, { day, month, year });
          return null;
        }

        // Parse time (format: "2:00 PM" or "14:00")
        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeMatch) {
          console.warn('Invalid time format for event:', event.eventId, timeStr);
          return null;
        }

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const dateObj = new Date(year, month, day, hours, minutes);

        // Validate the date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date object for event:', event.eventId, { year, month, day, hours, minutes });
          return null;
        }

        return dateObj;
      } catch (error) {
        console.error('Error parsing event date/time:', error, event);
        return null;
      }
    };

    const startDate = parseEventDateTime(event.startDate, event.startTime);
    const endDate = parseEventDateTime(event.endDate, event.endTime);

    // Skip events with invalid dates
    if (!startDate || !endDate) {
      console.warn('Skipping event with invalid date/time:', event.eventId, event.eventName);
      return null;
    }

    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    // Determine category based on event type
    const getCategoryFromEventType = (eventType: string): string => {
      const type = eventType.toLowerCase();
      if (type.includes('session')) return 'SSB SESSION';
      if (type.includes('assessment') || type.includes('quiz')) return 'SSB ASSESSMENT';
      if (type.includes('event')) return 'SSB EVENT';
      if (type.includes('others') || type.includes('other')) return 'SSB OTHERS';
      return 'SSB EVENT'; // Default to event
    };

    return {
      id: generateUniqueEventId(event), // Generate unique ID from multiple fields
      title: event.eventName,
      subTitle: event.eventType || '',
      content: event.description || `${event.startTime} - ${event.endTime}`,
      category: getCategoryFromEventType(event.eventType),
      eventType: event.eventType || 'EVENT',
      status: 'scheduled',
      priority: 'Medium',
      subject: event.eventType,
      domain: undefined,
      targetBatch: event.batch,
      term: undefined,
      startDateTime,
      endDateTime,
      createdAt: new Date().toISOString(),
      requiresAcknowledgment: false,
      hasFiles: false,
      isNew: event.updated === 'Yes', // Mark as "new" if updated
      daysUntilDeadline: null
    };
  };

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        console.log('Fetching schedule for user:', user.email);

        // Get student batch for filtering
        let studentBatch: string | undefined;
        try {
          const studentResult = await zoomApiService.getStudent(user.email);
          if (studentResult.success && studentResult.data?.student) {
            studentBatch = studentResult.data.student.batch;
            console.log('Calendar: Student batch:', studentBatch);
          }
        } catch (err) {
          console.warn('Calendar: Could not fetch student batch, showing all events:', err);
        }

        // Fetch Zoom sessions and SSB calendar events in parallel
        const [zoomResult, calendarResult] = await Promise.all([
          zoomApiService.getSessions(),
          zoomApiService.getCalendarEvents(studentBatch)
        ]);

        let allItems: ContentItem[] = [];

        // Add Zoom Live sessions
        if (zoomResult.success && zoomResult.data?.sessions) {
          console.log('Calendar: Zoom sessions found:', zoomResult.data.sessions.length);
          const sessionItems = zoomResult.data.sessions
            .map(convertSessionToContentItem)
            .filter((item): item is ContentItem => item !== null);
          allItems = [...allItems, ...sessionItems];
          console.log('Calendar: Valid sessions after filtering:', sessionItems.length);
        } else {
          console.log('Calendar: No Zoom sessions found or error:', zoomResult.error);
        }

        // Add SSB calendar events
        if (calendarResult.success && calendarResult.data?.events) {
          console.log('Calendar: SSB calendar events found:', calendarResult.data.events.length);

          // Helper to check if student email is in attendees list
          const isStudentInAttendees = (attendees: string | undefined, studentEmail: string): boolean => {
            if (!attendees || !studentEmail) return false;
            const attendeeList = attendees.split(',').map(email => email.trim().toLowerCase());
            return attendeeList.includes(studentEmail.toLowerCase());
          };

          // Filter events based on Student Level Show
          const filteredEvents = calendarResult.data.events.filter(event => {
            // If Student Level Show is "Yes", only show if student email is in attendees
            if (event.studentLevelShow === 'Yes') {
              return user?.email && isStudentInAttendees(event.attendees, user.email);
            }
            // Otherwise, show to all students
            return true;
          });

          const calendarItems = filteredEvents
            .map(convertCalendarEventToContentItem)
            .filter((item): item is ContentItem => item !== null);
          allItems = [...allItems, ...calendarItems];
          console.log('Calendar: Valid calendar events after filtering:', calendarItems.length);
        } else {
          console.log('Calendar: No SSB calendar events found or error:', calendarResult.error);
        }

        console.log('Calendar: Total items (sessions + events):', allItems.length);
        console.log('Calendar: Available categories:', Array.from(new Set(allItems.map(item => item.category))));

        setScheduleItems(allItems);
        setFilteredItems(allItems);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Error loading schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  // Filter effect
  useEffect(() => {
    let filtered = scheduleItems;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(item => item.domain === domainFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort filtered items by start date/time (earliest first)
    filtered.sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredItems(filtered);
  }, [scheduleItems, searchTerm, statusFilter, domainFilter, categoryFilter]);

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDate = firstDayOfMonth.getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get category-specific styling
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SESSIONS': return <Video className="h-5 w-5" />;
      case 'SSB EVENT': return <CalendarIcon className="h-5 w-5" />;
      case 'SSB SESSION': return <Video className="h-5 w-5" />;
      case 'SSB ASSESSMENT': return <ClipboardList className="h-5 w-5" />;
      case 'SSB OTHERS': return <Bell className="h-5 w-5" />;
      case 'CLASS/SESSION SCHEDULE': return <GraduationCap className="h-5 w-5" />;
      case 'ASSIGNMENTS & TASKS': return <ClipboardList className="h-5 w-5" />;
      case 'Events & Announcements': return <Bell className="h-5 w-5" />;
      case 'EVENTS': return <Bell className="h-5 w-5" />;
      case 'ANNOUNCEMENTS': return <Bell className="h-5 w-5" />;
      case 'FORMS': return <FileText className="h-5 w-5" />;
      case 'Resource': return <BookOpen className="h-5 w-5" />;
      default: return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SESSIONS': return 'text-blue-600';
      case 'SSB EVENT': return 'text-purple-600';
      case 'SSB SESSION': return 'text-blue-600';
      case 'SSB ASSESSMENT': return 'text-orange-600';
      case 'SSB OTHERS': return 'text-gray-600';
      case 'CLASS/SESSION SCHEDULE': return 'text-[#1d8f5b]';
      case 'ASSIGNMENTS & TASKS': return 'text-[#ffc300]';
      case 'Events & Announcements': return 'text-purple-600';
      case 'EVENTS': return 'text-purple-600';
      case 'ANNOUNCEMENTS': return 'text-purple-600';
      case 'FORMS': return 'text-indigo-600';
      case 'Resource': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryBgColor = (category: string) => {
    switch (category) {
      case 'SESSIONS': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'SSB EVENT': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'SSB SESSION': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'SSB ASSESSMENT': return 'bg-orange-100 dark:bg-orange-900/20';
      case 'SSB OTHERS': return 'bg-gray-100 dark:bg-gray-800';
      case 'CLASS/SESSION SCHEDULE': return 'bg-green-100 dark:bg-green-900/20';
      case 'ASSIGNMENTS & TASKS': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'Events & Announcements': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'EVENTS': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'ANNOUNCEMENTS': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'FORMS': return 'bg-indigo-100 dark:bg-indigo-900/20';
      case 'Resource': return 'bg-green-100 dark:bg-green-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // Navigation handler for calendar items
  const handleItemClick = (item: ContentItem) => {
    switch (item.category) {
      case 'SESSIONS':
        // Navigate to Sessions page (Live & Upcoming tab by default)
        navigate('/sessions');
        toast.success('Navigating to sessions');
        break;
      case 'CLASS/SESSION SCHEDULE':
        navigate('/overview'); // Classes shown on main overview page
        toast.success('Navigating to class/session schedule section');
        break;
      case 'ASSIGNMENTS & TASKS':
        navigate('/assignments');
        toast.success('Navigating to assignments and tasks section');
        break;
      case 'Events & Announcements':
      case 'EVENTS':
      case 'ANNOUNCEMENTS':
        navigate('/announcements'); // Combined events and announcements go to announcements section
        toast.success('Navigating to events and announcements section');
        break;
      case 'FORMS':
        navigate('/overview'); // Forms might be on overview or could be separate
        toast.success('Navigating to forms section');
        break;
      case 'Resource':
      case 'COURSE MATERIAL':
        // Navigate directly to the specific resource location if we have the metadata
        if (item.term && item.domain && item.subject) {
          const resourcePath = `/resources/${encodeURIComponent(item.term)}/${encodeURIComponent(item.domain)}/${encodeURIComponent(item.subject)}`;
          navigate(resourcePath);
          toast.success(`Navigating to ${item.subject} in ${item.domain}`);
        } else {
          // Fallback to general resources page if metadata is incomplete
          navigate('/resources');
          toast.success('Navigating to resources section');
        }
        break;
      default:
        navigate('/overview');
        toast.success('Navigating to overview');
        break;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    return selectedDate && 
           selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear;
  };

  const getEventsForDate = (day: number) => {
    const targetDate = new Date(currentYear, currentMonth, day);
    return filteredItems.filter(item => {
      const itemDate = parseDate(item.startDateTime);
      if (!itemDate) return false;
      return itemDate.toDateString() === targetDate.toDateString();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'Upcoming': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case 'Expired': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return { date: '', time: '' };
    const date = parseDate(dateTimeString);
    if (!date) return { date: '', time: '' };
    return {
      date: formatDate(dateTimeString),
      time: formatTime(dateTimeString)
    };
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate.getDate()) : [];
  const upcomingEvents = filteredItems
    .filter(item => {
      const itemDate = parseDate(item.startDateTime);
      if (!itemDate) return false;
      return itemDate >= today;
    })
    .sort((a, b) => {
      const dateA = parseDate(a.startDateTime);
      const dateB = parseDate(b.startDateTime);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  // Get unique values for filters
  const uniqueDomains = Array.from(new Set(scheduleItems.map(item => item.domain).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(scheduleItems.map(item => item.status).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(scheduleItems.map(item => item.category).filter(Boolean)));

  // Statistics (only Zoom sessions)
  const stats = {
    total: filteredItems.length,
    sessions: filteredItems.length, // All items are sessions
    bySubject: filteredItems.reduce((acc, item) => {
      const subject = item.subject || 'Other';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's trailing days
  for (let i = 0; i < startDate; i++) {
    const day = new Date(currentYear, currentMonth, -startDate + i + 1).getDate();
    calendarDays.push({ day, isCurrentMonth: false });
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true });
  }
  
  // Next month's leading days
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({ day, isCurrentMonth: false });
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats - Zoom Sessions Only */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{Object.keys(stats.bySubject).length}</p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-[#1d8f5b]" />
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            {/* Domain Filter */}
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            >
              <option value="all">All Domains</option>
              {uniqueDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== 'all' || domainFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Search className="h-3 w-3" />
                  <span>"{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/40"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Status: {statusFilter}</span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/40"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {domainFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Domain: {domainFilter}</span>
                  <button
                    onClick={() => setDomainFilter('all')}
                    className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/40"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {categoryFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Category: {categoryFilter}</span>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/40"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDomainFilter('all');
                  setCategoryFilter('all');
                }}
                className="ml-2 h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
          
          {/* Results Summary */}
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {scheduleItems.length} sessions
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ day, isCurrentMonth }, index) => {
                const events = isCurrentMonth ? getEventsForDate(day) : [];
                return (
                  <div
                    key={index}
                    className={`
                      p-2 min-h-[60px] border rounded-lg cursor-pointer transition-colors
                      ${isCurrentMonth ? 'hover:bg-accent' : 'text-muted-foreground bg-muted/20'}
                      ${isCurrentMonth && isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                      ${isCurrentMonth && isSelected(day) ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => isCurrentMonth && setSelectedDate(new Date(currentYear, currentMonth, day))}
                  >
                    <div className="text-sm font-medium mb-1">{day}</div>
                    <div className="space-y-1">
                      {events.slice(0, 2).map(event => {
                        const eventTime = event.startDateTime ? formatTime(event.startDateTime) : '';
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(event);
                            }}
                            className={`text-xs p-1 rounded ${getCategoryBgColor(event.category || '')} ${getCategoryColor(event.category || '')} font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                          >
                            <div className="truncate">{event.title}</div>
                            {eventTime && <div className="text-[10px] opacity-75">{eventTime}</div>}
                          </div>
                        );
                      })}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length > 0 ? (
                  <div className={`space-y-3 ${selectedDateEvents.length > 2 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
                    {selectedDateEvents.map(event => {
                      const dateTime = formatDateTime(event.startDateTime || '');
                      const endDateTime = formatDateTime(event.endDateTime || '');
                      return (
                        <div 
                          key={event.id} 
                          onClick={() => handleItemClick(event)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{event.title}</h4>
                            <div className="flex space-x-1">
                              {event.isNew && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700">
                                  Updated
                                </Badge>
                              )}
                              <Badge variant="outline" className={getStatusColor(event.status || 'Upcoming')}>
                                {event.status}
                              </Badge>
                              {event.priority && (
                                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                                  {event.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {event.subTitle && (
                            <p className="text-sm font-medium text-[#1d8f5b] mb-1">
                              {event.subTitle}
                            </p>
                          )}
                          {event.content && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.content}
                            </p>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{dateTime.time} - {endDateTime.time}</span>
                              </div>
                              {event.domain && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                  {event.domain}
                                </span>
                              )}
                            </div>
                            {event.subject && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <BookOpen className="h-4 w-4" />
                                <span>{event.subject}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {selectedDateEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center py-2 border-t">
                        Showing {selectedDateEvents.length} events - scroll to see all
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No events scheduled for this date
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-[#1d8f5b]" />
                Upcoming Events
                <span className="ml-2 text-sm font-normal text-muted-foreground">(Chronological Order)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                  const dateTime = formatDateTime(event.startDateTime || '');
                  return (
                    <div 
                      key={event.id} 
                      onClick={() => handleItemClick(event)}
                      className="flex items-start space-x-3 p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                    >
                      <div className={`flex-shrink-0 w-12 h-12 ${getCategoryBgColor(event.category || '')} rounded-lg flex items-center justify-center`}>
                        <span className={getCategoryColor(event.category || '')}>
                          {getCategoryIcon(event.category || '')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{event.title}</p>
                        {event.subTitle && (
                          <p className="text-xs text-[#1d8f5b] font-medium">{event.subTitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {dateTime.date} at {dateTime.time}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.isNew && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700">
                              Updated
                            </Badge>
                          )}
                          <Badge variant="outline" className={getStatusColor(event.status || 'Upcoming')}>
                            {event.status}
                          </Badge>
                          {event.domain && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                              {event.domain}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-muted-foreground text-center py-4">
                    No upcoming sessions scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;