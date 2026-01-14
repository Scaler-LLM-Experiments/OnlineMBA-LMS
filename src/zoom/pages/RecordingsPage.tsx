import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useRecordings } from '../hooks/useSessions';
import { Session } from '../../types';
import {
  Video, Folder, ChevronRight, ChevronDown, Play, Monitor,
  Users, Layout, RefreshCw, Search, X, AlertCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../../hooks/useActivityTracker';

interface ViewSelectionModalProps {
  session: Session;
  onClose: () => void;
  onSelectView: (views: string[]) => void;
}

function ViewSelectionModal({ session, onClose, onSelectView }: ViewSelectionModalProps) {
  const [selectedViews, setSelectedViews] = useState<string[]>([]);

  const availableViews = useMemo(() => {
    const views: { id: string; label: string; description: string; link?: string; icon: React.ReactNode }[] = [];

    if (session.speakerViewLink) {
      views.push({
        id: 'speaker',
        label: 'Speaker View',
        description: 'Main whiteboard and instructor focus',
        link: session.speakerViewLink,
        icon: <Users className="w-5 h-5" />
      });
    }

    if (session.screenShareLink) {
      views.push({
        id: 'screenShare',
        label: 'Screen Share',
        description: 'Deck/Slide presentation view',
        link: session.screenShareLink,
        icon: <Monitor className="w-5 h-5" />
      });
    }

    if (session.activeSpeakerLink) {
      views.push({
        id: 'activeSpeaker',
        label: 'Active Speaker',
        description: 'Active speaker camera view',
        link: session.activeSpeakerLink,
        icon: <Layout className="w-5 h-5" />
      });
    }

    if (session.galleryViewLink) {
      views.push({
        id: 'gallery',
        label: 'Gallery View',
        description: 'All participants visible',
        link: session.galleryViewLink,
        icon: <Video className="w-5 h-5" />
      });
    }

    // Add files (file1-file5)
    if (session.file1) {
      console.log('File1 - Name:', session.file1Name, 'URL:', session.file1);
      views.push({
        id: 'file1',
        label: session.file1Name || 'File 1',
        description: 'Presentation or document',
        link: session.file1,
        icon: <FileText className="w-5 h-5" />
      });
    }

    if (session.file2) {
      console.log('File2 - Name:', session.file2Name, 'URL:', session.file2);
      views.push({
        id: 'file2',
        label: session.file2Name || 'File 2',
        description: 'Presentation or document',
        link: session.file2,
        icon: <FileText className="w-5 h-5" />
      });
    }

    if (session.file3) {
      views.push({
        id: 'file3',
        label: session.file3Name || 'File 3',
        description: 'Presentation or document',
        link: session.file3,
        icon: <FileText className="w-5 h-5" />
      });
    }

    if (session.file4) {
      views.push({
        id: 'file4',
        label: session.file4Name || 'File 4',
        description: 'Presentation or document',
        link: session.file4,
        icon: <FileText className="w-5 h-5" />
      });
    }

    if (session.file5) {
      views.push({
        id: 'file5',
        label: session.file5Name || 'File 5',
        description: 'Presentation or document',
        link: session.file5,
        icon: <FileText className="w-5 h-5" />
      });
    }

    return views;
  }, [session]);

  const handleToggleView = (viewId: string) => {
    setSelectedViews(prev =>
      prev.includes(viewId)
        ? prev.filter(id => id !== viewId)
        : [...prev, viewId]
    );
  };

  const handleContinue = () => {
    if (selectedViews.length === 0) {
      toast.error('Please select at least one view');
      return;
    }
    onSelectView(selectedViews);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-white/95 to-white/85 dark:from-gray-900/95 dark:to-gray-800/85 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Select Recording Views</h2>
              <p className="text-sm text-muted-foreground">Choose which views you want to watch</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h3 className="font-semibold text-foreground mb-1">{session.sessionName}</h3>
            <p className="text-sm text-muted-foreground">
              {session.term && `${session.term} • `}
              {session.domain && `${session.domain} • `}
              {session.subject}
            </p>
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-1">Recommended Setup</h4>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                  {(session.file1 || session.file2 || session.file3 || session.file4 || session.file5) ? (
                    <>
                      We recommend selecting <strong>Speaker View + Screen Share</strong> for the best learning experience.
                      You can also add <strong>Files</strong> to view presentation materials side-by-side with the video.
                    </>
                  ) : (
                    <>
                      We recommend selecting <strong>Speaker View + Screen Share</strong> for the best learning experience.
                      This allows you to see both the deck/slides and the instructor simultaneously in resizable windows.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Available Views */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Available Views ({availableViews.length})</h4>

            {availableViews.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Video className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <p className="text-sm text-muted-foreground">No recording views available for this session</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {availableViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => handleToggleView(view.id)}
                    className={`
                      relative p-4 rounded-xl text-left transition-all
                      ${selectedViews.includes(view.id)
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg scale-[1.02]'
                        : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-3 rounded-lg
                        ${selectedViews.includes(view.id)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {view.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground mb-1">{view.label}</h5>
                        <p className="text-sm text-muted-foreground">{view.description}</p>
                      </div>
                      {selectedViews.includes(view.id) && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                          {selectedViews.indexOf(view.id) + 1}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedViews.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-sm font-medium text-primary">
                {selectedViews.length} view{selectedViews.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedViews.length === 0 || availableViews.length === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Watch {selectedViews.length > 0 && `(${selectedViews.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Folder/Recording Card Component
interface RecordingCardProps {
  session: Session;
  onClick: () => void;
}

function RecordingCard({ session, onClick }: RecordingCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl p-5 cursor-pointer bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <div className="flex items-start gap-4">
        {/* Video Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Video className="w-6 h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
            {session.sessionName}
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            {session.date && new Date(session.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
            {session.duration && ` • ${session.duration} min`}
          </p>

          {/* View badges */}
          <div className="flex flex-wrap gap-1.5">
            {session.speakerViewLink && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                Speaker
              </span>
            )}
            {session.screenShareLink && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">
                Screen
              </span>
            )}
            {session.activeSpeakerLink && (
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                Active Speaker
              </span>
            )}
            {session.galleryViewLink && (
              <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium">
                Gallery
              </span>
            )}
          </div>
        </div>

        {/* Play Icon */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordingsPage() {
  const { student } = useAuth();
  const { recordings, loading, refetch } = useRecordings({ batch: student?.batch });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { term: urlTerm, domain: urlDomain, subject: urlSubject } = useParams();
  const { trackRecordingOpened } = useActivityTracker();

  // Filter states - Initialize from URL params
  const [filters, setFilters] = useState({
    term: urlTerm || 'all',
    domain: urlDomain || 'all',
    subject: urlSubject || 'all',
    sessionName: ''
  });

  // Update filters when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      term: urlTerm || 'all',
      domain: urlDomain || 'all',
      subject: urlSubject || 'all'
    }));
  }, [urlTerm, urlDomain, urlSubject]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return {
      terms: ['all', ...Array.from(new Set(recordings.map(s => s.term).filter(Boolean)))],
      domains: ['all', ...Array.from(new Set(recordings.map(s => s.domain).filter(Boolean)))],
      subjects: ['all', ...Array.from(new Set(recordings.map(s => s.subject).filter(Boolean)))]
    };
  }, [recordings]);

  // Apply filters
  const filteredRecordings = useMemo(() => {
    return recordings.filter((rec: Session) => {
      // Term filter
      if (filters.term !== 'all' && rec.term !== filters.term) return false;

      // Domain filter
      if (filters.domain !== 'all' && rec.domain !== filters.domain) return false;

      // Subject filter
      if (filters.subject !== 'all' && rec.subject !== filters.subject) return false;

      // Session name search
      if (filters.sessionName && !rec.sessionName?.toLowerCase().includes(filters.sessionName.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [recordings, filters]);

  // Organize filtered recordings into folder structure and sort by time
  const folderStructure = useMemo(() => {
    const structure: Record<string, Record<string, Record<string, Session[]>>> = {};

    filteredRecordings.forEach((recording: Session) => {
      const term = recording.term || 'Uncategorized';
      const domain = recording.domain || 'General';
      const subject = recording.subject || 'Other';

      if (!structure[term]) structure[term] = {};
      if (!structure[term][domain]) structure[term][domain] = {};
      if (!structure[term][domain][subject]) structure[term][domain][subject] = [];

      structure[term][domain][subject].push(recording);
    });

    // Sort recordings within each subject by time (latest first - descending)
    Object.values(structure).forEach(domains => {
      Object.values(domains).forEach(subjects => {
        Object.keys(subjects).forEach(subjectKey => {
          subjects[subjectKey].sort((a, b) => {
            try {
              // Parse dates and times for comparison
              const getTime = (session: Session) => {
                if (!session.date || !session.startTime) return 0;

                const dateStr = session.date;
                const timeStr = session.startTime;

                // Create a date object from the date string
                let dateObj = new Date(dateStr);

                // If that didn't work, try parsing different formats
                if (isNaN(dateObj.getTime())) {
                  // Try DD-MMM-YYYY format (e.g., "07-Nov-2025")
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                    const monthMap: {[key: string]: number} = {
                      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    };
                    const day = parseInt(parts[0]);
                    const month = monthMap[parts[1]] !== undefined ? monthMap[parts[1]] : parseInt(parts[1]) - 1;
                    const year = parseInt(parts[2]);
                    dateObj = new Date(year, month, day);
                  }
                }

                // Parse time (handles both "9:00 AM" and "09:00" formats)
                let hours = 0;
                let minutes = 0;

                if (timeStr.includes('AM') || timeStr.includes('PM')) {
                  // 12-hour format
                  const isPM = timeStr.includes('PM');
                  const timePart = timeStr.replace(/\s*(AM|PM)/i, '');
                  const [h, m] = timePart.split(':').map(Number);
                  hours = h === 12 ? (isPM ? 12 : 0) : (isPM ? h + 12 : h);
                  minutes = m || 0;
                } else {
                  // 24-hour format
                  const [h, m] = timeStr.split(':').map(Number);
                  hours = h || 0;
                  minutes = m || 0;
                }

                dateObj.setHours(hours, minutes, 0, 0);
                return dateObj.getTime();
              };

              const timeA = getTime(a);
              const timeB = getTime(b);

              // Descending order (latest first)
              return timeB - timeA;
            } catch (error) {
              console.error('Error sorting recordings:', error, a, b);
              return 0;
            }
          });
        });
      });
    });

    return structure;
  }, [filteredRecordings]);

  const clearFilters = () => {
    const tab = searchParams.get('tab');
    navigate(tab ? `/sessions?tab=${tab}` : '/sessions');
    setFilters({
      term: 'all',
      domain: 'all',
      subject: 'all',
      sessionName: ''
    });
  };

  // Navigate with URL updates
  const handleNavigate = (level: 'term' | 'domain' | 'subject') => {
    const tab = searchParams.get('tab') || 'recordings';
    if (level === 'term') {
      navigate(`/sessions?tab=${tab}`);
    } else if (level === 'domain' && filters.term !== 'all') {
      navigate(`/sessions/${encodeURIComponent(filters.term)}?tab=${tab}`);
    } else if (level === 'subject' && filters.term !== 'all' && filters.domain !== 'all') {
      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}?tab=${tab}`);
    }
  };

  const hasActiveFilters = filters.term !== 'all' || filters.domain !== 'all' ||
    filters.subject !== 'all' || filters.sessionName !== '';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectViews = (viewIds: string[]) => {
    if (!selectedSession) return;

    const viewLinks = viewIds.map(id => {
      switch (id) {
        case 'speaker': return selectedSession.speakerViewLink;
        case 'screenShare': return selectedSession.screenShareLink;
        case 'activeSpeaker': return selectedSession.activeSpeakerLink;
        case 'gallery': return selectedSession.galleryViewLink;
        default: return null;
      }
    }).filter(Boolean) as string[];

    // Open video player in new tab with selected views
    const viewParams = encodeURIComponent(JSON.stringify({
      sessionId: selectedSession.sessionId,
      sessionName: selectedSession.sessionName,
      term: selectedSession.term,
      domain: selectedSession.domain,
      subject: selectedSession.subject,
      views: viewLinks,
      // Include file fields
      file1: selectedSession.file1,
      file1Name: selectedSession.file1Name,
      file2: selectedSession.file2,
      file2Name: selectedSession.file2Name,
      file3: selectedSession.file3,
      file3Name: selectedSession.file3Name,
      file4: selectedSession.file4,
      file4Name: selectedSession.file4Name,
      file5: selectedSession.file5,
      file5Name: selectedSession.file5Name
    }));

    window.open(`/video-player?data=${viewParams}`, '_blank');
    setSelectedSession(null);
  };

  // Handle recording click - auto-play if only one video, else show modal
  const handleRecordingClick = (recording: Session) => {
    // Track recording opened
    const duration = typeof recording.duration === 'number'
      ? recording.duration
      : parseInt(String(recording.duration)) || 0;

    trackRecordingOpened(
      recording.sessionId || '',
      recording.sessionName || 'Unknown Recording',
      duration
    );

    // Get all available video links (using new field names)
    const availableVideos = [
      { id: 'speaker', label: 'Speaker View', link: recording.speakerViewLink },
      { id: 'gallery', label: 'Gallery View', link: recording.galleryViewLink },
      { id: 'screenShare', label: 'Screen Share', link: recording.screenShareLink },
      { id: 'activeSpeaker', label: 'Active Speaker', link: recording.activeSpeakerLink }
    ].filter(v => v.link);

    // If only one video available, play it directly
    if (availableVideos.length === 1) {
      const viewParams = encodeURIComponent(JSON.stringify({
        sessionId: recording.sessionId,
        sessionName: recording.sessionName,
        term: recording.term,
        domain: recording.domain,
        subject: recording.subject,
        views: [availableVideos[0].link],
        // Include file fields
        file1: recording.file1,
        file1Name: recording.file1Name,
        file2: recording.file2,
        file2Name: recording.file2Name,
        file3: recording.file3,
        file3Name: recording.file3Name,
        file4: recording.file4,
        file4Name: recording.file4Name,
        file5: recording.file5,
        file5Name: recording.file5Name
      }));

      window.open(`/video-player?data=${viewParams}`, '_blank');
    } else {
      // Multiple videos available, show selection modal
      setSelectedSession(recording);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recordings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Recordings</h1>
          <p className="text-sm text-muted-foreground">Browse and watch session recordings</p>
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
      {recordings.length > 0 && (filters.term !== 'all' || filters.domain !== 'all' || filters.subject !== 'all') && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleNavigate('term')}
            className="text-foreground/70 hover:text-foreground font-medium transition-colors"
          >
            All Recordings
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
      {recordings.length > 0 && (
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Term Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Term</label>
                <select
                  value={filters.term}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    const tab = searchParams.get('tab') || 'recordings';
                    console.log('RecordingsPage - Term changed to:', newTerm, 'tab:', tab);
                    if (newTerm === 'all') {
                      const url = `/sessions?tab=${tab}`;
                      console.log('RecordingsPage - Navigating to:', url);
                      navigate(url);
                    } else {
                      const url = `/sessions/${encodeURIComponent(newTerm)}?tab=${tab}`;
                      console.log('RecordingsPage - Navigating to:', url);
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
                    const tab = searchParams.get('tab') || 'recordings';
                    if (filters.term === 'all') return;
                    if (newDomain === 'all') {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}?tab=${tab}`);
                    } else {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(newDomain)}?tab=${tab}`);
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
                    const tab = searchParams.get('tab') || 'recordings';
                    if (filters.term === 'all' || filters.domain === 'all') return;
                    if (newSubject === 'all') {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}?tab=${tab}`);
                    } else {
                      navigate(`/sessions/${encodeURIComponent(filters.term)}/${encodeURIComponent(filters.domain)}/${encodeURIComponent(newSubject)}?tab=${tab}`);
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={filters.sessionName}
                    onChange={(e) => setFilters({ ...filters, sessionName: e.target.value })}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Structure */}
      {recordings.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Video className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No recordings available</h3>
            <p className="text-sm text-muted-foreground">There are no recordings to display at this time</p>
          </div>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Video className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No recordings match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters to see more recordings</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-sm font-medium transition-all"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        // Folder Structure View
        <div className="space-y-4">
          {Object.entries(folderStructure).map(([term, domains]) => {
            const termPath = term;
            const isTermExpanded = expandedFolders.has(termPath);

            return (
              <div key={termPath} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30">
                {/* Term Header */}
                <button
                  onClick={() => toggleFolder(termPath)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {isTermExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-foreground flex-1 text-left">{term}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {Object.values(domains).reduce((acc, subjects) =>
                      acc + Object.values(subjects).reduce((acc2, recordings) => acc2 + recordings.length, 0), 0
                    )}
                  </span>
                </button>

                {/* Domains */}
                {isTermExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {Object.entries(domains).map(([domain, subjects]) => {
                      const domainPath = `${termPath}/${domain}`;
                      const isDomainExpanded = expandedFolders.has(domainPath);

                      return (
                        <div key={domainPath} className="ml-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                          {/* Domain Header */}
                          <button
                            onClick={() => toggleFolder(domainPath)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
                          >
                            {isDomainExpanded ? (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Folder className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-foreground flex-1 text-left">{domain}</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                              {Object.values(subjects).reduce((acc, recordings) => acc + recordings.length, 0)}
                            </span>
                          </button>

                          {/* Subjects */}
                          {isDomainExpanded && (
                            <div className="px-3 pb-3 space-y-2">
                              {Object.entries(subjects).map(([subject, subjectRecordings]) => {
                                const subjectPath = `${domainPath}/${subject}`;
                                const isSubjectExpanded = expandedFolders.has(subjectPath);

                                return (
                                  <div key={subjectPath} className="ml-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-900/30">
                                    {/* Subject Header */}
                                    <button
                                      onClick={() => toggleFolder(subjectPath)}
                                      className="w-full p-3 flex items-center gap-3 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
                                    >
                                      {isSubjectExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-primary" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                      )}
                                      <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      <span className="text-sm font-medium text-foreground flex-1 text-left">{subject}</span>
                                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                        {subjectRecordings.length}
                                      </span>
                                    </button>

                                    {/* Recordings */}
                                    {isSubjectExpanded && (
                                      <div className="px-3 pb-3 space-y-2">
                                        {subjectRecordings.map((recording: Session, index: number) => (
                                          <RecordingCard
                                            key={`${subjectPath}-${recording.sessionId}-${index}`}
                                            session={recording}
                                            onClick={() => handleRecordingClick(recording)}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Selection Modal */}
      {selectedSession && (
        <ViewSelectionModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSelectView={handleSelectViews}
        />
      )}
    </div>
  );
}

export default RecordingsPage;
