/**
 * Announcements Page
 * Online MBA - Redesigned announcements and events feed
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  Filter,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  Bell,
  MapPin,
  Users,
  FileText,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { apiService, type ContentItemWithAck } from '../../../services/api';
import { api as zoomApiService } from '../../../zoom/services/api';
import { formatDateTime } from '../../../utils/dateUtils';
import {
  PageWrapper,
  PageHeader,
  Grid,
  EmptyState,
  LoadingState,
} from '../../../shared/components/layout/DashboardLayout';
import { Card, StatCard } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge, StatusBadge } from '../../../shared/components/ui/Badge';
import { Select } from '../../../shared/components/ui/Select';
import { Modal } from '../../../shared/components/ui/Modal';
import { SafeHtml } from '../../../shared/components/ui/SafeHtml';
import { useToast } from '../../../shared/components/ui/Toast';
import { CardSkeleton } from '../../../shared/components/ui/Skeleton';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

interface AnnouncementCardProps {
  item: ContentItemWithAck;
  onClick: () => void;
}

// ============================================
// Countdown Hook
// ============================================

function useCountdown(targetDate: string | null) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('Started!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

// ============================================
// Announcement Card Component
// ============================================

const AnnouncementCard = React.memo(function AnnouncementCard({
  item,
  onClick,
}: AnnouncementCardProps) {
  const now = new Date();
  const startDate = item.startDateTime ? new Date(item.startDateTime) : null;
  const isUpcoming = startDate && startDate > now;
  const countdown = useCountdown(isUpcoming ? item.startDateTime : null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Upcoming':
        return 'info';
      case 'Expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ANNOUNCEMENTS':
        return <Megaphone className="w-4 h-4" />;
      case 'EVENTS':
      case 'SSB EVENT':
      case 'SSB SESSION':
        return <Calendar className="w-4 h-4" />;
      case 'SSB ASSESSMENT':
        return <FileText className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Card
      hoverable
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-primary-500">
            {getCategoryIcon(item.category)}
            <span className="text-xs font-medium uppercase tracking-wider">
              {item.category.replace('SSB ', '')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {item.status === 'Active' && (
              <Badge variant="success" dot>
                Live Now
              </Badge>
            )}
            {isUpcoming && countdown && (
              <Badge variant="warning">
                {countdown}
              </Badge>
            )}
            <StatusBadge
              status={
                item.status === 'Active'
                  ? 'active'
                  : item.status === 'Upcoming'
                  ? 'pending'
                  : 'completed'
              }
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Subtitle */}
        {item.subTitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {item.subTitle}
          </p>
        )}

        {/* Content Preview */}
        {item.content && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4">
            {item.content}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          {item.startDateTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(item.startDateTime)}
            </span>
          )}
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{item.location}</span>
            </span>
          )}
          {item.speakerInfo && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{item.speakerInfo}</span>
            </span>
          )}
        </div>

        {/* Acknowledgment Indicator */}
        {item.requiresAcknowledgment && (
          <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary-600 dark:text-secondary-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Requires acknowledgment
              </span>
              {item.isAcknowledged && (
                <span className="text-xs text-success-600 dark:text-success-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Acknowledged
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

// ============================================
// Main Component
// ============================================

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState<ContentItemWithAck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ContentItemWithAck | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      // Get student batch
      let studentBatch: string | undefined;
      try {
        const studentResult = await zoomApiService.getStudent(user.email);
        if (studentResult.success && studentResult.data?.student) {
          studentBatch = studentResult.data.student.batch;
        }
      } catch {
        // Silent fail
      }

      // Fetch data in parallel
      const [dashboardResult, calendarResult, eventsResult] = await Promise.all([
        apiService.getStudentDashboard(user.email),
        zoomApiService.getCalendarEvents(studentBatch),
        apiService.getEvents(user.email, { status: 'Published', publish: 'Yes' }),
      ]);

      let allItems: ContentItemWithAck[] = [];

      // Dashboard announcements
      if (dashboardResult.success && dashboardResult.data) {
        const items = dashboardResult.data.content.filter(
          (item) => item.category === 'ANNOUNCEMENTS' || item.category === 'EVENTS'
        ) as ContentItemWithAck[];
        allItems = [...items];
      }

      // Events from management sheet
      if (eventsResult.success && eventsResult.data) {
        const eventItems: ContentItemWithAck[] = eventsResult.data.map((event) => ({
          id: event.id || '',
          category: event.categoryType === 'ANNOUNCEMENTS' ? 'ANNOUNCEMENTS' : 'EVENTS',
          eventType: event.eventType || event.announcementType || '',
          title: event.title || 'Untitled Event',
          subTitle: event.subtitle || '',
          content: event.description || '',
          priority: event.priority || 'Medium',
          status: determineStatus(event.startDateTime, event.endDateTime),
          postedBy: event.postedBy || '',
          createdAt: event.startDateTime || '',
          startDateTime: event.startDateTime || '',
          endDateTime: event.endDateTime || '',
          requiresAcknowledgment: event.requiresAcknowledgement === 'Yes',
          isAcknowledged: false,
          hasFiles: (event.files && event.files.length > 0) || false,
          isNew: false,
          daysUntilDeadline: 0,
          location: event.location,
          agenda: event.agenda,
          speakerInfo: event.speakerInfo,
          files: event.files,
          urls: event.urls,
        }));
        allItems = [...allItems, ...eventItems];
      }

      // Sort: Live > Upcoming > Ended
      const sorted = allItems.sort((a, b) => {
        const aStart = new Date(a.startDateTime || 0);
        const bStart = new Date(b.startDateTime || 0);
        const now = new Date();

        const aIsLive = a.status === 'Active';
        const bIsLive = b.status === 'Active';
        const aIsUpcoming = a.status === 'Upcoming';
        const bIsUpcoming = b.status === 'Upcoming';

        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        return aStart.getTime() - bStart.getTime();
      });

      setAnnouncements(sorted);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [user?.email, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'live' && item.status === 'Active') ||
        (statusFilter === 'upcoming' && item.status === 'Upcoming') ||
        (statusFilter === 'ended' && item.status === 'Expired');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [announcements, searchTerm, categoryFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: announcements.length,
    live: announcements.filter((a) => a.status === 'Active').length,
    upcoming: announcements.filter((a) => a.status === 'Upcoming').length,
    pending: announcements.filter((a) => a.requiresAcknowledgment && !a.isAcknowledged).length,
  }), [announcements]);

  // Handle acknowledgment
  const handleAcknowledge = async () => {
    if (!user?.email || !selectedItem || acknowledging) return;

    try {
      setAcknowledging(true);
      const result = await apiService.submitAcknowledgment(selectedItem.id, user.email, 'Yes');

      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? { ...item, isAcknowledged: true }
              : item
          )
        );
        setSelectedItem((prev) =>
          prev ? { ...prev, isAcknowledged: true } : null
        );
        toast.success('Acknowledged successfully');
      } else {
        toast.error(result.error || 'Failed to acknowledge');
      }
    } catch {
      toast.error('Failed to acknowledge');
    } finally {
      setAcknowledging(false);
    }
  };

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'ANNOUNCEMENTS', label: 'Announcements' },
    { value: 'EVENTS', label: 'Events' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'live', label: 'Live Now' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ended', label: 'Ended' },
  ];

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader
          title="Announcements & Events"
          subtitle="Stay updated with the latest news and upcoming events"
        />
        <Grid cols={4} className="mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          ))}
        </Grid>
        <Grid cols={2}>
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </Grid>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Announcements & Events"
        subtitle="Stay updated with the latest news and upcoming events"
      />

      {/* Stats */}
      <Grid cols={4} className="mb-6">
        <StatCard
          label="Total Items"
          value={stats.total}
          icon={<Megaphone className="w-5 h-5" />}
        />
        <StatCard
          label="Live Now"
          value={stats.live}
          icon={<div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Need Action"
          value={stats.pending}
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </Grid>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-4">
              <Select
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
                fullWidth={false}
                className="w-44"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                fullWidth={false}
                className="w-36"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-16 h-16" />}
          title="No announcements found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
        <Grid cols={2}>
          {filteredAnnouncements.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </Grid>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || ''}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedItem.category === 'EVENTS' ? 'secondary' : 'primary'}>
                {selectedItem.category}
              </Badge>
              <StatusBadge
                status={
                  selectedItem.status === 'Active'
                    ? 'active'
                    : selectedItem.status === 'Upcoming'
                    ? 'pending'
                    : 'completed'
                }
              />
            </div>

            {/* Content */}
            {selectedItem.content && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description
                </h4>
                <SafeHtml html={selectedItem.content} level="standard" />
              </div>
            )}

            {/* Event Details */}
            {selectedItem.category === 'EVENTS' && (
              <div className="p-4 bg-secondary-50 dark:bg-secondary-950/30 rounded-xl">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Event Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedItem.startDateTime && (
                    <div>
                      <span className="text-neutral-500">Start:</span>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        {formatDateTime(selectedItem.startDateTime)}
                      </p>
                    </div>
                  )}
                  {selectedItem.endDateTime && (
                    <div>
                      <span className="text-neutral-500">End:</span>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        {formatDateTime(selectedItem.endDateTime)}
                      </p>
                    </div>
                  )}
                  {selectedItem.location && (
                    <div className="col-span-2">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location:
                      </span>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        {selectedItem.location}
                      </p>
                    </div>
                  )}
                  {selectedItem.speakerInfo && (
                    <div className="col-span-2">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Speaker:
                      </span>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        {selectedItem.speakerInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Files and Links */}
            {((selectedItem.files && selectedItem.files.length > 0) ||
              (selectedItem.urls && selectedItem.urls.length > 0)) && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Related Links & Files
                </h4>
                <div className="space-y-2">
                  {selectedItem.files?.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="flex-1 text-sm">{file.name}</span>
                      <ExternalLink className="w-4 h-4 text-neutral-400" />
                    </a>
                  ))}
                  {selectedItem.urls?.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-secondary-500" />
                      <span className="flex-1 text-sm">{link.name}</span>
                      <ExternalLink className="w-4 h-4 text-neutral-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledgment */}
            {selectedItem.requiresAcknowledgment && (
              <div className="p-4 bg-secondary-50 dark:bg-secondary-950/30 rounded-xl border border-secondary-200 dark:border-secondary-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-secondary-600" />
                    <div>
                      <p className="font-medium text-secondary-700 dark:text-secondary-300">
                        Acknowledgment Required
                      </p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Please confirm you have read this
                      </p>
                    </div>
                  </div>
                  {selectedItem.isAcknowledged ? (
                    <Badge variant="success" dot>
                      Acknowledged
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleAcknowledge}
                      isLoading={acknowledging}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}

// Helper function
function determineStatus(startDateTime?: string, endDateTime?: string): string {
  if (!startDateTime || !endDateTime) return 'Draft';

  const now = new Date();
  const start = new Date(startDateTime.replace(' ', 'T'));
  const end = new Date(endDateTime.replace(' ', 'T'));

  if (now >= start && now <= end) return 'Active';
  if (now < start) return 'Upcoming';
  return 'Expired';
}
