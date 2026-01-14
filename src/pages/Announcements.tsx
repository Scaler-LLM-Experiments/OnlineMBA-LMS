import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ListSkeleton } from '../components/ui/loading-skeletons';
import { 
  Megaphone, 
  Filter, 
  Search, 
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Bell,
  X,
  ExternalLink,
  MapPin,
  Users,
  FileText
} from 'lucide-react';
import { apiService, type DashboardData, type ContentItem, type ContentItemWithAck } from '../services/api';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime, parseDate } from '../utils/dateUtils';
import { SSBCalendarEvent } from '../types';
import { api as zoomApiService } from '../zoom/services/api';
import { useActivityTracker } from '../hooks/useActivityTracker';

// Countdown Timer Hook
const useCountdown = (targetDate: string | null) => {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setCountdown('Event has started!');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
};

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<ContentItemWithAck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItemWithAck | null>(null);
  const [showModal, setShowModal] = useState(false);
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Announcements');
  }, [trackPageView]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

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

  // Helper function to convert SSBCalendarEvent to ContentItemWithAck
  const convertSSBEventToContentItem = (event: SSBCalendarEvent): ContentItemWithAck | null => {
    // Parse date from DD-MMM-YYYY format and time to create DateTime objects
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

        // Parse time (format: "2:00 PM" or "14:00")
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

    // Skip events with invalid dates
    if (!startDate || !endDate) return null;

    // Determine status based on dates
    const now = new Date();
    let status = 'Upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'Active';
    } else if (now > endDate) {
      status = 'Expired';
    }

    // Determine category based on event type
    const getCategoryFromEventType = (eventType: string): string => {
      const type = eventType.toLowerCase();
      if (type.includes('session')) return 'SSB SESSION';
      if (type.includes('assessment') || type.includes('quiz')) return 'SSB ASSESSMENT';
      if (type.includes('event')) return 'SSB EVENT';
      if (type.includes('others') || type.includes('other')) return 'SSB OTHERS';
      return 'EVENTS'; // Default to standard EVENTS category
    };

    return {
      id: generateUniqueEventId(event), // Generate unique ID from multiple fields
      title: event.eventName,
      subTitle: event.description || `${event.startTime} - ${event.endTime}`,
      content: event.description || '',
      category: getCategoryFromEventType(event.eventType),
      eventType: event.eventType,
      eventTitle: event.eventName,
      status,
      priority: 'Medium',
      targetBatch: event.batch,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      createdAt: event.updatedAt || new Date().toISOString(),
      requiresAcknowledgment: false,
      hasFiles: false,
      isNew: event.updated === 'Yes',
      daysUntilDeadline: null,
      isAcknowledged: false,
      eventLocation: undefined,
      eventAgenda: undefined,
      speakerInfo: undefined,
      driveLink: event.link || undefined,
    };
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      if (!user?.email) {
        toast.error('No user email found');
        return;
      }

      // Get student batch for filtering
      let studentBatch: string | undefined;
      try {
        const studentResult = await zoomApiService.getStudent(user.email);
        if (studentResult.success && studentResult.data?.student) {
          studentBatch = studentResult.data.student.batch;
          console.log('Announcements: Student batch:', studentBatch);
        }
      } catch (err) {
        console.warn('Announcements: Could not fetch student batch:', err);
      }

      // Fetch dashboard data, SSB calendar events, and events from Events & Announcements Management sheet in parallel
      const [dashboardResult, calendarResult, eventsResult] = await Promise.all([
        apiService.getStudentDashboard(user.email),
        zoomApiService.getCalendarEvents(studentBatch),
        apiService.getEvents(user.email, { status: 'Published', publish: 'Yes' })
      ]);

      if (!dashboardResult.success) {
        toast.error(`Error: ${dashboardResult.error || 'Unknown error'}`);
        return;
      }

      let allItems: ContentItemWithAck[] = [];

      // Filter for both announcements and events from dashboard
      const announcementItems = dashboardResult.data!.content.filter(item =>
        item.category === 'ANNOUNCEMENTS' || item.category === 'EVENTS'
      ) as ContentItemWithAck[];

      allItems = [...announcementItems];

      // Add events from Events & Announcements Management sheet
      if (eventsResult.success && eventsResult.data) {
        console.log('🎯 [STUDENT ANNOUNCEMENTS] Events from Management sheet:', eventsResult.data.length);
        console.log('🎯 [STUDENT ANNOUNCEMENTS] Raw event data:', eventsResult.data);

        const managementEventItems: ContentItemWithAck[] = eventsResult.data.map(event => {
          console.log('🎯 [STUDENT ANNOUNCEMENTS] Processing event:', event.id, 'Title:', event.title);
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
            createdAt: startDate, // Use start date for sorting
            startDateTime: startDate,
            endDateTime: endDate,
            requiresAcknowledgment: event.requiresAcknowledgement === 'Yes',
            isAcknowledged: false,
            hasFiles: (event.files && event.files.length > 0) || false,
            isNew: !hasEnded && (now.getTime() - start.getTime()) < 7 * 24 * 60 * 60 * 1000, // New if within last 7 days
            daysUntilDeadline: 0,
            // Additional fields from EventData
            location: event.location,
            agenda: event.agenda,
            speakerInfo: event.speakerInfo,
            displayInCalendar: event.displayInCalendar,
            files: event.files,
            urls: event.urls,
            coverImageUrl: event.coverImageUrl
          };
        });

        allItems = [...allItems, ...managementEventItems];
        console.log('🎯 [STUDENT ANNOUNCEMENTS] Added events from management sheet:', managementEventItems.length);
      }

      // Add SSB calendar events where eventType contains "Event"
      if (calendarResult.success && calendarResult.data?.events) {
        console.log('Announcements: SSB calendar events found:', calendarResult.data.events.length);

        // Helper to check if student email is in attendees list
        const isStudentInAttendees = (attendees: string | undefined, studentEmail: string): boolean => {
          if (!attendees || !studentEmail) return false;
          const attendeeList = attendees.split(',').map(email => email.trim().toLowerCase());
          return attendeeList.includes(studentEmail.toLowerCase());
        };

        // Filter events where eventType contains "Event" and apply Student Level Show filtering
        const eventTypeEvents = calendarResult.data.events.filter(event => {
          // First check if eventType contains "Event"
          if (!event.eventType || !event.eventType.toLowerCase().includes('event')) {
            return false;
          }

          // If Student Level Show is "Yes", only show if student email is in attendees
          if (event.studentLevelShow === 'Yes') {
            return user?.email && isStudentInAttendees(event.attendees, user.email);
          }

          // Otherwise, show to all students
          return true;
        });

        console.log('Announcements: Events with "Event" type after filtering:', eventTypeEvents.length);

        const ssbEventItems = eventTypeEvents
          .map(convertSSBEventToContentItem)
          .filter((item): item is ContentItemWithAck => item !== null);

        allItems = [...allItems, ...ssbEventItems];
        console.log('Announcements: Valid SSB events after filtering:', ssbEventItems.length);
      } else {
        console.log('Announcements: No SSB calendar events found or error:', calendarResult.error);
      }

      // Sort by date: upcoming events first (sorted by start date ascending), then ended events (sorted by end date descending)
      const sortedItems = allItems.sort((a, b) => {
        const aStart = new Date(a.startDateTime);
        const aEnd = new Date(a.endDateTime);
        const bStart = new Date(b.startDateTime);
        const bEnd = new Date(b.endDateTime);
        const now = new Date();

        const aIsUpcoming = aStart > now;
        const bIsUpcoming = bStart > now;
        const aIsLive = aStart <= now && aEnd >= now;
        const bIsLive = bStart <= now && bEnd >= now;

        // Live events first
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;

        // Then upcoming events (sorted by start date, soonest first)
        if (aIsUpcoming && bIsUpcoming) return aStart.getTime() - bStart.getTime();
        if (aIsUpcoming && !bIsUpcoming && !bIsLive) return -1;
        if (!aIsUpcoming && bIsUpcoming && !aIsLive) return 1;

        // Finally ended events (sorted by end date, most recent first)
        return bEnd.getTime() - aEnd.getTime();
      });

      setAnnouncements(sortedItems);
      console.log('Announcements: Total items (dashboard + management + SSB events):', sortedItems.length);
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgment = async (contentId: string) => {
    if (!user?.email || acknowledgingId) return;
    
    try {
      setAcknowledgingId(contentId);
      
      const result = await apiService.submitAcknowledgment(contentId, user.email, 'Yes');
      
      if (result.success) {
        // Update the local state
        setAnnouncements(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, isAcknowledged: true, acknowledgmentTimestamp: new Date().toISOString() }
            : item
        ));
        toast.success('Acknowledged successfully');
      } else {
        toast.error(result.error || 'Failed to acknowledge');
      }
    } catch (error) {
      console.error('Error submitting acknowledgment:', error);
      toast.error('Failed to acknowledge');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const openModal = (item: ContentItemWithAck) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setShowModal(false);
  };

  const getStatusIndicator = (status: string) => {
    switch(status) {
      case 'Active': return { 
        color: 'bg-green-500', 
        badge: 'LIVE NOW', 
        pulse: true,
        textColor: 'text-green-700'
      };
      case 'Upcoming': return { 
        color: 'bg-blue-500', 
        badge: 'UPCOMING', 
        pulse: false,
        textColor: 'text-blue-700'
      };
      case 'Expired': return { 
        color: 'bg-gray-400', 
        badge: 'ENDED', 
        pulse: false,
        textColor: 'text-gray-700'
      };
      default: return { 
        color: 'bg-gray-400', 
        badge: 'DRAFT', 
        pulse: false,
        textColor: 'text-gray-700'
      };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'ANNOUNCEMENTS': return <Megaphone className="h-4 w-4 text-blue-600" />;
      case 'EVENTS': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'SSB EVENT': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'SSB SESSION': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'SSB ASSESSMENT': return <FileText className="h-4 w-4 text-orange-600" />;
      case 'SSB OTHERS': return <Bell className="h-4 w-4 text-gray-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'ANNOUNCEMENTS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EVENTS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SSB EVENT': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SSB SESSION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SSB ASSESSMENT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SSB OTHERS': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const announcementDate = new Date(date);
    const diffTime = now.getTime() - announcementDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return announcementDate.toLocaleDateString();
  };

  const filteredAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (announcement.subTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (announcement.content || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || announcement.category === categoryFilter;
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'live' && announcement.status === 'Active') ||
                           (statusFilter === 'upcoming' && announcement.status === 'Upcoming') ||
                           (statusFilter === 'ended' && announcement.status === 'Expired');
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = parseDate(a.createdAt);
      const dateB = parseDate(b.createdAt);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

  const pendingAcknowledgments = announcements.filter(a => a.requiresAcknowledgment && !a.isAcknowledged).length;
  const liveCount = announcements.filter(a => a.status === 'Active').length;
  const upcomingCount = announcements.filter(a => a.status === 'Upcoming').length;

  const AnnouncementCard = ({ announcement }: { announcement: ContentItemWithAck }) => {
    const statusInfo = getStatusIndicator(announcement.status);
    const isAcknowledging = acknowledgingId === announcement.id;

    // Get countdown for upcoming events
    const now = new Date();
    const startDate = announcement.startDateTime ? new Date(announcement.startDateTime) : null;
    const isUpcoming = startDate && startDate > now;
    const countdown = useCountdown(isUpcoming ? announcement.startDateTime : null);

    return (
      <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => openModal(announcement)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getCategoryIcon(announcement.category)}
                <CardTitle className="text-lg">{announcement.title}</CardTitle>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`${statusInfo.color} text-white border-0 ${statusInfo.pulse ? 'animate-pulse' : ''}`}
                >
                  {statusInfo.badge}
                </Badge>

                {/* Countdown Badge for Upcoming Events */}
                {isUpcoming && countdown && (
                  <Badge
                    variant="outline"
                    className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700 font-mono"
                  >
                    🕐 {countdown}
                  </Badge>
                )}
              </div>

              {/* Subtitle if exists */}
              {announcement.subTitle && (
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {announcement.subTitle}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                  {announcement.category}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                  {announcement.priority} Priority
                </Badge>
                {announcement.eventType && (
                  <Badge variant="outline">
                    {announcement.eventType}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimeAgo(announcement.createdAt)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Description */}
            {announcement.content && (
              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                {announcement.content}
              </p>
            )}

            {/* Event Details Preview */}
            <div className="space-y-2">
              {/* Time */}
              {announcement.startDateTime && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(announcement.startDateTime)}</span>
                  {announcement.endDateTime && announcement.endDateTime !== announcement.startDateTime && (
                    <span>- {formatDateTime(announcement.endDateTime).split(' ').slice(-2).join(' ')}</span>
                  )}
                </div>
              )}

              {/* Location for Events */}
              {announcement.location && announcement.category === 'EVENTS' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{announcement.location}</span>
                </div>
              )}

              {/* Speaker Info */}
              {announcement.speakerInfo && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span className="line-clamp-1">{announcement.speakerInfo}</span>
                </div>
              )}

              {/* Posted By */}
              {announcement.postedBy && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>Posted by: {announcement.postedBy}</span>
                </div>
              )}
            </div>

            {/* Acknowledgment status indicator */}
            {announcement.requiresAcknowledgment && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-700">Requires Acknowledgment</span>
                </div>
                {announcement.isAcknowledged && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Acknowledged</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <ListSkeleton items={8} showSearch={true} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{announcements.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{liveCount}</p>
                <p className="text-sm text-muted-foreground">Live Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingAcknowledgments}</p>
                <p className="text-sm text-muted-foreground">Need Action</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search announcements and events..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="ANNOUNCEMENTS">Announcements</option>
                <option value="EVENTS">Events</option>
                <option value="SSB EVENT">SSB Events</option>
                <option value="SSB SESSION">SSB Sessions</option>
                <option value="SSB ASSESSMENT">SSB Assessments</option>
                <option value="SSB OTHERS">SSB Others</option>
              </select>
              
              <select
                className="px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements and Events Feed */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Modal */}
      {showModal && selectedItem && (() => {
        // Calculate countdown for modal
        const now = new Date();
        const startDate = selectedItem.startDateTime ? new Date(selectedItem.startDateTime) : null;
        const endDate = selectedItem.endDateTime ? new Date(selectedItem.endDateTime) : null;
        const isUpcoming = startDate && startDate > now;
        const isLive = startDate && endDate && now >= startDate && now <= endDate;

        return (
          <ModalWithCountdown
            selectedItem={selectedItem}
            isUpcoming={isUpcoming || false}
            isLive={isLive || false}
            closeModal={closeModal}
            acknowledgingId={acknowledgingId}
            handleAcknowledgment={handleAcknowledgment}
          />
        );
      })()}
    </div>
  );
};

