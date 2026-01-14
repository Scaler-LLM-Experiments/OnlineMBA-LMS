import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ClipboardList,
  Filter,
  Search,
  Calendar,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Users,
  GraduationCap
} from 'lucide-react';
import { assignmentApiService, AssignmentData } from '../../services/assignmentApi';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../../hooks/useActivityTracker';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AssignmentDetailsModal } from './AssignmentDetailsModal';
import { useAssignmentTracking } from '../../hooks/useAssignmentTracking';

type TabType = 'active' | 'upcoming' | 'expired' | 'completed';

const AssignmentListPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, boolean>>({});
  const [loadingSubmissionStatus, setLoadingSubmissionStatus] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const user = auth.currentUser;
  const { student } = useAuth();
  const { trackPageView} = useActivityTracker();
  const tracking = useAssignmentTracking();

  // Track page view
  useEffect(() => {
    trackPageView('Assignment Platform');
  }, [trackPageView]);

  // Track search queries (debounced)
  useEffect(() => {
    if (!searchTerm) return;

    const timeoutId = setTimeout(() => {
      const filteredAssignments = categorizedAssignments[activeTab].filter(a =>
        a.assignmentHeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      tracking.trackSearchQuery(searchTerm, filteredAssignments.length, {
        pageSection: 'assignment_list',
        metadata: {
          active_tab: activeTab,
          results_count: filteredAssignments.length,
        }
      });
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Auto-refresh to move assignments to expired when time is up
  // Update every second for live countdown
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for live countdown

    return () => clearInterval(interval);
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      if (!student?.email) {
        toast.error('No user email found');
        return;
      }

      const result = await assignmentApiService.getAssignments(student.email, undefined, student?.isAdmin || false);

      if (!result.success) {
        setAccessError(result.error || 'Unknown error occurred');
        setLoading(false);
        return;
      }

      // Filter for published assignments only
      const publishedAssignments = (result.data || []).filter(
        assignment => assignment.publish === 'Yes' && assignment.status === 'Active'
      );

      setAssignments(publishedAssignments);
      setLoading(false); // Hide skeleton immediately

      // Check submission status in background (don't await)
      checkAllSubmissionStatus(publishedAssignments);

    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
      setLoading(false);
    }
  };

  const checkAllSubmissionStatus = async (assignmentList: AssignmentData[]) => {
    if (!student?.email) return;

    setLoadingSubmissionStatus(true);
    const statusMap: Record<string, boolean> = {};

    // Check submission status for each assignment
    await Promise.all(
      assignmentList.map(async (assignment) => {
        if (!assignment.assignmentId) return;

        try {
          const result = await assignmentApiService.checkSubmissionStatus(
            student.email!,
            assignment.assignmentId
          );

          if (result.success && result.data) {
            statusMap[assignment.assignmentId] = result.data.hasSubmitted || false;
          }
        } catch (error) {
          console.error(`Error checking status for ${assignment.assignmentId}:`, error);
        }
      })
    );

    setSubmissionStatus(statusMap);
    setLoadingSubmissionStatus(false);
  };

  const categorizeAssignment = (assignment: AssignmentData): TabType => {
    const now = new Date();
    const startDate = assignment.startDateTime ? new Date(assignment.startDateTime) : null;
    const endDate = assignment.endDateTime ? new Date(assignment.endDateTime) : null;

    // Check if completed (student has submitted)
    const isCompleted = assignment.assignmentId ? submissionStatus[assignment.assignmentId] || false : false;

    // If student has submitted, ALWAYS show in completed tab (regardless of deadline)
    if (isCompleted) {
      return 'completed';
    }

    if (!startDate || !endDate) {
      return 'active';
    }

    // Expired: end date has passed
    if (now > endDate) {
      return 'expired';
    }

    // Upcoming: start date is in the future
    if (now < startDate) {
      return 'upcoming';
    }

    // Active: between start and end date
    return 'active';
  };

  const categorizedAssignments = {
    active: assignments.filter(a => categorizeAssignment(a) === 'active'),
    upcoming: assignments.filter(a => categorizeAssignment(a) === 'upcoming'),
    expired: assignments.filter(a => categorizeAssignment(a) === 'expired'),
    completed: assignments.filter(a => categorizeAssignment(a) === 'completed'),
  };

  const filteredAssignments = categorizedAssignments[activeTab]
    .filter(assignment => {
      const matchesSearch = assignment.assignmentHeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.subHeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || assignment.subject === subjectFilter;
      const matchesTerm = termFilter === 'all' || assignment.term === termFilter;

      return matchesSearch && matchesSubject && matchesTerm;
    })
    .sort((a, b) => {
      // Sort by end date (deadline)
      if (!a.endDateTime || !b.endDateTime) return 0;
      return new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime();
    });

  const getTimeRemaining = (endDateTime: string) => {
    const endDate = new Date(endDateTime);
    const diff = endDate.getTime() - currentTime.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const getGlowColor = (assignment: AssignmentData, isActive: boolean) => {
    if (!isActive || !assignment.endDateTime) {
      return 'green'; // Default green for non-active or no deadline
    }

    const now = new Date();
    const endDate = new Date(assignment.endDateTime);
    const diff = endDate.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);

    if (hoursRemaining <= 6) {
      return 'red'; // Less than 6 hours - RED glow
    } else if (hoursRemaining <= 24) {
      return 'yellow'; // Less than 24 hours - YELLOW glow
    } else {
      return 'green'; // More than 24 hours - GREEN glow
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      let date: Date;

      // Check if it's ISO format (e.g., "2025-12-06T11:36:06.000Z")
      if (dateStr.includes('T') && dateStr.includes('Z')) {
        date = new Date(dateStr);
      } else {
        // Handle DD-MMM-YYYY HH:mm:ss format (e.g., "06-Dec-2025 17:06:06")
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');

        // Convert month abbreviation to number
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        date = new Date(parseInt(year), monthMap[month], parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
      }

      // Extract components for formatting
      const dayNum = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const hours24 = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      // Convert to 12-hour format
      const hour12 = hours24 % 12 || 12;
      const ampm = hours24 >= 12 ? 'PM' : 'AM';

      // Add ordinal suffix to day
      const ordinal = (num: number): string => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = num % 100;
        return num + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      return `${ordinal(dayNum)} ${month} ${hour12}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return dateStr;
    }
  };

  // Get unique batches and terms for filters
  const uniqueBatches = Array.from(new Set(assignments.map(a => a.batch))).filter(Boolean);
  const uniqueTerms = Array.from(new Set(assignments.map(a => a.term))).filter(Boolean);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
        </div>

        {/* Skeleton Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-t-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Skeleton Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="h-10 flex-1 min-w-[200px] bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Skeleton Assignment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-border shadow-lg"
            >
              {/* Header */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: 'Active Assignments', count: categorizedAssignments.active.length },
    { key: 'upcoming', label: 'Upcoming Assignments', count: categorizedAssignments.upcoming.length },
    { key: 'expired', label: 'Expired Assignments', count: categorizedAssignments.expired.length },
    { key: 'completed', label: 'Completed Assignments', count: categorizedAssignments.completed.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title - Always Visible */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
      </div>

      {/* Access Error Alert - Persistent until dismissed */}
      {accessError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚧</span>
                </div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Access Restricted</h3>
              </div>
              <p className="text-red-700 dark:text-red-300 whitespace-pre-line leading-relaxed">
                {accessError}
              </p>
            </div>
            <button
              onClick={() => setAccessError(null)}
              className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 font-bold text-xl leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                const oldTab = activeTab;
                setActiveTab(tab.key);

                // Track tab switch
                tracking.trackTabSwitch(oldTab, tab.key, {
                  pageSection: 'assignment_list',
                  metadata: {
                    assignments_in_new_tab: categorizedAssignments[tab.key].length,
                  }
                });
              }}
              className={`
                px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-[#43a047] text-[#43a047]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-2 px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1
                ${activeTab === tab.key
                  ? 'bg-[#43a047] text-white'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {/* Show spinner for completed tab while loading */}
                {tab.key === 'completed' && loadingSubmissionStatus ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  tab.count
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => {
            const newSubject = e.target.value;
            setSubjectFilter(newSubject);

            // Track filter applied
            tracking.trackFilterApplied('subject', newSubject, {
              pageSection: 'assignment_list',
              metadata: {
                active_tab: activeTab,
                term_filter: termFilter,
              }
            });
          }}
          className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Subjects</option>
          {Array.from(new Set(assignments.map(a => a.subject))).filter(Boolean).sort().map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        {/* Term Filter */}
        <select
          value={termFilter}
          onChange={(e) => {
            const newTerm = e.target.value;
            setTermFilter(newTerm);

            // Track filter applied
            tracking.trackFilterApplied('term', newTerm, {
              pageSection: 'assignment_list',
              metadata: {
                active_tab: activeTab,
                subject_filter: subjectFilter,
              }
            });
          }}
          className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Terms</option>
          {Array.from(new Set(assignments.map(a => a.term))).filter(Boolean).map(term => (
            <option key={term} value={term}>{term}</option>
          ))}
        </select>

        <Button
          onClick={fetchAssignments}
          className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          Refresh
        </Button>
      </div>

      {/* Assignment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            {/* Show loading state for Completed tab while checking submissions */}
            {activeTab === 'completed' && loadingSubmissionStatus ? (
              <>
                <div className="relative mx-auto mb-4 w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
                </div>
                <p className="text-blue-600 dark:text-blue-400 text-lg font-medium">Checking your submissions...</p>
                <p className="text-muted-foreground text-sm mt-2">Please wait while we fetch your completed assignments</p>
              </>
            ) : (
              <>
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No {activeTab} assignments found</p>
              </>
            )}
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const isExpired = activeTab === 'expired';
            const glowColor = getGlowColor(assignment, activeTab === 'active');

            // Define glow styles based on color - Enhanced for dark mode
            const glowStyles = {
              green: {
                border: 'border-green-500/30 hover:border-green-500/60 dark:border-green-500/50 dark:hover:border-green-500',
                shadow: 'hover:shadow-[0_0_40px_rgba(67,160,71,0.4)] dark:hover:shadow-[0_0_50px_rgba(67,160,71,0.8)]',
                gradient: 'from-green-500/10 via-transparent to-green-500/5 dark:from-green-500/20 dark:to-green-500/10'
              },
              yellow: {
                border: 'border-yellow-500/40 hover:border-yellow-500/70 dark:border-yellow-500/60 dark:hover:border-yellow-500',
                shadow: 'hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] dark:hover:shadow-[0_0_50px_rgba(234,179,8,0.9)]',
                gradient: 'from-yellow-500/15 via-transparent to-yellow-500/10 dark:from-yellow-500/25 dark:to-yellow-500/15'
              },
              red: {
                border: 'border-red-500/40 hover:border-red-500/70 dark:border-red-500/60 dark:hover:border-red-500',
                shadow: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] dark:hover:shadow-[0_0_50px_rgba(239,68,68,0.9)]',
                gradient: 'from-red-500/15 via-transparent to-red-500/10 dark:from-red-500/25 dark:to-red-500/15'
              }
            };

            const currentGlow = glowStyles[glowColor];

            return (
              <div
                key={assignment.assignmentId}
                className={`group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 ${currentGlow.border} transition-all duration-300 shadow-lg ${currentGlow.shadow}`}
              >
                {/* Dynamic glow overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${currentGlow.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                {/* Header */}
                <div className="relative bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className="bg-yellow-400 text-black text-xs px-2 py-0.5 font-semibold">
                      {assignment.batch || 'SSB 2025'} 📎 📊
                    </Badge>
                    {assignment.groupAssignment === 'Yes' && (
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5">
                        <Users className="w-3 h-3 inline mr-1" />
                        Group
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight">{assignment.assignmentHeader}</h3>
                  {assignment.subHeader && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{assignment.subHeader}</p>
                  )}
                  {assignment.subject && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{assignment.subject}</p>
                  )}
                </div>

                {/* Content area */}
                <div className="relative p-4 bg-white dark:bg-gray-800">
                  <div className="space-y-3">
                    {/* Start Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-gray-600 dark:text-gray-400">Start:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(assignment.startDateTime || '')}</span>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-gray-600 dark:text-gray-400">Due:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(assignment.endDateTime || '')}</span>
                    </div>

                    {/* Time Remaining */}
                    {!isExpired && assignment.endDateTime && (() => {
                      const endDate = new Date(assignment.endDateTime);
                      const diff = endDate.getTime() - currentTime.getTime();
                      const hoursRemaining = diff / (1000 * 60 * 60);

                      // Determine color based on time remaining
                      let bgColor = 'bg-green-50 dark:bg-green-900/20';
                      let borderColor = 'border-green-200 dark:border-green-700';
                      let textColor = 'text-green-600 dark:text-green-400';

                      if (hoursRemaining <= 6) {
                        bgColor = 'bg-red-50 dark:bg-red-900/20';
                        borderColor = 'border-red-200 dark:border-red-700';
                        textColor = 'text-red-600 dark:text-red-400';
                      } else if (hoursRemaining <= 24) {
                        bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                        borderColor = 'border-yellow-200 dark:border-yellow-700';
                        textColor = 'text-yellow-600 dark:text-yellow-400';
                      }

                      return (
                        <div className={`text-sm ${bgColor} p-3 rounded-lg border ${borderColor}`}>
                          <span className="text-gray-600 dark:text-gray-400">Time remaining: </span>
                          <span className={`font-bold ${textColor} ${hoursRemaining <= 6 ? 'animate-pulse' : ''}`}>
                            {getTimeRemaining(assignment.endDateTime)}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Marks */}
                    {assignment.totalMarks && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-gray-600 dark:text-gray-400">Marks:</span>
                        <span className="font-medium text-gray-900 dark:text-white">N/A</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="pt-2">
                      <Badge className={`${
                        activeTab === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                          : activeTab === 'expired'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                      }`}>
                        <span className="flex items-center gap-1">
                          {activeTab === 'active' && <span>✓</span>}
                          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </span>
                      </Badge>
                    </div>

                    {/* View Details Button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsModalOpen(true);

                          // Track assignment card click
                          tracking.trackAssignmentCardClick(assignment, {
                            pageSection: 'assignment_list',
                            metadata: {
                              tab: activeTab,
                              is_group: assignment.groupAssignment === 'Yes',
                              has_submitted: submissionStatus[assignment.assignmentId || ''],
                            }
                          });
                        }}
                        className="w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isExpired && activeTab === 'expired' ? 'View Assignment' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <AssignmentDetailsModal
          assignment={selectedAssignment}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAssignment(null);
          }}
          onSubmit={() => {
            // Refresh assignments to move to completed tab
            fetchAssignments();
          }}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};

export default AssignmentListPage;