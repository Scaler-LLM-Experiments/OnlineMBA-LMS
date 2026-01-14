import React, { useState, useEffect } from 'react';
import { Edit, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

interface ZoomLiveSession {
  rowIndex: number;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  sessionName: string;
  date: string;
  startTime: string;
  duration: string;
  zoomLiveLink: string;
  meetingId: string;
  meetingPassword: string;
  fullSynced: string;
  galleryView: string;
  speakerView: string;
  screenShareSpeaker: string;
  screenShareOnly: string;
}

export function ZoomLiveDataTable() {
  const { student } = useAuth();
  const [sessions, setSessions] = useState<ZoomLiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<ZoomLiveSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=getAllZoomLiveSessionsAdmin&studentEmail=${student.email}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setSessions(result.data.sessions || []);
      } else {
        toast.error(result.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session: ZoomLiveSession) => {
    setEditingRow(session.rowIndex);
    setEditData({ ...session });
  };

  const handleSave = async () => {
    if (!editData || !student?.email) return;

    try {
      toast.loading('Updating session...', { id: 'update-session' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=updateZoomSheetRow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentEmail: student.email,
            sheetName: 'Zoom Live',
            rowIndex: editData.rowIndex,
            rowData: editData
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Session updated successfully', { id: 'update-session' });
        setEditingRow(null);
        setEditData(null);
        fetchSessions();
      } else {
        toast.error(result.error || 'Failed to update session', { id: 'update-session' });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session', { id: 'update-session' });
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    if (!student?.email) return;

    try {
      toast.loading('Deleting session...', { id: 'delete-session' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=deleteZoomSheetRow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentEmail: student.email,
            sheetName: 'Zoom Live',
            rowIndex: rowIndex
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Session deleted successfully', { id: 'delete-session' });
        fetchSessions();
      } else {
        toast.error(result.error || 'Failed to delete session', { id: 'delete-session' });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session', { id: 'delete-session' });
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sessions found</p>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          Zoom Live Sessions ({sessions.length} sessions)
        </h3>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent/50 border-b border-border/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Session Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Meeting ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Synced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sessions.map((session) => (
              <tr key={session.rowIndex} className="hover:bg-accent/20 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingRow === session.rowIndex ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:bg-green-600/10 rounded transition-colors"
                        title="Save"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:bg-red-600/10 rounded transition-colors"
                        title="Cancel"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-1 text-blue-600 hover:bg-blue-600/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.rowIndex)}
                        className="p-1 text-red-600 hover:bg-red-600/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.batch || ''}
                      onChange={(e) => setEditData({ ...editData!, batch: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.batch}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.term || ''}
                      onChange={(e) => setEditData({ ...editData!, term: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.term}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.domain || ''}
                      onChange={(e) => setEditData({ ...editData!, domain: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.domain}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.subject || ''}
                      onChange={(e) => setEditData({ ...editData!, subject: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.subject}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.sessionName || ''}
                      onChange={(e) => setEditData({ ...editData!, sessionName: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.sessionName}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{session.date}</td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.startTime || ''}
                      onChange={(e) => setEditData({ ...editData!, startTime: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.startTime}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === session.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.duration || ''}
                      onChange={(e) => setEditData({ ...editData!, duration: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{session.duration}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{session.meetingId}</td>
                <td className="px-4 py-3 text-sm text-foreground">{session.fullSynced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