// Modal Component with Countdown
const ModalWithCountdown: React.FC<{
  selectedItem: ContentItemWithAck;
  isUpcoming: boolean;
  isLive: boolean;
  closeModal: () => void;
  acknowledgingId: string | null;
  handleAcknowledgment: (id: string) => void;
}> = ({ selectedItem, isUpcoming, isLive, closeModal, acknowledgingId, handleAcknowledgment }) => {
  const countdown = useCountdown(isUpcoming ? selectedItem.startDateTime : null);

  const getStatusIndicator = (status: string) => {
    switch(status) {
      case 'Active': return {
        color: 'bg-green-500',
        badge: 'LIVE NOW',
        pulse: true,
        textColor: 'text-green-700'
      };
      case 'Upcoming': return {
        color: 'bg-blue-500',
        badge: 'UPCOMING',
        pulse: false,
        textColor: 'text-blue-700'
      };
      case 'Expired': return {
        color: 'bg-gray-400',
        badge: 'ENDED',
        pulse: false,
        textColor: 'text-gray-700'
      };
      default: return {
        color: 'bg-gray-400',
        badge: 'DRAFT',
        pulse: false,
        textColor: 'text-gray-700'
      };
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'ANNOUNCEMENTS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EVENTS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SSB EVENT': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SSB SESSION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SSB ASSESSMENT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SSB OTHERS': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'ANNOUNCEMENTS': return <Megaphone className="h-4 w-4 text-blue-600" />;
      case 'EVENTS': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'SSB EVENT': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'SSB SESSION': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'SSB ASSESSMENT': return <FileText className="h-4 w-4 text-orange-600" />;
      case 'SSB OTHERS': return <Bell className="h-4 w-4 text-gray-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(selectedItem.category)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedItem.title}</h2>
              {selectedItem.subTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedItem.subTitle}</p>
              )}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={getCategoryColor(selectedItem.category)}>
                  {selectedItem.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getStatusIndicator(selectedItem.status).color} text-white border-0 ${getStatusIndicator(selectedItem.status).pulse ? 'animate-pulse' : ''}`}
                >
                  {getStatusIndicator(selectedItem.status).badge}
                </Badge>

                {/* Countdown Display in Modal */}
                {isUpcoming && countdown && (
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300 dark:from-orange-900/20 dark:to-red-900/20 dark:text-orange-300 dark:border-orange-700 font-mono text-base px-3 py-1"
                  >
                    🕐 Starts in: {countdown}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </Button>
        </div>

            <div className="p-6 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {/* Basic Information */}
              <div className="space-y-4">
                {selectedItem.content && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedItem.content}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Created:</span>
                      <span>{formatDateTime(selectedItem.createdAt)}</span>
                    </div>
                    
                    {selectedItem.postedBy && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Posted by:</span>
                        <span>{selectedItem.postedBy}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Priority:</span>
                      <Badge variant="outline" className={getPriorityColor(selectedItem.priority)}>
                        {selectedItem.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedItem.targetBatch && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Target Batch:</span>
                        <span>{selectedItem.targetBatch}</span>
                      </div>
                    )}
                    
                    {selectedItem.eventType && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Event Type:</span>
                        <span>{selectedItem.eventType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Specific Details */}
              {selectedItem.category === 'EVENTS' && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 mb-4">
                    <Calendar className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Event Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedItem.startDateTime && (
                      <div className="space-y-1">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Start Time:</span>
                        <p className="text-purple-600 dark:text-purple-200">{formatDateTime(selectedItem.startDateTime)}</p>
                      </div>
                    )}

                    {selectedItem.endDateTime && (
                      <div className="space-y-1">
                        <span className="font-medium text-purple-700 dark:text-purple-300">End Time:</span>
                        <p className="text-purple-600 dark:text-purple-200">{formatDateTime(selectedItem.endDateTime)}</p>
                      </div>
                    )}

                    {selectedItem.location && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="font-medium text-purple-700 dark:text-purple-300 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location:
                        </span>
                        <p className="text-purple-600 dark:text-purple-200 whitespace-pre-wrap">{selectedItem.location}</p>
                      </div>
                    )}

                    {selectedItem.agenda && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Agenda:</span>
                        <p className="text-purple-600 dark:text-purple-200 whitespace-pre-wrap">{selectedItem.agenda}</p>
                      </div>
                    )}

                    {selectedItem.speakerInfo && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="font-medium text-purple-700 dark:text-purple-300">Speaker Info:</span>
                        <p className="text-purple-600 dark:text-purple-200 whitespace-pre-wrap">{selectedItem.speakerInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Files and Links */}
              {(selectedItem.files && selectedItem.files.length > 0) || (selectedItem.urls && selectedItem.urls.length > 0) || selectedItem.fileURL || selectedItem.driveLink || selectedItem.sheetsLink || selectedItem.fileuploadLink ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Related Links & Files
                  </h3>

                  <div className="space-y-2">
                    {/* New Files Array from EventData */}
                    {selectedItem.files && selectedItem.files.length > 0 && selectedItem.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.url, '_blank');
                          }}
                        >
                          Open File
                        </Button>
                      </div>
                    ))}

                    {/* New URLs Array from EventData */}
                    {selectedItem.urls && selectedItem.urls.length > 0 && selectedItem.urls.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{link.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(link.url, '_blank');
                          }}
                        >
                          Open Link
                        </Button>
                      </div>
                    ))}

                    {/* Legacy fields for backward compatibility */}
                    {selectedItem.fileURL && (
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">File Link</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(selectedItem.fileURL!, '_blank');
                          }}
                        >
                          Open File
                        </Button>
                      </div>
                    )}

                    {selectedItem.driveLink && (
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Google Drive</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(selectedItem.driveLink!, '_blank');
                          }}
                        >
                          Open Drive
                        </Button>
                      </div>
                    )}

                    {selectedItem.sheetsLink && (
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Google Sheets</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(selectedItem.sheetsLink!, '_blank');
                          }}
                        >
                          Open Sheets
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Announcement Specific Content */}
              {selectedItem.category === 'ANNOUNCEMENTS' && (
                <>
                  {selectedItem.messageDetails && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">Message Details</h3>
                      <p className="text-blue-600 dark:text-blue-200 text-sm leading-relaxed">{selectedItem.messageDetails}</p>
                    </div>
                  )}
                  
                  {selectedItem.callToAction && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                      <h3 className="text-lg font-medium text-orange-700 dark:text-orange-300 mb-2">Call to Action</h3>
                      <p className="text-orange-600 dark:text-orange-200 text-sm leading-relaxed">{selectedItem.callToAction}</p>
                    </div>
                  )}
                </>
              )}

              {/* Acknowledgment Section */}
              {selectedItem.requiresAcknowledgment && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Acknowledgment Required</h3>
                        <p className="text-blue-600 dark:text-blue-200 text-sm">Please acknowledge that you have read and understood this {selectedItem.category.toLowerCase()}.</p>
                      </div>
                    </div>
                    
                    {selectedItem.isAcknowledged ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <div className="text-right">
                          <p className="font-medium">Acknowledged</p>
                          {selectedItem.acknowledgmentTimestamp && (
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(selectedItem.acknowledgmentTimestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledgment(selectedItem.id);
                        }}
                        disabled={acknowledgingId === selectedItem.id}
                      >
                        {acknowledgingId === selectedItem.id ? 'Acknowledging...' : 'Acknowledge'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
  );
};

export default Announcements;