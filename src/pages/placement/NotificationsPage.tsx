import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'new_job' | 'application_update' | 'deadline' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

type FilterType = 'all' | 'unread' | 'read';

const NotificationsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'new_job',
      title: 'New Job Opening: Product Manager at Google',
      message: 'A new job opportunity matching your profile has been posted. Application deadline: Dec 15, 2025.',
      timestamp: '2025-12-04T10:30:00',
      read: false,
      actionUrl: '/placement/jobs',
      actionLabel: 'View Job'
    },
    {
      id: '2',
      type: 'application_update',
      title: 'Application Status Updated',
      message: 'Your application for Software Engineer at Microsoft has been reviewed and moved to the next round.',
      timestamp: '2025-12-03T15:45:00',
      read: false,
      actionUrl: '/placement/applications',
      actionLabel: 'View Application'
    },
    {
      id: '3',
      type: 'deadline',
      title: 'Application Deadline Reminder',
      message: 'The application deadline for Data Analyst at Amazon is approaching (2 days left).',
      timestamp: '2025-12-02T09:00:00',
      read: true,
      actionUrl: '/placement/jobs',
      actionLabel: 'Apply Now'
    },
    {
      id: '4',
      type: 'info',
      title: 'Placement Workshop: Resume Building',
      message: 'Join us for an interactive workshop on crafting ATS-friendly resumes. Date: Dec 10, 2025 at 3:00 PM.',
      timestamp: '2025-12-01T14:20:00',
      read: true,
      actionUrl: '/placement/resources',
      actionLabel: 'Learn More'
    },
    {
      id: '5',
      type: 'new_job',
      title: 'New Job Opening: UX Designer at Adobe',
      message: 'Adobe is looking for a UX Designer. This role matches your preferred domains.',
      timestamp: '2025-11-30T11:15:00',
      read: true,
      actionUrl: '/placement/jobs',
      actionLabel: 'View Job'
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_job':
        return <Briefcase size={20} className="text-blue-600" />;
      case 'application_update':
        return <CheckCircle2 size={20} className="text-green-600" />;
      case 'deadline':
        return <AlertCircle size={20} className="text-orange-600" />;
      case 'info':
        return <Info size={20} className="text-purple-600" />;
      default:
        return <Bell size={20} className="text-muted-foreground" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read', label: 'Read', count: notifications.length - unreadCount },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with new jobs and application status changes
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b">
        <div className="flex gap-8">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filter.count}
                </Badge>
              )}
              {activeFilter === filter.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Notifications
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter === 'all'
                  ? "You're all caught up! We'll notify you when there's something new."
                  : `No ${activeFilter} notifications.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${!notification.read ? 'bg-white dark:bg-gray-800' : 'bg-muted'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-accent rounded transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 size={14} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3">
                      {notification.actionUrl && notification.actionLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
