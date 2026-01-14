import React, { useState, useEffect } from 'react';
import { Edit, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

interface ZoomRecording {
  rowIndex: number;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  sessionName: string;
  date: string;
  startTime: string;
  duration: string;
  meetingId: string;
  meetingPassword: string;
  manualDownload: string;
  speakerViewLink: string;
  galleryViewLink: string;
  screenShareLink: string;
  activeSpeakerLink: string;
  transcriptLink: string;
  audioLink: string;
  chatLink: string;
  publish: string;
}

export function ZoomRecordingDataTable() {
  const { student } = useAuth();
  const [recordings, setRecordings] = useState<ZoomRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<ZoomRecording | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=getAllZoomRecordingsAdmin&studentEmail=${student.email}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setRecordings(result.data.recordings || []);
      } else {
        toast.error(result.error || 'Failed to load recordings');
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recording: ZoomRecording) => {
    setEditingRow(recording.rowIndex);
    setEditData({ ...recording });
  };

  const handleSave = async () => {
    if (!editData || !student?.email) return;

    try {
      toast.loading('Updating recording...', { id: 'update-recording' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=updateZoomSheetRow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentEmail: student.email,
            sheetName: 'Zoom Recordings',
            rowIndex: editData.rowIndex,
            rowData: editData
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Recording updated successfully', { id: 'update-recording' });
        setEditingRow(null);
        setEditData(null);
        fetchRecordings();
      } else {
        toast.error(result.error || 'Failed to update recording', { id: 'update-recording' });
      }
    } catch (error) {
      console.error('Error updating recording:', error);
      toast.error('Failed to update recording', { id: 'update-recording' });
    }
  };

  const handleDelete = async (rowIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    if (!student?.email) return;

    try {
      toast.loading('Deleting recording...', { id: 'delete-recording' });

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}?action=deleteZoomSheetRow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentEmail: student.email,
            sheetName: 'Zoom Recordings',
            rowIndex: rowIndex
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Recording deleted successfully', { id: 'delete-recording' });
        fetchRecordings();
      } else {
        toast.error(result.error || 'Failed to delete recording', { id: 'delete-recording' });
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording', { id: 'delete-recording' });
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

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No recordings found</p>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          Zoom Recordings ({recordings.length} recordings)
        </h3>
        <button
          onClick={fetchRecordings}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-accent/50 z-10">Actions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Session Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Meeting ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Meeting Password</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Download</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Speaker View Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Gallery View Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Screen Share Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Speaker Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Transcript Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Chat Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Publish</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {recordings.map((recording) => (
              <tr key={recording.rowIndex} className="hover:bg-accent/20 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingRow === recording.rowIndex ? (
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
                        onClick={() => handleEdit(recording)}
                        className="p-1 text-blue-600 hover:bg-blue-600/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(recording.rowIndex)}
                        className="p-1 text-red-600 hover:bg-red-600/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.batch || ''}
                      onChange={(e) => setEditData({ ...editData!, batch: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.batch}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.term || ''}
                      onChange={(e) => setEditData({ ...editData!, term: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.term}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.domain || ''}
                      onChange={(e) => setEditData({ ...editData!, domain: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.domain}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.subject || ''}
                      onChange={(e) => setEditData({ ...editData!, subject: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.subject}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.sessionName || ''}
                      onChange={(e) => setEditData({ ...editData!, sessionName: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.sessionName}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{recording.date}</td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.startTime || ''}
                      onChange={(e) => setEditData({ ...editData!, startTime: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.startTime}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingRow === recording.rowIndex ? (
                    <input
                      type="text"
                      value={editData?.duration || ''}
                      onChange={(e) => setEditData({ ...editData!, duration: e.target.value })}
                      className="w-full px-2 py-1 bg-background border border-border rounded"
                    />
                  ) : (
                    <span className="text-sm text-foreground">{recording.duration}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{recording.meetingId}</td>
                <td className="px-4 py-3 text-sm text-foreground">{recording.meetingPassword}</td>
                <td className="px-4 py-3 text-sm text-foreground">{recording.manualDownload}</td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.speakerViewLink && (
                    <a href={recording.speakerViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.galleryViewLink && (
                    <a href={recording.galleryViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.screenShareLink && (
                    <a href={recording.screenShareLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.activeSpeakerLink && (
                    <a href={recording.activeSpeakerLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.transcriptLink && (
                    <a href={recording.transcriptLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.audioLink && (
                    <a href={recording.audioLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                  {recording.chatLink && (
                    <a href={recording.chatLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{recording.publish}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
