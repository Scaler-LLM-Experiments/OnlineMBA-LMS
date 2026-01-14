import React, { useState, useEffect } from 'react';
import { Video, RefreshCw, PlayCircle, Download, BarChart } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

interface ZoomStats {
  createSheet: {
    totalSessions: number;
    pendingSync: number;
  };
  liveSheet: {
    totalSessions: number;
    liveSessions: number;
    upcomingSessions: number;
  };
  recordingSheet: {
    totalRecordings: number;
  };
  lastUpdated: string;
}

export function ZoomManagementCard() {
  const { student } = useAuth();
  const [stats, setStats] = useState<ZoomStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingRecordings, setSyncingRecordings] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=getZoomSyncStatus&studentEmail=${student.email}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        toast.error(result.error || 'Failed to load Zoom stats');
      }
    } catch (error) {
      console.error('Error fetching Zoom stats:', error);
      toast.error('Failed to load Zoom stats');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomSync = async () => {
    if (!student?.email) return;

    try {
      setSyncing(true);
      toast.loading('Syncing Zoom sessions...', { id: 'zoom-sync' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=triggerZoomSync&studentEmail=${student.email}`
      );
      const result = await response.json();

      if (result.success) {
        toast.success('Zoom sync completed successfully', { id: 'zoom-sync' });
        fetchStats(); // Refresh stats
      } else {
        toast.error(result.error || 'Zoom sync failed', { id: 'zoom-sync' });
      }
    } catch (error) {
      console.error('Error syncing Zoom:', error);
      toast.error('Failed to sync Zoom sessions', { id: 'zoom-sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRecordingSync = async () => {
    if (!student?.email) return;

    try {
      setSyncingRecordings(true);
      toast.loading('Syncing Zoom recordings...', { id: 'recording-sync' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=triggerRecordingSync&studentEmail=${student.email}`
      );
      const result = await response.json();

      if (result.success) {
        toast.success('Recording sync completed successfully', { id: 'recording-sync' });
        fetchStats(); // Refresh stats
      } else {
        toast.error(result.error || 'Recording sync failed', { id: 'recording-sync' });
      }
    } catch (error) {
      console.error('Error syncing recordings:', error);
      toast.error('Failed to sync recordings', { id: 'recording-sync' });
    } finally {
      setSyncingRecordings(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Zoom Management</h2>
            <p className="text-sm text-muted-foreground">Manage sessions and recordings</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-muted-foreground">Live Sessions</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.liveSheet.liveSessions}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.liveSheet.upcomingSessions} upcoming
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-muted-foreground">Recordings</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.recordingSheet.totalRecordings}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Total recordings
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-muted-foreground">Pending Sync</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.createSheet.pendingSync}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.createSheet.totalSessions} total sessions
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-muted-foreground">Total Live</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.liveSheet.totalSessions}</div>
            <div className="text-xs text-muted-foreground mt-1">
              All sessions
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleZoomSync}
          disabled={syncing || !student?.isAdmin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayCircle className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Create → Live...' : 'Sync Create → Live'}
        </button>

        <button
          onClick={handleRecordingSync}
          disabled={syncingRecordings || !student?.isAdmin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className={`w-5 h-5 ${syncingRecordings ? 'animate-spin' : ''}`} />
          {syncingRecordings ? 'Syncing Recordings...' : 'Sync Zoom Recordings'}
        </button>
      </div>

      {/* Last Updated */}
      {stats && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
