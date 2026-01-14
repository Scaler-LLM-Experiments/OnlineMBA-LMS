import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLiveSessions } from '../hooks/useSessions';
import { Session } from '../../types';
import { User } from '../../core/types';
import {
  RefreshCw, Video, Calendar, Clock, Lock, ExternalLink,
  Play, CalendarClock, History, Copy, Check, CheckCircle2, FileEdit, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../../hooks/useActivityTracker';

type SessionCategory = 'live' | 'upcoming' | 'past';

// Skeleton Loader Component
function SessionSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30">
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>

        {/* Info rows skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
        </div>

        {/* Button skeleton */}
        <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  );
}

// Parse date from DD-MMM-YYYY format (e.g., "04-Nov-2025")
function parseSessionDate(dateStr: string): Date {
  const months: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  const parts = dateStr.split('-');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
}

// Parse time from "HH:MM AM/PM" format
function parseSessionTime(dateStr: string, timeStr: string, isEndTime: boolean = false, startTime?: Date): Date {
  const date = parseSessionDate(dateStr);
  const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) return date;

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const period = timeParts[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);

  // Handle sessions that span across midnight
  // If this is an end time and it's before the start time, add 1 day
  if (isEndTime && startTime && date <= startTime) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

export function LiveSessionsPage() {
  const { student } = useAuth();
  const { sessions, loading, refetch } = useLiveSessions(student?.batch);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState({
    upcoming: true,  // Collapsed by default
    past: true       // Collapsed by default
  });
  const navigate = useNavigate();
  const { term: urlTerm, domain: urlDomain, subject: urlSubject } = useParams();
  const { trackPageView } = useActivityTracker();

  // Filter states - Initialize from URL params
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | SessionCategory,
    term: urlTerm || 'all',
    domain: urlDomain || 'all',
    subject: urlSubject || 'all',
    sessionName: ''
  });

  // Track page view
  useEffect(() => {
    trackPageView('Live & Upcoming Sessions');
  }, [trackPageView]);

  // Update filters when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      term: urlTerm || 'all',
      domain: urlDomain || 'all',
      subject: urlSubject || 'all'
    }));
  }, [urlTerm, urlDomain, urlSubject]);

  // Categorize and sort sessions by time
  const categorizedSessions = useMemo(() => {
    const now = new Date();

    const result = sessions.reduce((acc, session) => {
      if (!session.date || !session.startTime || !session.endTime) return acc;

      try {
        const sessionStart = parseSessionTime(session.date, session.startTime, false);
        const sessionEnd = parseSessionTime(session.date, session.endTime, true, sessionStart);

        if (now >= sessionStart && now <= sessionEnd) {
          acc.live.push(session);
        } else if (now < sessionStart) {
          acc.upcoming.push(session);
        } else {
          acc.past.push(session);
        }
      } catch (error) {
        console.error('Error parsing session dates:', error, session);
      }

      return acc;
    }, { live: [] as Session[], upcoming: [] as Session[], past: [] as Session[] });

    // Sort each category by time
    // Live & Upcoming: earliest first (ascending)
    // Past: latest first (descending)
    const sortByTime = (a: Session, b: Session, ascending = true) => {
      try {
        const timeA = parseSessionTime(a.date!, a.startTime!, false).getTime();
        const timeB = parseSessionTime(b.date!, b.startTime!, false).getTime();
        return ascending ? timeA - timeB : timeB - timeA;
      } catch {
        return 0;
      }
    };

    result.live.sort((a, b) => sortByTime(a, b, true));
    result.upcoming.sort((a, b) => sortByTime(a, b, true));
    result.past.sort((a, b) => sortByTime(a, b, false));

    return result;
  }, [sessions]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return {
      terms: ['all', ...Array.from(new Set(sessions.map(s => s.term).filter(Boolean)))],
      domains: ['all', ...Array.from(new Set(sessions.map(s => s.domain).filter(Boolean)))],
      subjects: ['all', ...Array.from(new Set(sessions.map(s => s.subject).filter(Boolean)))]
    };
  }, [sessions]);

  // Apply filters
  const filteredSessions = useMemo(() => {
    let filtered = { ...categorizedSessions };

    // Filter by type
    if (filters.type !== 'all') {
      filtered = {
        live: filters.type === 'live' ? filtered.live : [],
        upcoming: filters.type === 'upcoming' ? filtered.upcoming : [],
        past: filters.type === 'past' ? filtered.past : []
      };
    }

    // Filter by other criteria
    const applyFilters = (sessionList: Session[]) => {
      return sessionList.filter(session => {
        if (filters.term !== 'all' && session.term !== filters.term) return false;
        if (filters.domain !== 'all' && session.domain !== filters.domain) return false;
        if (filters.subject !== 'all' && session.subject !== filters.subject) return false;
        if (filters.sessionName && !session.sessionName?.toLowerCase().includes(filters.sessionName.toLowerCase())) return false;
        return true;
      });
    };

    return {
      live: applyFilters(filtered.live),
      upcoming: applyFilters(filtered.upcoming),
      past: applyFilters(filtered.past)
    };
  }, [categorizedSessions, filters]);

  const copyToClipboard = (text: string, label: string, sessionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(sessionId);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for better UX
  };

  const toggleSection = (section: 'upcoming' | 'past') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearFilters = () => {
    navigate('/sessions');
    setFilters({
      type: 'all',
      term: 'all',
      domain: 'all',
      subject: 'all',
      sessionName: ''
    });
  };

  // Navigate with URL updates
  const handleNavigate = (level: 'term' | 'domain' | 'subject') => {
    if (level === 'term') {
      navigate('/sessions');
    } else if (level === 'domain' && filters.term !== 'all') {
      navigate(`/sessions/${encodeURIComponent(filters.term)}`);
    } else if (level === 'subject' && filters.term !== 'all' && filters.domain !== 'all') {
      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}`);
    }
  };

  const hasActiveFilters = filters.type !== 'all' || filters.term !== 'all' ||
    filters.domain !== 'all' || filters.subject !== 'all' || filters.sessionName !== '';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasAnySessions = sessions.length > 0;
  const hasFilteredSessions = filteredSessions.live.length > 0 ||
    filteredSessions.upcoming.length > 0 || filteredSessions.past.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Live</h1>
          <p className="text-sm text-muted-foreground">Join live sessions or view upcoming and past meetings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Breadcrumb Trail Navigation */}
      {hasAnySessions && (filters.term !== 'all' || filters.domain !== 'all' || filters.subject !== 'all') && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleNavigate('term')}
            className="text-foreground/70 hover:text-foreground font-medium transition-colors"
          >
            All Sessions
          </button>

          {filters.term !== 'all' && (
            <>
              <ChevronRight className="w-4 h-4 text-foreground/50" />
              <button
                onClick={() => handleNavigate('domain')}
                className="text-foreground/70 hover:text-foreground font-medium transition-colors"
              >
                {filters.term}
              </button>
            </>
          )}

          {filters.domain !== 'all' && (
            <>
              <ChevronRight className="w-4 h-4 text-foreground/50" />
              <button
                onClick={() => handleNavigate('subject')}
                className="text-foreground/70 hover:text-foreground font-medium transition-colors"
              >
                {filters.domain}
              </button>
            </>
          )}

          {filters.subject !== 'all' && (
            <>
              <ChevronRight className="w-4 h-4 text-foreground/50" />
              <span className="text-foreground font-semibold">{filters.subject}</span>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      {hasAnySessions && (
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as 'all' | 'live' | 'upcoming' | 'past' })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All</option>
                  <option value="live">Live Now</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Term Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Term</label>
                <select
                  value={filters.term}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    console.log('LiveSessionsPage - Term changed to:', newTerm);
                    if (newTerm === 'all') {
                      const url = '/sessions';
                      console.log('LiveSessionsPage - Navigating to:', url);
                      navigate(url);
                    } else {
                      const url = `/sessions/${encodeURIComponent(newTerm)}`;
                      console.log('LiveSessionsPage - Navigating to:', url);
                      navigate(url);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {filterOptions.terms.map(term => (
                    <option key={term} value={term}>{term === 'all' ? 'All Terms' : term}</option>
                  ))}
                </select>
              </div>

              {/* Domain Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Domain</label>
                <select
                  value={filters.domain}
                  onChange={(e) => {
                    const newDomain = e.target.value;
                    if (filters.term === 'all') return;
                    if (newDomain === 'all') {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}`);
                    } else {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(newDomain)}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {filterOptions.domains.map(domain => (
                    <option key={domain} value={domain}>{domain === 'all' ? 'All Domains' : domain}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => {
                    const newSubject = e.target.value;
                    if (filters.term === 'all' || filters.domain === 'all') return;
                    if (newSubject === 'all') {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}`);
                    } else {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}/${encodeURIComponent(newSubject)}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {filterOptions.subjects.map(subject => (
                    <option key={subject} value={subject}>{subject === 'all' ? 'All Subjects' : subject}</option>
                  ))}
                </select>
              </div>

              {/* Session Name Search */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Session Name</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.sessionName}
                  onChange={(e) => setFilters({ ...filters, sessionName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Sessions in Single View */}
      {isRefreshing ? (
        <div className="space-y-8">
          {/* Show skeleton loaders while refreshing */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SessionSkeleton />
              <SessionSkeleton />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SessionSkeleton />
            </div>
          </div>
        </div>
      ) : !hasAnySessions ? (
        <div className="relative overflow-hidden rounded-2xl p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Video className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No sessions available</h3>
            <p className="text-sm text-muted-foreground">There are no sessions to display at this time</p>
          </div>
        </div>
      ) : !hasFilteredSessions ? (
        <div className="relative overflow-hidden rounded-2xl p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Video className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No sessions match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters to see more sessions</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-sm font-medium transition-all"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Sessions Section */}
          {filteredSessions.live.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">Live Now</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                    {filteredSessions.live.length}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSessions.live.map((session) => (
                  <SessionGlassCard
                    key={session.sessionId}
                    session={session}
                    category="live"
                    onCopy={copyToClipboard}
                    copiedId={copiedId}
                    student={student}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Sessions Section */}
          {filteredSessions.upcoming.length > 0 && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleSection('upcoming')}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
                  <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Upcoming</span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                    {filteredSessions.upcoming.length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent"></div>
                {collapsedSections.upcoming ? (
                  <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              {!collapsedSections.upcoming && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredSessions.upcoming.map((session) => (
                    <SessionGlassCard
                      key={session.sessionId}
                      session={session}
                      category="upcoming"
                      onCopy={copyToClipboard}
                      copiedId={copiedId}
                      student={student}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past Sessions Section */}
          {filteredSessions.past.length > 0 && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleSection('past')}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl">
                  <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Past</span>
                  <span className="px-2 py-0.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold">
                    {filteredSessions.past.length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-500/20 to-transparent"></div>
                {collapsedSections.past ? (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              {!collapsedSections.past && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredSessions.past.map((session) => (
                    <SessionGlassCard
                      key={session.sessionId}
                      session={session}
                      category="past"
                      onCopy={copyToClipboard}
                      copiedId={copiedId}
                      student={student}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SessionGlassCardProps {
  session: Session;
  category: SessionCategory;
  onCopy: (text: string, label: string, sessionId: string) => void;
  copiedId: string | null;
  student: User | null;
}

function SessionGlassCard({ session, category, onCopy, copiedId, student }: SessionGlassCardProps) {
  const isLive = category === 'live';
  const isPast = category === 'past';
  const isUpcoming = category === 'upcoming';

  // Detect dark mode from document with reactive state
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));

  React.useEffect(() => {
    // Observer for dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative group">
      {/* ========== GLOW EFFECTS - Only in Dark Mode - NO PULSING ========== */}
      {isLive && isDark && (
        <>
          {/* Outer glow - Large spread */}
          <div
            className="absolute rounded-3xl blur-[50px] pointer-events-none"
            style={{
              inset: '-2.5rem', // -40px on all sides
              background: 'radial-gradient(ellipse, rgba(34, 197, 94, 0.6) 0%, rgba(16, 185, 129, 0.4) 40%, rgba(34, 197, 94, 0.15) 70%, transparent 100%)',
              zIndex: 0
            }}
          />

          {/* Middle glow - Medium spread */}
          <div
            className="absolute rounded-2xl blur-[30px] pointer-events-none"
            style={{
              inset: '-1.5rem', // -24px on all sides
              background: 'radial-gradient(ellipse, rgba(34, 197, 94, 0.7) 0%, rgba(16, 185, 129, 0.5) 50%, rgba(34, 197, 94, 0.2) 80%, transparent 100%)',
              zIndex: 1
            }}
          />

          {/* Inner glow - Tight and bright */}
          <div
            className="absolute rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 pointer-events-none"
            style={{
              inset: '-0.5rem', // -8px on all sides
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%)',
              zIndex: 2
            }}
          />
        </>
      )}

      {/* ========== CARD BACKGROUND ========== */}
      <div
        className="absolute inset-0 rounded-2xl shadow-2xl transition-all duration-300 group-hover:scale-[1.01]"
        style={{
          background: isLive && isDark
            ? 'rgba(15, 23, 42, 0.5)' // Very transparent dark slate
            : isLive
            ? 'linear-gradient(to bottom right, #f0fdf4, #d1fae5)' // Light mode green
            : isDark
            ? 'rgba(31, 41, 55, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(25px) saturate(150%)',
          WebkitBackdropFilter: 'blur(25px) saturate(150%)', // Safari support
          border: isLive && isDark
            ? '2px solid rgba(34, 197, 94, 0.7)' // Bright green border
            : isLive
            ? '2px solid #86efac'
            : isDark
            ? '1px solid rgba(75, 85, 99, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10
        }}
      />

      {/* ========== CONTENT ========== */}
      <div className="relative p-6 space-y-4 z-20">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {session.sessionName}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">
                {session.subject}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{session.domain}</span>
            </div>
          </div>

          {/* Status Badge */}
          {isLive && (
            <div className="relative flex-shrink-0">
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-40 animate-pulse"></div>
            </div>
          )}
          {isUpcoming && (
            <div className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
              UPCOMING
            </div>
          )}
          {isPast && (
            <div className="px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-600 dark:text-gray-400 text-xs font-bold flex-shrink-0">
              ENDED
            </div>
          )}
        </div>

        {/* Session Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{session.date}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {session.startTime} ({session.duration} min)
            </span>
          </div>
        </div>

        {/* Recording Available Badge for Past Sessions */}
        {isPast && session.fullSynced && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Recording Available</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>

        {/* Meeting Credentials - Only for Live sessions */}
        {isLive && (
          <div className="space-y-3">
            {/* Meeting ID */}
            {session.zoomMeetingId && (
              <div
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Meeting ID</p>
                    <p className="text-sm font-mono font-bold text-foreground truncate">
                      {session.zoomMeetingId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onCopy(session.zoomMeetingId!.toString(), 'Meeting ID', session.sessionId + '-id')}
                  className="flex-shrink-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {copiedId === session.sessionId + '-id' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            {/* Password */}
            {session.zoomPassword && (
              <div
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Password</p>
                    <p className="text-sm font-mono font-bold text-foreground truncate">
                      {session.zoomPassword}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onCopy(session.zoomPassword!, 'Password', session.sessionId + '-pwd')}
                  className="flex-shrink-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {copiedId === session.sessionId + '-pwd' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Only for Live Sessions */}
        {isLive && (
          <div className="space-y-2">
            {/* Join Button */}
            {session.joinUrl && (
              <a
                href={session.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  shadow-lg hover:shadow-xl
                  bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white
                "
              >
                <ExternalLink className="w-4 h-4" />
                <span>Join Live Session</span>
              </a>
            )}

            {/* Take Notes Button */}
            <button
              onClick={() => {
                const notesUrl = `/notes-popup?sessionId=${encodeURIComponent(session.sessionId)}&sessionName=${encodeURIComponent(session.sessionName)}&batch=${encodeURIComponent(session.batch)}&term=${encodeURIComponent(session.term || '')}&domain=${encodeURIComponent(session.domain || '')}&subject=${encodeURIComponent(session.subject || '')}&date=${encodeURIComponent(session.date || '')}&startTime=${encodeURIComponent(session.startTime || '')}&studentEmail=${encodeURIComponent(student?.email || '')}&studentName=${encodeURIComponent(student?.name || '')}`;
                window.open(notesUrl, 'session-notes', 'width=480,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
              }}
              className="
                flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm
                transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                shadow-md hover:shadow-lg
                bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white
              "
            >
              <FileEdit className="w-4 h-4" />
              <span>Take Notes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveSessionsPage;
